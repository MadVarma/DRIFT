'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function useSocket() {
  const { data: session } = useSession()
  const [connected, setConnected] = useState(false)
  const initialized = useRef(false)

  useEffect(() => {
    if (!session?.user.id || initialized.current) return
    initialized.current = true

    const userId = session.user.id

    socket = io(window.location.origin, {
      path: '/api/socketio',
      transports: ['websocket', 'polling'],
    })

    socket.on('connect', () => {
      setConnected(true)
      // Join the per-user room so match-created and other user-scoped
      // events emitted by the server are delivered to this client.
      socket?.emit('join-user-room', userId)
    })
    socket.on('disconnect', () => setConnected(false))

    return () => {
      socket?.disconnect()
      socket = null
      initialized.current = false
    }
  }, [session?.user.id])

  return { socket, connected }
}

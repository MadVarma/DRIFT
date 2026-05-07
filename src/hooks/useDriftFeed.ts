'use client'

import { useEffect } from 'react'
import { useSocket } from './useSocket'
import type { DriftPostWithDetails } from '@/types'

export function useDriftFeed(onNewPost: (post: DriftPostWithDetails) => void) {
  const { socket, connected } = useSocket()

  useEffect(() => {
    if (!socket) return

    socket.emit('join-feed')
    socket.on('new-drift-post', onNewPost)

    return () => {
      socket.emit('leave-feed')
      socket.off('new-drift-post', onNewPost)
    }
  }, [socket, onNewPost])

  return { connected }
}

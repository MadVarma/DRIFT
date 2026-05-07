'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useSocket } from './useSocket'
import type { MatchWithDetails } from '@/types'

async function fetchMatches(): Promise<MatchWithDetails[]> {
  const res = await fetch('/api/matches')
  if (!res.ok) throw new Error('Failed to load matches')
  const data = await res.json()
  return data.matches
}

export function useMatches() {
  const queryClient = useQueryClient()
  const { socket } = useSocket()

  const query = useQuery({
    queryKey: ['matches'],
    queryFn: fetchMatches,
    refetchInterval: 60_000,
  })

  useEffect(() => {
    if (!socket) return

    socket.on('match-created', (match: MatchWithDetails) => {
      queryClient.setQueryData<MatchWithDetails[]>(['matches'], (old = []) => {
        if (old.some((m) => m.id === match.id)) return old
        return [match, ...old]
      })
    })

    return () => {
      socket.off('match-created')
    }
  }, [socket, queryClient])

  return query
}

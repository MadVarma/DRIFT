import { apiFetch } from './client'
import type { MatchWithDetails, MessageWithSender } from '../types'

export async function getMatches(): Promise<{ matches: MatchWithDetails[] }> {
  return apiFetch('/api/matches')
}

export async function getMessages(
  matchId: string
): Promise<{ messages: MessageWithSender[] }> {
  return apiFetch(`/api/messages/${matchId}`)
}

export async function sendMessage(matchId: string, content: string) {
  return apiFetch(`/api/messages/${matchId}`, {
    method: 'POST',
    body: { content },
  })
}

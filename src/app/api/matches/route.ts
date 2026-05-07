import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date().toISOString()

  // Auto-expire matches
  await supabase
    .from('Match')
    .update({ isActive: false, updatedAt: now })
    .eq('isActive', true)
    .lt('expiresAt', now)
    .or(`userAId.eq.${session.user.id},userBId.eq.${session.user.id}`)

  // Fetch matches WITHOUT embedded messages (avoids huge payload)
  const { data: matches } = await supabase
    .from('Match')
    .select('*, userA:User!Match_userAId_fkey(id,name,avatar,city,gender,bio), userB:User!Match_userBId_fkey(id,name,avatar,city,gender,bio)')
    .eq('isActive', true)
    .gt('expiresAt', now)
    .or(`userAId.eq.${session.user.id},userBId.eq.${session.user.id}`)
    .order('createdAt', { ascending: false })

  const matchIds = (matches ?? []).map((m) => m.id)

  if (matchIds.length === 0) {
    return NextResponse.json({ matches: [] })
  }

  // Fetch last messages and unread counts in parallel
  const [lastMsgResult, unreadResult] = await Promise.all([
    // Get recent messages for all matches — deduplicate to last-per-match in JS
    supabase
      .from('Message')
      .select('*, sender:User(id,name,avatar)')
      .in('matchId', matchIds)
      .order('createdAt', { ascending: false })
      .limit(matchIds.length * 10),

    // Batch unread count query
    supabase
      .from('Message')
      .select('matchId')
      .in('matchId', matchIds)
      .neq('senderId', session.user.id)
      .eq('isRead', false),
  ])

  // Last message per match
  const lastMessageMap = new Map<string, unknown>()
  for (const msg of lastMsgResult.data ?? []) {
    if (!lastMessageMap.has(msg.matchId)) {
      lastMessageMap.set(msg.matchId, msg)
    }
  }

  // Unread counts
  const unreadCountMap = new Map<string, number>()
  for (const row of unreadResult.data ?? []) {
    unreadCountMap.set(row.matchId, (unreadCountMap.get(row.matchId) ?? 0) + 1)
  }

  const matchesWithMeta = (matches ?? []).map((match) => ({
    ...match,
    lastMessage: lastMessageMap.get(match.id) ?? null,
    unreadCount: unreadCountMap.get(match.id) ?? 0,
  }))

  return NextResponse.json({ matches: matchesWithMeta })
}

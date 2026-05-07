import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { emitNewMessage } from '@/lib/socket'
import { createId } from '@paralleldrive/cuid2'

const sendSchema = z.object({
  content: z.string().min(1).max(1000).trim(),
})

// Verify user belongs to match and match is active
async function authorizeMatch(matchId: string, userId: string) {
  const { data: match } = await supabase.from('Match').select('*').eq('id', matchId).single()
  if (!match) return null
  if (match.userAId !== userId && match.userBId !== userId) return null
  if (!match.isActive || new Date(match.expiresAt) < new Date()) return null
  return match
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const match = await authorizeMatch(matchId, session.user.id)
  if (!match) {
    return NextResponse.json({ error: 'Match not found or access denied' }, { status: 404 })
  }

  const { data: messages } = await supabase
    .from('Message')
    .select('*, sender:User(id,name,avatar)')
    .eq('matchId', matchId)
    .order('createdAt', { ascending: true })
    .limit(200)

  // Mark messages from other user as read
  await supabase
    .from('Message')
    .update({ isRead: true })
    .eq('matchId', matchId)
    .neq('senderId', session.user.id)
    .eq('isRead', false)

  return NextResponse.json({ messages: messages ?? [] })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const match = await authorizeMatch(matchId, session.user.id)
  if (!match) {
    return NextResponse.json({ error: 'Match not found, expired, or access denied' }, { status: 404 })
  }

  try {
    const body = await req.json()
    const parsed = sendSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid message content' }, { status: 400 })
    }

    const now = new Date().toISOString()

    const { data: message, error } = await supabase
      .from('Message')
      .insert({
        id: createId(),
        matchId,
        senderId: session.user.id,
        content: parsed.data.content,
        isRead: false,
        createdAt: now,
      })
      .select('*, sender:User(id,name,avatar)')
      .single()

    if (error) throw error

    // Emit via socket for real-time
    emitNewMessage(matchId, message)

    return NextResponse.json({ message }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/messages/:matchId]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

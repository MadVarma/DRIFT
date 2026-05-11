import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'

const ADMIN_COOKIE = 'drift_admin_session'
const ADMIN_TOKEN = process.env.ADMIN_SESSION_TOKEN ?? 'drift-admin-secret-2026'

async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(ADMIN_COOKIE)
  return cookie?.value === ADMIN_TOKEN
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: 'Missing user id' }, { status: 400 })
  }

  try {
    // Permanent deletion — cascade in dependency order to avoid FK violations
    // Messages: senderId reference
    await supabase.from('Message').delete().eq('senderId', id)
    // Remove messages in matches this user participates in
    const { data: userMatches } = await supabase
      .from('Match')
      .select('id')
      .or(`userAId.eq.${id},userBId.eq.${id}`)

    if (userMatches && userMatches.length > 0) {
      const matchIds = userMatches.map((m) => m.id)
      await supabase.from('Message').delete().in('matchId', matchIds)
      await supabase.from('Match').delete().in('id', matchIds)
    }

    await supabase.from('Interaction').delete().eq('userId', id)
    await supabase.from('DriftPost').delete().eq('userId', id)
    await supabase.from('UserPreferences').delete().eq('userId', id)
    await supabase.from('User').delete().eq('id', id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[ADMIN DELETE /api/admin/users/:id]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

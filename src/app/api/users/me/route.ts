import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { calculateAge } from '@/lib/utils'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: user } = await supabase
    .from('User')
    .select('*, UserPreferences(*)')
    .eq('id', session.user.id)
    .single()

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { password: _, ...safeUser } = user
  // Supabase returns 1-to-1 child tables as arrays from the parent side; normalise
  const rawPrefs = (safeUser as Record<string, unknown>).UserPreferences
  const preferences = Array.isArray(rawPrefs) ? (rawPrefs[0] ?? null) : (rawPrefs ?? null)
  const { UserPreferences: _up, ...userWithoutRaw } = safeUser as Record<string, unknown> & { UserPreferences?: unknown }

  return NextResponse.json({
    user: { ...userWithoutRaw, preferences, age: calculateAge(new Date(user.dateOfBirth)) },
  })
}

export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session?.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const id = session.user.id
    // Delete in dependency order to avoid FK violations
    await supabase.from('Message').delete().or(`senderId.eq.${id},receiverId.eq.${id}`)
    await supabase.from('Interaction').delete().eq('userId', id)
    await supabase.from('Match').delete().or(`user1Id.eq.${id},user2Id.eq.${id}`)
    await supabase.from('DriftPost').delete().eq('userId', id)
    await supabase.from('UserPreferences').delete().eq('userId', id)
    await supabase.from('User').delete().eq('id', id)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/users/me]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, bio, city, lat, lng, avatar } = body

    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() }
    if (name) updates.name = name
    if (bio !== undefined) updates.bio = bio
    if (city !== undefined) updates.city = city
    if (lat !== undefined) updates.lat = lat
    if (lng !== undefined) updates.lng = lng
    if (avatar !== undefined) updates.avatar = avatar

    const { data: updated, error } = await supabase
      .from('User')
      .update(updates)
      .eq('id', session.user.id)
      .select('id, name, email, bio, city, avatar, isOnboarded')
      .single()

    if (error) throw error
    return NextResponse.json({ user: updated })
  } catch (err) {
    console.error('[PATCH /api/users/me]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

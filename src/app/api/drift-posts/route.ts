import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { addHours } from 'date-fns'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { emitNewDriftPost } from '@/lib/socket'
import { DRIFT_POST_EXPIRY_HOURS } from '@/lib/utils'
import { createId } from '@paralleldrive/cuid2'

const createSchema = z.object({
  content: z.string().min(1).max(200).trim(),
  emoji: z.string().max(8).optional(),
  city: z.string().max(100).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  imageUrl: z.string().max(400_000).optional(), // base64 data-url (up to ~300 KB)
})

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: posts } = await supabase
    .from('DriftPost')
    .select('*, user:User(id,name,avatar,city,gender,bio), interactions:Interaction(*)')
    .eq('userId', session.user.id)
    .eq('isActive', true)
    .gt('expiresAt', new Date().toISOString())
    .order('createdAt', { ascending: false })
    .limit(20)

  return NextResponse.json({ posts: posts ?? [] })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { content, emoji, city, lat, lng, imageUrl } = parsed.data
    const now = new Date().toISOString()

    // Expire any previous active posts for this user
    await supabase
      .from('DriftPost')
      .update({ isActive: false, updatedAt: now })
      .eq('userId', session.user.id)
      .eq('isActive', true)

    const { data: post, error } = await supabase
      .from('DriftPost')
      .insert({
        id: createId(),
        userId: session.user.id,
        content,
        emoji: emoji ?? null,
        city: city ?? null,
        lat: lat ?? null,
        lng: lng ?? null,
        imageUrl: imageUrl ?? null,
        expiresAt: addHours(new Date(), DRIFT_POST_EXPIRY_HOURS).toISOString(),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .select('*, user:User(id,name,avatar,city,gender,bio), interactions:Interaction(*)')
      .single()

    if (error) throw error

    // Emit to connected clients
    emitNewDriftPost(post)

    return NextResponse.json({ post }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/drift-posts]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


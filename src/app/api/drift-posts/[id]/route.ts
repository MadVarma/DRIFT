import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

const editSchema = z.object({
  content: z.string().min(1).max(200).trim(),
  emoji: z.string().max(8).optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = editSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { data: post } = await supabase.from('DriftPost').select('*').eq('id', id).single()
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (post.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: updated } = await supabase
    .from('DriftPost')
    .update({ content: parsed.data.content, emoji: parsed.data.emoji ?? null, updatedAt: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  return NextResponse.json({ post: updated })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: post } = await supabase.from('DriftPost').select('*').eq('id', id).single()
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (post.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await supabase.from('DriftPost').update({ isActive: false, updatedAt: new Date().toISOString() }).eq('id', id)

  return NextResponse.json({ success: true })
}

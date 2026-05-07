import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

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

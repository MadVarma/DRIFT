import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: match } = await supabase
    .from('Match')
    .select('*, userA:User!Match_userAId_fkey(id,name,avatar,city,gender,bio), userB:User!Match_userBId_fkey(id,name,avatar,city,gender,bio)')
    .eq('id', id)
    .single()

  if (!match) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Ensure the requester is part of this match
  if (match.userAId !== session.user.id && match.userBId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!match.isActive || new Date(match.expiresAt) < new Date()) {
    return NextResponse.json({ error: 'This match has expired' }, { status: 410 })
  }

  return NextResponse.json({ match })
}

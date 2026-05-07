import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { addHours } from 'date-fns'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { calculateCompatibility } from '@/lib/matching'
import { emitMatchCreated } from '@/lib/socket'
import { MATCH_EXPIRY_HOURS } from '@/lib/utils'
import { createId } from '@paralleldrive/cuid2'

const schema = z.object({
  type: z.enum(['like', 'respond']),
  message: z.string().max(500).optional(),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const { data: post } = await supabase
      .from('DriftPost')
      .select('*, user:User(*, preferences:UserPreferences(*))')
      .eq('id', id)
      .eq('isActive', true)
      .single()

    if (!post) return NextResponse.json({ error: 'Post not found or expired' }, { status: 404 })
    if (post.userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot interact with your own post' }, { status: 400 })
    }

    // Check existing interaction
    const { data: existing } = await supabase
      .from('Interaction')
      .select('id')
      .eq('userId', session.user.id)
      .eq('driftPostId', id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Already interacted' }, { status: 409 })
    }

    const now = new Date().toISOString()
    await supabase.from('Interaction').insert({
      id: createId(),
      userId: session.user.id,
      driftPostId: id,
      type: parsed.data.type,
      message: parsed.data.message ?? null,
      createdAt: now,
    })

    // Check if the post owner has also interacted with any of the current user's posts
    const { data: currentUserPost } = await supabase
      .from('DriftPost')
      .select('*')
      .eq('userId', session.user.id)
      .eq('isActive', true)
      .gt('expiresAt', now)
      .order('createdAt', { ascending: false })
      .limit(1)
      .single()

    let matchCreated = false
    let match = null

    if (currentUserPost) {
      const { data: reverseInteraction } = await supabase
        .from('Interaction')
        .select('id')
        .eq('userId', post.userId)
        .eq('driftPostId', currentUserPost.id)
        .single()

      if (reverseInteraction) {
        const { data: currentUserPrefs } = await supabase
          .from('UserPreferences')
          .select('*')
          .eq('userId', session.user.id)
          .single()

        const otherUserPrefs = post.user?.preferences?.[0] ?? post.user?.preferences

        if (currentUserPrefs && otherUserPrefs) {
          const compat = calculateCompatibility(
            { likes: currentUserPrefs.likes, dislikes: currentUserPrefs.dislikes,
              hobbies: currentUserPrefs.hobbies, interests: currentUserPrefs.interests },
            { likes: otherUserPrefs.likes, dislikes: otherUserPrefs.dislikes,
              hobbies: otherUserPrefs.hobbies, interests: otherUserPrefs.interests }
          )

          if (compat.isEligible) {
            const [userAId, userBId] = [session.user.id, post.userId].sort()

            const { data: existingMatch } = await supabase
              .from('Match')
              .select('id')
              .eq('userAId', userAId)
              .eq('userBId', userBId)
              .single()

            if (!existingMatch) {
              const matchNow = new Date().toISOString()
              const { data: newMatch } = await supabase
                .from('Match')
                .insert({
                  id: createId(),
                  userAId,
                  userBId,
                  score: compat.score,
                  commonLikes: compat.commonLikes,
                  commonDislikes: compat.commonDislikes,
                  commonHobbies: compat.commonHobbies,
                  expiresAt: addHours(new Date(), MATCH_EXPIRY_HOURS).toISOString(),
                  isActive: true,
                  createdAt: matchNow,
                  updatedAt: matchNow,
                })
                .select('*, userA:User!Match_userAId_fkey(id,name,avatar,city,gender,bio), userB:User!Match_userBId_fkey(id,name,avatar,city,gender,bio)')
                .single()

              if (newMatch) {
                match = newMatch
                matchCreated = true
                emitMatchCreated(session.user.id, match)
                emitMatchCreated(post.userId, match)
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, matchCreated, match }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/drift-posts/:id/interact]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

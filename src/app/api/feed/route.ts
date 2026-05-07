import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { differenceInMinutes } from 'date-fns'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { calculateCompatibility, calculateDistance, computeFeedScore } from '@/lib/matching'
import type { DriftPostWithDetails } from '@/types'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: currentUser } = await supabase
      .from('User')
      .select('*, preferences:UserPreferences(*)')
      .eq('id', session.user.id)
      .single()

    const prefs = Array.isArray(currentUser?.preferences)
      ? currentUser.preferences[0]
      : currentUser?.preferences

    if (!prefs) {
      return NextResponse.json({ posts: [] })
    }

    const now = new Date()

    const { data: posts } = await supabase
      .from('DriftPost')
      .select('*, user:User(id,name,avatar,city,gender,bio,isOnboarded,isActive), interactions:Interaction(*)')
      .eq('isActive', true)
      .gt('expiresAt', now.toISOString())
      .neq('userId', session.user.id)
      .order('createdAt', { ascending: false })
      .limit(100)

    if (!posts?.length) return NextResponse.json({ posts: [] })

    const authorIds = [...new Set(posts.map((p) => p.userId))]

    const [{ data: authorPrefsData }, { data: authorsData }] = await Promise.all([
      supabase.from('UserPreferences').select('*').in('userId', authorIds),
      supabase.from('User').select('id, lat, lng').in('id', authorIds),
    ])

    const prefsMap = new Map((authorPrefsData ?? []).map((p: { userId: string }) => [p.userId, p]))
    const authorLocMap = new Map((authorsData ?? []).map((a: { id: string; lat: number | null; lng: number | null }) => [a.id, a]))

    const scoredPosts: (DriftPostWithDetails & { feedScore: number })[] = posts
      .filter((post) => {
        const u = post.user as { isOnboarded?: boolean; isActive?: boolean } | null
        return u?.isOnboarded && u?.isActive
      })
      .map((post) => {
        const authorPref = prefsMap.get(post.userId)
        if (!authorPref) return null

        const compat = calculateCompatibility(
          { likes: prefs.likes, dislikes: prefs.dislikes, hobbies: prefs.hobbies, interests: prefs.interests },
          { likes: (authorPref as unknown as { likes: string[] }).likes, dislikes: (authorPref as unknown as { dislikes: string[] }).dislikes, hobbies: (authorPref as unknown as { hobbies: string[] }).hobbies, interests: (authorPref as unknown as { interests: string[] }).interests }
        )

        if (!compat.isEligible) return null

        const authorLoc = authorLocMap.get(post.userId) as { lat: number | null; lng: number | null } | undefined
        let distanceKm: number | undefined
        if (currentUser?.lat && currentUser?.lng && authorLoc?.lat && authorLoc?.lng) {
          distanceKm = calculateDistance(currentUser.lat, currentUser.lng, authorLoc.lat, authorLoc.lng)
        }

        const minutesAgo = differenceInMinutes(now, new Date(post.createdAt))
        const feedScore = computeFeedScore({
          compatibilityScore: compat.score,
          postedMinutesAgo: minutesAgo,
          distanceKm: distanceKm ?? null,
        })

        return {
          ...post,
          compatibilityScore: compat.score,
          commonLikes: compat.commonLikes,
          commonDislikes: compat.commonDislikes,
          commonHobbies: compat.commonHobbies,
          distanceKm,
          feedScore,
          hasInteracted: (post.interactions as { userId: string }[]).some((i) => i.userId === session.user.id),
        }
      })
      .filter(Boolean) as (DriftPostWithDetails & { feedScore: number })[]

    scoredPosts.sort((a, b) => b.feedScore - a.feedScore)

    return NextResponse.json({ posts: scoredPosts.slice(0, 50) })
  } catch (err) {
    console.error('[GET /api/feed]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

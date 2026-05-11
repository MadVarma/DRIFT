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

export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch all users (excluding passwords)
  const { data: users, error: usersError } = await supabase
    .from('User')
    .select('id, email, name, gender, city, bio, avatar, isOnboarded, isActive, createdAt, lastSeen')
    .order('createdAt', { ascending: false })

  if (usersError) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }

  // Fetch all drift posts (active + inactive)
  const { data: posts, error: postsError } = await supabase
    .from('DriftPost')
    .select('id, userId, content, emoji, city, isActive, expiresAt, createdAt')
    .order('createdAt', { ascending: false })

  if (postsError) {
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }

  // Group posts by userId
  const postsByUser: Record<string, typeof posts> = {}
  for (const post of posts ?? []) {
    if (!postsByUser[post.userId]) postsByUser[post.userId] = []
    postsByUser[post.userId].push(post)
  }

  const enriched = (users ?? []).map((u) => ({
    ...u,
    drifts: postsByUser[u.id] ?? [],
  }))

  return NextResponse.json({ users: enriched })
}

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const ADMIN_EMAIL = 'varma.kaizoku.13@gmail.com'
const ADMIN_PASSWORD = 'password123'
const ADMIN_COOKIE = 'drift_admin_session'
const ADMIN_TOKEN = process.env.ADMIN_SESSION_TOKEN ?? 'drift-admin-secret-2026'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      email.trim().toLowerCase() !== ADMIN_EMAIL ||
      password !== ADMIN_PASSWORD
    ) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const cookieStore = await cookies()
    cookieStore.set(ADMIN_COOKIE, ADMIN_TOKEN, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_COOKIE)
  return NextResponse.json({ ok: true })
}

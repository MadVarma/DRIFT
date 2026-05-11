import { NextResponse } from 'next/server'
import { withAuth } from 'next-auth/middleware'

const ADMIN_COOKIE = 'drift_admin_session'
const ADMIN_TOKEN = process.env.ADMIN_SESSION_TOKEN ?? 'drift-admin-secret-2026'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // ── Admin routes ────────────────────────────────────────────────────────
    if (pathname.startsWith('/admin')) {
      // Login page is always accessible
      if (pathname.startsWith('/admin/login')) return NextResponse.next()
      // Admin API routes checked server-side; let them pass here
      if (pathname.startsWith('/api/admin')) return NextResponse.next()
      // All other /admin/* pages require the admin session cookie
      const adminCookie = req.cookies.get(ADMIN_COOKIE)
      if (!adminCookie || adminCookie.value !== ADMIN_TOKEN) {
        return NextResponse.redirect(new URL('/admin/login', req.url))
      }
      return NextResponse.next()
    }

    // ── Normal app routes ───────────────────────────────────────────────────
    // Redirect authenticated users away from auth pages
    if (token && (pathname === '/login' || pathname === '/register')) {
      return NextResponse.redirect(new URL('/feed', req.url))
    }

    // If authenticated but not onboarded, redirect to onboarding
    // (allow /onboarding itself, /api/*, and /api/auth/*)
    if (
      token &&
      !token.isOnboarded &&
      !pathname.startsWith('/onboarding') &&
      !pathname.startsWith('/api/')
    ) {
      return NextResponse.redirect(new URL('/onboarding', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const { pathname } = req.nextUrl
        // Admin routes bypass NextAuth entirely
        if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
          return true
        }
        // Public routes
        if (
          pathname === '/' ||
          pathname.startsWith('/login') ||
          pathname.startsWith('/register') ||
          pathname.startsWith('/api/auth') ||
          pathname.startsWith('/_next') ||
          pathname.startsWith('/favicon')
        ) {
          return true
        }
        // Everything else requires auth
        return !!token
      },
    },
  }
)

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}

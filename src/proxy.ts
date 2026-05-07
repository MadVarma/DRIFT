import { NextResponse } from 'next/server'
import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

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

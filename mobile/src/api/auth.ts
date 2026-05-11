import { API_BASE_URL, saveSessionToken, clearSessionToken, apiFetch } from './client'

export interface LoginResult {
  id: string
  name: string
  email: string
  isOnboarded: boolean
}

/**
 * Sign in using NextAuth credentials provider.
 * Extracts the session cookie and stores it in SecureStore.
 */
export async function signIn(email: string, password: string): Promise<LoginResult> {
  // Step 1: Get CSRF token
  const csrfRes = await fetch(`${API_BASE_URL}/api/auth/csrf`)
  const csrfData = await csrfRes.json() as { csrfToken: string }
  const csrfToken = csrfData.csrfToken

  // Step 2: POST credentials
  const loginRes = await fetch(`${API_BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      email,
      password,
      csrfToken,
      callbackUrl: `${API_BASE_URL}/feed`,
      json: 'true',
    }).toString(),
    redirect: 'manual',
  })

  // Extract session token from Set-Cookie header
  const setCookie = loginRes.headers.get('set-cookie') ?? ''
  const match = setCookie.match(/next-auth\.session-token=([^;]+)/)
  if (!match) {
    throw new Error('Incorrect email or password')
  }

  const sessionToken = match[1]
  await saveSessionToken(sessionToken)

  // Step 3: Fetch user info
  const session = await apiFetch<{ user: LoginResult }>('/api/auth/session')
  if (!session?.user?.id) {
    throw new Error('Login failed')
  }

  return session.user
}

export async function signOut(): Promise<void> {
  await clearSessionToken()
}

export async function registerUser(data: {
  email: string
  password: string
  name: string
}): Promise<void> {
  await apiFetch('/api/auth/register', { method: 'POST', body: data })
}

export async function getMe() {
  return apiFetch<{
    id: string
    name: string
    email: string
    avatar: string | null
    bio: string | null
    city: string | null
    isOnboarded: boolean
    preferences: {
      likes: string[]
      dislikes: string[]
      hobbies: string[]
      interests: string[]
    } | null
  }>('/api/users/me')
}

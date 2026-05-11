/**
 * Drift Mobile — API client
 * Points at the deployed Next.js backend (Vercel).
 * Set EXPO_PUBLIC_API_URL in your .env or override for local dev.
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://drift-app.vercel.app'

/**
 * Thin fetch wrapper that attaches the session cookie on every request.
 * The session token is stored in SecureStore after login.
 */
import * as SecureStore from 'expo-secure-store'

const SESSION_COOKIE_KEY = 'drift_session_token'

export async function getSessionToken(): Promise<string | null> {
  return SecureStore.getItemAsync(SESSION_COOKIE_KEY)
}

export async function saveSessionToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(SESSION_COOKIE_KEY, token)
}

export async function clearSessionToken(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_COOKIE_KEY)
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const token = await getSessionToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers['Cookie'] = `next-auth.session-token=${token}`
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error?: string }).error ?? 'Request failed')
  }

  return res.json() as Promise<T>
}

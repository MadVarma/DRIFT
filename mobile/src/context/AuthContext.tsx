import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getMe, signIn as apiSignIn, signOut as apiSignOut, registerUser } from '../api/auth'
import { getSessionToken } from '../api/client'

interface AuthUser {
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
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const me = await getMe()
      setUser(me)
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    async function init() {
      const token = await getSessionToken()
      if (token) {
        await refreshUser()
      }
      setLoading(false)
    }
    void init()
  }, [refreshUser])

  const signIn = async (email: string, password: string) => {
    await apiSignIn(email, password)
    await refreshUser()
  }

  const signOut = async () => {
    await apiSignOut()
    setUser(null)
  }

  const register = async (email: string, password: string, name: string) => {
    await registerUser({ email, password, name })
    await apiSignIn(email, password)
    await refreshUser()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, register, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

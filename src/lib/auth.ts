import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const { data: user } = await supabase
          .from('User')
          .select('*')
          .eq('email', credentials.email.toLowerCase().trim())
          .single()

        if (!user) return null

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null

        // Update last seen
        await supabase
          .from('User')
          .update({ lastSeen: new Date().toISOString() })
          .eq('id', user.id)

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          // Do NOT return image/avatar here — base64 strings are 50-200 KB and
          // NextAuth maps this directly into the JWT cookie (4 KB browser limit),
          // causing a cookie overflow crash on every login.
          // Avatar is fetched live from DB via useQuery(['me']) instead.
          isOnboarded: user.isOnboarded,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.isOnboarded = (user as { isOnboarded: boolean }).isOnboarded
      }
      // On session update (e.g. after onboarding), refresh isOnboarded from DB.
      // NOTE: avatar is intentionally NOT stored in the JWT — base64 images are
      // too large for a JWT cookie (4 KB browser limit) and would crash the session.
      // Avatar is always fetched fresh via the ['me'] react-query key instead.
      if (trigger === 'update' && token.id) {
        const { data: dbUser } = await supabase
          .from('User')
          .select('isOnboarded')
          .eq('id', token.id as string)
          .single()
        if (dbUser) {
          token.isOnboarded = dbUser.isOnboarded
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.isOnboarded = token.isOnboarded as boolean
        // avatar is NOT stored in JWT — use useQuery(['me']) for live avatar data
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}

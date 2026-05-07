'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Zap, MessageSquare, Users, User, LogOut, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Avatar } from '@/components/ui/Avatar'
import { DriftLogo } from '@/components/DriftLogo'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/feed', label: 'Feed', icon: Zap },
  { href: '/matches', label: 'Matches', icon: Users },
  { href: '/profile', label: 'Profile', icon: User },
]

export function Navbar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)

  // Always-fresh avatar from DB (shared cache with profile page)
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await fetch('/api/users/me')
      if (!res.ok) throw new Error('Failed')
      return (await res.json()).user as { avatar?: string | null; name?: string }
    },
    enabled: !!session?.user?.id,
    staleTime: 60_000,
  })

  const avatarSrc = me?.avatar ?? session?.user?.image ?? null

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16"
      style={{ backdropFilter: 'blur(20px)', background: 'rgba(255,255,255,0.92)', borderBottom: '1px solid rgba(236,72,153,0.15)', boxShadow: '0 1px 20px rgba(236,72,153,0.06)' }}>
      <div className="max-w-5xl mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/feed" className="flex items-center" aria-label="DRIFT home">
          <DriftLogo height={34} />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                  active
                    ? 'text-pink-700'
                    : 'text-rose-900/50 hover:text-rose-900 hover:bg-rose-50'
                )}
                style={active ? { background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.2)' } : {}}
              >
                <Icon size={16} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-rose-50 transition-colors"
          >
            <Avatar
              src={avatarSrc}
              name={session?.user.name ?? 'U'}
              size="sm"
            />
            <ChevronDown
              size={14}
              className={cn(
                'text-muted-foreground transition-transform hidden sm:block',
                menuOpen && 'rotate-180'
              )}
            />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl shadow-xl z-20 overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(236,72,153,0.2)', backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(236,72,153,0.12)' }}>
                <div className="p-3" style={{ borderBottom: '1px solid rgba(236,72,153,0.15)' }}>
                  <p className="font-medium text-sm truncate">{session?.user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{session?.user.email}</p>
                </div>
                <div className="p-1.5">
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-rose-900/60 hover:text-rose-900 hover:bg-rose-50 transition-colors"
                  >
                    <User size={15} />
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      void signOut({ callbackUrl: '/' })
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut size={15} />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

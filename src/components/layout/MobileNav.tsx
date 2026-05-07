'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { Zap, Users, User } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/feed', label: 'Feed', icon: Zap },
  { href: '/matches', label: 'Matches', icon: Users },
  { href: '/profile', label: 'Profile', icon: User },
]

export function MobileNav() {
  const pathname = usePathname()
  const { data: session } = useSession()

  // Always-fresh avatar (same cache key as profile page)
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 sm:hidden safe-area-pb"
      style={{ backdropFilter: 'blur(20px)', background: 'rgba(255,255,255,0.95)', borderTop: '1px solid rgba(236,72,153,0.15)', boxShadow: '0 -1px 20px rgba(236,72,153,0.06)' }}>
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          const isProfile = href === '/profile'
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-5 py-2 rounded-xl transition-all',
                active ? 'text-pink-700' : 'text-rose-900/40 hover:text-rose-900'
              )}
            >
              {isProfile && avatarSrc ? (
                <div className={cn(
                  'rounded-full overflow-hidden flex-shrink-0 transition-all',
                  active ? 'ring-2 ring-pink-500 ring-offset-1' : 'ring-1 ring-rose-200',
                  'w-[22px] h-[22px]'
                )}>
                  <Avatar src={avatarSrc} name={session?.user?.name ?? 'U'} size="xs" className="w-full h-full" />
                </div>
              ) : (
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              )}
              <span className={cn('text-[10px] font-medium', active && 'text-pink-700')}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

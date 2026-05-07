'use client'

import Link from 'next/link'
import { Clock, MessageCircle, Zap } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { formatCountdown, formatTimeAgo, cn } from '@/lib/utils'
import type { MatchWithDetails } from '@/types'
import { useSession } from 'next-auth/react'

async function fetchMatches(): Promise<MatchWithDetails[]> {
  const res = await fetch('/api/matches')
  if (!res.ok) throw new Error('Failed to load matches')
  const data = await res.json()
  return data.matches
}

export default function MatchesList() {
  const { data: session } = useSession()

  const { data: matches, isPending, isError } = useQuery({
    queryKey: ['matches'],
    queryFn: fetchMatches,
    refetchInterval: 60_000,
  })

  if (isPending) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="drift-card p-4 animate-pulse">
            <div className="flex gap-3 items-center">
              <div className="w-12 h-12 rounded-full bg-white/5" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-white/5 rounded-full w-28" />
                <div className="h-3 bg-white/5 rounded-full w-40" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Failed to load matches</p>
      </div>
    )
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">💫</div>
        <h3 className="font-semibold mb-2">No matches yet</h3>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          Head to the feed and interact with drift posts from people you find compatible.
          When they interact back — it&apos;s a match.
        </p>
        <Link
          href="/feed"
          className="inline-flex mt-6 px-5 py-2.5 rounded-full bg-primary/15 text-violet-300 border border-primary/25 text-sm font-medium hover:bg-primary/25 transition-colors"
        >
          Go to Feed
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {matches.map((match) => {
        const otherUser = match.userAId === session?.user.id ? match.userB : match.userA
        const expiresIn = formatCountdown(match.expiresAt)
        const isExpiringSoon =
          new Date(match.expiresAt) < new Date(Date.now() + 2 * 60 * 60 * 1000)
        const unread = match.unreadCount ?? 0

        return (
          <Link key={match.id} href={`/chat/${match.id}`}>
            <div className={cn('drift-card p-4 flex items-center gap-3 cursor-pointer', isExpiringSoon && 'border-rose-500/20')}>
              <div className="relative">
                <Avatar src={otherUser.avatar} name={otherUser.name} size="lg" />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-semibold truncate">{otherUser.name}</span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Badge variant={isExpiringSoon ? 'danger' : 'time'}>
                      <Clock size={9} />
                      {expiresIn}
                    </Badge>
                  </div>
                </div>

                {/* Last message */}
                {match.lastMessage ? (
                  <p className="text-xs text-muted-foreground truncate">
                    {match.lastMessage.senderId === session?.user.id ? 'You: ' : ''}
                    {match.lastMessage.content}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Say something before time runs out!</p>
                )}

                {/* Compatibility */}
                <div className="flex items-center gap-1.5 mt-2">
                  <Badge variant="score">
                    <Zap size={9} />
                    {match.score} match
                  </Badge>
                  {match.commonLikes.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="like">
                      {tag}
                    </Badge>
                  ))}
                  {match.commonDislikes.slice(0, 1).map((tag) => (
                    <Badge key={tag} variant="dislike">
                      ✕ {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <MessageCircle
                size={16}
                className={cn('flex-shrink-0', unread > 0 ? 'text-violet-400' : 'text-muted-foreground')}
              />
            </div>
          </Link>
        )
      })}
    </div>
  )
}

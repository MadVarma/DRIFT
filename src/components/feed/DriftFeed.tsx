'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { RefreshCw, Wifi, WifiOff, Flame, MapPin, Clock, Camera } from 'lucide-react'
import Link from 'next/link'
import { DriftCard } from './DriftCard'
import { Button } from '@/components/ui/Button'
import { useDriftFeed } from '@/hooks/useDriftFeed'
import { cn } from '@/lib/utils'
import type { DriftPostWithDetails } from '@/types'

type FeedFilter = 'foryou' | 'nearby' | 'latest'

async function fetchFeed(): Promise<DriftPostWithDetails[]> {
  const res = await fetch('/api/feed')
  if (!res.ok) throw new Error('Failed to load feed')
  const data = await res.json()
  return data.posts
}

const FILTERS: { id: FeedFilter; label: string; icon: React.ReactNode }[] = [
  { id: 'foryou',  label: 'For You',  icon: <Flame  size={12} /> },
  { id: 'nearby',  label: 'Nearby',   icon: <MapPin size={12} /> },
  { id: 'latest',  label: 'Latest',   icon: <Clock  size={12} /> },
]

export default function DriftFeed() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<FeedFilter>('foryou')

  // Read avatar from DB so unlock is instant after profile photo upload
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await fetch('/api/users/me')
      if (!res.ok) throw new Error('Failed')
      return (await res.json()).user as { avatar?: string | null }
    },
    enabled: !!session?.user?.id,
    staleTime: 60_000,
  })

  const {
    data: posts,
    isPending,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['feed'],
    queryFn: fetchFeed,
    refetchInterval: 30_000, // poll every 30s as fallback
    staleTime: 15_000,
  })

  // Real-time via Socket.io — stable callback reference prevents socket re-register on every render
  const onNewPost = useCallback((newPost: DriftPostWithDetails) => {
    queryClient.setQueryData<DriftPostWithDetails[]>(['feed'], (old) => {
      if (!old) return [newPost]
      // Don't add own posts twice
      if (old.some((p) => p.id === newPost.id)) return old
      return [newPost, ...old]
    })
  }, [queryClient])

  const { connected } = useDriftFeed(onNewPost)

  const interactMutation = useMutation({
    mutationFn: async ({ postId, type }: { postId: string; type: 'like' | 'respond' }) => {
      const res = await fetch(`/api/drift-posts/${postId}/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Failed to interact')
      }
      return res.json()
    },
    onSuccess: (data) => {
      if (data.matchCreated) {
        toast.success('✦ It\'s a match! You have 24 hours. 🔥', { duration: 5000 })
      }
      void queryClient.invalidateQueries({ queryKey: ['feed'] })
      void queryClient.invalidateQueries({ queryKey: ['matches'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const hasPhoto = !!(me?.avatar ?? session?.user?.image)

  const filteredPosts = (posts ?? [])
    .filter((p) => p.userId !== session?.user.id)
    .filter((p) => {
      if (filter === 'nearby') return p.distanceKm !== undefined && p.distanceKm <= 50
      return true
    })
    .sort((a, b) => {
      if (filter === 'latest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (filter === 'foryou') return (b.compatibilityScore ?? 0) - (a.compatibilityScore ?? 0)
      return 0
    })

  if (isPending) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="drift-card p-4 animate-pulse">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-100 rounded-full w-32" />
                <div className="h-3 bg-gray-100 rounded-full w-48" />
                <div className="h-12 bg-gray-100 rounded-xl w-full mt-3" />
                <div className="flex gap-2 mt-2">
                  <div className="h-8 bg-gray-100 rounded-full w-20" />
                  <div className="h-8 bg-gray-100 rounded-full w-24" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <WifiOff className="mx-auto mb-3 text-muted-foreground" size={32} />
        <p className="text-muted-foreground mb-4">Couldn&apos;t load the feed</p>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* No photo gate */}
      {!hasPhoto && (
        <div className="drift-card p-4 flex items-center gap-4 border-rose-200 bg-rose-50/60">
          <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
            <Camera size={18} className="text-rose-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-rose-700">Add a profile photo first</p>
            <p className="text-xs text-rose-600/70 mt-0.5">You need a photo to like, respond, and post drifts.</p>
          </div>
          <Link
            href="/profile"
            className="text-xs font-bold text-rose-600 hover:text-rose-700 underline underline-offset-2 whitespace-nowrap flex-shrink-0"
          >
            Upload →
          </Link>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100/80 border border-gray-200/60">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all',
              filter === f.id
                ? 'bg-white shadow-sm text-rose-600 font-semibold'
                : 'text-muted-foreground hover:text-gray-700'
            )}
          >
            {f.icon}
            {f.label}
          </button>
        ))}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-0.5">
        <div className="flex items-center gap-1.5">
          {connected ? (
            <>
              <Wifi size={11} className="text-emerald-400" />
              <span className="text-emerald-400/80">Live</span>
            </>
          ) : (
            <>
              <WifiOff size={11} />
              <span>Polling</span>
            </>
          )}
          <span>· {filteredPosts.length} drift{filteredPosts.length !== 1 ? 's' : ''}</span>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1 hover:text-gray-700 transition-colors"
          disabled={isFetching}
        >
          <RefreshCw size={11} className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Posts */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">
            {filter === 'nearby' ? '📍' : filter === 'latest' ? '🕐' : '🌊'}
          </div>
          <h3 className="font-semibold mb-2">
            {filter === 'nearby' ? 'No one nearby yet' : filter === 'latest' ? 'Nothing new right now' : 'No drifts yet'}
          </h3>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            {filter === 'nearby'
              ? 'No drifts within 50 km. Try the For You tab to see everyone.'
              : filter === 'foryou'
              ? 'Complete your profile and add likes + dislikes to see compatible people here.'
              : 'Be the first to post a drift right now!'}
          </p>
          {filter !== 'foryou' && (
            <button
              onClick={() => setFilter('foryou')}
              className="mt-4 text-xs text-rose-500 font-semibold hover:underline"
            >
              Switch to For You →
            </button>
          )}
        </div>
      ) : (
        filteredPosts.map((post) => (
          <DriftCard
            key={post.id}
            post={post}
            currentUserId={session?.user.id ?? ''}
            onInteract={(type) => {
              if (!hasPhoto) {
                toast.error('Add a profile photo to interact')
                return
              }
              interactMutation.mutate({ postId: post.id, type })
            }}
            interacting={interactMutation.isPending}
            interactionLocked={!hasPhoto}
          />
        ))
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, MessageCircle, MapPin, Clock, Zap, Trash2 } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatTimeAgo, formatCountdown, formatDistance, calculateAge, cn } from '@/lib/utils'
import type { DriftPostWithDetails } from '@/types'

interface DriftCardProps {
  post: DriftPostWithDetails
  currentUserId: string
  onInteract: (type: 'like' | 'respond') => void
  onDelete?: (postId: string) => void
  interacting?: boolean
  interactionLocked?: boolean
  deleting?: boolean
}

export function DriftCard({ post, currentUserId, onInteract, onDelete, interacting, interactionLocked, deleting }: DriftCardProps) {
  const isOwnPost = post.userId === currentUserId
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isExpiringSoon = new Date(post.expiresAt) < new Date(Date.now() + 2 * 60 * 60 * 1000)
  const hasInteracted = post.interactions.some((i) => i.userId === currentUserId)
  const interactionType = post.interactions.find((i) => i.userId === currentUserId)?.type
  const likeCount = post.interactions.filter((i) => i.type === 'like').length

  return (
    <article className={cn('drift-card p-4 group', isOwnPost && 'border-rose-200/40 bg-rose-50/5')}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <Avatar
          src={post.user.avatar}
          name={post.user.name}
          size="md"
          online
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-sm truncate">{post.user.name}</span>
              {isOwnPost && (
                <span className="text-xs text-rose-400/80 font-medium">· Your drift</span>
              )}
              {!isOwnPost && post.user.gender && (
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {post.user.gender}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {post.compatibilityScore !== undefined && post.compatibilityScore > 0 && (
                <Badge variant="score">
                  <Zap size={9} />
                  {post.compatibilityScore}
                </Badge>
              )}
              {isExpiringSoon && (
                <Badge variant="danger">
                  <Clock size={9} />
                  {formatCountdown(post.expiresAt)}
                </Badge>
              )}
            </div>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
            <span>{formatTimeAgo(post.createdAt)}</span>
            {post.distanceKm !== undefined && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <MapPin size={9} />
                  {formatDistance(post.distanceKm)}
                </span>
              </>
            )}
            {post.user.city && !post.distanceKm && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <MapPin size={9} />
                  {post.user.city}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mt-3 pl-[52px]">
        <p className="text-sm leading-relaxed">
          {post.emoji && <span className="mr-1">{post.emoji}</span>}
          {post.content}
        </p>

        {/* Attached image */}
        {post.imageUrl && (
          <div className="mt-3 rounded-xl overflow-hidden border border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.imageUrl}
              alt="Post attachment"
              className="w-full h-auto object-contain"
              loading="lazy"
            />
          </div>
        )}

        {/* Compatibility highlights */}
        {(post.commonLikes?.length || post.commonDislikes?.length || post.commonHobbies?.length) ? (
          <div className="mt-3 p-3 rounded-xl bg-white/3 border border-white/6">
            <p className="text-xs text-muted-foreground mb-2 font-medium">You both</p>
            <div className="flex flex-wrap gap-1.5">
              {post.commonLikes?.slice(0, 3).map((tag) => (
                <Badge key={`like-${tag}`} variant="like">
                  ❤ {tag}
                </Badge>
              ))}
              {post.commonDislikes?.slice(0, 3).map((tag) => (
                <Badge key={`dislike-${tag}`} variant="dislike">
                  ✕ {tag}
                </Badge>
              ))}
              {post.commonHobbies?.slice(0, 2).map((tag) => (
                <Badge key={`hobby-${tag}`} variant="hobby">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3">
          {isOwnPost ? (
            // Own post — show delete controls
            confirmDelete ? (
              <>
                <span className="text-xs text-muted-foreground mr-1">Delete this drift?</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete?.(post.id)}
                  disabled={deleting}
                  className="gap-1.5 h-8 rounded-full text-xs border-red-400/60 text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={12} />
                  {deleting ? 'Deleting…' : 'Yes, delete'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                  className="h-8 rounded-full text-xs"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(true)}
                className="gap-1.5 h-8 rounded-full text-xs text-muted-foreground hover:text-red-500 hover:border-red-300"
              >
                <Trash2 size={12} />
                Delete
              </Button>
            )
          ) : (
            // Other's post — show like/respond
            <>
              <Button
                variant={interactionType === 'like' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => onInteract('like')}
                disabled={interacting || hasInteracted || interactionLocked}
                className={cn('gap-1.5 h-8 rounded-full text-xs', interactionType === 'like' && 'glow-primary')}
              >
                <Heart size={13} fill={interactionType === 'like' ? 'currentColor' : 'none'} />
                {likeCount > 0 ? likeCount : ''}
                {interactionType === 'like' ? 'Liked' : 'Like'}
              </Button>

              <Button
                variant={interactionType === 'respond' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => onInteract('respond')}
                disabled={interacting || hasInteracted || interactionLocked}
                className="gap-1.5 h-8 rounded-full text-xs"
              >
                <MessageCircle size={13} />
                Respond
              </Button>

              {hasInteracted && (
                <span className="text-xs text-muted-foreground ml-auto">
                  {interactionType === 'like' ? '✓ Liked' : '✓ Responded'}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  )
}

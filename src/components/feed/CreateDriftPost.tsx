'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Sparkles, Send, ChevronDown, ChevronUp, Camera, X, Image as ImageIcon } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { DRIFT_PROMPT_SUGGESTIONS } from '@/types'
import { cn } from '@/lib/utils'

function resizeImageToDataUrl(file: File, maxDim = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          if (width >= height) { height = Math.round((height * maxDim) / width); width = maxDim }
          else { width = Math.round((width * maxDim) / height); height = maxDim }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.src = e.target!.result as string
    }
    reader.readAsDataURL(file)
  })
}

export default function CreateDriftPost() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [content, setContent] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const maxLength = 280

  // Check avatar from DB (not just session token, which may lag after upload)
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
  const hasPhoto = !!(me?.avatar ?? session?.user?.image)

  const mutation = useMutation({
    mutationFn: async (data: { content: string; emoji?: string; imageUrl?: string }) => {
      const res = await fetch('/api/drift-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Failed to post')
      }
      return res.json()
    },
    onSuccess: () => {
      setContent('')
      setImageDataUrl(null)
      setShowSuggestions(false)
      toast.success('Drift posted! 🌊')
      void queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handlePost = () => {
    const trimmed = content.trim()
    if (!trimmed && !imageDataUrl) return
    const emojiMatch = trimmed.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/u)
    mutation.mutate({
      content: trimmed,
      emoji: emojiMatch?.[0],
      imageUrl: imageDataUrl ?? undefined,
    })
  }

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 8 * 1024 * 1024) { toast.error('Image too large (max 8 MB)'); return }
    setImageLoading(true)
    try {
      const dataUrl = await resizeImageToDataUrl(file)
      setImageDataUrl(dataUrl)
    } catch {
      toast.error('Could not load image')
    } finally {
      setImageLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSuggestion = (suggestion: string) => {
    setContent(suggestion)
    setShowSuggestions(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePost()
  }

  return (
    <div className="drift-card overflow-hidden">
      {/* Photo required banner */}
      {!hasPhoto && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border-b border-amber-200">
          <Camera size={15} className="text-amber-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-amber-700">Profile photo required</p>
            <p className="text-xs text-amber-600/80">Add a photo to your profile to post and interact.</p>
          </div>
          <Link
            href="/profile"
            className="text-xs font-bold text-amber-600 hover:text-amber-700 underline underline-offset-2 whitespace-nowrap flex-shrink-0"
          >
            Add photo →
          </Link>
        </div>
      )}

      <div className="p-4">
        <div className="flex gap-3">
          <Avatar src={me?.avatar ?? session?.user.image} name={session?.user.name ?? 'U'} size="md" />
          <div className="flex-1 min-w-0">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, maxLength))}
              onKeyDown={handleKeyDown}
              placeholder={hasPhoto ? "What are you drifting into right now?" : "Add a profile photo to start posting…"}
              disabled={!hasPhoto}
              className="w-full bg-transparent text-sm text-gray-900 placeholder:text-muted-foreground/40 resize-none outline-none min-h-[56px] leading-relaxed disabled:cursor-not-allowed"
              rows={2}
            />

            {/* Image preview */}
            {imageDataUrl && (
              <div className="relative mt-2 rounded-xl overflow-hidden border border-border/50 max-h-48">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageDataUrl} alt="Post image" className="w-full object-cover max-h-48" />
                <button
                  onClick={() => setImageDataUrl(null)}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  disabled={!hasPhoto}
                  className={cn(
                    'flex items-center gap-1.5 text-xs text-muted-foreground hover:text-violet-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed px-2 py-1 rounded-lg hover:bg-violet-50',
                    showSuggestions && 'text-violet-400 bg-violet-50'
                  )}
                >
                  <Sparkles size={12} />
                  Prompts
                  {showSuggestions ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!hasPhoto || imageLoading}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-rose-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed px-2 py-1 rounded-lg hover:bg-rose-50"
                >
                  <ImageIcon size={12} />
                  {imageLoading ? 'Loading…' : 'Photo'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImagePick}
                />

                {content.length > 200 && (
                  <span className={cn('text-xs ml-1', content.length >= maxLength ? 'text-destructive' : 'text-muted-foreground')}>
                    {maxLength - content.length}
                  </span>
                )}
              </div>

              <Button
                size="sm"
                onClick={handlePost}
                loading={mutation.isPending}
                disabled={!hasPhoto || (!content.trim() && !imageDataUrl)}
                className="gap-1.5 h-8 rounded-full text-xs"
              >
                <Send size={12} />
                Drift
              </Button>
            </div>
          </div>
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-2">Quick prompts</p>
            <div className="flex flex-wrap gap-1.5">
              {DRIFT_PROMPT_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestion(s)}
                  className="text-xs px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-gray-600 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

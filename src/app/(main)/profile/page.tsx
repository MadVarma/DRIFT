'use client'

import { useState, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { LogOut, Edit3, Save, X, MapPin, Ruler, Calendar, Camera, Upload } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { TagInput } from '@/components/ui/TagInput'
import { calculateAge, formatTimeAgo } from '@/lib/utils'
import { HOBBY_OPTIONS, INTEREST_OPTIONS, LIKE_OPTIONS, DISLIKE_OPTIONS } from '@/types'
import type { UserWithPreferences } from '@/types'

async function fetchMe(): Promise<UserWithPreferences & { age: number }> {
  const res = await fetch('/api/users/me')
  if (!res.ok) throw new Error('Failed to load profile')
  const data = await res.json()
  return data.user
}

function resizeImageToDataUrl(file: File, maxDim = 500): Promise<string> {
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
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = e.target!.result as string
    }
    reader.readAsDataURL(file)
  })
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState<{
    name: string; bio: string; city: string;
    likes: string[]; dislikes: string[]; hobbies: string[]; interests: string[];
  } | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: user, isPending } = useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
  })

  const startEdit = () => {
    if (!user) return
    setEditData({
      name: user.name,
      bio: user.bio ?? '',
      city: user.city ?? '',
      likes: user.preferences?.likes ?? [],
      dislikes: user.preferences?.dislikes ?? [],
      hobbies: user.preferences?.hobbies ?? [],
      interests: user.preferences?.interests ?? [],
    })
    setEditing(true)
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 8 * 1024 * 1024) { toast.error('Image too large (max 8 MB)'); return }
    setAvatarUploading(true)
    try {
      const dataUrl = await resizeImageToDataUrl(file)
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: dataUrl }),
      })
      if (!res.ok) throw new Error('Upload failed')
      // Invalidate ['me'] so Navbar, MobileNav, feed composer all pick up the new avatar instantly.
      // Do NOT call updateSession() — storing base64 in the JWT cookie overflows the 4 KB limit.
      void queryClient.invalidateQueries({ queryKey: ['me'] })
      toast.success('Profile photo updated! 📸')
    } catch {
      toast.error('Could not upload photo')
    } finally {
      setAvatarUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!editData) return
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editData.name, bio: editData.bio, city: editData.city }),
      })
      if (!res.ok) throw new Error('Failed to save')
      // Also update preferences
      const res2 = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editData.name,
          dateOfBirth: user?.dateOfBirth,
          gender: user?.gender,
          height: user?.height,
          ethnicity: user?.ethnicity,
          bio: editData.bio,
          city: editData.city,
          hobbies: editData.hobbies,
          interests: editData.interests,
          likes: editData.likes,
          dislikes: editData.dislikes,
        }),
      })
      if (!res2.ok) throw new Error('Failed to update preferences')
    },
    onSuccess: () => {
      toast.success('Profile updated!')
      setEditing(false)
      void queryClient.invalidateQueries({ queryKey: ['me'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  if (isPending) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="drift-card p-4 animate-pulse h-24" />
        ))}
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="space-y-4">
      {/* No photo prompt */}
      {!user.avatar && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="drift-card p-4 flex items-center gap-3 border-rose-200 bg-rose-50/60 cursor-pointer hover:bg-rose-50 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
            <Camera size={18} className="text-rose-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-rose-700">Add a profile photo</p>
            <p className="text-xs text-rose-600/70 mt-0.5">Required to post drifts and interact. Tap to upload.</p>
          </div>
          <Upload size={16} className="text-rose-400 flex-shrink-0" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Profile</h1>        <div className="flex items-center gap-2">
          {!editing && (
            <Button variant="outline" size="sm" onClick={startEdit} className="gap-1.5 h-8 text-xs">
              <Edit3 size={12} />
              Edit
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="gap-1.5 h-8 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
          >
            <LogOut size={12} />
            Sign out
          </Button>
        </div>
      </div>

      {/* Profile card */}
      <div className="drift-card p-5">
        <div className="flex items-start gap-4">
          {/* Avatar with upload overlay */}
          <div className="relative flex-shrink-0 group">
            <Avatar src={user.avatar} name={user.name} size="xl" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              title="Change photo"
            >
              {avatarUploading ? (
                <Upload size={16} className="text-white animate-bounce" />
              ) : (
                <Camera size={16} className="text-white" />
              )}
            </button>
            {!user.avatar && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center shadow-sm hover:bg-rose-600 transition-colors"
                title="Add photo"
              >
                <Camera size={10} className="text-white" />
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div className="flex-1 min-w-0">
            {editing && editData ? (
              <Input
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="mb-2 font-semibold"
              />
            ) : (
              <h2 className="font-bold text-lg">{user.name}</h2>
            )}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Calendar size={11} />
                {user.age} years old
              </span>
              <span>{user.gender}</span>
              {user.height && (
                <span className="flex items-center gap-1">
                  <Ruler size={11} />
                  {user.height} cm
                </span>
              )}
              {(editing ? editData?.city : user.city) && (
                <span className="flex items-center gap-1">
                  <MapPin size={11} />
                  {editing && editData ? editData.city : user.city}
                </span>
              )}
            </div>
            {editing && editData && (
              <Input
                placeholder="City"
                value={editData.city}
                onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                className="mt-2 text-xs h-8"
              />
            )}
          </div>
        </div>

        {/* Bio */}
        <div className="mt-4">
          {editing && editData ? (
            <Textarea
              label="Bio"
              value={editData.bio}
              onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
              placeholder="Tell people something about you..."
              maxLength={200}
            />
          ) : user.bio ? (
            <p className="text-sm text-muted-foreground leading-relaxed">{user.bio}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">No bio yet</p>
          )}
        </div>

        {/* Edit actions */}
        {editing && (
          <div className="flex gap-2 mt-4">
            <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending} size="sm" className="gap-1.5">
              <Save size={12} /> Save changes
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="gap-1.5">
              <X size={12} /> Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Preferences */}
      <div className="drift-card p-5 space-y-5">
        <h3 className="font-semibold text-sm">Your vibe</h3>

        {editing && editData ? (
          <div className="space-y-5">
            <TagInput label="Hobbies" value={editData.hobbies} onChange={(v) => setEditData({ ...editData, hobbies: v })} suggestions={HOBBY_OPTIONS} color="hobby" maxTags={15} />
            <TagInput label="Interests" value={editData.interests} onChange={(v) => setEditData({ ...editData, interests: v })} suggestions={INTEREST_OPTIONS} color="interest" maxTags={15} />
            <TagInput label="Things you love" value={editData.likes} onChange={(v) => setEditData({ ...editData, likes: v })} suggestions={LIKE_OPTIONS} color="like" maxTags={20} />
            <TagInput label="Things you hate" value={editData.dislikes} onChange={(v) => setEditData({ ...editData, dislikes: v })} suggestions={DISLIKE_OPTIONS} color="dislike" maxTags={20} />
          </div>
        ) : (
          <div className="space-y-4">
            {user.preferences?.hobbies?.length ? (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Hobbies</p>
                <div className="flex flex-wrap gap-1.5">
                  {user.preferences.hobbies.map((tag) => <Badge key={tag} variant="hobby">{tag}</Badge>)}
                </div>
              </div>
            ) : null}
            {user.preferences?.interests?.length ? (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Interests</p>
                <div className="flex flex-wrap gap-1.5">
                  {user.preferences.interests.map((tag) => <Badge key={tag} variant="interest">{tag}</Badge>)}
                </div>
              </div>
            ) : null}
            {user.preferences?.likes?.length ? (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Things I love</p>
                <div className="flex flex-wrap gap-1.5">
                  {user.preferences.likes.map((tag) => <Badge key={tag} variant="like">❤ {tag}</Badge>)}
                </div>
              </div>
            ) : null}
            {user.preferences?.dislikes?.length ? (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Things I hate</p>
                <div className="flex flex-wrap gap-1.5">
                  {user.preferences.dislikes.map((tag) => <Badge key={tag} variant="dislike">✕ {tag}</Badge>)}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="drift-card p-5">
        <h3 className="font-semibold text-sm mb-3">Account</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Email</span>
            <span className="text-gray-600">{session?.user.email}</span>
          </div>
          <div className="flex justify-between">
            <span>Ethnicity</span>
            <span className="text-gray-600">{user.ethnicity ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span>Member since</span>
            <span className="text-gray-600">{formatTimeAgo(user.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

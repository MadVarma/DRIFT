// Shared types mirroring the web app's types/index.ts

export interface UserPublic {
  id: string
  name: string
  avatar: string | null
  city: string | null
  gender: string | null
  bio: string | null
  age?: number
}

export interface DriftPostWithDetails {
  id: string
  content: string
  emoji: string | null
  city: string | null
  createdAt: string
  expiresAt: string
  userId: string
  user: UserPublic
  interactions: { id: string; type: string; userId: string }[]
  compatibilityScore?: number
  commonLikes?: string[]
  commonDislikes?: string[]
  commonHobbies?: string[]
  hasInteracted?: boolean
}

export interface MatchWithDetails {
  id: string
  userAId: string
  userBId: string
  createdAt: string
  expiresAt: string
  userA: UserPublic
  userB: UserPublic
  lastMessage?: MessageWithSender | null
  unreadCount?: number
}

export interface MessageWithSender {
  id: string
  content: string
  createdAt: string
  matchId: string
  senderId: string
  sender: Pick<UserPublic, 'id' | 'name' | 'avatar'>
}

export interface CreateDriftPostInput {
  content: string
  emoji?: string
  city?: string
  lat?: number
  lng?: number
}

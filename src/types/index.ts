import type { User, UserPreferences, DriftPost, Match, Message, Interaction } from '@prisma/client'

// ─── Extended types ────────────────────────────────────────────────────────────

export type UserPublic = Pick<User, 'id' | 'name' | 'avatar' | 'city' | 'gender' | 'bio'> & {
  age?: number
}

export type UserWithPreferences = User & {
  preferences: UserPreferences | null
}

export type DriftPostWithDetails = DriftPost & {
  user: UserPublic
  interactions: Interaction[]
  _count?: { interactions: number }
  imageUrl?: string | null
  // Computed by feed API
  compatibilityScore?: number
  commonLikes?: string[]
  commonDislikes?: string[]
  commonHobbies?: string[]
  distanceKm?: number
  feedScore?: number
  hasInteracted?: boolean
}

export type MatchWithDetails = Match & {
  userA: UserPublic
  userB: UserPublic
  messages?: MessageWithSender[]
  lastMessage?: MessageWithSender | null
  unreadCount?: number
}

export type MessageWithSender = Message & {
  sender: Pick<User, 'id' | 'name' | 'avatar'>
}

// ─── API input types ────────────────────────────────────────────────────────────

export interface RegisterInput {
  email: string
  password: string
  name: string
}

export interface OnboardingInput {
  name: string
  dateOfBirth: string
  gender: string
  height?: number
  ethnicity?: string
  bio?: string
  city?: string
  lat?: number
  lng?: number
  hobbies: string[]
  interests: string[]
  likes: string[]
  dislikes: string[]
}

export interface CreateDriftPostInput {
  content: string
  emoji?: string
  city?: string
  lat?: number
  lng?: number
  imageUrl?: string
}

export interface InteractInput {
  type: 'like' | 'respond'
  message?: string
}

export interface SendMessageInput {
  content: string
}

// ─── Next-auth type augmentation ────────────────────────────────────────────────

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      image?: string
      isOnboarded: boolean
    }
  }
  interface User {
    id: string
    isOnboarded: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    isOnboarded: boolean
  }
}

// ─── Constants ─────────────────────────────────────────────────────────────────

export const GENDERS = ['male', 'female', 'non-binary', 'other'] as const
export type Gender = (typeof GENDERS)[number]

export const HOBBY_OPTIONS = [
  'Reading', 'Hiking', 'Gaming', 'Cooking', 'Photography', 'Travel',
  'Music', 'Art', 'Yoga', 'Cycling', 'Running', 'Dancing', 'Writing',
  'Climbing', 'Swimming', 'Surfing', 'Film', 'Theatre', 'Comedy', 'Podcasts',
]

export const INTEREST_OPTIONS = [
  'Tech', 'Film', 'Science', 'Fashion', 'Sports', 'Food', 'Politics',
  'Nature', 'History', 'Startups', 'AI', 'Design', 'Philosophy', 'Economics',
  'Psychology', 'Music', 'Literature', 'Travel', 'Gaming', 'Wellness',
]

export const LIKE_OPTIONS = [
  'Coffee', 'Late nights', 'Road trips', 'Live music', 'Good books',
  'Sunsets', 'Rainy days', 'Street food', 'Deep conversations', 'Spontaneous plans',
  'Craft beer', 'Museums', 'Rooftop bars', 'Long walks', 'Sunday brunch',
  'Niche memes', 'Record stores', 'Hidden spots', 'Cosy cafes', 'Night markets',
]

export const DISLIKE_OPTIONS = [
  'Small talk', 'Loud clubs', 'Bad Wi-Fi', 'Slow walkers', 'Cancel culture',
  'Toxic positivity', 'Overly curated feeds', 'Ghosting', 'Unsolicited opinions',
  'Cold coffee', 'Passive aggression', 'Alarm snooze people', 'Reply-all emails',
  'Fake busy', 'Over-filtered photos', 'Dry texters', 'Vague plans',
  'Trendy restaurants with bad food', 'Motivational quotes', 'Performative wellness',
]

export const DRIFT_PROMPT_SUGGESTIONS = [
  'Drifting at a coffee shop ☕',
  'Late night coding session 💻',
  'Walking in the park 🌿',
  'At a record store 🎵',
  'Exploring a new neighbourhood 🗺️',
  'Working from a new café 📝',
  'Saturday morning market run 🌾',
  'Golden hour walk 🌅',
  'Book club night 📚',
  'Post-gym endorphins 💪',
  'Rooftop with a good view 🌆',
  'Museum crawl 🎨',
  'Finding the best ramen in the city 🍜',
  'Late night drive with no destination 🚗',
  'Spontaneous road trip 🛣️',
]

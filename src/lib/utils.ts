import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNowStrict, differenceInSeconds, differenceInMinutes, differenceInHours } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateAge(dateOfBirth: Date | string): number {
  const birth = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

export function formatTimeAgo(date: Date | string): string {
  const d = new Date(date)
  const seconds = differenceInSeconds(new Date(), d)
  if (seconds < 60) return 'just now'
  const minutes = differenceInMinutes(new Date(), d)
  if (minutes < 60) return `${minutes}m ago`
  const hours = differenceInHours(new Date(), d)
  if (hours < 24) return `${hours}h ago`
  return formatDistanceToNowStrict(d, { addSuffix: true })
}

export function formatCountdown(expiresAt: Date | string): string {
  const expires = new Date(expiresAt)
  const now = new Date()
  const totalSeconds = differenceInSeconds(expires, now)

  if (totalSeconds <= 0) return 'Expired'

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)

  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function formatDistance(km: number | null | undefined): string {
  if (km === null || km === undefined) return ''
  if (km < 1) return 'nearby'
  if (km < 10) return `${km.toFixed(1)} km away`
  return `${Math.round(km)} km away`
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
}

export const DRIFT_POST_EXPIRY_HOURS = 24
export const MATCH_EXPIRY_HOURS = 24

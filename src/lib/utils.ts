import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInSeconds, differenceInMinutes, differenceInHours } from 'date-fns'

/** IST offset in milliseconds (UTC+5:30) */
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * Convert a UTC Date to the IST wall-clock Date.
 * Uses a manual offset so it works correctly in every JS environment,
 * including Node.js builds without full-ICU timezone data.
 * The returned Date's UTC methods (getUTCHours, getUTCDate, …) reflect IST values.
 */
function utcToISTDate(date: Date | string): Date {
  const d = new Date(date)
  return new Date(d.getTime() + IST_OFFSET_MS)
}

/**
 * Format an exact IST timestamp for display in messages/posts.
 * e.g. "11 May 2026, 14:32 IST"
 * Uses a manual UTC+5:30 shift so it is environment-proof.
 */
export function formatExactIST(date: Date | string): string {
  const ist = utcToISTDate(date)
  const day = String(ist.getUTCDate()).padStart(2, '0')
  const month = MONTHS_SHORT[ist.getUTCMonth()]
  const year = ist.getUTCFullYear()
  const hours = String(ist.getUTCHours()).padStart(2, '0')
  const minutes = String(ist.getUTCMinutes()).padStart(2, '0')
  return `${day} ${month} ${year}, ${hours}:${minutes} IST`
}

/**
 * Format a short IST time only (HH:MM) for message bubbles.
 * Uses a manual UTC+5:30 shift so it is environment-proof.
 */
export function formatTimeIST(date: Date | string): string {
  const ist = utcToISTDate(date)
  const hours = String(ist.getUTCHours()).padStart(2, '0')
  const minutes = String(ist.getUTCMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

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
  const now = new Date()
  // Both sides are UTC-internally; the arithmetic is timezone-agnostic.
  const seconds = differenceInSeconds(now, d)
  if (seconds < 60) return 'just now'
  const minutes = differenceInMinutes(now, d)
  if (minutes < 60) return `${minutes}m ago`
  const hours = differenceInHours(now, d)
  if (hours < 24) return `${hours}h ago`
  // For older dates show the IST time so the user can verify the day
  return formatExactIST(date)
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

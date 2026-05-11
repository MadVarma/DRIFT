import { differenceInSeconds, differenceInMinutes, differenceInHours } from 'date-fns'

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function utcToISTDate(date: Date | string): Date {
  const d = new Date(date)
  return new Date(d.getTime() + IST_OFFSET_MS)
}

export function formatExactIST(date: Date | string): string {
  const ist = utcToISTDate(date)
  const day = String(ist.getUTCDate()).padStart(2, '0')
  const month = MONTHS_SHORT[ist.getUTCMonth()]
  const year = ist.getUTCFullYear()
  const hh = String(ist.getUTCHours()).padStart(2, '0')
  const mm = String(ist.getUTCMinutes()).padStart(2, '0')
  return `${day} ${month} ${year}, ${hh}:${mm} IST`
}

export function formatTimeIST(date: Date | string): string {
  const ist = utcToISTDate(date)
  return `${String(ist.getUTCHours()).padStart(2, '0')}:${String(ist.getUTCMinutes()).padStart(2, '0')}`
}

export function formatTimeAgo(date: Date | string): string {
  const now = new Date()
  const d = new Date(date)
  const secs = differenceInSeconds(now, d)
  if (secs < 60) return 'just now'
  const mins = differenceInMinutes(now, d)
  if (mins < 60) return `${mins}m ago`
  const hrs = differenceInHours(now, d)
  if (hrs < 24) return `${hrs}h ago`
  return formatExactIST(date)
}

export function formatCountdown(expiresAt: Date | string): string {
  const now = new Date()
  const exp = new Date(expiresAt)
  const totalSecs = Math.max(0, Math.floor((exp.getTime() - now.getTime()) / 1000))
  const hh = String(Math.floor(totalSecs / 3600)).padStart(2, '0')
  const mm = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0')
  return `${hh}:${mm}`
}

export interface PreferenceSet {
  likes: string[]
  dislikes: string[]
  hobbies: string[]
  interests: string[]
}

export interface CompatibilityResult {
  score: number
  commonLikes: string[]
  commonDislikes: string[]
  commonHobbies: string[]
  commonInterests: string[]
  isEligible: boolean
}

/**
 * Core DRIFT matching algorithm.
 * A match is ONLY eligible if there is at least 1 shared like AND 1 shared dislike.
 *
 * Scoring:
 *  +1 per shared like
 *  +3 per shared dislike (rare and more meaningful)
 *  +2 per shared hobby
 *  +1 per shared interest
 */
export function calculateCompatibility(
  userA: PreferenceSet,
  userB: PreferenceSet
): CompatibilityResult {
  const commonLikes = intersection(userA.likes, userB.likes)
  const commonDislikes = intersection(userA.dislikes, userB.dislikes)
  const commonHobbies = intersection(userA.hobbies, userB.hobbies)
  const commonInterests = intersection(userA.interests, userB.interests)

  const isEligible = commonLikes.length >= 1 && commonDislikes.length >= 1

  const score =
    commonLikes.length * 1 +
    commonDislikes.length * 3 +
    commonHobbies.length * 2 +
    commonInterests.length * 1

  return {
    score,
    commonLikes,
    commonDislikes,
    commonHobbies,
    commonInterests,
    isEligible,
  }
}

/**
 * Haversine formula to calculate distance between two coordinates in km.
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c * 10) / 10 // round to 1 decimal
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

function intersection(a: string[], b: string[]): string[] {
  const setB = new Set(b.map((s) => s.toLowerCase()))
  return a.filter((item) => setB.has(item.toLowerCase()))
}

/**
 * Sort drift posts by combined score of compatibility + recency + proximity.
 * Higher is better.
 */
export function computeFeedScore(params: {
  compatibilityScore: number
  postedMinutesAgo: number
  distanceKm: number | null
}): number {
  const { compatibilityScore, postedMinutesAgo, distanceKm } = params

  const recencyScore = Math.max(0, 100 - postedMinutesAgo * 0.5) // decays over ~200 min
  const proximityScore = distanceKm !== null ? Math.max(0, 50 - distanceKm) : 0

  return compatibilityScore * 4 + recencyScore + proximityScore
}

import { apiFetch } from './client'
import type { DriftPostWithDetails, CreateDriftPostInput } from '../types'

export async function getFeed(): Promise<{ posts: DriftPostWithDetails[] }> {
  return apiFetch('/api/feed')
}

export async function createDriftPost(data: CreateDriftPostInput) {
  return apiFetch('/api/drift-posts', { method: 'POST', body: data })
}

export async function interactWithPost(
  postId: string,
  type: 'like' | 'respond',
  message?: string
) {
  return apiFetch(`/api/drift-posts/${postId}/interact`, {
    method: 'POST',
    body: { type, message },
  })
}

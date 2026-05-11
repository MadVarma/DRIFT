'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { formatExactIST } from '@/lib/utils'

interface DriftSummary {
  id: string
  content: string
  emoji: string | null
  city: string | null
  isActive: boolean
  expiresAt: string
  createdAt: string
}

interface AdminUser {
  id: string
  email: string
  name: string
  gender: string | null
  city: string | null
  bio: string | null
  isOnboarded: boolean
  isActive: boolean
  createdAt: string
  lastSeen: string
  drifts: DriftSummary[]
}

export default function AdminDashboard() {
  const router = useRouter()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      if (res.status === 401) {
        router.push('/admin/login')
        return
      }
      const data = await res.json()
      setUsers(data.users ?? [])
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  async function handleLogout() {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    router.push('/admin/login')
  }

  async function handleDeleteUser(userId: string) {
    setDeleting(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId))
        setConfirmDelete(null)
      }
    } finally {
      setDeleting(null)
    }
  }

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.city ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#0a0a10] text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0a0a10]/95 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight">DRIFT Admin</h1>
          <p className="text-xs text-gray-500 mt-0.5">{users.length} registered users</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20"
        >
          Logout
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or city…"
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-violet-500/60 transition-colors"
        />

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/3 p-5 animate-pulse h-20" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-500 py-16">No users found</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((user) => (
              <div
                key={user.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden"
              >
                {/* User row */}
                <div className="p-5 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{user.name}</span>
                      {user.gender && (
                        <span className="text-xs text-gray-500 capitalize">{user.gender}</span>
                      )}
                      {!user.isActive && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/20">
                          Deactivated
                        </span>
                      )}
                      {!user.isOnboarded && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
                          Not onboarded
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mt-0.5">{user.email}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
                      {user.city && <span>📍 {user.city}</span>}
                      <span>Joined {formatExactIST(user.createdAt)}</span>
                      <span>Last seen {formatExactIST(user.lastSeen)}</span>
                      <span>{user.drifts.length} drift{user.drifts.length !== 1 ? 's' : ''}</span>
                    </div>
                    {user.bio && (
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2 italic">&ldquo;{user.bio}&rdquo;</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {user.drifts.length > 0 && (
                      <button
                        onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-white/10 hover:border-violet-500/30 text-gray-400 hover:text-violet-300 transition-colors"
                      >
                        {expandedUser === user.id ? 'Hide drifts' : `Show drifts (${user.drifts.length})`}
                      </button>
                    )}
                    <button
                      onClick={() => setConfirmDelete(user.id)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Drifts panel */}
                {expandedUser === user.id && user.drifts.length > 0 && (
                  <div className="border-t border-white/5 bg-white/[0.02] px-5 py-4 space-y-3">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Drift Posts</p>
                    {user.drifts.map((drift) => (
                      <div
                        key={drift.id}
                        className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
                      >
                        {drift.emoji && <span className="text-xl flex-shrink-0">{drift.emoji}</span>}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-200 break-words">{drift.content}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500 flex-wrap">
                            {drift.city && <span>📍 {drift.city}</span>}
                            <span>Posted {formatExactIST(drift.createdAt)}</span>
                            <span>Expires {formatExactIST(drift.expiresAt)}</span>
                            <span
                              className={
                                drift.isActive
                                  ? 'text-emerald-400'
                                  : 'text-gray-600'
                              }
                            >
                              {drift.isActive ? '● Active' : '○ Expired'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-[#13111f] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h2 className="text-base font-semibold mb-2">Permanently delete account?</h2>
            <p className="text-sm text-gray-400 mb-6">
              All data for{' '}
              <strong className="text-white">
                {users.find((u) => u.id === confirmDelete)?.name}
              </strong>{' '}
              will be permanently removed and cannot be recovered.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(confirmDelete)}
                disabled={deleting === confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
              >
                {deleting === confirmDelete ? 'Deleting…' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

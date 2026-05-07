import DriftFeed from '@/components/feed/DriftFeed'
import CreateDriftPost from '@/components/feed/CreateDriftPost'

export default function FeedPage() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">The Drift</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Live feed · people nearby right now</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-emerald-600">Live</span>
        </div>
      </div>

      <CreateDriftPost />
      <DriftFeed />
    </div>
  )
}

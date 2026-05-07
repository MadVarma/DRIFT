import MatchesList from '@/components/matches/MatchesList'

export default function MatchesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Your Matches</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Matches expire after 24 hours — make it count.
        </p>
      </div>
      <MatchesList />
    </div>
  )
}

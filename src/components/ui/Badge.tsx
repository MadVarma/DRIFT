import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'like' | 'dislike' | 'hobby' | 'interest' | 'score' | 'time' | 'danger'
  className?: string
  onClick?: () => void
}

export function Badge({ children, variant = 'default', className, onClick }: BadgeProps) {
  const variants = {
    default: 'bg-rose-50 text-rose-700 border border-rose-200',
    like: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    dislike: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    hobby: 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
    interest: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    score: 'bg-primary/10 text-rose-700 border border-primary/20',
    time: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
    danger: 'bg-destructive/10 text-red-400 border border-destructive/20',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
        className
      )}
      onClick={onClick}
    >
      {children}
    </span>
  )
}

interface SelectableBadgeProps {
  label: string
  selected?: boolean
  onClick?: () => void
  className?: string
}

export function SelectableBadge({ label, selected, onClick, className }: SelectableBadgeProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 active:scale-95',
        selected
          ? 'bg-primary/15 text-rose-800 border-primary/35'
          : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-rose-300 hover:text-rose-700',
        className
      )}
    >
      {selected && <span className="mr-1 text-rose-600">✓</span>}
      {label}
    </button>
  )
}

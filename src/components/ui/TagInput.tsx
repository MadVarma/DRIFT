import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Plus } from 'lucide-react'
import { SelectableBadge } from './Badge'
import { cn } from '@/lib/utils'

interface TagInputProps {
  label?: string
  value: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]
  placeholder?: string
  maxTags?: number
  error?: string
  hint?: string
  color?: 'like' | 'dislike' | 'hobby' | 'interest' | 'default'
}

const colorMap = {
  default: {
    tag: 'bg-rose-50 text-rose-800 border-rose-200',
    remove: 'hover:text-rose-600',
  },
  like: {
    tag: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    remove: 'hover:text-emerald-200',
  },
  dislike: {
    tag: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
    remove: 'hover:text-rose-200',
  },
  hobby: {
    tag: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
    remove: 'hover:text-violet-200',
  },
  interest: {
    tag: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    remove: 'hover:text-amber-200',
  },
}

export function TagInput({
  label,
  value,
  onChange,
  suggestions = [],
  placeholder = 'Add a tag...',
  maxTags = 20,
  error,
  hint,
  color = 'default',
}: TagInputProps) {
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const colors = colorMap[color]

  const filteredSuggestions = suggestions.filter(
    (s) =>
      s.toLowerCase().includes(input.toLowerCase()) &&
      !value.map((v) => v.toLowerCase()).includes(s.toLowerCase())
  )

  const addTag = useCallback(
    (tag: string) => {
      const trimmed = tag.trim()
      if (!trimmed || value.length >= maxTags) return
      if (value.map((v) => v.toLowerCase()).includes(trimmed.toLowerCase())) return
      onChange([...value, trimmed])
      setInput('')
    },
    [value, maxTags, onChange]
  )

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    }
    if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1))
    }
    if (e.key === 'Escape') setShowSuggestions(false)
  }

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-sm font-medium text-gray-800">{label}</label>}

      {/* Selected tags + input */}
      <div
        className={cn(
          'min-h-[44px] w-full rounded-xl bg-surface border border-border p-2 flex flex-wrap gap-1.5 cursor-text transition-all',
          'focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15',
          error && 'border-destructive/60'
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag, i) => (
          <span
            key={i}
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border',
              colors.tag
            )}
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                removeTag(i)
              }}
              className={cn('opacity-60 hover:opacity-100 transition-opacity', colors.remove)}
            >
              <X size={10} />
            </button>
          </span>
        ))}
        {value.length < maxTags && (
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              setShowSuggestions(true)
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder={value.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[120px] bg-transparent text-sm text-gray-900 placeholder:text-muted-foreground/50 outline-none py-0.5"
          />
        )}
      </div>

      {/* Suggestions */}
      {showSuggestions && (filteredSuggestions.length > 0 || input.trim()) && (
        <div className="mt-1 p-2 rounded-xl bg-card border border-border flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
          {input.trim() && !suggestions.map((s) => s.toLowerCase()).includes(input.toLowerCase()) && (
            <button
              type="button"
              onMouseDown={() => addTag(input)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-primary/20 text-violet-300 border border-primary/30 hover:bg-primary/30 transition-colors"
            >
              <Plus size={10} />
              Add &ldquo;{input}&rdquo;
            </button>
          )}
          {filteredSuggestions.slice(0, 20).map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={() => addTag(s)}
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white/90 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Quick-select from suggestions */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {suggestions
            .filter((s) => !value.map((v) => v.toLowerCase()).includes(s.toLowerCase()))
            .slice(0, 12)
            .map((s) => (
              <SelectableBadge
                key={s}
                label={s}
                selected={false}
                onClick={() => addTag(s)}
              />
            ))}
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">
          {hint} ({value.length}/{maxTags})
        </p>
      )}
    </div>
  )
}

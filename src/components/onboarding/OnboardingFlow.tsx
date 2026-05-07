'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { TagInput } from '@/components/ui/TagInput'
import { SelectableBadge } from '@/components/ui/Badge'
import {
  HOBBY_OPTIONS,
  INTEREST_OPTIONS,
  LIKE_OPTIONS,
  DISLIKE_OPTIONS,
  GENDERS,
  type OnboardingInput,
} from '@/types'
import { cn } from '@/lib/utils'

const STEPS = [
  { id: 1, label: 'The basics', description: 'Tell us who you are' },
  { id: 2, label: 'About you', description: 'A quick bio and your vibe' },
  { id: 3, label: 'Your hobbies', description: 'What do you spend time on?' },
  { id: 4, label: 'What you love', description: 'Things that light you up' },
  { id: 5, label: 'What you hate', description: "The stuff you can't stand" },
]

const ETHNICITY_OPTIONS = [
  'Asian', 'Black / African', 'Hispanic / Latino', 'Indian', 'Middle Eastern',
  'Mixed', 'Native American', 'Pacific Islander', 'South Asian', 'White / Caucasian', 'Other',
]

export default function OnboardingFlow() {
  const router = useRouter()
  const { update: updateSession } = useSession()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [data, setData] = useState<OnboardingInput>({
    name: '',
    dateOfBirth: '',
    gender: '',
    height: undefined,
    ethnicity: '',
    bio: '',
    city: '',
    hobbies: [],
    interests: [],
    likes: [],
    dislikes: [],
  })

  const set = (field: keyof OnboardingInput) => (value: unknown) => {
    setData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validateStep = (): boolean => {
    const e: Record<string, string> = {}
    if (step === 1) {
      if (!data.name.trim() || data.name.trim().length < 2) e.name = 'Name must be at least 2 characters'
      if (!data.dateOfBirth) e.dateOfBirth = 'Date of birth is required'
      else {
        const age = getAge(data.dateOfBirth)
        if (age < 18) e.dateOfBirth = 'You must be at least 18 years old'
        if (age > 100) e.dateOfBirth = 'Please enter a valid date of birth'
      }
      if (!data.gender) e.gender = 'Please select your gender'
    }
    if (step === 3) {
      if (data.hobbies.length < 1) e.hobbies = 'Pick at least 1 hobby'
    }
    if (step === 4) {
      if (data.likes.length < 3) e.likes = 'Pick at least 3 things you like'
    }
    if (step === 5) {
      if (data.dislikes.length < 3) e.dislikes = 'Pick at least 3 things you dislike'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => {
    if (!validateStep()) return
    if (step < STEPS.length) setStep((s) => s + 1)
  }

  const prev = () => setStep((s) => Math.max(1, s - 1))

  const handleSubmit = async () => {
    if (!validateStep()) return
    setLoading(true)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error ?? 'Failed to save profile')
        return
      }
      await updateSession()
      toast.success('Profile set up! Welcome to DRIFT ✦')
      router.push('/feed')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const progress = (step / STEPS.length) * 100

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="text-2xl font-bold gradient-text mb-1">DRIFT</div>
        <p className="text-muted-foreground text-sm">Step {step} of {STEPS.length}</p>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/5 rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-10 overflow-x-auto no-scrollbar">
        {STEPS.map((s) => (
          <div
            key={s.id}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all',
              step === s.id
                ? 'bg-primary/20 text-violet-300 border border-primary/30'
                : step > s.id
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-muted-foreground'
            )}
          >
            {step > s.id ? <Check size={10} /> : <span>{s.id}</span>}
            {step === s.id && <span>{s.label}</span>}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="animate-fade-in">
        <h2 className="text-xl font-bold mb-1">{STEPS[step - 1].label}</h2>
        <p className="text-muted-foreground text-sm mb-6">{STEPS[step - 1].description}</p>

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <Input
              label="Full name"
              placeholder="Your name"
              value={data.name}
              onChange={(e) => set('name')(e.target.value)}
              error={errors.name}
              autoFocus
            />
            <Input
              label="Date of birth"
              type="date"
              value={data.dateOfBirth}
              onChange={(e) => set('dateOfBirth')(e.target.value)}
              error={errors.dateOfBirth}
              hint={data.dateOfBirth ? `Age: ${getAge(data.dateOfBirth)}` : undefined}
            />
            <div>
              <label className="text-sm font-medium text-gray-800 mb-2 block">Gender</label>
              <div className="flex flex-wrap gap-2">
                {GENDERS.map((g) => (
                  <SelectableBadge
                    key={g}
                    label={g.charAt(0).toUpperCase() + g.slice(1).replace('-', ' ')}
                    selected={data.gender === g}
                    onClick={() => set('gender')(g)}
                  />
                ))}
              </div>
              {errors.gender && <p className="text-xs text-destructive mt-1.5">{errors.gender}</p>}
            </div>
            <Input
              label="Height (cm) — optional"
              type="number"
              placeholder="170"
              value={data.height ?? ''}
              onChange={(e) => set('height')(e.target.value ? parseInt(e.target.value) : undefined)}
              hint="Used to display on your profile"
            />
            <div>
              <label className="text-sm font-medium text-gray-800 mb-2 block">Ethnicity — optional</label>
              <div className="flex flex-wrap gap-2">
                {ETHNICITY_OPTIONS.map((e) => (
                  <SelectableBadge
                    key={e}
                    label={e}
                    selected={data.ethnicity === e}
                    onClick={() => set('ethnicity')(e)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <Textarea
              label="Bio — optional"
              placeholder="A short description of yourself..."
              value={data.bio ?? ''}
              onChange={(e) => set('bio')(e.target.value)}
              hint="Max 200 characters"
              maxLength={200}
              className="min-h-[100px]"
            />
            <Input
              label="City — optional"
              placeholder="San Francisco"
              value={data.city ?? ''}
              onChange={(e) => set('city')(e.target.value)}
              hint="Used to show proximity to other drifters"
            />
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-6">
            <TagInput
              label="Hobbies"
              value={data.hobbies}
              onChange={set('hobbies') as (v: string[]) => void}
              suggestions={HOBBY_OPTIONS}
              placeholder="Add a hobby..."
              color="hobby"
              error={errors.hobbies}
              hint="Things you actually do regularly"
              maxTags={15}
            />
            <TagInput
              label="Interests"
              value={data.interests}
              onChange={set('interests') as (v: string[]) => void}
              suggestions={INTEREST_OPTIONS}
              placeholder="Add an interest..."
              color="interest"
              hint="Topics you're into"
              maxTags={15}
            />
          </div>
        )}

        {step === 4 && (
          <TagInput
            label="Things you genuinely love"
            value={data.likes}
            onChange={set('likes') as (v: string[]) => void}
            suggestions={LIKE_OPTIONS}
            placeholder="Add something you love..."
            color="like"
            error={errors.likes}
            hint="Be specific — the more specific, the better the match"
            maxTags={20}
          />
        )}

        {step === 5 && (
          <div>
            <div className="p-4 rounded-xl bg-amber-500/8 border border-amber-500/15 mb-6">
              <p className="text-sm text-amber-300/80">
                <span className="font-semibold text-amber-300">This is the secret sauce.</span>{' '}
                Shared dislikes create the strongest bonds. Be honest.
              </p>
            </div>
            <TagInput
              label="Things you genuinely hate"
              value={data.dislikes}
              onChange={set('dislikes') as (v: string[]) => void}
              suggestions={DISLIKE_OPTIONS}
              placeholder="Add something you hate..."
              color="dislike"
              error={errors.dislikes}
              hint="The more honest, the better your matches"
              maxTags={20}
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-10">
        <Button
          variant="ghost"
          onClick={prev}
          disabled={step === 1}
          className="gap-2"
        >
          <ChevronLeft size={16} />
          Back
        </Button>

        {step < STEPS.length ? (
          <Button onClick={next} className="gap-2 rounded-full px-6">
            Continue
            <ChevronRight size={16} />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            loading={loading}
            className="gap-2 rounded-full px-6"
          >
            Finish & Start Drifting
            <Check size={16} />
          </Button>
        )}
      </div>
    </div>
  )
}

function getAge(dateOfBirth: string): number {
  const birth = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

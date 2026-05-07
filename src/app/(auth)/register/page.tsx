'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import toast from 'react-hot-toast'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Name must be at least 2 characters'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email address'
    if (!form.password || form.password.length < 8) e.password = 'Password must be at least 8 characters'
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.toLowerCase().trim(),
          password: form.password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          setErrors({ email: 'An account with this email already exists' })
        } else {
          setErrors({ form: data.error ?? 'Failed to create account' })
        }
        return
      }

      // Auto sign in
      const signInResult = await signIn('credentials', {
        email: form.email.toLowerCase().trim(),
        password: form.password,
        redirect: false,
      })

      if (signInResult?.error) {
        toast.error('Account created, but sign-in failed. Please sign in manually.')
        router.push('/login')
      } else {
        toast.success('Account created! Let\'s set up your profile.')
        router.push('/onboarding')
      }
    } catch {
      setErrors({ form: 'Something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1.5">Create your account</h1>
        <p className="text-muted-foreground text-sm">
          Takes 2 minutes. Then we&apos;ll set up your vibe.
        </p>
      </div>

      {errors.form && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-red-400">
          {errors.form}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Your name"
          type="text"
          placeholder="Alex Rivera"
          value={form.name}
          onChange={set('name')}
          icon={<User size={15} />}
          error={errors.name}
          autoComplete="name"
          autoFocus
        />

        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={set('email')}
          icon={<Mail size={15} />}
          error={errors.email}
          autoComplete="email"
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Min. 8 characters"
          value={form.password}
          onChange={set('password')}
          icon={<Lock size={15} />}
          error={errors.password}
          hint="At least 8 characters"
          autoComplete="new-password"
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-muted-foreground hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          }
        />

        <Button type="submit" loading={loading} size="lg" className="mt-2 rounded-full">
          Create account
        </Button>
      </form>

      <p className="mt-4 text-xs text-center text-muted-foreground leading-relaxed">
        By creating an account you agree to our{' '}
        <span className="text-violet-400 cursor-pointer hover:underline">Terms of Service</span> and{' '}
        <span className="text-violet-400 cursor-pointer hover:underline">Privacy Policy</span>.
      </p>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  )
}

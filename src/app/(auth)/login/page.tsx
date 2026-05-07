'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface LoginForm {
  email: string
  password: string
}

// Custom minimal hook to avoid react-hook-form dependency issues
export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({})

  const validate = () => {
    const e: typeof errors = {}
    if (!email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email address'
    if (!password) e.password = 'Password is required'
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
      const result = await signIn('credentials', {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      })

      if (result?.error) {
        setErrors({ form: 'Incorrect email or password. Please try again.' })
      } else {
        toast.success('Welcome back!')
        router.push('/feed')
        router.refresh()
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
        <h1 className="text-2xl font-bold mb-1.5">Welcome back</h1>
        <p className="text-muted-foreground text-sm">Sign in to continue drifting.</p>
      </div>

      {errors.form && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-red-400">
          {errors.form}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail size={15} />}
          error={errors.email}
          autoComplete="email"
          autoFocus
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock size={15} />}
          error={errors.password}
          autoComplete="current-password"
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
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
          Create one
        </Link>
      </p>

      {/* Demo hint */}
      <div className="mt-8 p-3.5 rounded-xl bg-white/4 border border-white/8 text-xs text-muted-foreground">
        <p className="font-medium text-white/50 mb-1">Demo account</p>
        <p>Email: <span className="text-white/70">alex@drift.app</span></p>
        <p>Password: <span className="text-white/70">password123</span></p>
      </div>
    </div>
  )
}

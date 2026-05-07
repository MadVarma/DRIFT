'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import OnboardingFlow from '@/components/onboarding/OnboardingFlow'
import { AmbientBackground } from '@/components/AmbientBackground'

export default function OnboardingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
    if (status === 'authenticated' && session?.user.isOnboarded) {
      router.push('/feed')
    }
  }, [status, session, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ position: 'relative', zIndex: 1 }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(236,72,153,0.6)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ position: 'relative', zIndex: 1 }}>
      <AmbientBackground />
      <OnboardingFlow />
    </div>
  )
}

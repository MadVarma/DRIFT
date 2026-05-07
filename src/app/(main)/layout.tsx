import { Navbar } from '@/components/layout/Navbar'
import { MobileNav } from '@/components/layout/MobileNav'
import { AmbientBackground } from '@/components/AmbientBackground'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ position: 'relative', zIndex: 1 }}>
      <AmbientBackground />
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 pt-24 pb-24 sm:pb-8 relative" style={{ zIndex: 1 }}>
        {children}
      </main>
      <MobileNav />
    </div>
  )
}

import { DriftLogo } from '@/components/DriftLogo'
import { AmbientBackground } from '@/components/AmbientBackground'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex relative" style={{ zIndex: 1 }}>
      <AmbientBackground />
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-2/5 xl:w-1/2 relative overflow-hidden items-center justify-center p-12"
        style={{ borderRight: '1px solid rgba(236,72,153,0.15)', background: 'rgba(253,240,248,0.7)', backdropFilter: 'blur(20px)' }}>
        <div className="relative text-center z-10">
          {/* DRIFT logo shimmer */}
          <div className="mb-8">
            <DriftLogo height={68} />
          </div>
          <p className="text-lg leading-relaxed max-w-xs" style={{ color: 'rgba(30,5,18,0.5)' }}>
            Meet people who love what you love — and hate what you hate.
          </p>
          <div className="mt-10 flex flex-col gap-3">
            {[
              '☕ Drifting at a coffee shop',
              '💻 Late night coding session',
              '🌿 Walking in the park',
              '🎵 At a record store',
            ].map((item, i) => (
              <div key={item}
                className="px-4 py-3 rounded-2xl text-sm text-left"
                style={{
                  background: 'rgba(255,255,255,0.8)',
                  border: '1px solid rgba(236,72,153,0.18)',
                  color: 'rgba(30,5,18,0.6)',
                  animation: `floatCard ${4 + i * 0.5}s ease-in-out infinite`,
                  animationDelay: `${i * 0.4}s`,
                }}>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Ripple rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          {[1,2,3].map((i) => (
            <div key={i} className="absolute rounded-full"
              style={{ width: 150*i, height: 150*i, border: '1px solid rgba(236,72,153,0.07)', animation: `ripple ${3+i}s ease-out infinite`, animationDelay: `${i*0.8}s` }} />
          ))}
        </div>
      </div>

      {/* Right: auth form */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="lg:hidden mb-10">
          <DriftLogo height={44} />
        </div>
        <div className="w-full max-w-sm">
          <div className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(236,72,153,0.18)', boxShadow: '0 4px 40px rgba(236,72,153,0.08), 0 1px 8px rgba(0,0,0,0.05)' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

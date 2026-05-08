'use client'

import { useEffect, useRef } from 'react'

// ─── HeartSplash ──────────────────────────────────────────────────────────────
// Full-screen intro splash: black bg with a beating / expanding heart, then fades out
export function HeartSplash({ onDone }: { onDone: () => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // After 1.8 s start fading out, then call onDone
    const fadeTimer = setTimeout(() => {
      el.style.transition = 'opacity 0.55s ease'
      el.style.opacity = '0'
    }, 1800)

    const doneTimer = setTimeout(() => {
      onDone()
    }, 2380) // fade duration + buffer

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(doneTimer)
    }
  }, [onDone])

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: '#0a0005',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 1,
        pointerEvents: 'none',
      }}
    >
      <style>{`
        @keyframes splashHeartBeat {
          0%   { transform: scale(0.05); opacity: 0; }
          30%  { transform: scale(1.15); opacity: 1; }
          50%  { transform: scale(0.92); opacity: 1; }
          70%  { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1.00); opacity: 1; }
        }
        @keyframes splashGlow {
          0%,100% { box-shadow: 0 0 60px 20px rgba(236,72,153,0.0); }
          50%      { box-shadow: 0 0 120px 60px rgba(236,72,153,0.35); }
        }
        .splash-heart {
          animation: splashHeartBeat 1.5s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
        .splash-glow {
          animation: splashGlow 1.5s ease-in-out forwards;
        }
      `}</style>

      <div className="splash-glow" style={{ borderRadius: '50%', padding: 0 }}>
        <svg
          className="splash-heart"
          width="110"
          height="100"
          viewBox="0 0 24 22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="hg" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#fda4cf" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#9f1239" />
            </radialGradient>
          </defs>
          <path
            d="M12 21.593c-5.63-5.539-11-10.297-11-14.402C1 4.144 2.992 2 6.007 2c1.951 0 3.817 1.038 4.993 2.628C12.18 3.038 14.045 2 15.994 2 19.012 2 21 4.148 21 7.191c0 4.106-5.367 8.863-9 12.402z"
            fill="url(#hg)"
          />
        </svg>
      </div>
    </div>
  )
}

// ─── HeartLoading ─────────────────────────────────────────────────────────────
// Thin loading bar at the top shown while splash is active
export function HeartLoading({ visible }: { visible: boolean }) {
  if (!visible) return null

  return (
    <>
      <style>{`
        @keyframes loadBar {
          from { width: 0%; }
          to   { width: 100%; }
        }
        .heart-load-bar {
          animation: loadBar 1.8s cubic-bezier(0.4,0,0.2,1) forwards;
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          zIndex: 10001,
          background: '#1a0a14',
          pointerEvents: 'none',
        }}
      >
        <div
          className="heart-load-bar"
          style={{
            height: '100%',
            background: 'linear-gradient(90deg, #f472b6, #ec4899, #db2777)',
            boxShadow: '0 0 8px rgba(236,72,153,0.7)',
          }}
        />
      </div>
    </>
  )
}

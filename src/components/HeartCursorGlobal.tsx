'use client'

import { useEffect, useRef } from 'react'

/**
 * Lightweight custom heart cursor — replaces the native cursor on all pages.
 * Uses a single requestAnimationFrame loop (no canvas / no particle system).
 */
export function HeartCursorGlobal() {
  const heartRef = useRef<HTMLDivElement>(null)
  const ringRef  = useRef<HTMLDivElement>(null)
  const posRef     = useRef({ x: -200, y: -200 })
  const ringPosRef = useRef({ x: -200, y: -200 })
  const rafRef     = useRef<number>(0)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', onMove, { passive: true })

    const animate = () => {
      // Heart follows exactly
      if (heartRef.current) {
        heartRef.current.style.left = `${posRef.current.x}px`
        heartRef.current.style.top  = `${posRef.current.y}px`
      }
      // Ring lags behind with lerp
      ringPosRef.current.x += (posRef.current.x - ringPosRef.current.x) * 0.10
      ringPosRef.current.y += (posRef.current.y - ringPosRef.current.y) * 0.10
      if (ringRef.current) {
        ringRef.current.style.left = `${ringPosRef.current.x}px`
        ringRef.current.style.top  = `${ringPosRef.current.y}px`
      }
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <>
      {/* Lagging glow ring */}
      <div
        ref={ringRef}
        className="fixed pointer-events-none select-none"
        style={{ zIndex: 9998, transform: 'translate(-50%, -50%)' }}
      >
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          border: '1.5px solid rgba(244,114,182,0.65)',
          boxShadow: '0 0 10px rgba(236,72,153,0.35)',
        }} />
      </div>
      {/* Heart dot */}
      <div
        ref={heartRef}
        className="fixed pointer-events-none select-none"
        style={{ zIndex: 9999, transform: 'translate(-50%, -50%)' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 21.593c-5.63-5.539-11-10.297-11-14.402C1 4.144 2.992 2 6.007 2c1.951 0 3.817 1.038 4.993 2.628C12.18 3.038 14.045 2 15.994 2 19.012 2 21 4.148 21 7.191c0 4.106-5.367 8.863-9 12.402z"
            fill="#ec4899" stroke="#db2777" strokeWidth="0.5"
          />
        </svg>
      </div>
    </>
  )
}

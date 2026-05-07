'use client'

import { useId } from 'react'

interface DriftLogoProps {
  /** rendered height in px; width scales proportionally */
  height?: number
  className?: string
}

export function DriftLogo({ height = 52, className = '' }: DriftLogoProps) {
  const uid = useId().replace(/:/g, '')
  const tg  = `${uid}-t`   // text gradient id
  const lg  = `${uid}-l`   // line gradient id
  const sg  = `${uid}-s`   // shimmer gradient id

  const W = Math.round(height * (296 / 88))

  return (
    <svg
      width={W}
      height={height}
      viewBox="0 0 296 88"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', overflow: 'visible' }}
    >
      <defs>
        {/* Main text gradient — rose to deep crimson */}
        <linearGradient id={tg} x1="0" y1="10" x2="296" y2="78" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#fb7185" />
          <stop offset="28%"  stopColor="#f43f8e" />
          <stop offset="62%"  stopColor="#db2777" />
          <stop offset="100%" stopColor="#881337" />
        </linearGradient>

        {/* Flourish line gradient — fades at edges */}
        <linearGradient id={lg} x1="16" y1="0" x2="280" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#fda4af" stopOpacity="0" />
          <stop offset="20%"  stopColor="#f43f8e" stopOpacity="0.75" />
          <stop offset="80%"  stopColor="#be185d" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#fda4af" stopOpacity="0" />
        </linearGradient>

        {/* Shimmer overlay on text */}
        <linearGradient id={sg} x1="0" y1="0" x2="296" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="rgba(255,255,255,0)" />
          <stop offset="45%"  stopColor="rgba(255,255,255,0.18)" />
          <stop offset="55%"  stopColor="rgba(255,255,255,0.18)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>

      {/* ── Decorative left swash ─────────────────────────────────────── */}
      <path
        d="M 22 69 Q 14 59 20 50 Q 14 59 22 55"
        stroke={`url(#${lg})`} strokeWidth="1" strokeLinecap="round" fill="none"
      />

      {/* ── Decorative right swash ────────────────────────────────────── */}
      <path
        d="M 274 69 Q 282 59 276 50 Q 282 59 274 55"
        stroke={`url(#${lg})`} strokeWidth="1" strokeLinecap="round" fill="none"
      />

      {/* ── Main DRIFT wordmark ───────────────────────────────────────── */}
      <text
        x="148"
        y="70"
        textAnchor="middle"
        fontFamily="'Cormorant Garamond', Georgia, serif"
        fontStyle="italic"
        fontWeight="300"
        fontSize="62"
        letterSpacing="11"
        fill={`url(#${tg})`}
        style={{ filter: 'drop-shadow(0 2px 8px rgba(219,39,119,0.20))' }}
      >
        DRIFT
      </text>

      {/* Shimmer overlay on text (purely additive, tasteful) */}
      <text
        x="148"
        y="70"
        textAnchor="middle"
        fontFamily="'Cormorant Garamond', Georgia, serif"
        fontStyle="italic"
        fontWeight="300"
        fontSize="62"
        letterSpacing="11"
        fill={`url(#${sg})`}
        style={{ pointerEvents: 'none' }}
      >
        DRIFT
      </text>

      {/* ── Elegant curved underline flourish ────────────────────────── */}
      <path
        d="M 20 79  Q 80 87  148 81  Q 216 75  276 79"
        stroke={`url(#${lg})`}
        strokeWidth="1.1"
        strokeLinecap="round"
        fill="none"
      />

      {/* ── Tiny diamond at flourish centre ──────────────────────────── */}
      <path
        d="M148 77 L151 80 L148 83 L145 80 Z"
        fill={`url(#${tg})`}
        opacity="0.9"
      />
    </svg>
  )
}

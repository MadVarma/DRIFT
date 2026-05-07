// Decorative scattered love-themed doodles — server component (no browser APIs)

type DType = 'heart' | 'sparkle' | 'arrow' | 'flower' | 'infinity' | 'star' | 'xo' | 'dots'

interface Item {
  x: number; y: number; r: number; s: number; o: number; delay: number
  type: DType; anim: 'float' | 'spin' | 'pulse'; color: string
}

const ITEMS: Item[] = [
  // ── Left edge ───────────────────────────────────────────────────────────────
  { x: 3,  y: 9,  r: -15, s: 28, o: 0.13, delay: 0.0, type: 'heart',    anim: 'float', color: '#f472b6' },
  { x: 7,  y: 24, r:  10, s: 14, o: 0.09, delay: 1.5, type: 'sparkle',  anim: 'pulse', color: '#fb7185' },
  { x: 2,  y: 44, r:   5, s: 20, o: 0.09, delay: 0.3, type: 'flower',   anim: 'spin',  color: '#f472b6' },
  { x: 4,  y: 63, r: -12, s: 22, o: 0.08, delay: 2.0, type: 'infinity', anim: 'float', color: '#c084fc' },
  { x: 3,  y: 81, r:   8, s: 16, o: 0.08, delay: 3.5, type: 'star',     anim: 'spin',  color: '#e879f9' },
  { x: 7,  y: 94, r:  -5, s: 24, o: 0.10, delay: 0.8, type: 'xo',       anim: 'pulse', color: '#fb7185' },
  // ── Right edge ──────────────────────────────────────────────────────────────
  { x: 91, y:  7, r:  12, s: 22, o: 0.10, delay: 0.5, type: 'sparkle',  anim: 'pulse', color: '#c084fc' },
  { x: 93, y: 22, r:  -8, s: 26, o: 0.09, delay: 2.2, type: 'heart',    anim: 'float', color: '#f472b6' },
  { x: 91, y: 42, r: -20, s: 30, o: 0.08, delay: 1.0, type: 'arrow',    anim: 'float', color: '#fb7185' },
  { x: 88, y: 61, r:  15, s: 18, o: 0.10, delay: 3.0, type: 'flower',   anim: 'spin',  color: '#f472b6' },
  { x: 92, y: 80, r:  -5, s: 20, o: 0.09, delay: 1.8, type: 'dots',     anim: 'pulse', color: '#e879f9' },
  { x: 89, y: 93, r:  20, s: 14, o: 0.08, delay: 2.8, type: 'star',     anim: 'spin',  color: '#c084fc' },
  // ── Top edge ────────────────────────────────────────────────────────────────
  { x: 22, y:  2, r: -10, s: 14, o: 0.07, delay: 2.5, type: 'sparkle',  anim: 'pulse', color: '#f472b6' },
  { x: 40, y:  1, r:   0, s: 20, o: 0.08, delay: 1.2, type: 'arrow',    anim: 'float', color: '#fb7185' },
  { x: 58, y:  2, r:   8, s: 16, o: 0.07, delay: 3.1, type: 'dots',     anim: 'float', color: '#c084fc' },
  { x: 77, y:  1, r:  12, s: 14, o: 0.08, delay: 0.7, type: 'sparkle',  anim: 'spin',  color: '#e879f9' },
  // ── Bottom edge ─────────────────────────────────────────────────────────────
  { x: 20, y: 96, r:   5, s: 16, o: 0.08, delay: 1.4, type: 'sparkle',  anim: 'pulse', color: '#f472b6' },
  { x: 50, y: 97, r:  -8, s: 22, o: 0.09, delay: 0.4, type: 'heart',    anim: 'pulse', color: '#fb7185' },
  { x: 72, y: 96, r:  10, s: 14, o: 0.07, delay: 2.0, type: 'dots',     anim: 'float', color: '#c084fc' },
]

export function LoveDoodles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 2 }}>
      {ITEMS.map((item, i) => {
        const floatDur = `${5 + (i % 3)}s`
        const pulseDur = `${3 + (i % 2) * 0.5}s`

        const outerAnim =
          item.anim === 'float' ? `doodleFloat ${floatDur} ease-in-out ${item.delay}s infinite` :
          item.anim === 'pulse' ? `heartPulse ${pulseDur} ease-in-out ${item.delay}s infinite` :
          undefined

        const innerAnim =
          item.anim === 'spin' ? `doodleSpin 20s linear ${item.delay}s infinite` : undefined

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${item.x}%`,
              top: `${item.y}%`,
              opacity: item.o,
              animation: outerAnim,
            }}
          >
            <div
              style={{
                transform: item.anim !== 'spin' ? `rotate(${item.r}deg)` : undefined,
                animation: innerAnim,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <DoodleSVG type={item.type} size={item.s} color={item.color} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DoodleSVG({ type, size, color }: { type: DType; size: number; color: string }) {
  const sw = 1.5

  switch (type) {
    case 'heart':
      return (
        <svg width={size} height={size} viewBox="0 0 24 22" fill="none">
          <path
            d="M12 20C5.5 14.5 1 10.5 1 6.5C1 3.5 3.5 1 6.5 1C8.7 1 10.5 2.3 12 4.2C13.5 2.3 15.3 1 17.5 1C20.5 1 23 3.5 23 6.5C23 10.5 18.5 14.5 12 20Z"
            stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      )

    case 'sparkle':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2L13.5 10.5L22 12L13.5 13.5L12 22L10.5 13.5L2 12L10.5 10.5Z"
            stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      )

    case 'arrow':
      return (
        <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
          <line x1="5" y1="23" x2="21" y2="7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <polyline points="15,7 21,7 21,13" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path
            d="M4.5 24.5C4.5 22 5.8 21.2 7.2 22.2C8.6 23.2 8.4 25.6 6.5 26.2C4.8 26.7 3.6 25.7 4.5 24.5Z"
            fill={color}
          />
        </svg>
      )

    case 'flower':
      return (
        <svg width={size} height={size} viewBox="0 0 26 26" fill="none">
          <ellipse cx="13" cy="7.5"  rx="3.5" ry="5.5" stroke={color} strokeWidth={sw} fill={color} fillOpacity="0.2" />
          <ellipse cx="13" cy="18.5" rx="3.5" ry="5.5" stroke={color} strokeWidth={sw} fill={color} fillOpacity="0.2" />
          <ellipse cx="7.5"  cy="13" rx="5.5" ry="3.5" stroke={color} strokeWidth={sw} fill={color} fillOpacity="0.2" />
          <ellipse cx="18.5" cy="13" rx="5.5" ry="3.5" stroke={color} strokeWidth={sw} fill={color} fillOpacity="0.2" />
          <circle cx="13" cy="13" r="3.5" fill={color} />
        </svg>
      )

    case 'infinity':
      return (
        <svg width={size} height={Math.round(size * 0.55)} viewBox="0 0 40 22" fill="none">
          <path
            d="M20 11C20 7 23 4 27 4C31 4 36 7 36 11C36 15 31 18 27 18C23 18 20 15 20 11C20 7 17 4 13 4C9 4 4 7 4 11C4 15 9 18 13 18C17 18 20 15 20 11Z"
            stroke={color} strokeWidth={sw} strokeLinecap="round"
          />
        </svg>
      )

    case 'star':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <polygon
            points="12,2 14.09,8.26 21,9.27 16,14.14 17.18,21.02 12,17.77 6.82,21.02 8,14.14 3,9.27 9.91,8.26"
            stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      )

    case 'xo':
      return (
        <svg width={size} height={Math.round(size * 0.6)} viewBox="0 0 38 23" fill="none">
          <line x1="4"  y1="4"  x2="15" y2="19" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <line x1="15" y1="4"  x2="4"  y2="19" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <circle cx="28" cy="11.5" r="8" stroke={color} strokeWidth="2" />
        </svg>
      )

    case 'dots':
      return (
        <svg width={size} height={Math.round(size * 0.4)} viewBox="0 0 30 12" fill={color}>
          <circle cx="4"  cy="6" r="2.2" />
          <circle cx="15" cy="6" r="3"   />
          <circle cx="26" cy="6" r="2.2" />
        </svg>
      )

    default:
      return null
  }
}

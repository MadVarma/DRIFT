// Shared ambient background — used on all main app pages (feed, matches, profile, chat, onboarding).
// Mirrors the landing page aesthetic: perspective grid + floating love symbols + soft glowing orbs.
// This is a server component (no browser APIs needed).

const SYMBOLS = [
  { x: '6%',  y: '12%', s: '28px', sym: '♥',  delay: '0s',    dur: '11s'  },
  { x: '92%', y: '8%',  s: '22px', sym: '💕', delay: '1.5s',  dur: '14s'  },
  { x: '88%', y: '70%', s: '26px', sym: '💘', delay: '3s',    dur: '12s'  },
  { x: '4%',  y: '65%', s: '32px', sym: '∞',  delay: '2s',    dur: '16s'  },
  { x: '48%', y: '6%',  s: '20px', sym: '💝', delay: '1s',    dur: '13s'  },
  { x: '22%', y: '88%', s: '18px', sym: '✨', delay: '0.5s',  dur: '10s'  },
  { x: '74%', y: '35%', s: '24px', sym: '💖', delay: '2.5s',  dur: '15s'  },
  { x: '14%', y: '50%', s: '16px', sym: '💗', delay: '4s',    dur: '18s'  },
  { x: '62%', y: '92%', s: '22px', sym: '💞', delay: '1.2s',  dur: '11s'  },
  { x: '38%', y: '30%', s: '14px', sym: '♥',  delay: '3.5s',  dur: '19s'  },
]

const ORBS = [
  { x: '10%',  y: '18%', size: 460, color: 'rgba(236,72,153,0.07)',  delay: '0s'  },
  { x: '82%',  y: '55%', size: 360, color: 'rgba(168,85,247,0.05)',  delay: '2s'  },
  { x: '50%',  y: '82%', size: 300, color: 'rgba(244,114,182,0.07)', delay: '4s'  },
  { x: '68%',  y: '8%',  size: 240, color: 'rgba(139,92,246,0.04)',  delay: '1s'  },
]

export function AmbientBackground() {
  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {/* Soft glowing orbs */}
      {ORBS.map((orb, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: orb.x,
            top: orb.y,
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, ${orb.color}, transparent)`,
            filter: 'blur(72px)',
            transform: 'translate(-50%, -50%)',
            animation: `orbFloat 9s ease-in-out infinite`,
            animationDelay: orb.delay,
          }}
        />
      ))}

      {/* Floating love symbols */}
      {SYMBOLS.map((s, i) => (
        <div
          key={i}
          className="absolute select-none"
          style={{
            left: s.x,
            top: s.y,
            fontSize: s.s,
            opacity: 0.18,
            transform: 'translate(-50%, -50%)',
            animation: `orbFloat ${s.dur} ease-in-out infinite`,
            animationDelay: s.delay,
            filter: 'drop-shadow(0 0 6px rgba(236,72,153,0.3))',
          }}
        >
          {s.sym}
        </div>
      ))}

      {/* Perspective grid floor */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{ height: '42%', perspective: '480px', perspectiveOrigin: '50% 0%' }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: 'rotateX(76deg)',
            transformOrigin: 'center bottom',
            backgroundImage:
              'linear-gradient(rgba(236,72,153,0.09) 1px, transparent 1px),' +
              'linear-gradient(90deg, rgba(236,72,153,0.09) 1px, transparent 1px)',
            backgroundSize: '52px 52px',
            maskImage:
              'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.25) 30%, rgba(0,0,0,0.7) 100%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.25) 30%, rgba(0,0,0,0.7) 100%)',
          }}
        />
      </div>
    </div>
  )
}

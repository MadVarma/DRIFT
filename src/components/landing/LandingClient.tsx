'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowRight, Zap, Heart, Users, Sparkles } from 'lucide-react'
import { DriftLogo } from '@/components/DriftLogo'

// ─── Heart particle type ─────────────────────────────────────────────────────
interface HeartParticle {
  id: number; x: number; y: number; vx: number; vy: number
  scale: number; opacity: number; rotation: number; rotationSpeed: number
  hue: number; life: number
}

// ─── Smooth mouse parallax (direct DOM, zero React re-renders) ───────────────
function useParallax(count = 3) {
  const refs = useRef<(HTMLDivElement | null)[]>(Array(count).fill(null))
  useEffect(() => {
    let raf: number
    const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 }
    const onMove = (e: MouseEvent) => {
      target.x = (e.clientX / window.innerWidth  - 0.5) * 2
      target.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    const loop = () => {
      cur.x += (target.x - cur.x) * 0.045
      cur.y += (target.y - cur.y) * 0.045
      refs.current.forEach((el, i) => {
        if (!el) return
        const f = (i + 1) * 9
        el.style.transform = `translate3d(${cur.x * f}px,${cur.y * f}px,0)`
      })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    window.addEventListener('mousemove', onMove)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('mousemove', onMove) }
  }, [])
  return refs
}

// ─── Depth-particle canvas ────────────────────────────────────────────────────
function DepthCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let W = window.innerWidth, H = window.innerHeight
    canvas.width = W; canvas.height = H
    type Dot = { x: number; y: number; z: number; speed: number }
    const dots: Dot[] = Array.from({ length: 110 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      z: Math.random(), speed: 0.25 + Math.random() * 0.5,
    }))
    const onResize = () => { W = window.innerWidth; H = window.innerHeight; canvas.width = W; canvas.height = H }
    window.addEventListener('resize', onResize)
    let raf: number
    const loop = () => {
      ctx.clearRect(0, 0, W, H)
      for (const d of dots) {
        d.y -= d.speed * (0.3 + d.z * 0.9)
        if (d.y < -4) { d.y = H + 4; d.x = Math.random() * W }
        const r = 0.7 + d.z * 2.6, a = 0.07 + d.z * 0.22
        ctx.beginPath(); ctx.arc(d.x, d.y, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(236,72,153,${a})`
        ctx.shadowColor = `rgba(236,72,153,${a * 0.7})`; ctx.shadowBlur = r * 5
        ctx.fill()
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize) }
  }, [])
  return <canvas ref={ref} className="fixed inset-0 pointer-events-none" style={{ zIndex: 1, opacity: 0.65 }} />
}

// ─── Floating love symbol ─────────────────────────────────────────────────────
const LOVE_SYMBOLS = ['♥', '💕', '💘', '💝', '💖', '💗', '✨', '∞', '💞', '💓']

function FloatingLoveSymbol({ x, y, symbol, size, delay, speed = 12, rotate = false }: {
  x: string; y: string; symbol: string; size: number
  delay: number; speed?: number; rotate?: boolean
}) {
  return (
    <div className="absolute pointer-events-none select-none" style={{
      left: x, top: y, fontSize: size,
      transform: 'translate(-50%,-50%)',
      animation: `loveFloat ${speed + delay * 0.4}s ease-in-out infinite${rotate ? `, loveSpin ${(speed + delay) * 2.2}s linear infinite` : ''}`,
      animationDelay: `${delay}s`,
      filter: 'drop-shadow(0 0 8px rgba(236,72,153,0.4))',
      opacity: 0.55 + (delay % 3) * 0.1,
    }}>
      {symbol}
    </div>
  )
}

// ─── Perspective grid ─────────────────────────────────────────────────────────
function PerspectiveGrid() {
  return (
    <div className="absolute inset-x-0 bottom-0 overflow-hidden pointer-events-none"
      style={{ height: '52%', perspective: '480px', perspectiveOrigin: '50% 0%' }}>
      <div style={{
        position: 'absolute', inset: 0,
        transform: 'rotateX(76deg)', transformOrigin: 'center bottom',
        backgroundImage:
          'linear-gradient(rgba(236,72,153,0.13) 1px, transparent 1px),' +
          'linear-gradient(90deg, rgba(236,72,153,0.13) 1px, transparent 1px)',
        backgroundSize: '56px 56px',
        maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.35) 30%, rgba(0,0,0,0.85) 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.35) 30%, rgba(0,0,0,0.85) 100%)',
      }} />
    </div>
  )
}

// ─── 3-D tilt card ────────────────────────────────────────────────────────────
function TiltCard({ children, className, style }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current; if (!el) return
    const r = el.getBoundingClientRect()
    const rx = ((e.clientY - r.top  - r.height / 2) / (r.height / 2)) * -10
    const ry = ((e.clientX - r.left - r.width  / 2) / (r.width  / 2)) *  10
    el.style.transform = `perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.03) translateZ(8px)`
  }
  const onLeave = () => { if (ref.current) ref.current.style.transform = '' }
  return (
    <div ref={ref} className={`group ${className ?? ''}`}
      style={{ ...style, transition: 'transform 0.12s ease, box-shadow 0.12s ease', transformStyle: 'preserve-3d' }}
      onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </div>
  )
}

// ─── Floating ambient orb ─────────────────────────────────────────────────────
function FloatingOrb({ color, size, x, y, delay }: { color: string; size: number; x: string; y: string; delay: number }) {
  return (
    <div className="absolute rounded-full pointer-events-none" style={{
      width: size, height: size, left: x, top: y,
      background: color, filter: `blur(${size * 0.35}px)`,
      animation: `orbFloat ${6 + delay}s ease-in-out infinite`,
      animationDelay: `${delay}s`, transform: 'translate(-50%,-50%)',
    }} />
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function LandingClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<HeartParticle[]>([])
  const mouseRef = useRef({ x: 0, y: 0 })
  const animFrameRef = useRef<number>(0)
  const counterRef = useRef(0)
  const lastEmitRef = useRef(0)
  const parallaxRefs = useParallax(3)

  const [heroVisible, setHeroVisible] = useState(false)

  // ── Heart SVG path helper ──────────────────────────────────────────────────
  const drawHeart = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.beginPath()
    ctx.moveTo(x, y + size * 0.3)
    ctx.bezierCurveTo(x, y, x - size * 0.5, y, x - size * 0.5, y + size * 0.3)
    ctx.bezierCurveTo(x - size * 0.5, y + size * 0.6, x, y + size * 0.9, x, y + size)
    ctx.bezierCurveTo(x, y + size * 0.9, x + size * 0.5, y + size * 0.6, x + size * 0.5, y + size * 0.3)
    ctx.bezierCurveTo(x + size * 0.5, y, x, y, x, y + size * 0.3)
    ctx.closePath()
  }, [])

  // ── Emit hearts at cursor ─────────────────────────────────────────────────
  const emitHearts = useCallback((cx: number, cy: number) => {
    const count = 3
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1.5 + Math.random() * 2.5
      particlesRef.current.push({
        id: counterRef.current++,
        x: cx + (Math.random() - 0.5) * 20,
        y: cy + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed * 0.6,
        vy: -speed - Math.random() * 1.5,   // mostly upward
        scale: 0.4 + Math.random() * 0.8,
        opacity: 0.9 + Math.random() * 0.1,
        rotation: (Math.random() - 0.5) * 0.8,
        rotationSpeed: (Math.random() - 0.5) * 0.06,
        hue: Math.random() * 30 - 15,       // ±15° around hot-pink (330°)
        life: 1,
      })
    }
    // cap particles
    if (particlesRef.current.length > 280) {
      particlesRef.current = particlesRef.current.slice(-280)
    }
  }, [])

  // ── Animation loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const loop = (ts: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // ─ update + draw each heart ─
      particlesRef.current = particlesRef.current.filter((p) => p.life > 0.01)

      for (const p of particlesRef.current) {
        p.x += p.vx
        p.y += p.vy
        p.vy -= 0.035          // gravity (negative = float up)
        p.vx *= 0.97
        p.vy *= 0.97
        p.rotation += p.rotationSpeed
        p.life -= 0.013

        const size = 10 * p.scale
        const alpha = p.life * p.opacity

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.globalAlpha = alpha

        // Gradient fill: deep pink → hot pink → light pink
        const grad = ctx.createRadialGradient(0, size * 0.4, 0, 0, size * 0.5, size * 1.1)
        grad.addColorStop(0, `hsla(${330 + p.hue}, 100%, 85%, 1)`)
        grad.addColorStop(0.5, `hsla(${320 + p.hue}, 95%, 65%, 1)`)
        grad.addColorStop(1, `hsla(${310 + p.hue}, 90%, 50%, 0.4)`)

        ctx.fillStyle = grad

        // Glow
        ctx.shadowColor = `hsl(${330 + p.hue}, 100%, 70%)`
        ctx.shadowBlur = 12 * p.scale

        drawHeart(ctx, -size * 0.5, -size * 0.5, size)
        ctx.fill()
        ctx.restore()
      }

      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [drawHeart])

  // ── Mouse move handler ────────────────────────────────────────────────────
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
      const now = performance.now()
      if (now - lastEmitRef.current > 30) {   // throttle: emit every 30ms
        emitHearts(e.clientX, e.clientY)
        lastEmitRef.current = now
      }
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [emitHearts])

  // ── Entrance animation ────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      {/* Global keyframe styles */}
      <style>{`
        @keyframes orbFloat {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px) scale(1); }
          33%       { transform: translate(-50%, -50%) translateY(-30px) scale(1.05); }
          66%       { transform: translate(-50%, -50%) translateY(15px) scale(0.97); }
        }
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes rotateY3d {
          from { transform: perspective(900px) rotateY(-12deg) rotateX(4deg); }
          to   { transform: perspective(900px) rotateY(12deg) rotateX(-4deg); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes heartPulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.18); }
        }
        @keyframes floatCard {
          0%, 100% { transform: translateY(0px) rotateX(2deg); }
          50%       { transform: translateY(-14px) rotateX(-2deg); }
        }
        @keyframes ripple {
          0%   { transform: scale(0); opacity: 0.6; }
          100% { transform: scale(4); opacity: 0; }
        }
        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes spin3dXY {
          0%   { transform: rotateX(0deg)   rotateY(0deg)   rotateZ(0deg); }
          33%  { transform: rotateX(120deg) rotateY(120deg) rotateZ(60deg); }
          66%  { transform: rotateX(240deg) rotateY(240deg) rotateZ(120deg); }
          100% { transform: rotateX(360deg) rotateY(360deg) rotateZ(180deg); }
        }
        @keyframes ringBob {
          0%, 100% { transform: translate(-50%,-50%) rotateX(70deg) translateY(0px); }
          50%       { transform: translate(-50%,-50%) rotateX(60deg) translateY(-22px); }
        }
        @keyframes ringRotate {
          from { transform: translate(-50%,-50%) rotateX(70deg) rotateZ(0deg); }
          to   { transform: translate(-50%,-50%) rotateX(70deg) rotateZ(360deg); }
        }
        @keyframes loveFloat {
          0%,100% { transform: translate(-50%,-50%) translateY(0px) scale(1); }
          33%      { transform: translate(-50%,-50%) translateY(-24px) scale(1.08); }
          66%      { transform: translate(-50%,-50%) translateY(12px) scale(0.95); }
        }
        @keyframes loveSpin {
          from { rotate: 0deg; }
          to   { rotate: 360deg; }
        }
        .hero-visible {
          animation: heroFadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .hero-hidden { opacity: 0; }
        .shimmer-text {
          background: linear-gradient(90deg, #f472b6, #ec4899, #db2777, #f9a8d4, #ec4899, #f472b6);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }
        .card-3d {
          transform-style: preserve-3d;
          animation: floatCard 5s ease-in-out infinite;
        }
        .card-3d:nth-child(2) { animation-delay: 1.2s; }
        .card-3d:nth-child(3) { animation-delay: 2.4s; }
        .heart-pulse {
          animation: heartPulse 2s ease-in-out infinite;
        }
        .gradient-bg {
          background: linear-gradient(-45deg, #fffbfe, #fef0f7, #fff9fb, #fdf4ff, #fff5f9, #fffbfe);
          background-size: 400% 400%;
          animation: gradientShift 14s ease infinite;
        }
      `}</style>

      {/* Canvas for hearts */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 999 }}
      />

      {/* Depth particles */}
      <DepthCanvas />

      <div className="gradient-bg min-h-screen overflow-x-hidden cursor-none" style={{ color: '#1a0a14' }}>

        {/* ── Ambient love symbols + orbs ──────────────── */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
          {/* Soft blurred orbs */}
          <FloatingOrb color="radial-gradient(circle,rgba(236,72,153,0.13),transparent)" size={520} x="15%" y="20%" delay={0} />
          <FloatingOrb color="radial-gradient(circle,rgba(168,85,247,0.08),transparent)"  size={400} x="80%" y="60%" delay={2} />
          <FloatingOrb color="radial-gradient(circle,rgba(244,114,182,0.10),transparent)" size={350} x="50%" y="80%" delay={4} />
          <FloatingOrb color="radial-gradient(circle,rgba(139,92,246,0.07),transparent)"  size={300} x="70%" y="10%" delay={1} />
          <FloatingOrb color="radial-gradient(circle,rgba(251,113,133,0.09),transparent)" size={250} x="30%" y="70%" delay={3} />
          {/* Floating love symbols */}
          <FloatingLoveSymbol x="8%"  y="18%" symbol="♥"  size={36} delay={0}   speed={11} />
          <FloatingLoveSymbol x="90%" y="12%" symbol="💕" size={28} delay={1.5} speed={14} />
          <FloatingLoveSymbol x="84%" y="72%" symbol="💘" size={32} delay={3}   speed={12} />
          <FloatingLoveSymbol x="5%"  y="68%" symbol="∞"  size={40} delay={2}   speed={16} rotate />
          <FloatingLoveSymbol x="50%" y="9%"  symbol="💝" size={26} delay={1}   speed={13} />
          <FloatingLoveSymbol x="25%" y="85%" symbol="✨" size={24} delay={0.5} speed={10} rotate />
          <FloatingLoveSymbol x="72%" y="38%" symbol="💖" size={30} delay={2.5} speed={15} />
          <FloatingLoveSymbol x="15%" y="48%" symbol="💗" size={22} delay={4}   speed={18} />
          <FloatingLoveSymbol x="60%" y="92%" symbol="💞" size={28} delay={1.2} speed={11} />
          <FloatingLoveSymbol x="42%" y="32%" symbol="♥"  size={18} delay={3.5} speed={19} rotate />
          <FloatingLoveSymbol x="88%" y="88%" symbol="💓" size={24} delay={0.8} speed={14} />
          <FloatingLoveSymbol x="35%" y="6%"  symbol="💕" size={20} delay={2.2} speed={17} />
        </div>

        {/* ── Custom cursor dot ─────────────────────────────────────────── */}
        <CustomCursor />

        {/* ── Navbar ───────────────────────────────────────────────────────── */}
        <nav className="fixed top-0 w-full z-50" style={{ backdropFilter: 'blur(20px)', background: 'rgba(255,255,255,0.92)', borderBottom: '1px solid rgba(236,72,153,0.18)', boxShadow: '0 1px 24px rgba(236,72,153,0.06)' }}>
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <DriftLogo height={38} />
            <div className="flex items-center gap-3">
              <Link href="/login" className="transition-colors text-sm font-medium px-4 py-2 rounded-full hover:bg-rose-50" style={{ color: '#9f1239' }}>
                Sign in
              </Link>
              <Link href="/register" className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #ec4899, #db2777)', boxShadow: '0 0 20px rgba(236,72,153,0.4)' }}>
                Get started
              </Link>
            </div>
          </div>
        </nav>

        {/* ── Hero Section ─────────────────────────────────────────────────── */}
        <section className="relative min-h-screen flex items-center justify-center px-4 pt-16" style={{ zIndex: 1 }}>
          {/* Perspective grid floor */}
          <PerspectiveGrid />
          {/* River ripple rings */}
          <RiverRipples />

          <div className={`max-w-5xl mx-auto text-center ${heroVisible ? 'hero-visible' : 'hero-hidden'}`}>
            {/* Badge – parallax layer 0 */}
            <div
              ref={el => { parallaxRefs.current[0] = el as HTMLDivElement }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs font-semibold tracking-wider uppercase"
              style={{ background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.25)', color: '#be185d' }}>
              <Sparkles size={12} />
              The Drift Effect — A new kind of connection
            </div>

            {/* Title – parallax layer 1 */}
            <div ref={el => { parallaxRefs.current[1] = el as HTMLDivElement }}>
              <h1 className="text-6xl sm:text-7xl md:text-8xl font-bold mb-6 leading-[0.9] tracking-tight">
                Stop swiping.
                <br />
                <span className="shimmer-text">Start Drifting.</span>
              </h1>
            </div>

            <p className="text-lg sm:text-xl mb-12 max-w-2xl mx-auto leading-relaxed font-light" style={{ color: 'rgba(30,5,18,0.5)' }}>
              Match with people who share what you love — and what you can't stand.
              Live activity feed. Temporary matches. Real-world sparks.
            </p>

            {/* CTA – parallax layer 2 (fastest) */}
            <div
              ref={el => { parallaxRefs.current[2] = el as HTMLDivElement }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link href="/register"
                className="group relative inline-flex items-center gap-3 px-10 py-4 rounded-full font-bold text-lg transition-all hover:scale-105 active:scale-95 overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #f472b6, #ec4899, #db2777)', color: 'white', boxShadow: '0 0 40px rgba(236,72,153,0.5), 0 0 80px rgba(236,72,153,0.2)' }}>
                <span className="relative z-10">Start drifting free</span>
                <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, #fb7185, #f472b6, #ec4899)' }} />
              </Link>
              <Link href="#how-it-works"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-medium text-sm transition-all hover:scale-105"
                style={{ border: '1px solid rgba(236,72,153,0.3)', color: '#9f1239', backdropFilter: 'blur(10px)' }}>
                How it works
              </Link>
            </div>

            {/* Floating 3D cards preview */}
            <div className="mt-20 grid grid-cols-3 gap-4 max-w-2xl mx-auto perspective-1000">
              <FloatingPreviewCard icon="🎵" label="Music lovers" delay={0} />
              <FloatingPreviewCard icon="💀" label="Hates mornings" delay={1} />
              <FloatingPreviewCard icon="🌊" label="Beach dwellers" delay={2} />
            </div>
          </div>
        </section>

        {/* ── Stats strip ──────────────────────────────────────────────────── */}
        <section className="py-12 px-4 relative" style={{ zIndex: 1, background: 'rgba(236,72,153,0.04)', borderTop: '1px solid rgba(236,72,153,0.12)', borderBottom: '1px solid rgba(236,72,153,0.12)' }}>
          <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
            {[
              { value: '2×', label: 'Deeper compatibility' },
              { value: '24h', label: 'Match window' },
              { value: '0', label: 'Mindless swiping' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-4xl font-black mb-1 shimmer-text">{s.value}</div>
                <div className="text-sm tracking-wide" style={{ color: 'rgba(30,5,18,0.45)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────────────────── */}
        <section id="how-it-works" className="py-28 px-4 relative" style={{ zIndex: 1 }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">How The Drift Effect works</h2>
              <p className="max-w-xl mx-auto text-lg" style={{ color: 'rgba(30,5,18,0.45)' }}>Three simple steps to find people worth actually meeting.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: <Users size={28} />, step: '01', title: 'Build your vibe', desc: "Tell us what you're into and what you genuinely can't stand. Both matter equally.", color: '#a855f7' },
                { icon: <Zap size={28} />, step: '02', title: 'Post your drift', desc: "Share what you're doing right now. Coffee shop? Late night run? The feed is live.", color: '#f59e0b' },
                { icon: <Heart size={28} />, step: '03', title: 'Match & connect', desc: 'If you both share a like AND a dislike, a match opens. 24 hours to make it real.', color: '#ec4899' },
              ].map((item, i) => (
                <TiltCard key={item.step}
                  className="card-3d rounded-2xl p-7 relative overflow-hidden"
                  style={{ background: `rgba(255,255,255,0.9)`, border: `1px solid ${item.color}25`, backdropFilter: 'blur(12px)', animationDelay: `${i * 1.2}s`, boxShadow: `0 4px 20px ${item.color}10` }}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                    style={{ background: `radial-gradient(circle at 50% 0%, ${item.color}15, transparent 70%)` }} />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-5">
                      <div className="p-3 rounded-xl" style={{ background: `${item.color}20`, color: item.color }}>{item.icon}</div>
                      <span className="text-6xl font-black" style={{ color: `${item.color}15` }}>{item.step}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(30,5,18,0.5)' }}>{item.desc}</p>
                  </div>
                </TiltCard>
              ))}
            </div>
          </div>
        </section>

        {/* ── Shared dislikes section ─────────────────────────────────────── */}
        <section className="py-24 px-4 relative" style={{ zIndex: 1 }}>
          <div className="max-w-3xl mx-auto text-center">
            <div className="heart-pulse inline-block mb-6">
              <Heart size={48} className="fill-pink-500 text-pink-500" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 tracking-tight">
              The only app where hating the same things{' '}
              <span className="shimmer-text">actually matters</span>
            </h2>
            <p className="text-lg mb-12 leading-relaxed" style={{ color: 'rgba(30,5,18,0.5)' }}>
              Science shows shared dislikes build stronger bonds than shared likes. DRIFT is the first app built around that insight.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 text-left">
              {[
                { icon: '✦', color: '#4ade80', colorBg: 'rgba(74,222,128,0.1)', label: 'Shared likes', desc: 'Start the spark. Shared passions tell you where to go.' },
                { icon: '✕', color: '#f472b6', colorBg: 'rgba(244,114,182,0.1)', label: 'Shared dislikes', desc: 'Cement the bond. Shared pet peeves keep you together.' },
              ].map((item) => (
                <TiltCard key={item.label} className="rounded-2xl p-6" style={{ background: item.colorBg, border: `1px solid ${item.color}30` }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: item.colorBg, color: item.color, border: `1px solid ${item.color}40` }}>{item.icon}</div>
                    <span className="font-bold" style={{ color: item.color }}>{item.label}</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(30,5,18,0.55)' }}>{item.desc}</p>
                </TiltCard>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA footer ───────────────────────────────────────────────────── */}
        <section className="py-28 px-4 relative text-center" style={{ zIndex: 1 }}>
          <div className="max-w-2xl mx-auto">
            <div className="text-6xl mb-6">💘</div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
              Ready to <span className="shimmer-text">drift</span>?
            </h2>
            <p className="mb-10 text-lg" style={{ color: 'rgba(30,5,18,0.5)' }}>Join thousands already finding their kind of people.</p>
            <Link href="/register"
              className="inline-flex items-center gap-3 px-12 py-5 rounded-full font-black text-xl text-white transition-all hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #f472b6, #ec4899, #db2777)', boxShadow: '0 0 60px rgba(236,72,153,0.5), 0 0 120px rgba(236,72,153,0.2)' }}>
              Get started — it's free
              <ArrowRight size={22} />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 text-center text-sm border-t" style={{ borderColor: 'rgba(236,72,153,0.12)', zIndex: 1, position: 'relative', color: 'rgba(30,5,18,0.3)' }}>
          © 2026 DRIFT — Find your frequency.
        </footer>
      </div>
    </>
  )
}

// ─── Custom cursor — heart only ───────────────────────────────────────────────
function CustomCursor() {
  const heartRef = useRef<HTMLDivElement>(null)
  const posRef   = useRef({ x: -100, y: -100 })
  const rafRef   = useRef<number>(0)

  useEffect(() => {
    const onMove = (e: MouseEvent) => { posRef.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener('mousemove', onMove)
    const animate = () => {
      if (heartRef.current) {
        heartRef.current.style.left = `${posRef.current.x}px`
        heartRef.current.style.top  = `${posRef.current.y}px`
      }
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(rafRef.current) }
  }, [])

  return (
    <div ref={heartRef} className="fixed pointer-events-none select-none" style={{ zIndex: 9999, transform: 'translate(-50%, -50%)' }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402C1 4.144 2.992 2 6.007 2c1.951 0 3.817 1.038 4.993 2.628C12.18 3.038 14.045 2 15.994 2 19.012 2 21 4.148 21 7.191c0 4.106-5.367 8.863-9 12.402z"
          fill="#ec4899" stroke="#db2777" strokeWidth="0.5"/>
      </svg>
    </div>
  )
}

// ─── River ripple rings (ambient) ─────────────────────────────────────────────
function RiverRipples() {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="absolute rounded-full"
          style={{
            width: 120 * i,
            height: 120 * i,
            border: '1px solid rgba(236,72,153,0.08)',
            animation: `ripple ${3 + i * 0.8}s ease-out infinite`,
            animationDelay: `${i * 0.6}s`,
          }} />
      ))}
    </div>
  )
}

// ─── Floating preview card ────────────────────────────────────────────────────
function FloatingPreviewCard({ icon, label, delay }: { icon: string; label: string; delay: number }) {
  const cardRef = useRef<HTMLDivElement>(null)

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current; if (!el) return
    const r  = el.getBoundingClientRect()
    const rx = ((e.clientY - r.top  - r.height / 2) / (r.height / 2)) * -16
    const ry = ((e.clientX - r.left - r.width  / 2) / (r.width  / 2)) *  16
    el.style.transform = `perspective(500px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.1) translateZ(22px)`
    el.style.boxShadow = '0 22px 55px rgba(236,72,153,0.28), 0 4px 16px rgba(0,0,0,0.08)'
  }

  const onLeave = () => {
    if (cardRef.current) { cardRef.current.style.transform = ''; cardRef.current.style.boxShadow = '' }
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="rounded-2xl px-4 py-5 text-center relative overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.92)',
        border: '1px solid rgba(236,72,153,0.25)',
        backdropFilter: 'blur(12px)',
        animation: `floatCard ${4 + delay}s ease-in-out infinite`,
        animationDelay: `${delay * 0.8}s`,
        transformStyle: 'preserve-3d',
        boxShadow: '0 4px 24px rgba(236,72,153,0.12), 0 1px 4px rgba(0,0,0,0.06)',
        transition: 'transform 0.1s ease, box-shadow 0.1s ease',
        cursor: 'default',
      }}>
      <div className="text-3xl mb-2" style={{ display: 'block', transform: 'translateZ(20px)' }}>{icon}</div>
      <div className="text-xs font-semibold" style={{ color: '#7f1d4b', display: 'block', transform: 'translateZ(12px)' }}>{label}</div>
    </div>
  )
}

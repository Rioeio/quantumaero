import { useEffect, useRef } from 'react'

export interface CanvasViewportProps {
  airfoil: string
  alpha: number
  reynolds: number
  airspeed: number
  viewMode: string
  isRunning: boolean
  CL: number
  CD: number
  LD: number
  turbulenceRisk: number
  stallWarning: boolean
  theme: 'green' | 'amber' | 'synthwave'
}

/* ─── NACA 4-digit geometry (cosine spacing) ─── */
function nacaProfile(name: string): [number, number][] {
  let m = 0, p = 0, t = 0.12
  if (name.includes('4412')) { m = 0.04; p = 0.4; t = 0.12 }
  else if (name.includes('64A')) { m = 0.02; p = 0.4; t = 0.15 }
  else if (name.includes('Delta')) { m = 0.02; p = 0.3; t = 0.055 }

  const N = 80
  const upper: [number, number][] = []
  const lower: [number, number][] = []
  for (let i = 0; i <= N; i++) {
    const x = (1 - Math.cos((i / N) * Math.PI)) / 2
    const yt = 5 * t * (0.2969 * Math.sqrt(x + 1e-9) - 0.126 * x - 0.3516 * x ** 2 + 0.2843 * x ** 3 - 0.1015 * x ** 4)
    const yc = p > 0
      ? (x < p ? (m / p ** 2) * (2 * p * x - x ** 2) : (m / (1 - p) ** 2) * (1 - 2 * p + 2 * p * x - x ** 2))
      : 0
    upper.push([x, yc + yt])
    lower.push([x, yc - yt])
  }
  return [...upper, ...[...lower].reverse()]
}

/* ─── Potential flow velocity calculation ─── */
function flowVel(px: number, py: number, aoaDeg: number, Uinf: number, CL: number): [number, number] {
  const R = 0.155
  const cx = 0.26
  const dx = px - cx, dy = py
  const r2 = dx * dx + dy * dy + 1e-12
  if (r2 < R * R * 0.72) return [0, 0]
  const R2 = R * R, r4 = r2 * r2
  const ca = Math.cos(aoaDeg * Math.PI / 180)
  const sa = Math.sin(aoaDeg * Math.PI / 180)
  const A = 1 - R2 * (dx * dx - dy * dy) / r4
  const B = 2 * R2 * dx * dy / r4
  const Gamma = Math.PI * Math.max(0, CL) * Uinf * 0.14
  const u = Uinf * (A * ca + B * sa) + Gamma * dy / (2 * Math.PI * r2)
  const v = -Uinf * (B * ca - A * sa) - Gamma * dx / (2 * Math.PI * r2)
  return [u, v]
}

/* ─── Pressure coefficient ─── */
function calcCp(px: number, py: number, aoaDeg: number, Uinf: number, CL: number): number {
  const [u, v] = flowVel(px, py, aoaDeg, Uinf, CL)
  return 1 - (u * u + v * v) / (Uinf * Uinf + 1e-9)
}

/* ─── QML turbulence probability ─── */
function calcTurbP(px: number, py: number, aoaDeg: number): number {
  const trailDist = (px - 1) ** 2 + py ** 2
  const upper = py > 0 ? 1.6 : 0.35
  const stall = Math.max(0, (aoaDeg - 7) / 16)
  return Math.min(1, 0.03 + stall * 0.72 + Math.exp(-trailDist * 4.5) * upper * 0.65)
}

/* ─── Particle state ─── */
interface Particle { x: number; y: number; trail: [number, number][]; speed: number }
const N_PARTICLES = 160, TRAIL = 16

function spawnParticle(i: number): Particle {
  return {
    x: -0.38 + Math.random() * 0.04,
    y: -0.53 + (i / N_PARTICLES) * 1.06 + (Math.random() - 0.5) * 0.06,
    trail: [],
    speed: 0.72 + Math.random() * 0.56,
  }
}

export default function CanvasViewport(props: CanvasViewportProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const propsRef = useRef(props)
  const particles = useRef<Particle[]>([])
  const rafRef = useRef(0)

  useEffect(() => { propsRef.current = props })

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    particles.current = Array.from({ length: N_PARTICLES }, (_, i) => spawnParticle(i))

    function frame() {
      const { airfoil, alpha: aoaDeg, airspeed, viewMode, isRunning, CL, stallWarning, theme } = propsRef.current
      const Uinf = airspeed / 60

      // Color Theme Tokens
      let mainColor = '#00ffaa'
      let glowColor = 'rgba(0, 255, 170, 0.4)'
      let bgColor = '#030a06'

      if (theme === 'amber') {
        mainColor = '#ffaa00'
        glowColor = 'rgba(255, 170, 0, 0.4)'
        bgColor = '#0c0702'
      } else if (theme === 'synthwave') {
        mainColor = '#ff007f'
        glowColor = 'rgba(255, 0, 128, 0.4)'
        bgColor = '#08030c'
      }

      /* ── Canvas sizing ── */
      const rect = canvas.getBoundingClientRect()
      const W = Math.round(rect.width), H = Math.round(rect.height)
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W; canvas.height = H
      }

      const xRange = 1.9, yRange = 1.1
      const scale = Math.min(W / xRange, H / yRange) * 0.88
      const ox = W / 2 - 0.35 * scale
      const oy = H / 2

      const toX = (nx: number) => nx * scale + ox
      const toY = (ny: number) => -ny * scale + oy

      /* ── Clear CRT Screen ── */
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, W, H)

      /* ── Retro Oscilloscope Grid ── */
      const gs = 0.1 * scale
      ctx.strokeStyle = glowColor
      ctx.lineWidth = 0.5
      ctx.globalAlpha = 0.15

      for (let x = ((ox % gs) + gs) % gs; x <= W; x += gs) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
      }
      for (let y = ((oy % gs) + gs) % gs; y <= H; y += gs) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
      }
      ctx.globalAlpha = 1.0

      /* Center Reticle Crosshair */
      ctx.strokeStyle = mainColor
      ctx.lineWidth = 0.8
      ctx.setLineDash([4, 4])
      ctx.beginPath(); ctx.moveTo(toX(-0.3), toY(0)); ctx.lineTo(toX(1.35), toY(0)); ctx.stroke()
      ctx.setLineDash([])

      /* ── Heatmap Modes (Vector CRT Shader simulation) ── */
      if (viewMode === 'pressure' || viewMode === 'turbulence') {
        const step = 8
        for (let py = 0; py < H; py += step) {
          for (let px = 0; px < W; px += step) {
            const nx = (px - ox) / scale
            const ny = -(py - oy) / scale

            if (nx > -0.35 && nx < 1.45 && Math.abs(ny) < 0.55) {
              if (viewMode === 'pressure') {
                const cp = calcCp(nx, ny, aoaDeg, Uinf, CL)
                if (cp < -0.2) {
                  ctx.fillStyle = mainColor
                  ctx.globalAlpha = Math.min(0.35, Math.abs(cp) * 0.12)
                  ctx.fillRect(px, py, step - 1, step - 1)
                }
              } else if (viewMode === 'turbulence') {
                const tp = calcTurbP(nx, ny, aoaDeg)
                if (tp > 0.15) {
                  ctx.fillStyle = tp > 0.5 ? '#ff3366' : mainColor
                  ctx.globalAlpha = tp * 0.4
                  ctx.fillRect(px, py, step - 1, step - 1)
                }
              }
            }
          }
        }
        ctx.globalAlpha = 1.0
      }

      /* ── Quantum Walk Overlay ── */
      if (viewMode === 'quantumwalk') {
        const t = Date.now() / 600
        ctx.strokeStyle = mainColor
        ctx.shadowColor = mainColor
        ctx.shadowBlur = 8
        ctx.lineWidth = 1.5
        ctx.beginPath()

        for (let i = 0; i < 100; i++) {
          const nx = -0.3 + (i / 100) * 1.6
          const wave = Math.sin(i * 0.25 + t) * Math.exp(-((nx - 0.4) ** 2) * 2.0) * 0.25
          const cx = toX(nx)
          const cy = toY(wave)
          if (i === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy)
        }
        ctx.stroke()
        ctx.shadowBlur = 0
      }

      /* ── Airfoil Geometry (Vector Wireframe) ── */
      const pts = nacaProfile(airfoil)
      ctx.save()
      ctx.translate(toX(0.25), toY(0))
      ctx.rotate(-aoaDeg * Math.PI / 180)
      ctx.translate(-toX(0.25), -toY(0))

      ctx.beginPath()
      pts.forEach(([x, y], i) => {
        const cx = toX(x), cy = toY(y)
        if (i === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy)
      })
      ctx.closePath()

      // Airfoil Fill
      ctx.fillStyle = bgColor
      ctx.fill()

      // Glowing Vector Outline
      ctx.shadowColor = mainColor
      ctx.shadowBlur = 12
      ctx.strokeStyle = mainColor
      ctx.lineWidth = 2.0
      ctx.stroke()
      ctx.shadowBlur = 0

      // Leading & Trailing Edge Nodes
      ctx.beginPath(); ctx.arc(toX(0), toY(0), 4, 0, Math.PI * 2)
      ctx.fillStyle = mainColor; ctx.fill()

      ctx.restore()

      /* ── Flow Particles (Vector Phosphor Traces) ── */
      if (isRunning) {
        particles.current.forEach((p, pi) => {
          const [u, v] = flowVel(p.x, p.y, aoaDeg, Uinf, CL)
          p.trail.push([p.x, p.y])
          if (p.trail.length > TRAIL) p.trail.shift()
          p.x += u * 0.017 * p.speed
          p.y += v * 0.017 * p.speed

          if (p.x > 1.45 || p.x < -0.42 || Math.abs(p.y) > 0.56) {
            Object.assign(p, spawnParticle(pi)); return
          }
          const R2c = 0.155 * 0.155 * 0.58
          if ((p.x - 0.26) ** 2 + p.y ** 2 < R2c) {
            Object.assign(p, spawnParticle(pi)); return
          }
        })
      }

      particles.current.forEach(p => {
        if (p.trail.length < 2) return
        ctx.beginPath()
        ctx.moveTo(toX(p.trail[0][0]), toY(p.trail[0][1]))
        for (let i = 1; i < p.trail.length; i++) {
          ctx.lineTo(toX(p.trail[i][0]), toY(p.trail[i][1]))
        }
        ctx.strokeStyle = mainColor
        ctx.lineWidth = 1.0
        ctx.globalAlpha = 0.6
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(toX(p.x), toY(p.y), 1.8, 0, Math.PI * 2)
        ctx.fillStyle = mainColor
        ctx.globalAlpha = 0.9
        ctx.fill()
      })
      ctx.globalAlpha = 1.0

      /* ── Vector Telemetry Labels ── */
      ctx.font = '14px VT323, monospace'
      ctx.fillStyle = mainColor
      ctx.fillText(`AIRFOIL: ${airfoil.toUpperCase()}`, 16, 26)
      ctx.fillText(`ALPHA: ${aoaDeg.toFixed(1)} DEG`, 16, 44)
      ctx.fillText(`MACH: ${(airspeed / 340).toFixed(3)}`, 16, 62)

      /* ── Stall Alarm Warning ── */
      if (stallWarning) {
        const flash = Math.sin(Date.now() / 150) > 0
        if (flash) {
          ctx.fillStyle = '#ff3366'
          ctx.font = 'bold 20px VT323, monospace'
          ctx.textAlign = 'center'
          ctx.fillText('! WARNING: SEPARATION STALL DETECTED !', W / 2, 40)
          ctx.textAlign = 'left'
        }
      }

      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const { CL, CD, LD, turbulenceRisk } = props

  return (
    <div className="relative w-full h-full bg-[#030a06] crt-overlay">
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Retro VFD Telemetry HUD Cards */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 font-mono text-xs">
        <RetroHudBox label="LIFT (C_L)" value={CL.toFixed(3)} />
        <RetroHudBox label="DRAG (C_D)" value={CD.toFixed(4)} />
        <RetroHudBox label="L/D RATIO" value={LD.toFixed(2)} highlight />
        <RetroHudBox label="P_TURB RISK" value={`${turbulenceRisk.toFixed(0)}%`} alert={turbulenceRisk > 60} />
      </div>
    </div>
  )
}

function RetroHudBox({ label, value, highlight, alert }: { label: string; value: string; highlight?: boolean; alert?: boolean }) {
  return (
    <div className={`px-3 py-1.5 border bg-black/80 backdrop-blur-md min-w-[110px] ${
      alert ? 'border-red-500 text-red-500 shadow-[0_0_10px_#ff0033]' : highlight ? 'border-[var(--phosphor-main)] text-[var(--phosphor-main)] shadow-[0_0_10px_var(--phosphor-main)]' : 'border-[var(--border-crt)] text-[var(--phosphor-main)]'
    }`}>
      <div className="text-[10px] opacity-70 tracking-widest">{label}</div>
      <div className="text-base font-bold font-mono tracking-wider">{value}</div>
    </div>
  )
}

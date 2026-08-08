import { useState, useEffect } from 'react'
import CanvasViewport from './components/CanvasViewport'
import ControlsSidebar from './components/ControlsSidebar'
import BottomPanel from './components/BottomPanel'
import { retroAudio } from './utils/retroAudio'

const AIRFOIL_PRESETS = [
  'NACA 4412',
  'NACA 0012',
  'NACA 64A215',
  'Delta Wing',
]

export default function App() {
  // Retro Aesthetics State
  const [theme, setTheme] = useState<'green' | 'amber' | 'synthwave'>('green')
  const [scanlines, setScanlines] = useState<boolean>(true)
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true)

  // Aerodynamic parameters
  const [airfoil, setAirfoil] = useState('NACA 4412')
  const [alpha, setAlpha] = useState(4.0)
  const [reynolds, setReynolds] = useState(1500000)
  const [airspeed, setAirspeed] = useState(60)

  // QML Parameters
  const [vqcAnsatz, setVqcAnsatz] = useState('StronglyEntangling')
  const [qubits, setQubits] = useState(4)
  const [circuitDepth, setCircuitDepth] = useState(3)

  // Visualizer controls
  const [viewMode, setViewMode] = useState<'streamlines' | 'pressure' | 'turbulence' | 'quantumwalk'>('turbulence')
  const [isRunning, setIsRunning] = useState(true)
  const [activeTab, setActiveTab] = useState(0)

  // Training state
  const [isTraining, setIsTraining] = useState(false)
  const [trainEpoch, setTrainEpoch] = useState(0)
  const [lossHistory, setLossHistory] = useState<{ vqc: number; classical: number }[]>([])

  // Apply Theme CSS class to body
  useEffect(() => {
    document.body.className = `theme-${theme}`
  }, [theme])

  // Sync audio toggle
  useEffect(() => {
    retroAudio.enabled = audioEnabled
  }, [audioEnabled])

  // Derived aerodynamic forces
  const radA = (alpha * Math.PI) / 180
  const isStalled = alpha > 14
  const baseCL = 2 * Math.PI * (radA + 0.07)
  const CL = isStalled ? baseCL * Math.exp(-0.15 * (alpha - 14)) : baseCL
  const Cf = 0.074 / Math.pow(reynolds, 0.2)
  const CD = Math.max(0.005, 2 * Cf * 1.24 + (CL * CL) / (Math.PI * 6.0 * 0.85) + (isStalled ? 0.08 * (alpha - 14) ** 1.5 : 0))
  const LD = CL / CD
  const turbulenceRisk = Math.min(99, Math.max(2, 15 + 1.2 * Math.max(0, alpha) + 10 * Math.log10(reynolds / 1e5) + (isStalled ? 45 : 0)))

  // Live training effect
  const handleTrain = () => {
    setIsTraining(true)
    setTrainEpoch(0)
    setLossHistory([])

    let epoch = 0
    let vqcLoss = 0.48
    let nnLoss = 0.55

    const interval = setInterval(() => {
      epoch++
      vqcLoss *= 0.88 + (Math.random() - 0.5) * 0.04
      nnLoss *= 0.93 + (Math.random() - 0.5) * 0.03

      setTrainEpoch(epoch)
      setLossHistory(prev => [...prev, { vqc: parseFloat(vqcLoss.toFixed(4)), classical: parseFloat(nnLoss.toFixed(4)) }])

      if (epoch >= 50) {
        clearInterval(interval)
        setIsTraining(false)
      }
    }, 60)
  }

  return (
    <div
      className={`grid grid-rows-[42px_1fr_200px] w-screen h-screen bg-[var(--bg-crt)] overflow-hidden font-mono ${
        scanlines ? 'crt-scanlines' : ''
      }`}
    >
      {/* ── Retro CRT Header Bar ── */}
      <header className="bg-[var(--surface-crt)] border-b border-[var(--border-crt)] flex items-center justify-between px-4 z-50 text-xs">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-[var(--phosphor-main)] text-black font-bold flex items-center justify-center text-xs shadow-[0_0_10px_var(--phosphor-main)]">
            Q
          </div>
          <span className="font-bold tracking-widest text-[var(--phosphor-main)] text-sm glow-text">
            QUANTUM-AERO // MARK-IV TERMINAL
          </span>
          <span className="text-[10px] opacity-60">SYS.REV-1984.08</span>
        </div>

        {/* Profile presets */}
        <div className="flex items-center gap-2">
          <span className="opacity-70 text-[10px]">PROFILE:</span>
          {AIRFOIL_PRESETS.map(p => (
            <button
              key={p}
              onClick={() => {
                retroAudio.playClick()
                setAirfoil(p)
              }}
              className={`px-2 py-0.5 border text-[10px] font-bold transition-all cursor-pointer ${
                airfoil === p
                  ? 'bg-[var(--phosphor-main)] text-black border-[var(--phosphor-main)]'
                  : 'bg-black text-[var(--phosphor-main)] border-[var(--border-crt)] opacity-70 hover:opacity-100'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Retro Palette & CRT Toggles */}
        <div className="flex items-center gap-3">
          <select
            value={theme}
            onChange={(e) => {
              retroAudio.playSwitch()
              setTheme(e.target.value as any)
            }}
            className="bg-black border border-[var(--border-crt)] text-[var(--phosphor-main)] text-[10px] px-2 py-0.5 outline-none cursor-pointer font-mono"
          >
            <option value="green">PHOSPHOR GREEN</option>
            <option value="amber">AMBER COMMAND</option>
            <option value="synthwave">SYNTHWAVE CYBER</option>
          </select>

          <button
            onClick={() => {
              retroAudio.playSwitch()
              setScanlines(!scanlines)
            }}
            className={`px-2 py-0.5 border text-[10px] font-bold cursor-pointer ${
              scanlines ? 'bg-[var(--phosphor-main)] text-black' : 'bg-black text-[var(--phosphor-main)] border-[var(--border-crt)]'
            }`}
          >
            CRT SCANLINES
          </button>

          <button
            onClick={() => {
              setAudioEnabled(!audioEnabled)
              retroAudio.playClick()
            }}
            className={`px-2 py-0.5 border text-[10px] font-bold cursor-pointer ${
              audioEnabled ? 'bg-[var(--phosphor-main)] text-black' : 'bg-black text-[var(--phosphor-main)] border-[var(--border-crt)]'
            }`}
          >
            {audioEnabled ? 'AUDIO ON' : 'AUDIO MUTE'}
          </button>

          <button
            onClick={() => {
              retroAudio.playSwitch()
              setIsRunning(!isRunning)
            }}
            className="px-3 py-0.5 border border-[var(--border-crt)] bg-black text-[var(--phosphor-main)] font-bold text-[10px] cursor-pointer hover:bg-[var(--phosphor-main)] hover:text-black"
          >
            {isRunning ? '⏸ PAUSE' : '▶ RUN'}
          </button>
        </div>
      </header>

      {/* ── Main Viewport (Sidebar + Canvas) ── */}
      <div className="grid grid-cols-[250px_1fr] overflow-hidden">
        <ControlsSidebar
          alpha={alpha} setAlpha={setAlpha}
          reynolds={reynolds} setReynolds={setReynolds}
          airspeed={airspeed} setAirspeed={setAirspeed}
          vqcAnsatz={vqcAnsatz} setVqcAnsatz={setVqcAnsatz}
          qubits={qubits} setQubits={setQubits}
          circuitDepth={circuitDepth} setCircuitDepth={setCircuitDepth}
          viewMode={viewMode} setViewMode={setViewMode}
          isTraining={isTraining} trainEpoch={trainEpoch}
          onTrain={handleTrain}
        />

        <CanvasViewport
          airfoil={airfoil}
          alpha={alpha}
          reynolds={reynolds}
          airspeed={airspeed}
          viewMode={viewMode}
          isRunning={isRunning}
          CL={CL}
          CD={CD}
          LD={LD}
          turbulenceRisk={turbulenceRisk}
          stallWarning={isStalled}
          theme={theme}
        />
      </div>

      {/* ── Bottom Telemetry & QML Panel ── */}
      <BottomPanel
        activeTab={activeTab} setActiveTab={setActiveTab}
        qubits={qubits} circuitDepth={circuitDepth} vqcAnsatz={vqcAnsatz}
        lossHistory={lossHistory}
        alpha={alpha} airfoil={airfoil}
        CL={CL} CD={CD} LD={LD}
      />
    </div>
  )
}

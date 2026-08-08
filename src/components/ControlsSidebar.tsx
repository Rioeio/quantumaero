import type { Dispatch, SetStateAction } from 'react'
import { retroAudio } from '../utils/retroAudio'

interface Props {
  alpha: number; setAlpha: Dispatch<SetStateAction<number>>
  reynolds: number; setReynolds: Dispatch<SetStateAction<number>>
  airspeed: number; setAirspeed: Dispatch<SetStateAction<number>>
  vqcAnsatz: string; setVqcAnsatz: Dispatch<SetStateAction<string>>
  qubits: number; setQubits: Dispatch<SetStateAction<number>>
  circuitDepth: number; setCircuitDepth: Dispatch<SetStateAction<number>>
  viewMode: string; setViewMode: Dispatch<SetStateAction<any>>
  isTraining: boolean; trainEpoch: number
  onTrain: () => void
}

function fmtRe(re: number): string {
  if (re >= 1e6) return `${(re / 1e6).toFixed(2)}M`
  return `${(re / 1e3).toFixed(0)}K`
}

function RetroSlider({
  label, unit, value, min, max, step = 0.1, fmt,
  onChange,
}: {
  label: string; unit: string; value: number; min: number; max: number; step?: number
  fmt?: (v: number) => string; onChange: (v: number) => void
}) {
  const display = fmt ? fmt(value) : value.toFixed(step < 1 ? 1 : 0)
  return (
    <div className="flex flex-col gap-1.5 font-mono text-xs">
      <div className="flex justify-between items-baseline">
        <span className="opacity-70 text-[11px] uppercase tracking-wider">{label}</span>
        <span className="font-bold text-sm text-[var(--phosphor-main)]">
          {display}{unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => {
          retroAudio.playClick();
          onChange(Number(e.target.value))
        }}
        className="w-full accent-[var(--phosphor-main)] cursor-pointer"
      />
    </div>
  )
}

const VIEW_MODES = [
  { id: 'streamlines', label: 'STREAMLINES' },
  { id: 'pressure', label: 'PRESS. CP' },
  { id: 'turbulence', label: 'QML TURB.' },
  { id: 'quantumwalk', label: 'Q-WALK' },
]

const ANSATZ_OPTIONS = ['RealAmplitudes', 'StronglyEntangling', 'Physics-Informed (QPINN)']

export default function ControlsSidebar(props: Props) {
  const { alpha, reynolds, airspeed, vqcAnsatz, qubits, circuitDepth, viewMode, isTraining, trainEpoch } = props

  return (
    <div className="bg-[var(--surface-crt)] border-r border-[var(--border-crt)] flex flex-col h-full overflow-y-auto p-3 gap-4 font-mono">
      {/* ── Section: Aerodynamic Controls ── */}
      <RetroSection label="[ AERODYNAMIC CONSTRAINTS ]">
        <RetroSlider
          label="ALPHA (AoA)"
          unit="°"
          value={alpha} min={-5} max={20} step={0.5}
          onChange={props.setAlpha}
        />
        <RetroSlider
          label="REYNOLDS (Re)"
          unit=""
          value={reynolds} min={100000} max={5000000} step={50000}
          fmt={fmtRe}
          onChange={props.setReynolds}
        />
        <RetroSlider
          label="AIRSPEED (V_INF)"
          unit=" m/s"
          value={airspeed} min={10} max={150} step={1}
          fmt={v => v.toFixed(0)}
          onChange={props.setAirspeed}
        />
      </RetroSection>

      {/* ── Section: QML Registers ── */}
      <RetroSection label="[ QML REGISTER CONFIG ]">
        <div className="flex flex-col gap-1 text-xs">
          <span className="opacity-70 text-[10px] uppercase">ANSATZ TOPOLOGY</span>
          <select
            value={vqcAnsatz}
            onChange={e => {
              retroAudio.playSwitch();
              props.setVqcAnsatz(e.target.value)
            }}
            className="bg-black border border-[var(--border-crt)] text-[var(--phosphor-main)] p-1 text-xs font-mono outline-none cursor-pointer"
          >
            {ANSATZ_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <RetroSlider label="QUBITS (N)" unit="" value={qubits} min={2} max={6} step={1} fmt={v => v.toFixed(0)} onChange={props.setQubits} />
        <RetroSlider label="DEPTH (L)" unit="" value={circuitDepth} min={1} max={6} step={1} fmt={v => v.toFixed(0)} onChange={props.setCircuitDepth} />

        <button
          disabled={isTraining}
          onClick={() => {
            retroAudio.playBeep();
            props.onTrain();
          }}
          className={`w-full mt-2 py-2 border font-bold text-xs tracking-widest transition-all cursor-pointer ${
            isTraining ? 'bg-black text-amber-400 border-amber-400 animate-pulse' : 'bg-black border-[var(--phosphor-main)] text-[var(--phosphor-main)] hover:bg-[var(--phosphor-main)] hover:text-black shadow-[0_0_10px_var(--phosphor-main)]'
          }`}
        >
          {isTraining ? `[ EXECUTING... ${trainEpoch}/50 ]` : '[ EXECUTE QML OPTIMIZE ]'}
        </button>
      </RetroSection>

      {/* ── Section: Visualization Mode ── */}
      <RetroSection label="[ DISPLAY MODE SELECT ]">
        <div className="grid grid-cols-2 gap-2">
          {VIEW_MODES.map(m => (
            <button
              key={m.id}
              onClick={() => {
                retroAudio.playSwitch();
                props.setViewMode(m.id);
              }}
              className={`py-1.5 px-2 border text-[11px] font-bold tracking-wider transition-all cursor-pointer ${
                viewMode === m.id
                  ? 'bg-[var(--phosphor-main)] text-black border-[var(--phosphor-main)] shadow-[0_0_10px_var(--phosphor-main)]'
                  : 'bg-black text-[var(--phosphor-main)] border-[var(--border-crt)] opacity-70 hover:opacity-100'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </RetroSection>

      <div className="mt-auto pt-2 border-t border-[var(--border-crt)] text-[10px] opacity-60">
        <div>SYS.SYSSTATUS: OK</div>
        <div>VQC REGISTER: READY</div>
        <div>CLOCK: 8080-REV4</div>
      </div>
    </div>
  )
}

function RetroSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 border border-[var(--border-crt)] p-2.5 bg-black/40">
      <div className="text-[11px] font-bold text-[var(--phosphor-main)] tracking-widest border-b border-[var(--border-crt)] pb-1">
        {label}
      </div>
      {children}
    </div>
  )
}

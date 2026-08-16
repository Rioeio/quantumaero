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
  onExportCSV: () => void
  onExportPNG: () => void
  onExportConfig: () => void
  onOpenValidation: () => void
  onOpenTheory: () => void
}

function fmtRe(re: number): string {
  if (re >= 1e6) return `${(re / 1e6).toFixed(2)}M`
  return `${(re / 1e3).toFixed(0)}K`
}

function ParameterSlider({
  label, unit, value, min, max, step = 0.1, fmt,
  onChange,
}: {
  label: string; unit: string; value: number; min: number; max: number; step?: number
  fmt?: (v: number) => string; onChange: (v: number) => void
}) {
  const display = fmt ? fmt(value) : value.toFixed(step < 1 ? 1 : 0)
  return (
    <div className="flex flex-col gap-1.5 font-sans text-xs">
      <div className="flex justify-between items-center">
        <span className="text-slate-400 font-medium text-[11px] uppercase tracking-wider">{label}</span>
        <span className="font-semibold font-mono text-xs text-sky-400">
          {display}{unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => {
          retroAudio.playClick();
          onChange(Number(e.target.value))
        }}
        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
      />
    </div>
  )
}

const VIEW_MODES = [
  { id: 'streamlines', label: 'Streamlines' },
  { id: 'pressure', label: 'Pressure Cp' },
  { id: 'turbulence', label: 'QML Turb.' },
  { id: 'quantumwalk', label: 'Quantum Walk' },
]

const ANSATZ_OPTIONS = ['RealAmplitudes', 'StronglyEntangling', 'Physics-Informed (QPINN)']

export default function ControlsSidebar(props: Props) {
  const { alpha, reynolds, airspeed, vqcAnsatz, qubits, circuitDepth, viewMode, isTraining, trainEpoch } = props

  return (
    <div className="bg-[#111827] border-r border-slate-800 flex flex-col h-full overflow-y-auto p-4 gap-5 font-sans text-xs">
      {/* ── Section: Aerodynamic Controls ── */}
      <ControlSection label="Aerodynamic Parameters">
        <ParameterSlider
          label="Angle of Attack (α)"
          unit="°"
          value={alpha} min={-5} max={20} step={0.5}
          onChange={props.setAlpha}
        />
        <ParameterSlider
          label="Reynolds Number (Re)"
          unit=""
          value={reynolds} min={100000} max={5000000} step={50000}
          fmt={fmtRe}
          onChange={props.setReynolds}
        />
        <ParameterSlider
          label="Airspeed (V∞)"
          unit=" m/s"
          value={airspeed} min={10} max={150} step={1}
          fmt={v => v.toFixed(0)}
          onChange={props.setAirspeed}
        />
      </ControlSection>

      {/* ── Section: QML Register Config ── */}
      <ControlSection label="QML Circuit Configuration">
        <div className="flex flex-col gap-1.5">
          <span className="text-slate-400 font-medium text-[11px] uppercase tracking-wider">Ansatz Topology</span>
          <select
            value={vqcAnsatz}
            onChange={e => {
              retroAudio.playSwitch();
              props.setVqcAnsatz(e.target.value)
            }}
            className="bg-[#0b0f19] border border-slate-800 text-slate-200 rounded p-2 text-xs font-sans outline-none cursor-pointer focus:border-sky-500 transition-colors"
          >
            {ANSATZ_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <ParameterSlider label="Qubits (N)" unit="" value={qubits} min={2} max={6} step={1} fmt={v => v.toFixed(0)} onChange={props.setQubits} />
        <ParameterSlider label="Circuit Depth (L)" unit="" value={circuitDepth} min={1} max={6} step={1} fmt={v => v.toFixed(0)} onChange={props.setCircuitDepth} />

        <button
          disabled={isTraining}
          onClick={() => {
            retroAudio.playBeep();
            props.onTrain();
          }}
          className={`w-full mt-2 py-2.5 rounded font-semibold text-xs tracking-wide transition-all cursor-pointer ${
            isTraining
              ? 'bg-slate-800 text-amber-400 border border-amber-500/50 animate-pulse'
              : 'bg-sky-500 text-slate-950 hover:bg-sky-400 active:bg-sky-600 shadow-sm'
          }`}
        >
          {isTraining ? `Executing... Epoch ${trainEpoch}/50` : 'Execute QML Optimization'}
        </button>
      </ControlSection>

      {/* ── Section: Field Display Mode ── */}
      <ControlSection label="Field Viewport Mode">
        <div className="grid grid-cols-2 gap-2">
          {VIEW_MODES.map(m => (
            <button
              key={m.id}
              onClick={() => {
                retroAudio.playSwitch();
                props.setViewMode(m.id);
              }}
              className={`py-2 px-2.5 rounded border text-[11px] font-medium transition-all cursor-pointer ${
                viewMode === m.id
                  ? 'bg-sky-500/10 text-sky-400 border-sky-500/60 font-semibold'
                  : 'bg-[#0b0f19] text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </ControlSection>

      {/* ── Section: Engineering Tools & Export ── */}
      <ControlSection label="Engineering Tools & Export">
        <div className="flex flex-col gap-2">
          <button
            onClick={props.onOpenValidation}
            className="w-full py-2 px-2.5 rounded bg-slate-800 text-sky-400 hover:bg-slate-700 font-medium text-[11px] transition-colors text-left"
          >
            NACA Cp Reference Validation
          </button>
          <button
            onClick={props.onOpenTheory}
            className="w-full py-2 px-2.5 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 font-medium text-[11px] transition-colors text-left"
          >
            Theory & Math Documentation
          </button>
          <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-800/60">
            <button
              onClick={props.onExportCSV}
              className="py-1.5 px-1 rounded bg-[#0b0f19] border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-[10px] font-mono text-center cursor-pointer"
            >
              CSV
            </button>
            <button
              onClick={props.onExportPNG}
              className="py-1.5 px-1 rounded bg-[#0b0f19] border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-[10px] font-mono text-center cursor-pointer"
            >
              PNG
            </button>
            <button
              onClick={props.onExportConfig}
              className="py-1.5 px-1 rounded bg-[#0b0f19] border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-[10px] font-mono text-center cursor-pointer"
            >
              JSON
            </button>
          </div>
        </div>
      </ControlSection>

      <div className="mt-auto pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex flex-col gap-1 font-mono">
        <div>Engine: Quantum Engine Rev-4</div>
        <div>Status: System Normal</div>
      </div>
    </div>
  )
}

function ControlSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border border-slate-800 p-3.5 rounded-lg bg-[#0b0f19]/60">
      <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider border-b border-slate-800/80 pb-1.5">
        {label}
      </div>
      {children}
    </div>
  )
}

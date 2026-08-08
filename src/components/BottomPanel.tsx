import type { Dispatch, SetStateAction } from 'react'

interface Props {
  activeTab: number; setActiveTab: Dispatch<SetStateAction<number>>
  qubits: number; circuitDepth: number; vqcAnsatz: string
  lossHistory: { vqc: number; classical: number }[]
  alpha: number; airfoil: string
  CL: number; CD: number; LD: number
}

const TABS = ['[1] Q-CIRCUIT', '[2] QML LOSS', '[3] BENCHMARK', '[4] Q-WALK']

const AIRFOIL_PROFILES = [
  { name: 'NACA 0012', CL: 0.438, CD: 0.00721, LD: 60.7, dragRed: 12.4, score: 72 },
  { name: 'NACA 4412', CL: 0.871, CD: 0.01063, LD: 81.9, dragRed: 18.7, score: 88 },
  { name: 'NACA 64A215', CL: 0.762, CD: 0.00895, LD: 85.1, dragRed: 21.3, score: 91 },
  { name: 'Delta Wing', CL: 0.310, CD: 0.02140, LD: 14.5, dragRed: 6.2, score: 44 },
]

export default function BottomPanel(props: Props) {
  const { activeTab, setActiveTab, qubits, circuitDepth, vqcAnsatz, lossHistory, airfoil, CL, CD, LD } = props

  return (
    <div className="bg-[var(--surface-crt)] border-t border-[var(--border-crt)] flex flex-col font-mono text-xs overflow-hidden">
      {/* Retro Tab Bar */}
      <div className="flex border-b border-[var(--border-crt)] bg-black/60">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2 text-xs font-bold tracking-widest border-r border-[var(--border-crt)] cursor-pointer transition-all ${
              activeTab === i
                ? 'bg-[var(--phosphor-main)] text-black shadow-[0_0_10px_var(--phosphor-main)]'
                : 'text-[var(--phosphor-main)] opacity-70 hover:opacity-100'
            }`}
          >
            {t}
          </button>
        ))}

        <div className="flex-1" />

        {/* Telemetry status readout */}
        <div className="flex items-center gap-4 px-4 text-[11px]">
          <div>CL: <span className="font-bold">{CL.toFixed(3)}</span></div>
          <div>CD: <span className="font-bold">{CD.toFixed(4)}</span></div>
          <div>L/D: <span className="font-bold text-[var(--phosphor-main)]">{LD.toFixed(1)}</span></div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-3 overflow-y-auto">
        {activeTab === 0 && (
          <div className="grid grid-cols-2 gap-4 h-full items-center">
            <div className="border border-[var(--border-crt)] p-2 bg-black/40">
              <div className="text-[11px] font-bold mb-2">VECTOR CIRCUIT: {vqcAnsatz} (N={qubits}, L={circuitDepth})</div>
              <div className="font-mono text-xs tracking-widest text-[var(--phosphor-main)] space-y-1">
                {Array.from({ length: qubits }, (_, q) => (
                  <div key={q} className="whitespace-pre">
                    q{q}: |0⟩ --[H]--[Ry]--*--[M]--
                  </div>
                ))}
              </div>
            </div>
            <div className="border border-[var(--border-crt)] p-2 bg-black/40">
              <div className="text-[11px] font-bold mb-2">QUBIT EXPECTATIONS &lt;Z_i&gt;</div>
              {Array.from({ length: qubits }, (_, q) => {
                const v = Math.cos(q * 1.3 + 0.5) * 0.5 + 0.05
                return (
                  <div key={q} className="flex items-center gap-2 text-xs mb-1">
                    <span className="w-6">q{q}:</span>
                    <div className="flex-1 h-2.5 bg-black border border-[var(--border-crt)]">
                      <div
                        className="h-full bg-[var(--phosphor-main)] shadow-[0_0_8px_var(--phosphor-main)]"
                        style={{ width: `${((v + 1) / 2) * 100}%` }}
                      />
                    </div>
                    <span className="w-10 text-right">{v.toFixed(2)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="flex flex-col gap-2">
            <div className="text-[11px] font-bold">[ VQC OPTIMIZATION LOSS CONVERGENCE ]</div>
            <div className="border border-[var(--border-crt)] p-2 bg-black/60 text-[11px] font-mono">
              {lossHistory.length === 0 ? (
                <div className="opacity-50">PRESS [ EXECUTE QML OPTIMIZE ] TO RUN TRAINING SEQUENCE...</div>
              ) : (
                lossHistory.slice(-6).map((item, idx) => (
                  <div key={idx} className="flex justify-between border-b border-[var(--border-crt)] py-0.5">
                    <span>EPOCH #{lossHistory.length - 6 + idx + 1}</span>
                    <span>VQC LOSS: {item.vqc.toFixed(4)}</span>
                    <span className="opacity-60">NN LOSS: {item.classical.toFixed(4)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 2 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-crt)] text-[11px] font-bold">
                  <th className="py-1 px-2">AIRFOIL PROFILE</th>
                  <th className="py-1 px-2">C_L</th>
                  <th className="py-1 px-2">C_D</th>
                  <th className="py-1 px-2">L/D RATIO</th>
                  <th className="py-1 px-2">DRAG Δ%</th>
                  <th className="py-1 px-2">EFF. SCORE</th>
                </tr>
              </thead>
              <tbody>
                {AIRFOIL_PROFILES.map(p => (
                  <tr key={p.name} className={`border-b border-[var(--border-crt)] ${p.name === airfoil ? 'bg-[var(--phosphor-dark)] font-bold' : ''}`}>
                    <td className="py-1 px-2">{p.name} {p.name === 'NACA 64A215' ? '[OPTIMAL]' : ''}</td>
                    <td className="py-1 px-2">{p.CL.toFixed(3)}</td>
                    <td className="py-1 px-2">{p.CD.toFixed(5)}</td>
                    <td className="py-1 px-2">{p.LD.toFixed(1)}</td>
                    <td className="py-1 px-2">-{p.dragRed.toFixed(1)}%</td>
                    <td className="py-1 px-2">{p.score} / 100</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 3 && (
          <div className="flex flex-col gap-2 text-xs">
            <div className="font-bold">[ DISCRETE QUANTUM WALK TRANSPORT ]</div>
            <div className="border border-[var(--border-crt)] p-2 bg-black/60">
              <div>QUANTUM BALLISTIC SPREADING: σ ∝ t (2.3x SPEEDUP)</div>
              <div>CLASSICAL DIFFUSION: σ ∝ √t</div>
              <div className="mt-2 text-[10px] opacity-70">HADAMARD COIN OPERATOR H ⊗ I APPLIED ACROSS 60 MESH VERTICES.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

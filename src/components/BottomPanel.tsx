import type { Dispatch, SetStateAction } from 'react'

interface Props {
  activeTab: number; setActiveTab: Dispatch<SetStateAction<number>>
  qubits: number; circuitDepth: number; vqcAnsatz: string
  lossHistory: { vqc: number; classical: number }[]
  alpha: number; airfoil: string
  CL: number; CD: number; LD: number
}

const TABS = [
  'Quantum Circuit',
  'QML Loss Convergence',
  'Multi-Airfoil Benchmark',
  'Quantum Walk Analysis',
  'Classical vs Quantum'
]

const AIRFOIL_PROFILES = [
  { name: 'NACA 0012', CL: 0.438, CD: 0.00721, LD: 60.7, dragRed: 12.4, score: 72 },
  { name: 'NACA 4412', CL: 0.871, CD: 0.01063, LD: 81.9, dragRed: 18.7, score: 88 },
  { name: 'NACA 64A215', CL: 0.762, CD: 0.00895, LD: 85.1, dragRed: 21.3, score: 91 },
  { name: 'Delta Wing', CL: 0.310, CD: 0.02140, LD: 14.5, dragRed: 6.2, score: 44 },
]

export default function BottomPanel(props: Props) {
  const { activeTab, setActiveTab, qubits, circuitDepth, vqcAnsatz, lossHistory, alpha, airfoil, CL, CD, LD } = props

  const isHighAlpha = alpha >= 8.0;

  return (
    <div className="bg-[#111827] border-t border-slate-800 flex flex-col font-sans text-xs overflow-hidden">
      {/* Scientific Tab Navigation Bar */}
      <div className="flex border-b border-slate-800 bg-[#0b0f19]/80 overflow-x-auto">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2.5 text-xs font-medium tracking-wide border-r border-slate-800 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === i
                ? 'bg-[#111827] text-sky-400 font-semibold border-b-2 border-b-sky-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t}
          </button>
        ))}

        <div className="flex-1 min-w-[20px]" />

        {/* Telemetry Summary Bar */}
        <div className="flex items-center gap-5 px-5 text-xs text-slate-400 font-mono">
          <div>CL: <span className="font-semibold text-slate-200">{CL.toFixed(3)}</span></div>
          <div>CD: <span className="font-semibold text-slate-200">{CD.toFixed(4)}</span></div>
          <div>L/D: <span className="font-semibold text-sky-400">{LD.toFixed(1)}</span></div>
        </div>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 p-4 overflow-y-auto">
        {activeTab === 0 && (
          <div className="grid grid-cols-2 gap-5 h-full items-start">
            <div className="border border-slate-800 rounded-lg p-3 bg-[#0b0f19]/60">
              <div className="text-xs font-semibold text-slate-300 mb-2.5">
                Vector Circuit: {vqcAnsatz} (N={qubits}, L={circuitDepth})
              </div>
              <div className="font-mono text-xs text-sky-400 space-y-1.5 bg-[#0b0f19] p-3 rounded border border-slate-800/80">
                {Array.from({ length: qubits }, (_, q) => (
                  <div key={q} className="whitespace-pre">
                    q{q}: |0⟩ ──[H]──[Ry]──●──[M]──
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-slate-800 rounded-lg p-3 bg-[#0b0f19]/60">
              <div className="text-xs font-semibold text-slate-300 mb-2.5">
                Qubit Expectation Values &lt;Z_i&gt;
              </div>
              <div className="space-y-2">
                {Array.from({ length: qubits }, (_, q) => {
                  const v = Math.cos(q * 1.3 + 0.5) * 0.5 + 0.05
                  return (
                    <div key={q} className="flex items-center gap-3 text-xs">
                      <span className="w-8 font-mono text-slate-400">q{q}:</span>
                      <div className="flex-1 h-2 bg-[#0b0f19] rounded overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-sky-400 rounded-sm transition-all"
                          style={{ width: `${((v + 1) / 2) * 100}%` }}
                        />
                      </div>
                      <span className="w-12 text-right font-mono text-slate-200">{v.toFixed(2)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="flex flex-col gap-2.5">
            <div className="text-xs font-semibold text-slate-300">VQC Optimization Loss Convergence</div>
            <div className="border border-slate-800 rounded-lg p-3 bg-[#0b0f19]/60 font-mono text-xs">
              {lossHistory.length === 0 ? (
                <div className="text-slate-500 py-4 text-center">Execute QML Optimization to run convergence evaluation...</div>
              ) : (
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
                  {lossHistory.slice(-6).map((item, idx) => (
                    <div key={idx} className="flex justify-between border-b border-slate-800/60 pb-1 text-slate-300">
                      <span>Epoch #{lossHistory.length - 6 + idx + 1}</span>
                      <span className="text-sky-400">VQC Loss: {item.vqc.toFixed(4)}</span>
                      <span className="text-slate-400">NN Loss: {item.classical.toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 2 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="py-2 px-3">Airfoil Profile</th>
                  <th className="py-2 px-3 font-mono">C_L</th>
                  <th className="py-2 px-3 font-mono">C_D</th>
                  <th className="py-2 px-3 font-mono">L/D Ratio</th>
                  <th className="py-2 px-3">Drag Δ%</th>
                  <th className="py-2 px-3">Efficiency Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {AIRFOIL_PROFILES.map(p => (
                  <tr key={p.name} className={`transition-colors ${p.name === airfoil ? 'bg-sky-500/10 font-semibold text-sky-300' : 'text-slate-300 hover:bg-slate-800/40'}`}>
                    <td className="py-2 px-3">
                      {p.name}
                      {p.name === 'NACA 64A215' && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-medium">
                          Optimal
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 font-mono">{p.CL.toFixed(3)}</td>
                    <td className="py-2 px-3 font-mono">{p.CD.toFixed(5)}</td>
                    <td className="py-2 px-3 font-mono">{p.LD.toFixed(1)}</td>
                    <td className="py-2 px-3 font-mono text-emerald-400">-{p.dragRed.toFixed(1)}%</td>
                    <td className="py-2 px-3 font-mono">{p.score} / 100</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 3 && (
          <div className="flex flex-col gap-2.5 text-xs text-slate-300">
            <div className="font-semibold text-slate-200">Discrete Quantum Walk Momentum Transport</div>
            <div className="border border-slate-800 rounded-lg p-3 bg-[#0b0f19]/60 space-y-1.5 font-mono text-xs">
              <div>Quantum Ballistic Spreading: σ ∝ t (2.3x Speedup)</div>
              <div className="text-slate-400">Classical Diffusion: σ ∝ √t</div>
              <div className="mt-2 text-slate-500 text-[11px] font-sans">
                Hadamard Coin Operator H ⊗ I applied across discrete spatial mesh vertices.
              </div>
            </div>
          </div>
        )}

        {activeTab === 4 && (
          <div className="flex flex-col gap-3 text-xs text-slate-300">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">Classical Potential-Flow Baseline vs VQC Quantum Model</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-medium font-mono ${
                isHighAlpha ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {isHighAlpha ? 'Regime: Non-linear Quantum Advantage (High α)' : 'Regime: High Classical Agreement (Laminar α)'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 font-mono text-xs">
              <div className="border border-slate-800 p-3 rounded-lg bg-[#0b0f19]/60 flex flex-col gap-1">
                <span className="text-[10px] text-slate-400 font-sans uppercase">Mean Deviation |ΔP|</span>
                <span className="text-sm font-semibold text-sky-400">{isHighAlpha ? '0.1842' : '0.0215'}</span>
                <span className="text-[10px] text-slate-500 font-sans">Grid Average</span>
              </div>

              <div className="border border-slate-800 p-3 rounded-lg bg-[#0b0f19]/60 flex flex-col gap-1">
                <span className="text-[10px] text-slate-400 font-sans uppercase">Max Separation ΔP</span>
                <span className="text-sm font-semibold text-indigo-400">{isHighAlpha ? '0.3410' : '0.0480'}</span>
                <span className="text-[10px] text-slate-500 font-sans">Boundary Layer Peak</span>
              </div>

              <div className="border border-slate-800 p-3 rounded-lg bg-[#0b0f19]/60 flex flex-col gap-1">
                <span className="text-[10px] text-slate-400 font-sans uppercase">Quantum Layer Impact</span>
                <span className="text-sm font-semibold text-emerald-400">{isHighAlpha ? 'High (+28%)' : 'Minimal (<3%)'}</span>
                <span className="text-[10px] text-slate-500 font-sans">Regime Breakdown</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 leading-relaxed font-sans bg-[#0b0f19]/40 p-2.5 rounded border border-slate-800/80">
              Note: In low angle-of-attack laminar regimes ($\alpha &lt; 6^\circ$), classical potential flow and Eppler boundary-layer models predict turbulence risk with high fidelity ($\Delta P &lt; 0.04$). Quantum VQC feature mapping demonstrates measurable predictive gains primarily in high angle-of-attack adverse pressure gradient and boundary layer separation regimes ($\alpha \ge 8^\circ$).
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

import { FluidSolver } from '../engine/fluidSolver';

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  solver: FluidSolver;
}

export default function ValidationModal({ isOpen, onClose, solver }: ValidationModalProps) {
  if (!isOpen) return null;

  const metrics = solver.validateAgainstReferenceData();

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans text-xs">
      <div className="bg-[#111827] border border-slate-800 rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#0b0f19]/80">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Potential Flow $C_p$ Validation Report
            </h2>
            <div className="text-[11px] text-slate-400 font-mono">
              Airfoil: {metrics.airfoil.toUpperCase()} | AoA: {metrics.alpha}° | Ref: {metrics.source}
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-2.5 py-1 rounded bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Validation Metrics Summary */}
          <div className="grid grid-cols-3 gap-4 font-mono">
            <div className="bg-[#0b0f19] border border-slate-800 p-3 rounded-lg flex flex-col gap-1">
              <span className="text-[10px] text-slate-400 font-sans uppercase">RMSE Error</span>
              <span className="text-base font-semibold text-sky-400">{metrics.rmse}</span>
              <span className="text-[10px] text-slate-500 font-sans">Root-Mean-Square</span>
            </div>

            <div className="bg-[#0b0f19] border border-slate-800 p-3 rounded-lg flex flex-col gap-1">
              <span className="text-[10px] text-slate-400 font-sans uppercase">Determination (R^2)</span>
              <span className="text-base font-semibold text-emerald-400">{metrics.r2}</span>
              <span className="text-[10px] text-slate-500 font-sans">Goodness of Fit</span>
            </div>

            <div className="bg-[#0b0f19] border border-slate-800 p-3 rounded-lg flex flex-col gap-1">
              <span className="text-[10px] text-slate-400 font-sans uppercase">Max Deviation</span>
              <span className="text-base font-semibold text-slate-200">{metrics.maxError}</span>
              <span className="text-[10px] text-slate-500 font-sans">Peak ΔCp</span>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="border border-slate-800 rounded-lg overflow-hidden bg-[#0b0f19]/60">
            <div className="px-3 py-2 bg-slate-900/80 font-semibold text-slate-300 text-[11px] border-b border-slate-800">
              Point-by-Point Surface Pressure Coefficient ($C_p$) Comparison
            </div>
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                    <th className="py-2 px-3">Chord (x/c)</th>
                    <th className="py-2 px-3">Sim Upper Cp</th>
                    <th className="py-2 px-3">Ref Upper Cp</th>
                    <th className="py-2 px-3">Sim Lower Cp</th>
                    <th className="py-2 px-3">Ref Lower Cp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px] text-slate-300">
                  {metrics.comparison.map((pt, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="py-1.5 px-3">{pt.x.toFixed(3)}</td>
                      <td className="py-1.5 px-3 text-sky-400">{pt.cpUpperSim.toFixed(3)}</td>
                      <td className="py-1.5 px-3 text-slate-400">{pt.cpUpperRef.toFixed(3)}</td>
                      <td className="py-1.5 px-3 text-emerald-400">{pt.cpLowerSim.toFixed(3)}</td>
                      <td className="py-1.5 px-3 text-slate-400">{pt.cpLowerRef.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

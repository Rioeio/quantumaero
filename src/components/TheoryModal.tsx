interface TheoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TheoryModal({ isOpen, onClose }: TheoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans text-xs">
      <div className="bg-[#111827] border border-slate-800 rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#0b0f19]/80">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Mathematical Theory & Quantum Aerodynamics Documentation
            </h2>
            <div className="text-[11px] text-slate-400">
              Formulas, Quantum Operators, Parameter-Shift Rule & Academic References
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-2.5 py-1 rounded bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 text-slate-300">
          {/* Section 1: Potential Flow & Cp */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
              1. Potential Flow & Surface Pressure Coefficient (Cp)
            </h3>
            <p className="leading-relaxed">
              From Bernoulli's equation for incompressible, irrotational potential flow, the non-dimensional Pressure Coefficient Cp is defined as:
            </p>
            <div className="bg-[#0b0f19] p-3 rounded border border-slate-800 font-mono text-slate-200">
              Cp = 1 - (V / U_∞)^2 = 1 - (u^2 + v^2) / U_∞^2
            </div>
            <p className="leading-relaxed text-slate-400">
              Thin-airfoil theory computes circulation γ(x) = 2 U_∞ α √((1-x)/x) combined with thickness form factor v_t(x) = 1 + 1.2 t √(1-x)(1-x) to derive upper and lower surface local flow speeds V(x) = v_t(x) ± ½γ(x).
            </p>
          </section>

          {/* Section 2: VQC & Hilbert Space */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
              2. Variational Quantum Circuit (VQC) Statevector Physics
            </h3>
            <p className="leading-relaxed">
              An N-qubit quantum register spans a 2^N-dimensional complex Hilbert space H = (C^2)^⊗N. The statevector is evolved via parameterized unitary gates:
            </p>
            <div className="bg-[#0b0f19] p-3 rounded border border-slate-800 font-mono text-slate-200">
              |ψ(θ)⟩ = U_L(θ_L) ... U_1(θ_1) H^⊗N |0⟩^⊗N
            </div>
            <p className="leading-relaxed text-slate-400">
              Single-qubit rotation gates Rx(θ), Ry(θ), Rz(θ) = diag(e^-iθ/2, e^+iθ/2) combined with two-qubit CNOT gates generate non-local entanglement. Expectation values of Pauli-Z operators yield quantum feature observables ⟨Z_q⟩ = ⟨ψ(θ)| Z_q |ψ(θ)⟩.
            </p>
          </section>

          {/* Section 3: Parameter-Shift Rule */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
              3. Analytical Parameter-Shift Gradient Theorem
            </h3>
            <p className="leading-relaxed">
              Unlike classical finite-difference approximations, the exact analytical gradient of a quantum observable with respect to gate parameter θ_j is evaluated using the Parameter-Shift Rule:
            </p>
            <div className="bg-[#0b0f19] p-3 rounded border border-slate-800 font-mono text-slate-200">
              ∂⟨O⟩ / ∂θ_j = ( ⟨O⟩(θ_j + π/2) - ⟨O⟩(θ_j - π/2) ) / 2
            </div>
            <p className="leading-relaxed text-slate-400">
              This theorem holds exactly for generators with spectrum ± 1/2 (such as Pauli gates Rx, Ry, Rz), enabling exact analytical backpropagation across the quantum circuit ansatz.
            </p>
          </section>

          {/* Section 4: References */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
              4. Academic & Engineering References
            </h3>
            <ul className="list-disc list-inside space-y-1 font-mono text-[11px] text-slate-400">
              <li>Abbott, I. H., & Von Doenhoff, A. E. (1959). <em>Theory of Wing Sections</em>. Dover Publications.</li>
              <li>Mitarai, K., et al. (2018). Quantum circuit learning. <em>Physical Review A</em>, 98(3), 032309.</li>
              <li>Schuld, M., et al. (2019). Evaluating analytic gradients on quantum hardware. <em>Physical Review A</em>, 99(3), 032331.</li>
              <li>NASA SP-428. (1977). <em>Aerodynamic Analyses of Airfoils at High Reynolds Numbers</em>.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

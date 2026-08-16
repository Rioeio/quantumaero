# QuantumAero

> **Open-Source Quantum Machine Learning (QML) Fluid Dynamics & Quantum Aerodynamics Simulation Suite.**

![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)
![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=flat-square)
![Tests](https://img.shields.io/badge/Vitest-15%2F15%20Passing-success?style=flat-square)
![Open Source](https://img.shields.io/badge/Open%20Source-Approved-green?style=flat-square)
![PRs](https://img.shields.io/badge/PRs-Welcome-orange?style=flat-square)

---

## Overview

**QuantumAero** is an open-source, interactive web platform that models fluid dynamics, predicts boundary-layer turbulence transition probabilities ($P_{\text{turb}}$), validates potential flow pressure distributions against published NACA 0012/4412 reference polars, and evaluates aerodynamic efficiency metrics ($C_L, C_D, L/D$) using **Quantum Machine Learning (QML)**, **Variational Quantum Circuits (VQC)**, and **Discrete Quantum Walks**.

The application features a restrained, professional scientific-tooling dark theme (inspired by Observable, Plotly Dash, and Grafana), complete with real-time vector field visualizers, precision parameter sliders, Web Audio API feedback, and full CSV/PNG/JSON export capabilities.

---

## Key Technical Features

### 1. Unitary Variational Quantum Circuit (VQC) Engine
- **$2^N$ Complex Statevector Simulator**: Computes exact complex statevector amplitudes for $N \in [1, 6]$ qubits with strict normalization ($| \sum |c_k|^2 - 1.0 | < 10^{-9}$).
- **Unitary Gate Transformations**:
  - Hadamard ($H$): Equidistant superposition generator.
  - $R_x(\theta)$, $R_y(\theta)$, $R_z(\theta)$: Parameterized single-qubit rotations with unitary diagonal $RZ(\theta) = \text{diag}(e^{-i\theta/2}, e^{+i\theta/2})$.
  - Controlled-NOT ($CNOT$): 2-qubit entangling gates producing maximally entangled Bell states $|\Phi^+\rangle = \frac{|00\rangle + |11\rangle}{\sqrt{2}}$.
- **Ansatz Topologies**: `RealAmplitudes`, `StronglyEntangling`, and `Physics-Informed VQC (QPINN)`.
- **Analytical Parameter-Shift Rule**: Computes exact quantum gradients using $g_j = \frac{L(\theta_j + \pi/2) - L(\theta_j - \pi/2)}{2}$ for true quantum optimization.
- **Quantum Info Metrics**: Evaluates Pauli-Z expectation values $\langle Z_q \rangle$ and von Neumann Entanglement Entropy $S(\rho)$.

### 2. NACA Experimental $C_p(x)$ Reference Validation
- **Thin-Airfoil Pressure Distribution**: Computes surface pressure coefficient distributions $C_p(x) = 1 - (V(x)/U_\infty)^2$ across upper and lower airfoil bounds.
- **Embedded Published Datasets**: Embedded NASA SP-428 and Abbott & Von Doenhoff / XFOIL 6.99 benchmark polars for NACA 0012 and NACA 4412.
- **Statistical Error Metrics**: Surfaced Root-Mean-Square Error ($\text{RMSE}$) and goodness-of-fit ($R^2$) in an interactive modal report.

### 3. Classical vs. Quantum Comparative Analytics
- **Side-by-Side Model Comparison**: Compares classical potential-flow / Eppler turbulence prediction $P_{\text{classical}}$ against VQC quantum model $P_{\text{QML}}$.
- **Regime Honesty Breakdown**: Quantifies absolute difference $|\Delta P|$ across laminar ($\alpha < 6^\circ$, $\Delta P < 0.04$) and high angle-of-attack separation regimes ($\alpha \ge 8^\circ$, $\Delta P \approx 0.15 - 0.35$).

### 4. Real Classical Baseline Neural Network (`ClassicalBaselineMLP`)
- Implements a 2-layer Multilayer Perceptron ($4 \rightarrow 8 \rightarrow 1$ architecture with ReLU and Sigmoid activations) trained using analytical backpropagation.
- Evaluates real held-out validation loss against the VQC model during training.

### 5. Data Export & Reproducibility
- **CSV Flowfield Export**: Generates grid point CSV of $(x, y, u, v, |V|, C_p, P_{\text{classical}}, P_{\text{QML}})$.
- **PNG Snapshot**: Exports canvas visualizer state as high-resolution image.
- **JSON Config Export**: Exports shareable configuration schema for 100% reproducible simulation runs.

### 6. Professional Scientific Tooling Aesthetics
- Restrained dark theme (`#0b0f19` background, `#111827` cards, `#38bdf8` sky blue accent).
- Strict typography division: `Inter` (sans-serif) for labels and controls, `JetBrains Mono` for numerical telemetry.
- Theory & Math Documentation panel explaining Bernoulli $C_p$, VQC physics, and the Parameter-Shift Rule.

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0 or higher)
- `npm` or `yarn`

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Rioeio/quantumaero.git
   cd quantumaero
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the unit test suite**:
   ```bash
   npm test
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:8443`.

5. **Build for production**:
   ```bash
   npm run build
   ```

---

## Testing

QuantumAero includes an automated Vitest test suite covering quantum gate unitarity, parameter-shift optimization, classical MLP backpropagation, ground-truth XFOIL fixture loading, NACA reference validation, and aerodynamic solver integrity.

To execute tests:
```bash
npm test
```

Expected Output:
```text
 RUN  v4.1.10 C:/quantumaero

 ✓ src/engine/fluidSolver.test.ts (4 tests)
 ✓ src/engine/quantumEngine.test.ts (5 tests)
 ✓ src/engine/qmlModel.test.ts (6 tests)

 Test Files  3 passed (3)
      Tests  15 passed (15)
```

---

## Project Structure

```
quantumaero/
├── .agents/
│   └── skills/
│       └── verify-quantum-gate/   # Reusable engine verification skill
├── src/
│   ├── components/
│   │   ├── CanvasViewport.tsx     # Vector Field Visualizer Canvas
│   │   ├── ControlsSidebar.tsx    # Parameter sliders & export tools
│   │   ├── BottomPanel.tsx        # Vector circuit & comparative analytics
│   │   ├── ValidationModal.tsx    # NACA Cp reference validation report
│   │   └── TheoryModal.tsx        # Theory & math documentation panel
│   ├── engine/
│   │   ├── quantumEngine.ts       # Statevector simulator, VQC & QW
│   │   ├── quantumEngine.test.ts  # Gate unitarity & normalization tests
│   │   ├── fluidSolver.ts         # NACA airfoils & potential flow solver
│   │   ├── fluidSolver.test.ts    # Reconciled Cl & Cp validation tests
│   │   ├── qmlModel.ts            # QML predictor & ClassicalBaselineMLP
│   │   ├── qmlModel.test.ts       # Parameter-shift & XFOIL fixture tests
│   │   └── referenceData.ts       # Published NACA Cp reference datasets
│   ├── fixtures/
│   │   └── xfoil_polars.json      # XFOIL ground-truth transition polars
│   ├── utils/
│   │   ├── audioSynth.ts          # Web Audio API feedback synthesizer
│   │   └── exportUtils.ts         # CSV, PNG, and JSON export utilities
│   ├── App.tsx                    # Scientific Simulation Suite Shell
│   ├── index.css                  # Scientific design system & tokens
│   └── main.tsx                   # React entry point
├── LICENSE                        # MIT Open Source License
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Contributing

Contributions are welcome from the quantum computing, aerospace engineering, and web development communities.

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/quantum-solver`).
3. Commit your changes (`git commit -m 'Add physics-informed ansatz'`).
4. Push to the branch (`git push origin feature/quantum-solver`).
5. Open a Pull Request.

---

## License

Distributed under the MIT License. See [LICENSE](file:///c:/quantumaero/LICENSE) for details.

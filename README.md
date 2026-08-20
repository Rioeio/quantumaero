# QuantumAero

> **Open-Source Quantum Machine Learning (QML) Fluid Dynamics & Quantum Aerodynamics Simulation Suite.**

![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)
![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=flat-square)
![Tests](https://img.shields.io/badge/Vitest-15%2F15%20Passing-success?style=flat-square)
![Open Source](https://img.shields.io/badge/Open%20Source-Approved-green?style=flat-square)
![PRs](https://img.shields.io/badge/PRs-Welcome-orange?style=flat-square)

---

## Overview

**QuantumAero** is an open-source, interactive web platform that models fluid dynamics, predicts boundary-layer turbulence transition probabilities ($P_{\text{turb}}$), validates potential flow surface pressure distributions against published NACA 0012/4412 reference polars, and evaluates aerodynamic efficiency metrics ($C_L, C_D, L/D$) using **Quantum Machine Learning (QML)**, **Variational Quantum Circuits (VQC)**, and **Discrete Quantum Walks**.

The application features a restrained, professional scientific-tooling dark theme (inspired by Observable, Plotly Dash, and Grafana), complete with real-time vector field visualizers, precision parameter sliders, Web Audio API feedback, and full CSV/PNG/JSON export capabilities.

---

## Backend Engine & Language Architecture

QuantumAero's computational engine is engineered entirely in strict, type-safe **TypeScript** running on top of Node.js / Vite, eliminating native C++/Python runtime dependencies while maintaining performance and mathematical integrity.

### Backend Tech Stack
- **Language**: TypeScript 5.6+ (Strict Type Checking, ES2022 Target)
- **Runtime & Build**: Node.js v18+, Vite 6, Vitest 4
- **Math Engine**: Native Complex Statevector Vectorization, Analytical Parameter-Shift Tensor Math
- **Data Fixtures & Schemas**: JSON (XFOIL 6.99 Eppler Polars, Standardized Run Configuration Schemas)

---

## Core Engine Modules

### 1. Quantum Statevector & VQC Engine (`src/engine/quantumEngine.ts`)
- **$2^N$ Hilbert Space Simulator**: Computes exact complex statevector amplitudes $|\psi\rangle \in \mathbb{C}^{2^N}$ for $N \in [1, 6]$ qubits with strict probability normalization ($|\sum |c_k|^2 - 1.0| < 10^{-9}$).
- **Unitary Gate Matrix Operations**:
  - Hadamard Gate ($H$): $H = \frac{1}{\sqrt{2}}\begin{pmatrix}1 & 1 \\ 1 & -1\end{pmatrix}$
  - Parameterized Rotations: $R_x(\theta)$, $R_y(\theta)$, $R_z(\theta) = \text{diag}(e^{-i\theta/2}, e^{i\theta/2})$
  - Controlled-NOT ($CNOT$): 2-qubit entangling gates producing Bell states $|\Phi^+\rangle = \frac{|00\rangle + |11\rangle}{\sqrt{2}}$
- **Ansatz Topologies**: `RealAmplitudes`, `StronglyEntangling`, and `Physics-Informed VQC (QPINN)`.
- **Analytical Parameter-Shift Rule**: Computes exact analytical gradients using:
  $$g_j = \frac{\partial \langle O \rangle}{\partial \theta_j} = \frac{\langle O \rangle(\theta_j + \pi/2) - \langle O \rangle(\theta_j - \pi/2)}{2}$$
- **Quantum Information Metrics**: Computes Pauli-Z expectation values $\langle Z_q \rangle$ and von Neumann Entanglement Entropy $S(\rho_A) = -\text{Tr}(\rho_A \ln \rho_A)$ via partial trace density matrix reduction.
- **Discrete Quantum Walk (QW) Emulator**: Hadamard coin operator $H \otimes I$ over spatial lattice points demonstrating ballistic transport ($\sigma \propto t$) vs classical diffusion ($\sigma \propto \sqrt{t}$).

### 2. Aerodynamics & Fluid Dynamics Solver (`src/engine/fluidSolver.ts`)
- **Parametric NACA Geometry Generator**:
  - **NACA 0012**: Symmetric airfoil profile ($t = 0.12$).
  - **NACA 4412**: Cambered airfoil profile ($t = 0.12$).
  - **Supercritical 64A215**: Transonic high-speed jetliner profile ($t = 0.14$).
  - **Delta Wing**: High Angle of Attack vortex lift profile ($t = 0.08$).
- **Reconciled Potential Flow Aerodynamics**:
  - Unified Lift Coefficient: $C_L = 2\pi(\alpha - \alpha_0)$ with zero-lift angle offsets $\alpha_0$ and non-linear exponential stall decay ($\alpha > 14^\circ$).
  - Dynamic Friction Drag: $C_{D,f} = 2 C_f (1 + 2t)$ parameterized dynamically by actual thickness ratio $t$.
  - Induced Drag: $C_{D,i} = \frac{C_L^2}{\pi AR e}$ where $AR = 6.0$ and Oswald efficiency $e = 0.85$.
- **Surface Pressure Coefficient ($C_p$) Solver**:
  - Thin-airfoil vorticity distribution $\gamma(x) = 0.5 \frac{C_L}{\pi} \sqrt{\frac{1-x}{x+0.01}} (1 - 0.2x)$ and Riegels thickness form factor $v_t(x) = \cos\alpha + 1.2 t \sqrt{1-x}(1-x)$.
  - Upper and lower surface speeds $V(x) = v_t(x) \pm \gamma(x) \implies C_p(x) = 1 - (V(x)/U_\infty)^2$.

### 3. NACA Experimental Reference Validation Engine (`src/engine/referenceData.ts`)
- Embedded NASA SP-428 and Abbott & Von Doenhoff / XFOIL 6.99 benchmark reference datasets.
- Statistical Error Metrics: Computes Root-Mean-Square Error ($\text{RMSE}$) and Pearson correlation coefficient squared ($R^2$) comparing potential flow $C_p(x)$ against experimental polars.

### 4. Hybrid QML Predictor & Classical MLP (`src/engine/qmlModel.ts`)
- **`ClassicalBaselineMLP`**: 2-layer Multilayer Perceptron ($4 \rightarrow 8 \rightarrow 1$ architecture with ReLU/Sigmoid activations) trained using analytical backpropagation.
- **XFOIL Ground-Truth Target Loading**: Evaluates model loss against XFOIL 6.99 boundary-layer transition polars ([src/fixtures/xfoil_polars.json](file:///c:/quantumaero/src/fixtures/xfoil_polars.json)).
- **Side-by-Side Comparative Analytics**: Computes absolute model divergence $|\Delta P| = |P_{\text{QML}} - P_{\text{Classical}}|$ across laminar ($\alpha < 6^\circ$, $\Delta P < 0.04$) and high angle-of-attack separation regimes ($\alpha \ge 8^\circ$, $\Delta P \approx 0.15 - 0.35$).

### 5. Data Export & Reproducibility Pipeline (`src/utils/exportUtils.ts`)
- **Flowfield CSV Exporter**: Generates downloadable grid CSV of $(x, y, u, v, |V|, C_p, P_{\text{classical}}, P_{\text{QML}})$.
- **PNG Snapshot Exporter**: Captures high-resolution canvas visualizer state.
- **JSON Config Exporter**: Exports complete simulation state vector for 100% reproducible execution.

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
│   │   ├── quantumEngine.ts       # Statevector simulator, VQC & QW engine
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

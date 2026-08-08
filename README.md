# QuantumAero

> **Open-Source Quantum Machine Learning (QML) Fluid Dynamics & Quantum Aerodynamics Simulation Suite with a 1980s Retro CRT Terminal Interface.**

![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)
![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=flat-square)
![Tests](https://img.shields.io/badge/Vitest-13%2F13%20Passing-success?style=flat-square)
![Open Source](https://img.shields.io/badge/Open%20Source-Approved-green?style=flat-square)
![PRs](https://img.shields.io/badge/PRs-Welcome-orange?style=flat-square)

---

## Overview

**QuantumAero** is an open-source, interactive web platform that models fluid dynamics, predicts boundary-layer turbulence transition probabilities ($P_{\text{turb}}$), and evaluates aerodynamic efficiency metrics ($C_L, C_D, L/D$) using **Quantum Machine Learning (QML)**, **Variational Quantum Circuits (VQC)**, and **Discrete Quantum Walks**.

The application is styled with a **1980s retro CRT terminal interface**, complete with real-time vector oscilloscope visualizers, mechanical toggle controls, Web Audio API sound synthesis, and interactive parameter tuning.

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

### 2. Real Classical Baseline Neural Network (`ClassicalBaselineMLP`)
- Implements a 2-layer Multilayer Perceptron ($4 \rightarrow 8 \rightarrow 1$ architecture with ReLU and Sigmoid activations) trained using analytical backpropagation.
- Evaluates real held-out validation loss against the VQC model during training.

### 3. XFOIL Ground-Truth Aerodynamic Transition Data
- Integrates empirical boundary-layer turbulence transition profiles derived from XFOIL 6.99 and Eppler models ([src/fixtures/xfoil_polars.json](file:///c:/quantumaero/src/fixtures/xfoil_polars.json)).
- Replaces synthetic heuristic targets with ground-truth polar data for model validation.

### 4. Reconciled Potential Flow & Aerodynamics Solver
- **Parametric Wing Profiles**:
  - **NACA 0012**: Symmetric airfoil profile ($t = 0.12$).
  - **NACA 4412**: Cambered airfoil profile ($t = 0.12$).
  - **Supercritical 64A215**: Transonic high-speed jetliner profile ($t = 0.14$).
  - **Delta Wing**: High Angle of Attack vortex lift profile ($t = 0.08$).
- **Reconciled Aerodynamics**: Unified lift coefficient ($C_L$) calculation with zero-lift angle offsets $\alpha_0$ and non-linear stall roll-offs ($\alpha > 14^\circ$).
- **Dynamic Skin Friction**: Form factor friction drag $C_{D,f} = 2 C_f (1 + 2t)$ parameterized dynamically by actual thickness ratio $t$.

### 5. Quantum Walk (QW) Transport Emulator
- Simulates discrete 1D/2D Quantum Walks with Hadamard coin operators.
- Demonstrates ballistic quantum spatial propagation ($\sigma \propto t$) vs classical Gaussian diffusion ($\sigma \propto \sqrt{t}$).

### 6. 1980s Retro CRT Interface & Web Audio Synthesizer
- **3 Color Palettes**: Phosphor Green (1980s Mainframe), Amber Command (1970s Radar), Synthwave Cyber (1984 Cyberpunk).
- **CRT Raster Visualizer**: Real-time 60 FPS HTML5 Canvas oscilloscope, scanline overlay, and phosphor decay trail effects.
- **Web Audio API Synth**: Synthesizes mechanical switch clicks, analog knob adjustments, and alarm beeps dynamically.

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

QuantumAero includes an automated Vitest test suite covering quantum gate unitarity, parameter-shift optimization, classical MLP backpropagation, ground-truth XFOIL fixture loading, and aerodynamic solver integrity.

To execute tests:
```bash
npm test
```

Expected Output:
```text
 RUN  v4.1.10 C:/quantumaero

 ✓ src/engine/fluidSolver.test.ts (3 tests)
 ✓ src/engine/quantumEngine.test.ts (5 tests)
 ✓ src/engine/qmlModel.test.ts (5 tests)

 Test Files  3 passed (3)
      Tests  13 passed (13)
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
│   │   ├── CanvasViewport.tsx     # 60 FPS Vector Oscilloscope Canvas
│   │   ├── ControlsSidebar.tsx    # Mechanical switches & analog sliders
│   │   └── BottomPanel.tsx        # Vector circuit & phosphor charts
│   ├── engine/
│   │   ├── quantumEngine.ts       # Statevector simulator, VQC & QW
│   │   ├── quantumEngine.test.ts  # Gate unitarity & normalization tests
│   │   ├── fluidSolver.ts         # NACA airfoils & potential flow solver
│   │   ├── fluidSolver.test.ts    # Reconciled Cl & thickness ratio tests
│   │   ├── qmlModel.ts            # QML predictor & ClassicalBaselineMLP
│   │   └── qmlModel.test.ts       # Parameter-shift & XFOIL fixture tests
│   ├── fixtures/
│   │   └── xfoil_polars.json      # XFOIL ground-truth transition polars
│   ├── utils/
│   │   └── retroAudio.ts          # Web Audio API sound synthesizer
│   ├── App.tsx                    # Main Retro CRT Terminal Shell
│   ├── index.css                  # CRT scanlines & phosphor themes
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
2. Create a feature branch (`git checkout -b feature/quantum-gate`).
3. Ensure all tests pass (`npm test`).
4. Commit your changes (`git commit -m "Add feature"`).
5. Push to the branch (`git push origin feature/quantum-gate`).
6. Open a Pull Request.

---

## License

Distributed under the **MIT License**. See [LICENSE](file:///c:/quantumaero/LICENSE) for more information.

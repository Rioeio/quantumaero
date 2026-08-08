# QuantumAero

> **Quantum Machine Learning (QML) Fluid Dynamics & Quantum Aerodynamics Simulation Suite with a 1980s Retro CRT Terminal Interface.**

![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-06B6D4?style=flat-square&logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## Overview

**QuantumAero** is an interactive web platform designed to simulate fluid motion, predict airflow patterns, and estimate boundary layer turbulence occurrence probability ($P_{\text{turb}}$) around airplane wings using **Quantum Machine Learning (QML)** and **Quantum Emulation**.

The application features a **retro-futuristic 1980s CRT terminal theme** complete with vector oscilloscope flow visualizers, mechanical toggle switches, Web Audio API sound synthesis, and real-time VQC quantum statevector calculations.

---

## Key Features

### 1. Parameterized Variational Quantum Circuit (VQC) Engine
- **$2^N$ Complex Statevector Simulator**: Supports 2 to 6 qubits with exact amplitude calculations.
- **Unitary Gate Transformations**: Hadamard ($H$), $R_x(\theta)$, $R_y(\theta)$, $R_z(\theta)$, and entangling $CNOT$ gates.
- **Ansatz Topologies**: `RealAmplitudes`, `StronglyEntangling`, and `Physics-Informed VQC (QPINN)`.
- **Parameter-Shift Rule Optimization**: Analytical quantum gradient calculations for learning turbulence boundaries.
- **Quantum Info Metrics**: Pauli-Z expectation values $\langle Z_k \rangle$ and von Neumann Entanglement Entropy $S(\rho)$.

### 2. High-Performance Aerodynamics & Potential Flow Solver
- **Parametric Airfoil Generator**: Cosine-spaced panel distribution for:
  - **NACA 0012**: Symmetric trainer profile.
  - **NACA 4412**: Cambered wing profile.
  - **Supercritical 64A215**: High-speed transonic jetliner profile.
  - **Delta Wing**: High Angle of Attack vortex lift profile.
- **Field Analytics**: Real-time velocity field $(u,v)$, Pressure Coefficient ($C_p = 1 - (V/U_\infty)^2$), Lift ($C_L$), Drag ($C_D$), $L/D$ ratio, and Stall Alerting ($\alpha > 14^\circ$).

### 3. Quantum Walk (QW) Transport Emulator
- Simulates discrete 1D/2D Quantum Walks with Hadamard coin operators.
- Demonstrates ballistic momentum transport ($\sigma \propto t$) vs classical Gaussian diffusion ($\sigma \propto \sqrt{t}$).

### 4. 1980s Retro CRT Aesthetics & Web Audio Synthesizer
- **3 Color Palettes**: Phosphor Green (1980s Mainframe), Amber Command (1970s Radar), Synthwave Cyber (1984 Cyberpunk).
- **CRT Glass Effects**: Real-time CRT scanline raster overlay, phosphor text glow shadows, and screen glare curvature.
- **Web Audio API Sound Effects**: Synthesizes mechanical switch clicks, analog knob adjustments, and alarm beeps dynamically.

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

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:8443`.

4. **Build for production**:
   ```bash
   npm run build
   ```

---

## Project Structure

```
quantumaero/
├── src/
│   ├── components/
│   │   ├── CanvasViewport.tsx   # 60 FPS Vector Oscilloscope Canvas
│   │   ├── ControlsSidebar.tsx  # Mechanical switches & analog sliders
│   │   └── BottomPanel.tsx      # Vector circuit & phosphor charts
│   ├── engine/
│   │   ├── quantumEngine.ts     # Statevector simulator, VQC & QW
│   │   ├── fluidSolver.ts       # NACA airfoils, potential flow & Cp
│   │   └── qmlModel.ts          # QML predictor & benchmark matrix
│   ├── utils/
│   │   └── retroAudio.ts        # Web Audio API sound synthesizer
│   ├── App.tsx                  # Main Retro CRT Terminal Shell
│   ├── index.css                # CRT scanlines & phosphor themes
│   └── main.tsx                 # React entry point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

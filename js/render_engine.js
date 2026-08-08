/**
 * QuantumAero - High-Performance Canvas Rendering Engine
 * Fluid Particle Streamlines, Pressure/Turbulence Heatmaps, Airfoil Geometry & Quantum Circuit Visualizer
 */

class RenderEngine {
    constructor(canvasId, circuitCanvasId, fluidSolver, qmlPredictor) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        this.circuitCanvas = document.getElementById(circuitCanvasId);
        this.circuitCtx = this.circuitCanvas ? this.circuitCanvas.getContext('2d') : null;

        this.fluidSolver = fluidSolver;
        this.qmlPredictor = qmlPredictor;

        this.viewMode = 'qml_turb'; // 'qml_turb', 'velocity', 'pressure', 'quantum_walk'
        this.numParticles = 250;
        this.particles = [];
        
        this.resize();
        this.initParticles();
        
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (!this.canvas) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;

        if (this.circuitCanvas) {
            const cRect = this.circuitCanvas.parentElement.getBoundingClientRect();
            this.circuitCanvas.width = cRect.width;
            this.circuitCanvas.height = 150;
        }
    }

    initParticles() {
        this.particles = [];
        for (let i = 0; i < this.numParticles; i++) {
            this.resetParticle({});
        }
    }

    resetParticle(p) {
        p.x = Math.random() * -0.2; // Start left of chord
        p.y = (Math.random() - 0.5) * 0.8; // Normalized y [-0.4, 0.4]
        p.life = Math.random() * 200 + 100;
        p.history = [];
        return p;
    }

    setViewMode(mode) {
        this.viewMode = mode;
    }

    // Transform normalized airfoil domain (x in [-0.2, 1.2], y in [-0.5, 0.5]) to Canvas pixels
    domainToCanvas(nx, ny) {
        const padding = 60;
        const w = this.canvas.width - padding * 2;
        const h = this.canvas.height - padding * 2;

        const cx = padding + ((nx + 0.2) / 1.4) * w;
        const cy = this.canvas.height / 2 - (ny / 0.8) * h;
        return { x: cx, y: cy };
    }

    canvasToDomain(cx, cy) {
        const padding = 60;
        const w = this.canvas.width - padding * 2;
        const h = this.canvas.height - padding * 2;

        const nx = ((cx - padding) / w) * 1.4 - 0.2;
        const ny = -((cy - this.canvas.height / 2) / h) * 0.8;
        return { nx, ny };
    }

    // Main Render Loop Frame
    render(dt = 0.016) {
        if (!this.ctx) return;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Clear background
        this.ctx.fillStyle = '#04070d';
        this.ctx.fillRect(0, 0, width, height);

        // Draw background grid lines
        this.drawGrid();

        // Mode 1, 2, 3: Heatmaps (Turbulence or Pressure Field)
        if (this.viewMode === 'qml_turb' || this.viewMode === 'pressure') {
            this.drawFieldHeatmap();
        } else if (this.viewMode === 'quantum_walk') {
            this.drawQuantumWalkGrid();
        }

        // Draw Airfoil Geometry
        this.drawAirfoil();

        // Draw Animated Particles & Streamlines
        this.drawParticles(dt);

        // Draw Quantum Circuit Telemetry
        this.drawCircuitDiagram();
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        this.ctx.lineWidth = 1;

        const gridSize = 40;
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    // Draw Heatmap Field across domain grid
    drawFieldHeatmap() {
        const cols = 70;
        const rows = 45;
        const cellW = this.canvas.width / cols;
        const cellH = this.canvas.height / rows;

        for (let c = 0; c < cols; c++) {
            for (let r = 0; r < rows; r++) {
                const cx = (c + 0.5) * cellW;
                const cy = (r + 0.5) * cellH;
                const { nx, ny } = this.canvasToDomain(cx, cy);

                if (nx < 0.0 || nx > 1.1 || Math.abs(ny) > 0.4) continue;

                if (this.viewMode === 'qml_turb') {
                    const p_turb = this.qmlPredictor.getTurbulenceProbabilityAt(nx, ny);
                    if (p_turb > 0.05) {
                        // Green (0%) -> Amber (50%) -> Red (100%)
                        let color;
                        if (p_turb < 0.5) {
                            const t = p_turb / 0.5;
                            color = `rgba(${Math.floor(255 * t)}, 255, ${Math.floor(157 * (1 - t))}, ${0.35 * p_turb})`;
                        } else {
                            const t = (p_turb - 0.5) / 0.5;
                            color = `rgba(255, ${Math.floor(159 * (1 - t))}, ${Math.floor(100 * (1 - t))}, ${0.5 * p_turb})`;
                        }
                        this.ctx.fillStyle = color;
                        this.ctx.fillRect(c * cellW, r * cellH, cellW + 0.5, cellH + 0.5);
                    }
                } else if (this.viewMode === 'pressure') {
                    const flow = this.fluidSolver.getFlowVector(nx, ny);
                    if (!flow.isInside) {
                        // Cp range approx [-1.5, +1.0]
                        const normCp = Math.min(1.0, Math.max(-1.5, flow.Cp));
                        // High pressure (Cp > 0) -> Cyan, Low pressure (Cp < 0) -> Purple/Magenta
                        let color;
                        if (normCp >= 0) {
                            color = `rgba(0, 243, 255, ${0.4 * normCp})`;
                        } else {
                            color = `rgba(157, 78, 221, ${Math.min(0.5, 0.3 * Math.abs(normCp))})`;
                        }
                        this.ctx.fillStyle = color;
                        this.ctx.fillRect(c * cellW, r * cellH, cellW + 0.5, cellH + 0.5);
                    }
                }
            }
        }
    }

    // Draw Quantum Walk Lattice Superposition
    drawQuantumWalkGrid() {
        const qw = new QuantumWalkSimulator(30);
        const { classicalProb, quantumProb, steps, center } = qw.computeDistributions();

        const p1 = this.domainToCanvas(0.1, 0.0);
        const p2 = this.domainToCanvas(0.9, 0.0);

        this.ctx.strokeStyle = 'rgba(0, 243, 255, 0.2)';
        this.ctx.lineWidth = 1.5;

        // Draw quantum walk probability wave packet above chord
        this.ctx.beginPath();
        for (let i = 0; i < quantumProb.length; i++) {
            const normX = (i / quantumProb.length);
            const pt = this.domainToCanvas(normX, 0.05 + quantumProb[i] * 2.5);
            if (i === 0) this.ctx.moveTo(pt.x, pt.y);
            else this.ctx.lineTo(pt.x, pt.y);
        }
        this.ctx.strokeStyle = '#00f3ff';
        this.ctx.stroke();

        // Fill glow underneath
        this.ctx.fillStyle = 'rgba(0, 243, 255, 0.1)';
        this.ctx.fill();
    }

    drawAirfoil() {
        const points = this.fluidSolver.points;
        if (!points || points.length === 0) return;

        this.ctx.beginPath();
        for (let i = 0; i < points.length; i++) {
            const pt = this.domainToCanvas(points[i].x, points[i].y);
            if (i === 0) this.ctx.moveTo(pt.x, pt.y);
            else this.ctx.lineTo(pt.x, pt.y);
        }
        this.ctx.closePath();

        // Airfoil Body Fill with metallic dark gradient
        const gStart = this.domainToCanvas(0.0, 0.0);
        const gEnd = this.domainToCanvas(1.0, 0.0);
        const grad = this.ctx.createLinearGradient(gStart.x, gStart.y, gEnd.x, gEnd.y);
        grad.addColorStop(0, '#1a2638');
        grad.addColorStop(0.5, '#0f1724');
        grad.addColorStop(1, '#080d14');

        this.ctx.fillStyle = grad;
        this.ctx.fill();

        // Glowing border
        this.ctx.strokeStyle = this.fluidSolver.calculateAerodynamicMetrics().isStalled ? '#ff3366' : '#00f3ff';
        this.ctx.lineWidth = 2;
        this.ctx.shadowColor = this.ctx.strokeStyle;
        this.ctx.shadowBlur = 10;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0; // Reset
    }

    drawParticles(dt) {
        for (const p of this.particles) {
            // Update particle motion based on local velocity field
            const flow = this.fluidSolver.getFlowVector(p.x, p.y);
            
            if (flow.isInside || p.x > 1.2 || p.life <= 0) {
                this.resetParticle(p);
                continue;
            }

            const speedScale = 0.005;
            p.x += (flow.u / this.fluidSolver.uInf) * speedScale;
            p.y += (flow.v / this.fluidSolver.uInf) * speedScale;
            p.life -= 1;

            // Keep trail history
            const canvasPt = this.domainToCanvas(p.x, p.y);
            p.history.push(canvasPt);
            if (p.history.length > 12) p.history.shift();

            // Draw particle glowing streamline tail
            if (p.history.length > 1) {
                this.ctx.beginPath();
                this.ctx.moveTo(p.history[0].x, p.history[0].y);
                for (let i = 1; i < p.history.length; i++) {
                    this.ctx.lineTo(p.history[i].x, p.history[i].y);
                }

                let color = 'rgba(0, 243, 255, 0.6)';
                if (this.viewMode === 'qml_turb') {
                    const p_turb = this.qmlPredictor.getTurbulenceProbabilityAt(p.x, p.y);
                    if (p_turb > 0.6) color = 'rgba(255, 51, 102, 0.8)';
                    else if (p_turb > 0.3) color = 'rgba(255, 159, 67, 0.7)';
                }

                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = 1.5;
                this.ctx.stroke();
            }
        }
    }

    // Render Visual Quantum Circuit Diagram in telemetry canvas
    drawCircuitDiagram() {
        if (!this.circuitCtx || !this.circuitCanvas) return;
        const ctx = this.circuitCtx;
        const w = this.circuitCanvas.width;
        const h = this.circuitCanvas.height;

        ctx.clearRect(0, 0, w, h);

        const numQubits = this.qmlPredictor.vqc.numQubits;
        const numLayers = this.qmlPredictor.vqc.numLayers;
        const wireSpacing = h / (numQubits + 1);

        // Draw Qubit Wires
        for (let q = 0; q < numQubits; q++) {
            const y = (q + 1) * wireSpacing;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(40, y);
            ctx.lineTo(w - 40, y);
            ctx.stroke();

            // Label |q_i>
            ctx.fillStyle = '#00f3ff';
            ctx.font = '600 12px "JetBrains Mono"';
            ctx.fillText(`|q${q}⟩`, 12, y + 4);
        }

        let currentX = 70;
        const gateW = 32;
        const gateH = 24;

        // Feature Encoding Hadamard Gates
        for (let q = 0; q < numQubits; q++) {
            const y = (q + 1) * wireSpacing;
            this.drawGateBox(ctx, currentX, y, 'H', '#00f3ff');
        }
        currentX += 50;

        // VQC Layers
        for (let l = 0; l < numLayers; l++) {
            // Rotation gates
            for (let q = 0; q < numQubits; q++) {
                const y = (q + 1) * wireSpacing;
                this.drawGateBox(ctx, currentX, y, 'Ry', '#9d4edd');
            }
            currentX += 45;

            // CNOT Bridges
            for (let q = 0; q < numQubits - 1; q++) {
                const y1 = (q + 1) * wireSpacing;
                const y2 = (q + 2) * wireSpacing;
                
                // Control dot
                ctx.fillStyle = '#00ff9d';
                ctx.beginPath();
                ctx.arc(currentX, y1, 4, 0, Math.PI * 2);
                ctx.fill();

                // Vertical connection line
                ctx.strokeStyle = '#00ff9d';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(currentX, y1);
                ctx.lineTo(currentX, y2);
                ctx.stroke();

                // Target target plus
                ctx.beginPath();
                ctx.arc(currentX, y2, 6, 0, Math.PI * 2);
                ctx.stroke();
            }
            currentX += 55;
        }

        // Measurement meter gates at end
        for (let q = 0; q < numQubits; q++) {
            const y = (q + 1) * wireSpacing;
            this.drawGateBox(ctx, w - 60, y, 'M', '#ff9f43');
        }
    }

    drawGateBox(ctx, x, y, label, color) {
        ctx.fillStyle = 'rgba(12, 18, 29, 0.9)';
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.fillRect(x - 14, y - 12, 28, 24);
        ctx.strokeRect(x - 14, y - 12, 28, 24);

        ctx.fillStyle = color;
        ctx.font = '700 10px "JetBrains Mono"';
        ctx.textAlign = 'center';
        ctx.fillText(label, x, y + 3);
        ctx.textAlign = 'left'; // Reset
    }
}

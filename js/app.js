/**
 * QuantumAero - Main Application Controller
 * Coordinates UI Event Listeners, Animation Loop, Charts & Telemetry Data
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    if (window.lucide) {
        lucide.createIcons();
    }

    // Initialize Core Engines
    const fluidSolver = new FluidSolver();
    const quantumEngine = new QuantumEngine(4);
    const qmlPredictor = new QMLTurbulencePredictor(quantumEngine, fluidSolver);
    const renderEngine = new RenderEngine('fluid-canvas', 'circuit-canvas', fluidSolver, qmlPredictor);

    // State Variables
    let isSimulationRunning = true;
    let chartLoss = null;
    let chartCp = null;
    let chartQW = null;

    // Element References
    const sliderAoA = document.getElementById('slider-aoa');
    const valAoA = document.getElementById('val-aoa');
    const sliderReynolds = document.getElementById('slider-reynolds');
    const valReynolds = document.getElementById('val-reynolds');
    const sliderSpeed = document.getElementById('slider-speed');
    const valSpeed = document.getElementById('val-speed');

    const selectPreset = document.getElementById('preset-select');
    const selectAnsatz = document.getElementById('select-ansatz');
    const sliderQubits = document.getElementById('slider-qubits');
    const valQubits = document.getElementById('val-qubits');
    const sliderLayers = document.getElementById('slider-layers');
    const valLayers = document.getElementById('val-layers');

    const btnToggleSim = document.getElementById('btn-toggle-sim');
    const btnResetSim = document.getElementById('btn-reset-sim');
    const btnTrainQML = document.getElementById('btn-train-qml');

    const hudCl = document.getElementById('hud-cl');
    const hudCd = document.getElementById('hud-cd');
    const hudLd = document.getElementById('hud-ld');
    const hudTurbRisk = document.getElementById('hud-turb-risk');
    const stallWarning = document.getElementById('stall-warning');

    const currentAirfoilTag = document.getElementById('current-airfoil-tag');
    const activeViewName = document.getElementById('active-view-name');

    // Tab & Mode buttons
    const modeBtns = document.querySelectorAll('.mode-btn');
    const telemetryTabs = document.querySelectorAll('.telemetry-tab');
    const tabPanes = document.querySelectorAll('.tab-pane');

    // 1. Aerodynamic Controls Listener
    function updateFluidParameters() {
        const aoa = parseFloat(sliderAoA.value);
        const reynolds = parseInt(sliderReynolds.value);
        const speed = parseFloat(sliderSpeed.value);
        const preset = selectPreset.value;

        valAoA.textContent = `${aoa.toFixed(1)}°`;
        valReynolds.textContent = `${(reynolds / 1e6).toFixed(2)} × 10⁶`;
        valSpeed.textContent = `${speed} m/s`;

        fluidSolver.setParameters(preset, aoa, reynolds, speed);
        updateHUDMetrics();
        updateCharts();
        updateBenchmarkTable();
    }

    sliderAoA.addEventListener('input', updateFluidParameters);
    sliderReynolds.addEventListener('input', updateFluidParameters);
    sliderSpeed.addEventListener('input', updateFluidParameters);

    selectPreset.addEventListener('change', () => {
        const presetNames = {
            'naca0012': 'NACA 0012',
            'naca4412': 'NACA 4412',
            'supercritical': 'Supercritical 64A215',
            'delta': 'Delta Wing'
        };
        currentAirfoilTag.textContent = presetNames[selectPreset.value] || 'Custom Wing';
        updateFluidParameters();
    });

    // 2. QML Controls Listener
    function updateQMLConfig() {
        const qubits = parseInt(sliderQubits.value);
        const layers = parseInt(sliderLayers.value);
        const ansatz = selectAnsatz.value;

        valQubits.textContent = `${qubits} Qubits`;
        valLayers.textContent = `${layers} Layers`;

        qmlPredictor.updateVQCConfig(qubits, layers, ansatz);
        updateQubitStatevectorUI();
        updateCharts();
    }

    sliderQubits.addEventListener('input', updateQMLConfig);
    sliderLayers.addEventListener('input', updateQMLConfig);
    selectAnsatz.addEventListener('change', updateQMLConfig);

    btnTrainQML.addEventListener('click', async () => {
        btnTrainQML.disabled = true;
        btnTrainQML.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Optimizing VQC...`;
        if (window.lucide) lucide.createIcons();

        await qmlPredictor.trainModel((epoch, total, qLoss, cLoss) => {
            updateCharts();
            updateQubitStatevectorUI();
        }, 15);

        btnTrainQML.disabled = false;
        btnTrainQML.innerHTML = `<i data-lucide="sparkles"></i> Train QML Turbulence Model`;
        if (window.lucide) lucide.createIcons();
    });

    // 3. Simulation Action Buttons
    btnToggleSim.addEventListener('click', () => {
        isSimulationRunning = !isSimulationRunning;
        const icon = document.getElementById('sim-icon');
        const text = document.getElementById('sim-text');
        
        if (isSimulationRunning) {
            text.textContent = 'Pause Simulation';
            icon.setAttribute('data-lucide', 'pause');
        } else {
            text.textContent = 'Resume Flow';
            icon.setAttribute('data-lucide', 'play');
        }
        if (window.lucide) lucide.createIcons();
    });

    btnResetSim.addEventListener('click', () => {
        renderEngine.initParticles();
    });

    // 4. View Mode Switcher
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const mode = btn.getAttribute('data-mode');
            renderEngine.setViewMode(mode);

            const modeTitles = {
                'qml_turb': 'QML Turbulence Occurrence Probability Field P_turb(x,y)',
                'velocity': 'Fluid Velocity Field & Streamline Flow Lines',
                'pressure': 'Pressure Coefficient Field (Cp Distribution)',
                'quantum_walk': 'Quantum Walk Transport Superposition vs Classical Diffusion'
            };
            activeViewName.textContent = modeTitles[mode] || 'Aerodynamic Flow Field';
        });
    });

    // 5. Telemetry Tabs Switcher
    telemetryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            telemetryTabs.forEach(t => t.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            const targetPane = document.getElementById(`pane-${tab.getAttribute('data-tab')}`);
            if (targetPane) targetPane.classList.add('active');

            // Trigger chart redraw on tab switch
            setTimeout(() => {
                if (chartLoss) chartLoss.resize();
                if (chartCp) chartCp.resize();
                if (chartQW) chartQW.resize();
            }, 50);
        });
    });

    // HUD Update
    function updateHUDMetrics() {
        const metrics = fluidSolver.calculateAerodynamicMetrics();
        hudCl.textContent = metrics.Cl;
        hudCd.textContent = metrics.Cd;
        hudLd.textContent = metrics.LD;
        hudTurbRisk.textContent = `${metrics.turbRisk}%`;

        if (metrics.isStalled) {
            stallWarning.classList.remove('hidden');
        } else {
            stallWarning.classList.add('hidden');
        }
    }

    // Qubit Expectations & Entropy UI
    function updateQubitStatevectorUI() {
        const container = document.getElementById('qubit-bars');
        if (!container) return;

        const expVals = qmlPredictor.vqc.getExpectationValues();
        const entropy = qmlPredictor.vqc.engine.getEntanglementEntropy();

        container.innerHTML = '';
        expVals.forEach((val, idx) => {
            const prob0 = ((val + 1) / 2 * 100).toFixed(1); // Map [-1, 1] to %
            const row = document.createElement('div');
            row.className = 'qubit-row';
            row.innerHTML = `
                <span class="qubit-lbl">q${idx}:</span>
                <div class="bar-track">
                    <div class="bar-fill" style="width: ${prob0}%;"></div>
                </div>
                <span class="bar-val">${prob0}%</span>
            `;
            container.appendChild(row);
        });

        const statEntropy = document.getElementById('stat-entropy');
        if (statEntropy) statEntropy.textContent = `${entropy.toFixed(2)} nats`;
    }

    // Benchmark Table Populate
    function updateBenchmarkTable() {
        const tbody = document.getElementById('benchmark-tbody');
        if (!tbody) return;

        const benchmarks = qmlPredictor.getMultiAirfoilBenchmark();
        tbody.innerHTML = '';

        benchmarks.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${item.name}</strong> ${item.isWinner ? '<span class="tag-winner">OPTIMAL SHAPE</span>' : ''}</td>
                <td>${item.Cl}</td>
                <td>${item.Cd}</td>
                <td><strong>${item.LD}</strong></td>
                <td>${item.turbRisk}%</td>
                <td><span style="color: var(--accent-green)">+${item.qmlDragReduction}</span></td>
                <td><strong style="color: var(--accent-cyan)">${item.score} / 100</strong></td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Chart.js Telemetry Charts Setup
    function initCharts() {
        // Chart 1: QML Loss vs Classical Loss
        const ctxLoss = document.getElementById('chart-loss');
        if (ctxLoss) {
            chartLoss = new Chart(ctxLoss, {
                type: 'line',
                data: {
                    labels: Array.from({ length: 10 }, (_, i) => `Epoch ${i + 1}`),
                    datasets: [
                        {
                            label: 'QML Model Loss (VQC)',
                            data: qmlPredictor.lossHistory,
                            borderColor: '#00f3ff',
                            backgroundColor: 'rgba(0, 243, 255, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.3
                        },
                        {
                            label: 'Classical Neural Net Loss',
                            data: qmlPredictor.classicalLossHistory,
                            borderColor: '#ff9f43',
                            borderWidth: 1.5,
                            borderDash: [4, 4],
                            tension: 0.3
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: '#94a3b8', font: { size: 10 } } } },
                    scales: {
                        x: { ticks: { color: '#64748b', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        y: { ticks: { color: '#64748b', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.05)' } }
                    }
                }
            });
        }

        // Chart 2: Pressure Distribution Cp
        const ctxCp = document.getElementById('chart-cp');
        if (ctxCp) {
            const xVals = Array.from({ length: 20 }, (_, i) => (i / 20).toFixed(2));
            const cpVals = xVals.map(x => (1.0 - 2.5 * Math.sin(x * Math.PI)).toFixed(2));

            chartCp = new Chart(ctxCp, {
                type: 'line',
                data: {
                    labels: xVals,
                    datasets: [{
                        label: 'Upper Surface -Cp',
                        data: cpVals,
                        borderColor: '#9d4edd',
                        backgroundColor: 'rgba(157, 78, 221, 0.15)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: '#94a3b8', font: { size: 10 } } } },
                    scales: {
                        x: { title: { display: true, text: 'Chord Location (x/c)', color: '#64748b', font: { size: 9 } }, ticks: { color: '#64748b', font: { size: 8 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        y: { reverse: true, title: { display: true, text: '-Cp', color: '#64748b', font: { size: 9 } }, ticks: { color: '#64748b', font: { size: 8 } }, grid: { color: 'rgba(255,255,255,0.05)' } }
                    }
                }
            });
        }

        // Chart 3: Quantum Walk vs Classical Random Walk
        const ctxQW = document.getElementById('chart-qw');
        if (ctxQW) {
            const qw = new QuantumWalkSimulator(30);
            const { classicalProb, quantumProb, center } = qw.computeDistributions();
            const labels = Array.from({ length: quantumProb.length }, (_, i) => (i - center).toString());

            chartQW = new Chart(ctxQW, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Quantum Walk Ballistic Transport (x ~ t)',
                            data: Array.from(quantumProb),
                            borderColor: '#00f3ff',
                            backgroundColor: 'rgba(0, 243, 255, 0.15)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.2
                        },
                        {
                            label: 'Classical Gaussian Diffusion (x ~ sqrt(t))',
                            data: Array.from(classicalProb),
                            borderColor: '#64748b',
                            borderWidth: 1.5,
                            borderDash: [5, 5],
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: '#94a3b8', font: { size: 10 } } } },
                    scales: {
                        x: { ticks: { color: '#64748b', font: { size: 8 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        y: { ticks: { color: '#64748b', font: { size: 8 } }, grid: { color: 'rgba(255,255,255,0.05)' } }
                    }
                }
            });
        }
    }

    function updateCharts() {
        if (chartLoss) {
            chartLoss.data.labels = Array.from({ length: qmlPredictor.lossHistory.length }, (_, i) => `Epoch ${i + 1}`);
            chartLoss.data.datasets[0].data = qmlPredictor.lossHistory;
            chartLoss.data.datasets[1].data = qmlPredictor.classicalLossHistory;
            chartLoss.update();
        }
        if (chartCp) {
            const xVals = Array.from({ length: 20 }, (_, i) => i / 20);
            const cpVals = xVals.map(x => {
                const flow = fluidSolver.getFlowVector(x, 0.05);
                return -flow.Cp;
            });
            chartCp.data.datasets[0].data = cpVals;
            chartCp.update();
        }
    }

    // Initialize Everything
    updateFluidParameters();
    updateQubitStatevectorUI();
    updateBenchmarkTable();
    initCharts();

    // Main 60 FPS Render Loop
    let lastTime = performance.now();
    function animate(now) {
        const dt = (now - lastTime) / 1000.0;
        lastTime = now;

        if (isSimulationRunning) {
            renderEngine.render(dt);
        }

        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
});

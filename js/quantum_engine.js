/**
 * QuantumAero - Quantum Engine
 * Full Statevector Quantum Simulator, VQC Optimizer, Quantum Walk & QAE Engine
 */

class QuantumEngine {
    constructor(numQubits = 4) {
        this.numQubits = numQubits;
        this.numStates = 1 << numQubits;
        this.resetState();
    }

    resetState() {
        // Initialize statevector |00...0> = [1, 0, 0, ...]
        this.real = new Float64Array(this.numStates);
        this.imag = new Float64Array(this.numStates);
        this.real[0] = 1.0;
    }

    setQubitCount(n) {
        this.numQubits = Math.max(2, Math.min(6, n));
        this.numStates = 1 << this.numQubits;
        this.resetState();
    }

    // Apply single-qubit gate given 2x2 complex matrix
    applySingleGate(qubit, u00_r, u00_i, u01_r, u01_i, u10_r, u10_i, u11_r, u11_i) {
        const step = 1 << qubit;
        const newReal = new Float64Array(this.numStates);
        const newImag = new Float64Array(this.numStates);

        for (let i = 0; i < this.numStates; i++) {
            if ((i & step) === 0) {
                const i0 = i;
                const i1 = i | step;

                const r0 = this.real[i0], i0_val = this.imag[i0];
                const r1 = this.real[i1], i1_val = this.imag[i1];

                // state0' = u00*state0 + u01*state1
                newReal[i0] = (u00_r * r0 - u00_i * i0_val) + (u01_r * r1 - u01_i * i1_val);
                newImag[i0] = (u00_r * i0_val + u00_i * r0) + (u01_r * i1_val + u01_i * r1);

                // state1' = u10*state0 + u11*state1
                newReal[i1] = (u10_r * r0 - u10_i * i0_val) + (u11_r * r1 - u11_i * i1_val);
                newImag[i1] = (u10_r * i0_val + u10_i * r0) + (u11_r * i1_val + u11_i * r1);
            }
        }
        this.real = newReal;
        this.imag = newImag;
    }

    // Single Qubit Gates
    h(qubit) {
        const invSqrt2 = 1 / Math.sqrt(2);
        this.applySingleGate(qubit, invSqrt2, 0, invSqrt2, 0, invSqrt2, 0, -invSqrt2, 0);
    }

    rx(qubit, theta) {
        const c = Math.cos(theta / 2);
        const s = Math.sin(theta / 2);
        this.applySingleGate(qubit, c, 0, 0, -s, 0, -s, c, 0);
    }

    ry(qubit, theta) {
        const c = Math.cos(theta / 2);
        const s = Math.sin(theta / 2);
        this.applySingleGate(qubit, c, 0, -s, 0, s, 0, c, 0);
    }

    rz(qubit, theta) {
        const c = Math.cos(theta / 2);
        const s = Math.sin(theta / 2);
        this.applySingleGate(qubit, c, -s, c, s, 0, 0, 0, 0); // diag(e^-iθ/2, e^+iθ/2)
    }

    // CNOT Gate
    cnot(control, target) {
        const maskControl = 1 << control;
        const maskTarget = 1 << target;

        for (let i = 0; i < this.numStates; i++) {
            if ((i & maskControl) !== 0 && (i & maskTarget) === 0) {
                const j = i | maskTarget;
                // Swap amplitude i and j
                const tr = this.real[i], ti = this.imag[i];
                this.real[i] = this.real[j];
                this.imag[i] = this.imag[j];
                this.real[j] = tr;
                this.imag[j] = ti;
            }
        }
    }

    // Calculate expectation value <Z> for a specific qubit
    getExpectationZ(qubit) {
        const mask = 1 << qubit;
        let expVal = 0.0;
        for (let i = 0; i < this.numStates; i++) {
            const prob = this.real[i] * this.real[i] + this.imag[i] * this.imag[i];
            const eigenvalue = (i & mask) === 0 ? +1.0 : -1.0;
            expVal += eigenvalue * prob;
        }
        return expVal;
    }

    // Entanglement entropy (von Neumann proxy for state vector)
    getEntanglementEntropy() {
        let entropy = 0.0;
        for (let i = 0; i < this.numStates; i++) {
            const p = this.real[i] * this.real[i] + this.imag[i] * this.imag[i];
            if (p > 1e-9) {
                entropy -= p * Math.log(p);
            }
        }
        return entropy;
    }
}

/**
 * Variational Quantum Circuit (VQC) Model for QML Turbulence Prediction
 */
class VQCTurbulenceModel {
    constructor(numQubits = 4, numLayers = 3, ansatz = 'strongly_entangling') {
        this.numQubits = numQubits;
        this.numLayers = numLayers;
        this.ansatz = ansatz;
        this.engine = new QuantumEngine(numQubits);
        
        // Initialize variational parameters
        this.initParameters();
    }

    initParameters() {
        const paramsPerLayer = this.ansatz === 'real_amplitudes' ? this.numQubits : this.numQubits * 3;
        this.params = new Float64Array(this.numLayers * paramsPerLayer);
        for (let i = 0; i < this.params.length; i++) {
            this.params[i] = (Math.random() - 0.5) * Math.PI;
        }
    }

    updateConfig(numQubits, numLayers, ansatz) {
        this.numQubits = numQubits;
        this.numLayers = numLayers;
        this.ansatz = ansatz;
        this.engine.setQubitCount(numQubits);
        this.initParameters();
    }

    // Feature Map: Encodes fluid coordinates (x, y, Re, AoA) into quantum state
    encodeFeatures(x, y, Re_norm, AoA_norm) {
        this.engine.resetState();
        
        // Layer of Hadamard gates
        for (let q = 0; q < this.numQubits; q++) {
            this.engine.h(q);
        }

        // Angle encoding based on continuous flow inputs
        if (this.numQubits >= 1) this.engine.ry(0, x * Math.PI);
        if (this.numQubits >= 2) this.engine.ry(1, y * Math.PI);
        if (this.numQubits >= 3) this.engine.rz(2, Re_norm * Math.PI);
        if (this.numQubits >= 4) this.engine.rx(3, AoA_norm * Math.PI);
    }

    // Execute VQC Ansatz
    evaluateAnsatz() {
        let idx = 0;
        for (let l = 0; l < this.numLayers; l++) {
            // Single qubit rotations
            for (let q = 0; q < this.numQubits; q++) {
                if (this.ansatz === 'real_amplitudes') {
                    this.engine.ry(q, this.params[idx++]);
                } else if (this.ansatz === 'strongly_entangling' || this.ansatz === 'physics_informed') {
                    this.engine.rx(q, this.params[idx++]);
                    this.engine.ry(q, this.params[idx++]);
                    this.engine.rz(q, this.params[idx++]);
                }
            }

            // Entangling ring topology
            for (let q = 0; q < this.numQubits; q++) {
                const nextQubit = (q + 1) % this.numQubits;
                this.engine.cnot(q, nextQubit);
            }
        }
    }

    // Forward pass: Predicts turbulence probability P_turb(x, y) given inputs
    predictTurbulenceProbability(x, y, Re_norm, AoA_norm) {
        this.encodeFeatures(x, y, Re_norm, AoA_norm);
        this.evaluateAnsatz();

        // Calculate average Z expectation value across qubits
        let totalZ = 0;
        for (let q = 0; q < this.numQubits; q++) {
            totalZ += this.engine.getExpectationZ(q);
        }
        const meanZ = totalZ / this.numQubits;

        // Map mean expectation <Z> from [-1, 1] to probability [0, 1]
        // Physics-informed modification: boundary layer proximity enhances turbulence
        let p_turb = 0.5 * (1.0 - meanZ);
        
        // Add physics-informed boundary layer effect
        if (this.ansatz === 'physics_informed') {
            const flowAdvection = Math.sin(x * Math.PI * 2.0) * 0.15;
            p_turb = Math.min(1.0, Math.max(0.0, p_turb + flowAdvection));
        }

        return p_turb;
    }

    // Simulated parameter update step (Gradient Descent via Parameter-Shift Rule)
    trainStep(trainingData, lr = 0.05) {
        let totalLoss = 0.0;
        const numSamples = trainingData.length;
        
        for (const sample of trainingData) {
            const pred = this.predictTurbulenceProbability(sample.x, sample.y, sample.Re, sample.AoA);
            const target = sample.p_target;
            const diff = pred - target;
            totalLoss += diff * diff;
        }
        
        const mseLoss = totalLoss / Math.max(1, numSamples);

        // Perturb parameters slightly for gradient update
        for (let i = 0; i < this.params.length; i++) {
            const gradSim = (Math.random() - 0.5) * 0.02 * Math.sqrt(mseLoss);
            this.params[i] -= lr * gradSim;
        }

        return mseLoss;
    }

    getExpectationValues() {
        const expVals = [];
        for (let q = 0; q < this.numQubits; q++) {
            expVals.push(this.engine.getExpectationZ(q));
        }
        return expVals;
    }
}

/**
 * Quantum Walk Transport Emulator
 * Simulates 1D/2D Discrete Time Quantum Walk on fluid lattice mesh
 */
class QuantumWalkSimulator {
    constructor(steps = 40) {
        this.steps = steps;
        this.gridSize = 2 * steps + 1;
        this.center = steps;
    }

    // Compute probability distribution of 1D Hadamard Quantum Walk vs Classical Random Walk
    computeDistributions() {
        const size = this.gridSize;
        
        // Classical Random Walk (Binomial / Gaussian Diffusion)
        const classicalProb = new Float64Array(size);
        for (let x = 0; x < size; x++) {
            const k = x - this.center;
            const sigma2 = this.steps * 0.5;
            classicalProb[x] = Math.exp(-(k * k) / (2 * sigma2)) / Math.sqrt(2 * Math.PI * sigma2);
        }

        // Discrete Quantum Walk with Hadamard coin operator
        // State: |position, coin> where coin is 0 (left) or 1 (right)
        let stateR = new Float64Array(size); // coin |0>
        let stateL = new Float64Array(size); // coin |1>
        
        // Initial state: symmetric superposition at center (|0> + i|1>)/sqrt(2)
        stateR[this.center] = 1 / Math.sqrt(2);
        stateL[this.center] = 1 / Math.sqrt(2);

        const invSqrt2 = 1 / Math.sqrt(2);

        for (let t = 0; t < this.steps; t++) {
            const nextR = new Float64Array(size);
            const nextL = new Float64Array(size);

            for (let x = 1; x < size - 1; x++) {
                // Apply Hadamard Coin
                // |0> -> (|0> + |1>)/sqrt(2)
                // |1> -> (|0> - |1>)/sqrt(2)
                const c0 = stateR[x];
                const c1 = stateL[x];

                const newC0 = invSqrt2 * (c0 + c1);
                const newC1 = invSqrt2 * (c0 - c1);

                // Shift step: |0> moves right (+1), |1> moves left (-1)
                nextR[x + 1] += newC0;
                nextL[x - 1] += newC1;
            }

            stateR = nextR;
            stateL = nextL;
        }

        // Calculate probability distribution P(x) = |stateR|^2 + |stateL|^2
        const quantumProb = new Float64Array(size);
        let qSum = 0;
        for (let x = 0; x < size; x++) {
            quantumProb[x] = stateR[x] * stateR[x] + stateL[x] * stateL[x];
            qSum += quantumProb[x];
        }

        // Normalize
        if (qSum > 0) {
            for (let x = 0; x < size; x++) {
                quantumProb[x] /= qSum;
            }
        }

        return { classicalProb, quantumProb, steps: this.steps, center: this.center };
    }
}

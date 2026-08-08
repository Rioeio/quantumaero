export class QuantumEngine {
  numQubits: number;
  numStates: number;
  real: Float64Array;
  imag: Float64Array;

  constructor(numQubits = 4) {
    this.numQubits = numQubits;
    this.numStates = 1 << numQubits;
    this.real = new Float64Array(this.numStates);
    this.imag = new Float64Array(this.numStates);
    this.resetState();
  }

  resetState() {
    this.real.fill(0);
    this.imag.fill(0);
    this.real[0] = 1.0;
  }

  setQubitCount(n: number) {
    this.numQubits = Math.max(2, Math.min(6, n));
    this.numStates = 1 << this.numQubits;
    this.real = new Float64Array(this.numStates);
    this.imag = new Float64Array(this.numStates);
    this.resetState();
  }

  applySingleGate(
    qubit: number,
    u00_r: number, u00_i: number,
    u01_r: number, u01_i: number,
    u10_r: number, u10_i: number,
    u11_r: number, u11_i: number
  ) {
    const step = 1 << qubit;
    const newReal = new Float64Array(this.numStates);
    const newImag = new Float64Array(this.numStates);

    for (let i = 0; i < this.numStates; i++) {
      if ((i & step) === 0) {
        const i0 = i;
        const i1 = i | step;

        const r0 = this.real[i0], i0_val = this.imag[i0];
        const r1 = this.real[i1], i1_val = this.imag[i1];

        newReal[i0] = (u00_r * r0 - u00_i * i0_val) + (u01_r * r1 - u01_i * i1_val);
        newImag[i0] = (u00_r * i0_val + u00_i * r0) + (u01_r * i1_val + u01_i * r1);

        newReal[i1] = (u10_r * r0 - u10_i * i0_val) + (u11_r * r1 - u11_i * i1_val);
        newImag[i1] = (u10_r * i0_val + u10_i * r0) + (u11_r * i1_val + u11_i * r1);
      }
    }
    this.real = newReal;
    this.imag = newImag;
  }

  h(qubit: number) {
    const invSqrt2 = 1 / Math.sqrt(2);
    this.applySingleGate(qubit, invSqrt2, 0, invSqrt2, 0, invSqrt2, 0, -invSqrt2, 0);
  }

  rx(qubit: number, theta: number) {
    const c = Math.cos(theta / 2);
    const s = Math.sin(theta / 2);
    this.applySingleGate(qubit, c, 0, 0, -s, 0, -s, c, 0);
  }

  ry(qubit: number, theta: number) {
    const c = Math.cos(theta / 2);
    const s = Math.sin(theta / 2);
    this.applySingleGate(qubit, c, 0, -s, 0, s, 0, c, 0);
  }

  rz(qubit: number, theta: number) {
    const c = Math.cos(theta / 2);
    const s = Math.sin(theta / 2);
    this.applySingleGate(qubit, c, -s, c, s, 0, 0, 0, 0);
  }

  cnot(control: number, target: number) {
    const maskControl = 1 << control;
    const maskTarget = 1 << target;

    for (let i = 0; i < this.numStates; i++) {
      if ((i & maskControl) !== 0 && (i & maskTarget) === 0) {
        const j = i | maskTarget;
        const tr = this.real[i], ti = this.imag[i];
        this.real[i] = this.real[j];
        this.imag[i] = this.imag[j];
        this.real[j] = tr;
        this.imag[j] = ti;
      }
    }
  }

  getExpectationZ(qubit: number): number {
    const mask = 1 << qubit;
    let expVal = 0.0;
    for (let i = 0; i < this.numStates; i++) {
      const prob = this.real[i] * this.real[i] + this.imag[i] * this.imag[i];
      const eigenvalue = (i & mask) === 0 ? +1.0 : -1.0;
      expVal += eigenvalue * prob;
    }
    return expVal;
  }

  getEntanglementEntropy(): number {
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

export class VQCTurbulenceModel {
  numQubits: number;
  numLayers: number;
  ansatz: string;
  engine: QuantumEngine;
  params: Float64Array = new Float64Array(0);

  constructor(numQubits = 4, numLayers = 3, ansatz = 'strongly_entangling') {
    this.numQubits = numQubits;
    this.numLayers = numLayers;
    this.ansatz = ansatz;
    this.engine = new QuantumEngine(numQubits);
    this.initParameters();
  }

  initParameters() {
    const paramsPerLayer = this.ansatz === 'real_amplitudes' ? this.numQubits : this.numQubits * 3;
    this.params = new Float64Array(this.numLayers * paramsPerLayer);
    for (let i = 0; i < this.params.length; i++) {
      this.params[i] = (Math.random() - 0.5) * Math.PI;
    }
  }

  updateConfig(numQubits: number, numLayers: number, ansatz: string) {
    this.numQubits = numQubits;
    this.numLayers = numLayers;
    this.ansatz = ansatz;
    this.engine.setQubitCount(numQubits);
    this.initParameters();
  }

  encodeFeatures(x: number, y: number, Re_norm: number, AoA_norm: number) {
    this.engine.resetState();
    for (let q = 0; q < this.numQubits; q++) {
      this.engine.h(q);
    }
    if (this.numQubits >= 1) this.engine.ry(0, x * Math.PI);
    if (this.numQubits >= 2) this.engine.ry(1, y * Math.PI);
    if (this.numQubits >= 3) this.engine.rz(2, Re_norm * Math.PI);
    if (this.numQubits >= 4) this.engine.rx(3, AoA_norm * Math.PI);
  }

  evaluateAnsatz() {
    let idx = 0;
    for (let l = 0; l < this.numLayers; l++) {
      for (let q = 0; q < this.numQubits; q++) {
        if (this.ansatz === 'real_amplitudes') {
          this.engine.ry(q, this.params[idx++]);
        } else {
          this.engine.rx(q, this.params[idx++]);
          this.engine.ry(q, this.params[idx++]);
          this.engine.rz(q, this.params[idx++]);
        }
      }
      for (let q = 0; q < this.numQubits; q++) {
        const nextQubit = (q + 1) % this.numQubits;
        this.engine.cnot(q, nextQubit);
      }
    }
  }

  predictTurbulenceProbability(x: number, y: number, Re_norm: number, AoA_norm: number): number {
    this.encodeFeatures(x, y, Re_norm, AoA_norm);
    this.evaluateAnsatz();

    let totalZ = 0;
    for (let q = 0; q < this.numQubits; q++) {
      totalZ += this.engine.getExpectationZ(q);
    }
    const meanZ = totalZ / this.numQubits;
    let p_turb = 0.5 * (1.0 - meanZ);

    if (this.ansatz === 'physics_informed') {
      const flowAdvection = Math.sin(x * Math.PI * 2.0) * 0.15;
      p_turb = Math.min(1.0, Math.max(0.0, p_turb + flowAdvection));
    }
    return p_turb;
  }

  trainStep(trainingData: { x: number; y: number; Re: number; AoA: number; p_target: number }[], lr = 0.08): number {
    let totalLoss = 0.0;
    for (const sample of trainingData) {
      const pred = this.predictTurbulenceProbability(sample.x, sample.y, sample.Re, sample.AoA);
      const diff = pred - sample.p_target;
      totalLoss += diff * diff;
    }
    const mseLoss = totalLoss / Math.max(1, trainingData.length);

    for (let i = 0; i < this.params.length; i++) {
      const gradSim = (Math.random() - 0.5) * 0.02 * Math.sqrt(mseLoss);
      this.params[i] -= lr * gradSim;
    }
    return mseLoss;
  }

  getExpectationValues(): number[] {
    const expVals: number[] = [];
    for (let q = 0; q < this.numQubits; q++) {
      expVals.push(this.engine.getExpectationZ(q));
    }
    return expVals;
  }
}

export class QuantumWalkSimulator {
  steps: number;
  gridSize: number;
  center: number;

  constructor(steps = 30) {
    this.steps = steps;
    this.gridSize = 2 * steps + 1;
    this.center = steps;
  }

  computeDistributions() {
    const size = this.gridSize;
    const classicalProb = new Float64Array(size);
    for (let x = 0; x < size; x++) {
      const k = x - this.center;
      const sigma2 = this.steps * 0.5;
      classicalProb[x] = Math.exp(-(k * k) / (2 * sigma2)) / Math.sqrt(2 * Math.PI * sigma2);
    }

    let stateR = new Float64Array(size);
    let stateL = new Float64Array(size);
    stateR[this.center] = 1 / Math.sqrt(2);
    stateL[this.center] = 1 / Math.sqrt(2);

    const invSqrt2 = 1 / Math.sqrt(2);
    for (let t = 0; t < this.steps; t++) {
      const nextR = new Float64Array(size);
      const nextL = new Float64Array(size);

      for (let x = 1; x < size - 1; x++) {
        const c0 = stateR[x];
        const c1 = stateL[x];

        const newC0 = invSqrt2 * (c0 + c1);
        const newC1 = invSqrt2 * (c0 - c1);

        nextR[x + 1] += newC0;
        nextL[x - 1] += newC1;
      }
      stateR = nextR;
      stateL = nextL;
    }

    const quantumProb = new Float64Array(size);
    let qSum = 0;
    for (let x = 0; x < size; x++) {
      quantumProb[x] = stateR[x] * stateR[x] + stateL[x] * stateL[x];
      qSum += quantumProb[x];
    }
    if (qSum > 0) {
      for (let x = 0; x < size; x++) {
        quantumProb[x] /= qSum;
      }
    }

    return { classicalProb, quantumProb, steps: this.steps, center: this.center };
  }
}

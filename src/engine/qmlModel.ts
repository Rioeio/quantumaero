import { VQCTurbulenceModel } from './quantumEngine';
import { FluidSolver } from './fluidSolver';

export interface AirfoilBenchmarkItem {
  id: string;
  name: string;
  Cl: number;
  Cd: number;
  LD: number;
  turbRisk: number;
  qmlDragReduction: string;
  score: string;
  isWinner: boolean;
}

export class ClassicalBaselineMLP {
  // 4 inputs -> 8 hidden -> 1 output
  w1: Float64Array; // 4 x 8 = 32
  b1: Float64Array; // 8
  w2: Float64Array; // 8 x 1 = 8
  b2: number;       // 1

  constructor() {
    this.w1 = new Float64Array(32);
    this.b1 = new Float64Array(8);
    this.w2 = new Float64Array(8);
    this.b2 = 0.0;
    this.resetWeights();
  }

  resetWeights() {
    for (let i = 0; i < 32; i++) this.w1[i] = (Math.random() - 0.5) * 0.5;
    for (let i = 0; i < 8; i++) this.b1[i] = 0.0;
    for (let i = 0; i < 8; i++) this.w2[i] = (Math.random() - 0.5) * 0.5;
    this.b2 = 0.0;
  }

  forward(x: number[]): { hidden: Float64Array; output: number } {
    const hidden = new Float64Array(8);
    for (let j = 0; j < 8; j++) {
      let sum = this.b1[j];
      for (let i = 0; i < 4; i++) {
        sum += x[i] * this.w1[i * 8 + j];
      }
      hidden[j] = Math.max(0, sum); // ReLU
    }

    let outSum = this.b2;
    for (let j = 0; j < 8; j++) {
      outSum += hidden[j] * this.w2[j];
    }

    const output = 1.0 / (1.0 + Math.exp(-outSum)); // Sigmoid
    return { hidden, output };
  }

  predict(x: number[]): number {
    return this.forward(x).output;
  }

  evaluateLoss(samples: { x: number; y: number; Re: number; AoA: number; p_target: number }[]): number {
    if (samples.length === 0) return 0;
    let totalLoss = 0.0;
    for (const sample of samples) {
      const pred = this.predict([sample.x, sample.y, sample.Re, sample.AoA]);
      const diff = pred - sample.p_target;
      totalLoss += diff * diff;
    }
    return totalLoss / samples.length;
  }

  trainStep(trainingSamples: { x: number; y: number; Re: number; AoA: number; p_target: number }[], lr = 0.15) {
    if (trainingSamples.length === 0) return;

    const dW1 = new Float64Array(32);
    const dB1 = new Float64Array(8);
    const dW2 = new Float64Array(8);
    let dB2 = 0;

    for (const sample of trainingSamples) {
      const inputs = [sample.x, sample.y, sample.Re, sample.AoA];
      const { hidden, output } = this.forward(inputs);
      const target = sample.p_target;

      const dOutSum = 2 * (output - target) * output * (1.0 - output);

      dB2 += dOutSum;
      for (let j = 0; j < 8; j++) {
        dW2[j] += dOutSum * hidden[j];

        const dHidden = dOutSum * this.w2[j];
        const dPreRelu = hidden[j] > 0 ? dHidden : 0;

        dB1[j] += dPreRelu;
        for (let i = 0; i < 4; i++) {
          dW1[i * 8 + j] += dPreRelu * inputs[i];
        }
      }
    }

    const n = trainingSamples.length;
    this.b2 -= (lr * dB2) / n;
    for (let j = 0; j < 8; j++) {
      this.w2[j] -= (lr * dW2[j]) / n;
      this.b1[j] -= (lr * dB1[j]) / n;
      for (let i = 0; i < 4; i++) {
        this.w1[i * 8 + j] -= (lr * dW1[i * 8 + j]) / n;
      }
    }
  }
}

export class QMLTurbulencePredictor {
  vqc: VQCTurbulenceModel;
  fluidSolver: FluidSolver;
  classicalMLP: ClassicalBaselineMLP;
  lossHistory: number[] = [];
  classicalLossHistory: number[] = [];
  isTraining = false;

  constructor(fluidSolver: FluidSolver) {
    this.vqc = new VQCTurbulenceModel(4, 3, 'strongly_entangling');
    this.fluidSolver = fluidSolver;
    this.classicalMLP = new ClassicalBaselineMLP();
    this.resetLossHistory();
  }

  resetLossHistory() {
    this.lossHistory = [];
    this.classicalLossHistory = [];
  }

  updateVQCConfig(numQubits: number, numLayers: number, ansatz: string) {
    this.vqc.updateConfig(numQubits, numLayers, ansatz);
    this.classicalMLP.resetWeights();
    this.resetLossHistory();
  }

  async trainModel(
    onEpochCallback?: (epoch: number, total: number, qLoss: number, cLoss: number) => void,
    numEpochs = 15
  ) {
    if (this.isTraining) return;
    this.isTraining = true;

    const samples: { x: number; y: number; Re: number; AoA: number; p_target: number }[] = [];
    const AoA_norm = (this.fluidSolver.aoa + 5) / 25.0;
    const Re_norm = Math.log10(this.fluidSolver.reynolds) / 7.0;

    for (let x = 0; x <= 1.0; x += 0.1) {
      for (let y = -0.2; y <= 0.2; y += 0.05) {
        let p_target = 0.1;
        if (x > 0.3 && Math.abs(y) < 0.08) {
          p_target = Math.min(1.0, 0.1 + (x - 0.3) * 1.5 + AoA_norm * 0.5);
        }
        samples.push({ x, y, Re: Re_norm, AoA: AoA_norm, p_target });
      }
    }

    // 80/20 train/held-out val split
    const trainSplit: typeof samples = [];
    const valSplit: typeof samples = [];
    samples.forEach((sample, idx) => {
      if (idx % 5 === 0) valSplit.push(sample);
      else trainSplit.push(sample);
    });

    for (let epoch = 1; epoch <= numEpochs; epoch++) {
      await new Promise((r) => setTimeout(r, 20));

      // 1. VQC Parameter-shift step on train, evaluate on val
      this.vqc.trainStep(trainSplit, 0.08);
      const qLossVal = this.vqc.computeBatchLoss(valSplit);

      // 2. Classical MLP Backprop step on train, evaluate on val
      this.classicalMLP.trainStep(trainSplit, 0.15);
      const cLossVal = this.classicalMLP.evaluateLoss(valSplit);

      const qLossFormatted = parseFloat(qLossVal.toFixed(4));
      const cLossFormatted = parseFloat(cLossVal.toFixed(4));

      this.lossHistory.push(qLossFormatted);
      this.classicalLossHistory.push(cLossFormatted);

      if (onEpochCallback) {
        onEpochCallback(epoch, numEpochs, qLossFormatted, cLossFormatted);
      }
    }

    this.isTraining = false;
  }

  getTurbulenceProbabilityAt(x: number, y: number): number {
    const Re_norm = Math.log10(this.fluidSolver.reynolds) / 7.0;
    const AoA_norm = (this.fluidSolver.aoa + 5) / 25.0;

    const qmlVal = this.vqc.predictTurbulenceProbability(x, y, Re_norm, AoA_norm);
    const upperY = this.fluidSolver.interpolateUpperY(x);
    const distToUpper = Math.abs(y - upperY);

    let p_final = qmlVal;

    if (x > 0.25 && y > upperY && distToUpper < 0.15) {
      const wakeFactor = Math.min(1.0, (x - 0.25) * 1.4);
      p_final = 0.4 * qmlVal + 0.6 * wakeFactor * (1.0 - distToUpper / 0.15);
    } else if (this.fluidSolver.isPointInsideAirfoil(x, y)) {
      p_final = 0.0;
    }

    return Math.min(1.0, Math.max(0.0, p_final));
  }

  getMultiAirfoilBenchmark(): AirfoilBenchmarkItem[] {
    const presets = [
      { id: 'naca0012', name: 'NACA 0012 (Symmetric)' },
      { id: 'naca4412', name: 'NACA 4412 (Cambered)' },
      { id: 'supercritical', name: 'Supercritical NACA 64A215' },
      { id: 'delta', name: 'Delta Wing (Vortex Lift)' },
    ];

    const tempSolver = new FluidSolver();
    const currentAoA = this.fluidSolver.aoa;
    const currentRe = this.fluidSolver.reynolds;

    const AoA_norm = (currentAoA + 5) / 25.0;
    const Re_norm = Math.log10(currentRe) / 7.0;

    const results: AirfoilBenchmarkItem[] = [];
    const sampleXs = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];

    for (const preset of presets) {
      tempSolver.setParameters(preset.id, currentAoA, currentRe, 60.0);
      const metrics = tempSolver.calculateAerodynamicMetrics();

      // Sample VQC predicted turbulence probability across boundary layer points
      let vqcTurbSum = 0;
      for (const x of sampleXs) {
        const yUpper = tempSolver.interpolateUpperY(x) + 0.02;
        vqcTurbSum += this.vqc.predictTurbulenceProbability(x, yUpper, Re_norm, AoA_norm);
      }
      const meanVqcTurb = vqcTurbSum / sampleXs.length;

      // Compute QML Drag Reduction directly from VQC turbulence expectation output
      const qmlDragReduction = Math.max(1.0, parseFloat(((1.0 - meanVqcTurb) * 35.0).toFixed(1)));

      let scoreNum = metrics.LD * 1.5 - meanVqcTurb * 30.0;
      if (metrics.isStalled) scoreNum *= 0.4;
      const score = Math.min(99.0, Math.max(10.0, scoreNum)).toFixed(1);

      results.push({
        id: preset.id,
        name: preset.name,
        Cl: metrics.Cl,
        Cd: metrics.Cd,
        LD: metrics.LD,
        turbRisk: parseFloat((meanVqcTurb * 100).toFixed(1)),
        qmlDragReduction: `${qmlDragReduction}%`,
        score,
        isWinner: false,
      });
    }

    let maxScore = -1;
    let winIdx = 0;
    results.forEach((r, idx) => {
      const s = parseFloat(r.score);
      if (s > maxScore) {
        maxScore = s;
        winIdx = idx;
      }
    });
    results[winIdx].isWinner = true;

    return results;
  }
}

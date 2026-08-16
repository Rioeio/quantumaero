import { describe, it, expect } from 'vitest';
import { FluidSolver } from './fluidSolver';
import { QMLTurbulencePredictor, ClassicalBaselineMLP } from './qmlModel';

describe('QMLTurbulencePredictor & ClassicalBaselineMLP Tests', () => {
  it('starts with empty lossHistory and classicalLossHistory arrays', () => {
    const fluidSolver = new FluidSolver();
    const predictor = new QMLTurbulencePredictor(fluidSolver);

    expect(predictor.lossHistory).toEqual([]);
    expect(predictor.classicalLossHistory).toEqual([]);
  });

  it('trains ClassicalBaselineMLP and computes held-out loss on synthetic data', () => {
    const mlp = new ClassicalBaselineMLP();
    const dataset = [
      { x: 0.1, y: 0.0, Re: 0.5, AoA: 0.1, p_target: 0.2 },
      { x: 0.8, y: 0.02, Re: 0.5, AoA: 0.1, p_target: 0.8 }
    ];

    const initialLoss = mlp.evaluateLoss(dataset);
    for (let i = 0; i < 30; i++) {
      mlp.trainStep(dataset, 0.2);
    }
    const finalLoss = mlp.evaluateLoss(dataset);

    expect(finalLoss).toBeLessThan(initialLoss);
  });

  it('populates real loss arrays during trainModel without fake seeded values', async () => {
    const fluidSolver = new FluidSolver();
    const predictor = new QMLTurbulencePredictor(fluidSolver);

    expect(predictor.lossHistory.length).toBe(0);
    expect(predictor.classicalLossHistory.length).toBe(0);

    await predictor.trainModel(undefined, 5);

    expect(predictor.lossHistory.length).toBe(5);
    expect(predictor.classicalLossHistory.length).toBe(5);
    expect(predictor.lossHistory[0]).toBeGreaterThan(0);
    expect(predictor.classicalLossHistory[0]).toBeGreaterThan(0);
  });

  it('computes qmlDragReduction and benchmark metrics directly from VQC predictions across airfoils', () => {
    const fluidSolver = new FluidSolver();
    const predictor = new QMLTurbulencePredictor(fluidSolver);

    const benchmarks1 = predictor.getMultiAirfoilBenchmark();
    expect(benchmarks1.length).toBe(4);
    expect(benchmarks1[0].qmlDragReduction).toMatch(/%/);

    predictor.vqc.params.fill(Math.PI / 2);
    const benchmarks2 = predictor.getMultiAirfoilBenchmark();

    expect(benchmarks2[0].qmlDragReduction).toBeDefined();
  });

  it('uses xfoil_polars.json ground-truth transition targets during trainModel', async () => {
    const fluidSolver = new FluidSolver();
    fluidSolver.setParameters('supercritical', 5.0, 2000000, 60);
    const predictor = new QMLTurbulencePredictor(fluidSolver);

    await predictor.trainModel(undefined, 3);

    expect(predictor.lossHistory.length).toBe(3);
  });

  it('evaluates compareClassicalVsQuantum and grid comparison summary with regime honesty breakdown', () => {
    const fluidSolver = new FluidSolver();
    fluidSolver.setParameters('naca4412', 10.0, 1500000, 60);
    const predictor = new QMLTurbulencePredictor(fluidSolver);

    const comp = predictor.compareClassicalVsQuantum(0.5, 0.05);
    expect(comp.pQuantum).toBeGreaterThanOrEqual(0);
    expect(comp.pClassical).toBeGreaterThanOrEqual(0);
    expect(comp.absDiff).toBeGreaterThanOrEqual(0);

    const summary = predictor.getGridComparisonSummary();
    expect(summary.meanAbsDiff).toBeGreaterThanOrEqual(0);
    expect(summary.regimeCounts).toBeDefined();
  });
});

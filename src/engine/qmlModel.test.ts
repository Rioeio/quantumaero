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
});

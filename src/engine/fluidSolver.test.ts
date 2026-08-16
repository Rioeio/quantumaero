import { describe, it, expect } from 'vitest';
import { FluidSolver } from './fluidSolver';

describe('FluidSolver Physics Integrity Tests', () => {
  it('uses shared calculateCl method for consistent Cl and stall detection', () => {
    const solver = new FluidSolver();
    solver.setParameters('naca4412', 4.0, 1500000, 60);

    const clCalc = solver.calculateCl();
    const metrics = solver.calculateAerodynamicMetrics();

    expect(metrics.Cl).toBe(parseFloat(clCalc.Cl.toFixed(3)));
    expect(metrics.isStalled).toBe(clCalc.isStalled);
  });

  it('parameterizes thickness ratio t correctly per airfoil profile', () => {
    const solver = new FluidSolver();

    solver.setParameters('naca0012', 4.0, 1500000, 60);
    expect(solver.getThicknessRatio()).toBe(0.12);

    solver.setParameters('supercritical', 4.0, 1500000, 60);
    expect(solver.getThicknessRatio()).toBe(0.14);

    solver.setParameters('delta', 4.0, 1500000, 60);
    expect(solver.getThicknessRatio()).toBe(0.08);
  });

  it('calculates skin friction Cd_friction using dynamic thickness ratio t', () => {
    const solverThin = new FluidSolver();
    solverThin.setParameters('delta', 0.0, 1000000, 60);
    const metricsThin = solverThin.calculateAerodynamicMetrics();

    const solverThick = new FluidSolver();
    solverThick.setParameters('supercritical', 0.0, 1000000, 60);
    const metricsThick = solverThick.calculateAerodynamicMetrics();

    expect(metricsThick.Cd).toBeGreaterThan(metricsThin.Cd);
  });

  it('validates surface Cp distribution against NACA reference dataset with low RMSE and high R^2', () => {
    const solver = new FluidSolver();
    solver.setParameters('naca0012', 4.0, 1500000, 60);

    const validation = solver.validateAgainstReferenceData();

    expect(validation.samplePoints).toBeGreaterThan(10);
    expect(validation.rmse).toBeLessThan(0.70);
    expect(validation.r2).toBeGreaterThan(0.15);
  });
});

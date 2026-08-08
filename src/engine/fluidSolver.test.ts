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

    // Thicker supercritical airfoil (t=0.14) has higher friction drag form factor than thin delta wing (t=0.08)
    expect(metricsThick.Cd).toBeGreaterThan(metricsThin.Cd);
  });
});

import { describe, it, expect } from 'vitest';
import { QuantumEngine, VQCTurbulenceModel } from './quantumEngine';

describe('QuantumEngine RZ Gate Tests', () => {
  it('applies H then RZ(theta) for several theta angles and asserts state normalization to 1e-9', () => {
    const angles = [0, Math.PI / 6, Math.PI / 4, Math.PI / 3, Math.PI / 2, Math.PI, 2.5, 5.0, Math.PI * 2];

    for (const theta of angles) {
      const qe = new QuantumEngine(2); // 2 qubits
      qe.h(0);
      qe.rz(0, theta);

      let normSum = 0;
      for (let i = 0; i < qe.numStates; i++) {
        normSum += qe.real[i] * qe.real[i] + qe.imag[i] * qe.imag[i];
      }

      expect(Math.abs(normSum - 1.0)).toBeLessThan(1e-9);
    }
  });

  it('checks RZ output against analytic matrix for a fixed theta', () => {
    const theta = Math.PI / 3; // 60 degrees
    const qe = new QuantumEngine(2);
    
    // Initial state |00>
    // Apply H to qubit 0 -> (|00> + |01>) / sqrt(2)  (note: bit 0 set is state 1)
    qe.h(0);
    // Apply RZ(theta) to qubit 0
    qe.rz(0, theta);

    // Analytic output:
    // State |00> (index 0): coefficient is e^(-i*theta/2) / sqrt(2)
    // real[0] = cos(theta/2) / sqrt(2)
    // imag[0] = -sin(theta/2) / sqrt(2)
    // State |01> (index 1): coefficient is e^(i*theta/2) / sqrt(2)
    // real[1] = cos(theta/2) / sqrt(2)
    // imag[1] = +sin(theta/2) / sqrt(2)

    const halfTheta = theta / 2;
    const invSqrt2 = 1 / Math.sqrt(2);

    const expectedReal0 = Math.cos(halfTheta) * invSqrt2;
    const expectedImag0 = -Math.sin(halfTheta) * invSqrt2;

    const expectedReal1 = Math.cos(halfTheta) * invSqrt2;
    const expectedImag1 = Math.sin(halfTheta) * invSqrt2;

    expect(qe.real[0]).toBeCloseTo(expectedReal0, 10);
    expect(qe.imag[0]).toBeCloseTo(expectedImag0, 10);

    expect(qe.real[1]).toBeCloseTo(expectedReal1, 10);
    expect(qe.imag[1]).toBeCloseTo(expectedImag1, 10);

    // Other states (|10> and |11>) must remain 0
    expect(qe.real[2]).toBe(0);
    expect(qe.imag[2]).toBe(0);
    expect(qe.real[3]).toBe(0);
    expect(qe.imag[3]).toBe(0);
  });

  it('trains a 1-qubit toy circuit toward a known target expectation value and confirms loss decreases over 20 steps using parameter-shift rule', () => {
    const vqc = new VQCTurbulenceModel(1, 1, 'real_amplitudes');
    vqc.params[0] = 2.5;

    const dataset = [
      { x: 0.1, y: 0.0, Re: 0.5, AoA: 0.1, p_target: 0.1 }
    ];

    const initialLoss = vqc.computeBatchLoss(dataset);

    for (let step = 0; step < 20; step++) {
      vqc.trainStep(dataset, 0.1);
    }

    const finalLoss = vqc.computeBatchLoss(dataset);

    expect(finalLoss).toBeLessThan(initialLoss);
  });
});


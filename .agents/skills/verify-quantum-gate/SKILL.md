---
name: verify-quantum-gate
description: >-
  Verifies quantum gate and engine modifications using strict math integrity:
  1) Implement change, 2) Extend normalization + analytic reference unit test,
  3) Run full Vitest suite, 4) Produce completion summary.
---

# Verify Quantum Gate Workflow

## Overview
This skill enforces a rigorous test-driven workflow whenever modifications are made to the quantum simulator engine, gates, circuit ansatz, or VQC predictors in QuantumAero (`src/engine/quantumEngine.ts`, `src/engine/qmlModel.ts`).

## Workflow Steps

### Step 1: Implement the Engine Change
Make the code edit targeting `src/engine/quantumEngine.ts` or `src/engine/qmlModel.ts`. Do not modify unrelated files.

### Step 2: Extend Unit Tests for Gate / Circuit Integrity
In `src/engine/quantumEngine.test.ts` (or `qmlModel.test.ts`):
- Add or extend a unit test that applies the affected gate or circuit.
- **State Normalization Assertion**: Assert that the statevector norm $| \sum_{k} (|a_k|^2 + |b_k|^2) - 1.0 | < 10^{-9}$.
- **Analytic Reference-Value Assertion**: Compare statevector real and imaginary components against exact closed-form matrix calculations for a fixed input angle $\theta$.

### Step 3: Run Full Test Suite
Execute the Vitest suite using the terminal tool:
```bash
npx vitest run
```
Ensure all test files pass with 0 failures before proceeding.

### Step 4: Produce Completion Summary
Provide a clean summary containing:
- Specific line-by-line code changes made.
- Exact Vitest terminal output showing 100% test pass rate.
- Git commit hash or branch update.

> [!IMPORTANT]
> Never declare success or report completion to the user before all Vitest tests pass cleanly.

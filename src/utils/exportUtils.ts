import { FluidSolver } from '../engine/fluidSolver';
import { QMLTurbulencePredictor } from '../engine/qmlModel';

export interface RunConfigSchema {
  version: string;
  timestamp: string;
  airfoil: string;
  alpha: number;
  reynolds: number;
  airspeed: number;
  vqcAnsatz: string;
  qubits: number;
  circuitDepth: number;
  vqcParams: number[];
  metrics: {
    Cl: number;
    Cd: number;
    LD: number;
    isStalled: boolean;
  };
}

export function exportFlowfieldCSV(solver: FluidSolver, predictor: QMLTurbulencePredictor) {
  const rows = ['x,y,u_ms,v_ms,speed_ms,Cp,P_classical,P_QML'];

  for (let x = -0.3; x <= 1.4; x += 0.05) {
    for (let y = -0.4; y <= 0.4; y += 0.05) {
      const vec = solver.getFlowVector(x, y);
      const pClassical = predictor.getClassicalTurbulenceProbabilityAt(x, y);
      const pQuantum = predictor.getTurbulenceProbabilityAt(x, y);

      rows.push(
        `${x.toFixed(2)},${y.toFixed(2)},${vec.u.toFixed(2)},${vec.v.toFixed(2)},` +
        `${vec.speed.toFixed(2)},${vec.Cp.toFixed(4)},${pClassical.toFixed(4)},${pQuantum.toFixed(4)}`
      );
    }
  }

  const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(rows.join('\n'));
  const link = document.createElement('a');
  link.setAttribute('href', csvContent);
  link.setAttribute('download', `quantumaero_${solver.airfoilType}_a${solver.aoa}_flowfield.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportViewportPNG(canvasElement: HTMLCanvasElement | null) {
  if (!canvasElement) return;
  const imageURI = canvasElement.toDataURL('image/png');
  const link = document.createElement('a');
  link.setAttribute('href', imageURI);
  link.setAttribute('download', `quantumaero_viewport_snapshot_${Date.now()}.png`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportRunConfigJSON(
  airfoil: string,
  alpha: number,
  reynolds: number,
  airspeed: number,
  vqcAnsatz: string,
  qubits: number,
  circuitDepth: number,
  predictor: QMLTurbulencePredictor,
  CL: number,
  CD: number,
  LD: number,
  isStalled: boolean
) {
  const config: RunConfigSchema = {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    airfoil,
    alpha,
    reynolds,
    airspeed,
    vqcAnsatz,
    qubits,
    circuitDepth,
    vqcParams: Array.from(predictor.vqc.params),
    metrics: { Cl: CL, Cd: CD, LD, isStalled }
  };

  const jsonString = JSON.stringify(config, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `quantumaero_config_${airfoil}_a${alpha}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

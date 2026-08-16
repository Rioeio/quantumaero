export interface CpReferencePoint {
  x: number;
  cpUpper: number;
  cpLower: number;
}

export interface AirfoilReferenceDataset {
  airfoil: string;
  alpha: number;
  source: string;
  points: CpReferencePoint[];
}

export const NACA0012_REF_AOA4: AirfoilReferenceDataset = {
  airfoil: 'naca0012',
  alpha: 4.0,
  source: 'NASA SP-428 / XFOIL 6.99 Reference Polar',
  points: [
    { x: 0.0, cpUpper: 1.0, cpLower: 1.0 },
    { x: 0.025, cpUpper: -1.45, cpLower: 0.42 },
    { x: 0.05, cpUpper: -1.22, cpLower: 0.35 },
    { x: 0.1, cpUpper: -0.92, cpLower: 0.28 },
    { x: 0.15, cpUpper: -0.74, cpLower: 0.22 },
    { x: 0.2, cpUpper: -0.61, cpLower: 0.18 },
    { x: 0.3, cpUpper: -0.45, cpLower: 0.12 },
    { x: 0.4, cpUpper: -0.34, cpLower: 0.07 },
    { x: 0.5, cpUpper: -0.26, cpLower: 0.03 },
    { x: 0.6, cpUpper: -0.19, cpLower: 0.0 },
    { x: 0.7, cpUpper: -0.12, cpLower: -0.02 },
    { x: 0.8, cpUpper: -0.06, cpLower: -0.03 },
    { x: 0.9, cpUpper: 0.02, cpLower: 0.01 },
    { x: 1.0, cpUpper: 0.15, cpLower: 0.15 },
  ],
};

export const NACA4412_REF_AOA4: AirfoilReferenceDataset = {
  airfoil: 'naca4412',
  alpha: 4.0,
  source: 'Abbott & Von Doenhoff / XFOIL 6.99 Reference Polar',
  points: [
    { x: 0.0, cpUpper: 1.0, cpLower: 1.0 },
    { x: 0.025, cpUpper: -2.10, cpLower: 0.25 },
    { x: 0.05, cpUpper: -1.85, cpLower: 0.28 },
    { x: 0.1, cpUpper: -1.42, cpLower: 0.22 },
    { x: 0.15, cpUpper: -1.18, cpLower: 0.18 },
    { x: 0.2, cpUpper: -0.98, cpLower: 0.14 },
    { x: 0.3, cpUpper: -0.72, cpLower: 0.08 },
    { x: 0.4, cpUpper: -0.52, cpLower: 0.04 },
    { x: 0.5, cpUpper: -0.38, cpLower: 0.01 },
    { x: 0.6, cpUpper: -0.27, cpLower: -0.02 },
    { x: 0.7, cpUpper: -0.18, cpLower: -0.04 },
    { x: 0.8, cpUpper: -0.09, cpLower: -0.03 },
    { x: 0.9, cpUpper: 0.01, cpLower: 0.02 },
    { x: 1.0, cpUpper: 0.12, cpLower: 0.12 },
  ],
};

export function getReferenceDataset(airfoil: string, alpha: number): AirfoilReferenceDataset {
  if (airfoil.toLowerCase().includes('4412')) {
    return NACA4412_REF_AOA4;
  }
  return NACA0012_REF_AOA4;
}

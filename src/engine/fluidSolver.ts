export interface Point {
  x: number;
  y: number;
}

export interface FlowVector {
  u: number;
  v: number;
  speed: number;
  Cp: number;
  isInside: boolean;
}

export interface AerodynamicMetrics {
  Cl: number;
  Cd: number;
  LD: number;
  turbRisk: number;
  isStalled: boolean;
}

export class FluidSolver {
  airfoilType = 'naca4412';
  aoa = 4.0;
  reynolds = 1500000;
  uInf = 60.0;

  points: Point[] = [];
  upperBoundary: Point[] = [];
  lowerBoundary: Point[] = [];

  constructor() {
    this.generateAirfoilGeometry();
  }

  setParameters(airfoilType: string, aoa: number, reynolds: number, uInf: number) {
    this.airfoilType = airfoilType;
    this.aoa = aoa;
    this.reynolds = reynolds;
    this.uInf = uInf;
    this.generateAirfoilGeometry();
  }

  getThicknessRatio(): number {
    if (this.airfoilType === 'naca0012') return 0.12;
    if (this.airfoilType === 'naca4412') return 0.12;
    if (this.airfoilType === 'supercritical') return 0.14;
    if (this.airfoilType === 'delta') return 0.08;
    return 0.12;
  }

  calculateCl(): { Cl: number; isStalled: boolean } {
    const radAoa = (this.aoa * Math.PI) / 180.0;
    let alpha0 = -0.04;
    if (this.airfoilType === 'naca0012') alpha0 = 0.0;
    else if (this.airfoilType === 'naca4412') alpha0 = -0.07;
    else if (this.airfoilType === 'supercritical') alpha0 = -0.05;
    else if (this.airfoilType === 'delta') alpha0 = -0.02;

    let Cl = 2.0 * Math.PI * (radAoa - alpha0);
    const stallAngle = 14.0;
    const isStalled = this.aoa > stallAngle;

    if (isStalled) {
      const stallDelta = this.aoa - stallAngle;
      Cl = Cl * Math.exp(-0.15 * stallDelta) + 0.3 * Math.sin(2 * radAoa);
    }

    return { Cl, isStalled };
  }

  generateAirfoilGeometry() {
    const numPoints = 60;
    this.points = [];
    this.upperBoundary = [];
    this.lowerBoundary = [];

    let m = 0.04, p = 0.4;
    const t = this.getThicknessRatio();

    if (this.airfoilType === 'naca0012') {
      m = 0.0; p = 0.0;
    } else if (this.airfoilType === 'naca4412') {
      m = 0.04; p = 0.4;
    } else if (this.airfoilType === 'supercritical') {
      m = 0.02; p = 0.35;
    } else if (this.airfoilType === 'delta') {
      m = 0.06; p = 0.5;
    }

    for (let i = 0; i <= numPoints; i++) {
      const beta = (i / numPoints) * Math.PI;
      const x = 0.5 * (1.0 - Math.cos(beta));

      let yt = 5 * t * (
        0.2969 * Math.sqrt(x) -
        0.1260 * x -
        0.3516 * Math.pow(x, 2) +
        0.2843 * Math.pow(x, 3) -
        0.1015 * Math.pow(x, 4)
      );

      if (this.airfoilType === 'supercritical') {
        yt = yt * (1.0 - 0.2 * Math.pow(x - 0.4, 2));
      }

      let yc = 0.0;
      let dyc_dx = 0.0;

      if (p > 0) {
        if (x < p) {
          yc = (m / (p * p)) * (2 * p * x - x * x);
          dyc_dx = (2 * m / (p * p)) * (p - x);
        } else {
          yc = (m / Math.pow(1 - p, 2)) * ((1 - 2 * p) + 2 * p * x - x * x);
          dyc_dx = (2 * m / Math.pow(1 - p, 2)) * (p - x);
        }
      }

      const theta = Math.atan(dyc_dx);

      const xu = x - yt * Math.sin(theta);
      const yu = yc + yt * Math.cos(theta);
      const xl = x + yt * Math.sin(theta);
      const yl = yc - yt * Math.cos(theta);

      this.upperBoundary.push({ x: xu, y: yu });
      this.lowerBoundary.push({ x: xl, y: yl });
    }

    this.points = [...this.upperBoundary, ...[...this.lowerBoundary].reverse()];
  }

  getFlowVector(x: number, y: number): FlowVector {
    const radAoa = (this.aoa * Math.PI) / 180.0;
    const cosA = Math.cos(radAoa);
    const sinA = Math.sin(radAoa);

    let u = this.uInf * cosA;
    let v = this.uInf * sinA;

    if (this.isPointInsideAirfoil(x, y)) {
      return { u: 0, v: 0, speed: 0, Cp: 1.0, isInside: true };
    }

    const xc = 0.25;
    const yc = 0.02 * (this.aoa / 10.0);
    const dx = x - xc;
    const dy = y - yc;
    const r2 = dx * dx + dy * dy + 1e-4;

    const { Cl, isStalled } = this.calculateCl();
    const gamma = 0.5 * this.uInf * Cl;

    const u_vortex = (gamma / (2 * Math.PI)) * (dy / r2);
    const v_vortex = -(gamma / (2 * Math.PI)) * (dx / r2);

    const sourceStr = 0.12 * this.uInf;
    const u_source = (sourceStr / (2 * Math.PI)) * (dx / r2);
    const v_source = (sourceStr / (2 * Math.PI)) * (dy / r2);

    u += u_vortex + u_source;
    v += v_vortex + v_source;

    if (x > 0.4 && y > 0.0 && isStalled) {
      const wakeFactor = Math.min(1.0, (x - 0.4) * 1.5);
      const turbulenceNoise = (Math.random() - 0.5) * 0.4 * this.uInf * wakeFactor;
      u *= (1.0 - 0.6 * wakeFactor);
      v += turbulenceNoise;
    }

    const speed = Math.sqrt(u * u + v * v);
    const Cp = 1.0 - Math.pow(speed / this.uInf, 2);

    return { u, v, speed, Cp, isInside: false };
  }

  isPointInsideAirfoil(x: number, y: number): boolean {
    if (x < 0 || x > 1.0 || Math.abs(y) > 0.4) return false;
    const uPt = this.interpolateUpperY(x);
    const lPt = this.interpolateLowerY(x);
    return y <= uPt && y >= lPt;
  }

  interpolateUpperY(x: number): number {
    if (x <= 0 || x >= 1) return 0;
    for (let i = 0; i < this.upperBoundary.length - 1; i++) {
      const p1 = this.upperBoundary[i];
      const p2 = this.upperBoundary[i + 1];
      if (x >= p1.x && x <= p2.x) {
        const t = (x - p1.x) / Math.max(1e-5, p2.x - p1.x);
        return p1.y + t * (p2.y - p1.y);
      }
    }
    return 0;
  }

  interpolateLowerY(x: number): number {
    if (x <= 0 || x >= 1) return 0;
    for (let i = 0; i < this.lowerBoundary.length - 1; i++) {
      const p1 = this.lowerBoundary[i];
      const p2 = this.lowerBoundary[i + 1];
      if (x >= p1.x && x <= p2.x) {
        const t = (x - p1.x) / Math.max(1e-5, p2.x - p1.x);
        return p1.y + t * (p2.y - p1.y);
      }
    }
    return 0;
  }

  calculateAerodynamicMetrics(): AerodynamicMetrics {
    const { Cl, isStalled } = this.calculateCl();

    const t = this.getThicknessRatio();
    const Cf = 0.074 / Math.pow(this.reynolds, 0.2);
    const Cd_friction = 2.0 * Cf * (1.0 + 2.0 * t);

    const aspect_ratio = 6.0;
    const oswald_e = 0.85;
    let Cd_pressure = (Cl * Cl) / (Math.PI * aspect_ratio * oswald_e);

    if (isStalled) {
      const stallAngle = 14.0;
      Cd_pressure += 0.08 * Math.pow(this.aoa - stallAngle, 1.5);
    }

    const Cd = Math.max(0.005, Cd_friction + Cd_pressure);
    const LD = Cl / Cd;

    let turbRisk = 15.0 + 1.2 * Math.max(0, this.aoa) + 10.0 * Math.log10(this.reynolds / 1e5);
    if (isStalled) turbRisk += 45.0;
    turbRisk = Math.min(99.9, Math.max(2.0, turbRisk));

    return {
      Cl: parseFloat(Cl.toFixed(3)),
      Cd: parseFloat(Cd.toFixed(4)),
      LD: parseFloat(LD.toFixed(1)),
      turbRisk: parseFloat(turbRisk.toFixed(1)),
      isStalled
    };
  }
}

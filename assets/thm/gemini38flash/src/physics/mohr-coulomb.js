/**
 * Mohr-Coulomb & Induced Seismicity Engine
 * Visualizes the effective stress state in (sigma', tau) space,
 * coupling pore pressure increase (H -> M) and thermoelastic contraction (T -> M),
 * triggering synthetic fault slip and microseismic waveforms.
 */

export class MohrCoulombEngine {
  constructor(canvasElement, waveformCanvas) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.waveformCanvas = waveformCanvas;
    this.wctx = waveformCanvas ? waveformCanvas.getContext('2d') : null;

    // Stress & Rock parameters
    this.params = {
      sigma1_total: 45.0,     // Total maximum principal stress (MPa)
      sigma3_total: 25.0,     // Total minimum confining stress (MPa)
      porePressure: 8.0,      // Pore fluid pressure (MPa)
      deltaT: 0.0,            // Temperature perturbation (°C) - negative is cooling
      cohesion: 3.0,          // Cohesion c (MPa)
      frictionAngle: 31.0,    // Internal friction angle phi (degrees)
      alpha_biot: 0.9,        // Biot coefficient
      E: 30.0,                // Young's modulus (GPa)
      nu: 0.25,               // Poisson's ratio
      alpha_T: 1.0e-5,        // Linear thermal expansion (1/K)
      faultAngle: 60.0        // Fault strike/dip orientation relative to sigma3 (deg)
    };

    // Waveform simulation buffer
    this.waveformBuffer = new Float32Array(200);
    this.waveformIndex = 0;
    this.isRupturing = false;
    this.ruptureEnergy = 0.0;
    this.earthquakeStats = null;

    // Event callbacks
    this.onSlipEvent = null;
  }

  setParams(newParams) {
    Object.assign(this.params, newParams);
  }

  // Calculate effective stresses including thermal stress
  calculateStressState() {
    const p = this.params;

    // Thermoelastic stress: Delta sigma_th = (E * alpha_T * deltaT) / (1 - nu) (in MPa)
    // E in GPa (10^9 Pa), so E * 1e3 * alpha_T * deltaT / (1 - nu) gives MPa
    const deltaSigma_th = (p.E * 1.0e3 * p.alpha_T * p.deltaT) / (1.0 - p.nu);

    // Effective principal stresses: sigma' = sigma_total + deltaSigma_th - alpha * p
    // (cooling deltaT < 0 induces tensile/extensional stress, decreasing effective confinement)
    const sigma1_eff = Math.max(0.1, p.sigma1_total + deltaSigma_th - p.alpha_biot * p.porePressure);
    const sigma3_eff = Math.max(0.1, p.sigma3_total + deltaSigma_th - p.alpha_biot * p.porePressure);

    // Center and radius of Mohr Circle
    const center = (sigma1_eff + sigma3_eff) * 0.5;
    const radius = Math.max(0.1, (sigma1_eff - sigma3_eff) * 0.5);

    // Failure envelope: tau = c + sigma'_n * tan(phi)
    const phiRad = (p.frictionAngle * Math.PI) / 180.0;
    const tanPhi = Math.tan(phiRad);
    const sinPhi = Math.sin(phiRad);

    // Optimal fault angle: theta_opt = 45° + phi/2 relative to sigma3
    const optAngleDeg = 45.0 + p.frictionAngle * 0.5;

    // Maximum stress ratio relative to failure envelope
    // Critical radius for circle touching envelope at center: R_crit = center * sin(phi) + c * cos(phi)
    const criticalRadius = center * sinPhi + p.cohesion * Math.cos(phiRad);
    const stressRatio = radius / criticalRadius; // >= 1.0 means failure!

    // Stress on the specified fault plane (theta = faultAngle)
    const twoThetaRad = (2.0 * p.faultAngle * Math.PI) / 180.0;
    const normalStressFault = center - radius * Math.cos(twoThetaRad);
    const shearStressFault = Math.abs(radius * Math.sin(twoThetaRad));
    const faultStrength = p.cohesion + normalStressFault * tanPhi;
    const slipTendency = shearStressFault / Math.max(0.01, faultStrength);

    // Check if failure condition is met
    const isUnstable = stressRatio >= 1.0 || slipTendency >= 1.0;

    return {
      sigma1_eff,
      sigma3_eff,
      center,
      radius,
      criticalRadius,
      stressRatio,
      tanPhi,
      phiRad,
      optAngleDeg,
      normalStressFault,
      shearStressFault,
      faultStrength,
      slipTendency,
      isUnstable,
      deltaSigma_th
    };
  }

  // Trigger micro-seismic rupture event
  triggerSlip(stressState) {
    if (this.isRupturing) return;
    this.isRupturing = true;

    // Calculate seismic moment: M0 = G * A * D
    // Excess shear stress:
    const deltaTau = Math.max(0.5, stressState.shearStressFault - stressState.faultStrength + 1.0); // MPa
    const faultRadius = 15.0; // meters (microseismic patch)
    const faultArea = Math.PI * faultRadius * faultRadius;
    const G_shear = (this.params.E * 1e9) / (2 * (1 + this.params.nu)); // Pa
    const slipDisplacement = (deltaTau * 1e6 * faultRadius) / G_shear; // meters (typically mm)
    const M0 = G_shear * faultArea * slipDisplacement; // N*m
    const Mw = (2.0 / 3.0) * (Math.log10(Math.max(1.0, M0)) - 9.1);

    this.earthquakeStats = {
      Mw: Mw.toFixed(2),
      M0: M0.toExponential(2),
      slipMm: (slipDisplacement * 1000).toFixed(2),
      dropMPa: deltaTau.toFixed(2)
    };

    // Generate synthetic seismogram wave packet
    for (let i = 0; i < this.waveformBuffer.length; i++) {
      const t = i * 0.05;
      // High frequency P and S arrivals with exponential damping
      const pArrival = Math.sin(2.0 * Math.PI * 14.0 * t) * Math.exp(-t * 0.8);
      const sArrival = t > 0.8 ? Math.sin(2.0 * Math.PI * 8.0 * (t - 0.8)) * 2.2 * Math.exp(-(t - 0.8) * 0.6) : 0;
      const noise = (Math.random() - 0.5) * 0.15;
      this.waveformBuffer[i] = (pArrival + sArrival + noise);
    }

    if (this.onSlipEvent) {
      this.onSlipEvent(this.earthquakeStats);
    }

    // Reset rupturing state after delay
    setTimeout(() => {
      this.isRupturing = false;
    }, 1200);
  }

  render() {
    const stressState = this.calculateStressState();

    if (stressState.isUnstable) {
      this.triggerSlip(stressState);
    }

    this.drawMohrCanvas(stressState);
    if (this.waveformCanvas) {
      this.drawWaveform();
    }
  }

  drawMohrCanvas(s) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Padding & Scale
    const padX = 50;
    const padY = 40;
    const maxSigma = 60.0; // Max normal stress on axis (MPa)
    const maxTau = 35.0;   // Max shear stress on axis (MPa)

    const toScreenX = (sigma) => padX + (sigma / maxSigma) * (w - padX - 20);
    const toScreenY = (tau) => (h - padY) - (tau / maxTau) * (h - padY - 20);

    // Background Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let sig = 0; sig <= maxSigma; sig += 10) {
      const x = toScreenX(sig);
      ctx.beginPath();
      ctx.moveTo(x, padY);
      ctx.lineTo(x, h - padY);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText(`${sig}`, x - 6, h - padY + 16);
    }
    for (let tau = 0; tau <= maxTau; tau += 10) {
      const y = toScreenY(tau);
      ctx.beginPath();
      ctx.moveTo(padX, y);
      ctx.lineTo(w - 20, y);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText(`${tau}`, padX - 24, y + 4);
    }

    // Axes
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(padX, h - padY);
    ctx.lineTo(w - 15, h - padY);
    ctx.moveTo(padX, h - padY);
    ctx.lineTo(padX, 15);
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText("Effective Normal Stress σ' (MPa)", w * 0.45, h - 8);

    ctx.save();
    ctx.translate(14, h * 0.5);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Shear Stress τ (MPa)", 0, 0);
    ctx.restore();

    // Draw Mohr-Coulomb Failure Envelope: tau = c + sigma' * tan(phi)
    const x0 = 0;
    const y0 = this.params.cohesion;
    const x1 = maxSigma;
    const y1 = this.params.cohesion + maxSigma * s.tanPhi;

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(toScreenX(x0), toScreenY(y0));
    ctx.lineTo(toScreenX(x1), toScreenY(y1));
    ctx.stroke();
    ctx.setLineDash([]);

    // Failure region shade
    ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
    ctx.beginPath();
    ctx.moveTo(toScreenX(x0), toScreenY(y0));
    ctx.lineTo(toScreenX(x1), toScreenY(y1));
    ctx.lineTo(toScreenX(x1), toScreenY(maxTau));
    ctx.lineTo(toScreenX(x0), toScreenY(maxTau));
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ef4444';
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.fillText(`Failure Envelope (c=${this.params.cohesion} MPa, φ=${this.params.frictionAngle}°)`, toScreenX(18), toScreenY(this.params.cohesion + 18 * s.tanPhi) - 10);

    // Draw Total Stress Mohr Circle (Ghost)
    const totalCenter = (this.params.sigma1_total + this.params.sigma3_total) * 0.5;
    const totalRadius = (this.params.sigma1_total - this.params.sigma3_total) * 0.5;
    const cxTotal = toScreenX(totalCenter);
    const cyTotal = toScreenY(0);
    const rxTotal = (totalRadius / maxSigma) * (w - padX - 20);
    const ryTotal = (totalRadius / maxTau) * (h - padY - 20);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.ellipse(cxTotal, cyTotal, rxTotal, ryTotal, 0, Math.PI, 0);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.fillText("Initial Total Stress", cxTotal - 40, cyTotal - ryTotal - 6);

    // Draw Effective Stress Mohr Circle
    const cxEff = toScreenX(s.center);
    const cyEff = toScreenY(0);
    const rxEff = (s.radius / maxSigma) * (w - padX - 20);
    const ryEff = (s.radius / maxTau) * (h - padY - 20);

    const circleColor = s.isUnstable ? '#f43f5e' : (s.stressRatio > 0.85 ? '#f59e0b' : '#00e5ff');
    ctx.strokeStyle = circleColor;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.ellipse(cxEff, cyEff, rxEff, ryEff, 0, Math.PI, 0);
    ctx.stroke();

    ctx.fillStyle = s.isUnstable ? 'rgba(244, 63, 94, 0.25)' : 'rgba(0, 229, 255, 0.12)';
    ctx.fill();

    // Mark Fault Orientation State on Circle
    const faultSx = toScreenX(s.normalStressFault);
    const faultSy = toScreenY(s.shearStressFault);

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(faultSx, faultSy, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.fillText(`Fault (θ=${this.params.faultAngle}°)`, faultSx + 8, faultSy - 4);

    // Shift Arrow from Total to Effective
    if (Math.abs(totalCenter - s.center) > 1.0) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cxTotal, toScreenY(2));
      ctx.lineTo(cxEff, toScreenY(2));
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`← Δσ' = -αp + Δσ_th (${(-(this.params.alpha_biot * this.params.porePressure - s.deltaSigma_th)).toFixed(1)} MPa)`, cxEff + 5, toScreenY(3.5));
    }
  }

  drawWaveform() {
    const ctx = this.wctx;
    const w = this.waveformCanvas.width;
    const h = this.waveformCanvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    // Center baseline
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.5);
    ctx.lineTo(w, h * 0.5);
    ctx.stroke();

    // Trace line
    ctx.strokeStyle = this.isRupturing ? '#ef4444' : '#00e5ff';
    ctx.lineWidth = 1.8;
    ctx.beginPath();

    const dx = w / this.waveformBuffer.length;
    for (let i = 0; i < this.waveformBuffer.length; i++) {
      const val = this.waveformBuffer[i];
      const y = h * 0.5 - val * (h * 0.35);
      if (i === 0) ctx.moveTo(0, y);
      else ctx.lineTo(i * dx, y);
    }
    ctx.stroke();

    // Status / Magnitude Tag
    ctx.fillStyle = this.isRupturing ? '#ef4444' : '#64748b';
    ctx.font = '11px JetBrains Mono, monospace';
    if (this.earthquakeStats) {
      ctx.fillText(`Event: Mw ${this.earthquakeStats.Mw} | Slip: ${this.earthquakeStats.slipMm} mm | Δτ: ${this.earthquakeStats.dropMPa} MPa`, 10, 16);
    } else {
      ctx.fillText("Microseismic Geophone [Quiet - Awaiting Slip Trigger]", 10, 16);
    }
  }
}

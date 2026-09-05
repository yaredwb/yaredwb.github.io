/**
 * Nuclear Waste Barrier Engine (KBS-3 Multi-Barrier Concept)
 * Models coupled radial heat decay, water ingress resaturation, and bentonite clay swelling pressure
 * over geological timescales (1 to 100,000 years).
 */

export class NuclearBarrierEngine {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');

    // Radii in meters
    this.rCanister = 0.525;
    this.rBuffer = 0.875;
    this.rDomain = 2.5;

    // Simulation state
    this.timeYears = 5.0; // Current time in years
    this.isPlaying = false;

    // Geological parameters
    this.initialPower = 1700.0;    // Watts per canister at deposition
    this.maxSwellingPres = 7.5;     // MPa at full saturation
    this.ambientTemp = 18.0;        // °C at 500m depth
    this.thermalConductivity = 1.3; // W/(m*K) for bentonite buffer
  }

  setTime(years) {
    this.timeYears = Math.max(0.1, Math.min(100000.0, years));
  }

  // Radiative & decay heat power P(t) in Watts
  getCanisterHeatPower(t) {
    // Multi-exponential decay fit for spent nuclear fuel (UOX / MOX)
    return this.initialPower * (
      0.72 * Math.exp(-t / 35.0) +
      0.22 * Math.exp(-t / 380.0) +
      0.05 * Math.exp(-t / 4000.0) +
      0.01 * Math.exp(-t / 25000.0)
    );
  }

  // Buffer saturation degree Sr(r, t) from host rock water ingress
  // Takes ~15 to 40 years for full hydraulic resaturation of compacted bentonite
  getSaturation(r, t) {
    if (r <= this.rCanister) return 0.0;
    if (r >= this.rBuffer) return 1.0;

    // Normalized radial position within buffer: 0 at canister, 1 at rock
    const xi = (r - this.rCanister) / (this.rBuffer - this.rCanister);
    // Diffusion-like wetting front from rock inwards
    // Penetration depth L_w ~ sqrt(4 * D_h * t)
    const t_full_saturation = 25.0; // years
    const progress = Math.min(1.0, Math.sqrt(t / t_full_saturation));

    const initialSr = 0.60; // 60% initial saturation
    const sr = initialSr + (1.0 - initialSr) * Math.pow(xi, Math.max(0.05, 1.5 - progress * 1.4));
    return Math.min(1.0, Math.max(initialSr, sr));
  }

  // Swelling pressure of compacted MX-80 bentonite as function of saturation
  getSwellingPressure(r, t) {
    if (r <= this.rCanister || r > this.rBuffer) return 0.0;
    const Sr = this.getSaturation(r, t);
    const Sr0 = 0.60;
    // Power law swelling pressure development
    const fraction = Math.max(0.0, (Sr - Sr0) / (1.0 - Sr0));
    return this.maxSwellingPres * Math.pow(fraction, 1.6);
  }

  // Radial temperature T(r, t)
  getTemperature(r, t) {
    const P = this.getCanisterHeatPower(t);
    // Peak temperature occurs around 10-20 years
    // Approximate quasi-steady radial conduction with decaying source
    const thermalResistance = Math.log(Math.max(r, this.rCanister) / this.rCanister) / (2 * Math.PI * this.thermalConductivity);
    const deltaT_base = (P / 15.0) * Math.exp(-Math.abs(Math.log10(t) - 1.1) * 0.7);
    
    // Radial decay away from canister
    const rFactor = this.rCanister / Math.max(this.rCanister, r);
    return this.ambientTemp + deltaT_base * rFactor;
  }

  getMetrics() {
    const t = this.timeYears;
    const power = this.getCanisterHeatPower(t);
    const peakT = this.getTemperature(this.rCanister, t);
    const avgSr = this.getSaturation(0.5 * (this.rCanister + this.rBuffer), t);
    const maxPswell = this.getSwellingPressure(0.5 * (this.rCanister + this.rBuffer), t);
    const safetyMargin = Math.max(0, 100.0 - peakT); // Must stay below 100°C to prevent smectite degradation

    return {
      timeYears: t,
      heatPowerW: power.toFixed(0),
      peakBufferTemp: peakT.toFixed(1),
      saturationPct: (avgSr * 100).toFixed(1),
      swellingPressureMPa: maxPswell.toFixed(2),
      safetyMargin: safetyMargin.toFixed(1)
    };
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w * 0.42;
    const cy = h * 0.5;

    ctx.clearRect(0, 0, w, h);

    const maxPixelRadius = Math.min(cx - 20, cy - 20);
    const scale = maxPixelRadius / this.rDomain;

    const rPixCanister = this.rCanister * scale;
    const rPixBuffer = this.rBuffer * scale;
    const rPixDomain = this.rDomain * scale;

    // 1. Host Rock (Background)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(cx, cy, rPixDomain, 0, Math.PI * 2);
    ctx.fill();

    // Host rock fractures / texture
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
      ctx.beginPath();
      ctx.moveTo(cx + rPixBuffer * Math.cos(angle), cy + rPixBuffer * Math.sin(angle));
      ctx.lineTo(cx + rPixDomain * Math.cos(angle), cy + rPixDomain * Math.sin(angle));
      ctx.stroke();
    }

    // 2. Bentonite Buffer Ring
    // Draw concentric bands showing saturation & temperature
    const numRings = 24;
    const dr = (this.rBuffer - this.rCanister) / numRings;

    for (let i = numRings; i >= 0; i--) {
      const r = this.rCanister + i * dr;
      const rPix = r * scale;
      const sr = this.getSaturation(r, this.timeYears);
      const temp = this.getTemperature(r, this.timeYears);

      // Color interpolate between dry brown-orange (low Sr, warm) to hydrated saturated teal-cyan
      const tNorm = Math.min(1.0, (temp - 20.0) / 70.0);
      const srNorm = (sr - 0.6) / 0.4; // 0 to 1

      // Blend heat glow with moisture
      const red = Math.floor(180 * (1 - srNorm * 0.7) + 75 * tNorm);
      const green = Math.floor(120 * (1 - tNorm * 0.5) + 100 * srNorm);
      const blue = Math.floor(60 + 190 * srNorm);

      ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
      ctx.beginPath();
      ctx.arc(cx, cy, rPix, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Copper Canister Core
    const tCanister = this.getTemperature(this.rCanister, this.timeYears);
    const canisterHeatFactor = Math.min(1.0, (tCanister - 20) / 75);

    const gradCan = ctx.createRadialGradient(cx - rPixCanister * 0.3, cy - rPixCanister * 0.3, 2, cx, cy, rPixCanister);
    gradCan.addColorStop(0, canisterHeatFactor > 0.5 ? '#fef08a' : '#fed7aa');
    gradCan.addColorStop(0.5, canisterHeatFactor > 0.5 ? '#f97316' : '#d97706');
    gradCan.addColorStop(1, '#9a3412');

    ctx.fillStyle = gradCan;
    ctx.beginPath();
    ctx.arc(cx, cy, rPixCanister, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Canister center label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("Canister", cx, cy - 4);
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillText(`${tCanister.toFixed(1)}°C`, cx, cy + 10);

    // Buffer annotation
    ctx.fillStyle = '#00e5ff';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText("Bentonite Buffer", cx, cy - rPixBuffer - 8);

    // Host rock annotation
    ctx.fillStyle = '#94a3b8';
    ctx.fillText("Host Rock (Granite / Opalinus Clay)", cx, cy + rPixDomain - 8);
    ctx.textAlign = 'left';

    // Right Side: Live Info Panel & Safety Gauge
    const metrics = this.getMetrics();
    const px = w * 0.72;

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 14px Outfit, sans-serif';
    ctx.fillText("Deep Repository State", px, 35);

    ctx.font = '12px JetBrains Mono, monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`Elapsed Time:`, px, 65);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 13px JetBrains Mono, monospace';
    ctx.fillText(`${this.timeYears.toLocaleString(undefined, { maximumFractionDigits: 1 })} Years`, px, 82);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.fillText(`Heat Output: ${metrics.heatPowerW} W`, px, 115);
    ctx.fillText(`Max Buffer T: ${metrics.peakBufferTemp} °C`, px, 135);
    ctx.fillText(`Avg Hydration: ${metrics.saturationPct}%`, px, 155);
    ctx.fillText(`Swelling Pres: ${metrics.swellingPressureMPa} MPa`, px, 175);

    // Thermal Safety Bar (Threshold: 100°C)
    ctx.fillText("Thermal Safety (Max < 100°C):", px, 205);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(px, 215, 130, 10);

    const tempRatio = Math.min(1.0, metrics.peakBufferTemp / 100.0);
    ctx.fillStyle = tempRatio > 0.9 ? '#ef4444' : (tempRatio > 0.75 ? '#f59e0b' : '#10b981');
    ctx.fillRect(px, 215, 130 * tempRatio, 10);

    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`Margin: +${metrics.safetyMargin}°C`, px, 240);

    // Bentonite sealing status badge
    const isSealed = parseFloat(metrics.swellingPressureMPa) >= 4.0;
    ctx.fillStyle = isSealed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)';
    ctx.strokeStyle = isSealed ? '#10b981' : '#f59e0b';
    ctx.fillRect(px, 260, 130, 24);
    ctx.strokeRect(px, 260, 130, 24);

    ctx.fillStyle = isSealed ? '#10b981' : '#f59e0b';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.fillText(isSealed ? "✓ VOIDS FULLY SEALED" : "⏳ RESATURATING...", px + 8, 276);
  }
}

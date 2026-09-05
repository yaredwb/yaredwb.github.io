/**
 * Application Entry Point
 * Orchestrates navigation tabs, real-time simulation loops, interactive controls,
 * and scientific visualizers.
 */

import { THMSolver1D } from './physics/thm-solver-1d.js';
import { THM2DCanvas } from './physics/thm-2d-canvas.js';
import { MohrCoulombEngine } from './physics/mohr-coulomb.js';
import { NuclearBarrierEngine } from './physics/nuclear-barrier.js';
import { CouplingMatrixUI } from './ui/coupling-matrix.js';
import { FormulaInspectorUI } from './ui/formula-inspector.js';
import { SandboxCalculatorUI } from './ui/sandbox-calculator.js';
import { AudioFX } from './ui/audio-fx.js';

class App {
  constructor() {
    this.audio = new AudioFX();
    this.initNavigation();
    this.initCouplingMatrix();
    this.initFormulaInspector();
    this.init1DColumnSimulator();
    this.init2DPlayground();
    this.initMohrCoulombSimulator();
    this.initNuclearBarrier();
    this.initSandboxCalculator();
    this.initAudioToggle();

    // Start master animation loop
    this.lastTime = performance.now();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initNavigation() {
    const tabs = document.querySelectorAll('.nav-tab');
    const sections = document.querySelectorAll('.app-section');

    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = tab.getAttribute('data-target');

        tabs.forEach(t => t.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));

        tab.classList.add('active');
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          targetEl.classList.add('active');
          window.scrollTo({ top: targetEl.offsetTop - 70, behavior: 'smooth' });
        }
      });
    });
  }

  initAudioToggle() {
    const btn = document.getElementById('audio-toggle-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const enabled = this.audio.toggle();
      btn.innerHTML = enabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
      btn.classList.toggle('audio-active', enabled);
    });
  }

  initCouplingMatrix() {
    const triangleContainer = document.getElementById('thm-triangle-container');
    const detailContainer = document.getElementById('coupling-detail-container');
    if (triangleContainer && detailContainer) {
      this.couplingUI = new CouplingMatrixUI(triangleContainer, detailContainer, (key) => {
        this.audio.playPing(440, 0.05);
      });
    }
  }

  initFormulaInspector() {
    const container = document.getElementById('formula-inspector-container');
    if (container) {
      this.formulaUI = new FormulaInspectorUI(container);
    }
  }

  // ==========================================
  // SIMULATOR 1: 1D Coupled THM Column
  // ==========================================
  init1DColumnSimulator() {
    this.solver1D = new THMSolver1D({ nz: 45, L: 10.0 });
    this.canvas1D = document.getElementById('canvas-thm-1d');
    this.ctx1D = this.canvas1D ? this.canvas1D.getContext('2d') : null;
    this.sim1DRunning = true;
    this.sim1DSpeed = 24.0; // hours per second

    // Presets
    const presetSelect = document.getElementById('preset-select-1d');
    if (presetSelect) {
      presetSelect.addEventListener('change', (e) => {
        this.solver1D.setPreset(e.target.value);
        this.update1DControlsFromState();
        this.audio.playPing(523, 0.08);
      });
    }

    // Play/Pause button
    const playBtn = document.getElementById('btn-play-1d');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        this.sim1DRunning = !this.sim1DRunning;
        playBtn.innerHTML = this.sim1DRunning ? '⏸ Pause' : '▶ Play';
      });
    }

    // Reset button
    const resetBtn = document.getElementById('btn-reset-1d');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.solver1D.reset();
        this.audio.playPing(330, 0.08);
      });
    }

    // Parameter sliders
    const sliderTemp = document.getElementById('slider-1d-temp');
    if (sliderTemp) {
      sliderTemp.addEventListener('input', (e) => {
        this.solver1D.bc.bottomHeatSource = parseFloat(e.target.value);
        const label = document.getElementById('val-1d-temp');
        if (label) label.textContent = `${e.target.value}°C`;
      });
    }

    const sliderPerm = document.getElementById('slider-1d-perm');
    if (sliderPerm) {
      sliderPerm.addEventListener('input', (e) => {
        const logK = parseFloat(e.target.value);
        this.solver1D.params.k_perm = Math.pow(10, logK);
        this.solver1D.updateDerivedProperties();
        const label = document.getElementById('val-1d-perm');
        if (label) label.textContent = `10^${logK} m²`;
      });
    }

    const sliderSurcharge = document.getElementById('slider-1d-surcharge');
    if (sliderSurcharge) {
      sliderSurcharge.addEventListener('input', (e) => {
        const mpa = parseFloat(e.target.value);
        this.solver1D.bc.surcharge = mpa * 1.0e6;
        const label = document.getElementById('val-1d-surcharge');
        if (label) label.textContent = `${mpa.toFixed(1)} MPa`;
      });
    }
  }

  update1DControlsFromState() {
    const sliderTemp = document.getElementById('slider-1d-temp');
    if (sliderTemp) sliderTemp.value = this.solver1D.bc.bottomHeatSource;
    const labelTemp = document.getElementById('val-1d-temp');
    if (labelTemp) labelTemp.textContent = `${this.solver1D.bc.bottomHeatSource}°C`;

    const sliderPerm = document.getElementById('slider-1d-perm');
    if (sliderPerm) sliderPerm.value = Math.round(Math.log10(this.solver1D.params.k_perm));
    const labelPerm = document.getElementById('val-1d-perm');
    if (labelPerm) labelPerm.textContent = `10^${Math.round(Math.log10(this.solver1D.params.k_perm))} m²`;

    const sliderSurcharge = document.getElementById('slider-1d-surcharge');
    if (sliderSurcharge) sliderSurcharge.value = (this.solver1D.bc.surcharge / 1.0e6).toFixed(1);
    const labelSurcharge = document.getElementById('val-1d-surcharge');
    if (labelSurcharge) labelSurcharge.textContent = `${(this.solver1D.bc.surcharge / 1.0e6).toFixed(1)} MPa`;
  }

  render1DColumn() {
    if (!this.ctx1D) return;
    const ctx = this.ctx1D;
    const w = this.canvas1D.width;
    const h = this.canvas1D.height;
    const s = this.solver1D;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, w, h);

    // Render 4 side-by-side profile plots across depth z (0 = top, L = bottom)
    const numPanels = 4;
    const margin = 35;
    const panelW = (w - margin * (numPanels + 1)) / numPanels;
    const panelH = h - 65;
    const panelTop = 40;

    const panels = [
      {
        title: 'Temperature T(z)',
        unit: '°C',
        color: '#ff7849',
        min: 15.0,
        max: 140.0,
        getValue: (i) => s.T[i]
      },
      {
        title: 'Excess Pore Pressure Δp(z)',
        unit: 'MPa',
        color: '#38bdf8',
        min: -0.5,
        max: 8.0,
        getValue: (i) => (s.p[i] - s.params.p0) / 1.0e6
      },
      {
        title: "Effective Stress σ'v(z)",
        unit: 'MPa',
        color: '#c084fc',
        min: 0.0,
        max: 12.0,
        getValue: (i) => s.sigma_eff[i] / 1.0e6
      },
      {
        title: 'Displacement u(z)',
        unit: 'mm',
        color: '#34d399',
        min: -15.0,
        max: 15.0,
        getValue: (i) => s.u[i] * 1000.0 // mm
      }
    ];

    panels.forEach((p, pIdx) => {
      const px = margin + pIdx * (panelW + margin);

      // Panel background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px, panelTop, panelW, panelH);
      ctx.strokeStyle = '#1e293b';
      ctx.strokeRect(px, panelTop, panelW, panelH);

      // Title & Units
      ctx.fillStyle = p.color;
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText(p.title, px + 5, panelTop - 12);
      ctx.fillStyle = '#64748b';
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.fillText(`[${p.unit}]`, px + panelW - 32, panelTop - 12);

      // Depth ticks (z = 0m to 10m)
      ctx.fillStyle = '#475569';
      ctx.font = '9px JetBrains Mono, monospace';
      for (let zi = 0; zi <= s.L; zi += 2.5) {
        const y = panelTop + (zi / s.L) * panelH;
        ctx.strokeStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(px, y);
        ctx.lineTo(px + panelW, y);
        ctx.stroke();

        if (pIdx === 0) {
          ctx.fillText(`${zi}m`, px - 25, y + 3);
        }
      }

      // Plot curve: x coordinate corresponds to field value, y to depth z
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2.2;
      ctx.beginPath();

      for (let i = 0; i < s.nz; i++) {
        const val = p.getValue(i);
        const normVal = (val - p.min) / (p.max - p.min);
        const x = px + Math.max(0, Math.min(1.0, normVal)) * panelW;
        const y = panelTop + (s.z[i] / s.L) * panelH;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Plot current surface value label
      const surfVal = p.getValue(0);
      const botVal = p.getValue(s.nz - 1);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`Top: ${surfVal.toFixed(1)}`, px + 4, panelTop + 14);
      ctx.fillText(`Base: ${botVal.toFixed(1)}`, px + 4, panelTop + panelH - 8);
    });

    // Header metrics bar
    const days = (s.time / 86400).toFixed(1);
    const surfaceDispMm = (s.getSurfaceDisplacement() * 1000).toFixed(2);
    const maxDeltaP_MPa = (s.getMaxExcessPressure() / 1.0e6).toFixed(2);

    const metricsEl = document.getElementById('metrics-1d-summary');
    if (metricsEl) {
      metricsEl.innerHTML = `
        <span class="m-item">Elapsed: <strong>${days} Days</strong></span>
        <span class="m-item">Surface Disp: <strong class="${surfaceDispMm >= 0 ? 'color-green' : 'color-amber'}">${surfaceDispMm >= 0 ? '+' : ''}${surfaceDispMm} mm (${surfaceDispMm >= 0 ? 'Heave' : 'Settlement'})</strong></span>
        <span class="m-item">Peak Excess Δp: <strong class="color-cyan">${maxDeltaP_MPa} MPa</strong></span>
      `;
    }
  }

  // ==========================================
  // SIMULATOR 2: 2D Porous Media Playground
  // ==========================================
  init2DPlayground() {
    const canvas = document.getElementById('canvas-thm-2d');
    if (!canvas) return;
    this.thm2D = new THM2DCanvas(canvas);

    // Tool buttons
    const toolBtns = document.querySelectorAll('.tool-btn');
    toolBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        toolBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.thm2D.activeTool = btn.getAttribute('data-tool');
        if (this.thm2D.activeTool === 'fluid_inject') this.audio.playPump();
        else this.audio.playPing(380, 0.06);
      });
    });

    // View mode buttons
    const viewBtns = document.querySelectorAll('.view-btn');
    viewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        viewBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.thm2D.renderMode = btn.getAttribute('data-view');
      });
    });

    // Vector and particle toggles
    const chkParticle = document.getElementById('chk-particles-2d');
    if (chkParticle) {
      chkParticle.addEventListener('change', (e) => {
        this.thm2D.showParticles = e.target.checked;
      });
    }

    const chkVectors = document.getElementById('chk-vectors-2d');
    if (chkVectors) {
      chkVectors.addEventListener('change', (e) => {
        this.thm2D.showVectors = e.target.checked;
      });
    }

    const clearBtn = document.getElementById('btn-clear-2d');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.thm2D.clearSources();
      });
    }
  }

  // ==========================================
  // SIMULATOR 3: Mohr-Coulomb & Induced Seismicity
  // ==========================================
  initMohrCoulombSimulator() {
    const mohrCanvas = document.getElementById('canvas-mohr-coulomb');
    const waveCanvas = document.getElementById('canvas-waveform');
    if (!mohrCanvas) return;

    this.mohrEngine = new MohrCoulombEngine(mohrCanvas, waveCanvas);

    this.mohrEngine.onSlipEvent = (stats) => {
      this.audio.playRupture();
      const statusEl = document.getElementById('seismic-event-status');
      if (statusEl) {
        statusEl.innerHTML = `<span class="tag-rupture">⚡ FAULT SLIP TRIGGERED!</span> Moment Magnitude: <strong>Mw ${stats.Mw}</strong> | Slip: <strong>${stats.slipMm} mm</strong>`;
        statusEl.classList.add('flash-alert');
        setTimeout(() => statusEl.classList.remove('flash-alert'), 1200);
      }
    };

    // Sliders
    const bindSlider = (id, paramKey, scale = 1, unit = '') => {
      const slider = document.getElementById(`slider-mohr-${id}`);
      const valLabel = document.getElementById(`val-mohr-${id}`);
      if (slider) {
        slider.addEventListener('input', (e) => {
          const val = parseFloat(e.target.value) * scale;
          this.mohrEngine.setParams({ [paramKey]: val });
          if (valLabel) valLabel.textContent = `${e.target.value} ${unit}`;
          if (paramKey === 'porePressure') this.audio.playPump();
        });
      }
    };

    bindSlider('p', 'porePressure', 1, 'MPa');
    bindSlider('deltaT', 'deltaT', 1, '°C');
    bindSlider('sigma3', 'sigma3_total', 1, 'MPa');
    bindSlider('cohesion', 'cohesion', 1, 'MPa');
    bindSlider('friction', 'frictionAngle', 1, '°');
    bindSlider('angle', 'faultAngle', 1, '°');
  }

  // ==========================================
  // SIMULATOR 4: Nuclear Waste Barrier (KBS-3)
  // ==========================================
  initNuclearBarrier() {
    const canvas = document.getElementById('canvas-nuclear-barrier');
    if (!canvas) return;
    this.nuclearEngine = new NuclearBarrierEngine(canvas);

    const slider = document.getElementById('slider-nuclear-years');
    const label = document.getElementById('val-nuclear-years');

    if (slider) {
      slider.addEventListener('input', (e) => {
        // Logarithmic slider mapping: 0 to 4 => 10^0 (1 yr) to 10^4 (10,000 yrs)
        const logVal = parseFloat(e.target.value);
        const years = Math.pow(10, logVal);
        this.nuclearEngine.setTime(years);
        if (label) label.textContent = `${years.toLocaleString(undefined, { maximumFractionDigits: 1 })} Yrs`;
      });
    }

    const playBtn = document.getElementById('btn-play-nuclear');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        this.nuclearEngine.isPlaying = !this.nuclearEngine.isPlaying;
        playBtn.innerHTML = this.nuclearEngine.isPlaying ? '⏸ Pause Timeline' : '▶ Animate Timeline';
      });
    }
  }

  initSandboxCalculator() {
    const container = document.getElementById('sandbox-calculator-container');
    if (container) {
      this.sandboxUI = new SandboxCalculatorUI(container);
    }
  }

  animate(now) {
    const dt = (now - this.lastTime) / 1000.0;
    this.lastTime = now;

    // 1D Column simulation step
    if (this.sim1DRunning && this.solver1D) {
      // Advance by sim1DSpeed hours
      const substeps = 4;
      this.solver1D.dt = (this.sim1DSpeed * 3600.0) * dt;
      this.solver1D.step(substeps);
      this.render1DColumn();
    }

    // 2D Porous Canvas render
    if (this.thm2D) {
      this.thm2D.render();
    }

    // Mohr Coulomb render
    if (this.mohrEngine) {
      this.mohrEngine.render();
    }

    // Nuclear Barrier render
    if (this.nuclearEngine) {
      if (this.nuclearEngine.isPlaying) {
        // Increment log time gradually
        const currentLog = Math.log10(this.nuclearEngine.timeYears);
        const nextLog = currentLog + dt * 0.25;
        if (nextLog > 4.0) {
          this.nuclearEngine.setTime(1.0);
        } else {
          this.nuclearEngine.setTime(Math.pow(10, nextLog));
        }

        const slider = document.getElementById('slider-nuclear-years');
        const label = document.getElementById('val-nuclear-years');
        if (slider) slider.value = Math.log10(this.nuclearEngine.timeYears).toFixed(2);
        if (label) label.textContent = `${this.nuclearEngine.timeYears.toLocaleString(undefined, { maximumFractionDigits: 1 })} Yrs`;
      }
      this.nuclearEngine.render();
    }

    requestAnimationFrame(this.animate);
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  new App();
});

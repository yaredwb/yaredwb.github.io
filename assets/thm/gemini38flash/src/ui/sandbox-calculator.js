/**
 * Dimensionless Numbers & Characteristic Time Scale Sandbox Calculator
 * Evaluates Peclet numbers, hydraulic vs thermal diffusion speeds,
 * and Skempton coefficients across major rock formations.
 */

export const ROCK_DATABASE = {
  'opalinus_clay': {
    name: 'Opalinus Clay (Switzerland)',
    desc: 'Indurated shale / argillaceous rock investigated for deep nuclear waste storage (Mont Terri URL).',
    k: 1.0e-20,          // Permeability (m^2)
    kappa: 2.1,          // Thermal conductivity (W/(m*K))
    Ss: 2.5e-9,          // Specific storage (1/Pa)
    phi: 0.16,           // Porosity
    rhoCp: 2.2e6,        // Volumetric heat capacity (J/(m^3*K))
    E: 4.0,              // Young's modulus (GPa)
    nu: 0.28
  },
  'westerly_granite': {
    name: 'Westerly Granite (Crystalline Host)',
    desc: 'Dense, low-porosity igneous crystalline rock typical of geothermal basements and Scandinavian repositories.',
    k: 1.0e-19,
    kappa: 3.2,
    Ss: 4.0e-10,
    phi: 0.01,
    rhoCp: 2.3e6,
    E: 45.0,
    nu: 0.22
  },
  'berea_sandstone': {
    name: 'Berea Sandstone (Aquifer / Reservoir)',
    desc: 'High-porosity, high-permeability quartz sandstone standard in reservoir geomechanics.',
    k: 2.0e-13,
    kappa: 2.8,
    Ss: 1.5e-8,
    phi: 0.22,
    rhoCp: 2.0e6,
    E: 14.0,
    nu: 0.20
  },
  'mx80_bentonite': {
    name: 'MX-80 Compacted Bentonite (Buffer)',
    desc: 'Engineered barrier buffer clay with exceptionally high smectite content and massive swelling capacity.',
    k: 2.0e-21,
    kappa: 1.2,
    Ss: 6.0e-9,
    phi: 0.40,
    rhoCp: 2.5e6,
    E: 0.8,
    nu: 0.35
  }
};

export class SandboxCalculatorUI {
  constructor(containerElement) {
    this.container = containerElement;
    this.selectedRock = 'opalinus_clay';
    this.characteristicLength = 5.0; // meters
    this.seepageVelocity = 1.0e-7;   // m/s
    this.render();
  }

  calculate() {
    const rock = ROCK_DATABASE[this.selectedRock];
    const L = this.characteristicLength;
    const v = this.seepageVelocity;

    const rho_f = 1000.0; // kg/m^3
    const c_f = 4184.0;   // J/(kg*K)
    const mu_f = 1.0e-3;  // Pa*s

    // 1. Thermal Diffusivity c_th = kappa / (rho*Cp) in m^2/s
    const c_th = rock.kappa / rock.rhoCp;

    // 2. Hydraulic Diffusivity c_h = (k / mu) / Ss in m^2/s
    const c_h = (rock.k / mu_f) / rock.Ss;

    // 3. Characteristic Diffusion Times: t = L^2 / c
    const timeThermalSec = (L * L) / c_th;
    const timeHydraulicSec = (L * L) / c_h;

    // Ratio: t_h / t_th = c_th / c_h
    const ratio_th_over_h = c_th / c_h;

    // 4. Thermal Peclet Number: Pe = (rho_f * c_f * v * L) / kappa
    const Peclet = (rho_f * c_f * v * L) / rock.kappa;

    // 5. Undrained Skempton B parameter estimate: B ≈ 1 / (1 + phi * (Kf / Ks))
    const B_est = 1.0 / (1.0 + rock.phi * (2.2e9 / (rock.E * 1e9)));

    return {
      rock,
      L,
      v,
      c_th,
      c_h,
      timeThermalSec,
      timeHydraulicSec,
      ratio_th_over_h,
      Peclet,
      B_est
    };
  }

  formatTime(sec) {
    if (sec < 60) return `${sec.toFixed(1)} seconds`;
    if (sec < 3600) return `${(sec / 60).toFixed(1)} minutes`;
    if (sec < 86400) return `${(sec / 3600).toFixed(1)} hours`;
    if (sec < 365.25 * 86400) return `${(sec / 86400).toFixed(1)} days`;
    const years = sec / (365.25 * 86400);
    if (years > 10000) return `${years.toExponential(2)} years`;
    return `${years.toFixed(1)} years`;
  }

  render() {
    const calc = this.calculate();

    this.container.innerHTML = `
      <div class="sandbox-container glass-panel">
        <div class="sandbox-header">
          <h3>Geomechanical Time Scales & Dimensionless Sandbox</h3>
          <p class="subtitle">Investigate how rock properties dictate the race between thermal propagation and fluid pressure dissipation.</p>
        </div>

        <div class="sandbox-grid">
          <!-- Controls Panel -->
          <div class="sandbox-controls">
            <div class="form-group">
              <label class="form-label">Select Geological Medium:</label>
              <select class="custom-select" id="rock-selector">
                ${Object.keys(ROCK_DATABASE).map(key => `
                  <option value="${key}" ${key === this.selectedRock ? 'selected' : ''}>
                    ${ROCK_DATABASE[key].name}
                  </option>
                `).join('')}
              </select>
              <p class="rock-desc-hint" id="rock-desc">${calc.rock.desc}</p>
            </div>

            <div class="form-group">
              <div class="slider-header">
                <label class="form-label">Characteristic Diffusion Scale (L):</label>
                <span class="slider-val" id="val-L">${calc.L.toFixed(1)} m</span>
              </div>
              <input type="range" class="custom-slider" id="slider-L" min="0.5" max="50" step="0.5" value="${calc.L}">
            </div>

            <div class="form-group">
              <div class="slider-header">
                <label class="form-label">Darcy Seepage Velocity (v):</label>
                <span class="slider-val" id="val-v">${calc.v.toExponential(1)} m/s</span>
              </div>
              <input type="range" class="custom-slider" id="slider-v" min="-10" max="-3" step="0.5" value="${Math.log10(calc.v)}">
            </div>

            <div class="rock-properties-table">
              <div class="prop-row">
                <span>Permeability $k$:</span>
                <span class="prop-val mono">${calc.rock.k.toExponential(1)} m²</span>
              </div>
              <div class="prop-row">
                <span>Thermal Conductivity $\\kappa$:</span>
                <span class="prop-val mono">${calc.rock.kappa.toFixed(1)} W/(m·K)</span>
              </div>
              <div class="prop-row">
                <span>Specific Storage $S_s$:</span>
                <span class="prop-val mono">${calc.rock.Ss.toExponential(1)} Pa⁻¹</span>
              </div>
              <div class="prop-row">
                <span>Porosity $\\phi$:</span>
                <span class="prop-val mono">${(calc.rock.phi * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          <!-- Outputs & Visualization Cards -->
          <div class="sandbox-results">
            <!-- Key Insight Callout -->
            <div class="insight-box ${calc.ratio_th_over_h > 10 ? 'insight-pressurization' : 'insight-drained'}">
              <div class="insight-header">
                <span class="insight-icon">${calc.ratio_th_over_h > 10 ? '🔥⚠️' : '💧⚖️'}</span>
                <h4>${calc.ratio_th_over_h > 10 ? 'Thermal Pressurization Risk: HIGH' : 'Hydraulically Drained Regime'}</h4>
              </div>
              <p>
                ${calc.ratio_th_over_h > 10 
                  ? `Heat diffuses <strong>${calc.ratio_th_over_h.toFixed(0)}× faster</strong> than fluid pressure can drain. Any rapid temperature rise generates trapped pore pressure spikes!`
                  : `Fluid pressure dissipates quickly compared to thermal conduction. Excess pore pressure readily bleeds off into boundaries.`}
              </p>
            </div>

            <!-- Metric Cards -->
            <div class="metric-cards-grid">
              <div class="metric-card">
                <span class="metric-title">Thermal Diffusion Time ($t_{th}$)</span>
                <span class="metric-number">${this.formatTime(calc.timeThermalSec)}</span>
                <span class="metric-sub mono">$c_{th} = ${calc.c_th.toExponential(2)}$ m²/s</span>
              </div>

              <div class="metric-card">
                <span class="metric-title">Hydraulic Dissipation Time ($t_h$)</span>
                <span class="metric-number">${this.formatTime(calc.timeHydraulicSec)}</span>
                <span class="metric-sub mono">$c_h = ${calc.c_h.toExponential(2)}$ m²/s</span>
              </div>

              <div class="metric-card">
                <span class="metric-title">Thermal Péclet Number ($Pe_{th}$)</span>
                <span class="metric-number ${calc.Peclet > 1 ? 'color-amber' : 'color-cyan'}">${calc.Peclet < 0.01 ? calc.Peclet.toExponential(2) : calc.Peclet.toFixed(3)}</span>
                <span class="metric-sub">${calc.Peclet > 1 ? 'Advection Dominant' : 'Conduction Dominant'}</span>
              </div>

              <div class="metric-card">
                <span class="metric-title">Skempton B Coefficient</span>
                <span class="metric-number color-violet">${calc.B_est.toFixed(2)}</span>
                <span class="metric-sub">Undrained Mean Coupling</span>
              </div>
            </div>

            <!-- Diffusion Time Comparison Bar Graphic -->
            <div class="time-ratio-bar-section">
              <div class="bar-labels">
                <span>Thermal Conduction ($t_{th}$)</span>
                <span>Hydraulic Seepage ($t_h$)</span>
              </div>
              <div class="dual-time-track">
                <div class="time-bar-segment bar-thermal" style="width: ${Math.min(95, Math.max(5, 100 / (1 + calc.ratio_th_over_h)))}%"></div>
                <div class="time-bar-segment bar-hydraulic" style="width: ${Math.min(95, Math.max(5, (calc.ratio_th_over_h / (1 + calc.ratio_th_over_h)) * 100))}%"></div>
              </div>
              <div class="bar-footer">
                <small>Log ratio $\\log_{10}(t_h / t_{th}) = ${Math.log10(Math.max(1e-4, calc.ratio_th_over_h)).toFixed(2)}$</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();

    if (window.renderMathInElement) {
      window.renderMathInElement(this.container, {
        delimiters: [
          { left: '$', right: '$', display: false }
        ],
        throwOnError: false
      });
    }
  }

  bindEvents() {
    const selector = this.container.querySelector('#rock-selector');
    if (selector) {
      selector.addEventListener('change', (e) => {
        this.selectedRock = e.target.value;
        this.render();
      });
    }

    const sliderL = this.container.querySelector('#slider-L');
    if (sliderL) {
      sliderL.addEventListener('input', (e) => {
        this.characteristicLength = parseFloat(e.target.value);
        this.render();
      });
    }

    const sliderV = this.container.querySelector('#slider-v');
    if (sliderV) {
      sliderV.addEventListener('input', (e) => {
        this.seepageVelocity = Math.pow(10, parseFloat(e.target.value));
        this.render();
      });
    }
  }
}

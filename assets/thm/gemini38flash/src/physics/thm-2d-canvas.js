/**
 * THM 2D Canvas: Interactive 2D Porous Media Simulation & Visualization
 * Renders continuum fields (Temperature, Pressure, Volumetric Strain, Darcy Flow)
 * and microscopic pore particles flowing through the porous skeleton.
 */

export class THM2DCanvas {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    
    // Grid resolution
    this.nx = options.nx || 48;
    this.ny = options.ny || 32;
    this.cellW = this.canvas.width / this.nx;
    this.cellH = this.canvas.height / this.ny;

    // Physical fields
    this.T = new Float32Array(this.nx * this.ny);       // Temperature (°C)
    this.p = new Float32Array(this.nx * this.ny);       // Pore Pressure (MPa)
    this.eps_v = new Float32Array(this.nx * this.ny);   // Volumetric strain (%)
    this.perm = new Float32Array(this.nx * this.ny);    // Normalized permeability (0.01 to 1.0)
    this.vx = new Float32Array(this.nx * this.ny);      // Darcy flux x
    this.vy = new Float32Array(this.nx * this.ny);      // Darcy flux y

    // Visualization mode: 'temperature' | 'pressure' | 'strain' | 'micro_grains'
    this.renderMode = 'temperature';
    this.showVectors = true;
    this.showParticles = true;

    // Interactive tool: 'heat_source' | 'cold_sink' | 'fluid_inject' | 'fluid_pump' | 'mech_press' | 'barrier'
    this.activeTool = 'heat_source';
    this.isPointerDown = false;

    // Microscopic tracer particles in pore space
    this.numParticles = 180;
    this.particles = [];
    this.initParticles();

    // Source sinks tracking
    this.sources = [];

    // Grains for micro-lattice view
    this.initGrains();

    this.initFields();
    this.setupInteractions();
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < this.numParticles; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        life: Math.random() * 100,
        speed: 1.0 + Math.random() * 1.5,
        size: 1.5 + Math.random() * 1.5
      });
    }
  }

  initGrains() {
    // Hexagonal / grid packed solid grains for microscopic visualization
    this.grains = [];
    const grainCols = 16;
    const grainRows = 10;
    const dx = this.canvas.width / grainCols;
    const dy = this.canvas.height / grainRows;

    for (let j = 0; j < grainRows; j++) {
      for (let i = 0; i < grainCols; i++) {
        const offset = (j % 2 === 1) ? dx * 0.5 : 0;
        this.grains.push({
          x: i * dx + dx * 0.5 + offset,
          y: j * dy + dy * 0.5,
          baseRadius: Math.min(dx, dy) * 0.38,
          gridI: Math.floor((i / grainCols) * this.nx),
          gridJ: Math.floor((j / grainRows) * this.ny)
        });
      }
    }
  }

  initFields() {
    for (let j = 0; j < this.ny; j++) {
      for (let i = 0; i < this.nx; i++) {
        const idx = j * this.nx + i;
        // Ambient conditions: T = 20°C, P = 2.0 MPa
        this.T[idx] = 20.0;
        this.p[idx] = 2.0;
        this.eps_v[idx] = 0.0;
        this.perm[idx] = 1.0;
        this.vx[idx] = 0.0;
        this.vy[idx] = 0.0;
      }
    }

    // Default setup: a warm source on the left, an injection point in the center
    this.addSource(12, 16, 'heat', 75.0);
    this.addSource(32, 16, 'inject', 6.0);
  }

  addSource(gx, gy, type, intensity) {
    this.sources.push({ gx, gy, type, intensity });
  }

  clearSources() {
    this.sources = [];
    this.initFields();
  }

  setupInteractions() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    };

    const applyTool = (pos) => {
      const gx = Math.max(1, Math.min(this.nx - 2, Math.floor(pos.x / this.cellW)));
      const gy = Math.max(1, Math.min(this.ny - 2, Math.floor(pos.y / this.cellH)));

      const radius = 2;
      for (let dj = -radius; dj <= radius; dj++) {
        for (let di = -radius; di <= radius; di++) {
          const ci = gx + di;
          const cj = gy + dj;
          if (ci >= 0 && ci < this.nx && cj >= 0 && cj < this.ny) {
            const idx = cj * this.nx + ci;
            const dist = Math.sqrt(di * di + dj * dj);
            if (dist <= radius) {
              const weight = 1.0 - dist / (radius + 0.5);
              switch (this.activeTool) {
                case 'heat_source':
                  this.T[idx] = Math.min(120.0, this.T[idx] + 25.0 * weight);
                  // Thermal pressurization in pore
                  this.p[idx] += 0.8 * weight;
                  break;
                case 'cold_sink':
                  this.T[idx] = Math.max(5.0, this.T[idx] - 25.0 * weight);
                  this.p[idx] = Math.max(0.5, this.p[idx] - 0.5 * weight);
                  break;
                case 'fluid_inject':
                  this.p[idx] = Math.min(10.0, this.p[idx] + 1.5 * weight);
                  break;
                case 'fluid_pump':
                  this.p[idx] = Math.max(0.2, this.p[idx] - 1.5 * weight);
                  break;
                case 'mech_press':
                  // Compressive volumetric strain
                  this.eps_v[idx] += 0.015 * weight;
                  // Undrained pore pressure spike
                  this.p[idx] += 0.6 * weight;
                  // Reduced permeability from compaction
                  this.perm[idx] = Math.max(0.05, this.perm[idx] * (1.0 - 0.2 * weight));
                  break;
                case 'barrier':
                  // Impermeable fault / clay smear
                  this.perm[idx] = 0.005;
                  break;
              }
            }
          }
        }
      }
    };

    this.canvas.addEventListener('mousedown', (e) => {
      this.isPointerDown = true;
      applyTool(getPos(e));
    });

    window.addEventListener('mouseup', () => {
      this.isPointerDown = false;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (this.isPointerDown) {
        applyTool(getPos(e));
      }
    });

    // Touch events for mobile/tablet
    this.canvas.addEventListener('touchstart', (e) => {
      this.isPointerDown = true;
      applyTool(getPos(e));
      e.preventDefault();
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      if (this.isPointerDown) {
        applyTool(getPos(e));
      }
      e.preventDefault();
    }, { passive: false });

    this.canvas.addEventListener('touchend', () => {
      this.isPointerDown = false;
    });
  }

  // Real-time finite difference solver step for 2D coupled physics
  stepPhysics() {
    const nextT = new Float32Array(this.T);
    const nextP = new Float32Array(this.p);

    const alpha_diff_T = 0.12; // Thermal diffusivity
    const alpha_diff_P = 0.25; // Hydraulic diffusivity

    // Maintain boundary sinks / sources
    for (const src of this.sources) {
      const idx = src.gy * this.nx + src.gx;
      if (src.type === 'heat') {
        this.T[idx] = src.intensity;
      } else if (src.type === 'inject') {
        this.p[idx] = src.intensity;
      }
    }

    // 1. Solve 2D Darcy Flow & Pressure Diffusion with Permeability
    for (let j = 1; j < this.ny - 1; j++) {
      for (let i = 1; i < this.nx - 1; i++) {
        const idx = j * this.nx + i;
        const k_mid = this.perm[idx];

        // Hydraulic gradients
        const dp_dx = (this.p[idx + 1] - this.p[idx - 1]) * 0.5;
        const dp_dy = (this.p[idx + this.nx] - this.p[idx - this.nx]) * 0.5;

        // Darcy flux: q = -k/mu * grad(p)
        // Viscosity decreases with temperature
        const viscosity_factor = 1.0 + (this.T[idx] - 20.0) * 0.015;
        const mobility = k_mid * viscosity_factor;

        this.vx[idx] = -mobility * dp_dx * 0.6;
        this.vy[idx] = -mobility * dp_dy * 0.6;

        // Flow divergence
        const d2p_dx2 = this.perm[idx + 1] * (this.p[idx + 1] - this.p[idx]) - this.perm[idx - 1] * (this.p[idx] - this.p[idx - 1]);
        const d2p_dy2 = this.perm[idx + this.nx] * (this.p[idx + this.nx] - this.p[idx]) - this.perm[idx - this.nx] * (this.p[idx] - this.p[idx - this.nx]);

        // Thermal pressurization coupling term: beta_m * dT/dt
        const dT_approx = (this.T[idx] - 20.0) * 0.002;

        nextP[idx] = this.p[idx] + alpha_diff_P * (d2p_dx2 + d2p_dy2) * mobility + dT_approx;
      }
    }

    // 2. Solve 2D Heat Conduction & Advection
    for (let j = 1; j < this.ny - 1; j++) {
      for (let i = 1; i < this.nx - 1; i++) {
        const idx = j * this.nx + i;

        // Conduction Laplacian
        const d2T_dx2 = this.T[idx + 1] - 2 * this.T[idx] + this.T[idx - 1];
        const d2T_dy2 = this.T[idx + this.nx] - 2 * this.T[idx] + this.T[idx - 1];

        // Convective advection: - q * grad(T)
        const dT_dx = (this.T[idx + 1] - this.T[idx - 1]) * 0.5;
        const dT_dy = (this.T[idx + this.nx] - this.T[idx - this.nx]) * 0.5;
        const advection = (this.vx[idx] * dT_dx + this.vy[idx] * dT_dy) * 0.4;

        nextT[idx] = this.T[idx] + alpha_diff_T * (d2T_dx2 + d2T_dy2) - advection;

        // Dissipate slightly to ambient at boundaries
        nextT[idx] = nextT[idx] * 0.999 + 20.0 * 0.001;
      }
    }

    // Open/leaky boundary condition for pressure
    for (let i = 0; i < this.nx; i++) {
      nextP[i] = nextP[i] * 0.98 + 2.0 * 0.02;
      nextP[(this.ny - 1) * this.nx + i] = nextP[(this.ny - 1) * this.nx + i] * 0.98 + 2.0 * 0.02;
    }
    for (let j = 0; j < this.ny; j++) {
      nextP[j * this.nx] = nextP[j * this.nx] * 0.98 + 2.0 * 0.02;
      nextP[j * this.nx + (this.nx - 1)] = nextP[j * this.nx + (this.nx - 1)] * 0.98 + 2.0 * 0.02;
    }

    this.p.set(nextP);
    this.T.set(nextT);

    // 3. Compute Coupled Volumetric Strain
    // eps_v = (p - p0)*C_p + (T - T0)*alpha_T (dilation vs compaction)
    for (let i = 0; i < this.nx * this.ny; i++) {
      const delta_p = this.p[i] - 2.0;
      const delta_T = this.T[i] - 20.0;
      // Negative eps_v = dilation / swelling, Positive = compaction
      this.eps_v[i] = -delta_p * 0.004 - delta_T * 0.003;
    }

    // 4. Update Micro Tracer Particles
    for (let k = 0; k < this.particles.length; k++) {
      const pt = this.particles[k];
      const gi = Math.max(0, Math.min(this.nx - 1, Math.floor(pt.x / this.cellW)));
      const gj = Math.max(0, Math.min(this.ny - 1, Math.floor(pt.y / this.cellH)));
      const idx = gj * this.nx + gi;

      const vx = this.vx[idx] * 40.0 * pt.speed;
      const vy = this.vy[idx] * 40.0 * pt.speed;

      pt.x += vx;
      pt.y += vy;
      pt.life += 0.5;

      // Wrap or respawn if out of bounds or expired
      if (pt.x < 0 || pt.x >= this.canvas.width || pt.y < 0 || pt.y >= this.canvas.height || pt.life > 180) {
        pt.x = Math.random() * this.canvas.width;
        pt.y = Math.random() * this.canvas.height;
        pt.life = 0;
      }
    }
  }

  // Turbo / Inferno colormap generation for Temperature
  getHeatColor(temp) {
    // Normal range: 15°C to 100°C
    const val = Math.max(0.0, Math.min(1.0, (temp - 15.0) / 85.0));
    // Turbo-style colormap approximation
    let r, g, b;
    if (val < 0.25) {
      const t = val / 0.25;
      r = Math.floor(40 + 20 * t);
      g = Math.floor(40 + 160 * t);
      b = Math.floor(180 + 75 * t);
    } else if (val < 0.5) {
      const t = (val - 0.25) / 0.25;
      r = Math.floor(60 + 60 * t);
      g = Math.floor(200 + 55 * t);
      b = Math.floor(255 * (1 - t * 0.7));
    } else if (val < 0.75) {
      const t = (val - 0.5) / 0.25;
      r = Math.floor(120 + 135 * t);
      g = Math.floor(255 * (1 - t * 0.4));
      b = Math.floor(75 * (1 - t));
    } else {
      const t = (val - 0.75) / 0.25;
      r = Math.floor(255);
      g = Math.floor(153 * (1 - t * 0.7));
      b = Math.floor(50 * t);
    }
    return `rgb(${r},${g},${b})`;
  }

  // Pressure colormap: Cyan / Azure / Deep Blue
  getPressureColor(press) {
    // Range 1.0 to 8.0 MPa
    const val = Math.max(0.0, Math.min(1.0, (press - 1.0) / 7.0));
    const r = Math.floor(10 + 60 * val);
    const g = Math.floor(60 + 180 * val);
    const b = Math.floor(140 + 115 * val);
    return `rgb(${r},${g},${b})`;
  }

  // Volumetric strain colormap: Green (dilation) to Violet (compaction)
  getStrainColor(strain) {
    // Range: -0.05 to +0.05
    const val = Math.max(-1.0, Math.min(1.0, strain / 0.03));
    let r, g, b;
    if (val < 0) {
      // Dilation: Cyan / Teal
      const t = -val;
      r = Math.floor(20 + 40 * (1 - t));
      g = Math.floor(140 + 100 * t);
      b = Math.floor(160 + 80 * t);
    } else {
      // Compaction: Violet / Magenta
      const t = val;
      r = Math.floor(120 + 120 * t);
      g = Math.floor(40 + 30 * (1 - t));
      b = Math.floor(160 + 90 * t);
    }
    return `rgb(${r},${g},${b})`;
  }

  render() {
    this.stepPhysics();
    const ctx = this.ctx;
    const cw = this.cellW;
    const ch = this.cellH;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.renderMode === 'micro_grains') {
      // Render microscopic solid grain matrix and pore space
      ctx.fillStyle = '#0b1220';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Render flow streamlines in background
      if (this.showParticles) {
        ctx.fillStyle = 'rgba(0, 229, 255, 0.4)';
        for (const pt of this.particles) {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw expandable mineral grains
      for (const grain of this.grains) {
        const idx = grain.gridJ * this.nx + grain.gridI;
        const temp = this.T[idx] || 20.0;
        const press = this.p[idx] || 2.0;

        // Thermal expansion of grain radius
        const thermalExpansion = 1.0 + (temp - 20.0) * 0.003;
        const radius = grain.baseRadius * thermalExpansion;

        // Color based on temperature
        const grad = ctx.createRadialGradient(
          grain.x - radius * 0.3, grain.y - radius * 0.3, radius * 0.1,
          grain.x, grain.y, radius
        );
        grad.addColorStop(0, '#e2e8f0');
        grad.addColorStop(0.6, temp > 50 ? '#f97316' : '#64748b');
        grad.addColorStop(1, temp > 50 ? '#c2410c' : '#334155');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(grain.x, grain.y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    } else {
      // Continuum field rendering
      for (let j = 0; j < this.ny; j++) {
        for (let i = 0; i < this.nx; i++) {
          const idx = j * this.nx + i;
          let color;
          if (this.renderMode === 'temperature') {
            color = this.getHeatColor(this.T[idx]);
          } else if (this.renderMode === 'pressure') {
            color = this.getPressureColor(this.p[idx]);
          } else if (this.renderMode === 'strain') {
            color = this.getStrainColor(this.eps_v[idx]);
          }

          // Low perm barriers drawn with hatching / dark grey
          if (this.perm[idx] < 0.05) {
            ctx.fillStyle = '#1e293b';
          } else {
            ctx.fillStyle = color;
          }

          ctx.fillRect(i * cw, j * ch, cw + 0.5, ch + 0.5);
        }
      }

      // Draw Darcy velocity vector field arrows if enabled
      if (this.showVectors) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 1.2;
        const stepX = 4;
        const stepY = 4;

        for (let j = 2; j < this.ny - 2; j += stepY) {
          for (let i = 2; i < this.nx - 2; i += stepX) {
            const idx = j * this.nx + i;
            const vx = this.vx[idx];
            const vy = this.vy[idx];
            const mag = Math.sqrt(vx * vx + vy * vy);

            if (mag > 0.01) {
              const startX = (i + 0.5) * cw;
              const startY = (j + 0.5) * ch;
              const len = Math.min(cw * 2.5, mag * 25.0);
              const endX = startX + (vx / mag) * len;
              const endY = startY + (vy / mag) * len;

              ctx.beginPath();
              ctx.moveTo(startX, startY);
              ctx.lineTo(endX, endY);
              ctx.stroke();

              // Arrow tip
              const angle = Math.atan2(vy, vx);
              ctx.beginPath();
              ctx.moveTo(endX, endY);
              ctx.lineTo(endX - 4 * Math.cos(angle - Math.PI / 6), endY - 4 * Math.sin(angle - Math.PI / 6));
              ctx.lineTo(endX - 4 * Math.cos(angle + Math.PI / 6), endY - 4 * Math.sin(angle + Math.PI / 6));
              ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
              ctx.fill();
            }
          }
        }
      }

      // Draw Microscopic tracer particles flowing through pore space
      if (this.showParticles) {
        for (const pt of this.particles) {
          const gi = Math.max(0, Math.min(this.nx - 1, Math.floor(pt.x / this.cellW)));
          const gj = Math.max(0, Math.min(this.ny - 1, Math.floor(pt.y / this.cellH)));
          const idx = gj * this.nx + gi;
          const temp = this.T[idx];

          // Particle glow based on temperature
          ctx.fillStyle = temp > 45 ? 'rgba(255, 170, 50, 0.85)' : 'rgba(100, 240, 255, 0.85)';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Draw Source/Sink marker rings
    for (const src of this.sources) {
      const cx = (src.gx + 0.5) * cw;
      const cy = (src.gy + 0.5) * ch;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.strokeStyle = src.type === 'heat' ? '#ff4d4d' : '#00e5ff';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();

      ctx.fillStyle = src.type === 'heat' ? 'rgba(255, 77, 77, 0.3)' : 'rgba(0, 229, 255, 0.3)';
      ctx.fill();
      ctx.restore();
    }
  }
}

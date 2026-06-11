// Interactive THM website - Logic and Physics Simulations

document.addEventListener('DOMContentLoaded', () => {
  initHeroCanvas();
  initCouplingMatrix();
  initLabSelector();
  initConsolidationSim();
  initThermalPressurizationSim();
  initThermalStressSim();
  initNavigation();
});

/* =========================================================================
   1. NAVIGATION & GENERAL UI
   ========================================================================= */
function initNavigation() {
  const sections = document.querySelectorAll('section, .hero');
  const navLinks = document.querySelectorAll('nav a');

  window.addEventListener('scroll', () => {
    let current = '';
    const scrollPos = window.scrollY + 100;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        current = section.getAttribute('id') || 'hero';
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href').substring(1);
      if (href === current || (current === 'hero' && href === '')) {
        link.classList.add('active');
      }
    });
  });
}

/* =========================================================================
   2. HERO INTERACTIVE POROUS CANVAS
   ========================================================================= */
function initHeroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  let width = canvas.width = canvas.parentElement.clientWidth;
  let height = canvas.height = canvas.parentElement.clientHeight;
  
  window.addEventListener('resize', () => {
    if (canvas.parentElement) {
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
      generateGrains();
    }
  });

  // Grains (porous matrix skeleton)
  let grains = [];
  const grainCount = 18;
  
  function generateGrains() {
    grains = [];
    // Generate static circular grains
    const cols = 6;
    const rows = 3;
    const dx = width / (cols + 1);
    const dy = height / (rows + 1);
    
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        // Add random displacement
        const x = dx * (i + 1) + (Math.random() - 0.5) * dx * 0.4;
        const y = dy * (j + 1) + (Math.random() - 0.5) * dy * 0.4;
        const r = 22 + Math.random() * 12; // grain radius
        grains.push({ x, y, r, baseR: r, px: x, py: y });
      }
    }
  }
  
  generateGrains();

  // Fluid particles
  const particles = [];
  const particleCount = 80;
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (0.5 + Math.random() * 1.5),
      vy: (Math.random() - 0.5) * 0.5,
      color: 'rgba(0, 210, 211, 0.6)',
      size: 1.5 + Math.random() * 2
    });
  }

  // Thermal energy waves (drawn as background glow or waves)
  let heatSourceX = 0;
  let thermalPulse = 0;

  // Mouse interaction
  let mouse = { x: -1000, y: -1000, active: false, radius: 100 };
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
  });

  canvas.addEventListener('mouseleave', () => {
    mouse.active = false;
  });

  function animate() {
    ctx.clearRect(0, 0, width, height);
    
    // 1. Draw Thermal wave gradient background
    thermalPulse += 0.02;
    const heatGrad = ctx.createLinearGradient(0, 0, width, 0);
    const pulseVal = Math.sin(thermalPulse) * 0.05 + 0.15;
    heatGrad.addColorStop(0, `rgba(255, 82, 82, ${pulseVal})`);
    heatGrad.addColorStop(0.5, `rgba(255, 82, 82, ${pulseVal * 0.4})`);
    heatGrad.addColorStop(1, 'rgba(255, 82, 82, 0)');
    ctx.fillStyle = heatGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw thermal heat front line
    ctx.strokeStyle = 'rgba(255, 82, 82, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let y = 0; y < height; y += 10) {
      const waveX = 100 + Math.sin(y * 0.05 + thermalPulse) * 20;
      if (y === 0) ctx.moveTo(waveX, y);
      else ctx.lineTo(waveX, y);
    }
    ctx.stroke();

    // 2. Update and draw solid grains
    grains.forEach(grain => {
      // Mechanical compression by mouse
      if (mouse.active) {
        const dist = Math.hypot(grain.x - mouse.x, grain.y - mouse.y);
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          // Displace grains slightly away from mouse
          const angle = Math.atan2(grain.y - mouse.y, grain.x - mouse.x);
          grain.x = grain.px + Math.cos(angle) * force * 15;
          grain.y = grain.py + Math.sin(angle) * force * 15;
          grain.r = grain.baseR - force * 4; // Compress grain size slightly
        } else {
          // Return to base position
          grain.x += (grain.px - grain.x) * 0.1;
          grain.y += (grain.py - grain.y) * 0.1;
          grain.r += (grain.baseR - grain.r) * 0.1;
        }
      } else {
        grain.x += (grain.px - grain.x) * 0.1;
        grain.y += (grain.py - grain.y) * 0.1;
        grain.r += (grain.baseR - grain.r) * 0.1;
      }

      // Draw grain shadow/glow
      ctx.beginPath();
      ctx.arc(grain.x, grain.y, grain.r, 0, Math.PI * 2);
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();

      // Inner grain texture detail
      ctx.beginPath();
      ctx.arc(grain.x - grain.r * 0.3, grain.y - grain.r * 0.3, grain.r * 0.1, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fill();
    });

    // 3. Update and draw fluid particles
    particles.forEach(p => {
      // Base velocity
      let currentVx = p.vx;
      let currentVy = p.vy;

      // Hydro-mechanical interaction (squeezing increases speed)
      if (mouse.active) {
        const dist = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        if (dist < mouse.radius) {
          // Speed up fluid particles near compression zone
          const speedBoost = (mouse.radius - dist) / mouse.radius * 3.0;
          currentVx += speedBoost;
          currentVy += (Math.random() - 0.5) * speedBoost;
        }
      }

      p.x += currentVx;
      p.y += currentVy;

      // Wrap around screen boundaries
      if (p.x > width) {
        p.x = 0;
        p.y = Math.random() * height;
      }
      if (p.y < 0 || p.y > height) {
        p.y = Math.random() * height;
      }

      // Collide/bounce off grains (simple reflection)
      grains.forEach(grain => {
        const dist = Math.hypot(p.x - grain.x, p.y - grain.y);
        if (dist < grain.r + 2) {
          // Push particle outside grain radius
          const angle = Math.atan2(p.y - grain.y, p.x - grain.x);
          p.x = grain.x + Math.cos(angle) * (grain.r + 3);
          
          // Re-route along the boundary
          const tx = -Math.sin(angle);
          const ty = Math.cos(angle);
          const dot = p.vx * tx + p.vy * ty;
          p.vx = tx * dot + Math.cos(angle) * 0.2; // glide along surface
          p.vy = ty * dot + Math.sin(angle) * 0.2;
        }
      });

      // Draw particle
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 4;
      ctx.shadowColor = 'var(--color-hydro)';
      ctx.fill();
      ctx.shadowBlur = 0; // reset
    });

    requestAnimationFrame(animate);
  }

  animate();
}

/* =========================================================================
   3. COUPLING MATRIX MECHANICS
   ========================================================================= */
const couplingData = {
  't-h': {
    badge: 'badge-t-h',
    title: 'Thermal ➔ Hydraulic (TH Coupling)',
    description: 'Heating fluid in porous media triggers volumetric thermal expansion. Because water expands significantly more than the surrounding solid skeleton ($\\alpha_f \\gg \\alpha_s$), under undrained conditions this differential expansion generates high fluid pressure (Thermal Pressurization). Additionally, fluid viscosity decreases as temperature rises, which significantly boosts hydraulic conductivity.',
    equation: '\\Delta p = \\Lambda \\Delta T = \\frac{\\alpha_f - \\alpha_s}{S} \\Delta T',
    example: 'Geothermal reservoirs: injecting cold water near hot zones creates high pressure fronts that drive fracturing and fluid circulation.'
  },
  't-m': {
    badge: 'badge-t-m',
    title: 'Thermal ➔ Mechanical (TM Coupling)',
    description: 'Increases in temperature cause the solid skeleton grains to expand. If the rock or soil boundary is structurally constrained, this thermal expansion generates massive compressive thermal stresses. In unconstrained media, thermal expansion induces volumetric deformation.',
    equation: '\\Delta \\sigma_{ij}^T = -3 K \\alpha_s \\Delta T \\delta_{ij}',
    example: 'Nuclear waste disposal repositories: heat emitted by decay canisters generates thermal stress fields in the surrounding host clay or granite rock.'
  },
  'h-t': {
    badge: 'badge-h-t',
    title: 'Hydraulic ➔ Thermal (HT Coupling)',
    description: 'Fluid movement through pore throats transports thermal energy via advective/convective heat transfer. This convective transport dominates conduction in highly permeable soils or rocks, rapidly shifting thermal fronts downstream along fluid flow lines.',
    equation: 'q_T = \\rho_f C_f \\mathbf{q}_f T - \\lambda_{eff} \\nabla T',
    example: 'Hydrothermal vents and groundwater aquifers: hot springs carrying heat from deep geological basement formations to the shallow subsurface.'
  },
  'h-m': {
    badge: 'badge-h-m',
    title: 'Hydraulic ➔ Mechanical (HM Coupling)',
    description: 'This represents Terzaghi\'s Effective Stress Principle. Fluid pressure inside the pore spaces ($p$) acts outwards against the compressive total stresses ($\\sigma$) pushing the grains together. An increase in pore pressure reduces the effective load carried by the solid skeleton structure, causing soil swelling or shear failure. Conversely, draining fluid and lowering pressure leads to settlement and compaction.',
    equation: '\\sigma\'_{ij} = \\sigma_{ij} - \\alpha p \\delta_{ij}',
    example: 'Land subsidence: excessive groundwater extraction in cities like Venice or San Joaquin Valley lowers pore pressure, causing severe clay compaction and sinking land.'
  },
  'm-t': {
    badge: 'badge-m-t',
    title: 'Mechanical ➔ Thermal (MT Coupling)',
    description: 'Rapid deformation, high strain-rate loadings, or frictional slip along fracture planes convert mechanical kinetic energy into thermal heat energy. In soil/rock mechanics, this coupling is typically negligible in slow quasi-static processes, but plays a crucial role during dynamic earthquake slips.',
    equation: 'Q_T = \\boldsymbol{\\sigma}\' : \\dot{\\boldsymbol{\\epsilon}}^p + \\text{friction heat}',
    example: 'Fault friction: during earthquakes, shear slip along faults generates dramatic heat, occasionally melting the rock to create pseudotachylytes.'
  },
  'm-h': {
    badge: 'badge-m-h',
    title: 'Mechanical ➔ Hydraulic (MH Coupling)',
    description: 'Compressive mechanical stress shrinks the pore volume, squeezing fluid outwards and generating transient pore pressure spikes (poroelastic effect). Additionally, mechanical plastic shearing can cause grain reorganization: loose sand contractancy squeezes water out, while dense sand dilatancy creates suction by expanding pore space.',
    equation: '\\Delta p = -B \\frac{\\Delta \\sigma_{kk}}{3} \\quad \\text{(Skempton\'s effect)}',
    example: 'Squeezing a wet sponge: applying a mechanical force immediately displaces water. In geology, tectonic compression generates high geological overpressures.'
  }
};

function initCouplingMatrix() {
  const cells = document.querySelectorAll('.cell-coupling');
  const placeholder = document.getElementById('matrix-placeholder');
  const details = document.getElementById('matrix-details');
  
  cells.forEach(cell => {
    cell.addEventListener('click', () => {
      // Toggle active states
      cells.forEach(c => c.classList.remove('active'));
      cell.classList.add('active');
      
      const couplingId = cell.dataset.coupling;
      const data = couplingData[couplingId];
      
      if (data) {
        placeholder.style.display = 'none';
        
        // Populate fields
        details.innerHTML = `
          <div class="matrix-detail-content active">
            <span class="detail-badge ${data.badge}">${data.title.split(' ')[0]} ➔ ${data.title.split(' ➔ ')[1].split(' ')[0]}</span>
            <h3 class="detail-title">${data.title}</h3>
            <p class="detail-description">${data.description}</p>
            <div class="detail-equation-box" id="matrix-math-render"></div>
            <div class="detail-example-title">Physical Example</div>
            <div class="detail-example">${data.example}</div>
          </div>
        `;
        
        // Render math formula using KaTeX
        const mathEl = document.getElementById('matrix-math-render');
        if (mathEl && window.katex) {
          try {
            window.katex.render(data.equation, mathEl, {
              displayMode: true,
              throwOnError: false
            });
          } catch (err) {
            mathEl.textContent = data.equation;
          }
        }
      }
    });
  });
}

/* =========================================================================
   4. LAB SELECTOR TAB BARS
   ========================================================================= */
function initLabSelector() {
  const tabs = document.querySelectorAll('.lab-tab');
  const panels = document.querySelectorAll('.simulator-panel');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      
      tab.classList.add('active');
      const targetId = tab.dataset.lab;
      document.getElementById(targetId).classList.add('active');
      
      // Resize canvas of newly activated tab if necessary
      if (targetId === 'lab-consolidation') resizeConsolidation();
      if (targetId === 'lab-thermal') resizeThermalPressurization();
      if (targetId === 'lab-stress') resizeThermalStress();
    });
  });
}

/* =========================================================================
   5. LAB 1: 1D TERZAGHI CONSOLIDATION SIMULATOR (HM)
   ========================================================================= */
let consolidationState = {
  running: false,
  time: 0,
  cv: 0.05,
  E: 10,       // MPa
  k: 1e-3,     // m/s equivalent scaled
  load: 100,    // kPa
  maxDepth: 10, // meters
  timeScale: 0.15
};

let consCanvas, consCtx;
let consAnimFrame;

function initConsolidationSim() {
  consCanvas = document.getElementById('consolidation-canvas');
  if (!consCanvas) return;
  consCtx = consCanvas.getContext('2d');

  resizeConsolidation();
  window.addEventListener('resize', () => {
    if (document.getElementById('lab-consolidation').classList.contains('active')) {
      resizeConsolidation();
    }
  });

  // UI elements binding
  const sliderK = document.getElementById('cons-k');
  const sliderE = document.getElementById('cons-e');
  const sliderLoad = document.getElementById('cons-load');
  const valK = document.getElementById('cons-k-val');
  const valE = document.getElementById('cons-e-val');
  const valLoad = document.getElementById('cons-load-val');

  const btnPlay = document.getElementById('cons-play');
  const btnReset = document.getElementById('cons-reset');
  const indicator = document.getElementById('cons-indicator');

  const monitorSettlement = document.getElementById('mon-settlement');
  const monitorPressure = document.getElementById('mon-pressure');

  function updateParameters() {
    // k ranges 1e-4 to 1e-2 (arbitrary unit)
    const kRaw = parseFloat(sliderK.value);
    consolidationState.k = kRaw;
    valK.textContent = kRaw.toFixed(4);

    const eRaw = parseFloat(sliderE.value);
    consolidationState.E = eRaw;
    valE.textContent = eRaw + ' MPa';

    const loadRaw = parseFloat(sliderLoad.value);
    consolidationState.load = loadRaw;
    valLoad.textContent = loadRaw + ' kPa';

    // c_v = k * E
    consolidationState.cv = consolidationState.k * consolidationState.E * 0.1; 
  }

  sliderK.addEventListener('input', updateParameters);
  sliderE.addEventListener('input', updateParameters);
  sliderLoad.addEventListener('input', updateParameters);

  updateParameters();

  btnPlay.addEventListener('click', () => {
    consolidationState.running = !consolidationState.running;
    if (consolidationState.running) {
      btnPlay.innerHTML = '<svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> Pause';
      indicator.classList.add('running');
      runConsolidationLoop();
    } else {
      btnPlay.innerHTML = '<svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Run';
      indicator.classList.remove('running');
      cancelAnimationFrame(consAnimFrame);
    }
  });

  btnReset.addEventListener('click', () => {
    consolidationState.time = 0;
    renderConsolidation();
    monitorSettlement.textContent = '0.0 mm';
    monitorPressure.textContent = consolidationState.load.toFixed(0) + ' kPa';
  });

  // Initial draw
  renderConsolidation();
}

function resizeConsolidation() {
  if (!consCanvas) return;
  consCanvas.width = consCanvas.parentElement.clientWidth;
  consCanvas.height = consCanvas.parentElement.clientHeight - 40;
  renderConsolidation();
}

// Terzaghi Analytical Solution for Excess Pore Pressure u(z, t)
function getExcessPressure(z, t, H, q0, cv) {
  if (t === 0) return q0;
  let sum = 0;
  // Sum 25 terms of the Fourier series for high accuracy
  for (let m = 0; m < 25; m++) {
    const M = (2 * m + 1) * Math.PI / 2;
    const factor = 2 / M;
    sum += factor * Math.sin(M * z / H) * Math.exp(-M * M * cv * t / (H * H));
  }
  return q0 * sum;
}

function runConsolidationLoop() {
  if (!consolidationState.running) return;

  consolidationState.time += consolidationState.timeScale;
  renderConsolidation();

  consAnimFrame = requestAnimationFrame(runConsolidationLoop);
}

function renderConsolidation() {
  if (!consCtx) return;
  const w = consCanvas.width;
  const h = consCanvas.height;
  consCtx.clearRect(0, 0, w, h);

  const paddingLeft = 60;
  const paddingRight = 180;
  const paddingTop = 40;
  const paddingBottom = 40;
  
  const simW = w - paddingLeft - paddingRight;
  const simH = h - paddingTop - paddingBottom;

  const H = consolidationState.maxDepth;
  const q0 = consolidationState.load;
  const cv = consolidationState.cv;
  const t = consolidationState.time;
  const E = consolidationState.E;

  // Calculate Settlement S(t) = H * (q0 / E) * U(t)
  // Average degree of consolidation U(t) = 1 - sum( 8 / (2m+1)^2pi^2 * exp(...) )
  let sumU = 0;
  for (let m = 0; m < 20; m++) {
    const M = (2 * m + 1) * Math.PI / 2;
    sumU += (2 / (M*M)) * Math.exp(-M * M * cv * t / (H * H));
  }
  const U = 1 - 2 * sumU; // Average degree of consolidation (0 to 1)
  const maxSettlement = (q0 / (E * 1000)) * H; // meters (E is in MPa -> 1000 kPa)
  const currentSettlement = maxSettlement * U * 1000; // millimeters

  // Update DOM Monitors
  const monSettlement = document.getElementById('mon-settlement');
  const monPressure = document.getElementById('mon-pressure');
  if (monSettlement) monSettlement.textContent = currentSettlement.toFixed(1) + ' mm';
  
  // Calculate average pore pressure remaining
  let avgPorePressure = q0 * (1 - U);
  if (t === 0) avgPorePressure = q0;
  if (monPressure) monPressure.textContent = avgPorePressure.toFixed(1) + ' kPa';

  // Draw Soil Profile Visual (Left half of simulator viewport)
  const colW = simW * 0.45;
  const colX = paddingLeft;
  
  // Settlement deformation visual
  const maxVisualSettlement = 30; // max visual pixels
  const visualSettlement = (U > 0) ? (U * maxVisualSettlement) : 0;
  const colY = paddingTop + visualSettlement;
  const colH = simH - visualSettlement;

  // Draw foundation load arrow representation
  consCtx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  consCtx.fillRect(colX, paddingTop - 25, colW, 20);
  
  consCtx.strokeStyle = 'var(--text-secondary)';
  consCtx.lineWidth = 1.5;
  // Draw loading arrows
  for (let ax = colX + 10; ax <= colX + colW - 5; ax += colW / 5) {
    consCtx.beginPath();
    consCtx.moveTo(ax, paddingTop - 25);
    consCtx.lineTo(ax, colY - 2);
    consCtx.lineTo(ax - 4, colY - 6);
    consCtx.moveTo(ax, colY - 2);
    consCtx.lineTo(ax + 4, colY - 6);
    consCtx.stroke();
  }

  // Draw original surface reference line
  consCtx.setLineDash([4, 4]);
  consCtx.strokeStyle = 'rgba(255,255,255,0.3)';
  consCtx.beginPath();
  consCtx.moveTo(colX - 10, paddingTop);
  consCtx.lineTo(colX + colW + 10, paddingTop);
  consCtx.stroke();
  consCtx.setLineDash([]);

  // Draw Soil Column with pore pressure gradient coloration
  const divisions = 40;
  const dy = colH / divisions;
  for (let i = 0; i < divisions; i++) {
    const fraction = i / divisions;
    const depthZ = fraction * H;
    const pZ = getExcessPressure(depthZ, t, H, q0, cv);
    
    // Normalize pressure for color map (0 to q0)
    const pNorm = Math.min(1.0, Math.max(0.0, pZ / q0));
    
    // Interpolate color between porous skeleton (dark slate #1e293b) and high pore pressure (Electric Cyan #00d2d3)
    const r = Math.round(13 + pNorm * (0 - 13));
    const g = Math.round(18 + pNorm * (210 - 18));
    const b = Math.round(34 + pNorm * (211 - 34));
    const aVal = 0.35 + pNorm * 0.45;
    
    consCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${aVal})`;
    consCtx.fillRect(colX, colY + i * dy, colW, dy + 0.5);
  }

  // Draw Solid Grains overlying the pressure gradient to symbolize the skeleton
  consCtx.fillStyle = 'rgba(255,255,255,0.06)';
  const grainSize = 7;
  for (let gx = colX + 8; gx < colX + colW; gx += 16) {
    for (let gy = colY + 8; gy < colY + colH; gy += 16) {
      consCtx.beginPath();
      // add minor randomness to simulate sand particles
      const jitterX = Math.sin(gx + gy) * 3;
      const jitterY = Math.cos(gx * gy) * 3;
      consCtx.arc(gx + jitterX, gy + jitterY, grainSize, 0, Math.PI * 2);
      consCtx.fill();
    }
  }

  // Draw boundaries
  consCtx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  consCtx.lineWidth = 2;
  consCtx.beginPath();
  // Drained top (double line or wavy to represent water draining)
  consCtx.moveTo(colX, colY);
  consCtx.lineTo(colX + colW, colY);
  consCtx.stroke();
  
  // Impermeable bottom boundary (thick hatched line)
  const botY = colY + colH;
  consCtx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  consCtx.beginPath();
  consCtx.moveTo(colX, botY);
  consCtx.lineTo(colX + colW, botY);
  consCtx.stroke();
  
  consCtx.lineWidth = 1;
  consCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  for (let bx = colX; bx <= colX + colW; bx += 8) {
    consCtx.beginPath();
    consCtx.moveTo(bx, botY);
    consCtx.lineTo(bx - 5, botY + 5);
    consCtx.stroke();
  }

  // Draw labels
  consCtx.fillStyle = 'var(--text-secondary)';
  consCtx.font = '10px var(--font-mono)';
  consCtx.fillText('DRAINED TOP (z=0, u=0)', colX, colY - 5);
  consCtx.fillText('IMPERMEABLE BASE (du/dz=0)', colX, botY + 18);

  // 4. Draw Excess Pore Pressure Chart (Right half of simulator viewport)
  const chartX = colX + colW + 80;
  const chartW = w - paddingRight - chartX;
  
  // Draw chart grid lines
  consCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  consCtx.lineWidth = 1;
  for (let j = 0; j <= 4; j++) {
    const gridVal = q0 * (j / 4);
    const gridX = chartX + (j / 4) * chartW;
    consCtx.beginPath();
    consCtx.moveTo(gridX, colY);
    consCtx.lineTo(gridX, botY);
    consCtx.stroke();
    
    // Label X axis
    consCtx.fillStyle = 'var(--text-muted)';
    consCtx.fillText(gridVal.toFixed(0), gridX - 10, colY - 5);
  }
  consCtx.fillText('Excess Pressure u [kPa]', chartX + chartW/2 - 50, colY - 18);

  // Depth lines
  for (let dyAxis = 0; dyAxis <= 4; dyAxis++) {
    const gridY = colY + (dyAxis / 4) * colH;
    consCtx.beginPath();
    consCtx.moveTo(chartX, gridY);
    consCtx.lineTo(chartX + chartW, gridY);
    consCtx.stroke();

    // Label Y axis
    const dVal = H * (dyAxis / 4);
    consCtx.fillStyle = 'var(--text-muted)';
    consCtx.fillText(dVal.toFixed(1) + 'm', chartX - 35, gridY + 3);
  }

  // Draw u(z, t) pressure distribution curve
  consCtx.strokeStyle = 'var(--color-hydro)';
  consCtx.lineWidth = 2.5;
  consCtx.shadowBlur = 6;
  consCtx.shadowColor = 'var(--color-hydro-glow)';
  consCtx.beginPath();
  
  for (let py = 0; py <= colH; py += 2) {
    const depthZ = (py / colH) * H;
    const pZ = getExcessPressure(depthZ, t, H, q0, cv);
    const plotX = chartX + (pZ / q0) * chartW;
    
    if (py === 0) consCtx.moveTo(plotX, colY + py);
    else consCtx.lineTo(plotX, colY + py);
  }
  consCtx.stroke();
  consCtx.shadowBlur = 0; // reset

  // Initial curve overlay (dashed) for comparison
  consCtx.setLineDash([3, 3]);
  consCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  consCtx.lineWidth = 1;
  consCtx.beginPath();
  consCtx.moveTo(chartX + chartW, colY);
  consCtx.lineTo(chartX + chartW, botY);
  consCtx.stroke();
  consCtx.setLineDash([]);
}

/* =========================================================================
   6. LAB 2: THERMAL PRESSURIZATION SIMULATOR (TH)
   ========================================================================= */
let thermalSimState = {
  running: false,
  time: 0,
  heatRate: 5.0,     // deg C/s
  alpha_f: 3e-4,    // Vol thermal expansion 1/C
  k: 1e-4,          // Permeability / conductivity factor
  L: 10,            // Length of rock core
  cv: 0.03,         // hydraulic diffusivity
  kappa: 0.08,      // thermal diffusivity
  T_initial: 20,    // ambient deg C
  p_initial: 0,     // ambient excess press
  stepsPerFrame: 20,
  dt: 0.01          // numerical time step
};

// 1D grid for Finite Difference solver
const N_grid = 41; // grid nodes
let grid_T = new Float32Array(N_grid);
let grid_P = new Float32Array(N_grid);

let thermCanvas, therCtx;
let thermAnimFrame;

function initThermalPressurizationSim() {
  thermCanvas = document.getElementById('thermal-canvas');
  if (!thermCanvas) return;
  therCtx = thermCanvas.getContext('2d');

  resizeThermalPressurization();
  window.addEventListener('resize', () => {
    if (document.getElementById('lab-thermal').classList.contains('active')) {
      resizeThermalPressurization();
    }
  });

  // UI inputs
  const sliderH = document.getElementById('therm-heat');
  const sliderExp = document.getElementById('therm-exp');
  const sliderK = document.getElementById('therm-k');
  const valH = document.getElementById('therm-heat-val');
  const valExp = document.getElementById('therm-exp-val');
  const valK = document.getElementById('therm-k-val');

  const btnPlay = document.getElementById('therm-play');
  const btnReset = document.getElementById('therm-reset');
  const indicator = document.getElementById('therm-indicator');

  function updateParameters() {
    thermalSimState.heatRate = parseFloat(sliderH.value);
    valH.textContent = '+' + thermalSimState.heatRate.toFixed(1) + ' °C/s';

    thermalSimState.alpha_f = parseFloat(sliderExp.value) * 1e-4;
    valExp.textContent = (parseFloat(sliderExp.value) * 10).toFixed(0) + 'e-5 /K';

    const kRaw = parseFloat(sliderK.value);
    thermalSimState.k = kRaw;
    thermalSimState.cv = kRaw * 10; // pressure diffusivity proportional to permeability
    valK.textContent = kRaw.toFixed(5);
  }

  sliderH.addEventListener('input', updateParameters);
  sliderExp.addEventListener('input', updateParameters);
  sliderK.addEventListener('input', updateParameters);

  updateParameters();
  resetThermalSolver();

  btnPlay.addEventListener('click', () => {
    thermalSimState.running = !thermalSimState.running;
    if (thermalSimState.running) {
      btnPlay.innerHTML = '<svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> Pause';
      indicator.classList.add('running');
      runThermalLoop();
    } else {
      btnPlay.innerHTML = '<svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Run';
      indicator.classList.remove('running');
      cancelAnimationFrame(thermAnimFrame);
    }
  });

  btnReset.addEventListener('click', () => {
    resetThermalSolver();
    renderThermalPressurization();
  });

  renderThermalPressurization();
}

function resetThermalSolver() {
  thermalSimState.time = 0;
  for (let i = 0; i < N_grid; i++) {
    grid_T[i] = thermalSimState.T_initial;
    grid_P[i] = thermalSimState.p_initial;
  }
  
  const monMaxP = document.getElementById('mon-max-p');
  const monTemp = document.getElementById('mon-temp');
  if (monMaxP) monMaxP.textContent = '0.0 kPa';
  if (monTemp) monTemp.textContent = thermalSimState.T_initial.toFixed(1) + ' °C';
}

function resizeThermalPressurization() {
  if (!thermCanvas) return;
  thermCanvas.width = thermCanvas.parentElement.clientWidth;
  thermCanvas.height = thermCanvas.parentElement.clientHeight - 40;
  renderThermalPressurization();
}

function solveTHStep() {
  const N = N_grid;
  const dx = thermalSimState.L / (N - 1);
  const dt = thermalSimState.dt;
  const cv = thermalSimState.cv;
  const kappa = thermalSimState.kappa;

  // Differential thermal expansion coefficient effect: 
  // Lambda = (alpha_fluid - alpha_solid) * solid_modulus / porosity (scaled conceptually here)
  const lambda = thermalSimState.alpha_f * 50000; // scaling pressure spike coefficient

  let next_T = new Float32Array(N);
  let next_P = new Float32Array(N);

  // Heat Source localized at the center of the core (node 20)
  const sourceNode = Math.floor(N / 2);

  // 1. Solve Heat equation: dT/dt = kappa * d2T/dx2
  // Boundaries: T(0) = T_initial, T(L) = T_initial
  next_T[0] = thermalSimState.T_initial;
  next_T[N-1] = thermalSimState.T_initial;
  
  for (let i = 1; i < N - 1; i++) {
    let conduction = kappa * (grid_T[i+1] - 2*grid_T[i] + grid_T[i-1]) / (dx*dx);
    let generation = (i === sourceNode) ? thermalSimState.heatRate : 0;
    next_T[i] = grid_T[i] + dt * (conduction + generation);
  }

  // 2. Solve pore pressure: dP/dt = cv * d2P/dx2 + Lambda * dT/dt
  // Boundaries: drained at ends P(0) = 0, P(L) = 0
  next_P[0] = 0;
  next_P[N-1] = 0;

  for (let i = 1; i < N - 1; i++) {
    let flow = cv * (grid_P[i+1] - 2*grid_P[i] + grid_P[i-1]) / (dx*dx);
    let dtTemp = (next_T[i] - grid_T[i]) / dt;
    let coupling = lambda * dtTemp;
    next_P[i] = grid_P[i] + dt * (flow + coupling);
    
    // Prevent negative pressure anomalies
    if (next_P[i] < 0) next_P[i] = 0;
  }

  // Update grids
  grid_T.set(next_T);
  grid_P.set(next_P);
}

function runThermalLoop() {
  if (!thermalSimState.running) return;

  // Run sub-steps per frame to ensure numerical stability and speed
  for (let s = 0; s < thermalSimState.stepsPerFrame; s++) {
    solveTHStep();
    thermalSimState.time += thermalSimState.dt;
  }

  renderThermalPressurization();
  thermAnimFrame = requestAnimationFrame(runThermalLoop);
}

function renderThermalPressurization() {
  if (!therCtx) return;
  const w = thermCanvas.width;
  const h = thermCanvas.height;
  therCtx.clearRect(0, 0, w, h);

  const paddingLeft = 60;
  const paddingRight = 60;
  const paddingTop = 50;
  const paddingBottom = 40;

  const simW = w - paddingLeft - paddingRight;
  const simH = h - paddingTop - paddingBottom;

  // Find max pressure and temperature in grid
  let maxP = 0;
  let maxT = thermalSimState.T_initial;
  for (let i = 0; i < N_grid; i++) {
    if (grid_P[i] > maxP) maxP = grid_P[i];
    if (grid_T[i] > maxT) maxT = grid_T[i];
  }

  // Update HTML monitors
  const monMaxP = document.getElementById('mon-max-p');
  const monTemp = document.getElementById('mon-temp');
  if (monMaxP) monMaxP.textContent = maxP.toFixed(1) + ' kPa';
  if (monTemp) monTemp.textContent = maxT.toFixed(1) + ' °C';

  // Draw 1D Rock Core schematic at the top
  const coreH = 50;
  const coreY = paddingTop;
  
  therCtx.strokeStyle = 'rgba(255,255,255,0.15)';
  therCtx.fillStyle = '#111827';
  therCtx.lineWidth = 2;
  therCtx.fillRect(paddingLeft, coreY, simW, coreH);
  therCtx.strokeRect(paddingLeft, coreY, simW, coreH);

  // Render heat distribution in the rock core
  const blockW = simW / (N_grid - 1);
  for (let i = 0; i < N_grid - 1; i++) {
    const tAvg = (grid_T[i] + grid_T[i+1]) / 2;
    // Normalize temperature for color (T_initial to 150)
    const tNorm = Math.min(1.0, (tAvg - thermalSimState.T_initial) / 100);
    
    // Draw red heating glow overlay
    therCtx.fillStyle = `rgba(255, 82, 82, ${tNorm * 0.85})`;
    therCtx.fillRect(paddingLeft + i * blockW, coreY + 1, blockW + 0.5, coreH - 2);

    // Draw little water droplet symbols representing pore pressure level
    const pAvg = (grid_P[i] + grid_P[i+1]) / 2;
    const pNorm = Math.min(1.0, pAvg / 1500); // 1500 kPa peak
    if (pNorm > 0.05 && i % 4 === 0) {
      therCtx.fillStyle = `rgba(0, 210, 211, ${pNorm})`;
      therCtx.beginPath();
      therCtx.arc(paddingLeft + i * blockW + blockW/2, coreY + coreH/2, 2 + pNorm*4, 0, Math.PI*2);
      therCtx.fill();
    }
  }

  // Heat source marker
  const centerX = paddingLeft + simW / 2;
  therCtx.strokeStyle = 'var(--color-thermal)';
  therCtx.beginPath();
  therCtx.arc(centerX, coreY + coreH/2, 12, 0, Math.PI*2);
  therCtx.stroke();
  therCtx.fillStyle = 'var(--color-thermal)';
  therCtx.font = '9px var(--font-mono)';
  therCtx.fillText('HEAT SOURCE', centerX - 27, coreY - 6);

  // Draw two charts below the core: Temp on top, Pressure on bottom
  const chartH = (simH - coreH - 40) / 2;
  
  // Chart 1: Temperature (Orange/Red)
  const chart1Y = coreY + coreH + 30;
  
  // Chart 2: Pressure (Cyan)
  const chart2Y = chart1Y + chartH + 30;

  // Draw Grid Lines & Axes for Temperature
  therCtx.strokeStyle = 'rgba(255,255,255,0.06)';
  therCtx.lineWidth = 1;
  const tempScaleMax = 120; // deg C
  for (let j = 0; j <= 4; j++) {
    const tempVal = thermalSimState.T_initial + (tempScaleMax - thermalSimState.T_initial) * (j / 4);
    const lineY = chart1Y + chartH - (j / 4) * chartH;
    therCtx.beginPath();
    therCtx.moveTo(paddingLeft, lineY);
    therCtx.lineTo(paddingLeft + simW, lineY);
    therCtx.stroke();
    therCtx.fillStyle = 'var(--text-muted)';
    therCtx.font = '9px var(--font-mono)';
    therCtx.fillText(tempVal.toFixed(0) + '°C', paddingLeft - 38, lineY + 3);
  }
  therCtx.fillStyle = 'var(--text-secondary)';
  therCtx.fillText('TEMPERATURE DISTRIBUTION T(x)', paddingLeft, chart1Y - 8);

  // Plot Temperature curve
  therCtx.strokeStyle = 'var(--color-thermal)';
  therCtx.lineWidth = 2;
  therCtx.beginPath();
  for (let i = 0; i < N_grid; i++) {
    const xVal = paddingLeft + i * blockW;
    const tVal = grid_T[i];
    const yVal = chart1Y + chartH - ((tVal - thermalSimState.T_initial) / (tempScaleMax - thermalSimState.T_initial)) * chartH;
    if (i === 0) therCtx.moveTo(xVal, yVal);
    else therCtx.lineTo(xVal, yVal);
  }
  therCtx.stroke();

  // Draw Grid Lines & Axes for Pressure
  const pressScaleMax = 1000; // kPa
  for (let j = 0; j <= 4; j++) {
    const pressVal = pressScaleMax * (j / 4);
    const lineY = chart2Y + chartH - (j / 4) * chartH;
    therCtx.beginPath();
    therCtx.moveTo(paddingLeft, lineY);
    therCtx.lineTo(paddingLeft + simW, lineY);
    therCtx.stroke();
    therCtx.fillStyle = 'var(--text-muted)';
    therCtx.fillText(pressVal.toFixed(0) + ' kPa', paddingLeft - 50, lineY + 3);
  }
  therCtx.fillStyle = 'var(--text-secondary)';
  therCtx.fillText('EXCESS PORE WATER PRESSURE P(x)', paddingLeft, chart2Y - 8);

  // Plot Pressure curve
  therCtx.strokeStyle = 'var(--color-hydro)';
  therCtx.lineWidth = 2;
  therCtx.beginPath();
  for (let i = 0; i < N_grid; i++) {
    const xVal = paddingLeft + i * blockW;
    const pVal = grid_P[i];
    const yVal = chart2Y + chartH - (pVal / pressScaleMax) * chartH;
    if (i === 0) therCtx.moveTo(xVal, yVal);
    else therCtx.lineTo(xVal, yVal);
  }
  therCtx.stroke();
}

/* =========================================================================
   7. LAB 3: THERMAL STRESS & Mohr-Coulomb FRACTURING (TM)
   ========================================================================= */
let stressSimState = {
  sigma3: 20,       // MPa lateral confining pressure
  sigma1: 50,       // MPa vertical total pressure
  dT: 0,            // temp change deg C
  u: 0,             // excess pore pressure MPa
  frictionAngle: 30, // degrees
  cohesion: 8.0,    // MPa
  alpha_s: 1.2e-5,  // 1/K thermal expansion
  E: 20000,         // Youngs Modulus (20 GPa = 20000 MPa)
  nu: 0.25,         // Poissons ratio
  constraint: 'uniaxial' // uniaxial, bi-axial, tri-axial
};

let stressCanvas, stressCtx;

function initThermalStressSim() {
  stressCanvas = document.getElementById('stress-canvas');
  if (!stressCanvas) return;
  stressCtx = stressCanvas.getContext('2d');

  resizeThermalStress();
  window.addEventListener('resize', () => {
    if (document.getElementById('lab-stress').classList.contains('active')) {
      resizeThermalStress();
    }
  });

  // Sliders and controls
  const sliderS3 = document.getElementById('stress-s3');
  const sliderDt = document.getElementById('stress-dt');
  const sliderU = document.getElementById('stress-u');
  const selectConstraint = document.getElementById('stress-constraint');

  const valS3 = document.getElementById('stress-s3-val');
  const valDt = document.getElementById('stress-dt-val');
  const valU = document.getElementById('stress-u-val');

  const monitorSigma1Eff = document.getElementById('mon-s1-eff');
  const monitorSigma3Eff = document.getElementById('mon-s3-eff');

  function updateParameters() {
    stressSimState.sigma3 = parseFloat(sliderS3.value);
    valS3.textContent = stressSimState.sigma3.toFixed(0) + ' MPa';

    // Keep sigma1 higher than sigma3 to maintain differential stress
    stressSimState.sigma1 = stressSimState.sigma3 + 25; // fixed differential for demo simplicity

    stressSimState.dT = parseFloat(sliderDt.value);
    valDt.textContent = '+' + stressSimState.dT.toFixed(0) + ' °C';

    stressSimState.u = parseFloat(sliderU.value);
    valU.textContent = stressSimState.u.toFixed(1) + ' MPa';

    stressSimState.constraint = selectConstraint.value;

    renderThermalStress();
  }

  sliderS3.addEventListener('input', updateParameters);
  sliderDt.addEventListener('input', updateParameters);
  sliderU.addEventListener('input', updateParameters);
  selectConstraint.addEventListener('change', updateParameters);

  updateParameters();
}

function resizeThermalStress() {
  if (!stressCanvas) return;
  stressCanvas.width = stressCanvas.parentElement.clientWidth;
  stressCanvas.height = stressCanvas.parentElement.clientHeight - 40;
  renderThermalStress();
}

function renderThermalStress() {
  if (!stressCtx) return;
  const w = stressCanvas.width;
  const h = stressCanvas.height;
  stressCtx.clearRect(0, 0, w, h);

  const paddingLeft = 50;
  const paddingRight = 50;
  const paddingTop = 50;
  const paddingBottom = 50;

  const simW = w - paddingLeft - paddingRight;
  const simH = h - paddingTop - paddingBottom;

  // 1. Calculate thermal stresses generated
  // If constrained: Delta_sigma_T = E * alpha * dT / (1 - 2*nu) [triaxial]
  // or uniaxial: Delta_sigma_T = E * alpha * dT
  const E = stressSimState.E;
  const alpha = stressSimState.alpha_s;
  const nu = stressSimState.nu;
  const dT = stressSimState.dT;
  const u = stressSimState.u;

  let deltaSigmaT = 0;
  if (stressSimState.constraint === 'triaxial') {
    deltaSigmaT = (E * alpha * dT) / (1 - 2 * nu);
  } else if (stressSimState.constraint === 'biaxial') {
    deltaSigmaT = (E * alpha * dT) / (1 - nu);
  } else if (stressSimState.constraint === 'uniaxial') {
    // Only vertical direction expands and builds stress if vertically constrained
    deltaSigmaT = E * alpha * dT;
  }

  // Calculate final total stresses
  // Thermal stress is compressive (adds to stress)
  const totalS1 = stressSimState.sigma1 + deltaSigmaT;
  // Confining stress sigma3 might build stress too, depending on constraint
  let totalS3 = stressSimState.sigma3;
  if (stressSimState.constraint === 'triaxial') {
    totalS3 += deltaSigmaT;
  } else if (stressSimState.constraint === 'biaxial') {
    totalS3 += deltaSigmaT * 0.5; // partial lateral constraint
  }

  // Calculate Effective stresses: sigma\' = sigma - u
  const effS1 = Math.max(0, totalS1 - u);
  const effS3 = Math.max(0, totalS3 - u);

  // Update monitors
  const monS1Eff = document.getElementById('mon-s1-eff');
  const monS3Eff = document.getElementById('mon-s3-eff');
  if (monS1Eff) monS1Eff.textContent = effS1.toFixed(1) + ' MPa';
  if (monS3Eff) monS3Eff.textContent = effS3.toFixed(1) + ' MPa';

  // 2. Draw rock block schematic (Left side)
  const blockW = simW * 0.35;
  const blockH = simH * 0.6;
  const blockX = paddingLeft + 15;
  const blockY = paddingTop + (simH - blockH) / 2;

  // Temperature glow on the block
  const tNorm = Math.min(1.0, dT / 200);
  stressCtx.fillStyle = '#1c2541';
  stressCtx.fillRect(blockX, blockY, blockW, blockH);
  
  // Draw thermal glow overlay
  stressCtx.fillStyle = `rgba(255, 82, 82, ${tNorm * 0.4})`;
  stressCtx.fillRect(blockX, blockY, blockW, blockH);

  // Draw fluid droplets representing pore pressure
  const uCount = Math.floor(u * 2.5);
  stressCtx.fillStyle = 'rgba(0, 210, 211, 0.7)';
  for (let i = 0; i < uCount; i++) {
    const dx = blockX + 15 + Math.sin(i * 45) * (blockW - 30) * 0.5 + (blockW - 30)*0.5;
    const dy = blockY + 15 + Math.cos(i * 123) * (blockH - 30) * 0.5 + (blockH - 30)*0.5;
    stressCtx.beginPath();
    stressCtx.arc(dx, dy, 2.5, 0, Math.PI * 2);
    stressCtx.fill();
  }

  // Draw confining stress arrows (sigma3) - horizontal
  stressCtx.strokeStyle = 'var(--color-mech)';
  stressCtx.lineWidth = 2;
  const arrowSize = 8;
  
  function drawArrow(x1, y1, x2, y2) {
    stressCtx.beginPath();
    stressCtx.moveTo(x1, y1);
    stressCtx.lineTo(x2, y2);
    const angle = Math.atan2(y2 - y1, x2 - x1);
    stressCtx.lineTo(x2 - arrowSize * Math.cos(angle - Math.PI/6), y2 - arrowSize * Math.sin(angle - Math.PI/6));
    stressCtx.moveTo(x2, y2);
    stressCtx.lineTo(x2 - arrowSize * Math.cos(angle + Math.PI/6), y2 - arrowSize * Math.sin(angle + Math.PI/6));
    stressCtx.stroke();
  }

  // Confining arrows (sides pushing in)
  const arrowSpacing = blockH / 4;
  for (let y = blockY + arrowSpacing/2; y < blockY + blockH; y += arrowSpacing) {
    drawArrow(blockX - 25, y, blockX - 2, y); // Left pushing right
    drawArrow(blockX + blockW + 25, y, blockX + blockW + 2, y); // Right pushing left
  }
  
  // Vertical stress arrows (sigma1) - top/bottom
  const vertSpacing = blockW / 3;
  for (let x = blockX + vertSpacing/2; x < blockX + blockW; x += vertSpacing) {
    drawArrow(x, blockY - 25, x, blockY - 2); // Top pushing down
    drawArrow(x, blockY + blockH + 25, x, blockY + blockH + 2); // Bottom pushing up
  }

  // Labels for stresses
  stressCtx.fillStyle = 'var(--text-secondary)';
  stressCtx.font = '10px var(--font-header)';
  stressCtx.fillText(`σ₁ = ${totalS1.toFixed(0)} MPa`, blockX + blockW/2 - 30, blockY - 32);
  stressCtx.fillText(`σ₃ = ${totalS3.toFixed(0)} MPa`, blockX + blockW + 10, blockY + blockH/2);

  // 3. Draw Mohr-Coulomb diagram (Right side)
  const chartX = blockX + blockW + 80;
  const chartW = w - paddingRight - chartX;
  const chartH = simH * 0.85;
  const chartY = paddingTop + (simH - chartH) / 2;

  // Origin of Mohr diagram (bottom-left)
  const originX = chartX;
  const originY = chartY + chartH - 20;
  const axisW = chartW;
  const axisH = chartH - 40;

  // Draw Axes
  stressCtx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  stressCtx.lineWidth = 1.5;
  stressCtx.beginPath();
  stressCtx.moveTo(originX - 10, originY); // Normal stress axis
  stressCtx.lineTo(originX + axisW, originY);
  stressCtx.moveTo(originX, originY + 10); // Shear stress axis
  stressCtx.lineTo(originX, originY - axisH);
  stressCtx.stroke();

  stressCtx.fillStyle = 'var(--text-secondary)';
  stressCtx.font = '10px var(--font-header)';
  stressCtx.fillText('Normal stress σ\' (MPa)', originX + axisW - 100, originY + 15);
  stressCtx.fillText('Shear stress τ (MPa)', originX + 5, originY - axisH - 5);

  // Calibration scale
  const scaleMaxSigma = 110; // Max stress displayed in graph
  const xMultiplier = axisW / scaleMaxSigma;
  const yMultiplier = axisH / (scaleMaxSigma * 0.6); // Aspect ratio scaling

  // Draw tick marks
  stressCtx.strokeStyle = 'rgba(255,255,255,0.08)';
  for (let sVal = 20; sVal <= scaleMaxSigma; sVal += 20) {
    const tickX = originX + sVal * xMultiplier;
    stressCtx.beginPath();
    stressCtx.moveTo(tickX, originY);
    stressCtx.lineTo(tickX, originY - axisH);
    stressCtx.stroke();
    stressCtx.fillStyle = 'var(--text-muted)';
    stressCtx.fillText(sVal.toString(), tickX - 8, originY + 15);
  }

  // Draw Mohr-Coulomb Failure Envelope: tau = cohesion + sigma_eff * tan(phi)
  const phiRad = (stressSimState.frictionAngle * Math.PI) / 180;
  const cohesion = stressSimState.cohesion;
  const envX1 = 0;
  const envY1 = cohesion;
  const envX2 = scaleMaxSigma;
  const envY2 = cohesion + envX2 * Math.tan(phiRad);

  const envPlotY1 = originY - envY1 * yMultiplier;
  const envPlotY2 = originY - envY2 * yMultiplier;
  const envPlotX2 = originX + envX2 * xMultiplier;

  stressCtx.strokeStyle = '#ff7675';
  stressCtx.lineWidth = 2.5;
  stressCtx.beginPath();
  stressCtx.moveTo(originX, envPlotY1);
  stressCtx.lineTo(envPlotX2, envPlotY2);
  stressCtx.stroke();
  
  stressCtx.fillStyle = '#ff7675';
  stressCtx.font = 'italic 10px var(--font-header)';
  stressCtx.fillText('Failure Envelope (Mohr-Coulomb)', originX + axisW * 0.4, envPlotY2 + (envPlotY1 - envPlotY2)*0.4 - 8);

  // Draw Mohr's Circle based on current effective stresses
  const centerEff = (effS1 + effS3) / 2;
  const radiusEff = (effS1 - effS3) / 2;

  const circleCenterX = originX + centerEff * xMultiplier;
  const circleRadiusX = radiusEff * xMultiplier;
  const circleRadiusY = radiusEff * yMultiplier;

  // Check if failure occurred: distance from circle center to failure envelope
  // Perpendicular distance from (centerEff, 0) to line: sigma*tan(phi) - tau + cohesion = 0
  // dist = |centerEff * sin(phi) + cohesion * cos(phi)|
  // Actually, circle touches envelope if: Center*sin(phi) + Cohesion*cos(phi) <= Radius
  const sinPhi = Math.sin(phiRad);
  const cosPhi = Math.cos(phiRad);
  const criticalRadius = centerEff * sinPhi + cohesion * cosPhi;
  const failureRatio = radiusEff / criticalRadius;

  const isFailed = failureRatio >= 1.0;

  // Draw Mohr's circle (as ellipse due to different X and Y multipliers)
  stressCtx.beginPath();
  stressCtx.ellipse(circleCenterX, originY, circleRadiusX, circleRadiusY, 0, 0, Math.PI, true);
  
  if (isFailed) {
    stressCtx.strokeStyle = '#e74c3c';
    stressCtx.fillStyle = 'rgba(231, 76, 60, 0.2)';
    stressCtx.lineWidth = 3;
  } else {
    stressCtx.strokeStyle = 'var(--color-mech)';
    stressCtx.fillStyle = 'rgba(162, 155, 254, 0.1)';
    stressCtx.lineWidth = 2;
  }
  
  stressCtx.fill();
  stressCtx.stroke();

  // Draw indicators inside Circle
  stressCtx.fillStyle = '#fff';
  stressCtx.beginPath();
  stressCtx.arc(originX + effS3 * xMultiplier, originY, 4, 0, Math.PI*2); // σ'₃
  stressCtx.arc(originX + effS1 * xMultiplier, originY, 4, 0, Math.PI*2); // σ'₁
  stressCtx.fill();

  stressCtx.fillStyle = 'var(--text-secondary)';
  stressCtx.fillText("σ'₃", originX + effS3 * xMultiplier - 15, originY - 8);
  stressCtx.fillText("σ'₁", originX + effS1 * xMultiplier + 5, originY - 8);

  // If failed, draw fracture lines on the block and alert text
  if (isFailed) {
    // Fractures on block
    stressCtx.strokeStyle = '#e74c3c';
    stressCtx.lineWidth = 3;
    stressCtx.shadowBlur = 8;
    stressCtx.shadowColor = '#e74c3c';
    
    // Conjugate shear fracture lines
    stressCtx.beginPath();
    stressCtx.moveTo(blockX + blockW * 0.1, blockY + blockH * 0.25);
    stressCtx.lineTo(blockX + blockW * 0.9, blockY + blockH * 0.75);
    
    stressCtx.moveTo(blockX + blockW * 0.9, blockY + blockH * 0.25);
    stressCtx.lineTo(blockX + blockW * 0.1, blockY + blockH * 0.75);
    stressCtx.stroke();
    stressCtx.shadowBlur = 0; // reset

    // Warning Banner in chart
    stressCtx.fillStyle = 'rgba(231, 76, 60, 0.8)';
    stressCtx.fillRect(chartX + 15, chartY + 15, 140, 24);
    stressCtx.fillStyle = '#fff';
    stressCtx.font = 'bold 9px var(--font-header)';
    stressCtx.fillText('⚠️ SHEAR FAILURE TRIGGERED', chartX + 22, chartY + 30);
  }
}

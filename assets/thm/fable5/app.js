/* ============================================================
   THM·Lab — interactive simulations
   All demos run only while visible (IntersectionObserver-gated
   requestAnimationFrame loops) to keep the page light.
   ============================================================ */
'use strict';

const $ = (id) => document.getElementById(id);
const resizers = [];
window.addEventListener('resize', () => resizers.forEach((f) => f()));

/* ---------- canvas helpers ---------- */
function fitCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const r = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.round(r.width * dpr));
  canvas.height = Math.max(1, Math.round(r.height * dpr));
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, W: r.width, H: r.height };
}

function runWhenVisible(el, tick) {
  let raf = null, last = 0;
  const loop = (t) => {
    const dt = Math.min(0.05, (t - last) / 1000) || 0.016;
    last = t;
    tick(dt, t);
    raf = requestAnimationFrame(loop);
  };
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting && raf === null) {
      last = performance.now();
      raf = requestAnimationFrame(loop);
    } else if (!e.isIntersecting && raf !== null) {
      cancelAnimationFrame(raf);
      raf = null;
    }
  }, { threshold: 0.02 });
  io.observe(el);
}

/* ---------- formatting ---------- */
function sci(x) {
  if (x === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(x)));
  if (e >= -2 && e <= 2) return parseFloat(x.toPrecision(3)).toString();
  let m = x / Math.pow(10, e);
  let ms = m.toFixed(1);
  if (ms === '10.0') { ms = '1.0'; }
  return `${ms}×10<sup>${e}</sup>`;
}

function fmtTime(s) {
  if (!isFinite(s) || s <= 0) return '∞ (no flow)';
  const yr = 3.156e7;
  if (s < 90) return s.toFixed(s < 10 ? 1 : 0) + ' s';
  if (s < 5400) return (s / 60).toFixed(0) + ' min';
  if (s < 172800) return (s / 3600).toFixed(1) + ' h';
  if (s < 2 * yr) return (s / 86400).toFixed(0) + ' days';
  return Math.round(s / yr).toLocaleString('en-US') + ' years';
}

/* ---------- temperature colormap (cold blue → hot yellow) ---------- */
const HEAT_STOPS = ['#1b2f6e', '#7a2f8f', '#d23a4f', '#f57c1f', '#ffd84d'].map((hex) => [
  parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16),
]);
function tempColor(t) {
  t = Math.max(0, Math.min(1, t));
  const x = t * (HEAT_STOPS.length - 1);
  const i = Math.min(HEAT_STOPS.length - 2, Math.floor(x));
  const f = x - i;
  const a = HEAT_STOPS[i], b = HEAT_STOPS[i + 1];
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * f)},${Math.round(a[1] + (b[1] - a[1]) * f)},${Math.round(a[2] + (b[2] - a[2]) * f)})`;
}

const FONT = '11.5px Inter, system-ui, sans-serif';
const GRID = 'rgba(255,255,255,0.10)';
const AXIS = 'rgba(255,255,255,0.28)';
const LABEL = '#8b99b0';

/* ============================================================
   Hero — particle flow through a pore network (potential flow
   past circular grains, superposed dipoles).
   ============================================================ */
function initHero() {
  const canvas = $('hero-canvas');
  if (!canvas) return;
  let view = fitCanvas(canvas);
  let grains = [], parts = [];

  function inside(x, y) {
    return grains.some((g) => (x - g.x) ** 2 + (y - g.y) ** 2 < g.r * g.r * 1.02);
  }
  function spawn(anywhere) {
    for (let k = 0; k < 40; k++) {
      const p = { x: anywhere ? Math.random() * view.W : -Math.random() * 30, y: Math.random() * view.H };
      if (!inside(p.x, p.y)) return p;
    }
    return { x: -5, y: Math.random() * view.H };
  }
  function regen() {
    view = fitCanvas(canvas);
    grains = [];
    const target = Math.round((view.W * view.H) / 30000);
    let tries = 0;
    while (grains.length < target && tries < 6000) {
      tries++;
      const r = 24 + Math.random() * 44;
      const x = Math.random() * (view.W + 240) - 120;
      const y = Math.random() * view.H;
      if (grains.every((g) => (g.x - x) ** 2 + (g.y - y) ** 2 > (g.r + r + 26) ** 2)) grains.push({ x, y, r });
    }
    parts = Array.from({ length: Math.min(420, Math.round((view.W * view.H) / 2600)) }, () => spawn(true));
    view.ctx.fillStyle = '#0a0f1f';
    view.ctx.fillRect(0, 0, view.W, view.H);
  }
  function vel(x, y) {
    let u = 1, v = 0;
    for (const g of grains) {
      const dx = x - g.x, dy = y - g.y;
      const r2 = dx * dx + dy * dy, a2 = g.r * g.r;
      if (r2 < a2 * 1.04) return null;
      const r4 = r2 * r2;
      u -= (a2 * (dx * dx - dy * dy)) / r4;
      v -= (2 * a2 * dx * dy) / r4;
    }
    return [u, v];
  }

  regen();
  resizers.push(regen);

  runWhenVisible(canvas, () => {
    const { ctx, W, H } = view;
    ctx.fillStyle = 'rgba(10,15,31,0.08)';
    ctx.fillRect(0, 0, W, H);
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = 'rgba(96,205,255,0.45)';
    ctx.beginPath();
    for (const p of parts) {
      const s = vel(p.x, p.y);
      if (!s) { Object.assign(p, spawn(false)); continue; }
      const nx = p.x + s[0] * 1.7, ny = p.y + s[1] * 1.7;
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(nx, ny);
      p.x = nx; p.y = ny;
      if (p.x > W + 10 || p.y < -12 || p.y > H + 12) Object.assign(p, spawn(false));
    }
    ctx.stroke();
    for (const g of grains) {
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.r, 0, 7);
      ctx.fillStyle = '#101a31';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.stroke();
    }
  });
}

/* ============================================================
   Porosity playground — hex grain pack + Kozeny-Carman
   ============================================================ */
function initPoro() {
  const canvas = $('poro-canvas');
  if (!canvas) return;
  let view = fitCanvas(canvas);
  const slider = $('poro-f');

  function draw() {
    const { ctx, W, H } = view;
    const f = +slider.value / 100;
    ctx.fillStyle = '#0e1c38';                 // pore water
    ctx.fillRect(0, 0, W, H);
    const s = 46, r = (f * s) / 2, dy = s * 0.866;
    ctx.fillStyle = '#a98e62';
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    let row = 0;
    for (let y = 8; y < H + s; y += dy, row++) {
      const off = row % 2 ? s / 2 : 0;
      for (let x = -s; x < W + s; x += s) {
        ctx.beginPath();
        ctx.arc(x + off, y, r, 0, 7);
        ctx.fill();
        ctx.stroke();
      }
    }
    const n = 1 - 0.9069 * f * f;
    const kr = (Math.pow(n, 3) / Math.pow(1 - n, 2)) / 0.1778;  // k0 at n = 0.4
    $('poro-n').textContent = (n * 100).toFixed(1) + ' %';
    $('poro-k').textContent = '× ' + (kr >= 10 ? kr.toFixed(0) : kr >= 0.1 ? kr.toFixed(2) : kr.toFixed(3));
    $('poro-bar-solid').style.width = ((1 - n) * 100).toFixed(1) + '%';
  }

  slider.addEventListener('input', draw);
  resizers.push(() => { view = fitCanvas(canvas); draw(); });
  draw();
}

/* ============================================================
   Heat — 1-D conduction + advection, explicit FD upwind
   ============================================================ */
function initHeat() {
  const canvas = $('heat-canvas');
  if (!canvas) return;
  let view = fitCanvas(canvas);
  resizers.push(() => { view = fitCanvas(canvas); });

  const N = 200, dx = 1 / (N - 1), dx2 = dx * dx;
  let A = new Float64Array(N), B = new Float64Array(N), time = 0;
  const sA = $('heat-alpha'), sV = $('heat-vel');
  $('heat-reset').addEventListener('click', () => { A.fill(0); time = 0; });

  function step(a, v, dt) {
    for (let i = 1; i < N - 1; i++) {
      B[i] = A[i] + dt * ((a * (A[i + 1] - 2 * A[i] + A[i - 1])) / dx2 - (v * (A[i] - A[i - 1])) / dx);
    }
    B[0] = 1;
    B[N - 1] = B[N - 2];
    [A, B] = [B, A];
  }

  runWhenVisible(canvas, () => {
    const a = +sA.value, v = +sV.value;
    let dt = (0.35 * dx2) / a;
    if (v > 0) dt = Math.min(dt, (0.6 * dx) / v);
    const nsub = Math.max(1, Math.min(900, Math.round(0.0015 / dt)));
    for (let k = 0; k < nsub; k++) { step(a, v, dt); time += dt; }

    const Pe = v / a;
    $('heat-pe').textContent = Pe.toFixed(1);
    $('heat-regime').textContent = Pe < 1 ? 'conduction-dominated' : Pe < 10 ? 'mixed transport' : 'advection-dominated';
    $('heat-time').textContent = time.toFixed(2);

    // ---- draw ----
    const { ctx, W, H } = view;
    ctx.clearRect(0, 0, W, H);
    const x0 = 46, x1 = W - 16;
    const px = (i) => x0 + (i / (N - 1)) * (x1 - x0);

    // colored rod strip
    const sy = 14, sh = 26;
    const cw = (x1 - x0) / N;
    for (let i = 0; i < N; i++) {
      ctx.fillStyle = tempColor(A[i]);
      ctx.fillRect(px(i), sy, cw + 1, sh);
    }
    ctx.strokeStyle = AXIS;
    ctx.strokeRect(x0, sy, x1 - x0, sh);
    ctx.fillStyle = LABEL;
    ctx.font = FONT;
    ctx.fillText('heater', x0 + 4, sy - 3);

    // plot frame
    const py0 = 64, py1 = H - 32;
    const ty = (T) => py1 - T * (py1 - py0);
    ctx.strokeStyle = GRID;
    ctx.beginPath();
    for (const g of [0.25, 0.5, 0.75]) { ctx.moveTo(x0, ty(g)); ctx.lineTo(x1, ty(g)); }
    for (const g of [0.25, 0.5, 0.75]) { const gx = x0 + g * (x1 - x0); ctx.moveTo(gx, py0); ctx.lineTo(gx, py1); }
    ctx.stroke();
    ctx.strokeStyle = AXIS;
    ctx.strokeRect(x0, py0, x1 - x0, py1 - py0);

    // area fill under curve
    const grad = ctx.createLinearGradient(0, py0, 0, py1);
    grad.addColorStop(0, 'rgba(255,158,100,0.30)');
    grad.addColorStop(1, 'rgba(255,158,100,0.02)');
    ctx.beginPath();
    ctx.moveTo(px(0), ty(A[0]));
    for (let i = 1; i < N; i++) ctx.lineTo(px(i), ty(A[i]));
    ctx.lineTo(x1, py1); ctx.lineTo(x0, py1);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // curve
    ctx.beginPath();
    ctx.moveTo(px(0), ty(A[0]));
    for (let i = 1; i < N; i++) ctx.lineTo(px(i), ty(A[i]));
    ctx.strokeStyle = '#ff9e64';
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.lineWidth = 1;

    // labels
    ctx.fillStyle = LABEL;
    ctx.fillText('1', x0 - 14, ty(1) + 4);
    ctx.fillText('0', x0 - 14, ty(0) + 4);
    ctx.fillText('T/T₀', x0 - 38, (py0 + py1) / 2);
    ctx.fillText('x/L →', (x0 + x1) / 2 - 14, H - 12);
  });
}

/* ============================================================
   Darcy — reservoirs, soil column, head difference
   ============================================================ */
const MATERIALS = {
  gravel: { name: 'Gravel',       K: 5e-2,  n: 0.30, grain: 9,   count: 60 },
  sand:   { name: 'Medium sand',  K: 5e-4,  n: 0.35, grain: 5.5, count: 170 },
  silt:   { name: 'Silt',         K: 1e-7,  n: 0.45, grain: 3,   count: 380 },
  clay:   { name: 'Clay',         K: 1e-10, n: 0.50, grain: 1.8, count: 600 },
};

function initDarcy() {
  const canvas = $('darcy-canvas');
  if (!canvas) return;
  let view = fitCanvas(canvas);
  let mat = 'sand';
  const dhS = $('darcy-dh');
  const parts = Array.from({ length: 26 }, () => ({ f: Math.random(), lane: Math.random() }));
  let grainPts = [];

  function layout() {
    const W = view.W;
    const tankW = 104, m = 18;
    return {
      tankW, m,
      base: 288, top: 36,
      cx0: m + tankW, cx1: W - m - tankW,
      cy0: 216, cy1: 272,
      scale: 110, h2: 0.8,
    };
  }
  function regenGrains() {
    const L = layout();
    const g = MATERIALS[mat];
    grainPts = [];
    for (let i = 0; i < g.count; i++) {
      grainPts.push({
        x: L.cx0 + 6 + Math.random() * (L.cx1 - L.cx0 - 12),
        y: L.cy0 + 5 + Math.random() * (L.cy1 - L.cy0 - 10),
        r: g.grain * (0.75 + Math.random() * 0.5),
      });
    }
  }
  function phys() {
    const m = MATERIALS[mat];
    const dh = +dhS.value;
    const i = dh / 1;                 // L = 1 m
    const q = m.K * i;
    const vs = m.n > 0 ? q / m.n : 0;
    return { m, dh, i, q, vs };
  }
  function updateRO() {
    const { m, i, q, vs } = phys();
    $('darcy-K').innerHTML = sci(m.K) + ' m/s';
    $('darcy-i').textContent = i.toFixed(2);
    $('darcy-q').innerHTML = q > 0 ? sci(q) + ' m/s' : '0';
    $('darcy-t').innerHTML = vs > 0 ? fmtTime(1 / vs) : '∞ (no flow)';
  }

  $('darcy-mats').addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    mat = b.dataset.k;
    document.querySelectorAll('#darcy-mats .chip').forEach((c) => c.classList.toggle('active', c === b));
    regenGrains();
    updateRO();
  });
  dhS.addEventListener('input', updateRO);
  resizers.push(() => { view = fitCanvas(canvas); regenGrains(); });
  regenGrains();
  updateRO();

  runWhenVisible(canvas, (dt) => {
    const { ctx, W, H } = view;
    const L = layout();
    const { m, dh, vs } = phys();
    const yR = L.base - L.h2 * L.scale;
    const yL = L.base - (L.h2 + dh) * L.scale;

    ctx.clearRect(0, 0, W, H);
    ctx.font = FONT;

    // water in tanks
    ctx.fillStyle = 'rgba(76,201,240,0.30)';
    ctx.fillRect(L.m, yL, L.tankW, L.base - yL);
    ctx.fillRect(W - L.m - L.tankW, yR, L.tankW, L.base - yR);
    ctx.strokeStyle = '#6fd6ff';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(L.m, yL); ctx.lineTo(L.m + L.tankW, yL);
    ctx.moveTo(W - L.m - L.tankW, yR); ctx.lineTo(W - L.m, yR);
    ctx.stroke();

    // tank walls (open top)
    ctx.strokeStyle = '#8ea2c0';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(L.m, L.top); ctx.lineTo(L.m, L.base); ctx.lineTo(L.m + L.tankW, L.base); ctx.lineTo(L.m + L.tankW, L.cy1);
    ctx.moveTo(L.m + L.tankW, L.cy0); ctx.lineTo(L.m + L.tankW, L.top);
    ctx.moveTo(W - L.m, L.top); ctx.lineTo(W - L.m, L.base); ctx.lineTo(W - L.m - L.tankW, L.base); ctx.lineTo(W - L.m - L.tankW, L.cy1);
    ctx.moveTo(W - L.m - L.tankW, L.cy0); ctx.lineTo(W - L.m - L.tankW, L.top);
    ctx.stroke();
    ctx.lineWidth = 1;

    // column
    ctx.fillStyle = '#16223f';
    ctx.fillRect(L.cx0, L.cy0, L.cx1 - L.cx0, L.cy1 - L.cy0);
    ctx.fillStyle = 'rgba(76,201,240,0.10)';
    ctx.fillRect(L.cx0, L.cy0, L.cx1 - L.cx0, L.cy1 - L.cy0);
    for (const g of grainPts) {
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.r, 0, 7);
      ctx.fillStyle = 'rgba(169,142,98,0.85)';
      ctx.fill();
    }
    ctx.strokeStyle = '#8ea2c0';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(L.cx0, L.cy0); ctx.lineTo(L.cx1, L.cy0);
    ctx.moveTo(L.cx0, L.cy1); ctx.lineTo(L.cx1, L.cy1);
    ctx.stroke();
    ctx.lineWidth = 1;

    // hydraulic grade line
    ctx.setLineDash([7, 6]);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.moveTo(L.m + L.tankW / 2, yL);
    ctx.lineTo(W - L.m - L.tankW / 2, yR);
    ctx.stroke();
    ctx.setLineDash([]);

    // Δh annotation: extend both water levels to mid-column, dimension line between
    const ax = (L.cx0 + L.cx1) / 2;
    if (dh > 0.02) {
      ctx.strokeStyle = 'rgba(255,216,77,0.35)';
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(L.m + L.tankW, yL); ctx.lineTo(ax, yL);
      ctx.moveTo(W - L.m - L.tankW, yR); ctx.lineTo(ax, yR);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = '#ffd84d';
      ctx.beginPath();
      ctx.moveTo(ax, yL); ctx.lineTo(ax, yR);
      ctx.moveTo(ax - 5, yL); ctx.lineTo(ax + 5, yL);
      ctx.moveTo(ax - 5, yR); ctx.lineTo(ax + 5, yR);
      ctx.stroke();
      ctx.fillStyle = '#ffd84d';
      ctx.fillText('Δh = ' + dh.toFixed(2) + ' m', ax + 9, (yL + yR) / 2 + 4);
    } else {
      ctx.fillStyle = LABEL;
      ctx.fillText('Δh = 0 — no flow', ax - 40, yR - 10);
    }

    // particles (log-compressed speed)
    const sp = vs > 0 ? Math.max(0.04, Math.min(1, (Math.log10(vs) + 10.5) / 9)) : 0;
    const pxs = sp * 200;
    const colW = L.cx1 - L.cx0 - 16;
    ctx.fillStyle = '#6fd6ff';
    for (const p of parts) {
      p.f += (pxs * dt) / colW;
      if (p.f > 1) { p.f -= 1; p.lane = Math.random(); }
      const x = L.cx0 + 8 + p.f * colW;
      const y = L.cy0 + 9 + p.lane * (L.cy1 - L.cy0 - 18);
      ctx.beginPath();
      ctx.arc(x, y, 2.6, 0, 7);
      ctx.fill();
    }

    // labels
    ctx.fillStyle = LABEL;
    ctx.fillText(m.name + '  (L = 1 m)', ax - 36, L.cy1 + 18);
    ctx.fillText('h₁', L.m + 6, yL - 6);
    ctx.fillText('h₂', W - L.m - L.tankW + 6, yR - 6);
  });
}

/* ============================================================
   Effective stress — soil column with movable water table
   ============================================================ */
function initEffStress() {
  const canvas = $('es-canvas');
  if (!canvas) return;
  let view = fitCanvas(canvas);
  const slider = $('es-wt');
  const GAM = 18, GSAT = 20, GW = 9.81, D = 10, SMAX = 220;

  function profile(z, dw) {
    const sig = GAM * Math.min(z, dw) + GSAT * Math.max(z - dw, 0);
    const u = GW * Math.max(z - dw, 0);
    return { sig, u, eff: sig - u };
  }

  function draw() {
    const { ctx, W, H } = view;
    const dw = +slider.value;
    ctx.clearRect(0, 0, W, H);
    ctx.font = FONT;

    const y0 = 30, y1 = H - 44;
    const zy = (z) => y0 + (z / D) * (y1 - y0);

    // ---- soil column ----
    const colX = 38, colW = 110;
    const wtY = zy(dw);
    ctx.fillStyle = '#4a3f2e';
    ctx.fillRect(colX, y0, colW, Math.max(0, wtY - y0));
    ctx.fillStyle = '#2e3b52';
    ctx.fillRect(colX, wtY, colW, y1 - wtY);
    // speckle grains
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    for (let i = 0; i < 130; i++) {
      const gx = colX + ((i * 73) % colW);
      const gy = y0 + ((i * 137) % (y1 - y0));
      ctx.fillRect(gx, gy, 2, 2);
    }
    ctx.strokeStyle = '#8ea2c0';
    ctx.strokeRect(colX, y0, colW, y1 - y0);

    // water table line + nabla marker
    ctx.strokeStyle = '#4cc9f0';
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(colX - 8, wtY); ctx.lineTo(colX + colW + 8, wtY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#4cc9f0';
    ctx.beginPath();
    ctx.moveTo(colX + colW / 2 - 7, wtY - 12);
    ctx.lineTo(colX + colW / 2 + 7, wtY - 12);
    ctx.lineTo(colX + colW / 2, wtY - 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillText('water table', colX + colW + 14, wtY + 4);
    ctx.fillStyle = LABEL;
    ctx.fillText('ground surface', colX, y0 - 8);

    // ---- profile plot ----
    const px0 = Math.max(230, colX + colW + 110), px1 = W - 24;
    const sx = (s) => px0 + (s / SMAX) * (px1 - px0);

    ctx.strokeStyle = GRID;
    ctx.beginPath();
    for (let s = 50; s < SMAX; s += 50) { ctx.moveTo(sx(s), y0); ctx.lineTo(sx(s), y1); }
    for (let z = 2; z < D; z += 2) { ctx.moveTo(px0, zy(z)); ctx.lineTo(px1, zy(z)); }
    ctx.stroke();
    ctx.strokeStyle = AXIS;
    ctx.strokeRect(px0, y0, px1 - px0, y1 - y0);

    // axis labels
    ctx.fillStyle = LABEL;
    for (let s = 0; s <= 200; s += 50) ctx.fillText(String(s), sx(s) - 8, y1 + 16);
    ctx.fillText('kPa', px1 - 10, y1 + 30);
    for (let z = 0; z <= D; z += 5) ctx.fillText(z + ' m', px0 - 30, zy(z) + 4);

    // lines: total, pore pressure, effective
    const lines = [
      { key: 'sig', color: '#cfd8ea', label: 'σᵥ total' },
      { key: 'u',   color: '#4cc9f0', label: 'u pore pressure' },
      { key: 'eff', color: '#54d68c', label: 'σ′ᵥ effective' },
    ];
    for (const ln of lines) {
      ctx.beginPath();
      for (const z of [0, dw, D]) {
        if (z > D) continue;
        const v = profile(z, dw)[ln.key];
        if (z === 0) ctx.moveTo(sx(v), zy(z));
        else ctx.lineTo(sx(v), zy(z));
      }
      ctx.strokeStyle = ln.color;
      ctx.lineWidth = 2.6;
      ctx.stroke();
    }
    ctx.lineWidth = 1;

    // legend
    let ly = y0 + 14;
    for (const ln of lines) {
      ctx.strokeStyle = ln.color;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(px0 + 12, ly - 4); ctx.lineTo(px0 + 34, ly - 4); ctx.stroke();
      ctx.fillStyle = '#c3cee0';
      ctx.fillText(ln.label, px0 + 40, ly);
      ly += 18;
    }
    ctx.lineWidth = 1;

    const base = profile(D, dw);
    $('es-sig').textContent = base.sig.toFixed(0) + ' kPa';
    $('es-u').textContent = base.u.toFixed(0) + ' kPa';
    $('es-eff').textContent = base.eff.toFixed(0) + ' kPa';
  }

  slider.addEventListener('input', draw);
  resizers.push(() => { view = fitCanvas(canvas); draw(); });
  draw();
}

/* ============================================================
   Coupling triangle — interactive SVG built programmatically
   ============================================================ */
function initCoupling() {
  const wrap = $('coupling-svg');
  if (!wrap) return;
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };

  const R = 46;
  const NODES = {
    T: { x: 320, y: 96,  c: '#ff9e64', label: 'T', sub: 'Thermal' },
    H: { x: 150, y: 424, c: '#4cc9f0', label: 'H', sub: 'Hydraulic' },
    M: { x: 490, y: 424, c: '#54d68c', label: 'M', sub: 'Mechanical' },
  };

  const INFO = {
    default: {
      title: 'The THM triangle', color: '#b78bff',
      body: 'Each vertex is a physical field; each arrow is a family of coupling mechanisms. Click an arrow to see how one field drives another — and notice the loops: T→H→M and back again. Feedback loops are what make these systems rich, and occasionally dangerous.',
      ex: '',
    },
    'T>H': {
      title: 'T → H · Heat moves water', color: '#ff9e64',
      body: 'Heating expands pore water far more than the pore space confining it (thermal pressurisation), lowers its viscosity — water at 90 °C flows about 3× more easily than at 10 °C — and lightens it so it rises in buoyant convection cells. Strong heating can even boil pore water and drive vapour diffusion.',
      ex: 'Examples: convection in geothermal fields; pressure spikes in clay around nuclear-waste canisters.',
    },
    'H>T': {
      title: 'H → T · Flowing water carries heat', color: '#4cc9f0',
      body: 'Moving pore water advects heat with it — when seepage is fast (high Péclet number), advection beats conduction and reshapes the whole temperature field. Water content also sets the effective heat capacity and thermal conductivity of the medium.',
      ex: 'Examples: aquifer thermal-energy storage; groundwater quietly air-conditioning the rock around buried heat sources.',
    },
    'T>M': {
      title: 'T → M · Heat stresses the skeleton', color: '#ff9e64',
      body: 'Grains and skeleton expand when heated. Confined expansion converts directly into thermal stress — roughly E·αT per degree, i.e. tens of MPa for 50 °C in stiff rock — and differential expansion between minerals causes micro-cracking. Stiffness, strength and creep rate are themselves temperature-dependent.',
      ex: 'Examples: thermal spalling of borehole walls; stress redistribution around heated repositories.',
    },
    'M>T': {
      title: 'M → T · Deformation makes (a little) heat', color: '#54d68c',
      body: 'Usually the weakest arrow: plastic work and friction dissipate into heat, and changing grain contacts slightly alters thermal conductivity. But in fast shear — earthquakes, catastrophic landslides — frictional heating dominates and can flash-heat a slip zone by hundreds of degrees in seconds.',
      ex: 'Examples: frictional heating on faults; shear heating in the basal zone of large landslides.',
    },
    'H>M': {
      title: 'H → M · Pressure unloads the skeleton', color: '#4cc9f0',
      body: 'Pore pressure carries part of the total stress, so grains feel only the effective stress σ′ = σ − αp. Raising pressure weakens contacts and can push soil or rock to failure without any change in external load. Suction in unsaturated soils does the opposite, adding apparent strength.',
      ex: 'Examples: rainfall-triggered landslides; earthquakes induced by deep fluid injection.',
    },
    'M>H': {
      title: 'M → H · Deformation moves and reroutes water', color: '#54d68c',
      body: 'Squeezing pore space expels water (consolidation) and lowers permeability; dilation does the reverse, sucking water in. Fractures are exquisitely sensitive: the cubic law makes transmissivity scale with aperture cubed, so a tiny mechanical opening multiplies flow.',
      ex: 'Examples: land subsidence above pumped aquifers; permeability jumps during hydraulic stimulation.',
    },
    T: {
      title: 'T · The thermal field', color: '#ff9e64',
      body: 'State variable: temperature T. Heat moves by conduction through grains and pore water (Fourier’s law) and by advection with flowing groundwater. Sources include radioactive waste, geothermal gradients, friction and the surface climate.',
      ex: 'Governing law: energy balance — see the equations section.',
    },
    H: {
      title: 'H · The hydraulic field', color: '#4cc9f0',
      body: 'State variable: pore pressure p (or head h). Water moves down gradients of pressure and elevation following Darcy’s law, throttled by permeability — the most variable property in geoscience, spanning 13 orders of magnitude.',
      ex: 'Governing law: fluid mass balance with Darcy flux.',
    },
    M: {
      title: 'M · The mechanical field', color: '#54d68c',
      body: 'State variables: displacement u, stress σ and strain ε. The skeleton carries load through effective stress; quasi-static equilibrium plus a constitutive law (elastic or elasto-plastic) closes the problem.',
      ex: 'Governing law: linear momentum balance.',
    },
  };

  const svg = el('svg', { viewBox: '0 0 640 540' }, wrap);
  const defs = el('defs', {}, svg);
  for (const k in NODES) {
    const mk = el('marker', {
      id: 'mk-' + k, markerWidth: 9, markerHeight: 9, refX: 6.5, refY: 4, orient: 'auto',
    }, defs);
    el('path', { d: 'M0,0 L8,4 L0,8 z', fill: NODES[k].c }, mk);
  }

  // background hit area to reset selection
  const bg = el('rect', { x: 0, y: 0, width: 640, height: 540, fill: 'transparent' }, svg);

  function arrowPath(a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const Ln = Math.hypot(dx, dy);
    const ux = dx / Ln, uy = dy / Ln;
    const px = -uy, py = ux;
    const off = 13, bend = 38;
    const sx = a.x + ux * (R + 12) + px * off;
    const sy = a.y + uy * (R + 12) + py * off;
    const ex = b.x - ux * (R + 20) + px * off;
    const ey = b.y - uy * (R + 20) + py * off;
    const mx = (sx + ex) / 2 + px * bend;
    const my = (sy + ey) / 2 + py * bend;
    return `M ${sx.toFixed(1)} ${sy.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
  }

  const arrows = [];
  const PAIRS = [['T', 'H'], ['H', 'T'], ['T', 'M'], ['M', 'T'], ['H', 'M'], ['M', 'H']];
  for (const [from, to] of PAIRS) {
    const d = arrowPath(NODES[from], NODES[to]);
    const vis = el('path', {
      d, fill: 'none', stroke: NODES[from].c, 'stroke-width': 3,
      'marker-end': `url(#mk-${from})`, class: 'arrow', opacity: 0.8,
    }, svg);
    const hit = el('path', { d, fill: 'none', stroke: 'transparent', 'stroke-width': 22, class: 'hit' }, svg);
    const key = from + '>' + to;
    arrows.push({ key, vis, color: NODES[from].c });
    hit.addEventListener('click', () => select(key));
  }

  for (const k in NODES) {
    const nd = NODES[k];
    const g = el('g', { class: 'node-g' }, svg);
    el('circle', { cx: nd.x, cy: nd.y, r: R, fill: '#0d1426', stroke: nd.c, 'stroke-width': 3.5 }, g);
    const t1 = el('text', {
      x: nd.x, y: nd.y, 'text-anchor': 'middle', dy: '0.35em',
      fill: nd.c, 'font-size': 30, 'font-weight': 700, 'font-family': 'Sora, sans-serif',
    }, g);
    t1.textContent = nd.label;
    const t2 = el('text', {
      x: nd.x, y: nd.y + R + 22, 'text-anchor': 'middle',
      fill: '#93a1b8', 'font-size': 14, 'font-family': 'Inter, sans-serif',
    }, g);
    t2.textContent = nd.sub;
    g.addEventListener('click', () => select(k));
  }

  const infoCard = $('coupling-info');
  function select(key) {
    const info = INFO[key] || INFO.default;
    $('coupling-title').textContent = info.title;
    $('coupling-body').textContent = info.body;
    $('coupling-ex').textContent = info.ex;
    infoCard.style.borderTopColor = info.color;
    for (const a of arrows) {
      const isSel = a.key === key;
      const isNode = key.length === 1 && a.key.startsWith(key + '>');
      a.vis.setAttribute('opacity', key === 'default' ? 0.8 : isSel || isNode ? 1 : 0.15);
      a.vis.setAttribute('stroke-width', isSel || isNode ? 4.5 : 3);
      a.vis.style.filter = isSel || isNode ? `drop-shadow(0 0 6px ${a.color})` : '';
    }
  }
  bg.addEventListener('click', () => select('default'));
}

/* ============================================================
   Terzaghi consolidation — exact series solution
   ============================================================ */
function initTerzaghi() {
  const canvas = $('terz-canvas');
  if (!canvas) return;
  let view = fitCanvas(canvas);
  resizers.push(() => { view = fitCanvas(canvas); });

  const slider = $('terz-tv');
  const playBtn = $('terz-play');
  let playing = false;
  playBtn.addEventListener('click', () => {
    playing = !playing;
    playBtn.textContent = playing ? '⏸ Pause' : '▶ Play';
  });

  function uzt(Z, Tv) {
    let s = 0;
    for (let m = 0; m < 80; m++) {
      const M = (Math.PI / 2) * (2 * m + 1);
      s += (2 / M) * Math.sin(M * Z) * Math.exp(-M * M * Tv);
    }
    return Math.min(1, Math.max(0, s));
  }
  function Udeg(Tv) {
    let s = 0;
    for (let m = 0; m < 80; m++) {
      const M = (Math.PI / 2) * (2 * m + 1);
      s += (2 / (M * M)) * Math.exp(-M * M * Tv);
    }
    return 1 - s;
  }

  // precompute settlement curve over log Tv
  const LOG0 = -2.3, LOG1 = 0.48;
  const UCURVE = [];
  for (let i = 0; i <= 240; i++) {
    const lg = LOG0 + ((LOG1 - LOG0) * i) / 240;
    UCURVE.push([lg, Udeg(Math.pow(10, lg))]);
  }
  const REF_TV = [0.05, 0.1, 0.2, 0.4, 0.7];

  runWhenVisible(canvas, () => {
    if (playing) {
      let lg = +slider.value + 0.006;
      if (lg > LOG1) lg = LOG0;
      slider.value = lg.toFixed(3);
    }
    const Tv = Math.pow(10, +slider.value);
    $('terz-tvv').textContent = Tv.toFixed(3);
    $('terz-u').textContent = (Udeg(Tv) * 100).toFixed(0) + ' %';

    const { ctx, W, H } = view;
    ctx.clearRect(0, 0, W, H);
    ctx.font = FONT;
    const y0 = 42, y1 = H - 46;

    /* ---- left: isochrones ---- */
    const lx0 = 56, lx1 = W * 0.46;
    const ux = (u) => lx0 + u * (lx1 - lx0);
    const zy = (Z) => y0 + Z * (y1 - y0);

    ctx.strokeStyle = GRID;
    ctx.beginPath();
    for (const g of [0.25, 0.5, 0.75]) {
      ctx.moveTo(ux(g), y0); ctx.lineTo(ux(g), y1);
      ctx.moveTo(lx0, zy(g)); ctx.lineTo(lx1, zy(g));
    }
    ctx.stroke();
    ctx.strokeStyle = AXIS;
    ctx.strokeRect(lx0, y0, lx1 - lx0, y1 - y0);

    // reference isochrones
    for (const tv of REF_TV) {
      ctx.beginPath();
      for (let i = 0; i <= 60; i++) {
        const Z = i / 60;
        const u = uzt(Z, tv);
        if (i === 0) ctx.moveTo(ux(u), zy(Z));
        else ctx.lineTo(ux(u), zy(Z));
      }
      ctx.strokeStyle = 'rgba(76,201,240,0.22)';
      ctx.stroke();
    }
    // current isochrone
    ctx.beginPath();
    for (let i = 0; i <= 80; i++) {
      const Z = i / 80;
      const u = uzt(Z, Tv);
      if (i === 0) ctx.moveTo(ux(u), zy(Z));
      else ctx.lineTo(ux(u), zy(Z));
    }
    ctx.strokeStyle = '#4cc9f0';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#4cc9f0';
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1;

    ctx.fillStyle = LABEL;
    ctx.fillText('drained boundary (sand)', lx0, y0 - 8);
    ctx.fillText('impermeable base (rock)', lx0, y1 + 16);
    ctx.fillText('uₑ/u₀ →', (lx0 + lx1) / 2 - 18, y1 + 32);
    ctx.save();
    ctx.translate(lx0 - 36, (y0 + y1) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('depth z/H', -26, 0);
    ctx.restore();
    ctx.fillText('0', ux(0) - 3, y1 + 16);
    ctx.fillText('1', ux(1) - 3, y1 + 16);

    /* ---- right: settlement curve ---- */
    const rx0 = W * 0.56, rx1 = W - 22;
    const tx = (lg) => rx0 + ((lg - LOG0) / (LOG1 - LOG0)) * (rx1 - rx0);
    const uy = (U) => y0 + U * (y1 - y0);    // settlement plotted downward

    ctx.strokeStyle = GRID;
    ctx.beginPath();
    for (const lgTick of [-2, -1, 0]) { ctx.moveTo(tx(lgTick), y0); ctx.lineTo(tx(lgTick), y1); }
    for (const g of [0.25, 0.5, 0.75]) { ctx.moveTo(rx0, uy(g)); ctx.lineTo(rx1, uy(g)); }
    ctx.stroke();
    ctx.strokeStyle = AXIS;
    ctx.strokeRect(rx0, y0, rx1 - rx0, y1 - y0);

    ctx.beginPath();
    UCURVE.forEach(([lg, U], i) => {
      if (i === 0) ctx.moveTo(tx(lg), uy(U));
      else ctx.lineTo(tx(lg), uy(U));
    });
    ctx.strokeStyle = '#54d68c';
    ctx.lineWidth = 2.6;
    ctx.stroke();
    ctx.lineWidth = 1;

    // marker
    const Unow = Udeg(Tv);
    ctx.beginPath();
    ctx.arc(tx(+slider.value), uy(Unow), 6, 0, 7);
    ctx.fillStyle = '#54d68c';
    ctx.shadowColor = '#54d68c';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = LABEL;
    ctx.fillText('0.01', tx(-2) - 10, y1 + 16);
    ctx.fillText('0.1', tx(-1) - 8, y1 + 16);
    ctx.fillText('1', tx(0) - 3, y1 + 16);
    ctx.fillText('Tᵥ (log) →', (rx0 + rx1) / 2 - 22, y1 + 32);
    ctx.fillText('U = 0', rx0 + 6, y0 + 14);
    ctx.fillText('U = 100 %', rx0 + 6, y1 - 6);
  });
}

/* ============================================================
   Thermal pressurisation — coupled T and p diffusion, 1-D
   ============================================================ */
function initTP() {
  const canvas = $('tp-canvas');
  if (!canvas) return;
  let view = fitCanvas(canvas);
  resizers.push(() => { view = fitCanvas(canvas); });

  const N = 120, dx = 1 / (N - 1), dx2 = dx * dx;
  let T = new Float64Array(N), Tn = new Float64Array(N);
  let P = new Float64Array(N), Pn = new Float64Array(N);
  const sC = $('tp-c'), sL = $('tp-lam');

  function reset() {
    T.fill(0); P.fill(0);
    T[0] = 1;
  }
  reset();
  $('tp-reset').addEventListener('click', reset);
  sC.addEventListener('input', reset);
  sL.addEventListener('input', reset);

  runWhenVisible(canvas, () => {
    const c = Math.pow(10, +sC.value);
    const lam = +sL.value;
    const dt = (0.25 * dx2) / Math.max(1, c);
    const nsub = Math.max(1, Math.min(4000, Math.round(8e-4 / dt)));

    for (let k = 0; k < nsub; k++) {
      for (let i = 1; i < N - 1; i++) {
        Tn[i] = T[i] + (dt * (T[i + 1] - 2 * T[i] + T[i - 1])) / dx2;
      }
      Tn[0] = 1; Tn[N - 1] = 0;
      for (let i = 1; i < N - 1; i++) {
        Pn[i] = P[i] + (dt * c * (P[i + 1] - 2 * P[i] + P[i - 1])) / dx2 + lam * (Tn[i] - T[i]);
      }
      Pn[N - 1] = 0;
      Pn[0] = Pn[1];                       // no-flow at the heater wall
      [T, Tn] = [Tn, T];
      [P, Pn] = [Pn, P];
    }

    let pmax = 0;
    for (let i = 0; i < N; i++) if (P[i] > pmax) pmax = P[i];
    $('tp-ratio').textContent = c >= 1 ? c.toFixed(0) : c.toFixed(2);
    $('tp-peak').textContent = ((pmax / lam) * 100).toFixed(0) + ' %';
    $('tp-regime').textContent =
      c < 0.3 ? 'nearly undrained — pressure tracks temperature'
      : c > 30 ? 'well drained — pressure bleeds away'
      : 'transitional';

    /* ---- draw ---- */
    const { ctx, W, H } = view;
    ctx.clearRect(0, 0, W, H);
    ctx.font = FONT;
    const x0 = 50, x1 = W - 18, y0 = 26, y1 = H - 42;
    const px = (i) => x0 + (i / (N - 1)) * (x1 - x0);
    const vy = (v) => y1 - (v / 1.05) * (y1 - y0);

    ctx.strokeStyle = GRID;
    ctx.beginPath();
    for (const g of [0.25, 0.5, 0.75, 1]) { ctx.moveTo(x0, vy(g)); ctx.lineTo(x1, vy(g)); }
    for (const g of [0.25, 0.5, 0.75]) { const gx = x0 + g * (x1 - x0); ctx.moveTo(gx, y0); ctx.lineTo(gx, y1); }
    ctx.stroke();
    ctx.strokeStyle = AXIS;
    ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);

    // heater marker
    ctx.fillStyle = 'rgba(255,158,100,0.25)';
    ctx.fillRect(x0 - 8, y0, 8, y1 - y0);
    ctx.fillStyle = '#ff9e64';
    ctx.fillText('heater', x0 - 44, (y0 + y1) / 2);

    // undrained limit (dashed)
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const y = vy(lam * T[i]);
      if (i === 0) ctx.moveTo(px(i), y);
      else ctx.lineTo(px(i), y);
    }
    ctx.strokeStyle = 'rgba(76,201,240,0.35)';
    ctx.stroke();
    ctx.setLineDash([]);

    // temperature curve
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      if (i === 0) ctx.moveTo(px(i), vy(T[i]));
      else ctx.lineTo(px(i), vy(T[i]));
    }
    ctx.strokeStyle = '#ff9e64';
    ctx.lineWidth = 2.6;
    ctx.stroke();

    // pressure curve
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      if (i === 0) ctx.moveTo(px(i), vy(P[i]));
      else ctx.lineTo(px(i), vy(P[i]));
    }
    ctx.strokeStyle = '#4cc9f0';
    ctx.lineWidth = 2.6;
    ctx.stroke();
    ctx.lineWidth = 1;

    // legend
    const items = [
      ['#ff9e64', 'temperature T'],
      ['#4cc9f0', 'pore pressure p'],
      ['rgba(76,201,240,0.5)', 'undrained limit Λ·T'],
    ];
    let lx = x1 - 190, lyy = y0 + 16;
    for (const [col, lab] of items) {
      ctx.strokeStyle = col;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(lx, lyy - 4); ctx.lineTo(lx + 22, lyy - 4); ctx.stroke();
      ctx.fillStyle = '#c3cee0';
      ctx.fillText(lab, lx + 28, lyy);
      lyy += 17;
    }
    ctx.lineWidth = 1;

    ctx.fillStyle = LABEL;
    ctx.fillText('distance from canister →', (x0 + x1) / 2 - 56, H - 14);
    ctx.fillText('1', x0 - 14, vy(1) + 4);
    ctx.fillText('0', x0 - 14, vy(0) + 4);
  });
}

/* ============================================================
   Page chrome — reveal-on-scroll, nav scroll-spy
   ============================================================ */
function initReveal() {
  const io = new IntersectionObserver(
    (es) => es.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    }),
    { threshold: 0.06 },
  );
  document.querySelectorAll('.reveal').forEach((n) => io.observe(n));
}

function initNav() {
  const links = [...document.querySelectorAll('.navlinks a[href^="#"]')];
  const map = new Map();
  links.forEach((a) => {
    const s = document.querySelector(a.hash);
    if (s) map.set(s, a);
  });
  const io = new IntersectionObserver(
    (es) => es.forEach((e) => {
      if (e.isIntersecting) {
        links.forEach((l) => l.classList.remove('active'));
        map.get(e.target).classList.add('active');
      }
    }),
    { rootMargin: '-30% 0px -60% 0px' },
  );
  map.forEach((_, s) => io.observe(s));
}

document.addEventListener('DOMContentLoaded', () => {
  initReveal();
  initNav();
  initHero();
  initPoro();
  initHeat();
  initDarcy();
  initEffStress();
  initCoupling();
  initTerzaghi();
  initTP();
});

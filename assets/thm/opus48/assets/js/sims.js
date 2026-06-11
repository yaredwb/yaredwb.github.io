/* =========================================================================
   THM in Porous Media — interactive simulations (vanilla canvas)
   Each sim is lazily started/stopped via IntersectionObserver to save CPU.
   ========================================================================= */
(function () {
  "use strict";

  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- colour maps ---------- */
  const INFERNO = [
    [0.0,  4,   6,  22],
    [0.13, 38, 11,  84],
    [0.27, 86, 18, 110],
    [0.42,135, 33, 107],
    [0.55,186, 54,  85],
    [0.68,224, 92,  55],
    [0.80,243,132,  24],
    [0.90,250,182,  41],
    [1.0, 252,255, 164],
  ];
  const PRESSURE = [
    [0.0,   8, 18,  42],
    [0.35, 20, 70, 130],
    [0.65, 44,150, 220],
    [0.85, 96,200, 245],
    [1.0, 185,238, 255],
  ];
  function sample(map, t) {
    t = clamp(t, 0, 1);
    for (let i = 1; i < map.length; i++) {
      if (t <= map[i][0]) {
        const a = map[i - 1], b = map[i];
        const f = (t - a[0]) / (b[0] - a[0] || 1);
        return [lerp(a[1], b[1], f) | 0, lerp(a[2], b[2], f) | 0, lerp(a[3], b[3], f) | 0];
      }
    }
    const l = map[map.length - 1];
    return [l[1], l[2], l[3]];
  }

  /* ---------- canvas fit helper ---------- */
  function fit(canvas, cssH) {
    const parentW = canvas.clientWidth || canvas.parentElement.clientWidth || 600;
    const h = cssH || canvas.clientHeight || 300;
    canvas.style.width = "100%";
    if (cssH) canvas.style.height = cssH + "px";
    canvas.width = Math.max(1, Math.round(parentW * DPR));
    canvas.height = Math.max(1, Math.round(h * DPR));
    return { w: parentW, h: h };
  }

  /* ---------- visibility-driven loop ---------- */
  function lazyLoop(canvas, frame) {
    let raf = null, visible = false;
    const tick = () => { if (visible) { frame(); raf = requestAnimationFrame(tick); } };
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (e.isIntersecting && !visible) { visible = true; raf = requestAnimationFrame(tick); }
        else if (!e.isIntersecting && visible) { visible = false; if (raf) cancelAnimationFrame(raf); }
      });
    }, { threshold: 0.05 });
    io.observe(canvas);
    return { isVisible: () => visible };
  }

  /* =======================================================================
     HERO — flow field of particles (porous-seepage aesthetic)
     ===================================================================== */
  function initHero() {
    const canvas = document.getElementById("heroCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W, H, parts, t = 0;
    const COLORS = ["#ff6b3d", "#ffb838", "#3b9dff", "#59e0ff", "#35d49b", "#a3e635"];

    function resize() {
      W = canvas.width = Math.round((canvas.clientWidth || window.innerWidth) * DPR);
      H = canvas.height = Math.round((canvas.clientHeight || window.innerHeight) * DPR);
      const N = Math.round(clamp((W * H) / (DPR * DPR) / 5500, 90, 320));
      parts = [];
      for (let i = 0; i < N; i++) parts.push(spawn());
      ctx.fillStyle = "#080b12"; ctx.fillRect(0, 0, W, H);
    }
    function spawn() {
      return {
        x: Math.random() * W, y: Math.random() * H,
        c: COLORS[(Math.random() * COLORS.length) | 0],
        life: 60 + Math.random() * 200,
      };
    }
    function field(x, y) {
      const s = 0.0022 / DPR;
      const a = (Math.sin(y * s + t * 0.18) + Math.cos(x * s * 1.3 - t * 0.13)) * 1.4
              + Math.sin((x + y) * s * 0.6 + t * 0.07) * 1.1;
      return a * Math.PI;
    }
    function frame() {
      t += 0.016;
      ctx.fillStyle = "rgba(8,11,18,0.10)";
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      const speed = 1.1 * DPR;
      for (const p of parts) {
        const a = field(p.x, p.y);
        const nx = p.x + Math.cos(a) * speed;
        const ny = p.y + Math.sin(a) * speed;
        ctx.strokeStyle = p.c;
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 1.1 * DPR;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(nx, ny); ctx.stroke();
        p.x = nx; p.y = ny; p.life--;
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H || p.life < 0) {
          Object.assign(p, spawn());
        }
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    }
    resize();
    window.addEventListener("resize", () => { clearTimeout(initHero._t); initHero._t = setTimeout(resize, 200); });
    lazyLoop(canvas, frame);
  }

  /* =======================================================================
     REV — grain pack + growing measurement window + porosity curve
     ===================================================================== */
  function initREV() {
    const canvas = document.getElementById("revCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const slider = document.getElementById("revSize");
    const phiOut = document.getElementById("revPhi");
    const sizeOut = document.getElementById("revSizeVal");

    let W, H, grainH, curveTop, solid, gw, gh, grains, curve, maxWin;
    const GRID = 2; // px per mask cell (CSS px)

    function buildGrains() {
      grains = [];
      const target = Math.round((W * grainH) / 2600);
      let tries = 0;
      while (grains.length < target && tries < target * 40) {
        tries++;
        const r = lerp(11, 30, Math.pow(Math.random(), 1.3));
        const x = Math.random() * W, y = Math.random() * grainH;
        let ok = true;
        for (const g of grains) {
          const d = Math.hypot(g.x - x, g.y - y);
          if (d < (g.r + r) * 0.62) { ok = false; break; }
        }
        if (ok) grains.push({ x, y, r });
      }
    }
    function buildMask() {
      gw = Math.ceil(W / GRID); gh = Math.ceil(grainH / GRID);
      solid = new Uint8Array(gw * gh);
      for (const g of grains) {
        const i0 = Math.max(0, ((g.x - g.r) / GRID) | 0), i1 = Math.min(gw - 1, ((g.x + g.r) / GRID) | 0);
        const j0 = Math.max(0, ((g.y - g.r) / GRID) | 0), j1 = Math.min(gh - 1, ((g.y + g.r) / GRID) | 0);
        const r2 = g.r * g.r;
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
          const dx = i * GRID + GRID / 2 - g.x, dy = j * GRID + GRID / 2 - g.y;
          if (dx * dx + dy * dy <= r2) solid[j * gw + i] = 1;
        }
      }
    }
    function phiAt(winPx) {
      const cx = W / 2, cy = grainH / 2, half = winPx / 2;
      const i0 = Math.max(0, ((cx - half) / GRID) | 0), i1 = Math.min(gw - 1, ((cx + half) / GRID) | 0);
      const j0 = Math.max(0, ((cy - half) / GRID) | 0), j1 = Math.min(gh - 1, ((cy + half) / GRID) | 0);
      let total = 0, void_ = 0;
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { total++; if (!solid[j * gw + i]) void_++; }
      return total ? void_ / total : 0;
    }
    function buildCurve() {
      curve = [];
      for (let s = 8; s <= maxWin; s += 4) curve.push([s, phiAt(s)]);
    }

    function setup() {
      const m = fit(canvas, 380);
      W = m.w; H = m.h;
      grainH = Math.round(H * 0.64);
      curveTop = grainH + 14;
      maxWin = Math.min(W, grainH) - 8;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      buildGrains(); buildMask(); buildCurve();
    }

    function winPx() { return clamp((+slider.value / 100) * maxWin, 12, maxWin); }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      // pore fluid background
      ctx.fillStyle = "#0a1422"; ctx.fillRect(0, 0, W, grainH);
      // grains
      for (const g of grains) {
        const grd = ctx.createRadialGradient(g.x - g.r * 0.35, g.y - g.r * 0.35, g.r * 0.1, g.x, g.y, g.r);
        grd.addColorStop(0, "#caa173"); grd.addColorStop(0.6, "#9c7445"); grd.addColorStop(1, "#5e4326");
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, TAU); ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.35)"; ctx.lineWidth = 1; ctx.stroke();
      }
      // dim outside window
      const wp = winPx(), cx = W / 2, cy = grainH / 2, x0 = cx - wp / 2, y0 = cy - wp / 2;
      ctx.fillStyle = "rgba(8,11,18,0.62)";
      ctx.fillRect(0, 0, W, y0);
      ctx.fillRect(0, y0 + wp, W, grainH - (y0 + wp));
      ctx.fillRect(0, y0, x0, wp);
      ctx.fillRect(x0 + wp, y0, W - (x0 + wp), wp);
      // window frame
      ctx.strokeStyle = "#59e0ff"; ctx.lineWidth = 2;
      ctx.shadowColor = "rgba(89,224,255,0.6)"; ctx.shadowBlur = 12;
      ctx.strokeRect(x0, y0, wp, wp);
      ctx.shadowBlur = 0;

      // curve panel
      const px0 = 46, px1 = W - 14, py0 = curveTop + 6, py1 = H - 22;
      ctx.strokeStyle = "rgba(255,255,255,0.14)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px0, py0); ctx.lineTo(px0, py1); ctx.lineTo(px1, py1); ctx.stroke();
      ctx.fillStyle = "#7a8499"; ctx.font = "11px 'JetBrains Mono', monospace";
      ctx.fillText("φ", 8, py0 + 8);
      ctx.fillText("1", 26, py0 + 8); ctx.fillText("0", 26, py1);
      ctx.fillText("window size →", px1 - 92, py1 + 16);
      // curve
      ctx.beginPath();
      const cur = winPx();
      let markX = px0, markY = py1, markPhi = 0;
      curve.forEach((pt, k) => {
        const x = lerp(px0, px1, pt[0] / maxWin);
        const y = lerp(py1, py0, pt[1]);
        if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        if (pt[0] <= cur) { markX = x; markY = y; markPhi = pt[1]; }
      });
      const grd = ctx.createLinearGradient(px0, 0, px1, 0);
      grd.addColorStop(0, "#ff6b3d"); grd.addColorStop(1, "#59e0ff");
      ctx.strokeStyle = grd; ctx.lineWidth = 2.2; ctx.stroke();
      // REV plateau line
      const plateau = curve.length ? curve[curve.length - 1][1] : 0;
      ctx.setLineDash([4, 4]); ctx.strokeStyle = "rgba(163,230,53,0.5)";
      ctx.beginPath(); const yy = lerp(py1, py0, plateau); ctx.moveTo(px0, yy); ctx.lineTo(px1, yy); ctx.stroke();
      ctx.setLineDash([]);
      // marker
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(markX, markY, 4, 0, TAU); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.beginPath(); ctx.moveTo(markX, markY); ctx.lineTo(markX, py1); ctx.stroke();

      const phi = phiAt(wp);
      phiOut.textContent = (phi * 100).toFixed(1) + " %";
      sizeOut.textContent = wp < maxWin * 0.28 ? "small" : wp < maxWin * 0.7 ? "growing" : "≈ REV";
    }

    setup();
    draw();
    slider.addEventListener("input", draw);
    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { setup(); draw(); }, 220); });
  }

  /* =======================================================================
     HEAT — 2D explicit finite-difference diffusion
     ===================================================================== */
  function initHeat() {
    const canvas = document.getElementById("heatCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const diffEl = document.getElementById("heatDiff");
    let nx, ny, T, off, offCtx, img, W, H, mode = "pulse";
    let pointer = null;

    function setup() {
      const m = fit(canvas, 320);
      W = m.w; H = m.h;
      nx = 168; ny = Math.max(60, Math.round(nx * (H / W)));
      T = new Float32Array(nx * ny);
      off = document.createElement("canvas"); off.width = nx; off.height = ny;
      offCtx = off.getContext("2d"); img = offCtx.createImageData(nx, ny);
      seed();
    }
    function seed() {
      T.fill(0);
      if (mode === "pulse") {
        const cx = nx / 2, cy = ny / 2, r = Math.min(nx, ny) * 0.12;
        for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
          const d = Math.hypot(i - cx, j - cy);
          if (d < r) T[j * nx + i] = 1;
        }
      }
    }
    function step() {
      const coeff = clamp((+diffEl.value / 100) * 0.22, 0.02, 0.24);
      const Tn = T; // in-place using buffer copy
      const buf = step._buf || (step._buf = new Float32Array(nx * ny));
      buf.set(Tn);
      if (mode === "edge") for (let j = 0; j < ny; j++) buf[j * nx] = 1; // hot wall
      for (let j = 1; j < ny - 1; j++) {
        for (let i = 1; i < nx - 1; i++) {
          const k = j * nx + i;
          const lap = buf[k - 1] + buf[k + 1] + buf[k - nx] + buf[k + nx] - 4 * buf[k];
          Tn[k] = buf[k] + coeff * lap;
        }
      }
      // insulated edges (copy neighbour)
      for (let i = 0; i < nx; i++) { Tn[i] = Tn[nx + i]; Tn[(ny - 1) * nx + i] = Tn[(ny - 2) * nx + i]; }
      for (let j = 0; j < ny; j++) { if (mode !== "edge") Tn[j * nx] = Tn[j * nx + 1]; Tn[j * nx + nx - 1] = Tn[j * nx + nx - 2]; }
      if (mode === "edge") for (let j = 0; j < ny; j++) Tn[j * nx] = 1;
      if (pointer) {
        const pi = clamp((pointer.x / W * nx) | 0, 1, nx - 2);
        const pj = clamp((pointer.y / H * ny) | 0, 1, ny - 2);
        const R = 5;
        for (let dj = -R; dj <= R; dj++) for (let di = -R; di <= R; di++) {
          if (di * di + dj * dj <= R * R) {
            const ii = clamp(pi + di, 0, nx - 1), jj = clamp(pj + dj, 0, ny - 1);
            T[jj * nx + ii] = 1;
          }
        }
      }
    }
    function render() {
      const d = img.data;
      for (let k = 0; k < nx * ny; k++) {
        const c = sample(INFERNO, T[k]);
        const o = k * 4; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
      }
      offCtx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
    }
    function frame() { step(); step(); render(); }

    function pointerPos(e) {
      const r = canvas.getBoundingClientRect();
      const cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      const cy = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
      return { x: cx / r.width * W, y: cy / r.height * H };
    }
    canvas.addEventListener("pointerdown", (e) => { pointer = pointerPos(e); canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener("pointermove", (e) => { if (pointer) pointer = pointerPos(e); });
    window.addEventListener("pointerup", () => { pointer = null; });

    document.querySelectorAll("[data-heatmode]").forEach((b) => {
      b.addEventListener("click", () => {
        document.querySelectorAll("[data-heatmode]").forEach((x) => x.classList.remove("active"));
        b.classList.add("active"); mode = b.dataset.heatmode; seed();
      });
    });
    document.getElementById("heatReset").addEventListener("click", seed);

    setup();
    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(setup, 220); });
    lazyLoop(canvas, frame);
  }

  /* =======================================================================
     DARCY — steady pressure (Jacobi) + tracer particles around a lens
     ===================================================================== */
  function initDarcy() {
    const canvas = document.getElementById("darcyCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const kEl = document.getElementById("darcyK");
    const gradEl = document.getElementById("darcyGrad");
    let nx, ny, p, K, off, offCtx, img, W, H, parts;
    let lensCx, lensCy, lensR;

    function setup() {
      const m = fit(canvas, 320);
      W = m.w; H = m.h;
      nx = 150; ny = Math.max(60, Math.round(nx * (H / W)));
      p = new Float32Array(nx * ny);
      K = new Float32Array(nx * ny);
      lensCx = nx * 0.5; lensCy = ny * 0.5; lensR = Math.min(nx, ny) * 0.26;
      updateK();
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) p[j * nx + i] = 1 - i / (nx - 1);
      off = document.createElement("canvas"); off.width = nx; off.height = ny;
      offCtx = off.getContext("2d"); img = offCtx.createImageData(nx, ny);
      parts = [];
      for (let i = 0; i < 260; i++) parts.push(spawn(true));
    }
    function updateK() {
      const lensK = clamp(Math.pow(+kEl.value / 100, 2) * 2 + 0.004, 0.004, 2);
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const d = Math.hypot(i - lensCx, j - lensCy);
        K[j * nx + i] = d < lensR ? lensK : 1;
      }
    }
    function spawn(any) {
      return { x: any ? Math.random() * nx : 0.5, y: Math.random() * ny, age: 0, max: 120 + Math.random() * 120 };
    }
    function kFace(a, b) { const ka = K[a], kb = K[b]; return 2 * ka * kb / (ka + kb + 1e-9); }
    function relax(iters) {
      for (let it = 0; it < iters; it++) {
        for (let j = 0; j < ny; j++) {
          for (let i = 1; i < nx - 1; i++) {
            const k = j * nx + i;
            const kw = kFace(k, k - 1), ke = kFace(k, k + 1);
            const kn = j > 0 ? kFace(k, k - nx) : 0, ks = j < ny - 1 ? kFace(k, k + nx) : 0;
            const pn = j > 0 ? p[k - nx] : p[k], ps = j < ny - 1 ? p[k + nx] : p[k];
            const num = kw * p[k - 1] + ke * p[k + 1] + kn * pn + ks * ps;
            const den = kw + ke + kn + ks;
            if (den > 0) p[k] = num / den;
          }
        }
        for (let j = 0; j < ny; j++) { p[j * nx] = 1; p[j * nx + nx - 1] = 0; }
      }
    }
    function vel(fx, fy) {
      const i = clamp(fx | 0, 0, nx - 2), j = clamp(fy | 0, 0, ny - 2);
      const k = j * nx + i;
      const dpdx = (p[k + 1] - p[k]);
      const dpdy = (p[k + nx] - p[k]);
      const kk = K[k];
      return { vx: -kk * dpdx, vy: -kk * dpdy };
    }
    function render() {
      const d = img.data;
      for (let k = 0; k < nx * ny; k++) {
        const c = sample(PRESSURE, p[k]);
        const o = k * 4; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
      }
      offCtx.putImageData(img, 0, 0);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
      // lens outline
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.arc(lensCx / nx * W, lensCy / ny * H, lensR / nx * W, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(255,255,255,0.45)"; ctx.font = "11px 'JetBrains Mono', monospace";
      ctx.fillText("low-k lens", lensCx / nx * W - 26, lensCy / ny * H + 4);
      ctx.fillText("high p", 6, 14); ctx.fillText("low p", W - 44, 14);
      // particles
      const gain = (+gradEl.value / 100) * 60;
      ctx.lineWidth = 1.6;
      for (const pt of parts) {
        const v = vel(pt.x, pt.y);
        const sp = Math.hypot(v.vx, v.vy);
        const c = sample(PRESSURE, clamp(0.4 + sp * 4, 0, 1));
        const x0 = pt.x / nx * W, y0 = pt.y / ny * H;
        pt.x += v.vx * gain; pt.y += v.vy * gain; pt.age++;
        ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},0.9)`;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(pt.x / nx * W, pt.y / ny * H); ctx.stroke();
        if (pt.x >= nx - 1 || pt.x < 0 || pt.y < 0 || pt.y >= ny - 1 || pt.age > pt.max || sp < 1e-4) {
          Object.assign(pt, spawn(false));
        }
      }
    }
    function frame() { relax(3); render(); }

    setup();
    kEl.addEventListener("input", updateK);
    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(setup, 220); });
    lazyLoop(canvas, frame);
  }

  /* =======================================================================
     STRESS — load sharing between effective stress and pore pressure
     ===================================================================== */
  function initStress() {
    const canvas = document.getElementById("stressCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const loadEl = document.getElementById("stressLoad");
    let W, H, mode = "undrained", pFrac = 0.0, droplets = [], tt = 0;
    const baseEff = 0.12; // skeleton always carries a bit

    function setup() { const m = fit(canvas, 320); W = m.w; H = m.h; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); }

    function frame() {
      tt += 0.016;
      const load = +loadEl.value / 100; // total applied 0..1
      // target pore-pressure fraction of the *applied* load
      const target = mode === "undrained" ? 0.9 : 0.0;
      pFrac += (target - pFrac) * 0.05;
      const pore = load * pFrac;
      const eff = baseEff + load * (1 - pFrac) * (1 - baseEff);
      draw(load, pore, eff);
    }

    function draw(load, pore, eff) {
      ctx.clearRect(0, 0, W, H);
      const cx = W * 0.5;
      const sampleW = Math.min(W * 0.42, 230), sampleX = cx - sampleW / 2;
      const sampleTop = 96, sampleBot = H - 70, sampleH = sampleBot - sampleTop;

      // load arrow (piston) sized by load
      const arrowLen = 24 + load * 46;
      ctx.fillStyle = "#cdd5e3";
      ctx.fillRect(sampleX + 6, sampleTop - 14, sampleW - 12, 12);
      ctx.strokeStyle = "#9aa3b2"; ctx.lineWidth = 2;
      for (let a = 0; a < 5; a++) {
        const ax = sampleX + sampleW * (0.16 + a * 0.17);
        ctx.beginPath(); ctx.moveTo(ax, sampleTop - 16 - arrowLen); ctx.lineTo(ax, sampleTop - 18);
        ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ax - 5, sampleTop - 26); ctx.lineTo(ax, sampleTop - 18); ctx.lineTo(ax + 5, sampleTop - 26); ctx.stroke();
      }
      ctx.fillStyle = "#cdd5e3"; ctx.font = "600 13px 'Inter', sans-serif"; ctx.textAlign = "center";
      ctx.fillText("total stress  σ", cx, sampleTop - 30 - arrowLen);

      // saturated sample (porous)
      ctx.fillStyle = "#0c1626";
      ctx.fillRect(sampleX, sampleTop, sampleW, sampleH);
      // pore fluid dots
      ctx.fillStyle = "rgba(59,157,255,0.28)";
      for (let gy = 0; gy < 7; gy++) for (let gx = 0; gx < 9; gx++) {
        const px = sampleX + (gx + 0.5) / 9 * sampleW;
        const py = sampleTop + (gy + 0.5) / 7 * sampleH;
        ctx.beginPath(); ctx.arc(px, py, 6, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = "rgba(53,212,155,0.5)";
      for (let gy = 0; gy < 6; gy++) for (let gx = 0; gx < 8; gx++) {
        const px = sampleX + (gx + 1) / 9 * sampleW;
        const py = sampleTop + (gy + 1) / 7 * sampleH;
        ctx.beginPath(); ctx.arc(px, py, 4, 0, TAU); ctx.fill();
      }
      ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 1.5;
      ctx.strokeRect(sampleX, sampleTop, sampleW, sampleH);

      // drainage valve / droplets when drained
      ctx.textAlign = "center";
      if (mode === "drained") {
        ctx.fillStyle = "#59e0ff"; ctx.font = "11px 'JetBrains Mono', monospace";
        ctx.fillText("drain open ▽", cx, sampleTop - 2 + sampleH + 18);
        if (pore > 0.02 && Math.random() < 0.4) droplets.push({ x: cx + (Math.random() - 0.5) * 30, y: sampleBot, v: 1 });
      }
      droplets = droplets.filter((d) => d.y < H + 10);
      ctx.fillStyle = "#59e0ff";
      for (const d of droplets) { d.y += d.v; d.v += 0.25; ctx.beginPath(); ctx.arc(d.x, d.y, 2.5, 0, TAU); ctx.fill(); }

      // bar chart: σ = σ' + p
      const barX = W - 150, barW = 30, barTop = 80, barBot = H - 80, barH = barBot - barTop;
      if (barX > sampleX + sampleW + 10) {
        const total = eff + pore || 1e-6;
        const scale = clamp(load, 0.02, 1);
        const effPx = (eff / 1) * barH;
        const porePx = (pore / 1) * barH;
        // effective (bottom)
        ctx.fillStyle = "#35d49b";
        ctx.fillRect(barX, barBot - effPx, barW, effPx);
        // pore (stacked on top)
        ctx.fillStyle = "#3b9dff";
        ctx.fillRect(barX, barBot - effPx - porePx, barW, porePx);
        ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 1;
        ctx.strokeRect(barX, barBot - (effPx + porePx), barW, effPx + porePx);
        // labels
        ctx.textAlign = "left"; ctx.font = "600 12px 'Inter', sans-serif";
        ctx.fillStyle = "#3b9dff"; ctx.fillText("pore p", barX + barW + 8, barBot - effPx - porePx + 12);
        ctx.fillStyle = "#35d49b"; ctx.fillText("σ′ effective", barX + barW + 8, barBot - effPx / 2);
        ctx.fillStyle = "#9aa3b2"; ctx.font = "10px 'JetBrains Mono', monospace";
        ctx.fillText("σ = σ′ + αp", barX - 4, barTop - 12);
        ctx.textAlign = "center";
      }
    }

    document.querySelectorAll("[data-drain]").forEach((b) => {
      b.addEventListener("click", () => {
        document.querySelectorAll("[data-drain]").forEach((x) => x.classList.remove("active"));
        b.classList.add("active"); mode = b.dataset.drain;
      });
    });
    setup();
    let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(setup, 220); });
    lazyLoop(canvas, frame);
  }

  /* =======================================================================
     CONSOLIDATION — Terzaghi analytical solution (3 linked panels)
     ===================================================================== */
  function initConsolidation() {
    const colC = document.getElementById("consolColumn");
    const isoC = document.getElementById("consolIso");
    const uC = document.getElementById("consolU");
    if (!colC || !isoC || !uC) return;
    const colX = colC.getContext("2d"), isoX = isoC.getContext("2d"), uX = uC.getContext("2d");
    const tvEl = document.getElementById("consolTv");
    const tvVal = document.getElementById("consolTvVal");
    const uVal = document.getElementById("consolUVal");
    const playBtn = document.getElementById("consolPlay");
    let playing = false, dims = {}, tt = 0;

    const Mm = (m) => (Math.PI / 2) * (2 * m + 1);
    function uNorm(Z, Tv) { // excess pore pressure ratio at depth Z (0..2), time factor Tv
      let s = 0;
      for (let m = 0; m < 60; m++) { const M = Mm(m); s += (2 / M) * Math.sin(M * Z) * Math.exp(-M * M * Tv); }
      return clamp(s, 0, 1);
    }
    function degreeU(Tv) {
      let s = 0;
      for (let m = 0; m < 60; m++) { const M = Mm(m); s += (2 / (M * M)) * Math.exp(-M * M * Tv); }
      return clamp(1 - s, 0, 1);
    }

    function setup() {
      dims.col = fit(colC, colC.clientHeight || 300);
      dims.iso = fit(isoC, isoC.clientHeight || 300);
      dims.u = fit(uC, uC.clientHeight || 300);
      colX.setTransform(DPR, 0, 0, DPR, 0, 0);
      isoX.setTransform(DPR, 0, 0, DPR, 0, 0);
      uX.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    function drawColumn(Tv, U) {
      const { w: W, h: H } = dims.col; const x = colX;
      x.clearRect(0, 0, W, H);
      const m = 18, top = 46, settle = U * 22;
      const x0 = m + 10, x1 = W - m - 10, w = x1 - x0;
      const bot = H - 30;
      // load arrows
      x.strokeStyle = "#cdd5e3"; x.lineWidth = 2;
      for (let a = 0; a < 4; a++) {
        const ax = x0 + w * (0.2 + a * 0.2);
        x.beginPath(); x.moveTo(ax, 8); x.lineTo(ax, top + settle - 6); x.stroke();
        x.beginPath(); x.moveTo(ax - 4, top + settle - 14); x.lineTo(ax, top + settle - 6); x.lineTo(ax + 4, top + settle - 14); x.stroke();
      }
      // clay layer (compresses)
      const lt = top + settle, lh = bot - lt;
      const grd = x.createLinearGradient(0, lt, 0, bot);
      grd.addColorStop(0, "#6a4f30"); grd.addColorStop(1, "#4a371f");
      x.fillStyle = grd; x.fillRect(x0, lt, w, lh);
      // excess-pressure tint overlay (blue where pressure remains)
      for (let r = 0; r < 16; r++) {
        const Z = (r + 0.5) / 16 * 2;
        const up = uNorm(Z, Tv);
        x.fillStyle = `rgba(59,157,255,${0.42 * up})`;
        x.fillRect(x0, lt + (r / 16) * lh, w, lh / 16 + 1);
      }
      x.strokeStyle = "rgba(255,255,255,0.25)"; x.lineWidth = 1.5; x.strokeRect(x0, lt, w, lh);
      // drainage layers (top & bottom) with escaping water arrows
      x.fillStyle = "#1f3b56"; x.fillRect(x0, lt - 7, w, 6); x.fillRect(x0, bot + 1, w, 6);
      x.strokeStyle = "#59e0ff"; x.lineWidth = 1.6;
      const flow = (1 - U); const pulse = (Math.sin(tt * 4) * 0.5 + 0.5);
      if (flow > 0.02) {
        for (let a = 0; a < 3; a++) {
          const ax = x0 + w * (0.28 + a * 0.22);
          const off = pulse * 8;
          x.globalAlpha = flow;
          x.beginPath(); x.moveTo(ax, lt - 8 - off); x.lineTo(ax, lt - 16 - off); x.stroke();
          x.beginPath(); x.moveTo(ax, bot + 8 + off); x.lineTo(ax, bot + 16 + off); x.stroke();
          x.globalAlpha = 1;
        }
      }
      x.fillStyle = "#9aa3b2"; x.font = "10px 'JetBrains Mono', monospace"; x.textAlign = "center";
      x.fillText("water out ↑", W / 2, lt - 20);
      x.fillText("water out ↓", W / 2, bot + 26);
      x.fillStyle = "#cdd5e3"; x.font = "600 12px 'Inter', sans-serif";
      x.fillText("load", W / 2, 20);
      x.textAlign = "left";
    }

    function drawIso(Tv) {
      const { w: W, h: H } = dims.iso; const x = isoX;
      x.clearRect(0, 0, W, H);
      const ml = 40, mr = 16, mt = 18, mb = 34;
      const x0 = ml, x1 = W - mr, y0 = mt, y1 = H - mb;
      // axes
      x.strokeStyle = "rgba(255,255,255,0.14)"; x.lineWidth = 1;
      x.beginPath(); x.moveTo(x0, y0); x.lineTo(x0, y1); x.lineTo(x1, y1); x.stroke();
      x.fillStyle = "#7a8499"; x.font = "11px 'JetBrains Mono', monospace";
      x.textAlign = "center";
      x.fillText("u / u₀", (x0 + x1) / 2, y1 + 22);
      x.fillText("0", x0, y1 + 16); x.fillText("1", x1, y1 + 16);
      x.save(); x.translate(12, (y0 + y1) / 2); x.rotate(-Math.PI / 2);
      x.fillText("depth  Z = z/H", 0, 0); x.restore();
      x.textAlign = "right"; x.fillText("0", x0 - 6, y0 + 4); x.fillText("2", x0 - 6, y1);
      x.textAlign = "left";
      const X = (u) => lerp(x0, x1, u), Y = (Z) => lerp(y0, y1, Z / 2);
      // ghost isochrones
      const ghosts = [0.02, 0.05, 0.1, 0.2, 0.4, 0.848];
      ghosts.forEach((gt) => {
        if (gt >= Tv - 0.001) return;
        x.strokeStyle = "rgba(89,224,255,0.13)"; x.lineWidth = 1;
        x.beginPath();
        for (let r = 0; r <= 60; r++) { const Z = r / 60 * 2; const u = uNorm(Z, gt); const px = X(u), py = Y(Z); r ? x.lineTo(px, py) : x.moveTo(px, py); }
        x.stroke();
      });
      // current isochrone (filled)
      x.beginPath(); x.moveTo(X(0), Y(0));
      for (let r = 0; r <= 80; r++) { const Z = r / 80 * 2; const u = uNorm(Z, Tv); x.lineTo(X(u), Y(Z)); }
      x.lineTo(X(0), Y(2)); x.closePath();
      const grd = x.createLinearGradient(x0, 0, x1, 0);
      grd.addColorStop(0, "rgba(59,157,255,0.05)"); grd.addColorStop(1, "rgba(59,157,255,0.32)");
      x.fillStyle = grd; x.fill();
      x.beginPath();
      for (let r = 0; r <= 80; r++) { const Z = r / 80 * 2; const u = uNorm(Z, Tv); const px = X(u), py = Y(Z); r ? x.lineTo(px, py) : x.moveTo(px, py); }
      x.strokeStyle = "#59e0ff"; x.lineWidth = 2.4; x.shadowColor = "rgba(89,224,255,0.5)"; x.shadowBlur = 8; x.stroke(); x.shadowBlur = 0;
    }

    function drawU(Tv, U) {
      const { w: W, h: H } = dims.u; const x = uX;
      x.clearRect(0, 0, W, H);
      const ml = 36, mr = 16, mt = 18, mb = 34;
      const x0 = ml, x1 = W - mr, y0 = mt, y1 = H - mb, TvMax = 2;
      x.strokeStyle = "rgba(255,255,255,0.14)"; x.lineWidth = 1;
      x.beginPath(); x.moveTo(x0, y0); x.lineTo(x0, y1); x.lineTo(x1, y1); x.stroke();
      x.fillStyle = "#7a8499"; x.font = "11px 'JetBrains Mono', monospace"; x.textAlign = "center";
      x.fillText("time factor  Tᵥ", (x0 + x1) / 2, y1 + 22);
      x.textAlign = "right"; x.fillText("0%", x0 - 5, y0 + 4); x.fillText("100%", x0 - 5, y1);
      x.save(); x.translate(11, (y0 + y1) / 2); x.rotate(-Math.PI / 2); x.textAlign = "center";
      x.fillText("U", 0, 0); x.restore();
      const X = (tv) => lerp(x0, x1, tv / TvMax), Y = (u) => lerp(y0, y1, u);
      // curve
      x.beginPath();
      for (let r = 0; r <= 120; r++) { const tv = r / 120 * TvMax; const u = degreeU(tv); const px = X(tv), py = Y(u); r ? x.lineTo(px, py) : x.moveTo(px, py); }
      const grd = x.createLinearGradient(x0, 0, x1, 0);
      grd.addColorStop(0, "#35d49b"); grd.addColorStop(1, "#a3e635");
      x.strokeStyle = grd; x.lineWidth = 2.4; x.stroke();
      // marker
      const mx = X(Tv), my = Y(U);
      x.strokeStyle = "rgba(255,255,255,0.3)"; x.setLineDash([3, 3]);
      x.beginPath(); x.moveTo(x0, my); x.lineTo(mx, my); x.lineTo(mx, y1); x.stroke(); x.setLineDash([]);
      x.fillStyle = "#fff"; x.beginPath(); x.arc(mx, my, 4.5, 0, TAU); x.fill();
    }

    function redraw() {
      tt += 0.016;
      const Tv = (+tvEl.value / 100);
      const U = degreeU(Tv);
      tvVal.textContent = Tv.toFixed(2);
      uVal.textContent = Math.round(U * 100) + "%";
      drawColumn(Tv, U); drawIso(Tv); drawU(Tv, U);
    }
    function frame() {
      if (playing) {
        let v = +tvEl.value + 0.8;
        if (v > 200) { v = 0; }
        tvEl.value = v;
      }
      redraw();
    }

    playBtn.addEventListener("click", () => {
      playing = !playing;
      playBtn.textContent = playing ? "⏸ Pause" : "▶ Play";
    });
    tvEl.addEventListener("input", () => { playing = false; playBtn.textContent = "▶ Play"; });

    setup(); redraw();
    let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { setup(); redraw(); }, 220); });
    lazyLoop(colC, frame);
  }

  /* ---------- export ---------- */
  window.THMSims = {
    initAll() {
      try { initHero(); } catch (e) { console.warn("hero", e); }
      try { initREV(); } catch (e) { console.warn("rev", e); }
      try { initHeat(); } catch (e) { console.warn("heat", e); }
      try { initDarcy(); } catch (e) { console.warn("darcy", e); }
      try { initStress(); } catch (e) { console.warn("stress", e); }
      try { initConsolidation(); } catch (e) { console.warn("consol", e); }
    },
  };
})();

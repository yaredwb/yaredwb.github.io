/* =============================================================================
   Chapter 01 — The porous medium
   · REV: exact void fraction of a sliding, resizable window (summed-area table)
   · phase composition of a unit volume
   · effective conductivity with Wiener and Hashin–Shtrikman bounds
   ========================================================================== */
(function (global) {
  'use strict';
  var THM = global.THM, U = THM.util;

  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* ========================================================== 1.1  the REV */

  THM.viz('revFig', function (host) {
    var body = host.querySelector('.fig__body');
    body.innerHTML = '<div class="fig__split"><div class="rev__pack"></div><div class="rev__plot"></div></div>';
    var packHost = body.querySelector('.rev__pack');
    var plotHost = body.querySelector('.rev__plot');

    var cv = document.createElement('canvas');
    cv.style.cssText = 'display:block;width:100%;border-radius:10px;cursor:crosshair;touch-action:none';
    packHost.appendChild(cv);
    var hint = document.createElement('p');
    hint.className = 'fig__caption';
    hint.style.cssText = 'padding:.5rem 0 0;font-size:.78rem';
    hint.textContent = 'Drag inside the pack to move the sampling window.';
    packHost.appendChild(hint);

    /* --- geometry: 60 mm × 42 mm sample, grains 0.7–2.6 mm across ------ */
    var Wmm = 60, Hmm = 42, NX = 840, NY = 588, dxmm = Wmm / NX;
    var rand = rng(7717), grains = [];
    [[1.05, 2.10, 9000], [0.55, 1.05, 10000], [0.30, 0.55, 13000]].forEach(function (pass, pi) {
      for (var t = 0; t < pass[2]; t++) {
        var gx = rand() * (Wmm + 2) - 1, gy = rand() * (Hmm + 2) - 1;
        /* the fine filler thins out to the right, and packing loosens too,
           so the sample carries a genuine macroscopic porosity gradient   */
        if (pi === 2 && rand() < 0.10 + 0.85 * (gx / Wmm)) continue;
        var r = pass[0] + (pass[1] - pass[0]) * rand();
        var fac = 0.80 + 0.28 * (gx / Wmm);
        var ok = true;
        for (var q = 0; q < grains.length; q++) {
          var g = grains[q], ddx = g.x - gx, ddy = g.y - gy;
          if (ddx * ddx + ddy * ddy < Math.pow((g.r + r) * fac, 2)) { ok = false; break; }
        }
        if (ok) grains.push({ x: gx, y: gy, r: r });
      }
    });

    /* --- rasterise + summed-area table of the void indicator ---------- */
    var solid = new Uint8Array(NX * NY);
    var cellmm = 4.0, hash = {};
    grains.forEach(function (g, gi) {
      var i0 = Math.floor((g.x - g.r) / cellmm), i1 = Math.floor((g.x + g.r) / cellmm);
      var j0 = Math.floor((g.y - g.r) / cellmm), j1 = Math.floor((g.y + g.r) / cellmm);
      for (var a = i0; a <= i1; a++) for (var b = j0; b <= j1; b++) {
        var k = a + ',' + b; (hash[k] || (hash[k] = [])).push(gi);
      }
    });
    for (var j = 0; j < NY; j++) {
      var y = (j + 0.5) * dxmm;
      for (var i = 0; i < NX; i++) {
        var x = (i + 0.5) * dxmm;
        var list = hash[Math.floor(x / cellmm) + ',' + Math.floor(y / cellmm)], s = 0;
        if (list) for (var li = 0; li < list.length; li++) {
          var G = grains[list[li]], ex = G.x - x, ey = G.y - y;
          if (ex * ex + ey * ey < G.r * G.r) { s = 1; break; }
        }
        solid[j * NX + i] = s;
      }
    }
    var SAT = new Int32Array((NX + 1) * (NY + 1));       // integral image of voids
    for (var jj = 0; jj < NY; jj++) {
      var rowsum = 0;
      for (var ii = 0; ii < NX; ii++) {
        rowsum += solid[jj * NX + ii] ? 0 : 1;
        SAT[(jj + 1) * (NX + 1) + (ii + 1)] = SAT[jj * (NX + 1) + (ii + 1)] + rowsum;
      }
    }
    function voidFrac(cx, cy, L) {                        // cx,cy,L in mm
      var i0 = U.clamp(Math.round((cx - L / 2) / dxmm), 0, NX);
      var i1 = U.clamp(Math.round((cx + L / 2) / dxmm), 0, NX);
      var j0 = U.clamp(Math.round((cy - L / 2) / dxmm), 0, NY);
      var j1 = U.clamp(Math.round((cy + L / 2) / dxmm), 0, NY);
      if (i1 <= i0) i1 = Math.min(NX, i0 + 1);
      if (j1 <= j0) j1 = Math.min(NY, j0 + 1);
      var n = (i1 - i0) * (j1 - j0);
      var S = SAT[j1 * (NX + 1) + i1] - SAT[j0 * (NX + 1) + i1]
            - SAT[j1 * (NX + 1) + i0] + SAT[j0 * (NX + 1) + i0];
      return S / n;
    }

    /* --- pre-rendered pack ------------------------------------------- */
    var packCv = document.createElement('canvas');
    var PW = 900, PH = Math.round(PW * Hmm / Wmm);
    packCv.width = PW; packCv.height = PH;
    function paintPack() {
      var c = packCv.getContext('2d'), C = THM.C();
      c.clearRect(0, 0, PW, PH);
      c.fillStyle = THM.theme.isDark() ? '#0d1e29' : '#e2eef6';   // pore fluid
      c.fillRect(0, 0, PW, PH);
      var s = PW / Wmm;
      c.fillStyle = THM.theme.isDark() ? '#4b4b42' : '#b5b1a1';
      c.strokeStyle = THM.theme.isDark() ? '#63635a' : '#8b8676';
      c.lineWidth = 1;
      grains.forEach(function (g) {
        c.beginPath(); c.arc(g.x * s, g.y * s, g.r * s, 0, 6.2832);
        c.fill(); c.stroke();
      });
    }
    paintPack();

    var state = { cx: Wmm * 0.5, cy: Hmm * 0.5, L: 6 };

    var plot = THM.plot(plotHost, {
      height: 250, table: false,
      padL: 62,
      x: { min: 0.1, max: 60, log: true, label: 'window side  L  (mm)' },
      y: { min: 0, max: 1, label: 'measured porosity  φ', ticks: 5 },
      tipUnit: ''
    });

    var LS = [];
    for (var li2 = 0; li2 <= 140; li2++)
      LS.push(Math.pow(10, Math.log10(0.1) + (Math.log10(60) - Math.log10(0.1)) * li2 / 140));

    function curve() {
      return LS.map(function (L) { return [L, voidFrac(state.cx, state.cy, L)]; });
    }

    /* spread of the measurement over many window positions — the classic
       "which volume did you pick?" envelope. Computed once.              */
    var envHi = [], envLo = [], envMid = [];
    (function () {
      var r2 = rng(4242), NS = 48;
      LS.forEach(function (L) {
        var sum = 0, sum2 = 0;
        for (var k = 0; k < NS; k++) {
          var v = voidFrac(L / 2 + r2() * (Wmm - L), L / 2 + r2() * (Hmm - L), L);
          sum += v; sum2 += v * v;
        }
        var m = sum / NS, sd = Math.sqrt(Math.max(0, sum2 / NS - m * m));
        envMid.push([L, m]);
        envHi.push([L, Math.min(1, m + sd)]);
        envLo.push([L, Math.max(0, m - sd)]);
      });
    })();

    function drawPack() {
      var ctx = THM.fitCanvas(cv, Math.round((cv.clientWidth || 400) * Hmm / Wmm));
      var W = ctx.__w, H = ctx.__h, s = W / Wmm;
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(packCv, 0, 0, W, H);
      var L = state.L * s, x = state.cx * s, y = state.cy * s;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,.42)';
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.rect(x - L / 2, y - L / 2, L, L);
      ctx.fill('evenodd');
      ctx.restore();
      ctx.strokeStyle = THM.C().t; ctx.lineWidth = 2;
      ctx.strokeRect(x - L / 2, y - L / 2, L, L);
      /* corner ticks */
      ctx.fillStyle = THM.C().t;
      ctx.beginPath(); ctx.arc(x, y, 2.5, 0, 6.2832); ctx.fill();
    }

    var out;
    function update() {
      drawPack();
      var pts = curve();
      var phi = voidFrac(state.cx, state.cy, state.L);
      var C = THM.C();
      plot.set([
        { name: 'spread over window positions (±1σ)', color: C.ink4, pts: envMid, width: 1.5, dash: [4, 4] },
        { name: 'this window', color: C.h, pts: pts, width: 2.2 },
        { color: C.t, pts: [[state.L, phi]], marker: true, markerR: 5, noHover: true }
      ], {
        bands: [
          { x0: 0.1, x1: 3.6, color: THM.theme.isDark() ? 'rgba(217,89,38,.09)' : 'rgba(235,104,52,.08)' },
          { x0: 3.6, x1: 18, color: THM.theme.isDark() ? 'rgba(25,158,112,.10)' : 'rgba(27,175,122,.09)' },
          { x0: 18, x1: 60, color: THM.theme.isDark() ? 'rgba(57,135,229,.09)' : 'rgba(42,120,214,.08)' }
        ],
        before: function (ctx, P) {
          ctx.beginPath();
          envHi.forEach(function (q, i) { i ? ctx.lineTo(P.sx(q[0]), P.sy(q[1])) : ctx.moveTo(P.sx(q[0]), P.sy(q[1])); });
          for (var i = envLo.length - 1; i >= 0; i--) ctx.lineTo(P.sx(envLo[i][0]), P.sy(envLo[i][1]));
          ctx.closePath();
          ctx.fillStyle = C.ink4; ctx.globalAlpha = 0.16; ctx.fill(); ctx.globalAlpha = 1;
        },
        after: function (ctx, P) {
          ctx.font = '10px ' + THM.tok('sans');
          ctx.textAlign = 'center';
          ctx.fillStyle = C.ink4;
          var lastR = -1e9;
          [['pore scale', 0.55], ['REV plateau', 7.5], ['macroscopic', 36]].forEach(function (b) {
            var w = ctx.measureText(b[0]).width;
            var x = U.clamp(P.sx(b[1]), P.pl + w / 2 + 3, P.pl + P.pw - w / 2 - 3);
            if (x - w / 2 < lastR + 8) return;
            lastR = x + w / 2;
            ctx.fillText(b[0], x, P.pt + 12);
          });
          ctx.textAlign = 'left';
        }
      });
      if (out) {
        out.set('phi', phi.toFixed(3));
        out.set('L', state.L.toFixed(1) + '<small> mm</small>');
        out.set('n', (state.L / 1.9).toFixed(1) + '<small>× d₅₀</small>');
      }
    }

    /* --- controls ------------------------------------------------------ */
    var ctrls = document.createElement('div');
    ctrls.className = 'controls';
    host.appendChild(ctrls);
    var sL = THM.slider(ctrls, {
      label: 'Window side $L$', min: Math.log10(0.15), max: Math.log10(50), step: 0.005,
      value: Math.log10(6),
      map: function (v) { return Math.pow(10, v); }, unmap: function (v) { return Math.log10(v); },
      fmt: function (v) { return v.toFixed(v < 10 ? 2 : 1) + ' mm'; },
      on: function (v) { state.L = v; update(); }
    });
    THM.slider(ctrls, {
      label: 'Window position $x$', min: 0, max: 100, step: 0.5, value: 50,
      fmt: function (v) { return (v / 100 * Wmm).toFixed(0) + ' mm'; },
      on: function (v) { state.cx = v / 100 * Wmm; update(); }
    });
    var outHost = document.createElement('div');
    outHost.style.cssText = 'display:flex;align-items:center';
    ctrls.appendChild(outHost);
    out = THM.readouts(outHost, [
      { key: 'phi', label: 'φ in window' }, { key: 'L', label: 'window' }, { key: 'n', label: 'in grain diameters' }
    ]);

    /* --- dragging ------------------------------------------------------ */
    var dragging = false;
    function fromEvent(ev) {
      var r = cv.getBoundingClientRect();
      state.cx = U.clamp((ev.clientX - r.left) / r.width * Wmm, 0, Wmm);
      state.cy = U.clamp((ev.clientY - r.top) / r.height * Hmm, 0, Hmm);
      update();
    }
    cv.addEventListener('pointerdown', function (e) { dragging = true; cv.setPointerCapture(e.pointerId); fromEvent(e); });
    cv.addEventListener('pointermove', function (e) { if (dragging) fromEvent(e); });
    cv.addEventListener('pointerup', function () { dragging = false; });
    cv.addEventListener('wheel', function (e) {
      e.preventDefault();
      sL.set(U.clamp(state.L * (e.deltaY > 0 ? 1.12 : 0.89), 0.15, 50));
    }, { passive: false });

    new ResizeObserver(function () { drawPack(); }).observe(packHost);
    global.addEventListener('thm:theme', function () { paintPack(); update(); });
    update();
  });

  /* ============================================== 1.2  phase composition */

  THM.viz('phaseFig', function (host) {
    var body = host.querySelector('.fig__body');
    body.innerHTML =
      '<div class="phase">' +
        '<div class="phase__bar" role="img" aria-label="Stacked volume fractions of solid, water and gas"></div>' +
        '<div class="phase__out"></div>' +
      '</div>';
    var bar = body.querySelector('.phase__bar'), outHost = body.querySelector('.phase__out');

    var st = { phi: 0.40, S: 0.55, rs: 2650 };
    var out = THM.readouts(outHost, [
      { key: 'e',   label: 'Void ratio  e' },
      { key: 'th',  label: 'Volumetric water  θ' },
      { key: 'w',   label: 'Gravimetric water  w' },
      { key: 'rho', label: 'Bulk density  ρ' },
      { key: 'rd',  label: 'Dry density  ρ<sub>d</sub>' },
      { key: 'rsat',label: 'If saturated  ρ<sub>sat</sub>' }
    ]);
    outHost.querySelector('.readouts').style.cssText =
      'display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:.9rem 1rem';

    function render() {
      var fs = 1 - st.phi, fw = st.phi * st.S, fg = st.phi * (1 - st.S);
      var segs = [
        { k: 'Solid grains', v: fs, c: 'var(--c-m)' },
        { k: 'Water', v: fw, c: 'var(--c-h)' },
        { k: 'Gas', v: fg, c: 'var(--surface-3)', dark: true }
      ];
      bar.innerHTML = segs.map(function (s) {
        var pct = (s.v * 100);
        var showLabel = pct > 11;
        return '<div class="phase__seg" style="height:' + pct.toFixed(2) + '%;background:' + s.c + '">' +
          (showLabel ? '<span class="phase__lab' + (s.dark ? ' phase__lab--ink' : '') + '">' + s.k +
            ' <b>' + pct.toFixed(1) + '%</b></span>' : '') + '</div>';
      }).join('');

      var rw = 1000, e = st.phi / (1 - st.phi);
      var rho = fs * st.rs + fw * rw;
      var rd = fs * st.rs;
      var rsat = fs * st.rs + st.phi * rw;
      out.set('e', e.toFixed(2));
      out.set('th', (fw).toFixed(3) + '<small> m³/m³</small>');
      out.set('w', (100 * fw * rw / (fs * st.rs)).toFixed(1) + '<small> %</small>');
      out.set('rho', rho.toFixed(0) + '<small> kg/m³</small>');
      out.set('rd', rd.toFixed(0) + '<small> kg/m³</small>');
      out.set('rsat', rsat.toFixed(0) + '<small> kg/m³</small>');
    }

    var ctrls = document.createElement('div');
    ctrls.className = 'controls';
    host.appendChild(ctrls);
    THM.slider(ctrls, { label: 'Porosity $\\phi$', min: 0.02, max: 0.68, step: 0.005, value: st.phi,
      fmt: function (v) { return v.toFixed(3); }, on: function (v) { st.phi = v; render(); } });
    THM.slider(ctrls, { label: 'Saturation $S_w$', min: 0, max: 1, step: 0.005, value: st.S,
      fmt: function (v) { return (v * 100).toFixed(0) + ' %'; }, on: function (v) { st.S = v; render(); } });
    THM.slider(ctrls, { label: 'Grain density $\\rho_s$', min: 2200, max: 3100, step: 10, value: st.rs,
      fmt: function (v) { return v.toFixed(0) + ' kg/m³'; }, on: function (v) { st.rs = v; render(); } });

    render();
  });

  /* ========================================= 1.3  effective conductivity */

  var FLUIDS = { water: 0.60, air: 0.026, oil: 0.14, ice: 2.22 };

  THM.viz('lambdaFig', function (host) {
    var body = host.querySelector('.fig__body');
    body.innerHTML = '<div class="fig__split fig__split--wide"><div class="lam__plot"></div><div class="lam__out"></div></div>';
    var plotHost = body.querySelector('.lam__plot'), outHost = body.querySelector('.lam__out');

    var st = { ls: 3.0, lf: FLUIDS.water, phi: 0.25 };

    var plot = THM.plot(plotHost, {
      height: 280, table: true,
      x: { min: 0, max: 0.6, label: 'porosity  φ' },
      y: { min: 0.02, max: 8, log: true, label: 'λ  (W m⁻¹ K⁻¹)' },
      tipUnit: ' W/mK'
    });

    function models(phi) {
      var ls = st.ls, lf = st.lf, fs = 1 - phi;
      var ari = fs * ls + phi * lf;
      var har = 1 / (fs / ls + phi / lf);
      var geo = Math.pow(ls, fs) * Math.pow(lf, phi);
      /* Hashin–Shtrikman, 3-D, two phases */
      var hsU = ls + phi / (1 / (lf - ls) + fs / (3 * ls));
      var hsL = lf + fs / (1 / (ls - lf) + phi / (3 * lf));
      return { ari: ari, har: har, geo: geo, hsU: hsU, hsL: hsL };
    }

    var out = THM.readouts(outHost, [
      { key: 'geo', label: 'Geometric mean' },
      { key: 'hs',  label: 'HS bounds' },
      { key: 'wi',  label: 'Wiener bounds' },
      { key: 'sp',  label: 'Spread (upper ÷ lower)' }
    ]);
    outHost.querySelector('.readouts').style.cssText =
      'display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:.9rem 1rem';

    function update() {
      var C = THM.C(), N = 121;
      var ari = [], har = [], geo = [], hsU = [], hsL = [];
      for (var i = 0; i < N; i++) {
        var phi = 0.001 + 0.599 * i / (N - 1);
        var m = models(phi);
        ari.push([phi, m.ari]); har.push([phi, m.har]); geo.push([phi, m.geo]);
        hsU.push([phi, m.hsU]); hsL.push([phi, m.hsL]);
      }
      var here = models(st.phi);
      plot.setAxes(null, { min: Math.min(st.lf, here.har) * 0.55, max: Math.max(st.ls, here.ari) * 1.5 });
      plot.set([
        { name: 'Wiener bounds (layers ∥ and ⊥)', color: C.t, pts: ari, dash: [5, 4], width: 2 },
        { color: C.t, pts: har, dash: [5, 4], width: 2, noHover: true },
        { name: 'Hashin–Shtrikman bounds', color: C.s7, pts: hsU, dash: [2, 3], width: 2 },
        { color: C.s7, pts: hsL, dash: [2, 3], width: 2, noHover: true },
        { name: 'Geometric mean (practical estimate)', color: C.h, pts: geo, width: 2.4 },
        { color: C.m, pts: [[st.phi, here.geo]], marker: true, markerR: 5, noHover: true }
      ], {
        before: function (ctx, P) {
          ctx.beginPath();
          hsU.forEach(function (p, i) { i ? ctx.lineTo(P.sx(p[0]), P.sy(p[1])) : ctx.moveTo(P.sx(p[0]), P.sy(p[1])); });
          for (var i = hsL.length - 1; i >= 0; i--) ctx.lineTo(P.sx(hsL[i][0]), P.sy(hsL[i][1]));
          ctx.closePath();
          ctx.fillStyle = C.s7; ctx.globalAlpha = 0.09; ctx.fill(); ctx.globalAlpha = 1;
          /* vertical marker at the selected porosity */
          ctx.strokeStyle = C.m; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
          ctx.beginPath(); ctx.moveTo(P.sx(st.phi), P.pt); ctx.lineTo(P.sx(st.phi), P.pt + P.ph);
          ctx.stroke(); ctx.setLineDash([]);
        }
      });
      out.set('geo', here.geo.toFixed(2) + '<small> W/mK</small>');
      out.set('hs', here.hsL.toFixed(2) + ' – ' + here.hsU.toFixed(2));
      out.set('wi', here.har.toFixed(2) + ' – ' + here.ari.toFixed(2));
      out.set('sp', (here.ari / here.har).toFixed(1) + '<small>×</small>');
    }

    var ctrls = document.createElement('div');
    ctrls.className = 'controls';
    host.appendChild(ctrls);
    var fluidRow = document.createElement('div');
    fluidRow.style.cssText = 'grid-column:1/-1;display:flex;gap:.6rem;align-items:center;flex-wrap:wrap';
    fluidRow.innerHTML = '<span class="ctrl__label">Pore fluid</span>';
    ctrls.appendChild(fluidRow);
    THM.segmented(fluidRow, {
      label: 'Pore fluid', index: 0,
      options: [{ value: 'water', label: 'Water 0.60' }, { value: 'air', label: 'Air 0.026' },
                { value: 'oil', label: 'Oil 0.14' }, { value: 'ice', label: 'Ice 2.22' }],
      on: function (v) { st.lf = FLUIDS[v]; update(); }
    });
    THM.slider(ctrls, { label: 'Solid conductivity $\\lambda_s$', min: 0.5, max: 7, step: 0.05, value: st.ls,
      fmt: function (v) { return v.toFixed(2) + ' W/mK'; }, on: function (v) { st.ls = v; update(); } });
    THM.slider(ctrls, { label: 'Porosity $\\phi$', min: 0.01, max: 0.6, step: 0.005, value: st.phi,
      fmt: function (v) { return v.toFixed(3); }, on: function (v) { st.phi = v; update(); } });

    update();
  });

})(window);

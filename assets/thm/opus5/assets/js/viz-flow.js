/* =============================================================================
   Chapter 02 — Hydraulics
   · Darcy column with the Forchheimer departure computed, not sketched
   · Kozeny–Carman + the permeability spectrum of real materials
   · pressure diffusion from a step (erfc half-space)
   · van Genuchten retention + Mualem relative permeability
   · 1-D infiltration: Richards' equation, modified Picard (Celia et al. 1990)
   ========================================================================== */
(function (global) {
  'use strict';
  var THM = global.THM, U = THM.util;

  var G = 9.81, RHO = 1000;
  function muWater(Tc) { return 2.414e-5 * Math.pow(10, 247.8 / (Tc + 133.15)); }

  /* ==================================================== 2.1  Darcy column */

  THM.viz('darcyFig', function (host) {
    var body = host.querySelector('.fig__body');
    body.innerHTML = '<div class="fig__split"><div class="dc__col"></div><div class="dc__plot"></div></div>';
    var colHost = body.querySelector('.dc__col'), plotHost = body.querySelector('.dc__plot');

    var cv = document.createElement('canvas');
    cv.style.cssText = 'display:block;width:100%';
    colHost.appendChild(cv);

    var st = { dh: 0.6, logk: -9, T: 20, L: 0.5, phi: 0.35 };

    function props() {
      var k = Math.pow(10, st.logk), mu = muWater(st.T);
      var K = k * RHO * G / mu;
      var i = st.dh / st.L;
      var beta = 0.55 / Math.sqrt(k);                    // Ward (1964)
      var a = beta / G, b = mu / (RHO * G * k);
      var q = (-b + Math.sqrt(b * b + 4 * a * i)) / (2 * a);
      var qD = K * i;                                     // pure Darcy
      var d = Math.sqrt(k * 180 * Math.pow(1 - st.phi, 2) / Math.pow(st.phi, 3));
      var Re = RHO * q * d / mu;
      return { k: k, mu: mu, K: K, i: i, q: q, qD: qD, d: d, Re: Re, beta: beta };
    }

    var plot = THM.plot(plotHost, {
      height: 250, padL: 66,
      padR: 26,
      x: { min: 0, max: 4, label: 'hydraulic gradient  i  =  Δh / L' },
      y: { min: 0, max: 1, label: 'Darcy flux  q  (m s⁻¹)' }
    });

    var parts = [];
    for (var pi = 0; pi < 90; pi++) parts.push({ y: Math.random(), x: Math.random(), v: 0 });

    function drawCol(P) {
      var w = colHost.clientWidth || 320;
      var ctx = THM.fitCanvas(cv, Math.round(U.clamp(w * 0.82, 220, 330)));
      var W = ctx.__w, H = ctx.__h, C = THM.C();
      ctx.clearRect(0, 0, W, H);

      var cw = Math.min(96, W * 0.26), cx = W * 0.40, top = H * 0.16, ch = H * 0.66;

      /* head reservoirs, drawn to scale with Δh */
      var hMax = 1.4;
      var h1 = U.clamp(st.dh / hMax, 0, 1), h2 = 0;
      /* column body */
      ctx.fillStyle = THM.theme.isDark() ? '#1d1d19' : '#efeee7';
      ctx.strokeStyle = C.axis; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.rect(cx - cw / 2, top, cw, ch); ctx.fill(); ctx.stroke();

      /* sand grains */
      ctx.save();
      ctx.beginPath(); ctx.rect(cx - cw / 2, top, cw, ch); ctx.clip();
      ctx.fillStyle = THM.theme.isDark() ? '#43433a' : '#c2bda9';
      var seed = 1;
      for (var g = 0; g < 340; g++) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        var rx = cx - cw / 2 + (seed % 1000) / 1000 * cw;
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        var ry = top + (seed % 1000) / 1000 * ch;
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        var rr = 2 + (seed % 100) / 100 * 3.4;
        ctx.beginPath(); ctx.arc(rx, ry, rr, 0, 6.2832); ctx.fill();
      }
      /* tracers */
      ctx.fillStyle = C.h;
      parts.forEach(function (p) {
        ctx.beginPath();
        ctx.arc(cx - cw / 2 + p.x * cw, top + p.y * ch, 1.7, 0, 6.2832);
        ctx.fill();
      });
      ctx.restore();

      /* manometers */
      function mano(x, frac, label) {
        var tubeTop = top - 0.10 * H;
        var base = top + ch;
        ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, base); ctx.lineTo(x, tubeTop); ctx.stroke();
        var lvl = base - (0.12 + frac * 0.66) * H;
        ctx.strokeStyle = C.h; ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.moveTo(x, base); ctx.lineTo(x, lvl); ctx.stroke();
        ctx.fillStyle = C.ink3; ctx.font = '10.5px ' + THM.tok('sans');
        ctx.textAlign = 'center';
        ctx.fillText(label, x, tubeTop - 5);
        return lvl;
      }
      var l1 = mano(cx - cw / 2 - 26, h1, 'h₁');
      var l2 = mano(cx + cw / 2 + 26, h2, 'h₂');

      /* Δh bracket */
      ctx.strokeStyle = C.t; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cx - cw / 2 - 26, l1); ctx.lineTo(W - 12, l1);
      ctx.moveTo(cx + cw / 2 + 26, l2); ctx.lineTo(W - 12, l2);
      ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(W - 20, l1); ctx.lineTo(W - 20, l2); ctx.stroke();
      ctx.fillStyle = C.t; ctx.font = '600 11px ' + THM.tok('sans');
      ctx.textAlign = 'right';
      ctx.fillText('Δh = ' + st.dh.toFixed(2) + ' m', W - 26, (l1 + l2) / 2);

      /* flow arrow */
      ctx.fillStyle = C.ink4; ctx.font = '10.5px ' + THM.tok('sans');
      ctx.textAlign = 'center';
      ctx.fillText('L = ' + st.L.toFixed(2) + ' m', cx, top + ch + 16);
      ctx.textAlign = 'left';
    }

    var out;
    function update() {
      var P = props();
      drawCol(P);
      var N = 121, dar = [], forc = [];
      var imax = 4;
      /* express q in a decade unit so the axis ticks stay short */
      var ymaxRaw = Math.max(P.K * imax, 1e-14);
      var e = Math.floor(Math.log10(ymaxRaw)), uscale = Math.pow(10, e);
      for (var j = 0; j < N; j++) {
        var i = imax * j / (N - 1);
        var a = P.beta / G, b = P.mu / (RHO * G * P.k);
        dar.push([i, P.K * i / uscale]);
        forc.push([i, (-b + Math.sqrt(b * b + 4 * a * i)) / (2 * a) / uscale]);
      }
      var C = THM.C();
      plot.setAxes({ max: imax }, { min: 0, max: ymaxRaw / uscale * 1.06,
        label: 'Darcy flux  q  (×10' + U.sup(e) + ' m s⁻¹)' });
      plot.set([
        { name: 'Darcy (linear)', color: C.h, pts: dar, width: 2, dash: [5, 4] },
        { name: 'Forchheimer', color: C.t, pts: forc, width: 2.2 },
        { color: C.m, pts: [[P.i, P.q / uscale]], marker: true, markerR: 5, noHover: true }
      ]);
      if (out) {
        out.set('q', U.si(P.q, 2) + '<small> m/s</small>');
        out.set('K', U.si(P.K, 2) + '<small> m/s</small>');
        out.set('k', U.si(P.k, 1) + '<small> m²</small>');
        out.set('mu', (P.mu * 1e3).toFixed(2) + '<small> mPa·s</small>');
        out.set('d', (P.d * 1e3).toFixed(P.d < 1e-3 ? 3 : 2) + '<small> mm</small>');
        out.set('re', P.Re < 0.01 ? U.si(P.Re, 1) : P.Re.toFixed(2));
        out.set('dev', ((1 - P.q / P.qD) * 100).toFixed(1) + '<small> %</small>');
      }
      return P;
    }

    var ctrls = document.createElement('div');
    ctrls.className = 'controls';
    host.appendChild(ctrls);
    THM.slider(ctrls, { label: 'Head difference $\\Delta h$', min: 0.02, max: 1.4, step: 0.01, value: st.dh,
      fmt: function (v) { return v.toFixed(2) + ' m'; }, on: function (v) { st.dh = v; update(); } });
    THM.slider(ctrls, { label: 'Permeability $k$', min: -16, max: -7, step: 0.05, value: st.logk,
      fmt: function (v) { return U.si(Math.pow(10, v), 1) + ' m²'; },
      on: function (v) { st.logk = v; update(); } });
    THM.slider(ctrls, { label: 'Column length $L$', min: 0.1, max: 2, step: 0.01, value: st.L,
      fmt: function (v) { return v.toFixed(2) + ' m'; }, on: function (v) { st.L = v; update(); } });
    THM.slider(ctrls, { label: 'Temperature $T$', min: 5, max: 200, step: 1, value: st.T,
      fmt: function (v) { return v.toFixed(0) + ' °C'; }, on: function (v) { st.T = v; update(); } });

    var outHost = document.createElement('div');
    outHost.className = 'fig__foot';
    host.appendChild(outHost);
    out = THM.readouts(outHost, [
      { key: 'q', label: 'Darcy flux q' }, { key: 'K', label: 'Conductivity K' },
      { key: 'k', label: 'Permeability k' }, { key: 'mu', label: 'Viscosity μ' },
      { key: 'd', label: 'Implied grain size' }, { key: 're', label: 'Pore Reynolds Re' },
      { key: 'dev', label: 'Loss vs linear Darcy' }
    ]);
    outHost.querySelector('.readouts').style.cssText =
      'display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:.8rem 1rem';

    var P0 = update();
    THM.loop(host, function (dt) {
      var P = props();
      var vis = U.clamp(P.q / (1e-4), 0.004, 0.65);      // display speed
      parts.forEach(function (p) {
        p.y += vis * dt;
        if (p.y > 1) { p.y -= 1; p.x = Math.random(); }
      });
      drawCol(P);
    });
  });

  /* ============================================ 2.2  permeability spectrum */

  var MATERIALS = [
    ['Gravel',            1e-9,  1e-7],
    ['Clean sand',        1e-12, 1e-9],
    ['Silty sand',        1e-14, 1e-12],
    ['Silt, loess',       1e-16, 1e-13],
    ['Clay',              1e-21, 1e-17],
    ['Sandstone',         1e-17, 1e-12],
    ['Limestone (karst)', 1e-14, 1e-9],
    ['Fractured granite', 1e-16, 1e-12],
    ['Intact granite',    1e-21, 1e-18],
    ['Rock salt',         1e-23, 1e-20]
  ];

  THM.viz('permFig', function (host) {
    var body = host.querySelector('.fig__body');
    body.innerHTML = '<div class="fig__split"><div class="pm__kc"></div><div class="pm__spec"></div></div>';
    var kcHost = body.querySelector('.pm__kc'), specHost = body.querySelector('.pm__spec');

    var st = { d: 0.3e-3, phi: 0.35 };
    function kc(d, phi) { return Math.pow(phi, 3) / Math.pow(1 - phi, 2) * d * d / 180; }

    var plot = THM.plot(kcHost, {
      height: 270, padL: 62, table: false,
      padR: 34,
      x: { min: 1e-6, max: 1e-2, log: true, label: 'grain size  d₅₀  (m)' },
      y: { min: 1e-18, max: 1e-6, log: true, label: 'permeability  k  (m²)' }
    });

    var specCv = document.createElement('canvas');
    specCv.style.cssText = 'display:block;width:100%';
    specHost.appendChild(specCv);

    /* ordinal ramp: porosity is an ordered quantity, so one hue, stepped */
    var PHIS = [[0.20, '#86b6ef'], [0.30, '#3987e5'], [0.40, '#256abf'], [0.50, '#184f95']];

    function drawSpectrum() {
      var rowH = 21, pad = 8;
      var ctx = THM.fitCanvas(specCv, MATERIALS.length * rowH + 46);
      var W = ctx.__w, H = ctx.__h, C = THM.C();
      ctx.clearRect(0, 0, W, H);
      var labW = Math.min(126, W * 0.40), x0 = labW + 6, x1 = W - 10;
      var lo = -23, hi = -6;
      function X(k) { return x0 + (U.clamp(Math.log10(k), lo, hi) - lo) / (hi - lo) * (x1 - x0); }

      ctx.font = '10px ' + THM.tok('mono');
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      var lastR = -1e9;
      for (var e = lo; e <= hi; e += 2) {
        var x = X(Math.pow(10, e));
        ctx.beginPath(); ctx.moveTo(x + .5, pad); ctx.lineTo(x + .5, H - 26); ctx.stroke();
        var lab = '10' + U.sup(e), w = ctx.measureText(lab).width;
        if (x - w / 2 > lastR + 6) { ctx.fillStyle = C.ink4; ctx.fillText(lab, x, H - 22); lastR = x + w / 2; }
      }
      ctx.fillStyle = C.ink3; ctx.font = '10.5px ' + THM.tok('sans');
      ctx.fillText('permeability  k  (m²)', (x0 + x1) / 2, H - 10);

      ctx.textBaseline = 'middle';
      MATERIALS.forEach(function (m, i) {
        var y = pad + i * rowH + rowH / 2;
        ctx.textAlign = 'right'; ctx.fillStyle = C.ink2; ctx.font = '11.5px ' + THM.tok('sans');
        ctx.fillText(m[0], labW, y);
        var a = X(m[1]), b = X(m[2]);
        ctx.fillStyle = C.h; ctx.globalAlpha = 0.85;
        var r = 4;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(a, y - 4, Math.max(6, b - a), 8, r);
        else ctx.rect(a, y - 4, Math.max(6, b - a), 8);
        ctx.fill(); ctx.globalAlpha = 1;
      });

      /* current Kozeny–Carman value */
      var kNow = kc(st.d, st.phi), xk = X(kNow);
      ctx.strokeStyle = C.m; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(xk, pad - 2); ctx.lineTo(xk, H - 28); ctx.stroke();
      ctx.fillStyle = C.m; ctx.textAlign = 'left'; ctx.font = '600 10.5px ' + THM.tok('sans');
      var t = 'k = ' + U.si(kNow, 1);
      var tw = ctx.measureText(t).width;
      ctx.fillText(t, Math.min(xk + 6, W - tw - 4), pad + 4);
    }

    var out;
    function update() {
      var C = THM.C(), series = [];
      PHIS.forEach(function (P, pi2) {
        var pts = [];
        for (var i = 0; i <= 60; i++) {
          var d = Math.pow(10, -6 + 4 * i / 60);
          pts.push([d, kc(d, P[0])]);
        }
        series.push({ name: 'φ = ' + P[0].toFixed(2), color: P[1], pts: pts, width: 2,
          label: 'φ ' + P[0].toFixed(2), labelAt: 16 + pi2 * 11,
          labelAlign: 'center', labelDx: 0, labelDy: -10 });
      });
      series.push({ color: C.m, pts: [[st.d, kc(st.d, st.phi)]], marker: true, markerR: 5, noHover: true });
      plot.set(series);
      drawSpectrum();
      if (out) {
        var k = kc(st.d, st.phi);
        out.set('k', U.si(k, 2) + '<small> m²</small>');
        out.set('K', U.si(k * RHO * G / muWater(20), 2) + '<small> m/s</small>');
        out.set('D', (k / 0.9869e-12).toFixed(2) + '<small> darcy</small>');
      }
    }

    var ctrls = document.createElement('div');
    ctrls.className = 'controls';
    host.appendChild(ctrls);
    THM.slider(ctrls, { label: 'Grain size $d_{50}$', min: -6, max: -2, step: 0.02, value: Math.log10(st.d),
      map: function (v) { return Math.pow(10, v); }, unmap: function (v) { return Math.log10(v); },
      fmt: function (v) { return (v * 1e3).toPrecision(2) + ' mm'; },
      on: function (v) { st.d = v; update(); } });
    THM.slider(ctrls, { label: 'Porosity $\\phi$', min: 0.05, max: 0.6, step: 0.005, value: st.phi,
      fmt: function (v) { return v.toFixed(3); }, on: function (v) { st.phi = v; update(); } });
    var outHost = document.createElement('div');
    outHost.style.cssText = 'display:flex;align-items:center';
    ctrls.appendChild(outHost);
    out = THM.readouts(outHost, [
      { key: 'k', label: 'k (Kozeny–Carman)' }, { key: 'K', label: 'K at 20 °C' }, { key: 'D', label: 'in darcy' }
    ]);

    new ResizeObserver(function () { drawSpectrum(); }).observe(specHost);
    global.addEventListener('thm:theme', update);
    update();
  });

  /* ============================================== 2.3  pressure diffusion */

  THM.viz('diffFig', function (host) {
    var body = host.querySelector('.fig__body');
    var st = { c: 0.1, t: 0, dp: 1 };
    var plot = THM.plot(body, {
      height: 280, padL: 62,
      padR: 26,
      x: { min: 0, max: 200, label: 'distance from the boundary  x  (m)' },
      y: { min: 0, max: 1.02, label: 'p / Δp', ticks: 5 }
    });

    var GHOSTS = [1 / 16, 1 / 4, 4, 16];   // × the current time
    var out;

    function profile(t, xmax) {
      var pts = [];
      for (var i = 0; i <= 160; i++) {
        var x = xmax * i / 160;
        pts.push([x, t > 0 ? U.erfc(x / (2 * Math.sqrt(st.c * t))) : (x === 0 ? 1 : 0)]);
      }
      return pts;
    }

    function niceMax(v) {
      var e = Math.floor(Math.log10(v)), f = v / Math.pow(10, e);
      return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * Math.pow(10, e);
    }
    function update() {
      var C = THM.C();
      var pen = 2 * Math.sqrt(st.c * st.t);
      var xmax = niceMax(Math.max(1, 2.2 * 2 * Math.sqrt(st.c * st.t * 16)));
      plot.setAxes({ max: xmax }, null);
      var series = [];
      GHOSTS.forEach(function (f) {
        var pts = profile(st.t * f, xmax);
        /* label each ghost where it passes half the applied step */
        var at = 0;
        for (var i = 0; i < pts.length; i++) { if (pts[i][1] < 0.5) { at = i; break; } }
        series.push({ color: C.ink4, pts: pts, width: 1.2, alpha: 0.55, noHover: true,
          label: (f < 1 ? '÷' + Math.round(1 / f) : '×' + f) + ' t',
          labelAt: at, labelAlign: 'center', labelDx: 0, labelDy: -9 });
      });
      series.push({ name: 'p / Δp', color: C.h, pts: profile(st.t, xmax), width: 2.4, fill: true });
      if (st.t > 0 && pen < xmax)
        series.push({ color: C.t, pts: [[pen, U.erfc(1)]], marker: true, markerR: 5, noHover: true });
      plot.set(series, {
        after: function (ctx, P) {
          if (!(st.t > 0)) return;
          ctx.strokeStyle = C.t; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
          ctx.beginPath(); ctx.moveTo(P.sx(pen), P.pt); ctx.lineTo(P.sx(pen), P.pt + P.ph); ctx.stroke();
          ctx.setLineDash([]);
        }
      });
      if (out) {
        out.set('t', humanT(st.t));
        out.set('pen', pen.toFixed(1) + '<small> m</small>');
        out.set('c', U.si(st.c, 2) + '<small> m²/s</small>');
      }
    }
    function humanT(s) {
      if (s < 3600) return (s / 60).toFixed(0) + ' min';
      if (s < 172800) return (s / 3600).toFixed(1) + ' h';
      if (s < 3.15e7) return (s / 86400).toFixed(1) + ' d';
      return (s / 3.156e7).toFixed(1) + ' yr';
    }

    var ctrls = document.createElement('div');
    ctrls.className = 'controls';
    host.appendChild(ctrls);
    THM.slider(ctrls, { label: 'Hydraulic diffusivity $c$', min: -4, max: 1, step: 0.02, value: -1,
      map: function (v) { return Math.pow(10, v); }, unmap: function (v) { return Math.log10(v); },
      fmt: function (v) { return U.si(v, 1) + ' m²/s'; },
      on: function (v) { st.c = v; update(); } });
    var tS = THM.slider(ctrls, { label: 'Elapsed time $t$', min: 0, max: 4.2, step: 0.01, value: 1.6,
      map: function (v) { return Math.pow(10, v) * 86400; },
      unmap: function (v) { return Math.log10(v / 86400); },
      fmt: function (v) { return humanT(v); },
      on: function (v) { st.t = v; update(); } });
    var outHost = document.createElement('div');
    outHost.style.cssText = 'display:flex;align-items:center';
    ctrls.appendChild(outHost);
    out = THM.readouts(outHost, [
      { key: 't', label: 'time' }, { key: 'pen', label: 'penetration 2√(ct)' }, { key: 'c', label: 'diffusivity' }
    ]);

    st.t = Math.pow(10, 1.6) * 86400;
    update();

    /* gentle auto-advance so the figure breathes */
    var tau = 1.6;
    var loop = THM.loop(host, function (dt) {
      tau += dt * 0.10;
      if (tau > 4.2) tau = 0.2;
      tS.set(tau);
    });
    var tr = document.createElement('div');
    tr.style.cssText = 'display:flex;align-items:center';
    ctrls.appendChild(tr);
    THM.transport(tr, { toggle: function () { return loop.toggle(); },
      reset: function () { tau = 0.2; tS.set(tau); } });
  });

  /* ============================================ 2.4  retention curves (vG) */

  var SOILS = {
    sand:  { name: 'Sand',      tr: 0.045, ts: 0.43, a: 14.5, n: 2.68, Ks: 8.25e-5 },
    loam:  { name: 'Loam',      tr: 0.078, ts: 0.43, a: 3.6,  n: 1.56, Ks: 2.89e-6 },
    silt:  { name: 'Silt',      tr: 0.034, ts: 0.46, a: 1.6,  n: 1.37, Ks: 6.94e-7 },
    clay:  { name: 'Clay',      tr: 0.068, ts: 0.38, a: 0.8,  n: 1.09, Ks: 5.56e-7 }
  };

  function vgSe(psi, a, n) {                 // psi = suction head (m, positive)
    if (psi <= 0) return 1;
    var m = 1 - 1 / n;
    return Math.pow(1 + Math.pow(a * psi, n), -m);
  }
  function mualem(Se, n) {
    var m = 1 - 1 / n;
    Se = U.clamp(Se, 1e-9, 1);
    var t = 1 - Math.pow(1 - Math.pow(Se, 1 / m), m);
    return Math.sqrt(Se) * t * t;
  }

  THM.viz('vgFig', function (host) {
    var body = host.querySelector('.fig__body');
    body.innerHTML = '<div class="fig__split"><div class="vg__a"></div><div class="vg__b"></div></div>';
    var st = Object.assign({}, SOILS.loam);

    var pA = THM.plot(body.querySelector('.vg__a'), {
      height: 260, padL: 58, padR: 30, table: false,
      x: { min: 0.01, max: 1000, log: true, label: 'suction head  |ψ|  (m)' },
      y: { min: 0, max: 0.5, label: 'water content  θ' }
    });
    var pB = THM.plot(body.querySelector('.vg__b'), {
      height: 260, padL: 58, table: false,
      x: { min: 0, max: 1, label: 'effective saturation  Se' },
      y: { min: 1e-6, max: 1, log: true, label: 'relative permeability  kr' }
    });

    var ctrls = document.createElement('div');
    ctrls.className = 'controls';
    host.appendChild(ctrls);
    var presetRow = document.createElement('div');
    presetRow.style.cssText = 'grid-column:1/-1;display:flex;gap:.6rem;align-items:center;flex-wrap:wrap';
    presetRow.innerHTML = '<span class="ctrl__label">Soil</span>';
    ctrls.appendChild(presetRow);

    var sliders = {};
    THM.segmented(presetRow, {
      label: 'Soil', index: 1,
      options: Object.keys(SOILS).map(function (k) { return { value: k, label: SOILS[k].name }; }),
      on: function (v) {
        Object.assign(st, SOILS[v]);
        sliders.a.value = st.a; sliders.n.value = st.n;
        sliders.tr.value = st.tr; sliders.ts.value = st.ts;
        update();
      }
    });
    sliders.a = THM.slider(ctrls, { label: 'Air-entry inverse $\\alpha$', min: 0.2, max: 20, step: 0.05, value: st.a,
      fmt: function (v) { return v.toFixed(2) + ' m⁻¹'; }, on: function (v) { st.a = v; update(); } });
    sliders.n = THM.slider(ctrls, { label: 'Pore-size index $n$', min: 1.03, max: 4, step: 0.01, value: st.n,
      fmt: function (v) { return v.toFixed(2); }, on: function (v) { st.n = v; update(); } });
    sliders.tr = THM.slider(ctrls, { label: 'Residual $\\theta_r$', min: 0, max: 0.2, step: 0.002, value: st.tr,
      fmt: function (v) { return v.toFixed(3); }, on: function (v) { st.tr = v; update(); } });
    sliders.ts = THM.slider(ctrls, { label: 'Saturated $\\theta_s$', min: 0.25, max: 0.6, step: 0.002, value: st.ts,
      fmt: function (v) { return v.toFixed(3); }, on: function (v) { st.ts = v; update(); } });

    function update() {
      var C = THM.C(), ret = [], krc = [];
      for (var i = 0; i <= 160; i++) {
        var psi = Math.pow(10, -2 + 5 * i / 160);
        ret.push([psi, st.tr + (st.ts - st.tr) * vgSe(psi, st.a, st.n)]);
      }
      for (var j = 1; j <= 160; j++) {
        var Se = j / 160;
        krc.push([Se, Math.max(1e-7, mualem(Se, st.n))]);
      }
      pA.setAxes(null, { min: 0, max: Math.max(0.5, st.ts * 1.12) });
      pA.set([{ name: 'θ(ψ)', color: C.h, pts: ret, width: 2.4, fill: true, fillBase: 0 }], {
        after: function (ctx, P) {
          ctx.strokeStyle = C.axis; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(P.pl, P.sy(st.tr)); ctx.lineTo(P.pl + P.pw, P.sy(st.tr));
          ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = C.ink4; ctx.font = '10.5px ' + THM.tok('sans');
          ctx.fillText('residual  θr', P.pl + 6, P.sy(st.tr) - 8);
          ctx.fillText('saturated  θs', P.pl + 6, P.sy(st.ts) + 13);
        }
      });
      pB.set([{ name: 'kr (Mualem)', color: C.m, pts: krc, width: 2.4 }]);
    }
    update();
  });

  /* ================================== 2.5  Richards infiltration (Picard) */

  THM.viz('richardsFig', function (host) {
    var body = host.querySelector('.fig__body');
    body.innerHTML = '<div class="fig__split fig__split--wide"><div class="ri__a"></div><div class="ri__b"></div></div>';

    var soil = Object.assign({}, SOILS.loam);
    var N = 141, Ztot = 1.2, dz = Ztot / (N - 1);
    var h = new Float64Array(N), hOld = new Float64Array(N);
    var hInit = -3.0, hTop = 0.02, t = 0, cum = 0, hist = [], ghosts = [];

    function theta(hh) { return soil.tr + (soil.ts - soil.tr) * vgSe(-hh, soil.a, soil.n); }
    function Kof(hh) { return soil.Ks * mualem(vgSe(-hh, soil.a, soil.n), soil.n); }
    function Cap(hh) {                                     // dθ/dh, with a floor
      if (hh >= 0) return 1e-6;
      var m = 1 - 1 / soil.n, u = -soil.a * hh;
      var dSe = soil.a * m * soil.n * Math.pow(u, soil.n - 1) * Math.pow(1 + Math.pow(u, soil.n), -m - 1);
      return (soil.ts - soil.tr) * dSe + 1e-6;
    }

    function reset() {
      for (var i = 0; i < N; i++) h[i] = hInit;
      h[0] = hTop; t = 0; cum = 0; hist = []; ghosts = [];
    }
    reset();

    /* Thomas algorithm */
    var aa = new Float64Array(N), bb = new Float64Array(N), cc = new Float64Array(N),
        dd = new Float64Array(N), cp = new Float64Array(N), dp2 = new Float64Array(N);
    function tridiag(n) {
      cp[0] = cc[0] / bb[0]; dp2[0] = dd[0] / bb[0];
      for (var i = 1; i < n; i++) {
        var den = bb[i] - aa[i] * cp[i - 1];
        cp[i] = cc[i] / den;
        dp2[i] = (dd[i] - aa[i] * dp2[i - 1]) / den;
      }
      var x = new Float64Array(n);
      x[n - 1] = dp2[n - 1];
      for (var j = n - 2; j >= 0; j--) x[j] = dp2[j] - cp[j] * x[j + 1];
      return x;
    }

    /** One backward-Euler step with the mixed-form modified Picard iteration. */
    function step(dt) {
      hOld.set(h);
      var thOld = new Float64Array(N);
      for (var i = 0; i < N; i++) thOld[i] = theta(hOld[i]);
      var hk = Float64Array.from(h);

      for (var it = 0; it < 12; it++) {
        for (var i2 = 0; i2 < N; i2++) {
          if (i2 === 0 || i2 === N - 1) {                 // Dirichlet at both ends
            aa[i2] = 0; bb[i2] = 1; cc[i2] = 0;
            dd[i2] = (i2 === 0 ? hTop : hInit);
            continue;
          }
          var Kup = 0.5 * (Kof(hk[i2 - 1]) + Kof(hk[i2]));
          var Kdn = 0.5 * (Kof(hk[i2]) + Kof(hk[i2 + 1]));
          var C0 = Cap(hk[i2]);
          aa[i2] = -Kup / (dz * dz);
          cc[i2] = -Kdn / (dz * dz);
          bb[i2] = C0 / dt + (Kup + Kdn) / (dz * dz);
          dd[i2] = C0 / dt * hk[i2] - (theta(hk[i2]) - thOld[i2]) / dt
                 - (Kdn - Kup) / dz;                       // gravity term
        }
        var hn = tridiag(N);
        var err = 0;
        for (var i3 = 0; i3 < N; i3++) { err = Math.max(err, Math.abs(hn[i3] - hk[i3])); hk[i3] = hn[i3]; }
        if (err < 1e-6) break;
      }
      h.set(hk);
      /* infiltration flux at the surface */
      var Ks0 = 0.5 * (Kof(h[0]) + Kof(h[1]));
      var q0 = -Ks0 * ((h[1] - h[0]) / dz - 1);
      cum += Math.max(0, q0) * dt;
      t += dt;
      hist.push([t / 3600, cum * 1000]);
      if (hist.length > 1200) hist.shift();
    }

    var pA = THM.plot(body.querySelector('.ri__a'), {
      height: 300, padL: 60, table: false,
      x: { min: 0, max: 0.55, label: 'water content  θ' },
      y: { min: 0, max: Ztot, reverse: true, label: 'depth  z  (m)' }
    });
    var pB = THM.plot(body.querySelector('.ri__b'), {
      height: 300, padL: 60, table: false,
      x: { min: 0, max: 12, label: 'time  (h)' },
      y: { min: 0, max: 60, label: 'cumulative infiltration  (mm)' }
    });

    var out;
    function draw() {
      var C = THM.C(), prof = [];
      for (var i = 0; i < N; i++) prof.push([theta(h[i]), i * dz]);
      var series = ghosts.map(function (g) {
        return { color: C.ink4, pts: g, width: 1.2, alpha: 0.5, noHover: true };
      });
      series.push({ name: 'θ(z)', color: C.h, pts: prof, width: 2.4, fill: true, fillBase: 0 });
      pA.setAxes({ min: 0, max: Math.max(0.5, soil.ts * 1.1) }, null);
      pA.set(series);

      pB.setAxes({ max: Math.max(2, t / 3600 * 1.15) }, { max: Math.max(10, cum * 1000 * 1.2) });
      pB.set([{ name: 'cumulative infiltration', color: C.m, pts: hist, width: 2.2, endDot: true }]);

      /* wetting-front depth: steepest θ gradient */
      var zf = 0, best = 0;
      for (var j = 1; j < N; j++) {
        var g = Math.abs(theta(h[j]) - theta(h[j - 1]));
        if (g > best) { best = g; zf = j * dz; }
      }
      if (out) {
        out.set('t', (t / 3600).toFixed(2) + '<small> h</small>');
        out.set('cum', (cum * 1000).toFixed(1) + '<small> mm</small>');
        out.set('zf', zf.toFixed(3) + '<small> m</small>');
        out.set('q', U.si(Math.max(0, (hist.length > 1 ?
          (hist[hist.length - 1][1] - hist[hist.length - 2][1]) / 1000 /
          ((hist[hist.length - 1][0] - hist[hist.length - 2][0]) * 3600) : 0)), 2) + '<small> m/s</small>');
      }
    }

    var ctrls = document.createElement('div');
    ctrls.className = 'controls';
    host.appendChild(ctrls);
    var row = document.createElement('div');
    row.style.cssText = 'grid-column:1/-1;display:flex;gap:.7rem;align-items:center;flex-wrap:wrap';
    row.innerHTML = '<span class="ctrl__label">Soil</span>';
    ctrls.appendChild(row);
    THM.segmented(row, {
      label: 'Soil', index: 1,
      options: ['sand', 'loam', 'silt'].map(function (k) { return { value: k, label: SOILS[k].name }; }),
      on: function (v) { Object.assign(soil, SOILS[v]); reset(); draw(); }
    });
    THM.slider(ctrls, { label: 'Initial suction head', min: -8, max: -0.3, step: 0.05, value: hInit,
      fmt: function (v) { return v.toFixed(2) + ' m'; },
      on: function (v) { hInit = v; reset(); draw(); } });
    THM.slider(ctrls, { label: 'Ponding depth at surface', min: 0, max: 0.15, step: 0.002, value: hTop,
      fmt: function (v) { return (v * 1000).toFixed(0) + ' mm'; },
      on: function (v) { hTop = v; reset(); draw(); } });

    var outHost = document.createElement('div');
    outHost.className = 'fig__foot';
    host.appendChild(outHost);
    out = THM.readouts(outHost, [
      { key: 't', label: 'simulated time' }, { key: 'cum', label: 'infiltrated' },
      { key: 'zf', label: 'wetting front' }, { key: 'q', label: 'surface flux' }
    ]);
    outHost.querySelector('.readouts').style.cssText =
      'display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:.8rem 1rem';

    var nextGhost = 900;
    var loop = THM.loop(host, function () {
      for (var s = 0; s < 4; s++) {
        var dt = U.clamp(6 + t / 60, 6, 90);
        step(dt);
        if (t > nextGhost && ghosts.length < 6) {
          var g = [];
          for (var i = 0; i < N; i++) g.push([theta(h[i]), i * dz]);
          ghosts.push(g); nextGhost *= 3;
        }
      }
      if (t > 12 * 3600) { reset(); nextGhost = 900; }
      draw();
    });
    var tr2 = document.createElement('div');
    tr2.style.cssText = 'display:flex;align-items:center';
    ctrls.appendChild(tr2);
    THM.transport(tr2, {
      toggle: function () { return loop.toggle(); },
      reset: function () { reset(); nextGhost = 900; draw(); }
    });
    draw();
  });

})(window);

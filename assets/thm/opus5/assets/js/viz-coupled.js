/* =============================================================================
   Chapter 05 — The coupled system
   · Terzaghi 1-D consolidation (Fourier series, 200 terms)
   · Mandel's problem (Abousleiman et al. form; eigenvalues by bisection)
   · thermal pressurisation of a heated column — a live 1-D THM solver
   ========================================================================== */
(function (global) {
  'use strict';
  var THM = global.THM, U = THM.util;

  /* ================================================ 5.1  Terzaghi 1-D      */

  function terzaghiP(Z, Tv, nTerms) {
    if (Tv <= 0) return 1;
    var s = 0;
    for (var m = 0; m < (nTerms || 200); m++) {
      var M = Math.PI / 2 * (2 * m + 1);
      var e = Math.exp(-M * M * Tv);
      if (e < 1e-14 && m > 4) break;
      s += 2 / M * Math.sin(M * Z) * e;
    }
    return s;
  }
  function terzaghiU(Tv) {
    if (Tv <= 0) return 0;
    var s = 0;
    for (var m = 0; m < 200; m++) {
      var M = Math.PI / 2 * (2 * m + 1);
      var e = Math.exp(-M * M * Tv);
      if (e < 1e-14 && m > 4) break;
      s += 2 / (M * M) * e;
    }
    return 1 - s;
  }

  THM.viz('terzaghiFig', function (host) {
    var body = host.querySelector('.fig__body');
    body.innerHTML = '<div class="fig__split"><div class="tz__a"></div><div class="tz__b"></div></div>';

    var st = { Tv: 0.05, cv: 1e-6, H: 5, double: false };
    var GH = [0.008, 0.02, 0.05, 0.1, 0.2, 0.4, 0.848, 2];

    var pA = THM.plot(body.querySelector('.tz__a'), {
      height: 300, padL: 62, padR: 30, table: false,
      x: { min: 0, max: 1.02, label: 'excess pore pressure  p / σ₀' },
      y: { min: 0, max: 1, reverse: true, label: 'depth  Z = z / H' }
    });
    var pB = THM.plot(body.querySelector('.tz__b'), {
      height: 300, padL: 62, padR: 30, table: false,
      x: { min: 0.001, max: 3, log: true, label: 'time factor  Tᵥ = cᵥ t / H²' },
      y: { min: 0, max: 1, reverse: true, label: 'degree of consolidation  U' }
    });

    var out;
    function iso(Tv) {
      var pts = [];
      for (var i = 0; i <= 120; i++) {
        var Z = i / 120;
        pts.push([terzaghiP(Z, Tv), Z]);
      }
      return pts;
    }

    function update() {
      var C = THM.C();
      var series = GH.map(function (T) {
        return { color: C.ink4, pts: iso(T), width: 1.2, alpha: 0.55, noHover: true,
          label: 'Tᵥ ' + T, labelAt: 60, labelAlign: 'center', labelDy: -8 };
      });
      series.push({ name: 'p / σ₀ now', color: C.h, pts: iso(st.Tv), width: 2.6, fill: true, fillBase: 0 });
      pA.set(series);

      var Uc = [];
      for (var i = 0; i <= 200; i++) {
        var Tv = Math.pow(10, -3 + 3.48 * i / 200);
        Uc.push([Tv, terzaghiU(Tv)]);
      }
      pB.set([
        { name: 'U(Tᵥ)', color: C.m, pts: Uc, width: 2.4 },
        { color: C.t, pts: [[st.Tv, terzaghiU(st.Tv)]], marker: true, markerR: 5, noHover: true }
      ], {
        after: function (ctx, P) {
          ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
          [[0.197, '50%'], [0.848, '90%']].forEach(function (m) {
            ctx.beginPath();
            ctx.moveTo(P.sx(m[0]), P.pt); ctx.lineTo(P.sx(m[0]), P.sy(m[1] === '50%' ? 0.5 : 0.9));
            ctx.lineTo(P.pl, P.sy(m[1] === '50%' ? 0.5 : 0.9));
            ctx.stroke();
          });
          ctx.setLineDash([]);
          ctx.fillStyle = C.ink4; ctx.font = '10px ' + THM.tok('sans');
          ctx.textAlign = 'left';
          ctx.fillText('Tᵥ = 0.197', P.sx(0.197) + 4, P.sy(0.5) - 6);
          ctx.textAlign = 'right';
          ctx.fillText('Tᵥ = 0.848', P.sx(0.848) - 5, P.sy(0.9) - 6);
          ctx.textAlign = 'left';
        }
      });

      if (out) {
        var Hd = st.double ? st.H / 2 : st.H;
        var t = st.Tv * Hd * Hd / st.cv;
        out.set('Tv', st.Tv.toFixed(3));
        out.set('U', (terzaghiU(st.Tv) * 100).toFixed(1) + '<small> %</small>');
        out.set('t', humanT(t));
        out.set('t90', humanT(0.848 * Hd * Hd / st.cv));
        out.set('Hd', Hd.toFixed(2) + '<small> m</small>');
      }
    }
    function humanT(s) {
      if (s < 7200) return (s / 60).toFixed(0) + ' min';
      if (s < 1.7e5) return (s / 3600).toFixed(1) + ' h';
      if (s < 3.15e7) return (s / 86400).toFixed(1) + ' d';
      if (s < 3.15e10) return (s / 3.156e7).toFixed(1) + ' yr';
      return U.si(s / 3.156e7, 1) + ' yr';
    }

    var ctrls = document.createElement('div');
    ctrls.className = 'controls';
    host.appendChild(ctrls);
    var tS = THM.slider(ctrls, { label: 'Time factor $T_v$', min: -3, max: 0.48, step: 0.005,
      value: Math.log10(st.Tv),
      map: function (v) { return Math.pow(10, v); }, unmap: function (v) { return Math.log10(v); },
      fmt: function (v) { return v.toFixed(v < 0.01 ? 4 : 3); },
      on: function (v) { st.Tv = v; update(); } });
    THM.slider(ctrls, { label: 'Layer thickness $H$', min: 0.5, max: 30, step: 0.1, value: st.H,
      fmt: function (v) { return v.toFixed(1) + ' m'; }, on: function (v) { st.H = v; update(); } });
    THM.slider(ctrls, { label: 'Consolidation coefficient $c_v$', min: -9, max: -4, step: 0.02,
      value: Math.log10(st.cv),
      map: function (v) { return Math.pow(10, v); }, unmap: function (v) { return Math.log10(v); },
      fmt: function (v) { return U.si(v, 1) + ' m²/s'; }, on: function (v) { st.cv = v; update(); } });
    var dbl = document.createElement('label');
    dbl.className = 'switch';
    dbl.innerHTML = '<input type="checkbox"> Drained both sides';
    dbl.querySelector('input').addEventListener('change', function (e) {
      st.double = e.target.checked; update();
    });
    ctrls.appendChild(dbl);

    var outHost = document.createElement('div');
    outHost.className = 'fig__foot';
    host.appendChild(outHost);
    out = THM.readouts(outHost, [
      { key: 'Tv', label: 'Time factor Tᵥ' }, { key: 'U', label: 'Consolidation U' },
      { key: 't', label: 'Real time' }, { key: 't90', label: 'Time to 90 %' },
      { key: 'Hd', label: 'Drainage path' }
    ]);
    outHost.querySelector('.readouts').style.cssText =
      'display:grid;grid-template-columns:repeat(auto-fit,minmax(126px,1fr));gap:.8rem 1rem';

    update();
    var tau = -3;
    var loop = THM.loop(host, function (dt) {
      tau += dt * 0.42;
      if (tau > 0.48) tau = -3;
      tS.set(Math.pow(10, tau));
    });
    var tr = document.createElement('div');
    tr.style.cssText = 'display:flex;align-items:center';
    ctrls.appendChild(tr);
    THM.transport(tr, { toggle: function () { return loop.toggle(); },
      reset: function () { tau = -3; tS.set(Math.pow(10, tau)); } });
  });

  /* ==================================================== 5.2  Mandel        */

  function mandelRoots(nu, nuu, N) {
    var k = (1 - nu) / (nuu - nu);
    var roots = [];
    for (var n = 0; n < N; n++) {
      var lo = n * Math.PI + 1e-8, hi = n * Math.PI + Math.PI / 2 - 1e-8;
      var f = function (a) { return Math.tan(a) - k * a; };
      /* f(lo) < 0 and f(hi) → +∞, so a sign change is guaranteed */
      roots.push(U.bisect(f, lo, hi, 1e-12, 120));
    }
    return roots;
  }
  /** p(x,t)/p0 for Mandel's problem; X = x/a, tau = c t / a². */
  function mandelP(X, tau, roots) {
    var s = 0;
    for (var n = 0; n < roots.length; n++) {
      var a = roots[n], sa = Math.sin(a), ca = Math.cos(a);
      var den = a - sa * ca;
      if (Math.abs(den) < 1e-12) continue;
      var e = Math.exp(-a * a * tau);
      if (e < 1e-16 && n > 3) break;
      s += (sa / den) * (Math.cos(a * X) - ca) * e;
    }
    return 2 * s;
  }
  /** Vertical settlement, normalised so that it starts at 1 (undrained). */
  function mandelW(tau, roots, nu, nuu) {
    var s = 0;
    for (var n = 0; n < roots.length; n++) {
      var a = roots[n], sa = Math.sin(a), ca = Math.cos(a);
      var den = a - sa * ca;
      if (Math.abs(den) < 1e-12) continue;
      s += (sa * ca / den) * Math.exp(-a * a * tau);
    }
    return (1 - nu) / 2 - (nuu - nu) * s;
  }

  THM.viz('mandelFig', function (host) {
    var body = host.querySelector('.fig__body');
    body.innerHTML = '<div class="fig__split"><div class="md__a"></div><div class="md__b"></div></div>';

    var st = { nu: 0.2, nuu: 0.44, tau: 0.02 };
    var roots = mandelRoots(st.nu, st.nuu, 60);

    var pA = THM.plot(body.querySelector('.md__a'), {
      height: 290, padL: 62, padR: 30, table: false,
      x: { min: 0, max: 1, label: 'position across the sample  x / a' },
      y: { min: 0, max: 1.6, label: 'pore pressure  p / p₀' }
    });
    var pB = THM.plot(body.querySelector('.md__b'), {
      height: 290, padL: 62, padR: 30, table: false,
      x: { min: 1e-4, max: 3, log: true, label: 'dimensionless time  τ = c t / a²' },
      y: { min: 0, max: 1.6, label: 'p / p₀ at the centre' }
    });

    var GH = [0.001, 0.01, 0.05, 0.15, 0.4, 1.0];
    var out;

    function prof(tau) {
      var pts = [];
      for (var i = 0; i <= 120; i++) {
        var X = i / 120;
        pts.push([X, Math.max(0, mandelP(X, tau, roots))]);
      }
      return pts;
    }

    function update() {
      var C = THM.C();
      var series = GH.map(function (t) {
        return { color: C.ink4, pts: prof(t), width: 1.2, alpha: 0.5, noHover: true,
          label: 'τ ' + t, labelAt: 6, labelAlign: 'left', labelDy: -8 };
      });
      series.push({ name: 'p / p₀ now', color: C.h, pts: prof(st.tau), width: 2.6, fill: true, fillBase: 0 });
      pA.set(series);

      var hist = [], peak = 0, peakT = 0;
      for (var i = 0; i <= 220; i++) {
        var tt = Math.pow(10, -4 + 4.48 * i / 220);
        var v = mandelP(0, tt, roots);
        hist.push([tt, Math.max(0, v)]);
        if (v > peak) { peak = v; peakT = tt; }
      }
      pB.set([
        { name: 'centre pressure', color: C.t, pts: hist, width: 2.6 },
        { color: C.m, pts: [[st.tau, Math.max(0, mandelP(0, st.tau, roots))]], marker: true, markerR: 5, noHover: true }
      ], {
        after: function (ctx, P) {
          ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
          ctx.beginPath(); ctx.moveTo(P.pl, P.sy(1)); ctx.lineTo(P.pl + P.pw, P.sy(1)); ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = C.ink4; ctx.font = '10.5px ' + THM.tok('sans');
          ctx.fillText('Skempton value at t → 0', P.pl + 6, P.sy(1) - 7);
          if (peak > 1.005) {
            ctx.fillStyle = C.t;
            ctx.fillText('overshoot ' + ((peak - 1) * 100).toFixed(0) + ' %',
              P.sx(peakT) + 6, P.sy(peak) - 8);
          }
        }
      });

      if (out) {
        out.set('ov', peak > 1.001 ? '+' + ((peak - 1) * 100).toFixed(1) + '<small> %</small>' : 'none');
        out.set('tp', U.si(peakT, 2));
        out.set('a1', roots[0].toFixed(4));
        out.set('B', ((3 * (st.nuu - st.nu)) / ((1 - 2 * st.nu) * (1 + st.nuu))).toFixed(3));
      }
    }

    var ctrls = document.createElement('div');
    ctrls.className = 'controls';
    host.appendChild(ctrls);
    var tS = THM.slider(ctrls, { label: 'Dimensionless time $\\tau$', min: -4, max: 0.48, step: 0.005,
      value: Math.log10(st.tau),
      map: function (v) { return Math.pow(10, v); }, unmap: function (v) { return Math.log10(v); },
      fmt: function (v) { return U.si(v, 2); }, on: function (v) { st.tau = v; update(); } });
    THM.slider(ctrls, { label: 'Drained Poisson $\\nu$', min: 0, max: 0.4, step: 0.005, value: st.nu,
      fmt: function (v) { return v.toFixed(3); },
      on: function (v) { st.nu = Math.min(v, st.nuu - 0.01); roots = mandelRoots(st.nu, st.nuu, 60); update(); } });
    THM.slider(ctrls, { label: 'Undrained Poisson $\\nu_u$', min: 0.05, max: 0.49, step: 0.005, value: st.nuu,
      fmt: function (v) { return v.toFixed(3); },
      on: function (v) { st.nuu = Math.max(v, st.nu + 0.01); roots = mandelRoots(st.nu, st.nuu, 60); update(); } });

    var outHost = document.createElement('div');
    outHost.className = 'fig__foot';
    host.appendChild(outHost);
    out = THM.readouts(outHost, [
      { key: 'ov', label: 'Peak overshoot' }, { key: 'tp', label: 'τ at the peak' },
      { key: 'a1', label: 'First eigenvalue α₁' }, { key: 'B', label: 'Implied Skempton B' }
    ]);
    outHost.querySelector('.readouts').style.cssText =
      'display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:.8rem 1rem';

    update();
    var tau = -4;
    var loop = THM.loop(host, function (dt) {
      tau += dt * 0.5;
      if (tau > 0.48) tau = -4;
      tS.set(Math.pow(10, tau));
    });
    var tr = document.createElement('div');
    tr.style.cssText = 'display:flex;align-items:center';
    ctrls.appendChild(tr);
    THM.transport(tr, { toggle: function () { return loop.toggle(); },
      reset: function () { tau = -4; tS.set(Math.pow(10, tau)); } });
  });

  /* ============================== 5.3  heated column: a live 1-D THM solve */

  THM.viz('thermFig', function (host) {
    var body = host.querySelector('.fig__body');
    body.innerHTML = '<div class="fig__split fig__split--wide"><div class="th__a"></div><div class="th__b"></div></div>';

    var N = 101, H = 2.0, dz = H / (N - 1);
    var p = new Float64Array(N), T = new Float64Array(N), w = new Float64Array(N);
    var t = 0, hist = [], ghostsP = [], nextGhost = 3600 * 6;

    var P = {
      k: 3e-20, mu: 5e-4, K: 8e9, G: 6e9, Ks: 36e9, Kf: 2.2e9, phi: 0.10,
      aT: 1.0e-5, bf: 4.0e-4, bs: 3.0e-5,
      lam: 2.0, rc: 2.4e6, dT: 60
    };

    function coeffs() {
      var alpha = 1 - P.K / P.Ks;
      var M = 1 / (P.phi / P.Kf + Math.max(0, alpha - P.phi) / P.Ks);
      var Kod = P.K + 4 * P.G / 3;
      var bT = 3 * P.K * P.aT;                       // thermal stress coefficient
      var S = 1 / M + alpha * alpha / Kod;
      var bzeta = P.phi * P.bf + (alpha - P.phi) * P.bs;
      var Gam = bzeta - alpha * bT / Kod;
      return { alpha: alpha, M: M, Kod: Kod, bT: bT, S: S, Gam: Gam,
               c: (P.k / P.mu) / S, kap: P.lam / P.rc, Lam: Gam / S };
    }

    /* Thomas algorithm — buffers preallocated, this runs every frame */
    var _cp = new Float64Array(N), _dp = new Float64Array(N), _x = new Float64Array(N);
    function tridiag(a, b, c, d) {
      var n = d.length, cp = _cp, dp = _dp, x = _x;
      cp[0] = c[0] / b[0]; dp[0] = d[0] / b[0];
      for (var i = 1; i < n; i++) {
        var m = b[i] - a[i] * cp[i - 1];
        cp[i] = c[i] / m;
        dp[i] = (d[i] - a[i] * dp[i - 1]) / m;
      }
      x[n - 1] = dp[n - 1];
      for (var j = n - 2; j >= 0; j--) x[j] = dp[j] - cp[j] * x[j + 1];
      return x;
    }

    var _Told = new Float64Array(N);
    var _a = new Float64Array(N), _b = new Float64Array(N), _c = new Float64Array(N), _d = new Float64Array(N);
    function reset() {
      p.fill(0); T.fill(0); w.fill(0);
      t = 0; hist = []; ghostsP = []; nextGhost = 3600 * 6;
    }
    reset();

    function step(dt) {
      var C = coeffs();
      _Told.set(T);
      var Told = _Told;

      /* --- temperature: backward Euler diffusion, T = ΔT at the base ---- */
      var a = _a, b = _b, c = _c, d = _d;
      var r = C.kap * dt / (dz * dz);
      for (var i = 0; i < N; i++) {
        if (i === 0) { a[i] = 0; b[i] = 1; c[i] = 0; d[i] = 0; continue; }        // top: T = 0
        if (i === N - 1) { a[i] = 0; b[i] = 1; c[i] = 0; d[i] = P.dT; continue; } // base: heater
        a[i] = -r; b[i] = 1 + 2 * r; c[i] = -r; d[i] = T[i];
      }
      T.set(tridiag(a, b, c, d));

      /* --- pressure: backward Euler, source = Γ ∂T/∂t ------------------- */
      var rp = (P.k / P.mu) * dt / (C.S * dz * dz);
      for (var i2 = 0; i2 < N; i2++) {
        if (i2 === 0) { a[i2] = 0; b[i2] = 1; c[i2] = 0; d[i2] = 0; continue; }   // drained top
        if (i2 === N - 1) {                                                        // sealed base
          a[i2] = -2 * rp; b[i2] = 1 + 2 * rp; c[i2] = 0;
          d[i2] = p[i2] + (C.Gam / C.S) * (T[i2] - Told[i2]);
          continue;
        }
        a[i2] = -rp; b[i2] = 1 + 2 * rp; c[i2] = -rp;
        d[i2] = p[i2] + (C.Gam / C.S) * (T[i2] - Told[i2]);
      }
      p.set(tridiag(a, b, c, d));

      /* --- mechanics: uniaxial strain, σ_zz uniform --------------------- */
      var acc = 0;
      for (var i3 = N - 1; i3 >= 0; i3--) {
        var ev = (C.alpha * p[i3] + C.bT * T[i3]) / C.Kod;    // relative to σ0
        w[i3] = acc;
        acc += ev * dz;
      }
      /* w measured from the fixed base upward → surface heave is w[0] */
      var surf = 0;
      for (var i4 = 0; i4 < N; i4++) surf += ((C.alpha * p[i4] + C.bT * T[i4]) / C.Kod) * dz;
      t += dt;
      /* keep the history short — it is redrawn every frame */
      hist.push([t / 86400, surf * 1000]);
      if (hist.length > 420) {
        var thin = [];
        for (var hi2 = 0; hi2 < hist.length; hi2 += 2) thin.push(hist[hi2]);
        hist = thin;
      }
      return surf;
    }

    var pA = THM.plot(body.querySelector('.th__a'), {
      height: 310, padL: 64, padR: 34, table: false,
      x: { min: 0, max: 5, label: 'pore pressure  p  (MPa)   ·   temperature rise  (K)' },
      y: { min: 0, max: H, reverse: true, label: 'depth below the drained surface  (m)' }
    });
    var pB = THM.plot(body.querySelector('.th__b'), {
      height: 310, padL: 64, padR: 34, table: false,
      x: { min: 0, max: 100, label: 'time  (days)' },
      y: { min: -1, max: 3, label: 'surface displacement  (mm)' }
    });

    var out;
    function draw() {
      var C = THM.C(), cf = coeffs();
      var pr = [], tr2 = [];
      var pmax = 0.5;
      for (var i = 0; i < N; i++) {
        pr.push([p[i] / 1e6, i * dz]);
        tr2.push([T[i] / P.dT * 5, i * dz]);      // temperature scaled onto the same axis
        pmax = Math.max(pmax, p[i] / 1e6);
      }
      pA.setAxes({ max: Math.max(5, pmax * 1.15) }, null);
      var series = ghostsP.map(function (g) {
        return { color: C.ink4, pts: g, width: 1.1, alpha: 0.45, noHover: true };
      });
      series.push({ name: 'temperature (scaled)', color: C.t, pts: tr2, width: 2, dash: [5, 4] });
      series.push({ name: 'pore pressure', color: C.h, pts: pr, width: 2.6, fill: true, fillBase: 0 });
      pA.set(series);

      pB.setAxes({ max: Math.max(20, t / 86400 * 1.1) }, null);
      var surfSeries = hist;
      var lo = 0, hi = 0;
      surfSeries.forEach(function (r) { lo = Math.min(lo, r[1]); hi = Math.max(hi, r[1]); });
      pB.setAxes(null, { min: Math.min(-0.2, lo * 1.2), max: Math.max(0.5, hi * 1.2) });
      pB.set([{ name: 'surface heave', color: C.m, pts: surfSeries, width: 2.4, endDot: true }]);

      if (out) {
        out.set('t', (t / 86400).toFixed(1) + '<small> d</small>');
        out.set('pm', (pmax).toFixed(2) + '<small> MPa</small>');
        out.set('lam', (cf.Lam / 1e6).toFixed(2) + '<small> MPa/K</small>');
        out.set('c', U.si(cf.c, 1) + '<small> m²/s</small>');
        out.set('kap', U.si(cf.kap, 1) + '<small> m²/s</small>');
        out.set('ratio', U.si(cf.kap / cf.c, 1) + '<small>×</small>');
        out.set('w', (hist.length ? hist[hist.length - 1][1].toFixed(3) : '0') + '<small> mm</small>');
      }
    }

    var ctrls = document.createElement('div');
    ctrls.className = 'controls';
    host.appendChild(ctrls);
    THM.slider(ctrls, { label: 'Permeability $k$', min: -21, max: -15, step: 0.05,
      value: Math.log10(P.k),
      map: function (v) { return Math.pow(10, v); }, unmap: function (v) { return Math.log10(v); },
      fmt: function (v) { return U.si(v, 1) + ' m²'; },
      on: function (v) { P.k = v; reset(); } });
    THM.slider(ctrls, { label: 'Heater temperature rise $\\Delta T$', min: 5, max: 120, step: 1, value: P.dT,
      fmt: function (v) { return v.toFixed(0) + ' K'; }, on: function (v) { P.dT = v; reset(); } });
    THM.slider(ctrls, { label: 'Porosity $\\phi$', min: 0.01, max: 0.4, step: 0.005, value: P.phi,
      fmt: function (v) { return v.toFixed(3); }, on: function (v) { P.phi = v; reset(); } });
    THM.slider(ctrls, { label: 'Drained bulk modulus $K$', min: 8.3, max: 10.7, step: 0.02,
      value: Math.log10(P.K),
      map: function (v) { return Math.pow(10, v); }, unmap: function (v) { return Math.log10(v); },
      fmt: function (v) { return (v / 1e9).toPrecision(3) + ' GPa'; },
      on: function (v) { P.K = v; reset(); } });

    var outHost = document.createElement('div');
    outHost.className = 'fig__foot';
    host.appendChild(outHost);
    out = THM.readouts(outHost, [
      { key: 't', label: 'Elapsed' }, { key: 'pm', label: 'Peak pressure' },
      { key: 'w', label: 'Surface heave' },
      { key: 'lam', label: 'Λ = Γ/S' }, { key: 'c', label: 'Hydraulic diff. c' },
      { key: 'kap', label: 'Thermal diff. κ' }, { key: 'ratio', label: 'κ / c' }
    ]);
    outHost.querySelector('.readouts').style.cssText =
      'display:grid;grid-template-columns:repeat(auto-fit,minmax(112px,1fr));gap:.8rem 1rem';

    var frame = 0;
    var loop = THM.loop(host, function () {
      for (var s = 0; s < 6; s++) {
        var dt = U.clamp(600 + t / 1200, 600, 1.0e5);
        step(dt);
        if (t > nextGhost && ghostsP.length < 6) {
          var g = [];
          for (var i = 0; i < N; i++) g.push([p[i] / 1e6, i * dz]);
          ghostsP.push(g); nextGhost *= 3.2;
        }
      }
      if (t > 400 * 86400) { reset(); }
      if ((frame++ & 1) === 0) draw();
    });
    var tr = document.createElement('div');
    tr.style.cssText = 'display:flex;align-items:center';
    ctrls.appendChild(tr);
    THM.transport(tr, { toggle: function () { return loop.toggle(); }, reset: reset });
    draw();
  });

})(window);

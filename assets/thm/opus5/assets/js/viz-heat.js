/* =============================================================================
   Chapter 03 — Heat transport
   · thermal vs tracer front (Ogata–Banks analytic solution)
   · Horton–Rogers–Lapwood free convection, solved live in stream-function form
   ========================================================================== */
(function (global) {
  'use strict';
  var THM = global.THM, U = THM.util;

  /* ========================================== 3.1  thermal / tracer fronts */

  /** Ogata & Banks (1961) 1-D advection–dispersion, step input at x = 0. */
  function ogataBanks(x, t, v, D) {
    if (t <= 0) return x <= 0 ? 1 : 0;
    var s = 2 * Math.sqrt(D * t);
    var a = U.erfc((x - v * t) / s);
    var ex = v * x / D;
    var b = ex > 600 ? 0 : Math.exp(ex) * U.erfc((x + v * t) / s);
    return 0.5 * (a + (isFinite(b) ? b : 0));
  }

  THM.viz('pecletFig', function (host) {
    var body = host.querySelector('.fig__body');
    body.innerHTML = '<div class="fig__split"><div class="pe__a"></div><div class="pe__b"></div></div>';

    var st = { q: 3e-7, phi: 0.18, L: 100, aL: 2, t: 3.156e7 * 3, lam: 2.6 };
    var RCF = 4.18e6, RCM = 2.4e6;

    function derived() {
      var vw = st.q / st.phi;                              // water (pore) velocity
      var vT = st.q * RCF / RCM;                           // thermal front velocity
      var Dth = st.lam / RCM + st.aL * vT;                 // thermal diffusivity + dispersion
      var Dtr = 1e-9 + st.aL * vw;                         // tracer: molecular + dispersion
      var Pe = RCF * st.q * st.L / st.lam;
      return { vw: vw, vT: vT, Dth: Dth, Dtr: Dtr, Pe: Pe, R: RCM / (st.phi * RCF) };
    }

    var pA = THM.plot(body.querySelector('.pe__a'), {
      height: 265, padL: 58, padR: 26, table: false,
      x: { min: 0, max: 100, label: 'distance  x  (m)' },
      y: { min: 0, max: 1.02, label: 'normalised change', ticks: 5 }
    });
    var pB = THM.plot(body.querySelector('.pe__b'), {
      height: 265, padL: 58, padR: 26, table: false,
      x: { min: 0, max: 40, label: 'time  (years)' },
      y: { min: 0, max: 1.02, label: 'breakthrough at  x = L', ticks: 5 }
    });

    var out;
    function update() {
      var d = derived(), C = THM.C(), yr = 3.156e7;
      var prof = [], proT = [];
      for (var i = 0; i <= 180; i++) {
        var x = st.L * i / 180;
        prof.push([x, ogataBanks(x, st.t, d.vw, d.Dtr)]);
        proT.push([x, ogataBanks(x, st.t, d.vT, d.Dth)]);
      }
      pA.setAxes({ max: st.L }, null);
      pA.set([
        { name: 'tracer (moves with the water)', color: C.h, pts: prof, width: 2.2 },
        { name: 'temperature', color: C.t, pts: proT, width: 2.4, fill: true, fillBase: 0 }
      ]);

      var tmax = st.L / d.vT * 2.2 / yr;
      var bw = [], bT = [];
      for (var j = 0; j <= 200; j++) {
        var tt = tmax * yr * j / 200;
        bw.push([tt / yr, ogataBanks(st.L, tt, d.vw, d.Dtr)]);
        bT.push([tt / yr, ogataBanks(st.L, tt, d.vT, d.Dth)]);
      }
      pB.setAxes({ max: tmax }, null);
      pB.set([
        { name: 'tracer', color: C.h, pts: bw, width: 2.2 },
        { name: 'temperature', color: C.t, pts: bT, width: 2.4 },
        { color: C.m, pts: [[st.t / yr, ogataBanks(st.L, st.t, d.vT, d.Dth)]], marker: true, markerR: 5, noHover: true }
      ], {
        after: function (ctx, P) {
          if (st.t / yr > tmax) return;
          ctx.strokeStyle = C.m; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
          ctx.beginPath(); ctx.moveTo(P.sx(st.t / yr), P.pt); ctx.lineTo(P.sx(st.t / yr), P.pt + P.ph);
          ctx.stroke(); ctx.setLineDash([]);
        }
      });

      if (out) {
        out.set('pe', d.Pe < 100 ? d.Pe.toFixed(1) : U.si(d.Pe, 1));
        out.set('vw', U.si(d.vw * 3.156e7, 1) + '<small> m/yr</small>');
        out.set('vt', U.si(d.vT * 3.156e7, 1) + '<small> m/yr</small>');
        out.set('R', d.R.toFixed(1) + '<small>×</small>');
        out.set('tb', (st.L / d.vT / 3.156e7).toFixed(1) + '<small> yr</small>');
        out.set('reg', d.Pe > 10 ? 'advection-dominated' : d.Pe > 0.5 ? 'mixed' : 'conduction-dominated');
      }
    }

    var ctrls = document.createElement('div');
    ctrls.className = 'controls';
    host.appendChild(ctrls);
    THM.slider(ctrls, { label: 'Darcy flux $q$', min: -9, max: -5, step: 0.02, value: Math.log10(st.q),
      map: function (v) { return Math.pow(10, v); }, unmap: function (v) { return Math.log10(v); },
      fmt: function (v) { return U.si(v, 1) + ' m/s'; }, on: function (v) { st.q = v; update(); } });
    THM.slider(ctrls, { label: 'Porosity $\\phi$', min: 0.02, max: 0.45, step: 0.005, value: st.phi,
      fmt: function (v) { return v.toFixed(3); }, on: function (v) { st.phi = v; update(); } });
    THM.slider(ctrls, { label: 'Travel distance $L$', min: 10, max: 400, step: 5, value: st.L,
      fmt: function (v) { return v.toFixed(0) + ' m'; }, on: function (v) { st.L = v; update(); } });
    THM.slider(ctrls, { label: 'Dispersivity $\\alpha_L$', min: 0.05, max: 20, step: 0.05, value: st.aL,
      fmt: function (v) { return v.toFixed(2) + ' m'; }, on: function (v) { st.aL = v; update(); } });
    var tS = THM.slider(ctrls, { label: 'Elapsed time $t$', min: 0.1, max: 60, step: 0.1, value: 3,
      fmt: function (v) { return v.toFixed(1) + ' yr'; },
      on: function (v) { st.t = v * 3.156e7; update(); } });

    var outHost = document.createElement('div');
    outHost.className = 'fig__foot';
    host.appendChild(outHost);
    out = THM.readouts(outHost, [
      { key: 'pe', label: 'Péclet number' }, { key: 'reg', label: 'Regime' },
      { key: 'vw', label: 'Water velocity' }, { key: 'vt', label: 'Thermal front' },
      { key: 'R', label: 'Retardation' }, { key: 'tb', label: 'Thermal breakthrough' }
    ]);
    outHost.querySelector('.readouts').style.cssText =
      'display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:.8rem 1rem';

    update();

    var tau = 3;
    var loop = THM.loop(host, function (dt) {
      tau += dt * 1.6;
      if (tau > 60) tau = 0.1;
      tS.set(tau);
    });
    var tr = document.createElement('div');
    tr.style.cssText = 'display:flex;align-items:center';
    ctrls.appendChild(tr);
    THM.transport(tr, { toggle: function () { return loop.toggle(); },
      reset: function () { tau = 0.1; tS.set(tau); } });
  });

  /* ================================= 3.2  Horton–Rogers–Lapwood convection */

  THM.viz('convFig', function (host) {
    var body = host.querySelector('.fig__body');
    body.innerHTML = '<div class="conv"><div class="conv__stage stage"><canvas></canvas>' +
      '<span class="stage__badge" id="convBadge"></span></div><div class="conv__side"></div></div>';
    var stage = body.querySelector('.conv__stage');
    var cv = stage.querySelector('canvas');
    var side = body.querySelector('.conv__side');

    var A = 3;                                   // aspect ratio (width / height)
    var nz = 52, nx = Math.round(nz * A), h = 1 / (nz - 1);
    var n = nx * nz;
    var T = new Float64Array(n), Tn = new Float64Array(n), psi = new Float64Array(n);
    var Ra = 80, time = 0, nuHist = [];

    function reset(seedAmp) {
      var amp = seedAmp == null ? 0.02 : seedAmp;
      for (var j = 0; j < nz; j++) {
        for (var i = 0; i < nx; i++) {
          var z = j * h;
          T[j * nx + i] = (1 - z) + amp * Math.sin(Math.PI * z) *
            (Math.sin(3.7 * i * h * Math.PI) + 0.6 * Math.sin(9.1 * i * h * Math.PI + 1.2));
        }
      }
      psi.fill(0); time = 0; nuHist = [];
    }
    reset();

    function solvePsi(iters) {
      var om = 1.86;
      for (var it = 0; it < iters; it++) {
        for (var j = 1; j < nz - 1; j++) {
          for (var i = 1; i < nx - 1; i++) {
            var c = j * nx + i;
            var dTdx = (T[c + 1] - T[c - 1]) / (2 * h);
            var v = 0.25 * (psi[c - 1] + psi[c + 1] + psi[c - nx] + psi[c + nx] + h * h * Ra * dTdx);
            psi[c] += om * (v - psi[c]);
          }
        }
      }
    }

    function stepT(dt) {
      for (var j = 1; j < nz - 1; j++) {
        for (var i = 0; i < nx; i++) {
          var c = j * nx + i;
          var iL = i > 0 ? c - 1 : c + 1, iR = i < nx - 1 ? c + 1 : c - 1;   // insulated sides
          var u = (psi[c + nx] - psi[c - nx]) / (2 * h);
          var w = -(psi[Math.min(nx - 1, i + 1) + j * nx] - psi[Math.max(0, i - 1) + j * nx]) / (2 * h);
          var lap = (T[iL] + T[iR] + T[c - nx] + T[c + nx] - 4 * T[c]) / (h * h);
          var gx = u > 0 ? (T[c] - T[iL]) / h : (T[iR] - T[c]) / h;
          var gz = w > 0 ? (T[c] - T[c - nx]) / h : (T[c + nx] - T[c]) / h;
          Tn[c] = T[c] + dt * (lap - u * gx - w * gz);
        }
      }
      for (var i2 = 0; i2 < nx; i2++) {                     // isothermal top and bottom
        Tn[i2] = 1;
        Tn[(nz - 1) * nx + i2] = 0;
      }
      T.set(Tn);
      time += dt;
    }

    function nusselt() {
      var s = 0;
      for (var i = 0; i < nx; i++) s += (T[i] - T[nx + i]) / h;   // −∂T/∂z at z = 0
      var v = s / nx;
      return isFinite(v) ? v : 1;
    }

    var badge = body.querySelector('#convBadge');
    function draw() {
      var wCss = stage.clientWidth || 700;
      var ctx = THM.fitCanvas(cv, Math.round(wCss / A));
      var W = ctx.__w, H = ctx.__h;
      ctx.clearRect(0, 0, W, H);
      /* row 0 is the hot bottom, so flip vertically when painting */
      var flip = new Float64Array(n);
      for (var j = 0; j < nz; j++)
        for (var i = 0; i < nx; i++) flip[(nz - 1 - j) * nx + i] = T[j * nx + i];
      THM.paintField(ctx, flip, nx, nz, 0, 0, W, H, THM.ramp('heat'), 0, 1, { smooth: true });

      /* stream-function contours = streamlines */
      var pmax = 1e-9;
      for (var c = 0; c < n; c++) pmax = Math.max(pmax, Math.abs(psi[c]));
      if (pmax > 1e-4) {
        var fp = new Float64Array(n);
        for (var j2 = 0; j2 < nz; j2++)
          for (var i2 = 0; i2 < nx; i2++) fp[(nz - 1 - j2) * nx + i2] = psi[j2 * nx + i2];
        ctx.strokeStyle = 'rgba(255,255,255,.42)'; ctx.lineWidth = 1;
        var mapX = function (gi) { return gi / (nx - 1) * W; };
        var mapY = function (gj) { return gj / (nz - 1) * H; };
        for (var L = 1; L <= 5; L++) {
          THM.contour(ctx, fp, nx, nz, pmax * L / 6, mapX, mapY);
          THM.contour(ctx, fp, nx, nz, -pmax * L / 6, mapX, mapY);
        }
      }
      var Nu = nusselt();
      badge.textContent = 'Ra ' + Ra.toFixed(0) + '   ·   Nu ' + Nu.toFixed(2) +
        '   ·   ' + (Nu > 1.04 ? 'convecting' : 'conducting');
      return Nu;
    }

    /* Nu(Ra) trace, filled in as the user explores */
    var nuPlot = THM.plot(side, {
      height: 200, padL: 52, table: false,
      x: { min: 0, max: 300, label: 'Rayleigh number  Ra' },
      y: { min: 0, max: 5, label: 'Nusselt number  Nu' }
    });
    var samples = [];
    var out = THM.readouts(side, [
      { key: 'ra', label: 'Ra' }, { key: 'nu', label: 'Nu (measured)' },
      { key: 'rc', label: 'Ra / Ra_crit' }, { key: 't', label: 'diffusion times' }
    ]);
    side.querySelector('.readouts').style.cssText =
      'display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:.7rem .8rem;margin-top:.9rem';

    function refreshNuPlot(Nu) {
      var C = THM.C();
      var theo = [];
      for (var i = 0; i <= 120; i++) {
        var r = 300 * i / 120;
        theo.push([r, r <= 39.48 ? 1 : Math.min(6, 1 + 1.6 * Math.pow(r / 39.48 - 1, 0.6))]);
      }
      nuPlot.set([
        { name: 'weakly-nonlinear trend', color: C.ink4, pts: theo, width: 1.5, dash: [4, 4] },
        { name: 'this simulation', color: C.t, pts: samples.slice().sort(function (a, b) { return a[0] - b[0]; }),
          width: 0, marker: true, markerR: 3.5 },
        { color: C.m, pts: [[Ra, Nu]], marker: true, markerR: 5.5, noHover: true }
      ], {
        after: function (ctx, P) {
          ctx.strokeStyle = C.h; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
          ctx.beginPath(); ctx.moveTo(P.sx(39.48), P.pt); ctx.lineTo(P.sx(39.48), P.pt + P.ph); ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = C.ink4; ctx.font = '10px ' + THM.tok('sans');
          ctx.fillText('4π²', P.sx(39.48) + 4, P.pt + 11);
        }
      });
    }

    var ctrls = document.createElement('div');
    ctrls.className = 'controls';
    host.appendChild(ctrls);
    THM.slider(ctrls, { label: 'Rayleigh number $\\mathrm{Ra}$', min: 5, max: 300, step: 1, value: Ra,
      fmt: function (v) { return v.toFixed(0); },
      on: function (v) { Ra = v; } });
    var tr = document.createElement('div');
    tr.style.cssText = 'display:flex;align-items:center';
    ctrls.appendChild(tr);

    function umax() {
      var m = 1e-9;
      for (var j = 1; j < nz - 1; j++) {
        for (var i = 1; i < nx - 1; i++) {
          var c = j * nx + i;
          m = Math.max(m, Math.abs(psi[c + nx] - psi[c - nx]) / (2 * h),
                          Math.abs(psi[c + 1] - psi[c - 1]) / (2 * h));
        }
      }
      return m;
    }

    var frames = 0;
    var loop = THM.loop(host, function () {
      solvePsi(26);
      /* explicit scheme: diffusion needs dt ≤ h²/4, advection dt ≤ h/|u| */
      var dt = Math.min(0.18 * h * h, 0.35 * h / umax());
      var sub = 26;
      for (var s = 0; s < sub; s++) stepT(dt);
      var Nu = draw();
      frames++;
      if (frames % 30 === 0) {
        nuHist.push(Nu);
        if (nuHist.length > 40) nuHist.shift();
        var settled = nuHist.length > 12 &&
          Math.abs(nuHist[nuHist.length - 1] - nuHist[nuHist.length - 12]) < 0.02;
        if (settled) {
          var found = samples.some(function (p) { return Math.abs(p[0] - Ra) < 3; });
          if (!found) samples.push([Ra, Nu]);
        }
        refreshNuPlot(Nu);
        out.set('ra', Ra.toFixed(0));
        out.set('nu', Nu.toFixed(3));
        out.set('rc', (Ra / 39.48).toFixed(2) + '<small>×</small>');
        out.set('t', time.toFixed(3));
      }
    });
    THM.transport(tr, {
      toggle: function () { return loop.toggle(); },
      reset: function () { reset(); samples.length = 0; }
    });

    new ResizeObserver(function () { draw(); }).observe(stage);
    global.addEventListener('thm:theme', function () { draw(); refreshNuPlot(nusselt()); });
    refreshNuPlot(1);
  });

})(window);

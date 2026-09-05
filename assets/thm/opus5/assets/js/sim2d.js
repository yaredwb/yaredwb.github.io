/* =============================================================================
   Chapter 07 — the 2-D THM reservoir sandbox
   Plan view of a geothermal doublet. Pressure implicit (red–black Gauss–Seidel),
   temperature explicit upwind + diffusion, plane-strain poro-thermo-elasticity
   by SOR, and a Coulomb failure function formed from the resulting stresses.
   ========================================================================== */
(function (global) {
  'use strict';
  var THM = global.THM, U = THM.util;

  THM.viz('simFig', function (host) {
    var body = host.querySelector('.fig__body');
    body.innerHTML =
      '<div class="sim">' +
        '<div class="sim__left">' +
          '<div class="sim__stage stage"><canvas></canvas>' +
            '<span class="stage__badge" id="simBadge"></span></div>' +
          '<div class="sim__cb"></div>' +
        '</div>' +
        '<div class="sim__side"></div>' +
      '</div>';
    var stage = body.querySelector('.sim__stage');
    var cv = stage.querySelector('canvas');
    var side = body.querySelector('.sim__side');

    /* ------------------------------------------------------------ grid */
    var Lx = 1200, Ly = 720;
    var nx = 128, ny = Math.round(nx * Ly / Lx), dx = Lx / nx;
    var n = nx * ny;

    var p = new Float64Array(n), pOld = new Float64Array(n);
    var T = new Float64Array(n), Tn = new Float64Array(n);
    var qx = new Float64Array(n), qy = new Float64Array(n);
    var ux = new Float64Array(n), uy = new Float64Array(n);
    var evol = new Float64Array(n), cfs = new Float64Array(n), smean = new Float64Array(n);
    var speed = new Float64Array(n);

    /* --------------------------------------------------------- physics */
    var P = {
      k: 1e-13, mu: 3.0e-4, S: 1.0e-10, phi: 0.15,
      rcF: 4.18e6, rcM: 2.40e6, lam: 2.5,
      Tres: 160, Tinj: 40, thick: 100,
      Q: 0.012,                     // m³/s per well
      E: 25e9, nu: 0.25, alpha: 0.7, aT: 8e-6,
      muF: 0.6, strike: 30
    };
    var wells = [{ x: 380, y: 360, sign: +1 }, { x: 820, y: 360, sign: -1 }];
    var t = 0, hist = [], field = 'T', running = true;

    function idx(i, j) { return j * nx + i; }
    function cellOfXY(X, Y) {
      return idx(U.clamp(Math.floor(X / dx), 0, nx - 1), U.clamp(Math.floor(Y / dx), 0, ny - 1));
    }

    function reset() {
      p.fill(0); T.fill(P.Tres); ux.fill(0); uy.fill(0);
      t = 0; hist = [];
      wellCells();
    }
    var wcell = [];
    function wellCells() {
      wcell = wells.map(function (w) { return cellOfXY(w.x, w.y); });
    }
    reset();

    /* ------------------------------------------------- pressure (implicit) */
    /* No-flow outer boundary: the doublet is balanced, so everything the
       injector puts in must reach the producer. That is what makes the flow
       field a true dipole rather than a pair of independent radial wells.   */
    var src = new Float64Array(n);
    function solveP(dt) {
      pOld.set(p);
      var Tf = (P.k / P.mu) / (dx * dx);
      src.fill(0);
      var srcScale = 1 / (dx * dx * P.thick);
      for (var w = 0; w < wells.length; w++) src[wcell[w]] = wells[w].sign * P.Q * srcScale;
      var sdt = P.S / dt;

      for (var it = 0; it < 20; it++) {
        for (var par = 0; par < 2; par++) {
          for (var j = 0; j < ny; j++) {
            for (var i = (j + par) & 1; i < nx; i += 2) {
              var c = j * nx + i;
              var pw = p[i > 0 ? c - 1 : c + 1];
              var pe = p[i < nx - 1 ? c + 1 : c - 1];
              var ps = p[j > 0 ? c - nx : c + nx];
              var pn = p[j < ny - 1 ? c + nx : c - nx];
              p[c] = (sdt * pOld[c] + Tf * (pw + pe + ps + pn) + src[c]) / (sdt + 4 * Tf);
            }
          }
        }
        /* the Neumann problem is defined up to a constant — pin the level */
        var mean = 0;
        for (var c2 = 0; c2 < n; c2++) mean += p[c2];
        mean /= n;
        for (var c3 = 0; c3 < n; c3++) p[c3] -= mean;
      }

      /* Darcy flux at cell centres */
      var mob = P.k / P.mu, smax = 0;
      for (var j2 = 0; j2 < ny; j2++) {
        for (var i2 = 0; i2 < nx; i2++) {
          var c4 = j2 * nx + i2;
          var iL = Math.max(0, i2 - 1), iR = Math.min(nx - 1, i2 + 1);
          var jD = Math.max(0, j2 - 1), jU = Math.min(ny - 1, j2 + 1);
          qx[c4] = -mob * (p[j2 * nx + iR] - p[j2 * nx + iL]) / ((iR - iL) * dx);
          qy[c4] = -mob * (p[jU * nx + i2] - p[jD * nx + i2]) / ((jU - jD) * dx);
          speed[c4] = Math.hypot(qx[c4], qy[c4]);
          if (speed[c4] > smax) smax = speed[c4];
        }
      }
      return smax;
    }

    /* ------------------------------------------------ temperature (explicit) */
    function stepT(dt) {
      var kap = P.lam / P.rcM, rf = P.rcF / P.rcM;
      for (var j = 0; j < ny; j++) {
        for (var i = 0; i < nx; i++) {
          var c = idx(i, j);
          var iL = i > 0 ? c - 1 : c, iR = i < nx - 1 ? c + 1 : c;
          var jD = j > 0 ? c - nx : c, jU = j < ny - 1 ? c + nx : c;
          var lap = (T[iL] + T[iR] + T[jD] + T[jU] - 4 * T[c]) / (dx * dx);
          var u = rf * qx[c], v = rf * qy[c];
          var gx = u > 0 ? (T[c] - T[iL]) / dx : (T[iR] - T[c]) / dx;
          var gy = v > 0 ? (T[c] - T[jD]) / dx : (T[jU] - T[c]) / dx;
          Tn[c] = T[c] + dt * (kap * lap - u * gx - v * gy);
        }
      }
      /* insulated outer boundary (handled by the reflecting stencil above);
         the injector holds its cell at the injection temperature            */
      Tn[wcell[0]] = P.Tinj;
      T.set(Tn);
    }

    /* ------------------------------------ plane-strain mechanics (SOR) ---- */
    function solveM(iters) {
      var G = P.E / (2 * (1 + P.nu));
      var lam = 2 * G * P.nu / (1 - 2 * P.nu);
      var a = lam + 2 * G, b = G, cxy = lam + G;
      var bT = 3 * (P.E / (3 * (1 - 2 * P.nu))) * P.aT;
      var om = 1.72, h2 = dx * dx;
      for (var it = 0; it < iters; it++) {
        for (var j = 1; j < ny - 1; j++) {
          for (var i = 1; i < nx - 1; i++) {
            var c = idx(i, j);
            var px = (p[c + 1] - p[c - 1]) / (2 * dx);
            var py = (p[c + nx] - p[c - nx]) / (2 * dx);
            var tx = (T[c + 1] - T[c - 1]) / (2 * dx);
            var ty = (T[c + nx] - T[c - nx]) / (2 * dx);
            var vxy = (uy[c + 1 + nx] - uy[c + 1 - nx] - uy[c - 1 + nx] + uy[c - 1 - nx]) / (4 * h2);
            var uxy = (ux[c + 1 + nx] - ux[c + 1 - nx] - ux[c - 1 + nx] + ux[c - 1 - nx]) / (4 * h2);
            var rx = (P.alpha * px + bT * tx) * h2 - cxy * vxy * h2;
            var ry = (P.alpha * py + bT * ty) * h2 - cxy * uxy * h2;
            var nux = (a * (ux[c - 1] + ux[c + 1]) + b * (ux[c - nx] + ux[c + nx]) - rx) / (2 * (a + b));
            var nuy = (b * (uy[c - 1] + uy[c + 1]) + a * (uy[c - nx] + uy[c + nx]) - ry) / (2 * (a + b));
            ux[c] += om * (nux - ux[c]);
            uy[c] += om * (nuy - uy[c]);
          }
        }
      }
    }

    function stresses() {
      var G = P.E / (2 * (1 + P.nu));
      var lam = 2 * G * P.nu / (1 - 2 * P.nu);
      var K = P.E / (3 * (1 - 2 * P.nu));
      var bT = 3 * K * P.aT;
      var th = P.strike * Math.PI / 180;
      var nX = Math.cos(th), nY = Math.sin(th);      // fault normal
      var sX = -nY, sY = nX;                          // fault-parallel direction
      for (var j = 1; j < ny - 1; j++) {
        for (var i = 1; i < nx - 1; i++) {
          var c = idx(i, j);
          var exx = (ux[c + 1] - ux[c - 1]) / (2 * dx);
          var eyy = (uy[c + nx] - uy[c - nx]) / (2 * dx);
          var exy = 0.5 * ((ux[c + nx] - ux[c - nx]) + (uy[c + 1] - uy[c - 1])) / (2 * dx);
          var ev = exx + eyy;
          evol[c] = ev;
          var dTc = T[c] - P.Tres;
          /* effective stress change, tension positive */
          var sxx = lam * ev + 2 * G * exx - bT * dTc;
          var syy = lam * ev + 2 * G * eyy - bT * dTc;
          var sxy = 2 * G * exy;
          smean[c] = 0.5 * (sxx + syy);
          /* traction on the fault plane */
          var txv = sxx * nX + sxy * nY;
          var tyv = sxy * nX + syy * nY;
          var sn = txv * nX + tyv * nY;               // effective normal (tension +)
          var tau = txv * sX + tyv * sY;
          cfs[c] = tau + P.muF * sn;                  // ΔCFS, tension-positive form
        }
      }
    }

    /* ------------------------------------------------------------ render */
    var FIELDS = {
      T:    { label: 'Temperature', unit: '°C', ramp: 'ember', get: function () { return T; },
              lo: function () { return P.Tinj; }, hi: function () { return P.Tres; } },
      p:    { label: 'Pressure change', unit: 'MPa', ramp: 'blues', get: function () { return p; },
              scale: 1e-6, sym: false },
      cfs:  { label: 'Coulomb stress change', unit: 'MPa', ramp: 'div', get: function () { return cfs; },
              scale: 1e-6, sym: true },
      sm:   { label: 'Mean effective stress change', unit: 'MPa', ramp: 'div', get: function () { return smean; },
              scale: 1e-6, sym: true },
      ev:   { label: 'Volumetric strain', unit: '×10⁻⁴', ramp: 'div', get: function () { return evol; },
              scale: 1e4, sym: true },
      v:    { label: 'Darcy flux', unit: 'm/s', ramp: 'blues', get: function () { return speed; },
              scale: 1, sym: false }
    };

    var scratch = new Float64Array(n);
    var badge = body.querySelector('#simBadge');
    var cb, out;

    function draw() {
      var wCss = stage.clientWidth || 760;
      var ctx = THM.fitCanvas(cv, Math.round(wCss * Ly / Lx));
      var W = ctx.__w, H = ctx.__h, C = THM.C();
      var F = FIELDS[field], src = F.get(), sc = F.scale || 1;
      var lo, hi;
      if (F.lo) { lo = F.lo(); hi = F.hi(); scratch.set(src); }
      else {
        var mx = 0, mn = 1e30;
        for (var c = 0; c < n; c++) {
          var v = src[c] * sc; scratch[c] = v;
          if (v > mx) mx = v; if (v < mn) mn = v;
        }
        if (F.sym) { var m = Math.max(Math.abs(mx), Math.abs(mn), 1e-9); lo = -m; hi = m; }
        else { lo = 0; hi = Math.max(mx, 1e-12); }
      }
      THM.paintField(ctx, scratch, nx, ny, 0, 0, W, H, THM.ramp(F.ramp), lo, hi, { smooth: true });

      /* temperature contours over any field, so the plume is always locatable */
      if (field !== 'T') {
        ctx.strokeStyle = 'rgba(255,255,255,.30)'; ctx.lineWidth = 1;
        var mapX = function (gi) { return gi / (nx - 1) * W; };
        var mapY = function (gj) { return gj / (ny - 1) * H; };
        [0.25, 0.5, 0.75].forEach(function (f) {
          THM.contour(ctx, T, nx, ny, P.Tinj + f * (P.Tres - P.Tinj), mapX, mapY);
        });
      }

      /* wells */
      var s = W / Lx;
      wells.forEach(function (w, wi) {
        var X = w.x * s, Y = w.y * s;
        ctx.beginPath(); ctx.arc(X, Y, 9, 0, 6.2832);
        ctx.fillStyle = wi === 0 ? '#3987e5' : '#d95926';
        ctx.globalAlpha = 0.25; ctx.fill(); ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(X, Y, 5, 0, 6.2832);
        ctx.fillStyle = wi === 0 ? '#7cc0ff' : '#f0a34a'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.stroke();
        ctx.font = '600 11px ' + THM.tok('sans');
        ctx.textAlign = 'center';
        var lab = wi === 0 ? 'injector' : 'producer';
        ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(0,0,0,.65)';
        ctx.lineJoin = 'round';
        ctx.strokeText(lab, X, Y - 13);
        ctx.fillStyle = 'rgba(255,255,255,.95)';
        ctx.fillText(lab, X, Y - 13);
      });
      ctx.textAlign = 'left';

      /* scale bar */
      ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2;
      var barPx = 200 * s;
      ctx.beginPath(); ctx.moveTo(W - barPx - 14, H - 16); ctx.lineTo(W - 14, H - 16); ctx.stroke();
      ctx.font = '10.5px ' + THM.tok('mono');
      ctx.textAlign = 'right';
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.6)';
      ctx.strokeText('200 m', W - 14, H - 22);
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      ctx.fillText('200 m', W - 14, H - 22);
      ctx.textAlign = 'left';

      var Tp = T[wcell[1]];
      badge.textContent = (t / 3.156e7).toFixed(1) + ' yr   ·   produced ' + Tp.toFixed(1) + ' °C';
      if (cb) cb.update(fmtV(lo, F), fmtV(hi, F), THM.ramp(F.ramp));
      return { lo: lo, hi: hi, Tp: Tp };
    }
    function fmtV(v, F) {
      if (Math.abs(v) >= 100) return v.toFixed(0);
      if (Math.abs(v) >= 1) return v.toFixed(1);
      return U.si(v, 1);
    }

    /* ------------------------------------------------------------ layout */
    var cbHost = body.querySelector('.sim__cb');
    cb = THM.colorbar(cbHost, THM.ramp('ember'), '', '', 'Temperature  (°C)');

    var plot = THM.plot(side, {
      height: 190, padL: 54, table: false,
      x: { min: 0, max: 40, label: 'time  (years)' },
      y: { min: 0, max: 200, label: 'produced T  (°C)' }
    });

    out = THM.readouts(side, [
      { key: 'yr',  label: 'Elapsed' },
      { key: 'Tp',  label: 'Produced T' },
      { key: 'dp',  label: 'Δp across doublet' },
      { key: 'cfs', label: 'Peak ΔCFS' },
      { key: 'sw',  label: 'Cooled area' },
      { key: 'pe',  label: 'Péclet (well spacing)' }
    ]);
    side.querySelector('.readouts').style.cssText =
      'display:grid;grid-template-columns:repeat(auto-fit,minmax(112px,1fr));gap:.85rem 1rem;margin-top:.9rem';

    var ctrls = document.createElement('div');
    ctrls.className = 'controls';
    host.appendChild(ctrls);

    var row = document.createElement('div');
    row.style.cssText = 'grid-column:1/-1;display:flex;gap:.6rem;align-items:center;flex-wrap:wrap';
    row.innerHTML = '<span class="ctrl__label">Field</span>';
    ctrls.appendChild(row);
    THM.segmented(row, {
      label: 'Displayed field', index: 0,
      options: [
        { value: 'T', label: 'Temperature' }, { value: 'p', label: 'Pressure' },
        { value: 'cfs', label: 'Coulomb ΔCFS' }, { value: 'sm', label: 'Mean stress' },
        { value: 'ev', label: 'Volumetric strain' }, { value: 'v', label: 'Darcy flux' }
      ],
      on: function (v) {
        field = v;
        var F = FIELDS[v];
        cb.host.querySelector('.ctrl__label').textContent = F.label + '  (' + F.unit + ')';
        draw();
      }
    });

    THM.slider(ctrls, { label: 'Injection rate $Q$', min: 2, max: 60, step: 0.5, value: P.Q * 1000,
      fmt: function (v) { return v.toFixed(1) + ' L/s'; },
      on: function (v) { P.Q = v / 1000; } });
    THM.slider(ctrls, { label: 'Injection temperature', min: 10, max: 120, step: 1, value: P.Tinj,
      fmt: function (v) { return v.toFixed(0) + ' °C'; },
      on: function (v) { P.Tinj = v; } });
    THM.slider(ctrls, { label: 'Permeability $k$', min: -15, max: -11.5, step: 0.02,
      value: Math.log10(P.k),
      map: function (v) { return Math.pow(10, v); }, unmap: function (v) { return Math.log10(v); },
      fmt: function (v) { return U.si(v, 1) + ' m²'; },
      on: function (v) { P.k = v; } });
    THM.slider(ctrls, { label: 'Fault strike', min: 0, max: 179, step: 1, value: P.strike,
      fmt: function (v) { return v.toFixed(0) + '°'; },
      on: function (v) { P.strike = v; } });
    THM.slider(ctrls, { label: 'Fault friction $\\mu_f$', min: 0.2, max: 0.9, step: 0.01, value: P.muF,
      fmt: function (v) { return v.toFixed(2); }, on: function (v) { P.muF = v; } });
    THM.slider(ctrls, { label: 'Young’s modulus $E$', min: 5, max: 60, step: 0.5, value: P.E / 1e9,
      fmt: function (v) { return v.toFixed(1) + ' GPa'; }, on: function (v) { P.E = v * 1e9; } });

    var tr = document.createElement('div');
    tr.style.cssText = 'display:flex;align-items:center';
    ctrls.appendChild(tr);

    var hint = document.createElement('p');
    hint.className = 'fig__foot';
    hint.style.margin = '0';
    hint.innerHTML = 'Drag either well to move it. Contours on the non-thermal fields mark the ' +
      '25 / 50 / 75 % temperature levels of the cold plume.';
    host.appendChild(hint);

    /* ------------------------------------------------------------ dragging */
    var drag = -1;
    function toWorld(ev) {
      var r = cv.getBoundingClientRect();
      return { x: (ev.clientX - r.left) / r.width * Lx, y: (ev.clientY - r.top) / r.height * Ly };
    }
    cv.style.touchAction = 'none';
    cv.addEventListener('pointerdown', function (e) {
      var w = toWorld(e);
      wells.forEach(function (q, i) {
        if (Math.hypot(q.x - w.x, q.y - w.y) < 60) drag = i;
      });
      if (drag >= 0) cv.setPointerCapture(e.pointerId);
    });
    cv.addEventListener('pointermove', function (e) {
      if (drag < 0) { cv.style.cursor = 'default'; return; }
      var w = toWorld(e);
      wells[drag].x = U.clamp(w.x, 3 * dx, Lx - 3 * dx);
      wells[drag].y = U.clamp(w.y, 3 * dx, Ly - 3 * dx);
      wellCells();
    });
    cv.addEventListener('pointerup', function () { drag = -1; });

    /* ------------------------------------------------------------- loop */
    var frame = 0;
    function stepAll() {
      var smax = solveP(2e5);
      var vT = (P.rcF / P.rcM) * Math.max(smax, 1e-12);
      var kap = P.lam / P.rcM;
      var dtA = 0.35 * dx / vT, dtD = 0.20 * dx * dx / kap;
      var dt = Math.min(dtA, dtD, 3e7);
      for (var s = 0; s < 4; s++) stepT(dt);
      t += 4 * dt;
      if ((frame & 3) === 0) { solveM(14); stresses(); }
      hist.push([t / 3.156e7, T[wcell[1]]]);
      if (hist.length > 500) {
        var thin = [];
        for (var i = 0; i < hist.length; i += 2) thin.push(hist[i]);
        hist = thin;
      }
    }

    function refreshSide(info) {
      var C = THM.C();
      plot.setAxes({ max: Math.max(5, t / 3.156e7 * 1.1) },
                   { min: Math.min(P.Tinj - 5, 0), max: P.Tres * 1.08 });
      plot.set([{ name: 'produced temperature', color: C.t, pts: hist, width: 2.4, endDot: true }], {
        after: function (ctx, Pl) {
          ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
          ctx.beginPath(); ctx.moveTo(Pl.pl, Pl.sy(P.Tres)); ctx.lineTo(Pl.pl + Pl.pw, Pl.sy(P.Tres));
          ctx.stroke(); ctx.setLineDash([]);
        }
      });
      var maxCfs = 0, cooled = 0;
      for (var c = 0; c < n; c++) {
        if (Math.abs(cfs[c]) > Math.abs(maxCfs)) maxCfs = cfs[c];
        if (T[c] < P.Tres - 0.1 * (P.Tres - P.Tinj)) cooled++;
      }
      var L = Math.hypot(wells[0].x - wells[1].x, wells[0].y - wells[1].y);
      var qTyp = P.Q / (P.thick * L);
      out.set('yr', (t / 3.156e7).toFixed(1) + '<small> yr</small>');
      out.set('Tp', info.Tp.toFixed(1) + '<small> °C</small>');
      out.set('dp', ((p[wcell[0]] - p[wcell[1]]) / 1e6).toFixed(2) + '<small> MPa</small>');
      out.set('cfs', (maxCfs / 1e6).toFixed(3) + '<small> MPa</small>');
      out.set('sw', (cooled * dx * dx / 1e6).toFixed(2) + '<small> km²</small>');
      out.set('pe', U.si(P.rcF * qTyp * L / P.lam, 1));
    }

    var loop = THM.loop(host, function () {
      if (running) stepAll();
      var info = draw();
      if ((frame++ & 7) === 0) refreshSide(info);
    });
    THM.transport(tr, {
      toggle: function () { running = !running; return running; },
      reset: function () { reset(); }
    });

    new ResizeObserver(function () { draw(); }).observe(stage);
    global.addEventListener('thm:theme', draw);
    solveP(2e5); solveM(160); stresses(); draw();
  });

})(window);

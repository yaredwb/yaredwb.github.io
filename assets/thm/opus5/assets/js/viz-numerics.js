/* =============================================================================
   Chapter 06 — Solving it
   · a real 1-D poroelastic finite-element assembly, showing the equal-order
     pressure oscillation and what stabilisation does about it
   · the four sequential splitting schemes, iterated for real
   ========================================================================== */
(function (global) {
  'use strict';
  var THM = global.THM, U = THM.util;

  /* --------------------------------------------------- dense linear solve */

  function solveDense(A, b) {                       // Gaussian elimination, partial pivot
    var n = b.length;
    var M = A.map(function (r, i) { return r.slice().concat([b[i]]); });
    for (var c = 0; c < n; c++) {
      var piv = c;
      for (var r2 = c + 1; r2 < n; r2++) if (Math.abs(M[r2][c]) > Math.abs(M[piv][c])) piv = r2;
      var tmp = M[c]; M[c] = M[piv]; M[piv] = tmp;
      var d = M[c][c];
      if (Math.abs(d) < 1e-300) continue;
      for (var j = c; j <= n; j++) M[c][j] /= d;
      for (var r3 = 0; r3 < n; r3++) {
        if (r3 === c) continue;
        var f = M[r3][c];
        if (f === 0) continue;
        for (var j2 = c; j2 <= n; j2++) M[r3][j2] -= f * M[c][j2];
      }
    }
    return M.map(function (r) { return r[n]; });
  }

  /* ============================ 6.1  equal-order pressure oscillation ===== */

  THM.viz('oscFig', function (host) {
    var body = host.querySelector('.fig__body');
    body.innerHTML = '<div class="fig__split fig__split--wide"><div class="os__plot"></div><div class="os__out"></div></div>';

    /* soil column: H = 1 m, load σ0 = 1, drained at z = 0, fixed at z = H */
    var st = { nel: 24, dt: 0.03, stab: false, logk: -14 };
    var Kod = 1e7, alpha = 1, Minv = 1e-9, mu = 1e-3, H = 1, sig0 = 1e4;

    var plot = THM.plot(body.querySelector('.os__plot'), {
      height: 300, padL: 66, padR: 34, table: false,
      x: { min: -0.4, max: 2.0, label: 'excess pore pressure  p / σ₀' },
      y: { min: 0, max: 1, reverse: true, label: 'depth  z / H' }
    });

    function solveFE() {
      var n = st.nel, h = H / n, nn = n + 1;
      var k = Math.pow(10, st.logk);
      var cv = (k / mu) / (Minv + alpha * alpha / Kod);
      var dt = st.dt * h * h / cv;                 // time step, in units of h²/c
      var N = 2 * nn;
      var A = [], b = new Array(N).fill(0);
      for (var i = 0; i < N; i++) A.push(new Array(N).fill(0));

      var stabCoef = st.stab ? h * h / (4 * Kod) : 0;

      for (var e = 0; e < n; e++) {
        var i0 = e, i1 = e + 1;
        /* K_uu */
        var kuu = Kod / h;
        A[i0][i0] += kuu; A[i0][i1] -= kuu; A[i1][i0] -= kuu; A[i1][i1] += kuu;
        /* Q : ∫ B_u^T N_p  = α/2 [[-1,-1],[1,1]] */
        var q = alpha / 2;
        A[i0][nn + i0] -= -q; A[i0][nn + i1] -= -q;
        A[i1][nn + i0] -= q;  A[i1][nn + i1] -= q;
        /* Q^T */
        A[nn + i0][i0] += -q; A[nn + i0][i1] += q;
        A[nn + i1][i0] += -q; A[nn + i1][i1] += q;
        /* S = ∫ (1/M) Np^T Np */
        var s = Minv * h / 6;
        A[nn + i0][nn + i0] += 2 * s; A[nn + i0][nn + i1] += s;
        A[nn + i1][nn + i0] += s;     A[nn + i1][nn + i1] += 2 * s;
        /* Δt H  (+ optional stabilisation, which is *not* multiplied by Δt) */
        var hh = dt * (k / mu) / h + stabCoef / h;
        A[nn + i0][nn + i0] += hh; A[nn + i0][nn + i1] -= hh;
        A[nn + i1][nn + i0] -= hh; A[nn + i1][nn + i1] += hh;
      }

      /* load at the top node (z = 0), displacement fixed at the base */
      b[0] = sig0;
      var fixU = nn - 1;
      for (var c1 = 0; c1 < N; c1++) A[fixU][c1] = 0;
      A[fixU][fixU] = 1; b[fixU] = 0;
      /* drained boundary: p = 0 at the top node */
      var fixP = nn + 0;
      for (var c2 = 0; c2 < N; c2++) A[fixP][c2] = 0;
      A[fixP][fixP] = 1; b[fixP] = 0;

      var x = solveDense(A, b);
      var pts = [], zs = [];
      for (var i2 = 0; i2 < nn; i2++) { pts.push([x[nn + i2] / sig0, i2 * h]); zs.push(i2 * h); }
      return { pts: pts, dt: dt, cv: cv, h: h, Tv: cv * dt / (H * H) };
    }

    function terzaghi(Tv) {
      var pts = [];
      for (var i = 0; i <= 160; i++) {
        var Z = i / 160, s = 0;
        for (var m = 0; m < 250; m++) {
          var M = Math.PI / 2 * (2 * m + 1);
          var ee = Math.exp(-M * M * Tv);
          if (ee < 1e-15 && m > 4) break;
          s += 2 / M * Math.sin(M * Z) * ee;
        }
        pts.push([s, Z]);
      }
      return pts;
    }

    var out;
    function update() {
      var r = solveFE(), C = THM.C();
      /* the diagnostic is the size of the spurious extrema: a physical
         solution stays inside [0, 1] everywhere.                        */
      var lo = 1, hi = 0;
      r.pts.forEach(function (q) { lo = Math.min(lo, q[0]); hi = Math.max(hi, q[0]); });
      var osc = Math.max(0, -lo) + Math.max(0, hi - 1);
      plot.set([
        { name: 'Terzaghi analytic', color: C.ink4, pts: terzaghi(r.Tv), width: 1.6, dash: [5, 4] },
        { name: 'finite-element solution', color: osc > 0.02 ? C.s8 : C.h, pts: r.pts,
          width: 2.2, marker: true, markerR: 3 }
      ]);
      if (out) {
        out.set('dt', U.si(r.dt, 2) + '<small> s</small>');
        out.set('n', String(st.nel) + '<small> elements</small>');
        out.set('crit', st.dt.toFixed(3));
        out.set('osc', (osc * 100).toFixed(2) + '<small> % of σ₀</small>');
        out.set('verdict', osc > 0.02 ? 'oscillating' : 'clean');
        out.set('vv', st.dt >= 1 / 6 ? 'satisfied' : 'violated');
      }
    }

    var ctrls = document.createElement('div');
    ctrls.className = 'controls';
    host.appendChild(ctrls);
    THM.slider(ctrls, { label: 'Time step  $\\Delta t\\,c/h^2$', min: -2.4, max: 1.2, step: 0.02,
      value: Math.log10(st.dt),
      map: function (v) { return Math.pow(10, v); }, unmap: function (v) { return Math.log10(v); },
      fmt: function (v) { return v.toFixed(v < 0.1 ? 4 : 3); },
      on: function (v) { st.dt = v; update(); } });
    THM.slider(ctrls, { label: 'Elements', min: 8, max: 60, step: 1, value: st.nel,
      fmt: function (v) { return v.toFixed(0); }, on: function (v) { st.nel = Math.round(v); update(); } });
    var sw = document.createElement('label');
    sw.className = 'switch';
    sw.innerHTML = '<input type="checkbox"> Fluid-pressure-Laplacian stabilisation';
    sw.querySelector('input').addEventListener('change', function (e) { st.stab = e.target.checked; update(); });
    ctrls.appendChild(sw);

    var outHost = body.querySelector('.os__out');
    out = THM.readouts(outHost, [
      { key: 'crit', label: 'Δt c / h²' },
      { key: 'osc',  label: 'Oscillation amplitude' },
      { key: 'verdict', label: 'Verdict' },
      { key: 'n',    label: 'Mesh' },
      { key: 'dt',   label: 'Physical Δt' },
      { key: 'vv',   label: 'Vermeer–Verruijt limit' }
    ]);
    outHost.querySelector('.readouts').style.cssText =
      'display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:.9rem 1rem';
    var note = document.createElement('p');
    note.className = 'rc__verdict';
    note.innerHTML = 'The Vermeer–Verruijt limit is <b>Δt c / h² ≥ 1/6</b>. Drop below it without ' +
      'stabilisation and the pressure oscillates; the displacement field, meanwhile, stays ' +
      'perfectly well behaved — which is why this bug so often survives review.';
    outHost.appendChild(note);

    update();
  });

  /* ================================ 6.2  sequential splitting schemes ==== */

  THM.viz('splitFig', function (host) {
    var body = host.querySelector('.fig__body');
    body.innerHTML = '<div class="fig__split fig__split--wide"><div class="sp__plot"></div><div class="sp__out"></div></div>';

    var st = { tau: 0.8, nIter: 24 };

    var plot = THM.plot(body.querySelector('.sp__plot'), {
      height: 300, padL: 68, padR: 40, table: false,
      x: { min: 0, max: 24, label: 'sequential iteration' },
      y: { min: 1e-12, max: 10, log: true, label: 'error in p' }
    });

    /* Scalar model problem:  Kod·ε − α·p = σ ,  p/M + α·ε = ζ.
       Exact solution for σ = 0, ζ = 1:  p* = ζ /(1/M + α²/Kod).      */
    function run(scheme) {
      var Kod = 1, alpha = 1;
      var M = st.tau * Kod / (alpha * alpha);      // τ = α²M/Kod
      var zeta = 1, sigma = 0;
      var pStar = zeta / (1 / M + alpha * alpha / Kod);
      var p = 0, eps = 0, errs = [];
      for (var it = 0; it <= st.nIter; it++) {
        errs.push([it, Math.max(1e-13, Math.abs(p - pStar) / Math.abs(pStar))]);
        if (scheme === 'drained') {
          eps = (sigma + alpha * p) / Kod;                 // mechanics at fixed p
          p = M * (zeta - alpha * eps);                    // flow at fixed ε
        } else if (scheme === 'fixedStrain') {
          p = M * (zeta - alpha * eps);                    // flow at fixed ε
          eps = (sigma + alpha * p) / Kod;                 // mechanics at fixed p
        } else if (scheme === 'undrained') {
          var Ku = Kod + alpha * alpha * M;                // mechanics at fixed fluid mass
          eps = (sigma + alpha * M * zeta) / Ku;
          p = M * (zeta - alpha * eps);
        } else {                                           // fixed stress
          var Sfs = 1 / M + alpha * alpha / Kod;
          p = (zeta - alpha * eps + (alpha * alpha / Kod) * p) / Sfs;
          eps = (sigma + alpha * p) / Kod;
        }
        if (!isFinite(p) || Math.abs(p) > 1e14) { errs.push([it + 1, 10]); break; }
      }
      return errs;
    }

    var out;
    function update() {
      var C = THM.C();
      plot.setAxes({ max: st.nIter }, null);
      plot.set([
        { name: 'drained split', color: C.s8, pts: run('drained'), width: 2, label: 'drained' },
        { name: 'fixed-strain split', color: C.s4, pts: run('fixedStrain'), width: 2, dash: [5, 4], label: 'fixed-strain' },
        { name: 'undrained split', color: C.h, pts: run('undrained'), width: 2, label: 'undrained' },
        { name: 'fixed-stress split', color: C.m, pts: run('fixedStress'), width: 2.6, label: 'fixed-stress' }
      ], {
        after: function (ctx, P) {
          ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
          ctx.beginPath(); ctx.moveTo(P.pl, P.sy(1)); ctx.lineTo(P.pl + P.pw, P.sy(1)); ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = C.ink4; ctx.font = '10px ' + THM.tok('sans');
          ctx.fillText('100 % error', P.pl + 5, P.sy(1) - 6);
        }
      });
      if (out) {
        out.set('tau', st.tau.toFixed(3));
        out.set('dr', st.tau < 1 ? st.tau.toFixed(3) : st.tau.toFixed(2) + ' — diverges');
        out.set('fs', (st.tau / (1 + st.tau)).toFixed(3));
        out.set('note', st.tau < 1 ? 'all four converge' : 'only undrained and fixed-stress converge');
      }
    }

    var ctrls = document.createElement('div');
    ctrls.className = 'controls';
    host.appendChild(ctrls);
    THM.slider(ctrls, { label: 'Coupling strength $\\tau = \\alpha^2 M/K_{od}$',
      min: -1.3, max: 1.3, step: 0.01, value: Math.log10(st.tau),
      map: function (v) { return Math.pow(10, v); }, unmap: function (v) { return Math.log10(v); },
      fmt: function (v) { return v.toFixed(3); }, on: function (v) { st.tau = v; update(); } });
    THM.slider(ctrls, { label: 'Iterations shown', min: 6, max: 40, step: 1, value: st.nIter,
      fmt: function (v) { return v.toFixed(0); }, on: function (v) { st.nIter = Math.round(v); update(); } });

    var outHost = body.querySelector('.sp__out');
    out = THM.readouts(outHost, [
      { key: 'tau', label: 'Coupling strength τ' },
      { key: 'dr',  label: 'Drained contraction' },
      { key: 'fs',  label: 'Fixed-stress contraction' },
      { key: 'note', label: 'Outcome' }
    ]);
    outHost.querySelector('.readouts').style.cssText =
      'display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:.9rem 1rem';
    var note = document.createElement('p');
    note.className = 'rc__verdict';
    note.innerHTML = 'Soft, highly compressible materials (soils, weak sandstones with stiff fluid) ' +
      'have large τ. That is exactly where the naive “run the flow code, then the mechanics code” ' +
      'loop falls apart — and where fixed-stress earns its keep.';
    outHost.appendChild(note);

    update();
  });

})(window);

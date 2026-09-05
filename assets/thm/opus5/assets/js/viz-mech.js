/* =============================================================================
   Chapter 04 — Poromechanics
   · Biot constants explorer (α, M, K_u, B, ν_u from K, G, K_s, K_f, φ)
   · drained vs undrained loading path
   · Mohr circle with pore pressure and a Mohr–Coulomb envelope
   ========================================================================== */
(function (global) {
  'use strict';
  var THM = global.THM, U = THM.util;

  /** All the derived Biot constants from the five independent inputs. */
  function biot(K, G, Ks, Kf, phi) {
    var alpha = U.clamp(1 - K / Ks, 0, 1);
    var invM = phi / Kf + Math.max(0, alpha - phi) / Ks;
    var M = 1 / invM;
    var Ku = K + alpha * alpha * M;
    var B = alpha * M / Ku;
    var nu = (3 * K - 2 * G) / (2 * (3 * K + G));
    var nuu = (3 * Ku - 2 * G) / (2 * (3 * Ku + G));
    return { alpha: alpha, M: M, Ku: Ku, B: B, nu: nu, nuu: nuu, K: K, G: G, Ks: Ks, Kf: Kf, phi: phi };
  }

  var MATERIALS = {
    clay:      { name: 'Soft clay',   K: 0.02e9, G: 0.008e9, Ks: 40e9, Kf: 2.2e9, phi: 0.50 },
    sand:      { name: 'Dense sand',  K: 0.10e9, G: 0.06e9,  Ks: 40e9, Kf: 2.2e9, phi: 0.38 },
    sandstone: { name: 'Sandstone',   K: 8.9e9,  G: 6.2e9,   Ks: 36e9, Kf: 2.2e9, phi: 0.19 },
    limestone: { name: 'Limestone',   K: 20e9,   G: 15e9,    Ks: 72e9, Kf: 2.2e9, phi: 0.10 },
    granite:   { name: 'Granite',     K: 35e9,   G: 22e9,    Ks: 45e9, Kf: 2.2e9, phi: 0.01 }
  };

  /* ================================================= 4.1  Biot  constants */

  THM.viz('biotFig', function (host) {
    var body = host.querySelector('.fig__body');
    body.innerHTML = '<div class="fig__split fig__split--wide"><div class="bi__plot"></div><div class="bi__out"></div></div>';
    var st = Object.assign({}, MATERIALS.sandstone);

    var plot = THM.plot(body.querySelector('.bi__plot'), {
      height: 275, padL: 58, padR: 40, table: false,
      x: { min: 0, max: 1, label: 'frame stiffness ratio  K / Kₛ' },
      y: { min: 0, max: 1.02, label: 'coefficient', ticks: 5 }
    });

    var outHost = body.querySelector('.bi__out');
    var out = THM.readouts(outHost, [
      { key: 'al', label: 'Biot coefficient  α' },
      { key: 'B',  label: 'Skempton  B' },
      { key: 'M',  label: 'Biot modulus  M' },
      { key: 'Ku', label: 'Undrained  K<sub>u</sub>' },
      { key: 'nu', label: 'Drained  ν' },
      { key: 'nuu',label: 'Undrained  ν<sub>u</sub>' },
      { key: 'st', label: 'Stiffening  K<sub>u</sub>/K' },
      { key: 'E',  label: 'Young’s  E' }
    ]);
    outHost.querySelector('.readouts').style.cssText =
      'display:grid;grid-template-columns:repeat(auto-fit,minmax(112px,1fr));gap:.85rem 1rem';

    function update() {
      var b = biot(st.K, st.G, st.Ks, st.Kf, st.phi), C = THM.C();
      var al = [], Bs = [], nuu = [];
      for (var i = 0; i <= 120; i++) {
        var r = 0.002 + 0.996 * i / 120;                   // K / Ks
        var Kx = r * st.Ks;
        var bx = biot(Kx, st.G * (Kx / st.K || 1), st.Ks, st.Kf, st.phi);
        al.push([r, bx.alpha]);
        Bs.push([r, bx.B]);
        nuu.push([r, bx.nuu]);
      }
      plot.set([
        { name: 'Biot coefficient α', color: C.m, pts: al, width: 2.4, label: 'α' },
        { name: 'Skempton B', color: C.h, pts: Bs, width: 2.4, label: 'B' },
        { name: 'undrained Poisson νᵤ', color: C.s7, pts: nuu, width: 2, dash: [4, 4], label: 'νᵤ' },
        { color: C.t, pts: [[st.K / st.Ks, b.alpha]], marker: true, markerR: 5, noHover: true },
        { color: C.t, pts: [[st.K / st.Ks, b.B]], marker: true, markerR: 5, noHover: true }
      ], {
        after: function (ctx, P) {
          ctx.strokeStyle = C.t; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(P.sx(st.K / st.Ks), P.pt); ctx.lineTo(P.sx(st.K / st.Ks), P.pt + P.ph);
          ctx.stroke(); ctx.setLineDash([]);
        }
      });
      var E = 9 * b.K * b.G / (3 * b.K + b.G);
      out.set('al', b.alpha.toFixed(3));
      out.set('B',  b.B.toFixed(3));
      out.set('M',  (b.M / 1e9).toFixed(2) + '<small> GPa</small>');
      out.set('Ku', (b.Ku / 1e9).toFixed(2) + '<small> GPa</small>');
      out.set('nu', b.nu.toFixed(3));
      out.set('nuu', b.nuu.toFixed(3));
      out.set('st', (b.Ku / b.K).toFixed(2) + '<small>×</small>');
      out.set('E',  (E / 1e9).toFixed(2) + '<small> GPa</small>');
      if (global.__thmBiotSync) global.__thmBiotSync(b);
    }

    var ctrls = document.createElement('div');
    ctrls.className = 'controls';
    host.appendChild(ctrls);
    var row = document.createElement('div');
    row.style.cssText = 'grid-column:1/-1;display:flex;gap:.6rem;align-items:center;flex-wrap:wrap';
    row.innerHTML = '<span class="ctrl__label">Material</span>';
    ctrls.appendChild(row);
    var sl = {};
    THM.segmented(row, {
      label: 'Material', index: 2,
      options: Object.keys(MATERIALS).map(function (k) { return { value: k, label: MATERIALS[k].name }; }),
      on: function (v) {
        Object.assign(st, MATERIALS[v]);
        sl.K.value = Math.log10(st.K); sl.G.value = Math.log10(st.G);
        sl.Ks.value = st.Ks / 1e9; sl.phi.value = st.phi;
        update();
      }
    });
    sl.K = THM.slider(ctrls, { label: 'Drained bulk modulus $K$', min: 7, max: 10.9, step: 0.02,
      value: Math.log10(st.K),
      map: function (v) { return Math.pow(10, v); }, unmap: function (v) { return Math.log10(v); },
      fmt: function (v) { return (v / 1e9).toPrecision(3) + ' GPa'; },
      on: function (v) { st.K = v; update(); } });
    sl.G = THM.slider(ctrls, { label: 'Shear modulus $G$', min: 6.8, max: 10.8, step: 0.02,
      value: Math.log10(st.G),
      map: function (v) { return Math.pow(10, v); }, unmap: function (v) { return Math.log10(v); },
      fmt: function (v) { return (v / 1e9).toPrecision(3) + ' GPa'; },
      on: function (v) { st.G = v; update(); } });
    sl.Ks = THM.slider(ctrls, { label: 'Grain modulus $K_s$', min: 20, max: 80, step: 0.5, value: st.Ks / 1e9,
      fmt: function (v) { return v.toFixed(1) + ' GPa'; },
      on: function (v) { st.Ks = v * 1e9; update(); } });
    sl.phi = THM.slider(ctrls, { label: 'Porosity $\\phi$', min: 0.005, max: 0.55, step: 0.005, value: st.phi,
      fmt: function (v) { return v.toFixed(3); }, on: function (v) { st.phi = v; update(); } });

    update();
  });

  /* ============================================ 4.2  drained vs undrained */

  THM.viz('drainedFig', function (host) {
    var body = host.querySelector('.fig__body');
    body.innerHTML = '<div class="fig__split fig__split--wide"><div class="dr__plot"></div><div class="dr__out"></div></div>';
    var st = Object.assign({}, MATERIALS.sandstone);
    var dsig = 10e6;                                     // applied stress step (Pa)

    var plot = THM.plot(body.querySelector('.dr__plot'), {
      height: 275, padL: 66, padR: 40, table: false,
      x: { min: 0, max: 1.2, label: 'volumetric strain  εᵥ  (×10⁻³)' },
      y: { min: 0, max: 20, label: 'mean total stress increment  (MPa)' }
    });

    var outHost = body.querySelector('.dr__out');
    var out = THM.readouts(outHost, [
      { key: 'p',  label: 'Pore pressure generated' },
      { key: 'eu', label: 'Immediate strain' },
      { key: 'ed', label: 'Final strain' },
      { key: 'ex', label: 'Consolidation strain' },
      { key: 'B',  label: 'Skempton  B' },
      { key: 'ku', label: 'K<sub>u</sub> / K' }
    ]);
    outHost.querySelector('.readouts').style.cssText =
      'display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:.85rem 1rem';

    function update() {
      var b = biot(st.K, st.G, st.Ks, st.Kf, st.phi), C = THM.C();
      var smax = 20e6;
      var dr = [[0, 0], [smax / st.K * 1e3, smax / 1e6]];
      var un = [[0, 0], [smax / b.Ku * 1e3, smax / 1e6]];
      var eu = dsig / b.Ku * 1e3, ed = dsig / st.K * 1e3;
      plot.setAxes({ max: Math.max(1.2, smax / st.K * 1e3 * 1.08) }, { max: smax / 1e6 * 1.02 });
      plot.set([
        { name: 'undrained (fluid trapped)', color: C.h, pts: un, width: 2.4, label: 'undrained' },
        { name: 'drained (fluid free)', color: C.m, pts: dr, width: 2.4, label: 'drained' },
        { name: 'consolidation at constant total stress', color: C.t,
          pts: [[eu, dsig / 1e6], [ed, dsig / 1e6]], width: 2.4, dash: [5, 4], marker: true, markerR: 4.5 }
      ], {
        after: function (ctx, P) {
          ctx.fillStyle = C.ink3; ctx.font = '11px ' + THM.tok('sans');
          ctx.fillText('Δp = B Δσ = ' + (b.B * dsig / 1e6).toFixed(2) + ' MPa',
            P.sx(eu) + 8, P.sy(dsig / 1e6) - 12);
        }
      });
      out.set('p', (b.B * dsig / 1e6).toFixed(2) + '<small> MPa</small>');
      out.set('eu', (dsig / b.Ku * 1e3).toFixed(3) + '<small> ×10⁻³</small>');
      out.set('ed', (dsig / st.K * 1e3).toFixed(3) + '<small> ×10⁻³</small>');
      out.set('ex', ((dsig / st.K - dsig / b.Ku) * 1e3).toFixed(3) + '<small> ×10⁻³</small>');
      out.set('B', b.B.toFixed(3));
      out.set('ku', (b.Ku / st.K).toFixed(2) + '<small>×</small>');
    }

    var ctrls = document.createElement('div');
    ctrls.className = 'controls';
    host.appendChild(ctrls);
    var row = document.createElement('div');
    row.style.cssText = 'grid-column:1/-1;display:flex;gap:.6rem;align-items:center;flex-wrap:wrap';
    row.innerHTML = '<span class="ctrl__label">Material</span>';
    ctrls.appendChild(row);
    THM.segmented(row, {
      label: 'Material', index: 2,
      options: Object.keys(MATERIALS).map(function (k) { return { value: k, label: MATERIALS[k].name }; }),
      on: function (v) { Object.assign(st, MATERIALS[v]); update(); }
    });
    THM.slider(ctrls, { label: 'Applied stress step $\\Delta\\sigma$', min: 1, max: 20, step: 0.1,
      value: dsig / 1e6, fmt: function (v) { return v.toFixed(1) + ' MPa'; },
      on: function (v) { dsig = v * 1e6; update(); } });
    THM.slider(ctrls, { label: 'Porosity $\\phi$', min: 0.005, max: 0.55, step: 0.005, value: st.phi,
      fmt: function (v) { return v.toFixed(3); }, on: function (v) { st.phi = v; update(); } });

    update();
  });

  /* ============================================== 4.3  Mohr circle + fault */

  THM.viz('mohrFig', function (host) {
    var body = host.querySelector('.fig__body');
    body.innerHTML = '<div class="mohr"><div class="mohr__main"></div><div class="mohr__side"></div></div>';
    var mainHost = body.querySelector('.mohr__main'), sideHost = body.querySelector('.mohr__side');

    /* compression positive here — the geomechanics convention */
    var st = { s1: 60, s3: 30, p: 15, phi: 30, coh: 5, alpha: 1, beta: 60 };

    var cv = document.createElement('canvas');
    cv.style.cssText = 'display:block;width:100%';
    mainHost.appendChild(cv);

    var inset = document.createElement('canvas');
    inset.style.cssText = 'display:block;width:100%;max-width:230px;margin:0 auto .7rem';
    sideHost.appendChild(inset);

    function derived() {
      var e1 = st.s1 - st.alpha * st.p, e3 = st.s3 - st.alpha * st.p;
      var c = 0.5 * (e1 + e3), R = 0.5 * (e1 - e3);
      var ph = st.phi * Math.PI / 180;
      var Rf = st.coh * Math.cos(ph) + c * Math.sin(ph);      // radius at failure
      /* pore-pressure increase that brings the circle to the envelope */
      var dpFail = (c - (R - st.coh * Math.cos(ph)) / Math.sin(ph)) / st.alpha;
      /* stresses on a plane whose normal is at β to σ1 */
      var b2 = 2 * st.beta * Math.PI / 180;
      var sn = c + R * Math.cos(b2), tau = R * Math.sin(b2);
      var tauCap = st.coh + sn * Math.tan(ph);
      var dpFaultFail = (sn - (tau - st.coh) / Math.tan(ph)) / st.alpha;
      return { e1: e1, e3: e3, c: c, R: R, Rf: Rf, ph: ph, dp: dpFail,
               sn: sn, tau: tau, tauCap: tauCap, dpFault: dpFaultFail,
               fs: Rf > 0 ? Rf / R : Infinity, fsFault: tau > 0 ? tauCap / tau : Infinity };
    }

    function draw() {
      var d = derived(), C = THM.C();
      var w = mainHost.clientWidth || 520;
      var ctx = THM.fitCanvas(cv, Math.round(U.clamp(w * 0.52, 240, 340)));
      var W = ctx.__w, H = ctx.__h;
      ctx.clearRect(0, 0, W, H);

      var pad = { l: 52, r: 16, t: 14, b: 52 };
      var xmax = Math.max(80, st.s1 * 1.12), ymax = xmax * 0.62;
      var pw = W - pad.l - pad.r, ph2 = H - pad.t - pad.b;
      var sc = Math.min(pw / xmax, ph2 / ymax);
      function X(v) { return pad.l + v * sc; }
      function Y(v) { return pad.t + ph2 - v * sc; }

      /* grid + axes */
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      ctx.font = '10.5px ' + THM.tok('mono');
      ctx.fillStyle = C.ink4; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      for (var v = 0; v <= xmax; v += 20) {
        ctx.beginPath(); ctx.moveTo(X(v) + .5, pad.t); ctx.lineTo(X(v) + .5, Y(0)); ctx.stroke();
        ctx.fillText(v.toFixed(0), X(v), Y(0) + 6);
      }
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      for (var u = 0; u <= ymax; u += 20) {
        ctx.beginPath(); ctx.moveTo(pad.l, Y(u) + .5); ctx.lineTo(pad.l + pw, Y(u) + .5); ctx.stroke();
        ctx.fillText(u.toFixed(0), pad.l - 6, Y(u));
      }
      ctx.strokeStyle = C.axis;
      ctx.beginPath();
      ctx.moveTo(pad.l, Y(0) + .5); ctx.lineTo(pad.l + pw, Y(0) + .5);
      ctx.moveTo(pad.l + .5, pad.t); ctx.lineTo(pad.l + .5, Y(0));
      ctx.stroke();
      ctx.fillStyle = C.ink2; ctx.font = '11.5px ' + THM.tok('sans');
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('effective normal stress  σ′  (MPa)', pad.l + pw / 2, H - 15);
      ctx.save(); ctx.translate(14, pad.t + ph2 / 2); ctx.rotate(-Math.PI / 2);
      ctx.fillText('shear stress  τ  (MPa)', 0, 0); ctx.restore();

      /* failure envelope */
      ctx.strokeStyle = C.s8; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(X(-st.coh / Math.tan(d.ph)), Y(0));
      ctx.lineTo(X(xmax), Y(st.coh + xmax * Math.tan(d.ph)));
      ctx.stroke();
      ctx.fillStyle = C.s8; ctx.font = '600 11px ' + THM.tok('sans');
      ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      ctx.fillText('τ = c′ + σ′ tan φ′', X(xmax * 0.52) , Y(st.coh + xmax * 0.52 * Math.tan(d.ph)) - 6);

      /* total-stress circle, ghosted */
      var ct = 0.5 * (st.s1 + st.s3), Rt = 0.5 * (st.s1 - st.s3);
      ctx.strokeStyle = C.ink4; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.arc(X(ct), Y(0), Rt * sc, Math.PI, 2 * Math.PI); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.ink4; ctx.font = '10.5px ' + THM.tok('sans');
      ctx.textAlign = 'center';
      ctx.fillText('total stress', X(ct), Y(Rt) - 9);

      /* effective-stress circle */
      var touching = d.R >= d.Rf - 1e-9;
      ctx.strokeStyle = touching ? C.s8 : C.h;
      ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.arc(X(d.c), Y(0), Math.max(1, d.R * sc), Math.PI, 2 * Math.PI); ctx.stroke();
      ctx.fillStyle = touching ? 'rgba(230,103,103,.13)' : 'rgba(57,135,229,.12)';
      ctx.beginPath(); ctx.arc(X(d.c), Y(0), Math.max(1, d.R * sc), Math.PI, 2 * Math.PI); ctx.fill();

      /* pore-pressure shift arrow */
      if (st.p > 0.5) {
        ctx.strokeStyle = C.t; ctx.lineWidth = 1.6;
        var ya = Y(0) + 15;
        ctx.beginPath(); ctx.moveTo(X(ct), ya); ctx.lineTo(X(d.c), ya); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(X(d.c), ya); ctx.lineTo(X(d.c) + 6, ya - 3.5); ctx.lineTo(X(d.c) + 6, ya + 3.5);
        ctx.closePath(); ctx.fillStyle = C.t; ctx.fill();
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.font = '600 10.5px ' + THM.tok('sans');
        ctx.fillText('αp = ' + (st.alpha * st.p).toFixed(1), (X(ct) + X(d.c)) / 2, ya + 4);
      }

      /* the plane under scrutiny */
      ctx.fillStyle = touching ? C.s8 : C.m;
      ctx.beginPath(); ctx.arc(X(d.sn), Y(d.tau), 5, 0, 6.2832); ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = C.surface; ctx.stroke();
      ctx.strokeStyle = C.m; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(X(d.c), Y(0)); ctx.lineTo(X(d.sn), Y(d.tau)); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.m; ctx.font = '10.5px ' + THM.tok('sans');
      ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      ctx.fillText('plane at 2β', X(d.sn) + 8, Y(d.tau) + 16);
    }

    function drawInset() {
      var d = derived(), C = THM.C();
      var ctx = THM.fitCanvas(inset, 178);
      var W = ctx.__w, H = ctx.__h;
      ctx.clearRect(0, 0, W, H);
      var cx = W / 2, cy = H / 2 - 8, s = Math.min(W, H) * 0.26;

      ctx.save(); ctx.translate(cx, cy);
      ctx.strokeStyle = C.axis; ctx.lineWidth = 1.5;
      ctx.fillStyle = THM.theme.isDark() ? '#1d1d19' : '#f0efe9';
      ctx.beginPath(); ctx.rect(-s, -s, 2 * s, 2 * s); ctx.fill(); ctx.stroke();

      /* principal stress arrows: σ1 vertical, σ3 horizontal */
      function arrow(dx, dy, len, col, lab) {
        ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2;
        var x0 = dx * (s + 4), y0 = dy * (s + 4);
        var x1 = dx * (s + 4 + len), y1 = dy * (s + 4 + len);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x0, y0); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x0 + dy * 4 - dx * 7, y0 - dx * 4 - dy * 7);
        ctx.lineTo(x0 - dy * 4 - dx * 7, y0 + dx * 4 - dy * 7);
        ctx.closePath(); ctx.fill();
        ctx.font = '10px ' + THM.tok('sans'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(lab, x1 + dx * 10, y1 + dy * 9);
      }
      arrow(0, -1, 16, C.ink3, 'σ₁');
      arrow(0, 1, 16, C.ink3, 'σ₁');
      arrow(-1, 0, 12, C.ink4, 'σ₃');
      arrow(1, 0, 12, C.ink4, 'σ₃');

      /* the fault plane: normal at β to σ1 (vertical), so the plane itself
         is at β from horizontal */
      var b = st.beta * Math.PI / 180;
      var dxp = Math.cos(b), dyp = -Math.sin(b);
      ctx.strokeStyle = d.tauCap < d.tau ? C.s8 : C.m;
      ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-dxp * s * 1.3, -dyp * s * 1.3);
      ctx.lineTo(dxp * s * 1.3, dyp * s * 1.3);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = C.ink3; ctx.font = '10.5px ' + THM.tok('sans');
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText('β = ' + st.beta.toFixed(0) + '° from σ₁  ·  optimal ' +
        (45 + st.phi / 2).toFixed(0) + '°', W / 2, H - 3);
    }

    var out;
    function update() {
      draw(); drawInset();
      var d = derived();
      out.set('fs', d.fs === Infinity ? '—' : d.fs.toFixed(2));
      out.set('dp', d.dp > 0 ? d.dp.toFixed(1) + '<small> MPa</small>' : 'already failing');
      out.set('sn', d.sn.toFixed(1) + '<small> MPa</small>');
      out.set('tau', d.tau.toFixed(1) + '<small> MPa</small>');
      out.set('cap', d.tauCap.toFixed(1) + '<small> MPa</small>');
      out.set('dpf', d.dpFault > 0 ? d.dpFault.toFixed(1) + '<small> MPa</small>' : 'slipping');
    }

    out = THM.readouts(sideHost, [
      { key: 'fs',  label: 'Factor of safety (intact)' },
      { key: 'dp',  label: 'Δp to intact failure' },
      { key: 'sn',  label: 'σ′ on fault' },
      { key: 'tau', label: 'τ on fault' },
      { key: 'cap', label: 'Fault strength' },
      { key: 'dpf', label: 'Δp to fault slip' }
    ]);
    sideHost.querySelector('.readouts').style.cssText =
      'display:grid;grid-template-columns:repeat(auto-fit,minmax(112px,1fr));gap:.8rem 1rem';

    var ctrls = document.createElement('div');
    ctrls.className = 'controls';
    host.appendChild(ctrls);
    THM.slider(ctrls, { label: 'Major total stress $\\sigma_1$', min: 10, max: 120, step: 0.5, value: st.s1,
      fmt: function (v) { return v.toFixed(1) + ' MPa'; },
      on: function (v) { st.s1 = Math.max(v, st.s3 + 0.5); update(); } });
    THM.slider(ctrls, { label: 'Minor total stress $\\sigma_3$', min: 0, max: 80, step: 0.5, value: st.s3,
      fmt: function (v) { return v.toFixed(1) + ' MPa'; },
      on: function (v) { st.s3 = Math.min(v, st.s1 - 0.5); update(); } });
    var pS = THM.slider(ctrls, { label: 'Pore pressure $p$', min: 0, max: 60, step: 0.25, value: st.p,
      fmt: function (v) { return v.toFixed(2) + ' MPa'; },
      on: function (v) { st.p = v; update(); } });
    THM.slider(ctrls, { label: 'Friction angle $\\varphi\'$', min: 15, max: 45, step: 0.5, value: st.phi,
      fmt: function (v) { return v.toFixed(1) + '°'; }, on: function (v) { st.phi = v; update(); } });
    THM.slider(ctrls, { label: 'Cohesion $c\'$', min: 0, max: 20, step: 0.25, value: st.coh,
      fmt: function (v) { return v.toFixed(2) + ' MPa'; }, on: function (v) { st.coh = v; update(); } });
    THM.slider(ctrls, { label: 'Fault orientation $\\beta$', min: 5, max: 85, step: 1, value: st.beta,
      fmt: function (v) { return v.toFixed(0) + '°'; }, on: function (v) { st.beta = v; update(); } });

    new ResizeObserver(function () { draw(); }).observe(mainHost);
    global.addEventListener('thm:theme', update);
    update();
  });

})(window);

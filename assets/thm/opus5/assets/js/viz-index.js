/* =============================================================================
   Chapter 00 — Overview
   · hero: a real masked-Darcy pressure solve driving tracers and a thermal front
   · the interactive coupling map
   · the regime calculator (time-scale timeline + dimensionless groups)
   ========================================================================== */
(function (global) {
  'use strict';
  var THM = global.THM, U = THM.util;

  function rng(seed) {                                    // mulberry32
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* ======================================================== 1. hero canvas */

  THM.viz('heroStage', function (host) {
    var cv = host.querySelector('canvas');
    var S = null;

    /* a shaded-sphere sprite so grains read as solid rather than as holes */
    function grainSprite() {
      var s = document.createElement('canvas'), R = 96;
      s.width = s.height = R;
      var c = s.getContext('2d');
      var g = c.createRadialGradient(R * 0.38, R * 0.33, R * 0.04, R * 0.5, R * 0.5, R * 0.5);
      g.addColorStop(0.00, 'rgba(255,255,255,.26)');
      g.addColorStop(0.35, 'rgba(255,255,255,.07)');
      g.addColorStop(0.72, 'rgba(0,0,0,.13)');
      g.addColorStop(0.94, 'rgba(0,0,0,.40)');
      g.addColorStop(1.00, 'rgba(0,0,0,.55)');
      c.beginPath(); c.arc(R / 2, R / 2, R / 2 - 0.5, 0, 6.2832);
      c.fillStyle = g; c.fill();
      c.lineWidth = 1.6; c.strokeStyle = 'rgba(0,0,0,.35)'; c.stroke();
      return s;
    }

    function build() {
      var wCss = host.clientWidth || 900;
      var hCss = Math.round(U.clamp(wCss * 0.40, 230, 430));
      var ctx = THM.fitCanvas(cv, hCss);
      var asp = hCss / wCss;

      var nx = 260, ny = Math.max(48, Math.round(nx * asp));
      var dx = 1 / nx;                                    // world units
      var n = nx * ny;
      var rand = rng(20260808);

      /* --- grains: random sequential adsorption with slight overlap --- */
      /* a smooth grain-size trend so the pack has coarse and fine bands —
         permeability follows pore size, which is what makes flow channel     */
      function texture(x, y) {
        return 0.5 + 0.26 * Math.sin(5.9 * x + 1.3) + 0.17 * Math.sin(13.0 * y + 2.4)
                   + 0.11 * Math.sin(9.7 * (x + 1.7 * y) + 0.6);
      }
      /* three passes, coarse to fine, so the smaller grains fill the gaps */
      var grains = [];
      [[0.023, 0.038, 20000], [0.014, 0.023, 16000]]
        .forEach(function (pass) {
          for (var t = 0; t < pass[2]; t++) {
            var gx = rand() * 1.07 - 0.035;
            var gy = rand() * (asp + 0.07) - 0.035;
            var f = U.clamp(texture(gx, gy), 0, 1);
            var r = pass[0] + (pass[1] - pass[0]) * f;
            var ok = true;
            for (var q = 0; q < grains.length; q++) {
              var g = grains[q], ddx = g.x - gx, ddy = g.y - gy;
              if (ddx * ddx + ddy * ddy < Math.pow((g.r + r) * 0.98, 2)) { ok = false; break; }
            }
            if (ok) grains.push({ x: gx, y: gy, r: r });
          }
        });

      /* --- rasterise the solid mask and the permeability field -------- */
      var mask = new Uint8Array(n), kf = new Float64Array(n);
      var cell = 0.06, gh = {};                       // coarse hash for speed
      grains.forEach(function (g, gi) {
        var i0 = Math.floor((g.x - g.r) / cell), i1 = Math.floor((g.x + g.r) / cell);
        var j0 = Math.floor((g.y - g.r) / cell), j1 = Math.floor((g.y + g.r) / cell);
        for (var a = i0; a <= i1; a++) for (var b = j0; b <= j1; b++) {
          var k = a + ',' + b; (gh[k] || (gh[k] = [])).push(gi);
        }
      });
      for (var j = 0; j < ny; j++) {
        var yc = (j + 0.5) * dx;
        for (var i = 0; i < nx; i++) {
          var xc = (i + 0.5) * dx, s = 0;
          var list = gh[Math.floor(xc / cell) + ',' + Math.floor(yc / cell)];
          if (list) for (var li = 0; li < list.length; li++) {
            var G = grains[list[li]], ex = G.x - xc, ey = G.y - yc;
            if (ex * ex + ey * ey < G.r * G.r) { s = 1; break; }
          }
          mask[j * nx + i] = s;
          kf[j * nx + i] = s ? 1e-6 : 1;
        }
      }

      /* --- steady Darcy pressure: ∇·(k∇p)=0, p(left)=1, p(right)=0 --- */
      var p = new Float64Array(n);
      for (var j2 = 0; j2 < ny; j2++)
        for (var i2 = 0; i2 < nx; i2++) p[j2 * nx + i2] = 1 - i2 / (nx - 1);

      function kh(a, b) { return 2 * a * b / (a + b + 1e-30); }   // harmonic face k
      var om = 1.94;
      for (var it = 0; it < 700; it++) {
        for (var jj = 0; jj < ny; jj++) {
          for (var ii = 1; ii < nx - 1; ii++) {
            var c = jj * nx + ii, kc = kf[c], num = 0, den = 0, tf;
            tf = kh(kc, kf[c - 1]); num += tf * p[c - 1]; den += tf;
            tf = kh(kc, kf[c + 1]); num += tf * p[c + 1]; den += tf;
            if (jj > 0)      { tf = kh(kc, kf[c - nx]); num += tf * p[c - nx]; den += tf; }
            if (jj < ny - 1) { tf = kh(kc, kf[c + nx]); num += tf * p[c + nx]; den += tf; }
            p[c] += om * (num / den - p[c]);
          }
        }
      }

      /* --- Darcy velocity at cell centres ---------------------------- */
      var vx = new Float64Array(n), vy = new Float64Array(n), speeds = [];
      for (var j3 = 0; j3 < ny; j3++) {
        for (var i3 = 0; i3 < nx; i3++) {
          var c3 = j3 * nx + i3;
          var iL = Math.max(0, i3 - 1), iR = Math.min(nx - 1, i3 + 1);
          var jD = Math.max(0, j3 - 1), jU = Math.min(ny - 1, j3 + 1);
          vx[c3] = -kf[c3] * (p[j3 * nx + iR] - p[j3 * nx + iL]) / ((iR - iL) * dx);
          vy[c3] = -kf[c3] * (p[jU * nx + i3] - p[jD * nx + i3]) / ((jU - jD) * dx);
          if (!mask[c3]) speeds.push(Math.hypot(vx[c3], vy[c3]));
        }
      }
      speeds.sort(function (a, b) { return a - b; });
      var vref = speeds[Math.floor(speeds.length * 0.5)] || 1;   // median pore speed
      for (var c4 = 0; c4 < n; c4++) { vx[c4] /= vref; vy[c4] /= vref; }

      /* --- tracers ---------------------------------------------------- */
      var NP = Math.round(U.clamp(wCss * 1.15, 460, 1100)), parts = [], TRAIL = 14;
      function cellOf(x, y) {
        var i = U.clamp(Math.floor(x / dx), 0, nx - 1);
        var j = U.clamp(Math.floor(y / dx), 0, ny - 1);
        return j * nx + i;
      }
      /* Seed where the fluid is actually moving: a stagnant tracer draws
         nothing, so bias the sampling by the local speed.                 */
      function seed(pt) {
        var t2 = 0, best = null;
        while (t2 < 60) {
          t2++;
          var x = rand(), y = rand() * asp, c = cellOf(x, y);
          if (mask[c]) continue;
          var sp2 = Math.hypot(vx[c], vy[c]);
          if (!best) best = [x, y];
          if (rand() < Math.min(1, Math.sqrt(sp2) * 0.75)) { best = [x, y]; break; }
        }
        pt.x = best ? best[0] : 0.02; pt.y = best ? best[1] : rand() * asp;
        pt.age = 0; pt.n = 0; pt.life = 2.5 + rand() * 5;
        pt.hx = pt.hx || new Float32Array(TRAIL);
        pt.hy = pt.hy || new Float32Array(TRAIL);
      }
      for (var pI = 0; pI < NP; pI++) { var pt = { x: 0, y: 0 }; seed(pt); pt.age = rand() * pt.life; parts.push(pt); }

      /* --- temperature: hot rock = 1, cold injectate = 0 -------------- */
      var T = new Float64Array(n), Tn = new Float64Array(n);
      for (var jT = 0; jT < ny; jT++)
        for (var iT = 0; iT < nx; iT++)
          T[jT * nx + iT] = U.clamp((iT / nx - 0.10) * 7, 0, 1);   // front already inside

      S = {
        ctx: ctx, W: wCss, H: hCss, asp: asp, nx: nx, ny: ny, dx: dx,
        mask: mask, T: T, Tn: Tn, vx: vx, vy: vy, grains: grains, parts: parts,
        seed: seed, cellOf: cellOf, reheat: false, TRAIL: TRAIL,
        sprite: grainSprite()
      };
      if (global.__thmDebug) {
        global.__heroS = S;
        var solidFrac = 0, vsum = 0, vmx = 0;
        for (var d1 = 0; d1 < n; d1++) {
          solidFrac += mask[d1];
          var sp1 = Math.hypot(vx[d1], vy[d1]); vsum += sp1; if (sp1 > vmx) vmx = sp1;
        }
        console.log('hero: grains=' + grains.length + ' solid=' + (solidFrac / n).toFixed(3) +
          ' vmean=' + (vsum / n).toFixed(4) + ' vmax=' + vmx.toFixed(3) + ' vref=' + vref.toExponential(2));
      }
    }

    function sample(f, x, y) {
      var nx = S.nx, ny = S.ny, dx = S.dx;
      var fx = x / dx - 0.5, fy = y / dx - 0.5;
      var i = Math.floor(fx), j = Math.floor(fy);
      var tx = fx - i, ty = fy - j;
      i = U.clamp(i, 0, nx - 2); j = U.clamp(j, 0, ny - 2);
      var a = f[j * nx + i], b = f[j * nx + i + 1],
          c = f[(j + 1) * nx + i], d = f[(j + 1) * nx + i + 1];
      return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;
    }

    function step(dt) {
      var nx = S.nx, ny = S.ny, dx = S.dx, T = S.T, Tn = S.Tn, vx = S.vx, vy = S.vy;

      /* the thermal front is advected at a fraction of the tracer speed —
         heat stored in the solid is what retards it — plus conduction.     */
      var adv = 0.050, cap = 4, kap = 2.4e-6, sub = 5, h = dt / sub;
      for (var s = 0; s < sub; s++) {
        for (var j = 0; j < ny; j++) {
          for (var i = 0; i < nx; i++) {
            var c = j * nx + i;
            var iL = i > 0 ? c - 1 : c, iR = i < nx - 1 ? c + 1 : c;
            var jD = j > 0 ? c - nx : c, jU = j < ny - 1 ? c + nx : c;
            var lap = (T[iL] + T[iR] + T[jD] + T[jU] - 4 * T[c]) / (dx * dx);
            var u = U.clamp(vx[c], -cap, cap) * adv, v = U.clamp(vy[c], -cap, cap) * adv;
            var gxT = u > 0 ? (T[c] - T[iL]) / dx : (T[iR] - T[c]) / dx;
            var gyT = v > 0 ? (T[c] - T[jD]) / dx : (T[jU] - T[c]) / dx;
            Tn[c] = T[c] + h * (kap * lap - u * gxT - v * gyT);
          }
        }
        for (var j2 = 0; j2 < ny; j2++) Tn[j2 * nx] = 0;              // cold inlet
        T.set(Tn);
      }

      /* slow reheat so the animation loops without a jump cut */
      var mean = 0, cnt = 0;
      for (var q = 0; q < T.length; q += 11) { mean += T[q]; cnt++; }
      mean /= cnt;
      if (!S.reheat && mean < 0.28) S.reheat = true;
      if (S.reheat) {
        var f = Math.min(1, dt * 0.55), done = true;
        for (var q2 = 0; q2 < T.length; q2++) {
          T[q2] += (1 - T[q2]) * f;
          if (T[q2] < 0.98) done = false;
        }
        if (done) S.reheat = false;
      }

      /* tracers travel at the pore velocity — visibly ahead of the heat */
      var sp = 0.16, TR = S.TRAIL;
      S.parts.forEach(function (pt) {
        var u = sample(vx, pt.x, pt.y) * sp, v = sample(vy, pt.x, pt.y) * sp;
        pt.x += u * dt; pt.y += v * dt; pt.age += dt;
        if (pt.x > 1.005 || pt.y < -0.02 || pt.y > S.asp + 0.02 || pt.age > pt.life) {
          S.seed(pt); return;
        }
        var k = pt.n % TR;
        pt.hx[k] = pt.x; pt.hy[k] = pt.y; pt.n++;
      });
    }

    function draw(dt) {
      var ctx = S.ctx, W = S.W, H = S.H, C = THM.C(), ramp = THM.ramp('ember');
      ctx.clearRect(0, 0, W, H);
      THM.paintField(ctx, S.T, S.nx, S.ny, 0, 0, W, H, ramp, 0, 1, { smooth: true });

      /* grains, shaded, contracting slightly where the rock has cooled */
      var sc = W, sprite = S.sprite;
      S.grains.forEach(function (g) {
        var t = sample(S.T, U.clamp(g.x, 0, 0.999), U.clamp(g.y, 0, S.asp - 1e-3));
        var r = g.r * (1 - 0.05 * (1 - t)) * sc;
        ctx.drawImage(sprite, g.x * sc - r, g.y * sc - r, 2 * r, 2 * r);
      });

      /* streaklines: each tracer draws the path it has just taken */
      var TR = S.TRAIL;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (var band = 0; band < 3; band++) {
        ctx.beginPath();
        ctx.strokeStyle = '#7cc0ff';
        ctx.globalAlpha = [0.20, 0.45, 0.85][band];
        ctx.lineWidth = [1.2, 1.7, 2.2][band];
        var lo = [TR - 1, Math.round(TR * 0.62), Math.round(TR * 0.28)][band];
        var hi = [Math.round(TR * 0.62), Math.round(TR * 0.28), 1][band];
        S.parts.forEach(function (pt) {
          var have = Math.min(pt.n, TR);
          if (have < 3) return;
          var started = false;
          for (var a = lo; a >= hi; a--) {
            if (a >= have) continue;
            var idx = (pt.n - 1 - a % TR + 2 * TR) % TR;
            var X = pt.hx[idx] * sc, Y = pt.hy[idx] * sc;
            if (!started) { ctx.moveTo(X, Y); started = true; } else ctx.lineTo(X, Y);
          }
        });
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#a8d6ff';
      S.parts.forEach(function (pt) {
        ctx.beginPath(); ctx.arc(pt.x * sc, pt.y * sc, 1.5, 0, 6.2832); ctx.fill();
      });

      /* injection face */
      var grd = ctx.createLinearGradient(0, 0, 26, 0);
      grd.addColorStop(0, 'rgba(57,135,229,.85)');
      grd.addColorStop(1, 'rgba(57,135,229,0)');
      ctx.fillStyle = grd; ctx.fillRect(0, 0, 26, H);
    }

    build();
    var reT = 0;                       // debounce: a transient reflow must not
    new ResizeObserver(function () {   // throw away the pressure solve
      clearTimeout(reT);
      reT = setTimeout(function () {
        if (Math.abs(host.clientWidth - S.W) > 24) { build(); draw(0.016); }
      }, 280);
    }).observe(host);
    THM.loop(host, function (dt) { var d = Math.min(dt, 0.033); step(d); draw(d); });
  });

  /* ================================================== 2. the coupling map */

  var LINKS = [
    { key: 'hm', from: 'H', to: 'M', name: 'Effective stress', strength: 4,
      strengthWord: 'dominant',
      lead: 'Pore pressure carries part of the total load, so the grain skeleton only feels what is left over.',
      body: 'Total stress is shared between the fluid and the frame. Raise the pressure and the frame is unloaded — it swells, it weakens, and if a fault is nearby its clamping stress drops. This is the coupling that makes injection induce earthquakes, rain trigger landslides, and saturated sand liquefy.',
      math: "\\boldsymbol{\\sigma}' = \\boldsymbol{\\sigma} + \\alpha p\\,\\boldsymbol{I}, \\qquad \\alpha = 1-\\frac{K}{K_s}",
      facts: [['Biot coefficient α', 'sandstone 0.7–0.9 · granite 0.2–0.5 · soil ≈ 1'],
              ['Effect of +1 MPa pore pressure', 'effective normal stress falls by α MPa'],
              ['Typical fault reactivation', '1–3 MPa of pressure change is often enough']] },

    { key: 'mh', from: 'M', to: 'H', name: 'Pore-volume change', strength: 4,
      strengthWord: 'dominant',
      lead: 'Deforming the skeleton changes the space the fluid lives in, so it must flow.',
      body: 'Compress the frame and pore volume shrinks; the fluid inside is pressurised and squeezed out. Because that escape is limited by permeability, the settlement is not instant — it diffuses. Together with effective stress this pair turns loading into a diffusion problem: consolidation.',
      math: "\\frac{\\partial\\zeta}{\\partial t} = \\alpha\\,\\frac{\\partial \\varepsilon_v}{\\partial t} + \\frac{1}{M}\\frac{\\partial p}{\\partial t}",
      facts: [['Skempton coefficient B', 'stiff rock 0.5–0.8 · soft soil ≈ 1'],
              ['Consolidation time', 'scales as $H^2/c_v$ — double the layer, quadruple the wait'],
              ['Second-order channel', 'porosity change feeds back into $k(\\phi)$']] },

    { key: 'tm', from: 'T', to: 'M', name: 'Thermal stress', strength: 4,
      strengthWord: 'strong',
      lead: 'A material that is not free to expand answers a temperature change with stress.',
      body: 'Under full lateral constraint the stress change is $3K\\alpha_T\\Delta T$ — for granite roughly half a megapascal for every kelvin, for a soft clay a hundred times less. Cooling a reservoir by tens of kelvin therefore relieves tens of megapascals, opening fractures near an injector and shifting stress far outside the cooled rock itself.',
      math: "\\Delta\\boldsymbol{\\sigma} = -3K\\alpha_T\\,\\Delta T\\,\\boldsymbol{I} \\quad\\text{(fully constrained)}",
      facts: [['Granite', '$3K\\alpha_T \\approx 0.5$–$0.9$ MPa K⁻¹'],
              ['Sandstone', '$\\approx 0.2$–$0.4$ MPa K⁻¹'],
              ['Cooling by 40 K', 'up to ~30 MPa of tensile relief']] },

    { key: 'mt', from: 'M', to: 'T', name: 'Thermoelastic & dissipative heating', strength: 1,
      strengthWord: 'usually negligible',
      lead: 'Straining a solid changes its temperature — by very little, except where a fault slips.',
      body: 'Adiabatic compression warms the medium and extension cools it, but the magnitude is milli-kelvin per megapascal, so this term is dropped from nearly every engineering model. The exception is localised dissipation: frictional heating on a slipping fault can raise temperatures by hundreds of kelvin over millimetres, which then feeds thermal pressurisation and can control how the rupture runs.',
      math: "-\\,T_0\\,3K\\alpha_T\\,\\frac{\\partial\\varepsilon_v}{\\partial t}\\;\\;\\text{added to the energy balance}",
      facts: [['Thermoelastic effect', '≈ 1–3 mK per MPa of mean stress'],
              ['Frictional heating on a fault', 'hundreds of K over a millimetric slip zone'],
              ['Practical rule', 'keep it only for dynamic rupture and shear bands']] },

    { key: 'th', from: 'T', to: 'H', name: 'Viscosity, buoyancy, pressurisation', strength: 3,
      strengthWord: 'strong',
      lead: 'Temperature rewrites the fluid’s properties — and can pressurise it outright.',
      body: 'Three channels at once. Viscosity: water thins by a factor of five or more between 20 and 150 °C, so mobility $k/\\mu$ rises with temperature. Density: warm water is buoyant, and above a critical Rayleigh number the fluid convects on its own. Expansion: water expands roughly an order of magnitude more than the mineral frame, so heating a poorly drained rock raises pore pressure directly — the mechanism behind thermal pressurisation of faults.',
      math: "\\mu = \\mu(T),\\qquad \\rho_f = \\rho_f(T),\\qquad \\left.\\frac{\\partial p}{\\partial t}\\right|_{\\text{undrained}} = \\Lambda\\,\\frac{\\partial T}{\\partial t}",
      facts: [['Water viscosity', '1.00 mPa·s at 20 °C → 0.18 at 150 °C'],
              ['Thermal pressurisation Λ', '0.1–1.5 MPa K⁻¹ in low-permeability rock'],
              ['Free convection', 'onset near $\\mathrm{Ra} \\approx 40$ for a heated layer']] },

    { key: 'ht', from: 'H', to: 'T', name: 'Advection', strength: 4,
      strengthWord: 'dominant where permeable',
      lead: 'Flowing water carries heat with it — but the solid holds most of the heat, so the front lags.',
      body: 'The advective term $(\\rho c)_f\\,\\vec v\\cdot\\nabla T$ competes with conduction; the Péclet number says which wins. Because heat is stored in the solid as well as the fluid, a thermal front travels several times slower than the water that drives it. That retardation is why a geothermal doublet can produce for decades before the cold front arrives.',
      math: "\\mathrm{Pe} = \\frac{(\\rho c)_f\\,|\\vec v|\\,L}{\\lambda_m},\\qquad \\frac{v_T}{v_f} = \\frac{\\phi\\,(\\rho c)_f}{(\\rho c)_m}",
      facts: [['Retardation factor', 'typically 4–8: heat moves at a fifth of the water speed'],
              ['Pe ≫ 1', 'sharp travelling front — grid it finely or you will smear it'],
              ['Pe ≪ 1', 'conduction dominates; the flow field barely matters']] }
  ];

  var NODES = {
    T: { label: 'T', name: 'Thermal', color: 'c-t', unknown: 'T',
         law: 'Energy balance for the mixture',
         math: "(\\rho c)_m\\frac{\\partial T}{\\partial t} + (\\rho c)_f\\,\\vec v\\cdot\\nabla T - \\nabla\\!\\cdot\\!(\\lambda_m\\nabla T) = Q",
         body: 'Heat is stored in solid and fluid together, conducted through both, and carried by the fluid. Local thermal equilibrium — one temperature for both phases — is the standard assumption and is excellent unless the flow is very fast or the grains are very large.' },
    H: { label: 'H', name: 'Hydraulic', color: 'c-h', unknown: 'p',
         law: 'Fluid mass balance with Darcy flux',
         math: "S_\\varepsilon\\frac{\\partial p}{\\partial t} + \\alpha\\frac{\\partial \\varepsilon_v}{\\partial t} - \\nabla\\!\\cdot\\!\\left(\\frac{k}{\\mu}\\nabla p\\right) = q",
         body: 'What accumulates in a pore volume equals what flows in. Storage comes from fluid compressibility and pore-space compressibility; the flux is Darcy’s law, itself an upscaled Stokes flow through the pore network.' },
    M: { label: 'M', name: 'Mechanical', color: 'c-m', unknown: '\\vec u',
         law: 'Quasi-static momentum balance',
         math: "\\nabla\\!\\cdot\\!\\boldsymbol{\\sigma} + \\rho\\,\\vec g = \\vec 0,\\qquad \\boldsymbol{\\sigma} = \\boldsymbol{\\sigma}' - \\alpha p\\,\\boldsymbol{I}",
         body: 'The skeleton must be in equilibrium at every instant — inertia only matters for seismic waves. The constitutive law relates effective stress to strain; whether it is elastic, plastic or damaging is where most of the modelling effort in geomechanics goes.' }
  };

  THM.viz('couplingMap', function (host) {
    var body = host.querySelector('.fig__body');
    body.innerHTML =
      '<div class="cmap">' +
        '<div class="cmap__svg"></div>' +
        '<div class="cmap__panel" id="cmapPanel" role="region" aria-live="polite"></div>' +
      '</div>';

    var svgHost = body.querySelector('.cmap__svg');
    var panel = body.querySelector('.cmap__panel');

    var P = { T: [220, 66], H: [86, 268], M: [354, 268] }, R = 44;
    var NS = 'http://www.w3.org/2000/svg';

    function el(t, a) {
      var e = document.createElementNS(NS, t);
      for (var k in a) e.setAttribute(k, a[k]);
      return e;
    }

    var svg = el('svg', { viewBox: '0 0 440 336', role: 'img',
      'aria-label': 'Directed coupling graph between thermal, hydraulic and mechanical physics' });
    svg.style.cssText = 'width:100%;height:auto;display:block;overflow:visible';

    var defs = el('defs', {});
    LINKS.forEach(function (L) {
      var a = P[L.from], b = P[L.to];
      var g = el('linearGradient', { id: 'g-' + L.key, gradientUnits: 'userSpaceOnUse',
        x1: a[0], y1: a[1], x2: b[0], y2: b[1] });
      g.appendChild(el('stop', { offset: '0%',  'stop-color': 'var(--c-' + L.from.toLowerCase() + ')' }));
      g.appendChild(el('stop', { offset: '100%','stop-color': 'var(--c-' + L.to.toLowerCase() + ')' }));
      defs.appendChild(g);
      var mk = el('marker', { id: 'ah-' + L.key, viewBox: '0 0 10 10', refX: 8.5, refY: 5,
        markerWidth: 5.2, markerHeight: 5.2, orient: 'auto-start-reverse' });
      mk.appendChild(el('path', { d: 'M0,0.6 L10,5 L0,9.4 z', fill: 'var(--c-' + L.to.toLowerCase() + ')' }));
      defs.appendChild(mk);
    });
    svg.appendChild(defs);

    function geom(L) {
      var a = P[L.from], b = P[L.to];
      var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
      var ux = dx / len, uy = dy / len, nxp = -uy, nyp = ux;
      var th = 0.40, ct = Math.cos(th), st = Math.sin(th);
      var s = [a[0] + (ux * ct + nxp * st) * R, a[1] + (uy * ct + nyp * st) * R];
      var e = [b[0] + (-ux * ct + nxp * st) * (R + 6), b[1] + (-uy * ct + nyp * st) * (R + 6)];
      var c = [(a[0] + b[0]) / 2 + nxp * 56, (a[1] + b[1]) / 2 + nyp * 56];
      return { s: s, e: e, c: c };
    }

    var arcs = {};
    LINKS.forEach(function (L) {
      var g = geom(L);
      var d = 'M' + g.s[0] + ',' + g.s[1] + ' Q' + g.c[0] + ',' + g.c[1] + ' ' + g.e[0] + ',' + g.e[1];
      var vis = el('path', { d: d, fill: 'none', stroke: 'url(#g-' + L.key + ')',
        'stroke-width': 3, 'stroke-linecap': 'round', 'marker-end': 'url(#ah-' + L.key + ')' });
      vis.style.transition = 'opacity .18s, stroke-width .18s';
      var hit = el('path', { d: d, fill: 'none', stroke: 'transparent', 'stroke-width': 24,
        tabindex: '0', role: 'button', 'aria-label': L.from + ' affects ' + L.to + ': ' + L.name });
      hit.style.cursor = 'pointer';
      hit.addEventListener('click', function () { select(L.key); });
      hit.addEventListener('keydown', function (e2) {
        if (e2.key === 'Enter' || e2.key === ' ') { e2.preventDefault(); select(L.key); }
      });
      hit.addEventListener('mouseenter', function () { if (!sel || sel !== L.key) vis.setAttribute('stroke-width', 4.5); });
      hit.addEventListener('mouseleave', function () { paint(); });
      svg.appendChild(vis); svg.appendChild(hit);

      /* label riding the arc */
      var mid = [0.25 * g.s[0] + 0.5 * g.c[0] + 0.25 * g.e[0],
                 0.25 * g.s[1] + 0.5 * g.c[1] + 0.25 * g.e[1]];
      var lab = el('text', { x: mid[0], y: mid[1], 'text-anchor': 'middle',
        'dominant-baseline': 'middle', 'font-size': '10.5', 'font-weight': '600',
        fill: 'var(--ink-3)' });
      lab.textContent = L.from + '→' + L.to;
      lab.style.pointerEvents = 'none';
      svg.appendChild(lab);
      arcs[L.key] = { vis: vis, lab: lab, hit: hit };
    });

    var nodeEls = {};
    Object.keys(NODES).forEach(function (k) {
      var N = NODES[k], c = P[k];
      var g = el('g', { tabindex: '0', role: 'button', 'aria-label': N.name + ' physics' });
      g.style.cursor = 'pointer';
      g.appendChild(el('circle', { cx: c[0], cy: c[1], r: R, fill: 'var(--surface-1)',
        stroke: 'var(--' + N.color + ')', 'stroke-width': 2 }));
      var t1 = el('text', { x: c[0], y: c[1] - 7, 'text-anchor': 'middle', 'font-size': '25',
        'font-weight': '680', fill: 'var(--' + N.color + ')' });
      t1.textContent = N.label;
      var t2 = el('text', { x: c[0], y: c[1] + 15, 'text-anchor': 'middle', 'font-size': '10.5',
        fill: 'var(--ink-3)' });
      t2.textContent = N.name;
      g.appendChild(t1); g.appendChild(t2);
      g.addEventListener('click', function () { select('node:' + k); });
      g.addEventListener('keydown', function (e2) {
        if (e2.key === 'Enter' || e2.key === ' ') { e2.preventDefault(); select('node:' + k); }
      });
      svg.appendChild(g);
      nodeEls[k] = g;
    });

    svgHost.appendChild(svg);

    var sel = 'hm';
    function paint() {
      LINKS.forEach(function (L) {
        var on = sel === L.key;
        arcs[L.key].vis.setAttribute('stroke-width', on ? 5 : 3);
        arcs[L.key].vis.style.opacity = (sel && sel.indexOf('node:') === 0)
          ? (sel === 'node:' + L.from || sel === 'node:' + L.to ? 1 : 0.18)
          : (on ? 1 : 0.30);
        arcs[L.key].lab.style.opacity = arcs[L.key].vis.style.opacity;
      });
      Object.keys(nodeEls).forEach(function (k) {
        var active = sel === 'node:' + k ||
          (sel.indexOf('node:') !== 0 && LINKS.some(function (L) {
            return L.key === sel && (L.from === k || L.to === k); }));
        nodeEls[k].style.opacity = active ? 1 : 0.42;
      });
    }

    function meter(v, color) {
      var out = '';
      for (var i = 1; i <= 4; i++)
        out += '<span style="width:15px;height:5px;border-radius:3px;background:' +
               (i <= v ? color : 'var(--surface-3)') + '"></span>';
      return '<span style="display:inline-flex;gap:3px;vertical-align:middle">' + out + '</span>';
    }

    function select(key) {
      sel = key; paint();
      if (key.indexOf('node:') === 0) {
        var N = NODES[key.slice(5)];
        panel.innerHTML =
          '<p class="cmap__kicker" style="color:var(--' + N.color + ')">' + N.name + ' · unknown <span data-math="' + N.unknown + '"></span></p>' +
          '<h4>' + N.law + '</h4>' +
          '<div class="eq" style="margin:.4rem 0 .8rem" data-display data-math="' + N.math.replace(/"/g, '&quot;') + '"></div>' +
          '<p>' + N.body + '</p>';
      } else {
        var L = LINKS.filter(function (x) { return x.key === key; })[0];
        var col = 'var(--c-' + L.from.toLowerCase() + ')';
        panel.innerHTML =
          '<p class="cmap__kicker"><span class="pill pill--' + L.from.toLowerCase() + '">' + L.from + '</span>' +
          '<span style="color:var(--ink-4)">→</span>' +
          '<span class="pill pill--' + L.to.toLowerCase() + '">' + L.to + '</span></p>' +
          '<h4>' + L.name + '</h4>' +
          '<p class="cmap__lead">' + L.lead + '</p>' +
          '<div class="eq" style="margin:.2rem 0 .9rem" data-display data-math="' + L.math.replace(/"/g, '&quot;') + '"></div>' +
          '<p>' + L.body + '</p>' +
          '<div class="cmap__strength">' + meter(L.strength, col) +
            '<span>' + L.strengthWord + '</span></div>' +
          '<dl class="cmap__facts">' + L.facts.map(function (f) {
            return '<dt>' + f[0] + '</dt><dd>' + f[1] + '</dd>';
          }).join('') + '</dl>';
      }
      THM.renderMathIn(panel);
    }

    select('hm');
  });

  /* ============================================== 3. the regime calculator */

  var PRESETS = {
    clay:      { name: 'Soft clay',          k: 1e-17, phi: 0.50, E: 8e6,   nu: 0.35, alpha: 1.00,
                 lam_s: 2.0, rho_s: 2650, c_s: 900, aT: 1.0e-5 },
    sand:      { name: 'Sand',               k: 1e-11, phi: 0.35, E: 60e6,  nu: 0.30, alpha: 1.00,
                 lam_s: 3.0, rho_s: 2650, c_s: 800, aT: 1.0e-5 },
    sandstone: { name: 'Sandstone',          k: 1e-14, phi: 0.18, E: 15e9,  nu: 0.22, alpha: 0.75,
                 lam_s: 3.5, rho_s: 2650, c_s: 850, aT: 1.0e-5 },
    granite:   { name: 'Intact granite',     k: 1e-18, phi: 0.01, E: 50e9,  nu: 0.25, alpha: 0.30,
                 lam_s: 3.0, rho_s: 2700, c_s: 800, aT: 8.0e-6 },
    fractured: { name: 'Fractured granite',  k: 1e-14, phi: 0.02, E: 30e9,  nu: 0.25, alpha: 0.40,
                 lam_s: 3.0, rho_s: 2700, c_s: 800, aT: 8.0e-6 }
  };

  function waterMu(Tc) { return 2.414e-5 * Math.pow(10, 247.8 / (Tc + 133.15)); }
  var TT  = [0, 20, 40, 60, 80, 100, 150, 200, 250];
  var RHO = [999.8, 998.2, 992.2, 983.2, 971.8, 958.4, 917.0, 864.7, 799.0];
  var BET = [-0.68, 2.07, 3.85, 5.23, 6.41, 7.50, 10.3, 13.5, 18.0].map(function (b) { return b * 1e-4; });
  function interp(xs, ys, x) {
    if (x <= xs[0]) return ys[0];
    for (var i = 1; i < xs.length; i++) if (x <= xs[i]) {
      var t = (x - xs[i - 1]) / (xs[i] - xs[i - 1]);
      return ys[i - 1] + t * (ys[i] - ys[i - 1]);
    }
    return ys[ys.length - 1];
  }

  function humanTime(s) {
    if (s < 90) return s.toFixed(s < 10 ? 1 : 0) + ' s';
    if (s < 5400) return (s / 60).toFixed(0) + ' min';
    if (s < 1.7e5) return (s / 3600).toFixed(1) + ' h';
    if (s < 5.2e6) return (s / 86400).toFixed(1) + ' d';
    if (s < 3.15e7) return (s / 2.63e6).toFixed(1) + ' mo';
    if (s < 3.15e10) return (s / 3.156e7).toFixed(s < 3.15e8 ? 1 : 0) + ' yr';
    return U.si(s / 3.156e7, 1) + ' yr';
  }

  THM.viz('regimeCalc', function (host) {
    var body = host.querySelector('.fig__body');
    body.innerHTML = '<div class="rc"><div class="rc__chart"></div><div class="rc__out"></div></div>';
    var chartHost = body.querySelector('.rc__chart');
    var outHost = body.querySelector('.rc__out');

    var cv = document.createElement('canvas');
    chartHost.appendChild(cv);

    var ctrls = document.createElement('div');
    ctrls.className = 'controls';
    host.appendChild(ctrls);

    var presetRow = document.createElement('div');
    presetRow.style.cssText = 'grid-column:1/-1;display:flex;gap:.6rem;align-items:center;flex-wrap:wrap';
    presetRow.innerHTML = '<span class="ctrl__label">Material</span>';
    ctrls.appendChild(presetRow);

    var state = { mat: 'sandstone', L: 100, grad: 0.01, Tm: 60, dT: 50 };

    THM.segmented(presetRow, {
      label: 'Material', index: 2,
      options: Object.keys(PRESETS).map(function (k) { return { value: k, label: PRESETS[k].name }; }),
      on: function (v) { state.mat = v; update(); }
    });

    THM.slider(ctrls, { label: 'Length scale $L$', min: -1, max: 3.3, step: 0.01, value: 2,
      map: function (v) { return Math.pow(10, v); }, unmap: function (v) { return Math.log10(v); },
      fmt: function (v) { return (v < 1 ? v.toFixed(2) : v < 10 ? v.toFixed(1) : v.toFixed(0)) + ' m'; },
      on: function (v) { state.L = v; update(); } });

    THM.slider(ctrls, { label: 'Hydraulic gradient $i$', min: -4, max: 0, step: 0.01, value: -2,
      map: function (v) { return Math.pow(10, v); }, unmap: function (v) { return Math.log10(v); },
      fmt: function (v) { return U.si(v, 1); },
      on: function (v) { state.grad = v; update(); } });

    THM.slider(ctrls, { label: 'Mean temperature $T$', min: 5, max: 250, step: 1, value: 60,
      fmt: function (v) { return v.toFixed(0) + ' °C'; },
      on: function (v) { state.Tm = v; update(); } });

    THM.slider(ctrls, { label: 'Temperature contrast $\\Delta T$', min: 1, max: 200, step: 1, value: 50,
      fmt: function (v) { return v.toFixed(0) + ' K'; },
      on: function (v) { state.dT = v; update(); } });

    var out = null;

    function physics() {
      var P = PRESETS[state.mat], phi = P.phi;
      var mu = waterMu(state.Tm);
      var rho_f = interp(TT, RHO, state.Tm), beta = interp(TT, BET, state.Tm);
      var c_f = 4180, K_f = 2.2e9, K_s = 40e9, g = 9.81;
      var K = P.E / (3 * (1 - 2 * P.nu)), G = P.E / (2 * (1 + P.nu));
      var Kod = K + 4 * G / 3;
      var Mb = 1 / (phi / K_f + Math.max(0, P.alpha - phi) / K_s);   // Biot modulus
      var Se = 1 / Mb;
      var cv_ = (P.k / mu) / (Se + P.alpha * P.alpha / Kod);          // 1-D consolidation coeff
      var rc_m = (1 - phi) * P.rho_s * P.c_s + phi * rho_f * c_f;
      var lam_m = Math.pow(P.lam_s, 1 - phi) * Math.pow(0.6, phi);    // geometric mean
      var kap = lam_m / rc_m;
      var q = (P.k * rho_f * g / mu) * state.grad;                    // Darcy flux, m/s
      var vpore = q / phi;
      var Pe = rho_f * c_f * q * state.L / lam_m;
      var Ra = rho_f * g * beta * state.dT * P.k * state.L * rho_f * c_f / (mu * lam_m);
      var Rth = rc_m / (phi * rho_f * c_f);
      return {
        P: P, mu: mu, rho_f: rho_f, cv: cv_, kap: kap, q: q, vpore: vpore,
        Pe: Pe, Ra: Ra, Rth: Rth, Mb: Mb, K: K, Kod: Kod, lam_m: lam_m, rc_m: rc_m,
        tp: state.L * state.L / cv_, tT: state.L * state.L / kap,
        tadv: q > 0 ? state.L / vpore : Infinity,
        tth: q > 0 ? state.L / (q * rho_f * c_f / rc_m) : Infinity,
        thermalStress: 3 * K * P.aT / 1e6
      };
    }

    function draw(R) {
      var wCss = chartHost.clientWidth || 520;
      var h = 176;
      var ctx = THM.fitCanvas(cv, h), C = THM.C();
      var W = ctx.__w;
      ctx.clearRect(0, 0, W, h);
      var padL = 14, padR = 14, y0 = 128;
      var lo = 0, hi = 12;                                  // log10 seconds
      function X(t) { return padL + U.clamp((Math.log10(Math.max(t, 1)) - lo) / (hi - lo), 0, 1) * (W - padL - padR); }

      /* axis */
      ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(padL, y0 + .5); ctx.lineTo(W - padR, y0 + .5); ctx.stroke();

      var marks = [[1, '1 s'], [60, 'min'], [3600, 'hour'], [86400, 'day'],
                   [2.63e6, 'month'], [3.156e7, 'year'], [3.156e8, '10 yr'],
                   [3.156e9, '100 yr'], [3.156e10, '1 kyr'], [3.156e11, '10 kyr']];
      ctx.font = '10.5px ' + THM.tok('mono');
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      var lastRight = -1e9;
      marks.forEach(function (m) {
        var x = X(m[0]);
        ctx.strokeStyle = C.grid;
        ctx.beginPath(); ctx.moveTo(x + .5, 16); ctx.lineTo(x + .5, y0); ctx.stroke();
        var w = ctx.measureText(m[1]).width;          // drop labels that would collide
        if (x - w / 2 < lastRight + 7) return;
        lastRight = x + w / 2;
        ctx.fillStyle = C.ink4; ctx.fillText(m[1], x, y0 + 6);
      });

      /* stems */
      var items = [
        { t: R.tp,   c: C.h, lab: 'pressure diffusion  L²/c', row: 0, dash: null },
        { t: R.tadv, c: C.h, lab: 'water arrival  L/v', row: 1, dash: [4, 4] },
        { t: R.tth,  c: C.t, lab: 'heat arrival  R·L/v', row: 2, dash: [4, 4] },
        { t: R.tT,   c: C.t, lab: 'thermal diffusion  L²/κ', row: 3, dash: null }
      ];
      items.forEach(function (it) {
        if (!isFinite(it.t)) return;
        var x = X(it.t), y = 30 + it.row * 25;
        ctx.strokeStyle = it.c; ctx.lineWidth = 2; ctx.lineCap = 'round';
        ctx.setLineDash(it.dash || []);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y0 - 1); ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(x, y, 4.5, 0, 6.2832);
        ctx.fillStyle = it.c; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = C.surface; ctx.stroke();

        ctx.textBaseline = 'middle';
        var right = x < W * 0.62;
        ctx.textAlign = right ? 'left' : 'right';
        ctx.fillStyle = C.ink2; ctx.font = '11.5px ' + THM.tok('sans');
        var txt = it.lab + '  ·  ' + humanTime(it.t);
        ctx.fillText(txt, x + (right ? 9 : -9), y);
      });
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = C.ink4; ctx.font = '11px ' + THM.tok('sans');
      ctx.fillText('characteristic time', padL, 166);
    }

    function verdict(R) {
      var s = [];
      if (R.Pe > 10) s.push('advection-dominated heat transport');
      else if (R.Pe > 0.5) s.push('mixed advection and conduction');
      else s.push('conduction-dominated heat transport');
      if (R.Ra > 40) s.push('free convection expected');
      if (R.tp * 30 < R.tT) s.push('pressure equilibrates long before temperature — the classic separation of scales');
      else if (R.tp > R.tT) s.push('pressure diffuses <em>slower</em> than heat: expect strong thermal pressurisation');
      return s.join('; ') + '.';
    }

    function update() {
      var R = physics();
      draw(R);
      if (!out) {
        out = THM.readouts(outHost, [
          { key: 'pe', label: 'Péclet number  Pe' },
          { key: 'ra', label: 'Rayleigh number  Ra' },
          { key: 'rt', label: 'Thermal retardation  R' },
          { key: 'cv', label: 'Consolidation coeff.  c' },
          { key: 'ka', label: 'Thermal diffusivity  κ' },
          { key: 'mu', label: 'Water viscosity  μ' },
          { key: 'q',  label: 'Darcy flux  q' },
          { key: 'ts', label: 'Thermal stress  3Kα' }
        ]);
        outHost.querySelector('.readouts').style.cssText =
          'display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:.75rem 1rem';
        var v = document.createElement('p');
        v.className = 'rc__verdict'; v.id = 'rcVerdict';
        outHost.appendChild(v);
      }
      out.set('pe', U.si(R.Pe, 1));
      out.set('ra', U.si(R.Ra, 1) + (R.Ra > 40 ? ' <small>convecting</small>' : ''));
      out.set('rt', R.Rth.toFixed(1) + '<small>×</small>');
      out.set('cv', U.si(R.cv, 1) + '<small> m²/s</small>');
      out.set('ka', U.si(R.kap, 1) + '<small> m²/s</small>');
      out.set('mu', (R.mu * 1e3).toFixed(2) + '<small> mPa·s</small>');
      out.set('q',  U.si(R.q, 1) + '<small> m/s</small>');
      out.set('ts', R.thermalStress.toFixed(2) + '<small> MPa/K</small>');
      document.getElementById('rcVerdict').innerHTML = verdict(R);
    }

    new ResizeObserver(function () { update(); }).observe(chartHost);
    global.addEventListener('thm:theme', update);
    update();
  });

  /* ==================================================== 4. roadmap  cards */

  document.addEventListener('DOMContentLoaded', function () {
    var host = document.getElementById('roadmap');
    if (!host) return;
    host.innerHTML = THM.PAGES.slice(1).map(function (p) {
      return '<a class="card" href="' + p.file + '"><span class="card__num">' + p.num + '</span>' +
             '<h4>' + p.title + '</h4><p>' + p.blurb + '</p></a>';
    }).join('');
  });

})(window);

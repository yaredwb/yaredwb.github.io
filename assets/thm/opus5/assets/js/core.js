/* =============================================================================
   THM — core runtime
   Chapter manifest + navigation, theme, KaTeX rendering, the annotated-equation
   term explorer, a lazy-init registry for visualisations, and shared numerics.
   Plain script (no modules) so the site also runs straight off the filesystem.
   ========================================================================== */
(function (global) {
  'use strict';

  var THM = global.THM = global.THM || {};

  /* ---------------------------------------------------------------- pages */

  THM.PAGES = [
    { id: 'index',        file: 'index.html',        num: '00', title: 'Overview',
      blurb: 'What couples to what, and why a porous medium refuses to be three separate problems.' },
    { id: 'porous-media', file: 'porous-media.html', num: '01', title: 'The porous medium',
      blurb: 'Averaging a tangle of grains and voids into fields you can differentiate.' },
    { id: 'flow',         file: 'flow.html',         num: '02', title: 'Hydraulics',
      blurb: 'Darcy’s law, storage, pressure diffusion, and flow when the pores are only partly wet.' },
    { id: 'heat',         file: 'heat.html',         num: '03', title: 'Heat transport',
      blurb: 'Conduction, advection, and why a thermal front crawls behind the water that carries it.' },
    { id: 'mechanics',    file: 'mechanics.html',    num: '04', title: 'Poromechanics',
      blurb: 'Effective stress, Biot coefficients, and the arithmetic of failure.' },
    { id: 'coupled',      file: 'coupled.html',      num: '05', title: 'The coupled system',
      blurb: 'Assembling T, H and M — plus the three benchmarks that prove the coupling is real.' },
    { id: 'numerics',     file: 'numerics.html',     num: '06', title: 'Solving it',
      blurb: 'Discretisation, block structure, splitting schemes, and the traps that eat solvers.' },
    { id: 'simulator',    file: 'simulator.html',    num: '07', title: 'Reservoir sandbox',
      blurb: 'A live 2-D THM solver: inject cold water into hot rock and watch the stresses answer.' },
    { id: 'reference',    file: 'reference.html',    num: '08', title: 'Reference',
      blurb: 'Symbols, units, property ranges, dimensionless groups and where to read further.' }
  ];

  /* ---------------------------------------------------------------- theme */

  var THEME_KEY = 'thm-theme';
  THM.theme = {
    get: function () { return localStorage.getItem(THEME_KEY) || 'system'; },
    apply: function (t) {
      var root = document.documentElement;
      if (t === 'system') root.removeAttribute('data-theme');
      else root.setAttribute('data-theme', t);
      try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
      global.dispatchEvent(new CustomEvent('thm:theme', { detail: t }));
    },
    cycle: function () {
      var order = ['system', 'light', 'dark'], i = order.indexOf(THM.theme.get());
      THM.theme.apply(order[(i + 1) % order.length]);
    },
    isDark: function () {
      /* trust whatever is actually stamped on the root — the page may be
         embedded in a host that sets the theme itself                    */
      var attr = document.documentElement.getAttribute('data-theme');
      if (attr === 'dark') return true;
      if (attr === 'light') return false;
      return global.matchMedia('(prefers-color-scheme: dark)').matches;
    }
  };
  (function () {                                   // apply before first paint
    var t = null;
    try { t = localStorage.getItem(THEME_KEY); } catch (e) {}
    if (t && t !== 'system') document.documentElement.setAttribute('data-theme', t);
  })();

  /* --------------------------------------------------------------- tokens */

  var _tokenCache = {};
  global.addEventListener('thm:theme', function () { _tokenCache = {}; });
  global.matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', function () { _tokenCache = {}; });

  /** Read a CSS custom property (cached per theme). */
  THM.tok = function (name) {
    if (_tokenCache[name]) return _tokenCache[name];
    var v = getComputedStyle(document.documentElement)
              .getPropertyValue('--' + name).trim();
    _tokenCache[name] = v;
    return v;
  };
  THM.C = function () {
    return {
      h: THM.tok('c-h'), t: THM.tok('c-t'), m: THM.tok('c-m'),
      s4: THM.tok('s4'), s5: THM.tok('s5'), s6: THM.tok('s6'),
      s7: THM.tok('s7'), s8: THM.tok('s8'),
      ink1: THM.tok('ink-1'), ink2: THM.tok('ink-2'),
      ink3: THM.tok('ink-3'), ink4: THM.tok('ink-4'),
      grid: THM.tok('grid'), axis: THM.tok('axis'),
      surface: THM.tok('surface-1'), surface2: THM.tok('surface-2'),
      sunk: THM.tok('surface-sunk'), bg: THM.tok('bg'),
      border: THM.tok('border')
    };
  };

  /* ------------------------------------------------------------ colormaps */

  function hex2rgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  THM.hex2rgb = hex2rgb;

  /** Build a lookup-table colormap from hex stops (evenly spaced). */
  function makeRamp(stops, n) {
    n = n || 256;
    var cols = stops.map(hex2rgb), lut = new Uint8Array(n * 3);
    for (var i = 0; i < n; i++) {
      var x = i / (n - 1) * (cols.length - 1);
      var a = Math.min(cols.length - 1, Math.floor(x)), b = Math.min(cols.length - 1, a + 1), f = x - a;
      for (var c = 0; c < 3; c++) lut[i * 3 + c] = Math.round(cols[a][c] + (cols[b][c] - cols[a][c]) * f);
    }
    lut.css = function (t) {
      var i = Math.max(0, Math.min(n - 1, Math.round(t * (n - 1)))) * 3;
      return 'rgb(' + lut[i] + ',' + lut[i + 1] + ',' + lut[i + 2] + ')';
    };
    lut.n = n;
    lut.gradient = function (dir) {
      var s = [];
      for (var k = 0; k <= 10; k++) s.push(lut.css(k / 10) + ' ' + (k * 10) + '%');
      return 'linear-gradient(' + (dir || 'to right') + ',' + s.join(',') + ')';
    };
    return lut;
  }
  THM.makeRamp = makeRamp;

  /* Semantic-heat ramp for temperature (always shipped with a colour bar).
     Lightness is monotone from the cold end to the hot end.               */
  var RAMPS = {
    heat: makeRamp(['#0e0e18', '#241a3c', '#4d1f51', '#7c2650', '#a83b3c',
                    '#cd5c22', '#e5871a', '#f4b544', '#fbe3a4']),
    /* light-mode heat: cold end recedes toward the surface, hot end goes deep */
    heatLight: makeRamp(['#fdfcf8', '#fdeccb', '#fbd193', '#f5ad5c', '#e9823a',
                         '#d55f28', '#b0421f', '#7d2b23', '#4a1a22']),
    /* single-hue blue, dark-anchored (near-zero recedes into the surface) */
    bluesDark: makeRamp(['#0f1116', '#0d366b', '#184f95', '#256abf',
                         '#3987e5', '#6da7ec', '#9ec5f4', '#cde2fb']),
    bluesLight: makeRamp(['#fbfcfe', '#cde2fb', '#9ec5f4', '#6da7ec',
                          '#3987e5', '#256abf', '#184f95', '#0d366b']),
    /* diverging blue ↔ red with a neutral grey midpoint */
    divDark: makeRamp(['#9ec5f4', '#5598e7', '#3987e5', '#2a5f92', '#383835',
                       '#8c4747', '#d34f4f', '#e66767', '#f0a0a0']),
    divLight: makeRamp(['#184f95', '#2a78d6', '#6da7ec', '#b7d3f6', '#f0efec',
                        '#f3b0b0', '#e34948', '#c22e2e', '#8f1f1f']),
    /* aqua single-hue for saturation-like quantities */
    aquaDark: makeRamp(['#0f1614', '#0b3a2c', '#0f5c45', '#12805e',
                        '#199e70', '#3fbc8f', '#77d5b3', '#b8ecd8'])
  };
  THM.ramp = function (name) {
    var dark = THM.theme.isDark();
    if (name === 'blues') return dark ? RAMPS.bluesDark : RAMPS.bluesLight;
    if (name === 'div')   return dark ? RAMPS.divDark : RAMPS.divLight;
    if (name === 'aqua')  return RAMPS.aquaDark;
    if (name === 'ember') return RAMPS.heatLight;   /* cold = pale, hot = deep ember */
    return dark ? RAMPS.heat : RAMPS.heatLight;
  };

  /* ------------------------------------------------------------- numerics */

  var U = THM.util = {};
  U.clamp = function (x, a, b) { return x < a ? a : x > b ? b : x; };
  U.lerp = function (a, b, t) { return a + (b - a) * t; };
  U.linspace = function (a, b, n) {
    var o = new Float64Array(n);
    for (var i = 0; i < n; i++) o[i] = a + (b - a) * i / (n - 1);
    return o;
  };
  U.logspace = function (a, b, n) {           // decades
    var o = new Float64Array(n);
    for (var i = 0; i < n; i++) o[i] = Math.pow(10, a + (b - a) * i / (n - 1));
    return o;
  };
  /** Abramowitz & Stegun 7.1.26 — |err| < 1.5e-7 */
  U.erf = function (x) {
    var s = x < 0 ? -1 : 1; x = Math.abs(x);
    var t = 1 / (1 + 0.3275911 * x);
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t
              - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return s * y;
  };
  U.erfc = function (x) { return 1 - U.erf(x); };
  /** Exponential integral E1 for x > 0 (Theis well function). */
  U.expint = function (x) {
    if (x <= 0) return Infinity;
    if (x < 1) {                                   // series
      var s = -0.57721566490153286 - Math.log(x), term = 1, sum = 0;
      for (var k = 1; k <= 30; k++) { term *= -x / k; sum += -term / k; }
      return s + sum;
    }
    // continued fraction (Lentz)
    var b = x + 1, c = 1e30, d = 1 / b, h = d;
    for (var i = 1; i <= 60; i++) {
      var an = -i * i;
      b += 2; d = 1 / (an * d + b); c = b + an / c;
      var del = c * d; h *= del;
      if (Math.abs(del - 1) < 1e-12) break;
    }
    return h * Math.exp(-x);
  };
  /** Bisection root find on [a,b] where f changes sign. */
  U.bisect = function (f, a, b, tol, it) {
    tol = tol || 1e-12; it = it || 200;
    var fa = f(a);
    for (var i = 0; i < it; i++) {
      var m = 0.5 * (a + b), fm = f(m);
      if (fa * fm <= 0) b = m; else { a = m; fa = fm; }
      if (b - a < tol) break;
    }
    return 0.5 * (a + b);
  };
  U.fmt = function (x, d) {
    if (!isFinite(x)) return '—';
    if (x !== 0 && (Math.abs(x) < 1e-3 || Math.abs(x) >= 1e5)) {
      var e = Math.floor(Math.log10(Math.abs(x)));
      var m = x / Math.pow(10, e);
      return m.toFixed(d == null ? 2 : d) + '×10' + sup(e);
    }
    return x.toFixed(d == null ? 2 : d);
  };
  function sup(n) {
    var map = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³',
      '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
    return String(n).split('').map(function (c) { return map[c] || c; }).join('');
  }
  U.sup = sup;
  U.si = function (x, d) {                       // 1.2e-14 → "1.2e−14"
    if (x === 0) return '0';
    var e = Math.floor(Math.log10(Math.abs(x)));
    return (x / Math.pow(10, e)).toFixed(d == null ? 1 : d) + '×10' + sup(e);
  };

  /* --------------------------------------------------------------- canvas */

  /** Size a canvas for the device pixel ratio; returns a scaled 2-D context. */
  THM.fitCanvas = function (cv, hCss) {
    var dpr = Math.min(global.devicePixelRatio || 1, 2);
    var w = cv.clientWidth || cv.parentNode.clientWidth || 600;
    var h = hCss || cv.clientHeight || 300;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    cv.style.height = h + 'px';
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.__w = w; ctx.__h = h; ctx.__dpr = dpr;
    return ctx;
  };

  /** requestAnimationFrame loop with a pause when off-screen or hidden. */
  THM.loop = function (el, step) {
    var running = true, last = performance.now(), raf = 0, visible = true;
    function frame(now) {
      raf = requestAnimationFrame(frame);
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (running && visible) step(dt, now);
    }
    raf = requestAnimationFrame(frame);
    var inView = true;
    if (el) {
      new IntersectionObserver(function (es) { inView = es[0].isIntersecting; visible = inView && !document.hidden; },
        { rootMargin: '120px' }).observe(el);
    }
    document.addEventListener('visibilitychange', function () {
      visible = inView && !document.hidden;
    });
    return {
      stop: function () { cancelAnimationFrame(raf); },
      set: function (v) { running = v; },
      get running() { return running; },
      toggle: function () { running = !running; return running; }
    };
  };

  /* ------------------------------------------------------- viz  registry */

  var registry = [];
  /** Register a visualisation; initialised once its container nears the viewport. */
  THM.viz = function (id, init) { registry.push({ id: id, init: init }); };

  function bootViz() {
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        obs.unobserve(e.target);
        var fn = e.target.__thmInit;
        try { fn(e.target); } catch (err) {
          console.error('[THM] viz "' + e.target.id + '" failed:', err);
          e.target.insertAdjacentHTML('beforeend',
            '<p class="muted" style="padding:1rem;font-size:.85rem">' +
            'This figure could not start: ' + String(err.message || err) + '</p>');
        }
      });
    }, { rootMargin: '300px 0px' });

    registry.forEach(function (r) {
      var el = document.getElementById(r.id);
      if (!el) return;
      el.__thmInit = r.init;
      io.observe(el);
    });
  }

  /* --------------------------------------------------------------- KaTeX */

  var MACROS = {
    '\\tk': '\\htmlClass{tk tk-#1}{#2}',
    '\\vec': '\\boldsymbol{#1}',
    '\\dd': '\\mathrm{d}',
    '\\div': '\\nabla\\!\\cdot\\!',
    '\\grad': '\\nabla',
    '\\pd': '\\frac{\\partial #1}{\\partial #2}',
    '\\ten': '\\boldsymbol{#1}',
    '\\eff': "#1'",
    '\\deg': '^{\\circ}'
  };

  function renderMathIn(root) {
    if (!global.katex) return;
    var opts = { throwOnError: false, trust: true, strict: 'ignore', macros: MACROS };

    // explicit blocks first
    root.querySelectorAll('[data-math]').forEach(function (el) {
      if (el.__done) return; el.__done = true;
      try {
        katex.render(el.getAttribute('data-math'), el,
          Object.assign({ displayMode: el.hasAttribute('data-display') }, opts));
      } catch (e) {
        el.textContent = el.getAttribute('data-math');
        console.warn('[THM] math render failed:', e.message);
      }
    });

    // then $…$ / $$…$$ inside text
    var SKIP = /^(script|style|pre|code|textarea|noscript|svg)$/i;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.nodeValue || n.nodeValue.indexOf('$') < 0) return NodeFilter.FILTER_REJECT;
        for (var p = n.parentNode; p && p !== root; p = p.parentNode) {
          if (SKIP.test(p.nodeName) || (p.classList && p.classList.contains('no-math')))
            return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [], n;
    while ((n = walker.nextNode())) nodes.push(n);

    nodes.forEach(function (node) {
      var txt = node.nodeValue, out = document.createDocumentFragment();
      var i = 0, changed = false;
      while (i < txt.length) {
        var d = txt.indexOf('$', i);
        if (d < 0) break;
        var display = txt[d + 1] === '$';
        var open = display ? d + 2 : d + 1;
        var close = txt.indexOf(display ? '$$' : '$', open);
        if (close < 0) break;
        var body = txt.slice(open, close);
        if (!body.trim()) { i = close + 1; continue; }
        out.appendChild(document.createTextNode(txt.slice(i, d)));
        var span = document.createElement(display ? 'div' : 'span');
        try {
          katex.render(body, span, Object.assign({ displayMode: display }, opts));
        } catch (e) { span.textContent = body; }
        out.appendChild(span);
        i = close + (display ? 2 : 1);
        changed = true;
      }
      if (!changed) return;
      out.appendChild(document.createTextNode(txt.slice(i)));
      node.parentNode.replaceChild(out, node);
    });
  }
  THM.renderMathIn = renderMathIn;

  /* ------------------------------------------- annotated equation explorer */

  function wireTerms(root) {
    root.querySelectorAll('.eqx').forEach(function (box) {
      var list = box.querySelector('.terms');
      if (!list) return;
      var pinned = null;

      function setLit(key, on) {
        box.querySelectorAll('.tk-' + key).forEach(function (e) { e.classList.toggle('is-lit', on); });
        var li = list.querySelector('[data-term="' + key + '"]');
        if (li) li.classList.toggle('is-lit', on);
      }
      function clearAll() {
        box.querySelectorAll('.is-lit').forEach(function (e) { e.classList.remove('is-lit'); });
      }
      function hover(key, on) {
        if (pinned) return;
        setLit(key, on);
      }
      function pin(key) {
        if (pinned === key) { pinned = null; clearAll(); return; }
        clearAll(); pinned = key; setLit(key, true);
      }

      list.querySelectorAll('[data-term]').forEach(function (li) {
        var key = li.getAttribute('data-term');
        li.addEventListener('mouseenter', function () { hover(key, true); });
        li.addEventListener('mouseleave', function () { hover(key, false); });
        li.addEventListener('click', function () { pin(key); });
        li.tabIndex = 0;
        li.addEventListener('focus', function () { hover(key, true); });
        li.addEventListener('blur', function () { hover(key, false); });
        li.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pin(key); }
        });
      });

      box.querySelectorAll('.tk').forEach(function (el) {
        var key = null;
        el.classList.forEach(function (c) { if (c.indexOf('tk-') === 0) key = c.slice(3); });
        if (!key) return;
        el.addEventListener('mouseenter', function () { hover(key, true); });
        el.addEventListener('mouseleave', function () { hover(key, false); });
        el.addEventListener('click', function () { pin(key); });
      });
    });
  }

  /* ------------------------------------------------------------ page shell */

  var ICONS = {
    theme: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2M12 19.4v2M2.6 12h2M19.4 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    mark: '<svg class="brandmark" viewBox="0 0 32 32" fill="none" aria-hidden="true">' +
      '<circle cx="16" cy="9.6" r="5.6" fill="var(--c-t)" opacity=".92"/>' +
      '<circle cx="9.4" cy="21.2" r="5.6" fill="var(--c-h)" opacity=".92"/>' +
      '<circle cx="22.6" cy="21.2" r="5.6" fill="var(--c-m)" opacity=".92"/>' +
      '<circle cx="16" cy="17.3" r="3.1" fill="var(--surface-1)"/></svg>'
  };

  var SINGLE = false;

  function buildShell() {
    SINGLE = document.body.getAttribute('data-single') === '1';
    var id = document.body.getAttribute('data-page') || 'index';
    var idx = THM.PAGES.findIndex(function (p) { return p.id === id; });
    var page = THM.PAGES[idx] || THM.PAGES[0];

    /* top bar ---------------------------------------------------------- */
    var bar = document.createElement('header');
    bar.className = 'topbar';
    bar.innerHTML =
      '<button class="iconbtn" id="navToggle" aria-label="Chapters" aria-expanded="false">' + ICONS.menu + '</button>' +
      '<a class="topbar__brand" href="index.html">' + ICONS.mark +
        '<span>Porous&nbsp;Media&nbsp;<span style="color:var(--ink-4);font-weight:400">/</span>&nbsp;THM</span></a>' +
      '<span class="topbar__spacer"></span>' +
      '<span class="topbar__crumb">' + page.num + ' &nbsp;<b>' + page.title + '</b></span>' +
      '<button class="iconbtn" id="themeBtn" aria-label="Switch colour theme" title="Theme: system → light → dark">' + ICONS.theme + '</button>';
    document.body.insertBefore(bar, document.body.firstChild);

    var prog = document.createElement('div');
    prog.className = 'progress'; prog.id = 'readProgress';
    document.body.insertBefore(prog, bar);

    /* rail -------------------------------------------------------------- */
    var rail = document.querySelector('.rail');
    if (rail) {
      var items = THM.PAGES.map(function (p) {
        var cur = !SINGLE && p.id === id;
        var scope = SINGLE ? document.getElementById('page-' + p.id) : document;
        var sub = '';
        if (SINGLE || cur) {
          var hs = scope ? Array.prototype.slice.call(scope.querySelectorAll('h2[id]')) : [];
          if (hs.length) sub = '<ul class="rail__sub">' + hs.map(function (h) {
            return '<li><a href="#' + h.id + '" data-sec="' + h.id + '">' +
                   (h.getAttribute('data-nav') || h.textContent.replace('#', '').trim()) + '</a></li>';
          }).join('') + '</ul>';
        }
        var href = SINGLE ? '#page-' + p.id : p.file;
        return '<li data-chap="' + p.id + '"><a href="' + href + '"' +
               (cur ? ' aria-current="page"' : '') + '>' +
               '<span class="num">' + p.num + '</span><span>' + p.title + '</span></a>' + sub + '</li>';
      }).join('');
      rail.innerHTML = '<p class="rail__title">Chapters</p><ol' + (SINGLE ? ' class="rail--single"' : '') +
        '>' + items + '</ol>' +
        (SINGLE ? '' : '<p class="rail__title">About</p><ol><li><a href="reference.html#colophon">' +
        '<span class="num">▪</span><span>Colophon &amp; sources</span></a></li></ol>');
    }

    /* pager ------------------------------------------------------------- */
    var main = document.querySelector('.content');
    if (SINGLE && main) {
      var foot0 = document.createElement('footer');
      foot0.className = 'foot';
      foot0.innerHTML = '<span>Thermo–Hydro–Mechanical processes in porous media — an interactive primer.</span>' +
                        '<span>All figures are computed live in your browser.</span>';
      main.appendChild(foot0);
    } else if (main && !main.querySelector('.pager')) {
      var prev = THM.PAGES[idx - 1], next = THM.PAGES[idx + 1];
      var pager = document.createElement('nav');
      pager.className = 'pager'; pager.setAttribute('aria-label', 'Chapter navigation');
      pager.innerHTML =
        (prev ? '<a href="' + prev.file + '"><span class="dir">← Previous</span><span class="ttl">' + prev.title + '</span></a>'
              : '<span class="empty"></span>') +
        (next ? '<a class="next" href="' + next.file + '"><span class="dir">Next →</span><span class="ttl">' + next.title + '</span></a>'
              : '<span class="empty"></span>');
      main.appendChild(pager);

      var foot = document.createElement('footer');
      foot.className = 'foot';
      foot.innerHTML = '<span>Thermo–Hydro–Mechanical processes in porous media — an interactive primer.</span>' +
                       '<span>All figures are computed live in your browser.</span>';
      main.appendChild(foot);
    }

    /* behaviour ---------------------------------------------------------- */
    document.getElementById('themeBtn').addEventListener('click', THM.theme.cycle);
    var tog = document.getElementById('navToggle');
    tog.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      tog.setAttribute('aria-expanded', String(open));
      if (open && !document.querySelector('.rail-scrim')) {
        var s = document.createElement('div'); s.className = 'rail-scrim';
        s.addEventListener('click', function () {
          document.body.classList.remove('nav-open'); tog.setAttribute('aria-expanded', 'false');
        });
        document.body.appendChild(s);
      }
    });

    /* heading anchors */
    document.querySelectorAll('.content h2[id], .content h3[id]').forEach(function (h) {
      var a = document.createElement('a');
      a.className = 'anchor'; a.href = '#' + h.id; a.textContent = '#';
      a.setAttribute('aria-label', 'Link to this section');
      h.appendChild(a);
    });

    /* reading progress + active section */
    var secLinks = Array.prototype.slice.call(document.querySelectorAll('.rail__sub a'));
    var heads = secLinks.map(function (a) { return document.getElementById(a.dataset.sec); });
    var chapEls = THM.PAGES.map(function (p) { return document.getElementById('page-' + p.id); });
    var chapLis = Array.prototype.slice.call(document.querySelectorAll('.rail li[data-chap]'));
    var crumb = bar.querySelector('.topbar__crumb');
    function onScroll() {
      var d = document.documentElement;
      var max = d.scrollHeight - d.clientHeight;
      prog.style.width = (max > 0 ? (d.scrollTop / max) * 100 : 0) + '%';
      var best = -1;
      heads.forEach(function (h, i) { if (h && h.getBoundingClientRect().top < 140) best = i; });
      secLinks.forEach(function (a, i) { a.classList.toggle('active', i === best); });
      if (SINGLE) {
        var bc = 0;
        chapEls.forEach(function (e, i) { if (e && e.getBoundingClientRect().top < 180) bc = i; });
        chapLis.forEach(function (li, i) {
          li.classList.toggle('is-open', i === bc);
          var a = li.querySelector('a');
          if (a) { if (i === bc) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }
        });
        var pg = THM.PAGES[bc];
        if (crumb && pg) crumb.innerHTML = pg.num + ' &nbsp;<b>' + pg.title + '</b>';
      }
    }
    global.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ------------------------------------------------------------- bootstrap */

  function boot() {
    /* each stage is isolated: a failure in one must not take the page down */
    [buildShell,
     function () { renderMathIn(document.body); },
     function () { wireTerms(document.body); },
     bootViz].forEach(function (fn) {
      try { fn(); } catch (e) { console.error('[THM] boot stage failed:', e); }
    });
    document.body.classList.add('ready');
  }

  /* Deferred scripts run while readyState is "interactive", i.e. *before*
     DOMContentLoaded — so we must wait for that event, not for "loading",
     otherwise the viz modules that load after core.js never get registered. */
  if (document.readyState === 'complete') boot();
  else document.addEventListener('DOMContentLoaded', boot);

})(window);

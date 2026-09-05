/* =============================================================================
   THM — plotting primitives
   A small declarative canvas plotter (axes, hairline grid, 2 px lines, crosshair
   tooltip, legend, table-view twin) plus scalar-field and colour-bar helpers.
   ========================================================================== */
(function (global) {
  'use strict';
  var THM = global.THM;
  var U = THM.util;

  /* ------------------------------------------------------------ tick maths */

  function niceNum(range, round) {
    var exp = Math.floor(Math.log10(range)), f = range / Math.pow(10, exp), nf;
    if (round) nf = f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10;
    else       nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
    return nf * Math.pow(10, exp);
  }
  function ticks(min, max, count) {
    if (!(max > min)) return [min];
    var span = niceNum(max - min, false);
    var step = niceNum(span / Math.max(1, (count || 5) - 1), true);
    var lo = Math.ceil(min / step) * step, out = [];
    for (var v = lo; v <= max + step * 1e-6; v += step) out.push(Math.abs(v) < step * 1e-6 ? 0 : v);
    return out;
  }
  function logTicks(min, max) {
    var out = [], e0 = Math.floor(Math.log10(min)), e1 = Math.ceil(Math.log10(max));
    /* over a short span, decades alone leave the axis almost unlabelled */
    var mult = (e1 - e0) <= 3 ? [1, 2, 5] : [1];
    for (var e = e0; e <= e1; e++) {
      for (var m = 0; m < mult.length; m++) {
        var v = mult[m] * Math.pow(10, e);
        if (v >= min * 0.999 && v <= max * 1.001) out.push(v);
      }
    }
    return out;
  }
  function fmtTick(v, ax) {
    if (ax && ax.tickFormat) return ax.tickFormat(v);
    if (v === 0) return '0';
    var a = Math.abs(v);
    if (a >= 1e5 || a < 1e-3) {
      var e = Math.round(Math.log10(a));
      return (v < 0 ? '−' : '') + '10' + U.sup(e);
    }
    if (a >= 1000) return (v < 0 ? '−' : '') + (a).toLocaleString('en-US');
    var d = a < 1 ? (a < 0.1 ? 3 : 2) : (a < 10 ? (Number.isInteger(v) ? 0 : 1) : 0);
    return (v < 0 ? '−' : '') + a.toFixed(d);
  }

  /* ------------------------------------------------------------------ Plot */

  function Plot(host, opt) {
    opt = opt || {};
    this.opt = opt;
    this.host = host;
    this.height = opt.height || 280;
    this.x = Object.assign({ min: 0, max: 1, label: '', ticks: 6 }, opt.x);
    this.y = Object.assign({ min: 0, max: 1, label: '', ticks: 5 }, opt.y);
    this.series = [];
    this.extras = null;
    this.hoverOn = opt.hover !== false;
    this.hi = null;

    host.classList.add('plot-host');
    this.wrap = document.createElement('div');
    this.wrap.className = 'plot';
    this.cv = document.createElement('canvas');
    this.wrap.appendChild(this.cv);
    this.tip = document.createElement('div');
    this.tip.className = 'vtip';
    this.wrap.appendChild(this.tip);
    host.appendChild(this.wrap);

    if (opt.legend !== false) {
      this.legendEl = document.createElement('div');
      this.legendEl.className = 'legend';
      this.legendEl.style.marginTop = '.6rem';
      host.appendChild(this.legendEl);
    }
    if (opt.table !== false) {
      this.tableEl = document.createElement('details');
      this.tableEl.className = 'tableview';
      this.tableEl.innerHTML = '<summary>Table view</summary><div class="tbl-wrap"></div>';
      host.appendChild(this.tableEl);
    }

    var self = this;
    this._ro = new ResizeObserver(function () { self.draw(); });
    this._ro.observe(host);
    global.addEventListener('thm:theme', function () { self.draw(); });
    global.matchMedia('(prefers-color-scheme: dark)')
          .addEventListener('change', function () { self.draw(); });

    if (this.hoverOn) this._bindHover();
  }

  Plot.prototype.sx = function (v) {
    var a = this.x;
    var t = a.log ? (Math.log10(v) - Math.log10(a.min)) / (Math.log10(a.max) - Math.log10(a.min))
                  : (v - a.min) / (a.max - a.min);
    return this.pl + t * this.pw;
  };
  Plot.prototype.sy = function (v) {
    var a = this.y;
    var t = a.log ? (Math.log10(v) - Math.log10(a.min)) / (Math.log10(a.max) - Math.log10(a.min))
                  : (v - a.min) / (a.max - a.min);
    if (a.reverse) return this.pt + t * this.ph;
    return this.pt + (1 - t) * this.ph;
  };
  Plot.prototype.ix = function (px) {                       // pixel → data x
    var a = this.x, t = (px - this.pl) / this.pw;
    return a.log ? Math.pow(10, Math.log10(a.min) + t * (Math.log10(a.max) - Math.log10(a.min)))
                 : a.min + t * (a.max - a.min);
  };

  Plot.prototype.set = function (series, extras) {
    this.series = series || [];
    if (extras !== undefined) this.extras = extras;
    this.draw();
    if (this.legendEl) this._legend();
    if (this.tableEl && !this._tableDirty) { this._tableDirty = true; this._table(); }
    return this;
  };
  Plot.prototype.setAxes = function (x, y) {
    if (x) Object.assign(this.x, x);
    if (y) Object.assign(this.y, y);
    return this;
  };

  Plot.prototype.draw = function () {
    var C = THM.C();
    var ctx = THM.fitCanvas(this.cv, this.height);
    var W = ctx.__w, H = ctx.__h;
    if (!W) return;
    this.ctx = ctx;

    var padL = this.opt.padL != null ? this.opt.padL : (this.y.label ? 56 : 42);
    var padR = this.opt.padR != null ? this.opt.padR : 14;
    var padT = this.opt.padT != null ? this.opt.padT : 12;
    var padB = this.opt.padB != null ? this.opt.padB : (this.x.label ? 44 : 28);
    this.pl = padL; this.pt = padT;
    this.pw = Math.max(10, W - padL - padR);
    this.ph = Math.max(10, H - padT - padB);

    ctx.clearRect(0, 0, W, H);
    ctx.font = '11px ' + (THM.tok('mono') || 'monospace');
    ctx.textBaseline = 'middle';

    var xt = this.x.log ? logTicks(this.x.min, this.x.max) : ticks(this.x.min, this.x.max, this.x.ticks);
    var yt = this.y.log ? logTicks(this.y.min, this.y.max) : ticks(this.y.min, this.y.max, this.y.ticks);

    /* grid — hairline, solid, one step off the surface */
    ctx.save();
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
    ctx.beginPath();
    if (this.opt.gridX !== false) xt.forEach(function (v) {
      var px = Math.round(this.sx(v)) + 0.5;
      if (px < this.pl - 1 || px > this.pl + this.pw + 1) return;
      ctx.moveTo(px, this.pt); ctx.lineTo(px, this.pt + this.ph);
    }, this);
    if (this.opt.gridY !== false) yt.forEach(function (v) {
      var py = Math.round(this.sy(v)) + 0.5;
      if (py < this.pt - 1 || py > this.pt + this.ph + 1) return;
      ctx.moveTo(this.pl, py); ctx.lineTo(this.pl + this.pw, py);
    }, this);
    ctx.stroke();
    ctx.restore();

    /* background bands / shaded regions supplied by the caller */
    if (this.extras && this.extras.bands) {
      this.extras.bands.forEach(function (b) {
        ctx.fillStyle = b.color;
        var x0 = this.sx(b.x0), x1 = this.sx(b.x1);
        ctx.fillRect(Math.min(x0, x1), this.pt, Math.abs(x1 - x0), this.ph);
      }, this);
    }

    /* axes */
    ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
    ctx.beginPath();
    var y0 = Math.round(this.y.min <= 0 && this.y.max >= 0 && !this.y.log ? this.sy(0) : this.sy(this.y.reverse ? this.y.min : this.y.min)) + 0.5;
    ctx.moveTo(this.pl, this.pt + this.ph + 0.5); ctx.lineTo(this.pl + this.pw, this.pt + this.ph + 0.5);
    ctx.moveTo(this.pl + 0.5, this.pt); ctx.lineTo(this.pl + 0.5, this.pt + this.ph);
    ctx.stroke();
    if (this.y.min < 0 && this.y.max > 0) {
      ctx.beginPath(); ctx.strokeStyle = C.axis;
      ctx.moveTo(this.pl, y0); ctx.lineTo(this.pl + this.pw, y0); ctx.stroke();
    }

    /* tick labels */
    ctx.fillStyle = C.ink3;
    ctx.textAlign = 'right';
    yt.forEach(function (v) {
      var py = this.sy(v);
      if (py < this.pt - 6 || py > this.pt + this.ph + 6) return;
      ctx.fillText(fmtTick(v, this.y), this.pl - 7, py);
    }, this);
    ctx.textAlign = 'center';
    xt.forEach(function (v) {
      var px = this.sx(v);
      if (px < this.pl - 6 || px > this.pl + this.pw + 6) return;
      ctx.fillText(fmtTick(v, this.x), px, this.pt + this.ph + 13);
    }, this);

    /* axis titles */
    ctx.fillStyle = C.ink2;
    ctx.font = '11.5px ' + (THM.tok('sans') || 'sans-serif');
    if (this.x.label) ctx.fillText(this.x.label, this.pl + this.pw / 2, this.pt + this.ph + 31);
    if (this.y.label) {
      ctx.save();
      ctx.translate(13, this.pt + this.ph / 2); ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center'; ctx.fillText(this.y.label, 0, 0);
      ctx.restore();
    }

    /* clip to the plotting rectangle for the data layer */
    ctx.save();
    ctx.beginPath(); ctx.rect(this.pl, this.pt, this.pw, this.ph); ctx.clip();

    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    if (this.extras && this.extras.before) this.extras.before(ctx, this);

    /* fills first, then lines */
    this.series.forEach(function (s) {
      if (!s.fill || !s.pts || s.pts.length < 2) return;
      ctx.beginPath();
      s.pts.forEach(function (p, i) {
        var X = this.sx(p[0]), Y = this.sy(p[1]);
        i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
      }, this);
      var base = s.fillBase != null ? s.fillBase : this.y.min;
      ctx.lineTo(this.sx(s.pts[s.pts.length - 1][0]), this.sy(base));
      ctx.lineTo(this.sx(s.pts[0][0]), this.sy(base));
      ctx.closePath();
      ctx.globalAlpha = s.fillAlpha != null ? s.fillAlpha : 0.10;
      ctx.fillStyle = s.color; ctx.fill(); ctx.globalAlpha = 1;
    }, this);

    this.series.forEach(function (s) {
      if (!s.pts || s.pts.length < 1 || s.hidden) return;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width || 2;
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.globalAlpha = s.alpha != null ? s.alpha : 1;
      if (s.dash) ctx.setLineDash(s.dash); else ctx.setLineDash([]);
      ctx.beginPath();
      var started = false;
      for (var i = 0; i < s.pts.length; i++) {
        var p = s.pts[i];
        if (p == null || !isFinite(p[1])) { started = false; continue; }
        var X = this.sx(p[0]), Y = this.sy(p[1]);
        if (!started) { ctx.moveTo(X, Y); started = true; } else ctx.lineTo(X, Y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      if (s.marker) {
        var C2 = THM.C();
        s.pts.forEach(function (p) {
          if (!p || !isFinite(p[1])) return;
          ctx.beginPath();
          ctx.arc(this.sx(p[0]), this.sy(p[1]), s.markerR || 4, 0, 6.2832);
          ctx.fillStyle = s.color; ctx.fill();
          ctx.lineWidth = 2; ctx.strokeStyle = C2.surface; ctx.stroke();
        }, this);
      }
      if (s.endDot) {
        var last = s.pts[s.pts.length - 1];
        if (last && isFinite(last[1])) {
          ctx.beginPath(); ctx.arc(this.sx(last[0]), this.sy(last[1]), 4.5, 0, 6.2832);
          ctx.fillStyle = s.color; ctx.fill();
          ctx.lineWidth = 2; ctx.strokeStyle = THM.C().surface; ctx.stroke();
        }
      }
    }, this);

    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    if (this.extras && this.extras.after) this.extras.after(ctx, this);

    /* crosshair */
    if (this.hi != null) {
      var C3 = THM.C();
      ctx.strokeStyle = C3.axis; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.round(this.hi.px) + 0.5, this.pt);
      ctx.lineTo(Math.round(this.hi.px) + 0.5, this.pt + this.ph);
      ctx.stroke();
      this.hi.hits.forEach(function (h) {
        ctx.beginPath(); ctx.arc(h.px, h.py, 4.5, 0, 6.2832);
        ctx.fillStyle = h.color; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = C3.surface; ctx.stroke();
      });
    }
    ctx.restore();

    /* direct labels — outside the clip so they may sit in the margin.
       Labels that would collide with one already placed are dropped: a
       clipped or overlapping label is worse than no label.               */
    var placed = [];
    ctx.font = '11.5px ' + (THM.tok('sans') || 'sans-serif');
    this.series.forEach(function (s) {
      if (!s.label || !s.pts || !s.pts.length) return;
      var at = s.labelAt != null ? s.labelAt : s.pts.length - 1;
      var p = s.pts[Math.max(0, Math.min(s.pts.length - 1, at))];
      if (!p || !isFinite(p[1])) return;
      var X = this.sx(p[0]) + (s.labelDx != null ? s.labelDx : 6);
      var Y = this.sy(p[1]) + (s.labelDy || 0);
      var align = s.labelAlign || 'left';
      var w = ctx.measureText(s.label).width;
      var x0 = align === 'center' ? X - w / 2 : align === 'right' ? X - w : X;
      if (x0 < this.pl - 6 || x0 + w > this.pl + this.pw + 60) return;
      var box = { x0: x0 - 3, x1: x0 + w + 3, y0: Y - 8, y1: Y + 8 };
      for (var q = 0; q < placed.length; q++) {
        var b = placed[q];
        if (box.x0 < b.x1 && box.x1 > b.x0 && box.y0 < b.y1 && box.y1 > b.y0) return;
      }
      placed.push(box);
      ctx.fillStyle = THM.C().ink2;
      ctx.textAlign = align;
      ctx.fillText(s.label, X, Y);
    }, this);
    ctx.textAlign = 'left';
  };

  Plot.prototype._legend = function () {
    var vis = this.series.filter(function (s) { return s.name; });
    if (vis.length < 2) { this.legendEl.innerHTML = ''; return; }
    this.legendEl.innerHTML = vis.map(function (s) {
      var st = 'background:' + s.color;
      if (s.dash) st = 'background:repeating-linear-gradient(90deg,' + s.color + ' 0 4px,transparent 4px 7px)';
      return '<span class="legend__item"><span class="legend__swatch" style="' + st + '"></span>' +
             '<span>' + s.name + '</span></span>';
    }).join('');
  };

  Plot.prototype._table = function () {
    var self = this;
    var box = this.tableEl.querySelector('.tbl-wrap');
    var build = function () {
      var ss = self.series.filter(function (s) { return s.name && s.pts && s.pts.length; });
      if (!ss.length) { box.innerHTML = '<p class="muted" style="padding:.7rem">No data.</p>'; return; }
      var ref = ss[0].pts;
      var stride = Math.max(1, Math.ceil(ref.length / 40));
      var head = '<tr><th class="num">' + (self.x.label || 'x') + '</th>' +
        ss.map(function (s) { return '<th class="num">' + s.name + '</th>'; }).join('') + '</tr>';
      var rows = '';
      for (var i = 0; i < ref.length; i += stride) {
        rows += '<tr><td class="num">' + U.fmt(ref[i][0], 3) + '</td>' +
          ss.map(function (s) {
            var p = s.pts[i];
            return '<td class="num">' + (p && isFinite(p[1]) ? U.fmt(p[1], 3) : '—') + '</td>';
          }).join('') + '</tr>';
      }
      box.innerHTML = '<table><thead>' + head + '</thead><tbody>' + rows + '</tbody></table>';
    };
    this.tableEl.addEventListener('toggle', function () { if (self.tableEl.open) build(); });
    if (this.tableEl.open) build();
  };

  Plot.prototype._bindHover = function () {
    var self = this;
    function move(ev) {
      var r = self.cv.getBoundingClientRect();
      var px = ev.clientX - r.left, py = ev.clientY - r.top;
      if (px < self.pl - 4 || px > self.pl + self.pw + 4 || py < self.pt - 8 || py > self.pt + self.ph + 8) {
        return leave();
      }
      var hits = [];
      self.series.forEach(function (s) {
        if (!s.pts || s.pts.length < 2 || s.hidden || s.noHover || !s.name) return;
        var best = null, bd = Infinity;
        for (var i = 0; i < s.pts.length; i++) {
          var p = s.pts[i]; if (!p || !isFinite(p[1])) continue;
          var d = Math.abs(self.sx(p[0]) - px);
          if (d < bd) { bd = d; best = p; }
        }
        if (best && bd < 60) hits.push({ name: s.name, color: s.color, v: best[1], x: best[0],
                                         px: self.sx(best[0]), py: self.sy(best[1]) });
      });
      if (!hits.length) return leave();
      self.hi = { px: hits[0].px, hits: hits };
      self.draw();
      var unit = self.opt.tipUnit || '';
      self.tip.innerHTML =
        '<div class="k">' + (self.x.tipLabel || self.x.label || 'x') + ' = <span class="num">' +
        fmtTick(hits[0].x, self.x) + '</span></div>' +
        hits.map(function (h) {
          return '<div class="row"><span class="sw" style="background:' + h.color + '"></span>' +
                 '<span class="k">' + h.name + '</span> <b class="num">' +
                 U.fmt(h.v, Math.abs(h.v) < 10 ? 3 : 1) + '</b>' + unit + '</div>';
        }).join('');
      self.tip.classList.add('on');
      var tw = self.tip.offsetWidth;
      var tx = U.clamp(hits[0].px, tw / 2 + 4, self.cv.clientWidth - tw / 2 - 4);
      self.tip.style.left = tx + 'px';
      self.tip.style.top = Math.max(28, hits[0].py) + 'px';
    }
    function leave() {
      if (self.hi) { self.hi = null; self.draw(); }
      self.tip.classList.remove('on');
    }
    this.cv.addEventListener('pointermove', move);
    this.cv.addEventListener('pointerleave', leave);
  };

  THM.Plot = Plot;
  THM.plot = function (host, opt) { return new Plot(host, opt); };

  /* ------------------------------------------------------- scalar  fields */

  /**
   * Paint an nx×ny scalar field into a canvas via ImageData.
   * data may be Float64Array/Array in row-major order (index = j*nx + i).
   */
  THM.paintField = function (ctx, data, nx, ny, x0, y0, w, h, ramp, vmin, vmax, opts) {
    opts = opts || {};
    var buf = ctx.createImageData(nx, ny);
    var d = buf.data, inv = vmax > vmin ? 1 / (vmax - vmin) : 0, n = ramp.n;
    for (var j = 0; j < ny; j++) {
      for (var i = 0; i < nx; i++) {
        var k = j * nx + i;
        var dv = data[k];
        var t = isFinite(dv) ? U.clamp((dv - vmin) * inv, 0, 1) : 0;
        var q = Math.round(t * (n - 1)) * 3;
        var o = k * 4;
        d[o] = ramp[q]; d[o + 1] = ramp[q + 1]; d[o + 2] = ramp[q + 2];
        d[o + 3] = opts.mask ? (opts.mask[k] ? 255 : 0) : 255;
      }
    }
    // upscale through an offscreen canvas so the ImageData can be smoothed
    var off = THM._fieldCv || (THM._fieldCv = document.createElement('canvas'));
    if (off.width !== nx || off.height !== ny) { off.width = nx; off.height = ny; }
    off.getContext('2d').putImageData(buf, 0, 0);
    ctx.save();
    ctx.imageSmoothingEnabled = opts.smooth !== false;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(off, x0, y0, w, h);
    ctx.restore();
  };

  /**
   * Marching-squares contour lines for a scalar field, stroked on a context.
   * mapX / mapY convert grid coordinates (fractional i, j) to pixels.
   */
  THM.contour = function (ctx, data, nx, ny, level, mapX, mapY) {
    var pts = [];
    function cross(x1, y1, va, x2, y2, vb) {
      var t = (level - va) / ((vb - va) || 1e-30);
      pts.push([mapX(x1 + (x2 - x1) * t), mapY(y1 + (y2 - y1) * t)]);
    }
    ctx.beginPath();
    for (var j = 0; j < ny - 1; j++) {
      for (var i = 0; i < nx - 1; i++) {
        var a = data[j * nx + i],           // (i,   j  )
            b = data[j * nx + i + 1],       // (i+1, j  )
            c = data[(j + 1) * nx + i + 1], // (i+1, j+1)
            d = data[(j + 1) * nx + i];     // (i,   j+1)
        if (!isFinite(a) || !isFinite(b) || !isFinite(c) || !isFinite(d)) continue;
        var above = (a > level) + (b > level) + (c > level) + (d > level);
        if (above === 0 || above === 4) continue;
        pts.length = 0;
        if ((a > level) !== (b > level)) cross(i, j, a, i + 1, j, b);
        if ((b > level) !== (c > level)) cross(i + 1, j, b, i + 1, j + 1, c);
        if ((d > level) !== (c > level)) cross(i, j + 1, d, i + 1, j + 1, c);
        if ((a > level) !== (d > level)) cross(i, j, a, i, j + 1, d);
        for (var k = 0; k + 1 < pts.length; k += 2) {
          ctx.moveTo(pts[k][0], pts[k][1]);
          ctx.lineTo(pts[k + 1][0], pts[k + 1][1]);
        }
      }
    }
    ctx.stroke();
  };

  /** A labelled colour-bar element. */
  THM.colorbar = function (host, ramp, lo, hi, label, opts) {
    opts = opts || {};
    var el = document.createElement('div');
    el.className = 'colorbar';
    el.innerHTML = '<span class="cb-lo">' + lo + '</span>' +
                   '<span class="colorbar__ramp" style="background:' + ramp.gradient() + '"></span>' +
                   '<span class="cb-hi">' + hi + '</span>';
    if (label) {
      var w = document.createElement('div');
      w.style.cssText = 'display:grid;gap:.25rem';
      var l = document.createElement('div');
      l.className = 'ctrl__label'; l.style.fontSize = '.78rem'; l.textContent = label;
      w.appendChild(l); w.appendChild(el); host.appendChild(w);
      el.host = w;
    } else host.appendChild(el);
    el.update = function (a, b, r) {
      el.querySelector('.cb-lo').textContent = a;
      el.querySelector('.cb-hi').textContent = b;
      if (r) el.querySelector('.colorbar__ramp').style.background = r.gradient();
    };
    return el;
  };

  /* -------------------------------------------------------------- controls */

  /** Slider with a live readout. `o.fmt(v)` renders the value. */
  THM.slider = function (host, o) {
    var wrap = document.createElement('label');
    wrap.className = 'ctrl';
    var id = 'c' + Math.random().toString(36).slice(2, 8);
    wrap.innerHTML =
      '<span class="ctrl__label">' + o.label + '</span>' +
      '<span class="ctrl__val" id="' + id + '"></span>' +
      '<input type="range" min="' + o.min + '" max="' + o.max + '" step="' + (o.step || 'any') +
      '" value="' + o.value + '" aria-label="' + o.label.replace(/<[^>]+>/g, '') + '">';
    host.appendChild(wrap);
    var input = wrap.querySelector('input'), out = wrap.querySelector('#' + id);
    var api = {
      el: wrap, input: input,
      get value() { return o.map ? o.map(+input.value) : +input.value; },
      set value(v) { input.value = o.unmap ? o.unmap(v) : v; render(); },
      set: function (v) { api.value = v; if (o.on) o.on(api.value); }
    };
    function render() {
      out.innerHTML = o.fmt ? o.fmt(api.value) : String(api.value);
      if (o.fmtMath) THM.renderMathIn(out);
    }
    input.addEventListener('input', function () { render(); if (o.on) o.on(api.value); });
    render();
    THM.renderMathIn(wrap.querySelector('.ctrl__label'));
    return api;
  };

  /** Segmented button group. */
  THM.segmented = function (host, o) {
    var el = document.createElement('div');
    el.className = 'seg'; el.setAttribute('role', 'group');
    if (o.label) el.setAttribute('aria-label', o.label);
    el.innerHTML = o.options.map(function (op, i) {
      return '<button type="button" data-v="' + op.value + '" aria-pressed="' +
             (i === (o.index || 0)) + '">' + op.label + '</button>';
    }).join('');
    host.appendChild(el);
    THM.renderMathIn(el);
    var value = o.options[o.index || 0].value;
    el.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      el.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      value = b.dataset.v;
      if (o.on) o.on(value);
    });
    return { el: el, get value() { return value; },
             set: function (v) {
               el.querySelectorAll('button').forEach(function (x) {
                 x.setAttribute('aria-pressed', String(x.dataset.v === v));
               });
               value = v; if (o.on) o.on(v);
             } };
  };

  /** Play / pause + reset button pair bound to a THM.loop handle. */
  THM.transport = function (host, o) {
    var row = document.createElement('div');
    row.className = 'btnrow';
    row.innerHTML =
      '<button class="btn btn--primary" data-a="play"><span class="tlabel">Pause</span></button>' +
      '<button class="btn" data-a="reset">Reset</button>';
    host.appendChild(row);
    var play = row.querySelector('[data-a="play"]'), lbl = play.querySelector('.tlabel');
    play.addEventListener('click', function () {
      var r = o.toggle(); lbl.textContent = r ? 'Pause' : 'Play';
    });
    row.querySelector('[data-a="reset"]').addEventListener('click', function () { o.reset(); });
    return { row: row, setLabel: function (s) { lbl.textContent = s; } };
  };

  /* --------------------------------------------------------------- readout */

  THM.readouts = function (host, defs) {
    var el = document.createElement('div');
    el.className = 'readouts';
    el.innerHTML = defs.map(function (d) {
      return '<div class="readout"><span class="readout__k">' + d.label + '</span>' +
             '<span class="readout__v" data-r="' + d.key + '">—</span></div>';
    }).join('');
    host.appendChild(el);
    THM.renderMathIn(el);
    return {
      el: el,
      set: function (k, v) {
        var t = el.querySelector('[data-r="' + k + '"]');
        if (t) t.innerHTML = v;
      }
    };
  };

})(window);

/* EARTHY — ScientificCharts
 * Renders radar, histogram, and transect charts on HTML5 canvas.
 * window.ScientificCharts
 */
(function (global) {
  'use strict';

  function ScientificCharts() {}

  /* ── Radar / Spider ─────────────────────────────────────────────────── */
  ScientificCharts.prototype.renderRadarChart = function (canvasId, axes, series) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    var cx = W / 2, cy = H / 2;
    var r = Math.min(cx, cy) * 0.72;
    var n = axes.length;
    if (n < 3) return;

    var step = (Math.PI * 2) / n;
    var levels = 5;
    var colors = ['#2D6A4F', '#D4A373', '#BC6C25', '#4A524B', '#1C1E1B'];

    function angle(i) { return -Math.PI / 2 + i * step; }
    function pt(i, pct) {
      var a = angle(i);
      return { x: cx + Math.cos(a) * r * pct, y: cy + Math.sin(a) * r * pct };
    }

    /* grid */
    ctx.strokeStyle = '#C8CCC4';
    ctx.lineWidth = 0.8;
    for (var l = 1; l <= levels; l++) {
      ctx.beginPath();
      for (var i = 0; i < n; i++) {
        var p = pt(i, l / levels);
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    /* spokes */
    for (var i = 0; i < n; i++) {
      var p = pt(i, 1);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }

    /* axis labels */
    ctx.fillStyle = '#1C1E1B';
    ctx.font = '10px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (var i = 0; i < n; i++) {
      var lp = pt(i, 1.18);
      ctx.fillText(axes[i], lp.x, lp.y);
    }

    /* series */
    series.forEach(function (s, si) {
      if (!s.values || s.values.length !== n) return;
      ctx.beginPath();
      s.values.forEach(function (v, i) {
        var p = pt(i, Math.max(0, Math.min(1, v)));
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.strokeStyle = colors[si % colors.length];
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = colors[si % colors.length] + '33';
      ctx.fill();

      /* legend dot */
      ctx.fillStyle = colors[si % colors.length];
      ctx.beginPath();
      ctx.arc(10, 14 + si * 16, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1C1E1B';
      ctx.font = '10px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(s.label || ('Series ' + (si + 1)), 20, 14 + si * 16);
    });
  };

  /* ── Histogram ──────────────────────────────────────────────────────── */
  ScientificCharts.prototype.renderHistogram = function (canvasId, bins, counts, label) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    var pad = { top: 20, right: 20, bottom: 36, left: 44 };
    var iW = W - pad.left - pad.right;
    var iH = H - pad.top - pad.bottom;
    var maxC = Math.max.apply(null, counts) || 1;
    var barW = iW / counts.length;

    ctx.fillStyle = '#2D6A4F';
    counts.forEach(function (c, i) {
      var bH = (c / maxC) * iH;
      ctx.fillRect(pad.left + i * barW, pad.top + iH - bH, barW - 1, bH);
    });

    /* axes */
    ctx.strokeStyle = '#1C1E1B';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, pad.top + iH);
    ctx.lineTo(pad.left + iW, pad.top + iH);
    ctx.stroke();

    /* x labels */
    ctx.fillStyle = '#4A524B';
    ctx.font = '9px "Courier New", monospace';
    ctx.textAlign = 'center';
    bins.forEach(function (b, i) {
      if (i % Math.ceil(bins.length / 6) === 0) {
        ctx.fillText(b.toFixed(1), pad.left + i * barW + barW / 2, pad.top + iH + 12);
      }
    });

    /* axis label */
    if (label) {
      ctx.fillStyle = '#1C1E1B';
      ctx.font = '10px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, pad.left + iW / 2, H - 4);
    }
  };

  /* ── Transect Profile ───────────────────────────────────────────────── */
  ScientificCharts.prototype.renderTransectProfile = function (canvasId, samples) {
    var canvas = document.getElementById(canvasId);
    if (!canvas || !samples || samples.length < 2) return;
    var ctx = canvas.getContext('2d');
    var W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    var pad = { top: 20, right: 20, bottom: 36, left: 54 };
    var iW = W - pad.left - pad.right;
    var iH = H - pad.top - pad.bottom;

    var dists = samples.map(function (s) { return s.distance_m; });
    var elevs = samples.map(function (s) { return s.elevation_m; });
    var minD = Math.min.apply(null, dists);
    var maxD = Math.max.apply(null, dists);
    var minE = Math.min.apply(null, elevs);
    var maxE = Math.max.apply(null, elevs);
    var rangeD = maxD - minD || 1;
    var rangeE = maxE - minE || 1;

    function xOf(d) { return pad.left + ((d - minD) / rangeD) * iW; }
    function yOf(e) { return pad.top + iH - ((e - minE) / rangeE) * iH; }

    /* fill */
    ctx.beginPath();
    ctx.moveTo(xOf(dists[0]), pad.top + iH);
    samples.forEach(function (s) { ctx.lineTo(xOf(s.distance_m), yOf(s.elevation_m)); });
    ctx.lineTo(xOf(dists[dists.length - 1]), pad.top + iH);
    ctx.closePath();
    ctx.fillStyle = '#2D6A4F44';
    ctx.fill();

    /* line */
    ctx.beginPath();
    samples.forEach(function (s, i) {
      i === 0 ? ctx.moveTo(xOf(s.distance_m), yOf(s.elevation_m))
              : ctx.lineTo(xOf(s.distance_m), yOf(s.elevation_m));
    });
    ctx.strokeStyle = '#2D6A4F';
    ctx.lineWidth = 2;
    ctx.stroke();

    /* axes */
    ctx.strokeStyle = '#1C1E1B';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, pad.top + iH);
    ctx.lineTo(pad.left + iW, pad.top + iH);
    ctx.stroke();

    /* y ticks */
    ctx.fillStyle = '#4A524B';
    ctx.font = '9px "Courier New", monospace';
    ctx.textAlign = 'right';
    for (var t = 0; t <= 4; t++) {
      var ev = minE + (rangeE * t / 4);
      var ty = pad.top + iH - (t / 4) * iH;
      ctx.fillText(ev.toFixed(0) + 'm', pad.left - 4, ty + 3);
      ctx.strokeStyle = '#E0E2DC';
      ctx.beginPath();
      ctx.moveTo(pad.left, ty);
      ctx.lineTo(pad.left + iW, ty);
      ctx.stroke();
    }

    /* x ticks */
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#1C1E1B';
    for (var t = 0; t <= 4; t++) {
      var dv = minD + (rangeD * t / 4);
      var tx = pad.left + (t / 4) * iW;
      ctx.fillText((dv / 1000).toFixed(1) + 'km', tx, pad.top + iH + 12);
    }

    ctx.fillStyle = '#1C1E1B';
    ctx.font = '10px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Distance along transect', pad.left + iW / 2, H - 4);
  };

  global.ScientificCharts = ScientificCharts;
}(window));

/* EARTHY — InteractiveMap2D
 * Plate Carrée HTML5 canvas world map with candidate markers.
 * window.InteractiveMap2D
 */
(function (global) {
  'use strict';

  /* Approximate continent bounding boxes [minLon, minLat, maxLon, maxLat] */
  var CONTINENTS = [
    { name: 'N.America', bounds: [-168, 7,  -52,  83], color: '#C8CABC' },
    { name: 'S.America', bounds: [ -82,-56,  -34,  13], color: '#C8CABC' },
    { name: 'Europe',    bounds: [ -25, 36,   40,  72], color: '#C8CABC' },
    { name: 'Africa',    bounds: [ -18,-35,   52,  38], color: '#C8CABC' },
    { name: 'Asia',      bounds: [  25, 10,  180,  78], color: '#C8CABC' },
    { name: 'Australia', bounds: [ 113,-44,  154,  -9], color: '#C8CABC' },
    { name: 'Antarctica',bounds: [-180,-90,  180, -60], color: '#DDE0D8' },
    { name: 'Greenland', bounds: [ -74, 60,  -10,  84], color: '#DDE0D8' },
  ];

  function InteractiveMap2D(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.candidates = [];
    this.targetMarkers = [];
    this.tooltip = null;
    this.hoveredIdx = -1;
    this.pan = { x: 0, y: 0 };
    this.zoom = 1;
    this._dragging = false;
    this._dragStart = null;
    this._bindEvents();
    this.draw();
  }

  InteractiveMap2D.prototype._lonlatToXY = function (lon, lat) {
    var W = this.canvas.width, H = this.canvas.height;
    var x = ((lon + 180) / 360) * W * this.zoom + this.pan.x;
    var y = ((90 - lat) / 180) * H * this.zoom + this.pan.y;
    return { x: x, y: y };
  };

  InteractiveMap2D.prototype._xyToLonlat = function (x, y) {
    var W = this.canvas.width, H = this.canvas.height;
    var lon = ((x - this.pan.x) / (W * this.zoom)) * 360 - 180;
    var lat = 90 - ((y - this.pan.y) / (H * this.zoom)) * 180;
    return { lon: lon, lat: lat };
  };

  InteractiveMap2D.prototype._bindEvents = function () {
    var self = this;
    if (!this.canvas) return;

    this.canvas.addEventListener('mousemove', function (e) {
      var rect = self.canvas.getBoundingClientRect();
      var mx = e.clientX - rect.left;
      var my = e.clientY - rect.top;
      if (self._dragging && self._dragStart) {
        self.pan.x += mx - self._dragStart.x;
        self.pan.y += my - self._dragStart.y;
        self._dragStart = { x: mx, y: my };
        self.draw();
        return;
      }
      self.hoveredIdx = -1;
      self.candidates.forEach(function (c, i) {
        var p = self._lonlatToXY(c.longitude, c.latitude);
        var dx = mx - p.x, dy = my - p.y;
        if (Math.sqrt(dx * dx + dy * dy) < 10) {
          self.hoveredIdx = i;
          self.tooltip = { x: mx, y: my, label: c.region + '\n' + c.analogy_score.toFixed(1) };
        }
      });
      self.draw();
    });

    this.canvas.addEventListener('mousedown', function (e) {
      var rect = self.canvas.getBoundingClientRect();
      self._dragging = true;
      self._dragStart = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    });

    this.canvas.addEventListener('mouseup', function () {
      self._dragging = false;
      self._dragStart = null;
    });

    this.canvas.addEventListener('mouseleave', function () {
      self._dragging = false;
      self.tooltip = null;
      self.draw();
    });

    this.canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      var factor = e.deltaY < 0 ? 1.15 : 0.87;
      self.zoom = Math.max(0.5, Math.min(8, self.zoom * factor));
      self.draw();
    }, { passive: false });
  };

  InteractiveMap2D.prototype.draw = function () {
    if (!this.canvas) return;
    var ctx = this.ctx;
    var W = this.canvas.width, H = this.canvas.height;
    ctx.clearRect(0, 0, W, H);

    /* Ocean */
    ctx.fillStyle = '#8FBBCC';
    ctx.fillRect(0, 0, W, H);

    /* Continents */
    var self = this;
    CONTINENTS.forEach(function (cont) {
      var tl = self._lonlatToXY(cont.bounds[0], cont.bounds[3]);
      var br = self._lonlatToXY(cont.bounds[2], cont.bounds[1]);
      ctx.fillStyle = cont.color;
      ctx.fillRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
    });

    /* Graticule 30° */
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 0.5;
    for (var lon = -180; lon <= 180; lon += 30) {
      ctx.beginPath();
      var t = self._lonlatToXY(lon, 90);
      var b = self._lonlatToXY(lon, -90);
      ctx.moveTo(t.x, t.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    for (var lat = -90; lat <= 90; lat += 30) {
      ctx.beginPath();
      var l = self._lonlatToXY(-180, lat);
      var r = self._lonlatToXY(180, lat);
      ctx.moveTo(l.x, l.y);
      ctx.lineTo(r.x, r.y);
      ctx.stroke();
    }

    /* Target markers */
    this.targetMarkers.forEach(function (m) {
      self.drawTargetMarker(m.lat, m.lon, m.label);
    });

    /* Candidate circles */
    this.candidates.forEach(function (c, i) {
      var p = self._lonlatToXY(c.longitude, c.latitude);
      var score = c.analogy_score || 0;
      var hue = score > 70 ? '#2D6A4F' : score > 45 ? '#D4A373' : '#BC6C25';
      ctx.beginPath();
      ctx.arc(p.x, p.y, i === self.hoveredIdx ? 11 : 8, 0, Math.PI * 2);
      ctx.fillStyle = hue + 'CC';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      /* rank label */
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 8px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(c.rank || (i + 1), p.x, p.y);
    });

    /* Tooltip */
    if (this.tooltip) {
      var lines = this.tooltip.label.split('\n');
      var tw = Math.max.apply(null, lines.map(function (l) { return l.length; })) * 7 + 16;
      var th = lines.length * 16 + 10;
      ctx.fillStyle = 'rgba(28,30,27,0.88)';
      ctx.beginPath();
      ctx.roundRect
        ? ctx.roundRect(this.tooltip.x + 12, this.tooltip.y - th / 2, tw, th, 3)
        : ctx.rect(this.tooltip.x + 12, this.tooltip.y - th / 2, tw, th);
      ctx.fill();
      ctx.fillStyle = '#F8F9F5';
      ctx.font = '11px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      lines.forEach(function (line, li) {
        ctx.fillText(line, self.tooltip.x + 20, self.tooltip.y - th / 2 + 5 + li * 16);
      });
    }
  };

  InteractiveMap2D.prototype.renderCandidates = function (candidates) {
    this.candidates = candidates || [];
    this.draw();
  };

  InteractiveMap2D.prototype.drawTargetMarker = function (lat, lon, label) {
    if (!this.canvas) return;
    var p = this._lonlatToXY(lon, lat);
    var ctx = this.ctx;
    /* Star */
    ctx.fillStyle = '#FFD700';
    ctx.strokeStyle = '#1C1E1B';
    ctx.lineWidth = 1;
    this._drawStar(ctx, p.x, p.y, 5, 10, 4);
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillStyle = '#1C1E1B';
    ctx.textAlign = 'center';
    ctx.fillText(label, p.x, p.y - 14);
  };

  InteractiveMap2D.prototype._drawStar = function (ctx, cx, cy, spikes, outerR, innerR) {
    var rot = (Math.PI / 2) * 3;
    var step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerR);
    for (var i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerR);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  InteractiveMap2D.prototype.addTargetMarker = function (lat, lon, label) {
    this.targetMarkers.push({ lat: lat, lon: lon, label: label });
    this.draw();
  };

  InteractiveMap2D.prototype.reset = function () {
    this.pan = { x: 0, y: 0 };
    this.zoom = 1;
    this.draw();
  };

  global.InteractiveMap2D = InteractiveMap2D;
}(window));

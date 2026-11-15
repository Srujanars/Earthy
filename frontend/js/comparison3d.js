/* EARTHY — SplitComparison3D
 * Side-by-side terrain comparison using two THREE renderers on a split canvas.
 * window.SplitComparison3D
 */
(function (global) {
  'use strict';

  function SplitComparison3D(leftCanvasId, rightCanvasId) {
    this.leftId = leftCanvasId;
    this.rightId = rightCanvasId;
    this.left = null;
    this.right = null;
    this.animId = null;
    this._init();
  }

  SplitComparison3D.prototype._init = function () {
    this.left = this._buildPane(this.leftId, 0x1A3A2A);
    this.right = this._buildPane(this.rightId, 0x3A1A0A);
    this._startLoop();
  };

  SplitComparison3D.prototype._buildPane = function (canvasId, bgColor) {
    try {
      var canvas = document.getElementById(canvasId);
      if (!canvas) return null;
      var W = canvas.clientWidth || 320;
      var H = canvas.clientHeight || 280;

      var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
      renderer.setSize(W, H);
      renderer.setPixelRatio(window.devicePixelRatio || 1);

      var scene = new THREE.Scene();
      scene.background = new THREE.Color(bgColor);

      var camera = new THREE.PerspectiveCamera();
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      camera.position.set(0, 4, 7);

      var controls = new THREE.OrbitControls(camera, canvas);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;

      var ambient = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambient);
      var dir = new THREE.DirectionalLight(0xffffff, 1.0);
      dir.position.set(5, 10, 5);
      scene.add(dir);

      return { renderer: renderer, scene: scene, camera: camera, controls: controls, mesh: null };
    } catch (e) {
      console.warn('SplitComparison3D pane init error:', e);
      return null;
    }
  };

  SplitComparison3D.prototype._buildTerrainMesh = function (terrainData, colorTint) {
    try {
      var matrix = terrainData.elevation_matrix;
      if (!matrix || !matrix.length) return null;
      var rows = matrix.length;
      var cols = matrix[0].length;

      var flat = [];
      matrix.forEach(function (row) { row.forEach(function (v) { flat.push(v); }); });
      var minE = Math.min.apply(null, flat);
      var maxE = Math.max.apply(null, flat);
      var rangeE = maxE - minE || 1;

      var verts = [];
      var colors = [];
      var color = new THREE.Color();

      for (var row = 0; row < rows; row++) {
        for (var col = 0; col < cols; col++) {
          var ex = matrix[row][col];
          var nx = (col / (cols - 1)) * 8 - 4;
          var ny = ((ex - minE) / rangeE) * 2.5;
          var nz = (row / (rows - 1)) * 8 - 4;
          verts.push(nx, ny, nz);
          var t = (ex - minE) / rangeE;
          color.setHSL(colorTint + t * 0.1, 0.6, 0.3 + t * 0.3);
          colors.push(color.r, color.g, color.b);
        }
      }

      var indices = [];
      for (var r = 0; r < rows - 1; r++) {
        for (var c = 0; c < cols - 1; c++) {
          var a = r * cols + c;
          var b = a + 1;
          var d = a + cols;
          var e = d + 1;
          indices.push(a, b, d);
          indices.push(b, e, d);
        }
      }

      var bufGeom = new THREE.BufferGeometry();
      bufGeom.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      bufGeom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      bufGeom.setIndex(indices);
      bufGeom.computeVertexNormals();

      var mat = new THREE.MeshPhongMaterial();
      mat.vertexColors = true;

      return new THREE.Mesh(bufGeom, mat);
    } catch (e) {
      console.warn('buildTerrainMesh error:', e);
      return null;
    }
  };

  SplitComparison3D.prototype.loadLeft = function (terrainData, label) {
    if (!this.left) return;
    try {
      if (this.left.mesh) {
        this.left.scene.children = this.left.scene.children.filter(function (c) { return !c._isTerrain; });
      }
      var mesh = this._buildTerrainMesh(terrainData, 0.33);
      if (mesh) {
        mesh._isTerrain = true;
        this.left.scene.add(mesh);
        this.left.mesh = mesh;
      }
    } catch (e) {
      console.warn('loadLeft error:', e);
    }
  };

  SplitComparison3D.prototype.loadRight = function (terrainData, label) {
    if (!this.right) return;
    try {
      if (this.right.mesh) {
        this.right.scene.children = this.right.scene.children.filter(function (c) { return !c._isTerrain; });
      }
      var mesh = this._buildTerrainMesh(terrainData, 0.05);
      if (mesh) {
        mesh._isTerrain = true;
        this.right.scene.add(mesh);
        this.right.mesh = mesh;
      }
    } catch (e) {
      console.warn('loadRight error:', e);
    }
  };

  SplitComparison3D.prototype._startLoop = function () {
    var self = this;
    function loop() {
      self.animId = requestAnimationFrame(loop);
      try {
        if (self.left) {
          self.left.controls.update();
          self.left.renderer.render(self.left.scene, self.left.camera);
        }
        if (self.right) {
          self.right.controls.update();
          self.right.renderer.render(self.right.scene, self.right.camera);
        }
      } catch (e) {
        cancelAnimationFrame(self.animId);
      }
    }
    loop();
  };

  SplitComparison3D.prototype.dispose = function () {
    if (this.animId) cancelAnimationFrame(this.animId);
    try { if (this.left) this.left.renderer.dispose(); } catch (e) {}
    try { if (this.right) this.right.renderer.dispose(); } catch (e) {}
  };

  global.SplitComparison3D = SplitComparison3D;
}(window));

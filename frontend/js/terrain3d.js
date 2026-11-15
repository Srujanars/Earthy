/* EARTHY — TerrainMesh3D
 * Builds a THREE.js PlaneGeometry from elevation_matrix data.
 * window.TerrainMesh3D
 */
(function (global) {
  'use strict';

  function TerrainMesh3D(canvasId) {
    this.canvasId = canvasId;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.controls = null;
    this.terrainMesh = null;
    this.animId = null;
    this.verticalExaggeration = 3;
    this.wireframe = false;
    this._init();
  }

  TerrainMesh3D.prototype._init = function () {
    try {
      var canvas = document.getElementById(this.canvasId);
      if (!canvas) return;

      this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
      this.renderer.setSize(canvas.clientWidth || 480, canvas.clientHeight || 360);
      this.renderer.setPixelRatio(window.devicePixelRatio || 1);

      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x0C100E);

      this.camera = new THREE.PerspectiveCamera();
      this.camera.aspect = (canvas.clientWidth || 480) / (canvas.clientHeight || 360);
      this.camera.updateProjectionMatrix();
      this.camera.position.set(0, 4, 6);

      this.controls = new THREE.OrbitControls(this.camera, canvas);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.target.set(0, 0, 0);

      var ambient = new THREE.AmbientLight(0xffffff, 0.5);
      this.scene.add(ambient);
      var sun = new THREE.DirectionalLight(0xffffff, 1.0);
      sun.position.set(5, 10, 5);
      this.scene.add(sun);

      this._startLoop();
    } catch (e) {
      console.warn('TerrainMesh3D init error:', e);
    }
  };

  TerrainMesh3D.prototype.loadTerrain = function (terrainData) {
    try {
      if (this.terrainMesh) {
        this.scene.children = this.scene.children.filter(function (c) { return !c._isTerrain; });
      }
      var matrix = terrainData.elevation_matrix;
      if (!matrix || !matrix.length) return;
      var rows = matrix.length;
      var cols = matrix[0].length;

      var geom = new THREE.PlaneGeometry();
      /* Use BufferGeometry directly for the terrain */
      var bufGeom = new THREE.BufferGeometry();
      var verts = [];
      var colors = [];

      /* Flatten elevation range for color mapping */
      var flat = [];
      matrix.forEach(function (row) { row.forEach(function (v) { flat.push(v); }); });
      var minE = Math.min.apply(null, flat);
      var maxE = Math.max.apply(null, flat);
      var rangeE = maxE - minE || 1;

      var color = new THREE.Color();
      for (var row = 0; row < rows; row++) {
        for (var col = 0; col < cols; col++) {
          var ex = matrix[row][col];
          var nx = (col / (cols - 1)) * 10 - 5;
          var ny = ((ex - minE) / rangeE) * this.verticalExaggeration;
          var nz = (row / (rows - 1)) * 10 - 5;
          verts.push(nx, ny, nz);

          /* slope-based colouring: low→green, mid→yellow, high→red */
          var slope = 0;
          if (terrainData.slope_matrix) {
            slope = (terrainData.slope_matrix[row] && terrainData.slope_matrix[row][col]) || 0;
          }
          if (slope < 10) {
            color.setRGB(0.18, 0.42, 0.31);
          } else if (slope < 20) {
            color.setRGB(0.83, 0.64, 0.21);
          } else {
            color.setRGB(0.74, 0.42, 0.15);
          }
          colors.push(color.r, color.g, color.b);
        }
      }

      /* Build indices for triangle strips */
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

      bufGeom.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      bufGeom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      bufGeom.setIndex(indices);
      bufGeom.computeVertexNormals();

      var mat = new THREE.MeshPhongMaterial();
      mat.vertexColors = true;
      mat.wireframe = this.wireframe;

      this.terrainMesh = new THREE.Mesh(bufGeom, mat);
      this.terrainMesh._isTerrain = true;
      this.scene.add(this.terrainMesh);
    } catch (e) {
      console.warn('loadTerrain error:', e);
    }
  };

  TerrainMesh3D.prototype.setVerticalExaggeration = function (v) {
    this.verticalExaggeration = v;
  };

  TerrainMesh3D.prototype.toggleWireframe = function () {
    this.wireframe = !this.wireframe;
    if (this.terrainMesh && this.terrainMesh.material) {
      this.terrainMesh.material.wireframe = this.wireframe;
    }
  };

  TerrainMesh3D.prototype._startLoop = function () {
    var self = this;
    function loop() {
      self.animId = requestAnimationFrame(loop);
      try {
        if (self.controls) self.controls.update();
        self.renderer.render(self.scene, self.camera);
      } catch (e) {
        cancelAnimationFrame(self.animId);
      }
    }
    loop();
  };

  TerrainMesh3D.prototype.dispose = function () {
    if (this.animId) cancelAnimationFrame(this.animId);
    try { this.renderer.dispose(); } catch (e) {}
  };

  global.TerrainMesh3D = TerrainMesh3D;
}(window));

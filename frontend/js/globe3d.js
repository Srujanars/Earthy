/* EARTHY — PlanetaryGlobe3D
 * Renders a THREE.js sphere with procedural surface colouring.
 * window.PlanetaryGlobe3D
 */
(function (global) {
  'use strict';

  function PlanetaryGlobe3D(canvasId) {
    this.canvasId = canvasId;
    this.planet = 'earth';
    this.markers = [];
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.globe = null;
    this.animId = null;
    this._init();
  }

  PlanetaryGlobe3D.prototype._init = function () {
    try {
      var canvas = document.getElementById(this.canvasId);
      if (!canvas) return;

      this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
      this.renderer.setSize(canvas.clientWidth || 480, canvas.clientHeight || 480);
      this.renderer.setPixelRatio(window.devicePixelRatio || 1);

      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x0C100E);

      this.camera = new THREE.PerspectiveCamera();
      this.camera.aspect = (canvas.clientWidth || 480) / (canvas.clientHeight || 480);
      this.camera.updateProjectionMatrix();
      this.camera.position.set(0, 0, 3);

      this.controls = new THREE.OrbitControls(this.camera, canvas);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;

      var ambient = new THREE.AmbientLight(0xffffff, 0.6);
      this.scene.add(ambient);
      var sun = new THREE.DirectionalLight(0xffffff, 1.0);
      sun.position.set(5, 3, 5);
      this.scene.add(sun);

      this._buildGlobe();
      this.animate();
    } catch (e) {
      console.warn('Globe3D init error:', e);
    }
  };

  PlanetaryGlobe3D.prototype._buildGlobe = function () {
    try {
      if (this.globe) {
        this.scene.children = this.scene.children.filter(function (c) {
          return !(c instanceof THREE.Mesh && c._isGlobe);
        });
      }
      var geom = new THREE.SphereGeometry(1, 32, 32);
      var mat = new THREE.MeshPhongMaterial({ color: this._baseColor() });
      this.globe = new THREE.Mesh(geom, mat);
      this.globe._isGlobe = true;
      this.scene.add(this.globe);
    } catch (e) {
      console.warn('Globe build error:', e);
    }
  };

  PlanetaryGlobe3D.prototype._baseColor = function () {
    if (this.planet === 'mars') return 0xC1440E;
    if (this.planet === 'moon') return 0x8E8E8E;
    return 0x2255AA;
  };

  PlanetaryGlobe3D.prototype.setPlanet = function (planet) {
    this.planet = planet;
    this._buildGlobe();
  };

  PlanetaryGlobe3D.prototype.addMarker = function (lat, lon, label, color) {
    try {
      var phi = (90 - lat) * (Math.PI / 180);
      var theta = (lon + 180) * (Math.PI / 180);
      var r = 1.05;
      var x = -r * Math.sin(phi) * Math.cos(theta);
      var y = r * Math.cos(phi);
      var z = r * Math.sin(phi) * Math.sin(theta);

      var geom = new THREE.SphereGeometry(0.025, 8, 8);
      var mat = new THREE.MeshBasicMaterial({ color: color || 0xFFD700 });
      var mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(x, y, z);
      this.scene.add(mesh);
      this.markers.push({ lat: lat, lon: lon, label: label, mesh: mesh });
    } catch (e) {
      console.warn('addMarker error:', e);
    }
  };

  PlanetaryGlobe3D.prototype.animate = function () {
    var self = this;
    function loop() {
      self.animId = requestAnimationFrame(loop);
      try {
        if (self.globe) self.globe.rotation.y += 0.002;
        if (self.controls) self.controls.update();
        self.renderer.render(self.scene, self.camera);
      } catch (e) {
        cancelAnimationFrame(self.animId);
      }
    }
    loop();
  };

  PlanetaryGlobe3D.prototype.dispose = function () {
    if (this.animId) cancelAnimationFrame(this.animId);
    try { this.renderer.dispose(); } catch (e) {}
  };

  global.PlanetaryGlobe3D = PlanetaryGlobe3D;
}(window));

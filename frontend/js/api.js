/* EARTHY — EarthyAPI client
 * All requests target Flask on port 5050.
 * window.EarthyAPI is set at bottom of file.
 */
(function (global) {
  'use strict';

  var BASE = 'http://localhost:5050';

  function EarthyAPI() {}

  EarthyAPI.prototype._req = function (method, path, body) {
    var opts = {
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body !== undefined) {
      opts.body = JSON.stringify(body);
    }
    return fetch(BASE + path, opts).then(function (r) {
      if (!r.ok) throw new Error('API ' + r.status + ' ' + path);
      return r.json();
    });
  };

  EarthyAPI.prototype._download = function (blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
  };

  EarthyAPI.prototype.health = function () {
    return this._req('GET', '/api/health');
  };

  EarthyAPI.prototype.getTargets = function (body) {
    var q = body ? '?body=' + encodeURIComponent(body) : '';
    return this._req('GET', '/api/targets' + q);
  };

  EarthyAPI.prototype.getTarget = function (id) {
    return this._req('GET', '/api/targets/' + encodeURIComponent(id));
  };

  EarthyAPI.prototype.getDatasets = function () {
    return this._req('GET', '/api/datasets');
  };

  EarthyAPI.prototype.analyze = function (payload) {
    return this._req('POST', '/api/analyze', payload);
  };

  EarthyAPI.prototype.getTerrain = function (regionId) {
    return this._req('GET', '/api/terrain/' + encodeURIComponent(regionId));
  };

  EarthyAPI.prototype.compare = function (t, c) {
    return this._req('POST', '/api/compare', { target_id: t, candidate_id: c });
  };

  EarthyAPI.prototype.compareMulti = function (tid, cids) {
    return this._req('POST', '/api/compare-multi', { target_id: tid, candidate_ids: cids });
  };

  EarthyAPI.prototype.getScientificAnalysis = function (cellId, targetId) {
    return this._req('GET', '/api/scientific-analysis/' + encodeURIComponent(cellId) + '?target_id=' + encodeURIComponent(targetId));
  };

  EarthyAPI.prototype.getTransect = function (regionId, n) {
    return this._req('POST', '/api/transect', { region_id: regionId, n_samples: n || 50 });
  };

  EarthyAPI.prototype.exportGeoJSON = function (payload) {
    var self = this;
    return fetch(BASE + '/api/export/geojson', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) {
      if (!r.ok) throw new Error('Export error ' + r.status);
      return r.blob();
    }).then(function (blob) {
      self._download(blob, 'earthy_candidates.geojson');
    });
  };

  EarthyAPI.prototype.exportCSV = function (payload) {
    var self = this;
    return fetch(BASE + '/api/export/csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) {
      if (!r.ok) throw new Error('Export error ' + r.status);
      return r.blob();
    }).then(function (blob) {
      self._download(blob, 'earthy_candidates.csv');
    });
  };

  EarthyAPI.prototype.exportReport = function (payload) {
    var self = this;
    return fetch(BASE + '/api/export/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) {
      if (!r.ok) throw new Error('Export error ' + r.status);
      return r.blob();
    }).then(function (blob) {
      self._download(blob, 'earthy_report.md');
    });
  };

  global.EarthyAPI = EarthyAPI;
}(window));

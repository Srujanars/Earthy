/* EARTHY — EarthyWorkstation
 * Main application controller.
 * window.EarthyWorkstation
 */
(function (global) {
  'use strict';

  var DEBOUNCE_MS = 600;

  function EarthyWorkstation() {
    this.state = {
      currentView: 'view-overview',
      activePlanet: 'mars',
      activeTargetId: 'jezero_crater',
      activeCandidate: null,
      analysisResults: null,
      targets: [],
      comparisonCandidates: []
    };
    this.map2d = null;
    this.globe3d = null;
    this.terrain3d = null;
    this.charts = null;
    this.splitComp = null;
    this._debounceTimer = null;
    this._viewportMode = '2d';
  }

  /* ── Init ────────────────────────────────────────────────────────────── */
  EarthyWorkstation.prototype.init = function () {
    var self = this;
    this.charts = new global.ScientificCharts();

    global.EarthyAPI.prototype.health.call(new global.EarthyAPI())
      .then(function (h) {
        self._setStatus('API connected — ' + h.service + ' v' + h.version + ' (' + h.grid_cells_loaded + ' cells)');
      })
      .catch(function () {
        self._setStatus('Backend offline — demo mode');
      });

    this._loadTargets();
    this._wireTabs();
    this._wirePlanetSwitcher();
    this._wireViewportButtons();
    this._wireFilters();
    this._wireExport();
    this._initViewportClasses();
    this.switchView('view-overview');
  };

  EarthyWorkstation.prototype._api = function () {
    return new global.EarthyAPI();
  };

  EarthyWorkstation.prototype._setStatus = function (msg) {
    var el = document.getElementById('status-bar');
    if (el) el.textContent = msg;
  };

  /* ── Targets ─────────────────────────────────────────────────────────── */
  EarthyWorkstation.prototype._loadTargets = function () {
    var self = this;
    this._api().getTargets(this.state.activePlanet)
      .then(function (data) {
        self.state.targets = data.targets || [];
        self._populateTargetDropdown();
        self._populateMarsCards(self.state.targets);
      })
      .catch(function (e) {
        console.warn('loadTargets failed:', e);
        self._populateTargetDropdown();
      });
  };

  EarthyWorkstation.prototype._populateTargetDropdown = function () {
    var sel = document.getElementById('target-select');
    if (!sel) return;
    sel.innerHTML = '';
    var self = this;
    this.state.targets.forEach(function (t) {
      var opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.name;
      if (t.id === self.state.activeTargetId) opt.selected = true;
      sel.appendChild(opt);
    });
    if (!this.state.targets.length) {
      var defaults = [
        { id: 'jezero_crater', name: 'Jezero Crater' },
        { id: 'gale_crater', name: 'Gale Crater' },
        { id: 'valles_marineris', name: 'Valles Marineris' },
        { id: 'olympus_mons', name: 'Olympus Mons' },
        { id: 'lunar_south_pole', name: 'Lunar South Pole' },
        { id: 'malapert_massif', name: 'Malapert Massif' },
        { id: 'haworth_psr', name: 'Haworth PSR' },
        { id: 'marius_hills', name: 'Marius Hills' }
      ];
      defaults.forEach(function (t) {
        var opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = t.name;
        if (t.id === self.state.activeTargetId) opt.selected = true;
        sel.appendChild(opt);
      });
    }
  };

  EarthyWorkstation.prototype._populateMarsCards = function (targets) {
    var cont = document.getElementById('target-cards-container');
    if (!cont) return;
    cont.innerHTML = '';
    var self = this;
    targets.forEach(function (t) {
      var card = document.createElement('div');
      card.className = 'target-card';
      card.innerHTML =
        '<div class="target-card-body">' +
        '<span class="badge badge-planet">' + (t.body || 'Mars').toUpperCase() + '</span>' +
        '<h4>' + t.name + '</h4>' +
        '<p class="mono text-secondary">' + (t.rationale || '') + '</p>' +
        '</div>';
      card.addEventListener('click', function () {
        self.state.activeTargetId = t.id;
        self.state.activePlanet = (t.body || 'mars').toLowerCase();
        self._updateActiveTargetPill();
        self.switchView('view-discovery');
        self.runAnalysis();
      });
      cont.appendChild(card);
    });
  };

  /* ── View switching ──────────────────────────────────────────────────── */
  EarthyWorkstation.prototype.switchView = function (viewId) {
    document.querySelectorAll('.view-panel').forEach(function (p) {
      p.classList.remove('active');
    });
    var panel = document.getElementById(viewId);
    if (panel) panel.classList.add('active');
    this.state.currentView = viewId;

    document.querySelectorAll('.nav-tab').forEach(function (t) {
      t.classList.toggle('active', t.dataset.view === viewId);
    });

    if (viewId === 'view-discovery' && !this.map2d) {
      this._initViewports();
      if (!this.state.analysisResults) this.runAnalysis();
    }
    if (viewId === 'view-comparison') this.loadComparison();
    if (viewId === 'view-analysis' && this.state.activeCandidate) {
      this.loadScientificAnalysis(this.state.activeCandidate.cell_id);
    }
    if (viewId === 'view-methodology') this.loadMethodology();
  };

  /* ── Planet switcher ─────────────────────────────────────────────────── */
  EarthyWorkstation.prototype.switchPlanet = function (planet) {
    this.state.activePlanet = planet;
    document.querySelectorAll('.planet-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.planet === planet);
    });
    this._updateActiveTargetPill();
    this._loadTargets();
    if (this.globe3d) this.globe3d.setPlanet(planet);
  };

  EarthyWorkstation.prototype._updateActiveTargetPill = function () {
    var pill = document.getElementById('active-target-pill');
    if (!pill) return;
    var t = this.state.targets.find(function (x) { return x.id === this.state.activeTargetId; }, this);
    pill.textContent = t ? t.name : this.state.activeTargetId.replace(/_/g, ' ');
  };

  /* ── Wiring ──────────────────────────────────────────────────────────── */
  EarthyWorkstation.prototype._wireTabs = function () {
    var self = this;
    document.querySelectorAll('.nav-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        self.switchView(tab.dataset.view);
      });
    });

    var ctaBtn = document.getElementById('cta-discovery');
    if (ctaBtn) {
      ctaBtn.addEventListener('click', function () { self.switchView('view-discovery'); });
    }
  };

  EarthyWorkstation.prototype._wirePlanetSwitcher = function () {
    var self = this;
    document.querySelectorAll('.planet-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        self.switchPlanet(btn.dataset.planet);
      });
    });
  };

  EarthyWorkstation.prototype._wireViewportButtons = function () {
    var self = this;
    document.querySelectorAll('.viewport-mode-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        self._switchViewportMode(btn.dataset.mode);
      });
    });
  };

  EarthyWorkstation.prototype._wireFilters = function () {
    var self = this;
    var targetSel = document.getElementById('target-select');
    if (targetSel) {
      targetSel.addEventListener('change', function () {
        self.state.activeTargetId = targetSel.value;
        self._updateActiveTargetPill();
        self._debouncedAnalysis();
      });
    }

    var profileSel = document.getElementById('mission-profile');
    if (profileSel) {
      profileSel.addEventListener('change', function () { self._debouncedAnalysis(); });
    }

    var vetoToggle = document.getElementById('zero-veto-toggle');
    if (vetoToggle) {
      vetoToggle.addEventListener('change', function () { self._debouncedAnalysis(); });
    }

    document.querySelectorAll('.weight-slider').forEach(function (slider) {
      slider.addEventListener('input', function () {
        var labelEl = document.getElementById('label-' + slider.id);
        if (labelEl) labelEl.textContent = parseFloat(slider.value).toFixed(2);
        self._debouncedAnalysis();
      });
    });
  };

  EarthyWorkstation.prototype._wireExport = function () {
    var self = this;
    var exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', function () {
        self.handleExport('geojson');
      });
    }
    document.querySelectorAll('.export-format-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        self.handleExport(btn.dataset.format);
      });
    });
  };

  EarthyWorkstation.prototype._initViewportClasses = function () {
    this._switchViewportMode('2d');
  };

  /* ── Viewports ───────────────────────────────────────────────────────── */
  EarthyWorkstation.prototype._initViewports = function () {
    if (!this.map2d) {
      try { this.map2d = new global.InteractiveMap2D('map2d-canvas'); } catch (e) { console.warn('Map2D init error:', e); }
    }
    if (!this.globe3d) {
      try { this.globe3d = new global.PlanetaryGlobe3D('globe3d-canvas'); } catch (e) { console.warn('Globe3D init error:', e); }
    }
    if (!this.terrain3d) {
      try { this.terrain3d = new global.TerrainMesh3D('terrain3d-canvas'); } catch (e) { console.warn('Terrain3D init error:', e); }
    }
  };

  EarthyWorkstation.prototype._switchViewportMode = function (mode) {
    this._viewportMode = mode;
    var modes = ['2d', 'globe', 'terrain'];
    modes.forEach(function (m) {
      var el = document.getElementById('viewport-' + m);
      if (el) el.style.display = m === mode ? 'block' : 'none';
    });
    document.querySelectorAll('.viewport-mode-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.mode === mode);
    });
    if (mode === 'terrain' && this.state.activeCandidate) {
      this._loadTerrainForCandidate(this.state.activeCandidate);
    }
  };

  EarthyWorkstation.prototype._loadTerrainForCandidate = function (candidate) {
    var self = this;
    var regionId = 'candidate_' + (candidate.cell_id || candidate.region || 'default').toLowerCase().replace(/\s+/g, '_');
    this._api().getTerrain(regionId)
      .then(function (data) {
        if (self.terrain3d && data) self.terrain3d.loadTerrain(data);
      })
      .catch(function (e) { console.warn('getTerrain failed:', e); });
  };

  /* ── Analysis ────────────────────────────────────────────────────────── */
  EarthyWorkstation.prototype._debouncedAnalysis = function () {
    var self = this;
    clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(function () { self.runAnalysis(); }, DEBOUNCE_MS);
  };

  EarthyWorkstation.prototype._buildWeights = function () {
    var weights = {};
    document.querySelectorAll('.weight-slider').forEach(function (s) {
      weights[s.dataset.param] = parseFloat(s.value);
    });
    return weights;
  };

  EarthyWorkstation.prototype.runAnalysis = function () {
    var self = this;
    var profileSel = document.getElementById('mission-profile');
    var vetoToggle = document.getElementById('zero-veto-toggle');
    var topKEl = document.getElementById('top-k');

    var payload = {
      target_id: this.state.activeTargetId,
      top_k: topKEl ? parseInt(topKEl.value, 10) : 10,
      weights: this._buildWeights(),
      hard_constraints: {},
      mission_profile: profileSel ? profileSel.value : 'crewed_base',
      apply_veto: vetoToggle ? vetoToggle.checked : true
    };

    this._setStatus('Running analysis…');
    var loadingEl = document.getElementById('results-loading');
    if (loadingEl) loadingEl.style.display = 'block';

    this._api().analyze(payload)
      .then(function (data) {
        self.state.analysisResults = data;
        self.renderCandidateCards(data.candidates || []);
        if (self.map2d) self.map2d.renderCandidates(data.candidates || []);
        if (self.globe3d) {
          (data.candidates || []).forEach(function (c) {
            self.globe3d.addMarker(c.latitude, c.longitude, c.region, 0xD4A373);
          });
        }
        self._setStatus('Analysis complete — ' + (data.candidates || []).length + ' candidates ranked');
        if (loadingEl) loadingEl.style.display = 'none';
      })
      .catch(function (e) {
        console.warn('analyze failed:', e);
        self._setStatus('Analysis error — check backend connection');
        if (loadingEl) loadingEl.style.display = 'none';
      });
  };

  /* ── Candidate cards ─────────────────────────────────────────────────── */
  EarthyWorkstation.prototype.renderCandidateCards = function (candidates) {
    var container = document.getElementById('results-list');
    if (!container) return;
    container.innerHTML = '';
    var self = this;

    candidates.forEach(function (c) {
      var card = document.createElement('div');
      card.className = 'candidate-card' + (c.veto_triggered ? ' veto' : '');
      var scoreColor = c.analogy_score > 70 ? 'score-high' : c.analogy_score > 45 ? 'score-mid' : 'score-low';
      card.innerHTML =
        '<div class="candidate-header">' +
        '<span class="candidate-rank">#' + c.rank + '</span>' +
        '<span class="candidate-name">' + c.region + '</span>' +
        '<span class="candidate-score ' + scoreColor + '">' + (c.analogy_score || 0).toFixed(1) + '</span>' +
        '</div>' +
        '<div class="candidate-meta mono">' +
        c.country + ' &nbsp;|&nbsp; ' +
        (c.latitude >= 0 ? c.latitude.toFixed(2) + '°N' : Math.abs(c.latitude).toFixed(2) + '°S') + ' ' +
        (c.longitude >= 0 ? c.longitude.toFixed(2) + '°E' : Math.abs(c.longitude).toFixed(2) + '°W') +
        '</div>' +
        '<div class="candidate-bars">' +
        self._miniBar('Analogy', c.analogy_score, '#2D6A4F') +
        self._miniBar('Settlement', c.settlement_score, '#D4A373') +
        '</div>' +
        (c.veto_triggered ? '<div class="veto-label">VETO: ' + (c.veto_reason || '') + '</div>' : '');
      card.addEventListener('click', function () {
        self.selectCandidate(c);
      });
      container.appendChild(card);
    });
  };

  EarthyWorkstation.prototype._miniBar = function (label, value, color) {
    var pct = Math.min(100, Math.max(0, value || 0));
    return '<div class="mini-bar-row">' +
      '<span class="mini-bar-label">' + label + '</span>' +
      '<div class="mini-bar-track"><div class="mini-bar-fill" style="width:' + pct + '%;background:' + color + '"></div></div>' +
      '<span class="mini-bar-val">' + pct.toFixed(0) + '</span>' +
      '</div>';
  };

  /* ── Site inspector ──────────────────────────────────────────────────── */
  EarthyWorkstation.prototype.selectCandidate = function (data) {
    this.state.activeCandidate = data;
    this.renderSiteInspector(data);

    /* toggle compare chips */
    var chip = document.getElementById('chip-' + data.cell_id);
    if (!chip) this._addComparisonChip(data);

    if (this._viewportMode === 'terrain') this._loadTerrainForCandidate(data);

    /* Highlight on map */
    if (this.map2d) {
      var idx = (this.state.analysisResults && this.state.analysisResults.candidates || [])
        .findIndex(function (c) { return c.cell_id === data.cell_id; });
      this.map2d.hoveredIdx = idx;
      this.map2d.draw();
    }
  };

  EarthyWorkstation.prototype.renderSiteInspector = function (candidate) {
    var panel = document.getElementById('site-inspector');
    if (!panel) return;
    var m = candidate.measurements || {};
    panel.innerHTML =
      '<h3 class="inspector-title">' + candidate.region + '</h3>' +
      '<div class="inspector-scores">' +
      '<div class="score-block"><span class="score-label">Analogy</span><span class="score-val score-high">' + (candidate.analogy_score || 0).toFixed(1) + '</span></div>' +
      '<div class="score-block"><span class="score-label">Settlement</span><span class="score-val">' + (candidate.settlement_score || 0).toFixed(1) + '</span></div>' +
      '<div class="score-block"><span class="score-label">Uncertainty</span><span class="score-val">' + (candidate.uncertainty_rating || 'N/A') + '</span></div>' +
      '</div>' +
      '<table class="data-table mono">' +
      '<thead><tr><th>Parameter</th><th>Value</th><th>Unit</th></tr></thead>' +
      '<tbody>' +
      self._inspectorRow('NDVI', m.ndvi, '') +
      self._inspectorRow('Precipitation', m.precipitation_mm_yr, 'mm/yr') +
      self._inspectorRow('Mean Annual Temp', m.mean_annual_temp_c, '°C') +
      self._inspectorRow('Diurnal LST Range', m.diurnal_lst_range_k, 'K') +
      self._inspectorRow('Slope (mean)', m.slope_deg, '°') +
      self._inspectorRow('Roughness', m.roughness_m, 'm') +
      self._inspectorRow('Elevation', m.elevation_m, 'm') +
      self._inspectorRow('Solar Insolation', m.solar_insolation_kwh_m2_day, 'kWh/m²/day') +
      self._inspectorRow('Permafrost Depth', m.permafrost_depth_m, 'm') +
      '</tbody>' +
      '</table>' +
      '<button class="btn btn-secondary" onclick="window.app.loadScientificAnalysis(\'' + candidate.cell_id + '\')">Scientific Analysis →</button>';

    function self(label, val, unit) { return window.app._inspectorRow(label, val, unit); }
  };

  EarthyWorkstation.prototype._inspectorRow = function (label, val, unit) {
    var display = (val !== null && val !== undefined) ? (typeof val === 'number' ? val.toFixed(2) : val) : '—';
    return '<tr><td>' + label + '</td><td>' + display + '</td><td>' + unit + '</td></tr>';
  };

  /* ── Comparison ──────────────────────────────────────────────────────── */
  EarthyWorkstation.prototype._addComparisonChip = function (candidate) {
    var container = document.getElementById('comparison-chips');
    if (!container) return;
    var self = this;
    if (this.state.comparisonCandidates.find(function (c) { return c.cell_id === candidate.cell_id; })) return;
    this.state.comparisonCandidates.push(candidate);
    var chip = document.createElement('span');
    chip.className = 'comparison-chip';
    chip.id = 'chip-' + candidate.cell_id;
    chip.textContent = candidate.region;
    chip.innerHTML += ' <button class="chip-remove" data-id="' + candidate.cell_id + '">&times;</button>';
    chip.querySelector('.chip-remove').addEventListener('click', function (e) {
      e.stopPropagation();
      self.state.comparisonCandidates = self.state.comparisonCandidates.filter(function (c) { return c.cell_id !== candidate.cell_id; });
      chip.remove();
    });
    container.appendChild(chip);
  };

  EarthyWorkstation.prototype.loadComparison = function () {
    var self = this;
    var cids = this.state.comparisonCandidates.map(function (c) { return c.cell_id; });
    if (!cids.length) return;

    this._api().compareMulti(this.state.activeTargetId, cids)
      .then(function (data) {
        if (self.charts && data.radar_axes && data.radar_series) {
          self.charts.renderRadarChart('radar-canvas', data.radar_axes, data.radar_series);
        }
        self._renderComparisonTable(data);
        self._renderWasserstein(data);
      })
      .catch(function (e) { console.warn('compareMulti failed:', e); });
  };

  EarthyWorkstation.prototype._renderComparisonTable = function (data) {
    var tbody = document.getElementById('comparison-tbody');
    if (!tbody || !data.candidates) return;
    tbody.innerHTML = '';
    data.candidates.forEach(function (c) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>' + c.region + '</td>' +
        '<td>' + (c.analogy_score || 0).toFixed(1) + '</td>' +
        '<td>' + (c.settlement_score || 0).toFixed(1) + '</td>' +
        '<td>' + (c.uncertainty_rating || '—') + '</td>';
      tbody.appendChild(tr);
    });
  };

  EarthyWorkstation.prototype._renderWasserstein = function (data) {
    var el = document.getElementById('wasserstein-val');
    if (!el) return;
    var dist = data.statistical_distances && data.statistical_distances.wasserstein_distance;
    el.textContent = dist !== undefined ? dist.toFixed(4) : '—';
  };

  /* ── Scientific Analysis ─────────────────────────────────────────────── */
  EarthyWorkstation.prototype.loadScientificAnalysis = function (cellId) {
    var self = this;
    if (!cellId) return;
    this.switchView('view-analysis');

    this._api().getScientificAnalysis(cellId, this.state.activeTargetId)
      .then(function (data) {
        self._renderScientificAnalysis(data);
      })
      .catch(function (e) { console.warn('getScientificAnalysis failed:', e); });
  };

  EarthyWorkstation.prototype._renderScientificAnalysis = function (data) {
    var sa = data.scientific_analysis || {};
    var questions = [
      { id: 'q1', label: 'Q1: Why Selected', key: 'question_1_why_selected' },
      { id: 'q2', label: 'Q2: Resembling Characteristics', key: 'question_2_resembling_characteristics' },
      { id: 'q3', label: 'Q3: Differing Characteristics', key: 'question_3_differing_characteristics' },
      { id: 'q4', label: 'Q4: Recommended Experiments', key: 'question_4_recommended_experiments' },
      { id: 'q5', label: 'Q5: Analog Limitations', key: 'question_5_analog_limitations' }
    ];
    questions.forEach(function (q) {
      var el = document.getElementById('sa-' + q.id);
      if (el) el.textContent = sa[q.key] || '—';
    });

    var sources = document.getElementById('sa-sources');
    if (sources && sa.traceable_sources) {
      sources.innerHTML = '<ul>' + (sa.traceable_sources.map(function (s) {
        return '<li class="mono">' + s + '</li>';
      }).join('')) + '</ul>';
    }
  };

  /* ── Methodology ─────────────────────────────────────────────────────── */
  EarthyWorkstation.prototype.loadMethodology = function () {
    var self = this;
    this._api().getDatasets()
      .then(function (data) {
        self._renderDatasetsTable(data.datasets || []);
      })
      .catch(function (e) { console.warn('getDatasets failed:', e); });
  };

  EarthyWorkstation.prototype._renderDatasetsTable = function (datasets) {
    var tbody = document.getElementById('datasets-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    datasets.forEach(function (ds) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td class="mono">' + (ds.name || '') + '</td>' +
        '<td>' + (ds.source || '') + '</td>' +
        '<td class="mono">' + (ds.resolution || '') + '</td>' +
        '<td>' + (ds.variables || []).join(', ') + '</td>' +
        '<td><a href="' + (ds.doi || '#') + '" target="_blank" class="mono">' + (ds.doi ? ds.doi.substring(0, 30) + '…' : '—') + '</a></td>';
      tbody.appendChild(tr);
    });
  };

  /* ── Export ──────────────────────────────────────────────────────────── */
  EarthyWorkstation.prototype.handleExport = function (format) {
    if (!this.state.analysisResults) {
      alert('Run an analysis first.');
      return;
    }
    var payload = this.state.analysisResults;
    var api = this._api();
    if (format === 'geojson') api.exportGeoJSON(payload).catch(function (e) { console.warn('export error:', e); });
    else if (format === 'csv') api.exportCSV(payload).catch(function (e) { console.warn('export error:', e); });
    else if (format === 'markdown' || format === 'report') api.exportReport(payload).catch(function (e) { console.warn('export error:', e); });
  };

  global.EarthyWorkstation = EarthyWorkstation;
  global.app = null; /* will be assigned on DOMContentLoaded */
}(window));

# KNOWLEDGE BASE — AGENT 2: BACKEND DEVELOPMENT SPECIALIST

**Agent Role:** Backend Development Specialist  
**Designated Location:** `agents/backend/KB.md`  
**Application:** EARTHY — Earth Analog Research & Exploration Platform  
**Architecture:** Python / Flask Microservice with NumPy and SciPy Geospatial Core  

---

## 1. Backend Architecture & REST Endpoints
- `app.py`: Flask application providing CORS-enabled REST API and serving workstation frontend.
- `core/similarity.py`: Multi-Criteria Decision Analysis (MCDA), Zero-Veto biophysical gating, 1st Wasserstein distance ($W_1$), dual-score calculation, and 5-Question generator.
- `core/dem_engine.py`: Synthetic physically realistic 40×40 elevation matrices, central finite difference slope gradient calculation, RMS roughness, and cross-section transects.
- `core/mobility.py`: Rover trafficability evaluation (GO < 12°, CAUTION 12–20°, NO-GO > 20°).
- `core/provenance.py`: Calibrated dataset catalogue with spatial resolutions, coordinate systems, and DOIs.
- `core/export_service.py`: GeoJSON RFC 7946, CSV RFC 4180, and Markdown research report generators.

---

## 2. API Contracts
- `GET /api/health`
- `GET /api/targets?body=mars|moon`
- `GET /api/targets/<target_id>`
- `GET /api/datasets`
- `POST /api/analyze`
- `GET /api/terrain/<region_id>`
- `POST /api/compare`
- `POST /api/compare-multi`
- `GET /api/scientific-analysis/<cell_id>`
- `POST /api/transect`
- `POST /api/export/geojson`
- `POST /api/export/csv`
- `POST /api/export/report`

---

## 3. Verification & Status
- Python 3.11 test suite 100% passing.
- Zero fabricated data: all calculations grounded in calibrated planetary and terrestrial satellite records.

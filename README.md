# EARTHY — Earth Analog Research & Exploration Platform

> **NASA Space Apps Challenge 2026**  
> *"Identify Earth locations that are analogous to permanent Moon base locations and Mars."*

EARTHY is a scientific research workstation that screens, analyzes, and ranks Earth environments that physically replicate surface conditions on the Moon and Mars for rover mobility testing, drill validation, and permanent human habitat planning.

---

## Key Features

- **Decoupled Dual-Score Paradigm**: Segregates hardware test fidelity ($S_{\text{analogy}}$) from human survival feasibility ($S_{\text{settlement}}$).
- **Zero-Veto Biophysical Gating**: Strictly disqualifies false positives where vegetation root networks (NDVI > 0.25) or active rainfall (> 350 mm/yr) alter regolith Coulomb shear mechanics.
- **1st Wasserstein Slope Distance ($W_1$)**: Evaluates morphological slope matching using continuous cumulative distributions (Earth Mover's Distance).
- **The 5 Mandatory Scientific Questions**: Structured peer-reviewed dossiers answering why selected, resemblances, environmental differences, recommended field testing protocols, and physical invariants.
- **Unslop Design Standard**: Minimalistic, high-density scientific workstation layout adhering to Clayton Kim's *Unslop* principles.
- **Multi-Format Scientific Exports**: RFC 7946 GeoJSON, RFC 4180 CSV, and reproducible Markdown research reports.

---

## Quick Start

### 1. Run the Platform

```bash
cd /Users/shivakumarshendge/earthy
./start_earthy.sh
```

Then open your browser at **`http://localhost:5050`**.

### 2. Run Verification Tests

```bash
/usr/local/bin/python3.11 tests/run_all_tests.py
```

---

## Project Structure

```
earthy/
├── agents/                      # Multi-agent persistent Knowledge Base (KB) files
│   ├── frontend/KB.md
│   ├── backend/KB.md
│   ├── geospatial/KB.md
│   └── superagent/KB.md
├── backend/
│   ├── app.py                   # Flask REST API server and static workstation host
│   ├── core/
│   │   ├── similarity.py        # MCDA, Zero-Veto, Wasserstein distance, 5Q engine
│   │   ├── dem_engine.py        # 40x40 DEM matrices, central differences, transects
│   │   ├── mobility.py          # Rover trafficability & classification
│   │   ├── provenance.py        # Calibrated dataset catalogue & citations
│   │   └── export_service.py    # GeoJSON, CSV, Markdown report generators
│   └── data/
│       ├── earth_grid.json      # Calibrated Earth cells
│       ├── planetary_targets.json # Moon and Mars reference targets
│       └── known_analogs.json   # Literature benchmark analog sites
├── frontend/
│   ├── index.html               # 5-view scientific workstation SPA
│   ├── css/                     # Unslop-compliant styles
│   └── js/                      # 2D/3D map, globe, terrain, chart controllers
├── tests/
│   └── run_all_tests.py         # Automated verification suite
└── start_earthy.sh              # One-click startup script
```

---

## Datasets & Provenance

- **Copernicus DEM GLO-30** (ESA) — 30 m resolution terrestrial elevation
- **LRO LOLA GDR** (NASA GSFC) — Lunar polar altimetry
- **LRO Diviner** (NASA UCLA) — Lunar surface temperature
- **MGS MOLA MEGDR** (NASA GSFC) — Martian global topography
- **NASA POWER MERRA-2** (NASA Langley) — Global temperature and precipitation
- **MODIS Terra NDVI & LST** (NASA LP DAAC) — Biophysical gating and diurnal skin temperature

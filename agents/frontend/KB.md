# KNOWLEDGE BASE — AGENT 1: FRONTEND DEVELOPMENT SPECIALIST

**Agent Role:** Frontend Development Specialist  
**Designated Location:** `agents/frontend/KB.md`  
**Application:** EARTHY — Earth Analog Research & Exploration Platform  
**Design Reference:** Clayton Kim's *Unslop* (https://github.com/theclaymethod/unslop)  

---

## 1. Frontend Architecture
EARTHY is built as a responsive Single-Page Application (SPA) Scientific Workstation.
- **index.html**: Main workstation shell with 5 distinct operational views (Overview, Discovery Engine, Site Comparison, Scientific Analysis, Methodology & Data).
- **CSS Architecture**:
  - `earthy.css`: Design system tokens, typography, buttons, badges, tables, and tab layout adhering to *Unslop* principles.
  - `workstation.css`: Multi-column workstation layout, viewport canvas styling, radar chart containers, and responsive breakpoints.
- **JavaScript Modules**:
  - `api.js`: REST API client for backend communication with error handling and file download triggers.
  - `app.js`: State manager and UI coordinator.
  - `map2d.js`: Canvas-based Plate Carrée global projection.
  - `globe3d.js`: Three.js interactive planetary globe with procedural textures.
  - `terrain3d.js`: Three.js DEM heightfield visualizer with slope-based color ramps.
  - `charts.js`: High-precision canvas radar charts and slope histograms.
  - `comparison3d.js`: Side-by-side terrain comparison view.

---

## 2. Design System & Anti-AI-Slop Decisions
- Palette: `#F8F9F5` base neutral, `#FFFFFF` surfaces, `#1C1E1B` primary mineral charcoal text, `#4A524B` stone grey secondary text, `#2D6A4F` evergreen accent, `#D4A373` sandstone accent, `#0C100E` strictly for 3D dark canvas viewports.
- No gratuitous gradients, pulse glows, or bouncy card animations.
- High density of tabular data, monospaced coordinate tags (`18.38°N, 77.58°E`), and physical units on every metric (`mm/yr`, `K`, `°`, `m`).

---

## 3. Verification & Status
- All views and event listeners tested and operational.
- Static file serving verified on port 5050.

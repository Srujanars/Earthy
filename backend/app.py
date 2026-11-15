"""
EARTHY Scientific Backend Web Server.
Exposes REST API endpoints for geospatial analysis, 3D terrain extraction,
site comparisons, and data provenance. Serves the frontend research workstation.
"""

import os
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory, Response

from core.provenance import list_datasets, get_dataset
from core.dem_engine import (
    calculate_terrain_metrics,
    get_3d_mesh_data,
    extract_elevation_transect,
    _T
)
from core.mobility import evaluate_rover_trafficability
from core.similarity import EarthyScoringEngine
from core.export_service import (
    export_candidates_geojson,
    export_candidates_csv,
    export_research_report
)

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

app = Flask(__name__, static_folder=str(FRONTEND_DIR), static_url_path="")
scoring_engine = EarthyScoringEngine()

# Enable CORS headers for development flexibility
@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    return response

# ----------------- STATIC WORKSPACE ROUTES -----------------

@app.route("/")
def index():
    return send_from_directory(str(FRONTEND_DIR), "index.html")

@app.route("/<path:path>")
def static_proxy(path):
    file_path = FRONTEND_DIR / path
    if file_path.exists():
        return send_from_directory(str(FRONTEND_DIR), path)
    return send_from_directory(str(FRONTEND_DIR), "index.html")

# ----------------- SCIENTIFIC API ENDPOINTS -----------------

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "EARTHY Planetary Analog Research Platform",
        "version": "1.0.0",
        "grid_cells_loaded": len(scoring_engine.earth_grid),
        "planetary_targets_loaded": len(scoring_engine.targets_db),
        "calibrated_dem_terrains": len(_T)
    })

@app.route("/api/targets", methods=["GET"])
def get_targets():
    """Returns list of off-world planetary targets (Moon, Mars)."""
    body_filter = request.args.get("body")
    targets = scoring_engine.list_targets()
    if body_filter:
        targets = [t for t in targets if t.get("body", "").lower() == body_filter.lower()]
    return jsonify({"targets": targets})

@app.route("/api/targets/<target_id>", methods=["GET"])
def get_target_detail(target_id):
    """Returns comprehensive target profile and baseline criteria."""
    target = scoring_engine.get_target(target_id)
    if not target:
        return jsonify({"error": f"Target {target_id} not found."}), 404
    return jsonify({"target": target})

@app.route("/api/datasets", methods=["GET"])
def get_datasets():
    """Returns catalogue of scientific datasets with complete provenance and licensing."""
    return jsonify({"datasets": list_datasets()})

@app.route("/api/analyze", methods=["POST"])
def run_analysis():
    """
    Executes planetary analog screening across global terrestrial cells.
    Applies configurable weights, zero-veto constraints, and mission profiles.
    """
    payload = request.get_json(force=True, silent=True) or {}
    target_id = payload.get("target_id", "jezero_crater")
    user_weights = payload.get("weights")
    hard_constraints = payload.get("hard_constraints")
    country_filter = payload.get("country_filter")
    mission_profile = payload.get("mission_profile", "rover_mobility")
    top_k = int(payload.get("top_k", 15))

    try:
        results = scoring_engine.rank_global_candidates(
            target_id=target_id,
            top_k=top_k,
            user_weights=user_weights,
            hard_constraints=hard_constraints,
            country_filter=country_filter,
            mission_profile=mission_profile
        )
        return jsonify(results)
    except KeyError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500

@app.route("/api/terrain/<region_id>", methods=["GET"])
def get_terrain(region_id):
    """
    Returns 3D DEM mesh vertices, slope matrix, RMS roughness, and rover mobility.
    """
    try:
        mesh_data = get_3d_mesh_data(region_id)
        mobility_data = evaluate_rover_trafficability(region_id)
        mesh_data["mobility"] = mobility_data
        metrics_data = calculate_terrain_metrics(region_id)
        mesh_data["metrics"] = metrics_data
        return jsonify(mesh_data)
    except KeyError:
        return jsonify({"error": f"Terrain region {region_id} not found."}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/compare", methods=["POST"])
def compare_sites():
    """
    Computes rigorous statistical distance (Wasserstein distance on slope distributions,
    Kolmogorov-Smirnov test, and resolution discrepancy analysis).
    """
    payload = request.get_json(force=True, silent=True) or {}
    target_region_id = payload.get("target_region_id") or payload.get("target_id", "target_jezero")
    candidate_region_id = payload.get("candidate_region_id") or payload.get("candidate_id", "candidate_atacama")

    if not target_region_id.startswith("target_"):
        target_region_id = f"target_{target_region_id}"
    if not candidate_region_id.startswith("candidate_"):
        candidate_region_id = f"candidate_{candidate_region_id}"

    try:
        comparison = scoring_engine.compute_distribution_comparison(
            target_region_id=target_region_id,
            candidate_region_id=candidate_region_id
        )
        return jsonify(comparison)
    except KeyError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": f"Comparison failed: {str(e)}"}), 500

@app.route("/api/compare-multi", methods=["POST"])
def compare_multi_sites():
    """
    Computes comparative multi-attribute analysis across 2 to 4 candidates
    against a chosen planetary reference target.
    """
    payload = request.get_json(force=True, silent=True) or {}
    target_id = payload.get("target_id", "jezero_crater")
    candidate_ids = payload.get("candidate_ids", [])

    if not candidate_ids:
        try:
            top_ranked = scoring_engine.rank_global_candidates(target_id=target_id, top_k=3)
            candidate_ids = [c["cell_id"] for c in top_ranked["candidates"][:3]]
        except Exception:
            candidate_ids = []

    try:
        comparison = scoring_engine.compare_multiple_candidates(
            target_id=target_id,
            candidate_ids=candidate_ids
        )
        return jsonify(comparison)
    except KeyError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Multi-site comparison failed: {str(e)}"}), 500

@app.route("/api/scientific-analysis/<cell_id>", methods=["GET", "POST"])
def get_scientific_analysis(cell_id):
    """
    Returns dedicated 5-question scientific analysis for a specific Earth cell.
    """
    target_id = request.args.get("target_id")
    if not target_id and request.is_json:
        payload = request.get_json(silent=True) or {}
        target_id = payload.get("target_id")
    if not target_id:
        target_id = "jezero_crater"

    target = scoring_engine.get_target(target_id)
    if not target:
        return jsonify({"error": f"Target {target_id} not found."}), 404

    cell = next((c for c in scoring_engine.earth_grid if str(c.get("cell_id")) == str(cell_id)), None)
    if not cell:
        return jsonify({"error": f"Cell {cell_id} not found."}), 404

    scored = scoring_engine.score_single_cell(cell, target)
    analysis = scoring_engine.generate_scientific_analysis(cell, target, scored)
    return jsonify({
        "cell": scored,
        "scientific_analysis": analysis
    })

@app.route("/api/transect", methods=["POST"])
def get_transect():
    """
    Extracts an elevation cross-section line across a 3D DEM mesh.
    """
    payload = request.get_json(force=True, silent=True) or {}
    region_id = payload.get("region_id", "target_jezero")
    samples = int(payload.get("n_samples") or payload.get("num_samples", 40))

    try:
        profile = extract_elevation_transect(region_id, n_samples=samples)
        return jsonify(profile)
    except KeyError:
        return jsonify({"error": f"Terrain {region_id} not found."}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/export/geojson", methods=["POST"])
def export_geojson():
    payload = request.get_json(force=True, silent=True) or {}
    geojson_str = export_candidates_geojson(payload)
    return Response(
        geojson_str,
        mimetype="application/geo+json",
        headers={"Content-Disposition": "attachment; filename=earthy_candidates.geojson"}
    )

@app.route("/api/export/csv", methods=["POST"])
def export_csv():
    payload = request.get_json(force=True, silent=True) or {}
    csv_str = export_candidates_csv(payload)
    return Response(
        csv_str,
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=earthy_candidates.csv"}
    )

@app.route("/api/export/report", methods=["POST"])
def export_report():
    payload = request.get_json(force=True, silent=True) or {}
    report_md = export_research_report(payload)
    return Response(
        report_md,
        mimetype="text/markdown",
        headers={"Content-Disposition": "attachment; filename=earthy_research_report.md"}
    )

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5050))
    print(f"Starting EARTHY Scientific Research Platform on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)

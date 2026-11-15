"""
EARTHY Export Service.
Generates reproducible GeoJSON feature collections, CSV analytical spreadsheets,
and publication-ready scientific comparison summaries.
"""

import csv
import io
import json
from datetime import datetime
from typing import Dict, Any, List

def export_candidates_geojson(analysis_result: Dict[str, Any]) -> str:
    """
    Exports candidates from an analysis run as a valid GeoJSON FeatureCollection.
    Includes coordinates, metadata, similarity scores, and parameter metrics.
    """
    target = analysis_result.get("target", {})
    candidates = analysis_result.get("candidates", [])

    features = []
    for rank, c in enumerate(candidates, 1):
        props = {
            "rank": rank,
            "region": c.get("region"),
            "country": c.get("country"),
            "similarity_score": c.get("score"),
            "analogy_score": c.get("analogy_score"),
            "settlement_score": c.get("settlement_score"),
            "data_coverage_pct": c.get("data_coverage_pct"),
            "uncertainty_rating": c.get("uncertainty_rating"),
            "is_known_analog": c.get("is_known_analog"),
            "target_body": target.get("body"),
            "target_reference": target.get("name"),
            "measurements": c.get("measurements", {}),
            "veto_triggered": c.get("veto_triggered"),
            "veto_reason": c.get("veto_reason")
        }
        geom = {
            "type": "Point",
            "coordinates": [c.get("longitude"), c.get("latitude")]
        }
        features.append({
            "type": "Feature",
            "geometry": geom,
            "properties": props
        })

    geojson = {
        "type": "FeatureCollection",
        "metadata": {
            "platform": "EARTHY - Earth Analog Research & Exploration Platform",
            "generated_utc": datetime.utcnow().isoformat() + "Z",
            "target_body": target.get("body"),
            "target_id": target.get("id"),
            "target_name": target.get("name"),
            "mission_profile": analysis_result.get("mission_profile", "rover_mobility")
        },
        "features": features
    }
    return json.dumps(geojson, indent=2)


def export_candidates_csv(analysis_result: Dict[str, Any]) -> str:
    """
    Exports candidates as an RFC 4180 compliant CSV table.
    """
    candidates = analysis_result.get("candidates", [])

    output = io.StringIO()
    writer = csv.writer(output)

    headers = [
        "Rank", "Region", "Country", "Latitude", "Longitude",
        "Similarity Score (0-100)", "Settlement Score", "Uncertainty",
        "NDVI", "Precipitation (mm/yr)", "Slope (deg)", "Roughness (m)",
        "Mean Annual Temp (C)", "Annual Temp Range (K)", "Diurnal LST Range (K)",
        "Elevation (m)", "Solar Insolation (kWh/m2/day)", "Permafrost Depth (m)",
        "Water Proxy Score", "Geological Context"
    ]
    writer.writerow(headers)

    for rank, c in enumerate(candidates, 1):
        m = c.get("measurements", {})
        row = [
            rank,
            c.get("region", ""),
            c.get("country", ""),
            c.get("latitude", ""),
            c.get("longitude", ""),
            c.get("score", ""),
            c.get("settlement_score", ""),
            c.get("uncertainty_rating", ""),
            m.get("vegetation_ndvi", ""),
            m.get("precipitation_mm_yr", ""),
            m.get("slope_deg", ""),
            m.get("roughness_m", ""),
            m.get("mean_annual_temp_c", ""),
            m.get("annual_temp_range_k", ""),
            m.get("diurnal_lst_range_k", ""),
            m.get("elevation_m", ""),
            c.get("solar_insolation_kwh_m2_day", ""),
            c.get("permafrost_depth_m", ""),
            c.get("water_proxy_score", ""),
            c.get("geological_context", "")
        ]
        writer.writerow(row)

    return output.getvalue()


def export_research_report(analysis_result: Dict[str, Any]) -> str:
    """
    Generates a publication-ready Markdown research report summarizing the findings.
    """
    target = analysis_result.get("target", {})
    candidates = analysis_result.get("candidates", [])
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

    lines = [
        "# EARTHY — Terrestrial Planetary Analog Investigation Report",
        f"**Generated:** {now_str}  ",
        "**Platform:** EARTHY v1.0 (Earth Analog Research & Exploration Platform)  ",
        "",
        "## 1. Study Objective & Parameters",
        f"- **Target Body:** {target.get('body', 'Off-World')}  ",
        f"- **Reference Target:** {target.get('name', 'Reference Target')}  ",
        f"- **Coordinates:** {target.get('latitude', 0)}°N, {target.get('longitude', 0)}°E  ",
        f"- **Literature Source:** {target.get('source_label', 'NASA/ESA Archive')} ({target.get('source_url', '')})  ",
        f"- **Mission Profile:** {analysis_result.get('mission_profile', 'rover_mobility')}  ",
        f"- **Candidate Locations Evaluated:** {analysis_result.get('total_cells_evaluated', len(candidates))}  ",
        "",
        "## 2. Top Ranked Terrestrial Analogs",
        "",
        "| Rank | Region | Country | Analogy Score | Settlement Score | Uncertainty | Primary Terrain Feature |",
        "|:---:|:---|:---|:---:|:---:|:---:|:---|"
    ]

    for rank, c in enumerate(candidates[:10], 1):
        m = c.get("measurements", {})
        lines.append(
            f"| {rank} | {c.get('region', '')} | {c.get('country', '')} | "
            f"{c.get('analogy_score', 0):.1f} | {c.get('settlement_score', 0):.1f} | "
            f"{c.get('uncertainty_rating', 'LOW')} | Slope: {m.get('slope_deg', 0):.1f}°, Precip: {m.get('precipitation_mm_yr', 0):.1f} mm/yr |"
        )

    lines.extend([
        "",
        "## 3. Methodology & Zero-Veto Biophysical Gating",
        "EARTHY screens global terrestrial environments using Multi-Criteria Decision Analysis (MCDA).",
        "To prevent misleading false positives, two strict Zero-Veto gates are enforced:",
        "1. **Vegetation Root Veto:** NDVI > 0.25 disqualifies a cell (Score = 0.0) because root networks artificially reinforce soil shear strength.",
        "2. **Precipitation Veto:** Annual precipitation > 350 mm/yr disqualifies a cell because active fluvial erosion invalidates modern lunar and Martian regolith mechanics.",
        "",
        "## 4. Fundamental Limitations & Non-Reproducible Invariants",
        "- **Gravity:** Earth's 1.00g surface gravity creates conservative motor torque and wheel sinkage over-estimates.",
        "- **Atmosphere:** Earth's dense atmosphere precludes true vacuum and radiative thermal soaking.",
        "- **Sterility:** Terrestrial deserts harbor endolithic microbes; absolute planetary protection sterility cannot be simulated outdoors.",
        "",
        "---",
        "*Report generated automatically by the EARTHY Multi-Agent Exploration Platform.*"
    ])

    return "\n".join(lines)

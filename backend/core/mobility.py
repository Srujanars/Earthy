"""
EARTHY – Rover Mobility / Trafficability Evaluator
Classifies terrain cells into GO / CAUTION / NO-GO zones using slope data
derived from the DEM engine.
"""

from __future__ import annotations
import numpy as np
from core.dem_engine import _make_elevation, _slopes_from_elevation, _T

# Thresholds (degrees)
SLOPE_GO = 12.0
SLOPE_CAUTION = 20.0


def evaluate_rover_trafficability(region_id: str,
                                   cell_size_m: float = 30.0) -> dict:
    """
    Evaluate rover trafficability for a terrain region.

    Parameters
    ----------
    region_id : str
        Must be a key present in dem_engine.REFERENCE_TERRAINS.
    cell_size_m : float
        DEM cell size in metres (used for slope calculation).

    Returns
    -------
    dict
        {
          region_id, description,
          overall_class,          # 'GO' | 'CAUTION' | 'NO-GO'
          mean_slope_deg,
          max_slope_deg,
          pct_go, pct_caution, pct_nogo,
          slope_histogram,        # {bins: [...], counts: [...]}
          trafficability_map,     # 40×40 list-of-lists  0=GO,1=CAUTION,2=NO-GO
          recommendation
        }
    """
    if region_id not in _T:
        raise KeyError(f"Unknown region_id: '{region_id}'. "
                       f"Valid ids: {sorted(_T.keys())}")

    params = _T[region_id]
    elev = _make_elevation(params)
    slopes = _slopes_from_elevation(elev, cell_size_m)

    # Classify every cell
    tmap = np.zeros(slopes.shape, dtype=np.int8)
    tmap[slopes >= SLOPE_GO] = 1       # CAUTION
    tmap[slopes >= SLOPE_CAUTION] = 2  # NO-GO

    n_cells = slopes.size
    pct_go = float((tmap == 0).sum() / n_cells * 100)
    pct_caution = float((tmap == 1).sum() / n_cells * 100)
    pct_nogo = float((tmap == 2).sum() / n_cells * 100)

    mean_slope = float(slopes.mean())
    max_slope = float(slopes.max())

    # Overall classification driven by mean slope
    if mean_slope < SLOPE_GO:
        overall_class = "GO"
    elif mean_slope < SLOPE_CAUTION:
        overall_class = "CAUTION"
    else:
        overall_class = "NO-GO"

    # Slope histogram (10 bins, 0–45 °)
    counts, bin_edges = np.histogram(slopes, bins=10, range=(0, 45))
    bins_mid = [round(float((bin_edges[i] + bin_edges[i + 1]) / 2), 1)
                for i in range(len(counts))]

    # Recommendation text
    recommendations = {
        "GO": (
            "Terrain is suitable for standard rover traversal. "
            "Mean slope is below the 12° mobility threshold."
        ),
        "CAUTION": (
            "Terrain requires careful path planning. "
            "Significant fraction of cells exceed 12° slope threshold; "
            "prefer ridge routes and avoid steep scarps."
        ),
        "NO-GO": (
            "Terrain is largely impassable by conventional wheeled rovers. "
            "Steep slopes (>20°) dominate; consider aerial or legged platforms."
        ),
    }

    return {
        "region_id": region_id,
        "description": params["description"],
        "overall_class": overall_class,
        "mean_slope_deg": round(mean_slope, 2),
        "max_slope_deg": round(max_slope, 2),
        "pct_go": round(pct_go, 1),
        "pct_caution": round(pct_caution, 1),
        "pct_nogo": round(pct_nogo, 1),
        "slope_histogram": {
            "bins": bins_mid,
            "counts": counts.tolist(),
        },
        "trafficability_map": tmap.tolist(),
        "recommendation": recommendations[overall_class],
    }

"""
EARTHY – DEM / Terrain Engine
Generates synthetic but physically realistic 40×40 elevation matrices for
planetary targets and Earth candidate regions, then exposes 3-D mesh data,
terrain metrics, and elevation transects.
"""

import numpy as np

# ---------------------------------------------------------------------------
# Terrain parameter definitions per region
# ---------------------------------------------------------------------------
_T = {
    # ── Planetary targets ───────────────────────────────────────────────────
    "target_jezero": {
        "base_elev": -2600, "relief": 180, "roughness": 0.4,
        "feature": "delta",   # fan-shaped delta lobe
        "description": "Jezero Crater delta – layered lacustrine sediments"
    },
    "target_gale": {
        "base_elev": -4500, "relief": 250, "roughness": 0.5,
        "feature": "mound",
        "description": "Gale Crater – Mt. Sharp central mound stratigraphy"
    },
    "target_valles": {
        "base_elev": -7000, "relief": 2000, "roughness": 1.5,
        "feature": "canyon",
        "description": "Valles Marineris – deep canyon walls and talus"
    },
    "target_olympus": {
        "base_elev": 22000, "relief": 500, "roughness": 0.3,
        "feature": "shield",
        "description": "Olympus Mons caldera rim – gentle shield slopes"
    },
    "target_lunar_south_pole": {
        "base_elev": -6000, "relief": 1200, "roughness": 0.6,
        "feature": "crater",
        "description": "Lunar South Pole – rugged PSR crater terrain"
    },
    "target_malapert": {
        "base_elev": 5000, "relief": 800, "roughness": 1.0,
        "feature": "massif",
        "description": "Malapert Massif – near-polar highland ridgeline"
    },
    "target_haworth": {
        "base_elev": -4500, "relief": 400, "roughness": 0.5,
        "feature": "psr_crater",
        "description": "Haworth PSR – flat-floored permanently shadowed crater"
    },
    "target_marius": {
        "base_elev": 1800, "relief": 300, "roughness": 0.8,
        "feature": "domes",
        "description": "Marius Hills – volcanic dome field with lava tube pits"
    },
    # ── Earth candidate regions ─────────────────────────────────────────────
    "candidate_atacama": {
        "base_elev": 2400, "relief": 120, "roughness": 0.18,
        "feature": "flat_basin",
        "description": "Atacama Yungay – hyperarid alluvial basin"
    },
    "candidate_antarctic": {
        "base_elev": 3233, "relief": 60, "roughness": 0.08,
        "feature": "ice_sheet",
        "description": "Antarctic Dome C – near-featureless polar ice sheet"
    },
    "candidate_svalbard": {
        "base_elev": 920, "relief": 350, "roughness": 0.45,
        "feature": "fjord_valley",
        "description": "Svalbard Spitsbergen – glacially carved fjord plateau"
    },
    "candidate_devon": {
        "base_elev": 150, "relief": 200, "roughness": 0.60,
        "feature": "impact_crater",
        "description": "Devon Island Haughton – ancient impact crater floor"
    },
    "candidate_mojave": {
        "base_elev": 790, "relief": 90, "roughness": 0.22,
        "feature": "dune_field",
        "description": "Mojave Kelso – aeolian dune field on alluvial fan"
    },
    "candidate_iceland": {
        "base_elev": 1100, "relief": 280, "roughness": 0.90,
        "feature": "lava_field",
        "description": "Askja caldera – fresh aa and pahoehoe lava fields"
    },
    "candidate_sahara": {
        "base_elev": 350, "relief": 50, "roughness": 0.12,
        "feature": "reg_plain",
        "description": "Sahara Tanezrouft – flat rocky reg desert plain"
    },
}

REFERENCE_TERRAINS = _T  # public alias


def _make_elevation(params: dict, seed: int = 42) -> np.ndarray:
    """Return a 40×40 elevation matrix (metres) for the given terrain params."""
    rng = np.random.default_rng(seed)
    n = 40
    base = params["base_elev"]
    relief = params["relief"]
    roughness = params["roughness"]
    feature = params.get("feature", "flat_basin")

    # ── Smooth background via sum of large-scale sine waves ────────────────
    x = np.linspace(0, 2 * np.pi, n)
    y = np.linspace(0, 2 * np.pi, n)
    XX, YY = np.meshgrid(x, y)

    elev = (np.sin(XX * 1.3 + 0.4) * 0.4 +
            np.cos(YY * 0.9 - 0.3) * 0.3 +
            np.sin((XX + YY) * 0.6) * 0.3)
    elev = elev / elev.std() * (relief * 0.4)

    # ── Feature-specific overlay ────────────────────────────────────────────
    cx, cy = n // 2, n // 2
    r = np.sqrt((np.arange(n)[:, None] - cx) ** 2 +
                (np.arange(n)[None, :] - cy) ** 2)

    if feature == "crater" or feature == "psr_crater" or feature == "impact_crater":
        rim = np.clip(1.0 - r / 12, 0, 1) * relief * 0.6
        bowl = np.clip(r / 10 - 1, 0, 1) * (-relief * 0.4)
        elev += rim + bowl

    elif feature == "mound":
        elev += np.exp(-r ** 2 / (2 * 8 ** 2)) * relief * 0.8

    elif feature == "canyon":
        canyon_mask = np.abs(np.arange(n) - cy)[None, :] < 5
        elev -= np.where(canyon_mask, relief * 0.9, 0)

    elif feature == "shield":
        elev += np.exp(-r ** 2 / (2 * 15 ** 2)) * relief * 0.5

    elif feature == "delta":
        # Fan lobe in the lower-left quadrant
        angle = np.arctan2(np.arange(n)[:, None] - cy,
                           np.arange(n)[None, :] - cx)
        fan = np.where((angle > -1.2) & (angle < 0.2), 1.0, 0.0)
        elev += fan * np.exp(-r / 12) * relief * 0.5

    elif feature == "domes":
        for dx, dy in [(-8, -8), (8, -6), (0, 10), (-5, 6), (7, 5)]:
            rd = np.sqrt((np.arange(n)[:, None] - (cx + dx)) ** 2 +
                         (np.arange(n)[None, :] - (cy + dy)) ** 2)
            elev += np.exp(-rd ** 2 / (2 * 4 ** 2)) * relief * 0.3

    elif feature == "dune_field":
        elev += np.sin(XX * 3.5) * relief * 0.2 + np.sin(YY * 2.8) * relief * 0.15

    elif feature == "lava_field":
        elev += (rng.uniform(-1, 1, (n, n)) * roughness * 60 +
                 np.sin(XX * 4) * relief * 0.15)

    elif feature == "massif":
        ridge = np.exp(-((np.arange(n)[:, None] - 10) ** 2) / 25) * relief * 0.7
        elev += ridge

    # ── High-frequency roughness noise ─────────────────────────────────────
    noise = rng.standard_normal((n, n)) * roughness * 20
    elev += noise

    return (base + elev).astype(np.float32)


def _slopes_from_elevation(elev: np.ndarray, cell_size_m: float = 30.0) -> np.ndarray:
    """Compute per-cell slope in degrees from a 2-D elevation array."""
    dy, dx = np.gradient(elev, cell_size_m)
    slope = np.degrees(np.arctan(np.sqrt(dx ** 2 + dy ** 2)))
    return slope.astype(np.float32)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_3d_mesh_data(region_id: str) -> dict:
    """
    Return mesh data for a region suitable for Three.js PlaneGeometry.

    Returns
    -------
    dict with keys:
        region_id, description, elevation_matrix (list[list[float]]),
        x_size, y_size, cell_size_m, min_elev, max_elev, mean_elev
    """
    if region_id not in _T:
        raise KeyError(f"Unknown region_id: {region_id!r}. "
                       f"Valid ids: {sorted(_T)}")

    params = _T[region_id]
    elev = _make_elevation(params)
    slopes = _slopes_from_elevation(elev)

    return {
        "region_id": region_id,
        "description": params["description"],
        "elevation_matrix": elev.tolist(),
        "slope_matrix": slopes.tolist(),
        "x_size": 40,
        "y_size": 40,
        "cell_size_m": 30.0,
        "min_elev": float(elev.min()),
        "max_elev": float(elev.max()),
        "mean_elev": float(elev.mean()),
        "std_elev": float(elev.std()),
    }


def calculate_terrain_metrics(region_id: str) -> dict:
    """
    Compute summary terrain metrics for a region.

    Returns
    -------
    dict with slope statistics, roughness index, and trafficability class.
    """
    if region_id not in _T:
        raise KeyError(f"Unknown region_id: {region_id!r}")

    params = _T[region_id]
    elev = _make_elevation(params)
    slopes = _slopes_from_elevation(elev)

    mean_slope = float(slopes.mean())
    max_slope = float(slopes.max())
    pct_go = float((slopes < 12).mean() * 100)
    pct_caution = float(((slopes >= 12) & (slopes < 20)).mean() * 100)
    pct_nogo = float((slopes >= 20).mean() * 100)

    # Roughness as std-dev of residuals after mean-filter
    from scipy.ndimage import uniform_filter
    smoothed = uniform_filter(elev, size=5)
    roughness_index = float(np.std(elev - smoothed))

    return {
        "region_id": region_id,
        "mean_slope_deg": round(mean_slope, 2),
        "max_slope_deg": round(max_slope, 2),
        "roughness_index_m": round(roughness_index, 3),
        "pct_go_zone": round(pct_go, 1),
        "pct_caution_zone": round(pct_caution, 1),
        "pct_nogo_zone": round(pct_nogo, 1),
        "elevation_min_m": round(float(elev.min()), 1),
        "elevation_max_m": round(float(elev.max()), 1),
        "elevation_mean_m": round(float(elev.mean()), 1),
        "elevation_std_m": round(float(elev.std()), 1),
    }


def extract_elevation_transect(region_id: str,
                                n_samples: int = 40,
                                cell_size_m: float = 30.0) -> dict:
    """
    Extract a diagonal elevation transect across the region.

    Parameters
    ----------
    region_id : str
        One of the keys in REFERENCE_TERRAINS.
    n_samples : int
        Number of sample points along the transect.
    cell_size_m : float
        Ground sampling distance in metres.

    Returns
    -------
    dict with keys: region_id, samples (list of {distance_m, elevation_m, slope_deg}),
                    total_distance_m.
    """
    if region_id not in _T:
        raise KeyError(f"Unknown region_id: {region_id!r}")

    params = _T[region_id]
    elev = _make_elevation(params)
    slopes = _slopes_from_elevation(elev, cell_size_m)

    n = elev.shape[0]
    indices = np.linspace(0, n - 1, n_samples, dtype=int)
    diagonal = np.clip(indices, 0, n - 1)

    samples = []
    for i, idx in enumerate(diagonal):
        samples.append({
            "distance_m": round(float(i * cell_size_m * np.sqrt(2)), 1),
            "elevation_m": round(float(elev[idx, idx]), 1),
            "slope_deg": round(float(slopes[idx, idx]), 2),
        })

    return {
        "region_id": region_id,
        "samples": samples,
        "total_distance_m": round(float((n_samples - 1) * cell_size_m * np.sqrt(2)), 1),
    }

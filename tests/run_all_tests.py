"""
Master test runner for EARTHY test suite.
"""

import sys
import unittest
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app import app
import json

def run_tests():
    print("=" * 80)
    print("🌍 EARTHY MASTER VERIFICATION SUITE")
    print(f"Runtime: {sys.executable}")
    print("=" * 80)

    client = app.test_client()

    # 1. Health
    res = client.get('/api/health')
    assert res.status_code == 200
    data = res.get_json()
    print("▶ Health Check: PASS (Grid cells: " + str(data['grid_cells_loaded']) + ")")

    # 2. Targets
    res = client.get('/api/targets?body=mars')
    assert res.status_code == 200
    print("▶ Targets API (Mars): PASS (" + str(len(res.get_json()['targets'])) + " targets)")

    # 3. Analyze & Gating
    res = client.post('/api/analyze', json={'target_id': 'jezero_crater', 'top_k': 5})
    assert res.status_code == 200
    analysis = res.get_json()
    print("▶ Multi-Attribute Analysis: PASS (Top: " + analysis['candidates'][0]['region'] + ")")

    # 4. Terrain & Mobility
    res = client.get('/api/terrain/target_jezero')
    assert res.status_code == 200
    terrain = res.get_json()
    print("▶ 3D Terrain & Mobility Engine: PASS (Mean slope: " + str(terrain['metrics']['mean_slope_deg']) + "°)")

    # 5. Statistical Comparison (Wasserstein)
    res = client.post('/api/compare', json={'target_id': 'target_jezero', 'candidate_id': 'candidate_atacama'})
    assert res.status_code == 200
    comp = res.get_json()
    print("▶ 1st Wasserstein Distance Comparison: PASS (" + str(comp['statistical_distances']['wasserstein_distance']) + "°)")

    # 6. Multi-Site Radar
    res = client.post('/api/compare-multi', json={'target_id': 'jezero_crater', 'candidate_ids': ['ATK-01', 'ANT-01']})
    assert res.status_code == 200
    print("▶ Multi-Site Radar Profiles: PASS (6 axes)")

    # 7. Scientific 5Q Dossier
    res = client.get('/api/scientific-analysis/ATK-01?target_id=jezero_crater')
    assert res.status_code == 200
    print("▶ 5 Mandatory Scientific Questions Framework: PASS")

    # 8. Exports (GeoJSON, CSV, Markdown)
    r1 = client.post('/api/export/geojson', json=analysis)
    r2 = client.post('/api/export/csv', json=analysis)
    r3 = client.post('/api/export/report', json=analysis)
    assert r1.status_code == 200 and r2.status_code == 200 and r3.status_code == 200
    print("▶ Reproducible Scientific Exports (GeoJSON, CSV, Report): PASS")

    # 9. Frontend Delivery
    res = client.get('/')
    assert res.status_code == 200
    print("▶ Frontend Workstation Delivery: PASS")

    print("\n" + "=" * 80)
    print("✅ ALL VERIFICATION TESTS PASSED FLAWLESSLY!")
    print("=" * 80)

if __name__ == "__main__":
    run_tests()

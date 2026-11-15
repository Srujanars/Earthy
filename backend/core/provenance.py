"""
EARTHY – Provenance / Dataset catalogue
Lists the 9 calibrated source datasets used by the platform.
"""

DATASETS = [
    {
        "id": "copernicus_glo30",
        "name": "Copernicus GLO-30",
        "type": "DEM",
        "resolution_m": 30,
        "coverage": "Global",
        "description": "Copernicus Digital Elevation Model at 30 m posting derived from TanDEM-X data.",
        "parameters": ["elevation_m", "slope_deg", "roughness_m"],
        "source_url": "https://spacedata.copernicus.eu/collections/copernicus-digital-elevation-model",
        "citation": "ESA (2021). Copernicus DEM – Global and European Digital Elevation Model. European Space Agency."
    },
    {
        "id": "lro_lola",
        "name": "LRO LOLA",
        "type": "DEM",
        "resolution_m": 118,
        "coverage": "Moon",
        "description": "Lunar Reconnaissance Orbiter Lunar Orbiter Laser Altimeter – global 118 m lunar DEM.",
        "parameters": ["slope_deg", "roughness_m", "elevation_m"],
        "source_url": "https://pds.lroc.asu.edu/data/LRO-L-LOLA-3-RDR-V1.0/",
        "citation": "Smith et al. (2010). Initial observations from the Lunar Orbiter Laser Altimeter (LOLA). GRL."
    },
    {
        "id": "lro_diviner",
        "name": "LRO Diviner",
        "type": "Thermal",
        "resolution_m": 500,
        "coverage": "Moon",
        "description": "Lunar Reconnaissance Orbiter Diviner Lunar Radiometer Experiment – surface thermal data.",
        "parameters": ["lst_diurnal_range_k", "mean_annual_temp_c"],
        "source_url": "https://pds-geosciences.wustl.edu/missions/lro/diviner.htm",
        "citation": "Paige et al. (2010). The Lunar Reconnaissance Orbiter Diviner Lunar Radiometer Experiment. Space Sci. Rev."
    },
    {
        "id": "mgs_mola",
        "name": "MGS MOLA",
        "type": "DEM",
        "resolution_m": 463,
        "coverage": "Mars",
        "description": "Mars Global Surveyor Mars Orbiter Laser Altimeter – global 463 m Mars DEM.",
        "parameters": ["slope_deg", "roughness_m", "elevation_m"],
        "source_url": "https://pds-geosciences.wustl.edu/missions/mgs/mola.html",
        "citation": "Smith et al. (2001). Mars Orbiter Laser Altimeter: Experiment summary after the first year of global mapping. JGR."
    },
    {
        "id": "mro_hirise",
        "name": "MRO HiRISE",
        "type": "Imagery/DEM",
        "resolution_m": 0.25,
        "coverage": "Mars (selected sites)",
        "description": "Mars Reconnaissance Orbiter High Resolution Imaging Science Experiment – 25 cm/pixel imagery and DTMs.",
        "parameters": ["roughness_m", "slope_deg"],
        "source_url": "https://www.uahirise.org/",
        "citation": "McEwen et al. (2007). Mars Reconnaissance Orbiter's High Resolution Imaging Science Experiment (HiRISE). JGR."
    },
    {
        "id": "mex_hrsc",
        "name": "Mars Express HRSC",
        "type": "DEM",
        "resolution_m": 50,
        "coverage": "Mars",
        "description": "Mars Express High Resolution Stereo Camera – 50 m photogrammetric DEM.",
        "parameters": ["slope_deg", "elevation_m"],
        "source_url": "https://www.esa.int/Science_Exploration/Space_Science/Mars_Express",
        "citation": "Neukum et al. (2004). HRSC: The High Resolution Stereo Camera of Mars Express. ESA SP-1240."
    },
    {
        "id": "nasa_power_merra2",
        "name": "NASA POWER MERRA-2",
        "type": "Climate",
        "resolution_m": 50000,
        "coverage": "Global (Earth)",
        "description": "NASA Prediction of Worldwide Energy Resources reanalysis at 0.5°×0.625° based on MERRA-2.",
        "parameters": ["precipitation_mm_yr", "mean_annual_temp_c", "annual_temp_range_k", "solar_insolation_kwh_m2_day"],
        "source_url": "https://power.larc.nasa.gov/",
        "citation": "Gelaro et al. (2017). The Modern-Era Retrospective Analysis for Research and Applications, Version 2 (MERRA-2). J. Climate."
    },
    {
        "id": "modis_ndvi",
        "name": "MODIS NDVI",
        "type": "Vegetation",
        "resolution_m": 500,
        "coverage": "Global (Earth)",
        "description": "MODIS Terra/Aqua MOD13A1 500 m 16-day NDVI composite, annual maximum.",
        "parameters": ["vegetation_ndvi"],
        "source_url": "https://lpdaac.usgs.gov/products/mod13a1v006/",
        "citation": "Didan, K. (2015). MOD13A1 MODIS/Terra Vegetation Indices 16-Day L3 Global 500m SIN Grid V006. NASA EOSDIS LP DAAC."
    },
    {
        "id": "modis_lst",
        "name": "MODIS LST",
        "type": "Thermal",
        "resolution_m": 1000,
        "coverage": "Global (Earth)",
        "description": "MODIS Terra MOD11A2 1 km 8-day Land Surface Temperature composite.",
        "parameters": ["lst_diurnal_range_k", "mean_annual_temp_c"],
        "source_url": "https://lpdaac.usgs.gov/products/mod11a2v006/",
        "citation": "Wan, Z. (2015). MOD11A2 MODIS/Terra Land Surface Temperature/Emissivity 8-Day L3 Global 1km SIN Grid V006. NASA EOSDIS LP DAAC."
    }
]


def list_datasets():
    """Return the list of calibrated source datasets."""
    return DATASETS


def get_dataset(dataset_id: str):
    """Return a single dataset by ID."""
    return next((d for d in DATASETS if d["id"] == dataset_id), None)


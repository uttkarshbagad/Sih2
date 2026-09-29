# Data Pipeline

End-to-end data processing for Hyperlocal Monsoon Prediction System.

## Structure

```
pipeline/
├── sources/          # Data source fetchers
│   ├── chirps_rainfall.py    # CHIRPS 0.05° daily rainfall
│   ├── enso.py               # ENSO (ONI, Niño 3.4) from NOAA PSL
│   └── iod.py                # IOD/DMI (static fallback + ERSSTv5 compute)
├── transforms/       # Spatial aggregation
│   └── aggregate.py          # Grid → Block/District/Grid zonal stats
├── labels/           # Target label generation
│   ├── definitions.yaml      # All thresholds (ASSUMPTIONS)
│   ├── break.py              # Break/dry-spell labels
│   └── false_onset.py        # False onset labels
├── jobs/             # CLI pipeline runners
│   └── backfill.py           # Main backfill entry point
├── tests/            # Unit tests
│   └── test_labels.py        # Label function tests
└── README.md
```

## Quick Start

### 1. Install Dependencies
```bash
pip install xarray geopandas osmium netcdf4
# Or use conda for geospatial:
# conda install -c conda-forge xarray geopandas osmium netcdf4
```

### 2. Download OSM Boundaries (for block-level)
```bash
# Download eastern India OSM extract
wget https://download.geofabrik.de/asia/india/eastern-zone-latest.osm.pbf

# Extract admin_level=6 (subdistrict/block)
osmium tags-filter eastern-zone-latest.osm.pbf boundary=administrative admin_level=6 -o odisha_admin6.osm.pbf

# Convert to GeoJSON
ogr2ogr -f GeoJSON data/raw/osm/odisha_blocks.geojson odisha_admin6.osm.pbf
```

### 3. Run Backfill
```bash
# Full pipeline (IMD 0.25° grid cells - no OSM needed)
python -m pipeline.jobs.backfill --years 2005-2025 --spatial-unit imd_grid

# With OSM blocks (requires step 2)
python -m pipeline.jobs.backfill --years 2005-2025 --spatial-unit osm_blocks

# District level
python -m pipeline.jobs.backfill --years 2005-2025 --spatial-unit districts

# Partial runs
python -m pipeline.jobs.backfill --years 2020-2024 --skip-rainfall
python -m pipeline.jobs.backfill --years 2020-2024 --skip-climate
python -m pipeline.jobs.backfill --years 2020-2024 --skip-labels
```

## Output Files

All outputs saved to `data/processed/`:

| File | Description |
|------|-------------|
| `rainfall_{unit}_{year}.parquet` | Daily rainfall per spatial unit |
| `enso_oni.parquet` | Monthly ONI index |
| `enso_nino34_anom.parquet` | Monthly Niño 3.4 SST anomalies |
| `enso_nino34_sst.parquet` | Monthly Niño 3.4 SST absolute |
| `iod_dmi.parquet` | Monthly DMI (static fallback) |
| `labels_{unit}_w1.parquet` | Break/false-onset risk at Week 1 lead |
| `labels_{unit}_w2.parquet` | Break/false-onset risk at Week 2 lead |

## Label Definitions

All thresholds in `labels/definitions.yaml`:

| Parameter | Value | Meaning |
|-----------|-------|---------|
| `dry_day_mm` | 1.0 | Day with <1mm = dry |
| `break_dry_thresh_mm` | 2.5 | Break spell: daily rain <2.5mm |
| `break_min_days` | 5 | Min consecutive dry days for break |
| `break_window` | Jun 15 - Sep 15 | Break detection active window |
| `onset_cum_mm` | 20.0 | 3-day cum rainfall for onset |
| `false_onset_dry_run_days` | 7 | Dry run days for false onset |

**⚠️ ASSUMPTION**: These are agronomic defaults, NOT official MoES definitions.

## Spatial Units

| Unit | Resolution | Source | Use Case |
|------|------------|--------|----------|
| `imd_grid` | 0.25° (~25km) | Generated regular grid | Default, no external deps |
| `osm_blocks` | Variable | OSM admin_level=6 | Block-level (approx) |
| `districts` | District | OSM admin_level=5 | Coarse fallback |

## Testing

```bash
python -m pytest pipeline/tests/test_labels.py -v
```

## Data Sources

See `docs/DATA_SOURCES.md` for full audit of all data sources, URLs, and status.
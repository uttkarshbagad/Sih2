# Data Sources Audit

## Rainfall Data

### IMD Gridded Rainfall (via imdlib)
- **Status**: Connection issues (ConnectionResetError)
- **Source**: `imdlib` Python package downloads from IMD servers
- **Coverage**: India, 0.25° grid, daily from 1901
- **Issue**: IMD servers appear to block or have unstable connections from this network
- **Alternative**: CHIRPS (see below)

### CHIRPS Daily Rainfall
- **Status**: ✅ **ACCESSIBLE**
- **Source**: UCSB Climate Hazards Group
- **URL**: `https://data.chc.ucsb.edu/products/CHIRPS-2.0/global_daily/netcdf/p05/`
- **Format**: NetCDF (one file per year, e.g., `chirps-v2.0.2023.days_p05.nc`)
- **Coverage**: Global, 0.05° (~5km) grid, daily from 1981-present
- **License**: Free for research/educational use
- **Notes**: 
  - 0.05° resolution is finer than IMD's 0.25°
  - Files are large (~100-200MB/year)
  - Can subset to Odisha bbox (17.5-22.5°N, 81.5-87.5°E) during processing

### ERA5 Reanalysis (Optional)
- **Status**: Requires CDS API registration (free but needs account)
- **Source**: Copernicus Climate Data Store
- **Notes**: Not needed for minimum viable product; CHIRPS sufficient

## Climate Indices

### ENSO - ONI (Oceanic Niño Index)
- **Status**: ✅ **ACCESSIBLE**
- **Source**: NOAA Physical Sciences Laboratory (PSL)
- **URL**: `https://psl.noaa.gov/data/correlation/oni.data`
- **Format**: Text file, monthly values 1950-present
- **Content**: 3-month running mean of Niño 3.4 SST anomalies
- **License**: Public domain (US Government)

### ENSO - Niño 3.4 SST Anomalies
- **Status**: ✅ **ACCESSIBLE**
- **Source**: NOAA PSL
- **URL**: `https://psl.noaa.gov/data/correlation/nina34.anom.data`
- **Format**: Text file, monthly values 1948-present
- **Content**: Monthly Niño 3.4 SST anomalies (°C)
- **License**: Public domain

### ENSO - Niño 3.4 SST (absolute)
- **Status**: ✅ **ACCESSIBLE**
- **Source**: NOAA PSL
- **URL**: `https://psl.noaa.gov/data/correlation/nina34.data`
- **Format**: Text file, monthly values 1948-present

### IOD / DMI (Dipole Mode Index)
- **Status**: ⚠️ **PARTIAL - No direct text file found**
- **Attempted Sources**:
  - BOM (Australia): `http://www.bom.gov.au/climate/enso/iod.shtml` - **403 Forbidden** (blocks automated access)
  - NOAA PSL: No direct `.data` file found for IOD/DMI
  - JAMSTEC: `https://www.jamstec.go.jp/frcgc/research/d1/iod/DATA/dmi_HadISST.txt` - Returns maintenance page
  - IRI Data Library: Requires authentication
  - KNMI Climate Explorer: Web interface only
- **Workaround Options**:
  1. Compute DMI from SST data (HadISST/ERSST) using definition: DMI = WTIO - SETIO (western vs southeastern tropical Indian Ocean SST anomalies)
  2. Use pre-computed CSV from literature/paper supplements
  3. Use `xarray` + `ERSST`/`HadISST` netCDF to compute on-the-fly
  4. For prototype: Use static historical DMI values from published tables (cite source)

### MJO RMM (Real-time Multivariate MJO)
- **Status**: ❌ **NOT FOUND** as simple text file
- **Attempted Sources**:
  - NOAA CPC: `https://www.cpc.ncep.noaa.gov/products/precip/CWlink/daily_mjo_index/mjo_index.txt` - 404
  - NOAA CPC: `https://www.cpc.ncep.noaa.gov/products/precip/CWlink/MJO/rmm.74toRealtime.txt` - 404
- **Workaround**: 
  - Compute from ERA5/NOAA OLR + zonal wind data (complex)
  - For prototype: Omit MJO or use static climatological phase
  - Optional per spec - don't let it block progress

## Spatial Boundaries

### Odisha Block/Sub-district Boundaries
- **Status**: ✅ **ACCESSIBLE via OSM**
- **Source**: OpenStreetMap / Geofabrik
- **URL**: `https://download.geofabrik.de/asia/india/eastern-zone-latest.osm.pbf` (247 MB)
- **Format**: OSM PBF (can convert to GeoJSON with `osmium` or `ogr2ogr`)
- **Coverage**: Eastern India zone (includes Odisha, West Bengal, Jharkhand, Bihar)
- **Extraction**: Filter for `admin_level=6` (subdistrict/block) or `admin_level=5` (district) within Odisha state
- **License**: ODbL (Open Database License) - requires attribution, share-alike
- **Alternative**: `data.gov.in` (503 unavailable), HDX (404), Survey of India (restricted)

### IMD 0.25° Grid Cell Boundaries
- **Status**: Can be generated programmatically
- **Method**: Create regular 0.25° grid covering Odisha bbox
- **Use case**: Fallback if block boundaries prove difficult to process

## Summary: Minimum Viable Data Stack

| Component | Source | Status | Notes |
|-----------|--------|--------|-------|
| Daily Rainfall | CHIRPS 0.05° | ✅ Ready | Subset to Odisha, aggregate to blocks |
| ENSO (ONI) | NOAA PSL | ✅ Ready | Monthly, 1950-present |
| ENSO (Niño 3.4) | NOAA PSL | ✅ Ready | Monthly anomalies, 1948-present |
| IOD (DMI) | — | ⚠️ Need workaround | Compute from SST or use static table |
| MJO RMM | — | ❌ Skip for v1 | Optional per spec |
| Block Boundaries | OSM/Geofabrik | ✅ Ready | Extract admin_level=6 for Odisha |
| Grid Cell Boundaries | Generated | ✅ Ready | 0.25° regular grid fallback |

## Next Steps for Data Pipeline

1. **Rainfall**: Write CHIRPS downloader + Odisha subsetter + block aggregation
2. **ENSO**: Write NOAA PSL ONI/Niño3.4 fetcher + parser
3. **IOD**: Implement DMI computation from ERSSTv5 netCDF (available from NOAA PSL) OR include static historical CSV
4. **Boundaries**: Download OSM eastern zone, extract Odisha blocks with osmium/ogr2ogr
5. **Labels**: Implement break/false-onset labeling on aggregated rainfall time series
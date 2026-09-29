"""Spatial Aggregation: Grid to Block/Cell

Aggregates gridded rainfall (CHIRPS 0.05°) to spatial units:
- Option A: OSM block boundaries (admin_level=6) - zonal statistics
- Option B: IMD 0.25° grid cells - direct pass-through
- Option C: District level - zonal statistics
"""
import os
import logging
import geopandas as gpd
import pandas as pd
import numpy as np
import xarray as xr
from pathlib import Path
from typing import Optional, Literal
from shapely.geometry import box

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parents[2] / "data"
PROCESSED_DIR = DATA_DIR / "processed"
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

SPATIAL_UNIT_OPTIONS = Literal["osm_blocks", "imd_grid", "districts"]


def load_odisha_blocks_osm() -> Optional[gpd.GeoDataFrame]:
    """Load Odisha block boundaries from OSM extract.
    
    Requires: osmium/ogr2ogr to extract admin_level=6 from eastern-zone-latest.osm.pbf
    Expected file: data/raw/osm/odisha_blocks.geojson
    """
    geojson_path = DATA_DIR / "raw" / "osm" / "odisha_blocks.geojson"
    
    if not geojson_path.exists():
        logger.warning(f"OSM blocks not found at {geojson_path}")
        logger.info("Run: osmium tags-filter eastern-zone-latest.osm.pbf boundary=administrative admin_level=6 -o odisha_admin6.osm.pbf")
        logger.info("Then: ogr2ogr -f GeoJSON odisha_blocks.geojson odisha_admin6.osm.pbf")
        return None
    
    gdf = gpd.read_file(geojson_path)
    # Filter to Odisha state (name:en or name)
    odisha_gdf = gdf[gdf.get("name:en", gdf.get("name", "")).str.contains("Odisha|Orissa", case=False, na=False)]
    
    if len(odisha_gdf) == 0:
        # Try filtering by state code
        odisha_gdf = gdf[gdf.get("ISO3166-2", "").str.contains("IN-OD", case=False, na=False)]
    
    if len(odisha_gdf) == 0:
        # Last resort: use all admin_level=6 in the eastern zone bbox
        odisha_bbox = box(81.5, 17.5, 87.5, 22.5)
        odisha_gdf = gdf[gdf.intersects(odisha_bbox)]
    
    logger.info(f"Loaded {len(odisha_gdf)} Odisha blocks from OSM")
    return odisha_gdf


def load_district_boundaries() -> Optional[gpd.GeoDataFrame]:
    """Load Odisha district boundaries."""
    geojson_path = DATA_DIR / "raw" / "osm" / "odisha_districts.geojson"
    
    if not geojson_path.exists():
        logger.warning(f"District boundaries not found at {geojson_path}")
        return None
    
    gdf = gpd.read_file(geojson_path)
    logger.info(f"Loaded {len(gdf)} Odisha districts")
    return gdf


def create_imd_grid() -> gpd.GeoDataFrame:
    """Create regular 0.25° grid covering Odisha bounding box."""
    from shapely.geometry import Polygon
    
    lon_min, lon_max = 81.5, 87.5
    lat_min, lat_max = 17.5, 22.5
    resolution = 0.25
    
    polygons = []
    cell_ids = []
    lons = []
    lats = []
    
    lon = lon_min
    cell_id = 0
    while lon < lon_max:
        lat = lat_min
        while lat < lat_max:
            # Create cell polygon
            cell = Polygon([
                (lon, lat),
                (lon + resolution, lat),
                (lon + resolution, lat + resolution),
                (lon, lat + resolution)
            ])
            polygons.append(cell)
            cell_ids.append(f"imd_{cell_id:04d}")
            lons.append(lon + resolution/2)
            lats.append(lat + resolution/2)
            cell_id += 1
            lat += resolution
        lon += resolution
    
    gdf = gpd.GeoDataFrame({
        "cell_id": cell_ids,
        "center_lon": lons,
        "center_lat": lats
    }, geometry=polygons, crs="EPSG:4326")
    
    logger.info(f"Created {len(gdf)} IMD 0.25° grid cells")
    return gdf


def aggregate_rainfall_to_units(rainfall_df: pd.DataFrame,
                                 spatial_unit: SPATIAL_UNIT_OPTIONS = "imd_grid",
                                 boundaries_gdf: Optional[gpd.GeoDataFrame] = None) -> pd.DataFrame:
    """Aggregate point/grid rainfall to spatial units using zonal statistics.
    
    Args:
        rainfall_df: DataFrame with columns [date, latitude, longitude, rainfall_mm]
        spatial_unit: "osm_blocks", "imd_grid", or "districts"
        boundaries_gdf: Optional pre-loaded boundaries (if None, loads default)
        
    Returns:
        DataFrame with columns [date, unit_id, unit_name, rainfall_mm, unit_type]
    """
    # Load boundaries if not provided
    if boundaries_gdf is None:
        if spatial_unit == "osm_blocks":
            boundaries_gdf = load_odisha_blocks_osm()
        elif spatial_unit == "districts":
            boundaries_gdf = load_district_boundaries()
        elif spatial_unit == "imd_grid":
            boundaries_gdf = create_imd_grid()
        else:
            raise ValueError(f"Unknown spatial_unit: {spatial_unit}")
    
    if boundaries_gdf is None or len(boundaries_gdf) == 0:
        logger.error(f"No boundaries found for {spatial_unit}")
        return pd.DataFrame()
    
    # Ensure CRS matches
    if boundaries_gdf.crs != "EPSG:4326":
        boundaries_gdf = boundaries_gdf.to_crs("EPSG:4326")
    
    # Create points GeoDataFrame from rainfall data
    from shapely.geometry import Point
    geometry = [Point(xy) for xy in zip(rainfall_df["longitude"], rainfall_df["latitude"])]
    rain_gdf = gpd.GeoDataFrame(rainfall_df, geometry=geometry, crs="EPSG:4326")
    
    # Spatial join: assign each point to containing polygon
    joined = gpd.sjoin(rain_gdf, boundaries_gdf, how="inner", predicate="within")
    
    if joined.empty:
        logger.warning("No rainfall points fell within any boundary polygon")
        return pd.DataFrame()
    
    # Drop duplicate columns from spatial join (e.g., index_right, cell_id from both sides)
    # Keep only one copy of each column
    joined = joined.loc[:, ~joined.columns.duplicated()]
    
    # Determine ID and name columns
    id_col = "cell_id" if "cell_id" in joined.columns else ("block" if "block" in joined.columns else "district")
    name_col = "cell_id" if "cell_id" in joined.columns else ("name" if "name" in joined.columns else id_col)
    
    # If id_col and name_col are the same, only group by one
    group_cols = ["date", id_col]
    if name_col != id_col and name_col in joined.columns:
        group_cols.append(name_col)
    
    # Aggregate: mean rainfall per unit per day
    agg = joined.groupby(group_cols)["rainfall_mm"].mean().reset_index()
    agg = agg.rename(columns={id_col: "unit_id"})
    if name_col != id_col and name_col in agg.columns:
        agg = agg.rename(columns={name_col: "unit_name"})
    else:
        agg["unit_name"] = agg["unit_id"]
    agg["unit_type"] = spatial_unit
    
    logger.info(f"Aggregated to {agg['unit_id'].nunique()} {spatial_unit} units over {agg['date'].nunique()} days")
    return agg


def save_aggregated_rainfall(df: pd.DataFrame, spatial_unit: str, year: int):
    """Save aggregated rainfall to parquet."""
    out_path = PROCESSED_DIR / f"rainfall_{spatial_unit}_{year}.parquet"
    df.to_parquet(out_path, index=False)
    logger.info(f"Saved aggregated rainfall to {out_path}")
    return out_path


def load_aggregated_rainfall(spatial_unit: str, years: list) -> pd.DataFrame:
    """Load aggregated rainfall for multiple years."""
    dfs = []
    for year in years:
        path = PROCESSED_DIR / f"rainfall_{spatial_unit}_{year}.parquet"
        if path.exists():
            dfs.append(pd.read_parquet(path))
        else:
            logger.warning(f"Missing file: {path}")
    
    if dfs:
        return pd.concat(dfs, ignore_index=True).sort_values(["unit_id", "date"])
    return pd.DataFrame()


def get_spatial_unit_info(spatial_unit: SPATIAL_UNIT_OPTIONS) -> dict:
    """Return metadata about the spatial resolution used."""
    info = {
        "osm_blocks": {
            "name": "OSM Admin Level 6 (Subdistrict/Block)",
            "resolution": "Variable (block boundaries)",
            "source": "OpenStreetMap / Geofabrik eastern zone extract",
            "license": "ODbL",
            "note": "Not official revenue blocks; approximate alignment"
        },
        "imd_grid": {
            "name": "IMD 0.25° Regular Grid",
            "resolution": "0.25° × 0.25° (~25 km)",
            "source": "Generated regular grid over Odisha bbox",
            "license": "Public domain",
            "note": "Grid cell centers, not block-level"
        },
        "districts": {
            "name": "Odisha Districts",
            "resolution": "District-level (30 districts)",
            "source": "OpenStreetMap / Geofabrik",
            "license": "ODbL",
            "note": "Coarse resolution, for fallback only"
        }
    }
    return info.get(spatial_unit, {})


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    # Test IMD grid creation
    grid = create_imd_grid()
    print(f"IMD Grid: {len(grid)} cells")
    print(grid.head())
    
    # Test spatial unit info
    for unit in ["osm_blocks", "imd_grid", "districts"]:
        print(f"\n{unit}: {get_spatial_unit_info(unit)}")
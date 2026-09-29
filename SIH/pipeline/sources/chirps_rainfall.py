"""CHIRPS Daily Rainfall Data Source

Fetches and caches CHIRPS 0.05° daily rainfall NetCDF files for Odisha region.
Source: https://data.chc.ucsb.edu/products/CHIRPS-2.0/global_daily/netcdf/p05/
"""
import os
import logging
import requests
import xarray as xr
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import date
from typing import Optional, Tuple

logger = logging.getLogger(__name__)

CHIRPS_BASE_URL = "https://data.chc.ucsb.edu/products/CHIRPS-2.0/global_daily/netcdf/p05/"
ODISHA_BBOX = {"lat_min": 17.5, "lat_max": 22.5, "lon_min": 81.5, "lon_max": 87.5}
CACHE_DIR = Path(__file__).parents[2] / "data" / "raw" / "chirps"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

METADATA_FILE = CACHE_DIR / "download_log.csv"


def _log_download(year: int, filename: str, status: str, size_mb: float = 0.0):
    """Log download attempt to CSV"""
    import csv
    from datetime import datetime
    
    row = {
        "download_date": datetime.now().isoformat(),
        "year": year,
        "filename": filename,
        "status": status,
        "size_mb": round(size_mb, 2),
        "source_url": f"{CHIRPS_BASE_URL}{filename}",
        "bbox": str(ODISHA_BBOX),
        "version": "CHIRPS-2.0"
    }
    
    file_exists = METADATA_FILE.exists()
    with open(METADATA_FILE, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=row.keys())
        if not file_exists:
            writer.writeheader()
        writer.writerow(row)


def download_chirps_year(year: int, force: bool = False) -> Optional[Path]:
    """Download CHIRPS daily rainfall NetCDF for a single year.
    
    Args:
        year: Year to download (e.g., 2023)
        force: Re-download even if cached
        
    Returns:
        Path to downloaded file, or None if failed
    """
    filename = f"chirps-v2.0.{year}.days_p05.nc"
    url = f"{CHIRPS_BASE_URL}{filename}"
    local_path = CACHE_DIR / filename
    
    if local_path.exists() and not force:
        logger.info(f"CHIRPS {year} already cached at {local_path}")
        _log_download(year, filename, "cached", local_path.stat().st_size / 1e6)
        return local_path
    
    logger.info(f"Downloading CHIRPS {year} from {url}")
    try:
        response = requests.get(url, stream=True, timeout=300)
        response.raise_for_status()
        
        total_size = int(response.headers.get("content-length", 0))
        with open(local_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        
        size_mb = local_path.stat().st_size / 1e6
        logger.info(f"Downloaded CHIRPS {year}: {size_mb:.1f} MB")
        _log_download(year, filename, "success", size_mb)
        return local_path
        
    except Exception as e:
        logger.error(f"Failed to download CHIRPS {year}: {e}")
        if local_path.exists():
            local_path.unlink()
        _log_download(year, filename, f"failed: {e}")
        return None


def download_chirps_range(start_year: int, end_year: int, force: bool = False) -> list:
    """Download CHIRPS data for a range of years.
    
    Returns:
        List of successfully downloaded file paths
    """
    paths = []
    for year in range(start_year, end_year + 1):
        path = download_chirps_year(year, force)
        if path:
            paths.append(path)
    return paths


def load_chirps_odisha(year: int) -> Optional[xr.Dataset]:
    """Load CHIRPS NetCDF and subset to Odisha bounding box.
    
    Returns:
        xarray Dataset with precipitation variable, subset to Odisha
    """
    filename = f"chirps-v2.0.{year}.days_p05.nc"
    local_path = CACHE_DIR / filename
    
    if not local_path.exists():
        logger.warning(f"CHIRPS {year} not found locally, attempting download...")
        local_path = download_chirps_year(year)
        if not local_path:
            return None
    
    try:
        ds = xr.open_dataset(local_path)
        # CHIRPS uses 'precip' variable, lat/lon dimensions
        # Subset to Odisha
        ds_odisha = ds.sel(
            latitude=slice(ODISHA_BBOX["lat_max"], ODISHA_BBOX["lat_min"]),  # descending
            longitude=slice(ODISHA_BBOX["lon_min"], ODISHA_BBOX["lon_max"])
        )
        return ds_odisha
    except Exception as e:
        logger.error(f"Failed to load CHIRPS {year}: {e}")
        return None


def chirps_to_dataframe(year: int) -> Optional[pd.DataFrame]:
    """Convert CHIRPS NetCDF for a year to long-format DataFrame.
    
    Returns:
        DataFrame with columns: date, latitude, longitude, rainfall_mm
    """
    ds = load_chirps_odisha(year)
    if ds is None:
        return None
    
    # Convert to DataFrame
    df = ds["precip"].to_dataframe().reset_index()
    df = df.rename(columns={"precip": "rainfall_mm", "time": "date"})
    df["date"] = pd.to_datetime(df["date"])
    df["year"] = year
    
    # Filter out NaN (ocean/missing)
    df = df.dropna(subset=["rainfall_mm"])
    
    return df


def get_chirps_climatology(start_year: int, end_year: int) -> pd.DataFrame:
    """Compute daily climatology (mean rainfall per day-of-year) from CHIRPS.
    
    Returns:
        DataFrame with columns: day_of_year, latitude, longitude, climatology_mm
    """
    all_dfs = []
    for year in range(start_year, end_year + 1):
        df = chirps_to_dataframe(year)
        if df is not None:
            all_dfs.append(df)
    
    if not all_dfs:
        return pd.DataFrame()
    
    combined = pd.concat(all_dfs, ignore_index=True)
    combined["day_of_year"] = combined["date"].dt.dayofyear
    
    clim = combined.groupby(["day_of_year", "latitude", "longitude"])["rainfall_mm"].mean().reset_index()
    clim = clim.rename(columns={"rainfall_mm": "climatology_mm"})
    
    return clim


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    # Example: download 2020-2023
    paths = download_chirps_range(2020, 2023)
    print(f"Downloaded {len(paths)} files")
    
    # Example: load one year
    df = chirps_to_dataframe(2023)
    if df is not None:
        print(f"2023 data shape: {df.shape}")
        print(df.head())
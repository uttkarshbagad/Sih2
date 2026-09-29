"""ENSO (ONI/Niño 3.4) Data Source

Fetches and caches ENSO indices from NOAA PSL.
Sources:
- ONI: https://psl.noaa.gov/data/correlation/oni.data
- Niño 3.4 anomaly: https://psl.noaa.gov/data/correlation/nina34.anom.data
- Niño 3.4 SST: https://psl.noaa.gov/data/correlation/nina34.data
"""
import os
import logging
import requests
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

NOAA_PSL_BASE = "https://psl.noaa.gov/data/correlation/"
CACHE_DIR = Path(__file__).parents[2] / "data" / "raw" / "enso"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

ENSO_SOURCES = {
    "oni": {
        "url": f"{NOAA_PSL_BASE}oni.data",
        "filename": "oni.data",
        "description": "Oceanic Niño Index (3-month running mean of Niño 3.4 SST anomalies)",
        "format": "year followed by 12 monthly values"
    },
    "nino34_anom": {
        "url": f"{NOAA_PSL_BASE}nina34.anom.data",
        "filename": "nina34.anom.data",
        "description": "Niño 3.4 SST anomalies (monthly, °C)",
        "format": "year followed by 12 monthly values"
    },
    "nino34_sst": {
        "url": f"{NOAA_PSL_BASE}nina34.data",
        "filename": "nina34.data",
        "description": "Niño 3.4 SST absolute values (monthly, °C)",
        "format": "year followed by 12 monthly values"
    }
}

METADATA_FILE = CACHE_DIR / "download_log.csv"


def _log_download(source: str, status: str, records: int = 0, error: str = ""):
    """Log download attempt to CSV"""
    import csv
    
    row = {
        "download_date": datetime.now().isoformat(),
        "source": source,
        "url": ENSO_SOURCES[source]["url"],
        "status": status,
        "records": records,
        "error": error,
        "description": ENSO_SOURCES[source]["description"]
    }
    
    file_exists = METADATA_FILE.exists()
    with open(METADATA_FILE, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=row.keys())
        if not file_exists:
            writer.writeheader()
        writer.writerow(row)


def fetch_enso_data(source: str = "oni", force: bool = False) -> Optional[pd.DataFrame]:
    """Fetch ENSO data from NOAA PSL.
    
    Args:
        source: One of "oni", "nino34_anom", "nino34_sst"
        force: Re-download even if cached
        
    Returns:
        DataFrame with columns: year, month, value (and date index)
    """
    if source not in ENSO_SOURCES:
        raise ValueError(f"Unknown ENSO source: {source}. Options: {list(ENSO_SOURCES.keys())}")
    
    info = ENSO_SOURCES[source]
    local_path = CACHE_DIR / info["filename"]
    
    # Download if needed
    if not local_path.exists() or force:
        logger.info(f"Downloading {source} from {info['url']}")
        try:
            response = requests.get(info["url"], timeout=60)
            response.raise_for_status()
            local_path.write_text(response.text)
            logger.info(f"Saved to {local_path}")
        except Exception as e:
            logger.error(f"Failed to download {source}: {e}")
            _log_download(source, f"failed: {e}", error=str(e))
            return None
    
    # Parse the fixed-width format
    # Format: year followed by 12 monthly values (Jan-Dec)
    try:
        lines = local_path.read_text().strip().split("\n")
        
        # Skip header lines (first line usually has year range)
        data_lines = [l for l in lines if l.strip() and not l.strip().startswith("#")]
        
        records = []
        for line in data_lines:
            parts = line.split()
            if len(parts) >= 13:  # year + 12 months
                year = int(parts[0])
                for month_idx, val_str in enumerate(parts[1:13], 1):
                    try:
                        val = float(val_str)
                        # NOAA uses -99.9 or similar for missing
                        if val > -90:
                            records.append({
                                "year": year,
                                "month": month_idx,
                                "value": val,
                                "source": source
                            })
                    except ValueError:
                        continue
        
        df = pd.DataFrame(records)
        if not df.empty:
            df["date"] = pd.to_datetime(df[["year", "month"]].assign(day=1))
            df = df.sort_values("date").reset_index(drop=True)
            _log_download(source, "success", len(df))
            logger.info(f"Parsed {len(df)} monthly records for {source}")
            return df
        else:
            _log_download(source, "no_data")
            return None
            
    except Exception as e:
        logger.error(f"Failed to parse {source}: {e}")
        _log_download(source, f"parse_failed: {e}", error=str(e))
        return None


def get_latest_enso(source: str = "nino34_anom") -> Optional[Dict[str, Any]]:
    """Get the most recent ENSO value.
    
    Returns:
        Dict with latest value, date, and 3-month running mean if available
    """
    df = fetch_enso_data(source)
    if df is None or df.empty:
        return None
    
    latest = df.iloc[-1]
    return {
        "value": float(latest["value"]),
        "date": latest["date"].strftime("%Y-%m"),
        "year": int(latest["year"]),
        "month": int(latest["month"]),
        "source": source
    }


def get_enso_timeseries(source: str = "nino34_anom", 
                        start_year: int = 1950, 
                        end_year: int = None) -> pd.DataFrame:
    """Get ENSO time series for a date range.
    
    Returns:
        DataFrame with date index and value column
    """
    df = fetch_enso_data(source)
    if df is None:
        return pd.DataFrame()
    
    if end_year is None:
        end_year = datetime.now().year
    
    mask = (df["year"] >= start_year) & (df["year"] <= end_year)
    result = df.loc[mask, ["date", "value"]].copy()
    result = result.set_index("date")
    result.columns = [source]
    
    return result


def compute_oni_from_nino34(nino34_df: pd.DataFrame) -> pd.DataFrame:
    """Compute ONI (3-month running mean) from Niño 3.4 monthly anomalies.
    
    ONI = 3-month running mean of Niño 3.4 SST anomalies
    """
    if nino34_df.empty:
        return pd.DataFrame()
    
    df = nino34_df.copy()
    df = df.set_index("date")
    df["oni"] = df["nino34_anom"].rolling(window=3, center=True).mean()
    df = df.reset_index()
    
    return df


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    # Fetch all sources
    for source in ENSO_SOURCES:
        df = fetch_enso_data(source)
        if df is not None:
            print(f"{source}: {len(df)} records, latest: {df.iloc[-1]['date']} = {df.iloc[-1]['value']:.2f}")
    
    # Get latest
    latest = get_latest_enso("nino34_anom")
    print(f"\nLatest Niño 3.4 anomaly: {latest}")
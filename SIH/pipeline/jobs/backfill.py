"""Backfill Job: End-to-End Data Pipeline

Downloads CHIRPS rainfall, fetches ENSO/IOD indices, aggregates to spatial units,
computes labels, and saves processed parquet files.

Usage:
    python -m pipeline.jobs.backfill --years 2005-2025 --spatial-unit imd_grid
"""
import argparse
import logging
import sys
from pathlib import Path
import pandas as pd
import numpy as np

# Add parent to path
sys.path.insert(0, str(Path(__file__).parents[2]))

from pipeline.sources.chirps_rainfall import download_chirps_range, chirps_to_dataframe, get_chirps_climatology
from pipeline.sources.enso import fetch_enso_data, get_enso_timeseries
from pipeline.sources.iod import get_dmi_timeseries, get_latest_dmi
from pipeline.transforms.aggregate import aggregate_rainfall_to_units, save_aggregated_rainfall, create_imd_grid, get_spatial_unit_info
from pipeline.labels.break_labels import compute_break_risk_labels
from pipeline.labels.false_onset import compute_false_onset_risk_labels

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def parse_year_range(year_str: str) -> tuple:
    """Parse '2005-2025' into (2005, 2025)."""
    parts = year_str.split("-")
    if len(parts) != 2:
        raise ValueError(f"Invalid year range: {year_str}. Use 'START-END'")
    return int(parts[0]), int(parts[1])


def backfill_rainfall(start_year: int, end_year: int, spatial_unit: str) -> dict:
    """Download and aggregate rainfall for year range."""
    logger.info(f"=== BACKFILL RAINFALL {start_year}-{end_year} ({spatial_unit}) ===")
    
    # 1. Download CHIRPS data
    logger.info("Downloading CHIRPS...")
    download_chirps_range(start_year, end_year)
    
    # 2. Convert each year to DataFrame and aggregate
    all_rainfall = []
    for year in range(start_year, end_year + 1):
        logger.info(f"Processing CHIRPS {year}...")
        df = chirps_to_dataframe(year)
        if df is not None:
            all_rainfall.append(df)
    
    if not all_rainfall:
        raise RuntimeError("No rainfall data downloaded")
    
    combined = pd.concat(all_rainfall, ignore_index=True)
    combined["year"] = combined["date"].dt.year
    
    # 3. Aggregate to spatial units
    logger.info(f"Aggregating to {spatial_unit}...")
    agg_df = aggregate_rainfall_to_units(combined, spatial_unit=spatial_unit)
    
    if agg_df.empty:
        raise RuntimeError(f"Aggregation to {spatial_unit} produced empty result")
    
    # 4. Save per-year parquet files
    for year in range(start_year, end_year + 1):
        year_df = agg_df[agg_df["date"].dt.year == year]
        if not year_df.empty:
            save_aggregated_rainfall(year_df, spatial_unit, year)
    
    return {
        "spatial_unit": spatial_unit,
        "years": f"{start_year}-{end_year}",
        "units": agg_df["unit_id"].nunique(),
        "days": agg_df["date"].nunique(),
        "records": len(agg_df)
    }


def backfill_climate_indices(start_year: int, end_year: int) -> dict:
    """Fetch and save ENSO and IOD indices."""
    logger.info(f"=== BACKFILL CLIMATE INDICES {start_year}-{end_year} ===")
    
    # ENSO: ONI, Niño 3.4 anomaly
    logger.info("Fetching ENSO indices...")
    oni_df = fetch_enso_data("oni")
    nino34_anom_df = fetch_enso_data("nino34_anom")
    nino34_sst_df = fetch_enso_data("nino34_sst")
    
    # IOD: DMI (using static fallback for now)
    logger.info("Fetching IOD/DMI...")
    dmi_df = get_dmi_timeseries(start_year, end_year, use_static=True)
    
    # Save
    from pathlib import Path
    PROCESSED_DIR = Path(__file__).parents[2] / "data" / "processed"
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    
    if oni_df is not None:
        oni_df.to_parquet(PROCESSED_DIR / "enso_oni.parquet")
    if nino34_anom_df is not None:
        nino34_anom_df.to_parquet(PROCESSED_DIR / "enso_nino34_anom.parquet")
    if nino34_sst_df is not None:
        nino34_sst_df.to_parquet(PROCESSED_DIR / "enso_nino34_sst.parquet")
    if not dmi_df.empty:
        dmi_df.to_parquet(PROCESSED_DIR / "iod_dmi.parquet")
    
    return {
        "enso_oni_records": len(oni_df) if oni_df is not None else 0,
        "enso_nino34_anom_records": len(nino34_anom_df) if nino34_anom_df is not None else 0,
        "enso_nino34_sst_records": len(nino34_sst_df) if nino34_sst_df is not None else 0,
        "iod_dmi_records": len(dmi_df)
    }


def backfill_labels(spatial_unit: str, start_year: int, end_year: int) -> dict:
    """Compute and save break/false-onset labels."""
    logger.info(f"=== BACKFILL LABELS {start_year}-{end_year} ({spatial_unit}) ===")
    
    # Load aggregated rainfall
    from pathlib import Path
    PROCESSED_DIR = Path(__file__).parents[2] / "data" / "processed"
    
    dfs = []
    for year in range(start_year, end_year + 1):
        path = PROCESSED_DIR / f"rainfall_{spatial_unit}_{year}.parquet"
        if path.exists():
            dfs.append(pd.read_parquet(path))
    
    if not dfs:
        raise RuntimeError(f"No aggregated rainfall found for {spatial_unit}")
    
    rainfall_df = pd.concat(dfs, ignore_index=True)
    rainfall_df["date"] = pd.to_datetime(rainfall_df["date"])
    rainfall_df["year"] = rainfall_df["date"].dt.year
    
    # Compute labels for both leads
    results = {}
    
    for lead_weeks, lead_days in [(1, 7), (2, 14)]:
        logger.info(f"Computing break risk (Week {lead_weeks})...")
        break_risk = compute_break_risk_labels(rainfall_df, lead_days=lead_days)
        
        logger.info(f"Computing false onset risk (Week {lead_weeks})...")
        false_onset_risk = compute_false_onset_risk_labels(rainfall_df, lead_days=lead_days)
        
        # Merge labels
        labels = break_risk.merge(
            false_onset_risk, 
            on=["date", "unit_id"], 
            how="outer"
        )
        
        # Save
        out_path = PROCESSED_DIR / f"labels_{spatial_unit}_w{lead_weeks}.parquet"
        labels.to_parquet(out_path, index=False)
        logger.info(f"Saved labels to {out_path}")
        
        results[f"week_{lead_weeks}"] = {
            "break_risk_positive": int(labels[f"break_risk_w{lead_weeks}"].sum()),
            "false_onset_risk_positive": int(labels[f"false_onset_risk_w{lead_weeks}"].sum()),
            "total_records": len(labels)
        }
    
    return results


def main():
    parser = argparse.ArgumentParser(description="Backfill hyperlocal monsoon data pipeline")
    parser.add_argument("--years", required=True, help="Year range (e.g., 2005-2025)")
    parser.add_argument("--spatial-unit", default="imd_grid", 
                        choices=["imd_grid", "osm_blocks", "districts"],
                        help="Spatial aggregation unit")
    parser.add_argument("--skip-rainfall", action="store_true", help="Skip rainfall download/aggregation")
    parser.add_argument("--skip-climate", action="store_true", help="Skip climate indices")
    parser.add_argument("--skip-labels", action="store_true", help="Skip label computation")
    
    args = parser.parse_args()
    
    start_year, end_year = parse_year_range(args.years)
    
    logger.info(f"Starting backfill for {start_year}-{end_year}, spatial_unit={args.spatial_unit}")
    
    # Log spatial unit info
    info = get_spatial_unit_info(args.spatial_unit)
    logger.info(f"Spatial unit: {info['name']} ({info['resolution']})")
    logger.info(f"Source: {info['source']}, License: {info['license']}")
    if "note" in info:
        logger.info(f"Note: {info['note']}")
    
    summary = {
        "years": f"{start_year}-{end_year}",
        "spatial_unit": args.spatial_unit,
        "spatial_unit_info": info
    }
    
    try:
        if not args.skip_rainfall:
            summary["rainfall"] = backfill_rainfall(start_year, end_year, args.spatial_unit)
        
        if not args.skip_climate:
            summary["climate_indices"] = backfill_climate_indices(start_year, end_year)
        
        if not args.skip_labels:
            summary["labels"] = backfill_labels(args.spatial_unit, start_year, end_year)
        
        logger.info("=== BACKFILL COMPLETE ===")
        logger.info(f"Summary: {summary}")
        
    except Exception as e:
        logger.error(f"Backfill failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
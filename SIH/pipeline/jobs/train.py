"""Train Job: CLI for Model Training

Usage:
    python -m pipeline.jobs.train --years 2005-2025 --spatial-unit imd_grid
"""
import argparse
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[2]))

from pipeline.features import build_feature_table, get_feature_names
from pipeline.train import train_all_models
from pipeline.sources.chirps_rainfall import chirps_to_dataframe
from pipeline.transforms.aggregate import aggregate_rainfall_to_units, load_aggregated_rainfall
from pipeline.labels.break_labels import compute_break_risk_labels
from pipeline.labels.false_onset import compute_false_onset_risk_labels
from pipeline.sources.enso import get_enso_timeseries
from pipeline.sources.iod import get_dmi_timeseries

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def parse_year_range(year_str: str) -> list:
    """Parse '2005-2025' into list of years."""
    parts = year_str.split("-")
    if len(parts) != 2:
        raise ValueError(f"Invalid year range: {year_str}. Use 'START-END'")
    start, end = int(parts[0]), int(parts[1])
    return list(range(start, end + 1))


def main():
    parser = argparse.ArgumentParser(description="Train monsoon prediction models")
    parser.add_argument("--years", required=True, help="Year range (e.g., 2005-2025)")
    parser.add_argument("--spatial-unit", default="imd_grid", 
                        choices=["imd_grid", "osm_blocks", "districts"],
                        help="Spatial aggregation unit")
    parser.add_argument("--holdout-years", type=int, default=2,
                        help="Number of recent years to hold out for testing")
    parser.add_argument("--output-dir", default="models",
                        help="Output directory for models")
    
    args = parser.parse_args()
    
    years = parse_year_range(args.years)
    logger.info(f"Training for years {years[0]}-{years[-1]}, spatial_unit={args.spatial_unit}")
    
    # 1. Load rainfall data
    logger.info("Loading rainfall data...")
    rainfall_dfs = []
    for year in years:
        df = chirps_to_dataframe(year)
        if df is not None:
            rainfall_dfs.append(df)
    
    if not rainfall_dfs:
        logger.error("No rainfall data loaded")
        sys.exit(1)
    
    rainfall_df = pd.concat(rainfall_dfs, ignore_index=True)
    rainfall_df["year"] = rainfall_df["date"].dt.year
    
    # 2. Aggregate to spatial units
    logger.info(f"Aggregating to {args.spatial_unit}...")
    agg_df = aggregate_rainfall_to_units(rainfall_df, spatial_unit=args.spatial_unit)
    
    if agg_df.empty:
        logger.error("Aggregation produced empty result")
        sys.exit(1)
    
    # 3. Load climate indices
    logger.info("Loading climate indices...")
    enso_df = get_enso_timeseries("nino34_anom", years[0], years[-1])
    iod_df = get_dmi_timeseries(years[0], years[-1])
    
    # 4. Compute labels
    logger.info("Computing labels...")
    label_dfs = []
    
    for lead_days in [7, 14]:
        break_risk = compute_break_risk_labels(agg_df, lead_days=lead_days)
        false_onset_risk = compute_false_onset_risk_labels(agg_df, lead_days=lead_days)
        label_dfs.append(break_risk)
        label_dfs.append(false_onset_risk)
    
    # Merge all labels
    labels_df = label_dfs[0]
    for df in label_dfs[1:]:
        labels_df = labels_df.merge(df, on=["date", "unit_id"], how="outer")
    
    # 5. Build feature table
    logger.info("Building feature table...")
    # Use all years except holdout for training climatology
    train_years = years[:-args.holdout_years]
    
    X, y = build_feature_table(
        agg_df, labels_df,
        enso_df=enso_df, iod_df=iod_df,
        train_years=train_years,
        spatial_unit=args.spatial_unit
    )
    
    # 6. Train models
    logger.info("Training models...")
    groups = X.index.to_series().map(lambda x: agg_df.loc[x, "year"] if x in agg_df.index else years[0])
    # Actually need proper groups - let's use the year from the data
    # The index of X corresponds to rows in agg_df
    year_series = agg_df.set_index(agg_df.index)["year"]
    groups = year_series.loc[X.index]
    
    results = train_all_models(
        X, y, groups,
        train_years=train_years,
        spatial_unit=args.spatial_unit,
        feature_names=get_feature_names()
    )
    
    logger.info(f"Training complete. Trained {len(results)} models.")
    for target, res in results.items():
        meta = res["metadata"]
        logger.info(f"  {target}: Brier={meta['mean_cv_brier']:.4f}, AUC={meta['mean_cv_roc_auc']:.4f}")


if __name__ == "__main__":
    main()
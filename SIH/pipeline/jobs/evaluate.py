"""Evaluate Job: CLI for Model Evaluation

Usage:
    python -m pipeline.jobs.evaluate --years 2005-2025 --spatial-unit imd_grid --test-years 2023-2024
"""
import argparse
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[2]))

from pipeline.evaluate import evaluate_all_models, save_evaluation_results, generate_validation_report
from pipeline.features import build_feature_table, get_feature_names
from pipeline.sources.chirps_rainfall import chirps_to_dataframe
from pipeline.transforms.aggregate import aggregate_rainfall_to_units
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
    parser = argparse.ArgumentParser(description="Evaluate monsoon prediction models")
    parser.add_argument("--years", required=True, help="Year range (e.g., 2005-2025)")
    parser.add_argument("--spatial-unit", default="imd_grid", 
                        choices=["imd_grid", "osm_blocks", "districts"],
                        help="Spatial aggregation unit")
    parser.add_argument("--test-years", default=None,
                        help="Test year range (e.g., 2023-2024). Default: last 2 years")
    parser.add_argument("--output-dir", default="docs",
                        help="Output directory for results")
    
    args = parser.parse_args()
    
    years = parse_year_range(args.years)
    test_years = parse_year_range(args.test_years) if args.test_years else None
    
    logger.info(f"Evaluating for years {years[0]}-{years[-1]}, spatial_unit={args.spatial_unit}")
    if test_years:
        logger.info(f"Test years: {test_years[0]}-{test_years[-1]}")
    
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
    train_years = years[:-2] if not test_years else [y for y in years if y not in test_years]
    
    X, y = build_feature_table(
        agg_df, labels_df,
        enso_df=enso_df, iod_df=iod_df,
        train_years=train_years,
        spatial_unit=args.spatial_unit
    )
    
    # Year groups for each sample
    # X index corresponds to agg_df rows
    year_series = agg_df.set_index(agg_df.index)["year"]
    groups = year_series.loc[X.index]
    
    # 6. Evaluate
    logger.info("Evaluating models...")
    results = evaluate_all_models(
        X, y, groups,
        test_years=test_years,
        spatial_unit=args.spatial_unit
    )
    
    # 7. Save results
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    json_path = save_evaluation_results(results, output_dir / "validation_results.json")
    md_path = generate_validation_report(results, output_dir / "VALIDATION.md")
    
    # 8. Generate plots
    from pipeline.evaluate import plot_reliability_curves, plot_skill_scores
    plot_reliability_curves(results, output_dir)
    plot_skill_scores(results, output_dir)
    
    logger.info("Evaluation complete!")
    logger.info(f"Results saved to {json_path}")
    logger.info(f"Report saved to {md_path}")
    
    # Print summary
    print("\n=== EVALUATION SUMMARY ===")
    print(f"Spatial Unit: {results['spatial_unit']}")
    print(f"Train Years: {results['train_years']}")
    print(f"Test Years: {results['test_years']}")
    print(f"Train Samples: {results['train_samples']:,}")
    print(f"Test Samples: {results['test_samples']:,}")
    print()
    print(f"{'Target':<30} {'Lead':<8} {'Brier':<10} {'BSS':<10} {'ROC-AUC':<10} {'Hit Rate':<10} {'FAR':<10}")
    print("-" * 90)
    for target, res in results["targets"].items():
        lead = "Week 1" if "w1" in target else "Week 2"
        print(f"{target:<30} {lead:<8} {res['brier_score']:.4f}     {res['brier_skill_score']:.4f}     "
              f"{res['roc_auc']:.4f}     {res['hit_rate']:.4f}     {res['false_alarm_ratio']:.4f}")


if __name__ == "__main__":
    main()
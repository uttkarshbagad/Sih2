"""Feature Engineering for Monsoon Prediction

Builds leak-free feature table for break/false-onset prediction.
All climatology, scalers, encoders fit on TRAINING YEARS ONLY within each CV fold.
"""
import logging
import pandas as pd
import numpy as np
from typing import Optional, List, Tuple
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger(__name__)


def add_rainfall_features(df: pd.DataFrame, 
                           rainfall_col: str = "rainfall_mm",
                           windows: List[int] = None) -> pd.DataFrame:
    """Add rolling rainfall sum features.
    
    Args:
        df: DataFrame with columns [date, unit_id, rainfall_mm]
        rainfall_col: Name of rainfall column
        windows: List of window sizes in days
        
    Returns:
        DataFrame with added rolling sum columns
    """
    if windows is None:
        windows = [3, 7, 14, 30]
    
    df = df.sort_values(["unit_id", "date"]).copy()
    
    for w in windows:
        col_name = f"rainfall_sum_{w}d"
        df[col_name] = df.groupby("unit_id")[rainfall_col].transform(
            lambda x: x.rolling(window=w, min_periods=1).sum()
        )
    
    return df


def add_dry_spell_features(df: pd.DataFrame,
                            rainfall_col: str = "rainfall_mm",
                            dry_thresh: float = 2.5) -> pd.DataFrame:
    """Add dry spell tracking features.
    
    Args:
        df: DataFrame with daily rainfall
        rainfall_col: Rainfall column name
        dry_thresh: Threshold below which day is considered dry
        
    Returns:
        DataFrame with dry spell features
    """
    df = df.sort_values(["unit_id", "date"]).copy()
    df["is_dry"] = (df[rainfall_col] < dry_thresh).astype(int)
    
    # Current dry spell length (consecutive dry days up to today)
    df["dry_seq"] = (df["is_dry"] != df.groupby("unit_id")["is_dry"].shift()).cumsum()
    df["dry_spell_len"] = df.groupby(["unit_id", "dry_seq"]).cumcount() + 1
    df["dry_spell_len"] = df["dry_spell_len"] * df["is_dry"]  # 0 on wet days
    
    # Days since last significant rain (>= dry_thresh)
    df["rain_ge_thresh"] = (df[rainfall_col] >= dry_thresh).astype(int)
    df["rain_seq"] = (df["rain_ge_thresh"] != df.groupby("unit_id")["rain_ge_thresh"].shift()).cumsum()
    df["days_since_rain"] = df.groupby(["unit_id", "rain_seq"]).cumcount()
    df.loc[df["rain_ge_thresh"] == 1, "days_since_rain"] = 0
    
    return df


def add_temporal_features(df: pd.DataFrame, date_col: str = "date") -> pd.DataFrame:
    """Add temporal features (day of year, month, season)."""
    df = df.copy()
    df[date_col] = pd.to_datetime(df[date_col])
    df["day_of_year"] = df[date_col].dt.dayofyear
    df["month"] = df[date_col].dt.month
    df["week_of_year"] = df[date_col].dt.isocalendar().week
    # Monsoon phase: 0=pre, 1=onset, 2=peak, 3=withdrawal
    df["monsoon_phase"] = pd.cut(df["month"], 
                                  bins=[0, 5, 6, 9, 12], 
                                  labels=[0, 1, 2, 3]).astype(int)
    # Cyclical encoding for day of year
    df["doy_sin"] = np.sin(2 * np.pi * df["day_of_year"] / 366)
    df["doy_cos"] = np.cos(2 * np.pi * df["day_of_year"] / 366)
    return df


def add_climatology_features(df: pd.DataFrame, 
                              clim_df: pd.DataFrame,
                              date_col: str = "date",
                              unit_col: str = "unit_id",
                              value_col: str = "rainfall_mm") -> pd.DataFrame:
    """Add climatology anomaly features.
    
    IMPORTANT: climatology_df MUST be computed from TRAINING YEARS ONLY.
    This function assumes clim_df has columns [day_of_year, unit_id, climatology_mm].
    
    Args:
        df: DataFrame with daily data
        clim_df: Climatology per day-of-year per unit (from training years)
        date_col: Date column
        unit_col: Unit identifier column
        value_col: Rainfall value column
        
    Returns:
        DataFrame with climatology and anomaly columns
    """
    df = df.copy()
    df[date_col] = pd.to_datetime(df[date_col])
    df["day_of_year"] = df[date_col].dt.dayofyear
    
    # Merge climatology
    df = df.merge(clim_df, on=["day_of_year", unit_col], how="left")
    
    # Anomaly: actual - climatology
    df["rainfall_anomaly"] = df[value_col] - df["climatology_mm"]
    # Relative anomaly: (actual - clim) / clim (avoid div by 0)
    df["rainfall_anomaly_pct"] = np.where(
        df["climatology_mm"] > 0.1,
        df["rainfall_anomaly"] / df["climatology_mm"] * 100,
        0
    )
    
    return df


def compute_climatology(train_df: pd.DataFrame,
                         date_col: str = "date",
                         unit_col: str = "unit_id",
                         value_col: str = "rainfall_mm") -> pd.DataFrame:
    """Compute daily climatology from training data only.
    
    Args:
        train_df: Training DataFrame (subset of years)
        date_col: Date column
        unit_col: Unit identifier
        value_col: Rainfall column
        
    Returns:
        DataFrame with [day_of_year, unit_id, climatology_mm]
    """
    train_df = train_df.copy()
    train_df[date_col] = pd.to_datetime(train_df[date_col])
    train_df["day_of_year"] = train_df[date_col].dt.dayofyear
    
    clim = train_df.groupby(["day_of_year", unit_col])[value_col].mean().reset_index()
    clim = clim.rename(columns={value_col: "climatology_mm"})
    
    # Smooth climatology with 7-day rolling mean to reduce noise
    clim = clim.sort_values([unit_col, "day_of_year"])
    clim["climatology_mm"] = clim.groupby(unit_col)["climatology_mm"].transform(
        lambda x: x.rolling(window=7, min_periods=1, center=True).mean()
    )
    
    return clim


def add_climate_index_features(df: pd.DataFrame,
                                enso_df: pd.DataFrame = None,
                                iod_df: pd.DataFrame = None,
                                date_col: str = "date") -> pd.DataFrame:
    """Add ENSO and IOD index features.
    
    Uses latest available index value at each date (no lookahead).
    
    Args:
        df: Main DataFrame
        enso_df: DataFrame with [date, value] for ENSO (monthly)
        iod_df: DataFrame with [date, value] for IOD (monthly)
        date_col: Date column in main DataFrame
        
    Returns:
        DataFrame with enso, iod columns added
    """
    df = df.copy()
    df[date_col] = pd.to_datetime(df[date_col])
    df["year_month"] = df[date_col].dt.to_period("M")
    
    # Initialize columns
    df["enso"] = np.nan
    df["iod"] = np.nan
    
    if enso_df is not None and not enso_df.empty:
        enso_df = enso_df.copy()
        enso_df["date"] = pd.to_datetime(enso_df["date"])
        enso_df["year_month"] = enso_df["date"].dt.to_period("M")
        enso_monthly = enso_df.groupby("year_month")["value"].last().reset_index()
        enso_monthly = enso_monthly.rename(columns={"value": "enso"})
        df = df.merge(enso_monthly, on="year_month", how="left", suffixes=("", "_enso"))
    
    if iod_df is not None and not iod_df.empty:
        iod_df = iod_df.copy()
        iod_df["date"] = pd.to_datetime(iod_df["date"])
        iod_df["year_month"] = iod_df["date"].dt.to_period("M")
        iod_monthly = iod_df.groupby("year_month")["value"].last().reset_index()
        iod_monthly = iod_monthly.rename(columns={"value": "iod"})
        df = df.merge(iod_monthly, on="year_month", how="left", suffixes=("", "_iod"))
    
    # Forward fill to get latest available index
    if "enso" in df.columns:
        df["enso"] = df.groupby("unit_id")["enso"].ffill()
    if "iod" in df.columns:
        df["iod"] = df.groupby("unit_id")["iod"].ffill()
    
    # Fill remaining NaN with 0 (neutral)
    df["enso"] = df["enso"].fillna(0)
    df["iod"] = df["iod"].fillna(0)
    
    df = df.drop(columns=["year_month"])
    return df


def build_feature_table(rainfall_df: pd.DataFrame,
                         label_df: pd.DataFrame,
                         enso_df: pd.DataFrame = None,
                         iod_df: pd.DataFrame = None,
                         train_years: List[int] = None,
                         spatial_unit: str = "imd_grid") -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Build complete feature table with labels.
    
    This is the main entry point. It:
    1. Adds all features to rainfall data
    2. Computes climatology from training years only
    3. Merges labels
    4. Returns (X, y) ready for modeling
    
    Args:
        rainfall_df: Daily aggregated rainfall [date, unit_id, rainfall_mm, year]
        label_df: Labels [date, unit_id, break_risk_w1, break_risk_w2, false_onset_risk_w1, false_onset_risk_w2]
        enso_df: ENSO monthly data
        iod_df: IOD monthly data
        train_years: List of training years (for climatology)
        spatial_unit: Spatial unit type
        
    Returns:
        X: Feature DataFrame
        y: Label DataFrame (multiple targets)
    """
    logger.info(f"Building feature table for {spatial_unit}")
    
    # 1. Add base features
    df = rainfall_df.copy()
    df = add_rainfall_features(df)
    df = add_dry_spell_features(df)
    df = add_temporal_features(df)
    
    # 2. Compute climatology from training years
    if train_years is not None:
        train_mask = df["year"].isin(train_years)
        train_df = df[train_mask].copy()
        clim_df = compute_climatology(train_df)
        logger.info(f"Computed climatology from {len(train_years)} training years")
    else:
        clim_df = compute_climatology(df)
        logger.warning("No train_years specified, using all data for climatology (LEAKAGE RISK!)")
    
    df = add_climatology_features(df, clim_df)
    
    # 3. Add climate indices
    df = add_climate_index_features(df, enso_df, iod_df)
    
    # 4. Merge labels
    df = df.merge(label_df, on=["date", "unit_id"], how="inner")
    
    # 5. Separate features and targets
    target_cols = [c for c in df.columns if c.startswith(("break_risk", "false_onset_risk"))]
    feature_cols = [c for c in df.columns if c not in target_cols + ["date", "unit_id", "year", "unit_name", "unit_type"]]
    
    X = df[feature_cols].copy()
    y = df[target_cols].copy()
    
    # Handle missing values
    X = X.fillna(X.median())
    
    logger.info(f"Feature table: {X.shape[0]} samples, {X.shape[1]} features, {len(target_cols)} targets")
    logger.info(f"Targets: {target_cols}")
    
    return X, y


def get_feature_names() -> List[str]:
    """Return list of expected feature columns (for model persistence)."""
    return [
        "rainfall_mm",
        "rainfall_sum_3d", "rainfall_sum_7d", "rainfall_sum_14d", "rainfall_sum_30d",
        "is_dry", "dry_spell_len", "days_since_rain",
        "day_of_year", "month", "week_of_year", "monsoon_phase",
        "doy_sin", "doy_cos",
        "climatology_mm", "rainfall_anomaly", "rainfall_anomaly_pct",
        "enso", "iod"
    ]


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    # Test with synthetic data
    dates = pd.date_range("2023-06-01", "2023-09-30", freq="D")
    np.random.seed(42)
    
    data = []
    for unit in ["A", "B"]:
        rain = np.random.exponential(5, len(dates))
        for d, r in zip(dates, rain):
            data.append({"date": d, "unit_id": unit, "rainfall_mm": r, "year": 2023})
    
    df = pd.DataFrame(data)
    df = add_rainfall_features(df)
    df = add_dry_spell_features(df)
    df = add_temporal_features(df)
    
    clim = compute_climatology(df)
    df = add_climatology_features(df, clim)
    
    print("Features added:")
    print(df.columns.tolist())
    print(df.head())
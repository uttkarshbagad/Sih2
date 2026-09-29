"""False Onset Label Generation

Implements false onset detection using thresholds from definitions.yaml.
A false onset occurs when:
1. Onset is detected (3-day cum rainfall >= 20mm after May 1)
2. Within 20 days of onset, a dry run of >=7 days (<2.5mm/day) occurs

Labels may use future rainfall (lookahead allowed for labels).
Features MUST NOT use future data.
"""
import logging
import pandas as pd
import numpy as np
import yaml
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

DEFS_PATH = Path(__file__).parents[1] / "labels" / "definitions.yaml"


def load_definitions() -> dict:
    with open(DEFS_PATH) as f:
        return yaml.safe_load(f)


def compute_onset_dates(rainfall_df: pd.DataFrame, 
                         definitions: dict = None) -> pd.DataFrame:
    """Compute monsoon onset date for each unit/year.
    
    Onset = first 3-day window with cumulative rainfall >= 20mm after May 1.
    
    Returns:
        DataFrame with columns [year, unit_id, onset_date]
    """
    if definitions is None:
        definitions = load_definitions()
    
    search_start = definitions["onset_search_start"]  # "05-01"
    window_days = definitions["onset_window_days"]    # 3
    cum_thresh = definitions["onset_cum_mm"]          # 20.0
    
    start_month, start_day = map(int, search_start.split("-"))
    
    results = []
    
    for (unit_id, year), group in rainfall_df.groupby(["unit_id", "year"]):
        group = group.sort_values("date").copy()
        group["date"] = pd.to_datetime(group["date"])
        
        # Filter to search period (May 1 onward)
        search_mask = (group["date"].dt.month > start_month) | \
                      ((group["date"].dt.month == start_month) & (group["date"].dt.day >= start_day))
        search_group = group[search_mask].copy()
        
        if len(search_group) < window_days:
            continue
        
        # Compute rolling 3-day cumulative rainfall (backward-looking: sum of current day + prev 2 days)
        search_group["cum_3d"] = search_group["rainfall_mm"].rolling(
            window=window_days, min_periods=window_days
        ).sum()
        
        # The rolling sum at index i covers days i-2, i-1, i
        # Onset date = first day of the 3-day window = date at index i-2
        # Find first date where cum_3d >= threshold
        onset_candidates = search_group[search_group["cum_3d"] >= cum_thresh]
        
        if not onset_candidates.empty:
            # Onset = first day of the 3-day window that meets threshold
            # rolling sum at index i covers [i-2, i-1, i], so onset = date at i-2
            onset_idx = onset_candidates.index[0]
            # Get the row 2 positions before the candidate
            onset_row = search_group.loc[onset_idx - 2] if onset_idx - 2 in search_group.index else onset_candidates.iloc[0]
            onset_date = onset_row["date"]
            results.append({
                "year": year,
                "unit_id": unit_id,
                "onset_date": onset_date
            })
    
    result_df = pd.DataFrame(results)
    logger.info(f"Onset dates computed for {len(result_df)} unit-years")
    return result_df


def compute_false_onset_labels(rainfall_df: pd.DataFrame,
                                definitions: dict = None) -> pd.DataFrame:
    """Compute false onset labels for each unit/year.
    
    False onset = onset detected AND >=7 consecutive dry days (<2.5mm) 
    within 20 days after onset.
    
    Returns:
        DataFrame with columns [year, unit_id, onset_date, false_onset]
    """
    if definitions is None:
        definitions = load_definitions()
    
    check_days = definitions["false_onset_check_days"]      # 20
    dry_run_days = definitions["false_onset_dry_run_days"]  # 7
    dry_thresh = definitions["break_dry_thresh_mm"]         # 2.5
    
    # Compute onset dates
    onset_df = compute_onset_dates(rainfall_df, definitions)
    
    if onset_df.empty:
        logger.warning("No onsets detected")
        return pd.DataFrame(columns=["year", "unit_id", "onset_date", "false_onset"])
    
    results = []
    
    for _, onset_row in onset_df.iterrows():
        unit_id = onset_row["unit_id"]
        year = onset_row["year"]
        onset_date = onset_row["onset_date"]
        
        # Get rainfall for this unit/year after onset
        unit_year_rain = rainfall_df[
            (rainfall_df["unit_id"] == unit_id) & 
            (rainfall_df["year"] == year)
        ].copy()
        unit_year_rain["date"] = pd.to_datetime(unit_year_rain["date"])
        
        # Filter to check period after onset
        check_start = onset_date + pd.Timedelta(days=1)
        check_end = onset_date + pd.Timedelta(days=check_days)
        
        check_period = unit_year_rain[
            (unit_year_rain["date"] >= check_start) & 
            (unit_year_rain["date"] <= check_end)
        ].copy()
        
        if len(check_period) < dry_run_days:
            # Not enough days to check
            results.append({
                "year": year,
                "unit_id": unit_id,
                "onset_date": onset_date,
                "false_onset": 0
            })
            continue
        
        check_period = check_period.sort_values("date")
        check_period["is_dry"] = check_period["rainfall_mm"] < dry_thresh
        
        # Find consecutive dry sequences
        check_period["dry_seq"] = (check_period["is_dry"] != check_period["is_dry"].shift()).cumsum()
        dry_sequences = check_period[check_period["is_dry"]].groupby("dry_seq").size()
        
        has_false_onset = any(dry_sequences >= dry_run_days)
        
        results.append({
            "year": year,
            "unit_id": unit_id,
            "onset_date": onset_date,
            "false_onset": int(has_false_onset)
        })
    
    result_df = pd.DataFrame(results)
    logger.info(f"False onset labels: {result_df['false_onset'].sum()} false / {len(result_df)} total onsets")
    return result_df


def compute_false_onset_risk_labels(rainfall_df: pd.DataFrame,
                                     lead_days: int = 7,
                                     definitions: dict = None) -> pd.DataFrame:
    """Compute false onset risk at specified lead time.
    
    For a given issue date, label = 1 if a false onset occurs 
    with onset in the lead window.
    
    Args:
        rainfall_df: Daily rainfall per unit (must have 'year' column)
        lead_days: Lead time in days (7 for Week 1, 14 for Week 2)
        definitions: Threshold definitions
        
    Returns:
        DataFrame with [date, unit_id, false_onset_risk_w{lead_days//7}]
    """
    # Compute false onset events per year
    false_onsets = compute_false_onset_labels(rainfall_df, definitions)
    
    if false_onsets.empty:
        logger.warning("No false onset data")
        return pd.DataFrame()
    
    # Get false onset dates
    false_onset_dates = false_onsets[false_onsets["false_onset"] == 1][["year", "unit_id", "onset_date"]].copy()
    
    results = []
    
    for (unit_id, year), group in rainfall_df.groupby(["unit_id", "year"]):
        group = group.sort_values("date").copy()
        group["date"] = pd.to_datetime(group["date"])
        
        unit_false_onsets = false_onset_dates[
            (false_onset_dates["unit_id"] == unit_id) & 
            (false_onset_dates["year"] == year)
        ]["onset_date"].tolist()
        
        if not unit_false_onsets:
            group[f"false_onset_risk_w{lead_days//7}"] = 0
            results.append(group[["date", "unit_id", f"false_onset_risk_w{lead_days//7}"]])
            continue
        
        issue_dates = group["date"].values
        labels = np.zeros(len(issue_dates), dtype=int)
        
        for i, issue_date in enumerate(issue_dates):
            window_start = issue_date + np.timedelta64(1, "D")
            window_end = issue_date + np.timedelta64(lead_days, "D")
            
            for onset in unit_false_onsets:
                if window_start <= onset <= window_end:
                    labels[i] = 1
                    break
        
        group[f"false_onset_risk_w{lead_days//7}"] = labels
        results.append(group[["date", "unit_id", f"false_onset_risk_w{lead_days//7}"]])
    
    result_df = pd.concat(results, ignore_index=True)
    result_df = result_df.sort_values(["unit_id", "date"]).reset_index(drop=True)
    
    label_col = f"false_onset_risk_w{lead_days//7}"
    logger.info(f"False onset risk (lead={lead_days}d): {result_df[label_col].sum()} positive / {len(result_df)} total")
    return result_df


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    # Test with synthetic data
    dates = pd.date_range("2023-05-01", "2023-08-31", freq="D")
    np.random.seed(42)
    
    # Unit A: onset in early June, then 7-day dry spell -> false onset
    rain_a = np.random.exponential(3, len(dates))
    # Onset: 3 days >= 20mm around June 5
    onset_idx = 35  # ~June 5
    rain_a[onset_idx:onset_idx+3] = [8, 7, 6]  # cum = 21
    # False onset: 7-day dry spell after onset
    rain_a[onset_idx+5:onset_idx+12] = 0.5
    
    # Unit B: onset, then sustained rain -> confirmed onset
    rain_b = np.random.exponential(5, len(dates))
    onset_idx_b = 30
    rain_b[onset_idx_b:onset_idx_b+3] = [8, 7, 6]
    rain_b[onset_idx_b+5:onset_idx_b+25] = np.random.exponential(8, 20)  # sustained
    
    df = pd.DataFrame({
        "date": list(dates) * 2,
        "unit_id": ["A"] * len(dates) + ["B"] * len(dates),
        "year": [2023] * len(dates) * 2,
        "rainfall_mm": np.concatenate([rain_a, rain_b])
    })
    
    # Compute onset dates
    onsets = compute_onset_dates(df)
    print("Onset dates:")
    print(onsets)
    
    # Compute false onset labels
    false_labels = compute_false_onset_labels(df)
    print("\nFalse onset labels:")
    print(false_labels)
    
    # Compute false onset risk
    risk_w1 = compute_false_onset_risk_labels(df, lead_days=7)
    print(f"\nWeek 1 false onset risk positive: {risk_w1['false_onset_risk_w1'].sum()}")
    
    risk_w2 = compute_false_onset_risk_labels(df, lead_days=14)
    print(f"Week 2 false onset risk positive: {risk_w2['false_onset_risk_w2'].sum()}")
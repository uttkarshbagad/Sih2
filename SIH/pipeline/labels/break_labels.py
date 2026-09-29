"""Break / Dry Spell Label Generation

Implements break detection using thresholds from definitions.yaml.
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
    """Load label definitions from YAML."""
    with open(DEFS_PATH) as f:
        return yaml.safe_load(f)


def compute_break_labels(rainfall_df: pd.DataFrame, 
                         definitions: dict = None) -> pd.DataFrame:
    """Compute break onset labels for each spatial unit.
    
    Args:
        rainfall_df: DataFrame with columns [date, unit_id, rainfall_mm]
                     (daily rainfall aggregated to spatial units)
        definitions: Optional dict with threshold definitions
        
    Returns:
        DataFrame with columns [date, unit_id, break_onset] where break_onset=1
        marks the first day of a qualifying dry spell
    """
    if definitions is None:
        definitions = load_definitions()
    
    dry_thresh = definitions["break_dry_thresh_mm"]
    min_days = definitions["break_min_days"]
    window_start = definitions["break_window_start"]
    window_end = definitions["break_window_end"]
    
    # Parse window dates
    start_month, start_day = map(int, window_start.split("-"))
    end_month, end_day = map(int, window_end.split("-"))
    
    results = []
    
    for unit_id, group in rainfall_df.groupby("unit_id"):
        group = group.sort_values("date").copy()
        group["date"] = pd.to_datetime(group["date"])
        group["month_day"] = group["date"].dt.strftime("%m-%d")
        group["in_window"] = (group["month_day"] >= window_start) & (group["month_day"] <= window_end)
        group["is_dry"] = group["rainfall_mm"] < dry_thresh
        
        # Find ALL consecutive dry day sequences (not limited to window)
        group["dry_seq"] = (group["is_dry"] != group["is_dry"].shift()).cumsum()
        
        # For each dry sequence, check if it has >= min_days within the window
        group["break_onset"] = 0
        
        for seq_id, seq_group in group[group["is_dry"]].groupby("dry_seq"):
            # Get the portion of this sequence that falls in the break window
            in_window = seq_group[seq_group["in_window"]]
            
            if len(in_window) >= min_days:
                # Sequence has enough dry days in window - mark the FIRST day in window as onset
                onset_date = in_window["date"].min()
                group.loc[group["date"] == onset_date, "break_onset"] = 1
        
        results.append(group[["date", "unit_id", "break_onset"]])
        
        results.append(group[["date", "unit_id", "break_onset"]])
    
    result_df = pd.concat(results, ignore_index=True)
    result_df = result_df.sort_values(["unit_id", "date"]).reset_index(drop=True)
    
    # Safety: drop any duplicate unit_id+date combinations (should not happen)
    result_df = result_df.drop_duplicates(subset=["unit_id", "date"], keep="first")
    
    logger.info(f"Break labels: {result_df['break_onset'].sum()} onset events across {result_df['unit_id'].nunique()} units")
    return result_df


def compute_break_risk_labels(rainfall_df: pd.DataFrame,
                               lead_days: int = 7,
                               definitions: dict = None) -> pd.DataFrame:
    """Compute break risk labels at specified lead time.
    
    For a given issue date, label = 1 if a break onset occurs 
    within the lead window (lead_days days ahead).
    
    Args:
        rainfall_df: Daily rainfall per unit
        lead_days: Lead time in days (7 for Week 1, 14 for Week 2)
        definitions: Threshold definitions
        
    Returns:
        DataFrame with [date, unit_id, break_risk_w{lead_days//7}] 
        where date = issue date, label = 1 if break starts in next lead_days
    """
    # First compute break onsets
    break_onsets = compute_break_labels(rainfall_df, definitions)
    
    # Get only onset dates
    onset_dates = break_onsets[break_onsets["break_onset"] == 1][["date", "unit_id"]].copy()
    onset_dates = onset_dates.rename(columns={"date": "onset_date"})
    
    # For each issue date, check if onset occurs in [issue_date + 1, issue_date + lead_days]
    results = []
    
    for unit_id, group in rainfall_df.groupby("unit_id"):
        group = group.sort_values("date").copy()
        group["date"] = pd.to_datetime(group["date"])
        
        unit_onsets = onset_dates[onset_dates["unit_id"] == unit_id]["onset_date"].tolist()
        
        if not unit_onsets:
            group[f"break_risk_w{lead_days//7}"] = 0
            results.append(group[["date", "unit_id", f"break_risk_w{lead_days//7}"]])
            continue
        
        # Vectorized check: for each issue date, is there an onset in the lead window?
        issue_dates = group["date"].values
        labels = np.zeros(len(issue_dates), dtype=int)
        
        for i, issue_date in enumerate(issue_dates):
            window_start = issue_date + np.timedelta64(1, "D")
            window_end = issue_date + np.timedelta64(lead_days, "D")
            
            # Check if any onset falls in this window
            for onset in unit_onsets:
                if window_start <= onset <= window_end:
                    labels[i] = 1
                    break
        
        group[f"break_risk_w{lead_days//7}"] = labels
        results.append(group[["date", "unit_id", f"break_risk_w{lead_days//7}"]])
    
    result_df = pd.concat(results, ignore_index=True)
    result_df = result_df.sort_values(["unit_id", "date"]).reset_index(drop=True)
    
    label_col = f"break_risk_w{lead_days//7}"
    logger.info(f"Break risk (lead={lead_days}d): {result_df[label_col].sum()} positive / {len(result_df)} total")
    return result_df


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    # Test with synthetic data
    dates = pd.date_range("2023-06-01", "2023-09-30", freq="D")
    np.random.seed(42)
    
    # Unit A: has a break in mid-July
    rain_a = np.random.exponential(5, len(dates))
    rain_a[45:55] = 0.5  # 10-day dry spell
    
    # Unit B: no break
    rain_b = np.random.exponential(8, len(dates))
    
    df = pd.DataFrame({
        "date": list(dates) * 2,
        "unit_id": ["A"] * len(dates) + ["B"] * len(dates),
        "rainfall_mm": np.concatenate([rain_a, rain_b])
    })
    
    # Compute break onsets
    break_labels = compute_break_labels(df)
    print("Break onsets:")
    print(break_labels[break_labels["break_onset"] == 1])
    
    # Compute break risk at 7-day lead
    risk_w1 = compute_break_risk_labels(df, lead_days=7)
    print(f"\nWeek 1 break risk positive: {risk_w1['break_risk_w1'].sum()}")
    
    # Compute break risk at 14-day lead
    risk_w2 = compute_break_risk_labels(df, lead_days=14)
    print(f"Week 2 break risk positive: {risk_w2['break_risk_w2'].sum()}")
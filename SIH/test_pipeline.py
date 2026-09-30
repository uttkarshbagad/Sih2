"""Test spatial aggregation and label generation with synthetic data"""
import pandas as pd
import numpy as np
from pipeline.transforms.aggregate import create_imd_grid, aggregate_rainfall_to_units
from pipeline.labels.break_labels import compute_break_risk_labels
from pipeline.labels.false_onset import compute_false_onset_risk_labels

# Create IMD grid
grid = create_imd_grid()
print(f"IMD Grid: {len(grid)} cells")

# Create synthetic rainfall data for a few grid cells over a season
dates = pd.date_range("2023-06-01", "2023-09-30", freq="D")
np.random.seed(42)

# Pick 3 grid cells
cell_ids = grid["cell_id"].tolist()[:3]
cell_coords = grid[grid["cell_id"].isin(cell_ids)][["cell_id", "center_lat", "center_lon"]]

rainfall_data = []
for _, cell in cell_coords.iterrows():
    # Different patterns per cell
    if cell["cell_id"] == cell_ids[0]:
        # Cell 0: break in mid-July
        rain = np.random.exponential(5, len(dates))
        rain[45:55] = 0.5  # 10-day dry spell
    elif cell["cell_id"] == cell_ids[1]:
        # Cell 1: no break
        rain = np.random.exponential(8, len(dates))
    else:
        # Cell 2: early break
        rain = np.random.exponential(6, len(dates))
        rain[15:25] = 0.5  # 10-day dry spell in June
    
    for d, r in zip(dates, rain):
        rainfall_data.append({
            "date": d,
            "latitude": cell["center_lat"],
            "longitude": cell["center_lon"],
            "rainfall_mm": r
        })

rainfall_df = pd.DataFrame(rainfall_data)
print(f"Rainfall data: {len(rainfall_df)} records")

# Aggregate to grid cells
agg_df = aggregate_rainfall_to_units(rainfall_df, spatial_unit="imd_grid")
print(f"Aggregated: {len(agg_df)} records, {agg_df['unit_id'].nunique()} cells")
print(agg_df.head())

# Add year column
agg_df["year"] = agg_df["date"].dt.year

# Compute labels
print("\n--- Computing labels ---")
break_w1 = compute_break_risk_labels(agg_df, lead_days=7)
print(f"Break risk W1: {break_w1['break_risk_w1'].sum()} positive")

break_w2 = compute_break_risk_labels(agg_df, lead_days=14)
print(f"Break risk W2: {break_w2['break_risk_w2'].sum()} positive")

false_w1 = compute_false_onset_risk_labels(agg_df, lead_days=7)
print(f"False onset risk W1: {false_w1['false_onset_risk_w1'].sum()} positive")

false_w2 = compute_false_onset_risk_labels(agg_df, lead_days=14)
print(f"False onset risk W2: {false_w2['false_onset_risk_w2'].sum()} positive")

# Merge all labels
labels = break_w1.merge(break_w2, on=["date", "unit_id"])\
                .merge(false_w1, on=["date", "unit_id"])\
                .merge(false_w2, on=["date", "unit_id"])
print(f"\nFinal labels shape: {labels.shape}")
print(labels.columns.tolist())
print(labels.head(20))
import pandas as pd
import numpy as np
from pipeline.features import build_feature_table, get_feature_names
from pipeline.train import train_all_models

# Create SMALLER synthetic data
np.random.seed(42)
dates = pd.date_range('2020-06-01', periods=50, freq='D')
units = ['cell_0', 'cell_1']

data = []
for year in [2020, 2021, 2022, 2023]:
    for unit in units:
        rain = np.random.exponential(5, len(dates))
        if unit == 'cell_0':
            rain[20:30] = 0.3
        for d, r in zip(dates, rain):
            data.append({'date': d, 'unit_id': unit, 'rainfall_mm': r, 'year': year})

rainfall_df = pd.DataFrame(data)
print('Rainfall:', len(rainfall_df), 'rows')

# Create labels
from pipeline.labels.break_labels import compute_break_risk_labels
from pipeline.labels.false_onset import compute_false_onset_risk_labels

break_w1 = compute_break_risk_labels(rainfall_df, lead_days=7)
break_w2 = compute_break_risk_labels(rainfall_df, lead_days=14)
false_w1 = compute_false_onset_risk_labels(rainfall_df, lead_days=7)
false_w2 = compute_false_onset_risk_labels(rainfall_df, lead_days=14)

labels_df = break_w1.merge(break_w2, on=['date', 'unit_id']).merge(false_w1, on=['date', 'unit_id']).merge(false_w2, on=['date', 'unit_id'])
print('Labels:', len(labels_df), 'rows')

# Build features
X, y = build_feature_table(rainfall_df, labels_df, train_years=[2020,2021], spatial_unit='imd_grid')
print('Features: X=', X.shape, 'y=', y.shape)

# Year groups
groups = rainfall_df.set_index(rainfall_df.index)['year']
groups = groups.loc[X.index]

# Train (quick test)
from pipeline.train import LGBM_PARAMS
test_params = LGBM_PARAMS.copy()
test_params['num_boost_round'] = 20
test_params['early_stopping_rounds'] = 5

results = train_all_models(X, y, groups, [2020,2021], 'imd_grid', get_feature_names(), test_params)
print('Trained', len(results), 'models')
for target, res in results.items():
    meta = res['metadata']
    print(f'  {target}: Brier={meta["mean_cv_brier"]:.4f}, AUC={meta["mean_cv_roc_auc"]:.4f}')
# Label Definitions & Assumptions

**All thresholds below are standard-style agronomic defaults for prototype demonstration.**
**They are NOT official MoES/IMD definitions and should be reviewed by domain experts.**

---

## Rainfall Thresholds

### Dry Day Definition
```yaml
dry_day_mm: 1.0
```
**ASSUMPTION**: A day with < 1.0 mm rainfall is considered "dry".
- Based on common agricultural practice where < 1 mm is negligible for soil moisture recharge
- IMD sometimes uses 2.5 mm threshold for "rainy day"; we use 1.0 mm for more sensitivity

---

## Break / Dry Spell Definition

### Break Window
```yaml
break_window: ["06-15", "09-15"]
```
**ASSUMPTION**: Break detection only active during core monsoon season (June 15 - September 15).
- Outside this window, dry spells are not classified as "monsoon breaks"
- Aligns with IMD monsoon season definition for central/eastern India

### Minimum Break Duration
```yaml
break_min_days: 5
```
**ASSUMPTION**: A dry spell must persist ≥ 5 consecutive days to qualify as a break.
- Standard definition in literature (e.g., Rajeevan et al., 2010)
- Shorter spells (3-4 days) are common variability, not breaks

### Break Dry Threshold
```yaml
break_dry_thresh_mm: 2.5
```
**ASSUMPTION**: During a break spell, daily rainfall must be < 2.5 mm.
- Consistent with IMD's "rainy day" threshold (≥ 2.5 mm)
- A day with ≥ 2.5 mm breaks the dry spell sequence

**Break Label Logic**:
1. For each day in break_window (Jun 15 - Sep 15)
2. Find sequences of ≥ `break_min_days` consecutive days where daily rainfall < `break_dry_thresh_mm`
3. Label the **start date** of each such sequence as `break=1` (break onset)
4. All other days in window: `break=0`

---

## Monsoon Onset Definition

### Onset Search Start
```yaml
onset_search_start: "05-01"
```
**ASSUMPTION**: Start searching for onset from May 1.
- Pre-monsoon showers can occur in April; true onset typically June
- May 1 ensures capture of early onsets

### Onset Window
```yaml
onset_window_days: 3
onset_cum_mm: 20.0
```
**ASSUMPTION**: Onset = first 3-day window with cumulative rainfall ≥ 20 mm after May 1.
- Based on IMD's onset criteria (rainfall threshold over consecutive days)
- 20 mm over 3 days ≈ 6.7 mm/day sustained rainfall

**Onset Label Logic**:
1. For each day from `onset_search_start` (May 1) onward
2. Compute 3-day cumulative rainfall (day, day+1, day+2)
3. First day where cumulative ≥ `onset_cum_mm` (20 mm) → `onset=1`
4. Only first occurrence per season labeled

---

## False Onset Definition

### False Onset Check Period
```yaml
false_onset_check_days: 20
```
**ASSUMPTION**: After detected onset, monitor for 20 days.
- If a dry spell occurs within 20 days of onset, it may be false onset

### False Onset Dry Run
```yaml
false_onset_dry_run_days: 7
```
**ASSUMPTION**: A dry run of ≥ 7 consecutive days with < 2.5 mm/day within 20 days of onset = false onset.
- Based on agricultural impact: 7+ day dry spell after sowing causes crop failure
- Uses same `break_dry_thresh_mm` (2.5 mm) for dry day definition

**False Onset Label Logic**:
1. Detect onset date per season (as above)
2. Look forward `false_onset_check_days` (20 days) from onset
3. If any sequence of ≥ `false_onset_dry_run_days` (7) consecutive dry days (< 2.5 mm) occurs
4. Label the **onset date** as `false_onset=1`
5. If no such dry run → `false_onset=0` (confirmed onset)

---

## Target Variables for Modeling

| Target | Label | Description | Positive Class |
|--------|-------|-------------|----------------|
| Break Risk (Week 1) | `break_w1` | Break onset occurs within 7 days of issue date | 1 = break starts in days 1-7 |
| Break Risk (Week 2) | `break_w2` | Break onset occurs within 8-14 days of issue date | 1 = break starts in days 8-14 |
| False Onset Risk (Week 1) | `false_onset_w1` | Onset occurs in days 1-7 AND followed by 7-day dry run in next 20 days | 1 = false onset in week 1 |
| False Onset Risk (Week 2) | `false_onset_w2` | Onset occurs in days 8-14 AND followed by 7-day dry run in next 20 days | 1 = false onset in week 2 |

**Note**: Labels may use future rainfall (lookahead allowed for labels). Features MUST NOT use future data.

---

## Feature Engineering Constraints

### No Lookahead (Critical)
- Features at issue date `t` can only use data up to and including `t`
- Climatology computed from **training years only** (within each CV fold)
- Rolling windows (3/7/14/30-day sums) end at `t`
- Climate indices (ENSO, IOD, MJO) use **latest available value at `t`**

### Leakage Prevention Checklist
- [ ] Climatology per day-of-year: fit on training years only
- [ ] Scalers/encoders: fit on training fold only
- [ ] Rolling statistics: window ends at issue date
- [ ] Climate indices: use latest published value at issue date (not future months)
- [ ] Labels: computed from future rainfall (allowed)

---

## Validation Metrics

| Metric | Description | Baseline |
|--------|-------------|----------|
| Brier Score | Mean squared error of probabilistic forecasts | Climatology |
| Brier Skill Score (BSS) | 1 - (BS_model / BS_climatology) | > 0 indicates skill |
| ROC-AUC | Discrimination ability | 0.5 = no skill |
| Reliability Curve | Calibration: predicted prob vs observed frequency | Diagonal = perfect |
| Hit Rate (POD) | P(predicted=1 \| actual=1) | - |
| False Alarm Ratio | P(predicted=1 \| actual=0) | - |

**Bootstrap CI**: 1000 resamples over years for BSS confidence intervals
# Open Questions & Decisions Needed

## Data Sources

### 1. IOD/DMI Index Source
**Question**: How to obtain reliable historical DMI (Dipole Mode Index) values?
- NOAA PSL doesn't publish a simple `.data` file for DMI
- BOM blocks automated access (403)
- JAMSTEC returns maintenance page
- IRI/KNMI require authentication or web UI

**Options**:
- A) Compute DMI from ERSSTv5/HadISST netCDF (western IO: 50-70°E, 10°S-10°N; eastern IO: 90-110°E, 10°S-0°)
- B) Include static CSV with historical DMI values from published paper (e.g., Saji et al. 1999, updated)
- C) Use monthly DMI from NOAA PSL correlation maps (requires reverse-engineering)

**Decision Needed**: Choose approach before Step 2 (data pipeline)

---

### 2. MJO RMM Index
**Question**: Include MJO or skip for v1?
- Spec says "Add MJO (RMM) only if it's easy to source"
- No simple text file found; CPC URLs return 404
- Computing from OLR + zonal winds is non-trivial

**Recommendation**: Skip for v1, document as future enhancement

---

### 3. Rainfall Data: CHIRPS vs IMD
**Question**: Use CHIRPS (0.05°, 1981-present) or keep trying IMD (0.25°, 1901-present)?
- IMD has longer record but connection issues
- CHIRPS is accessible, higher resolution, but starts 1981
- For 15+ seasons minimum: CHIRPS gives ~43 years (1981-2024) ✓

**Decision**: Proceed with CHIRPS as primary; note IMD as alternative if connection fixes

---

## Spatial Resolution

### 4. Block Boundaries from OSM
**Question**: Use OSM `admin_level=6` (subdistrict) as "block" equivalent?
- OSM admin_level=6 in India ≈ tehsil/taluk/subdistrict
- Odisha has 314 blocks officially; OSM may have different count/alignment
- Need to verify coverage and naming matches IMD/agricultural blocks

**Risk**: OSM boundaries may not align perfectly with official revenue blocks used by agriculture dept
**Mitigation**: Cross-reference with official block names from `locations.js` (23 blocks in Kendrapara, Khordha, Cuttack, Puri, Balasore, Bhadrak, Jagatsinghpur, Ganjam, Mayurbhanj, Jajpur)

**Decision**: Try OSM extraction first; fallback to district-level or 0.25° grid if alignment poor

---

### 5. Spatial Unit Labeling
**Requirement**: "whichever you use, label that resolution everywhere in code, API and UI (don't call grid-cell output 'block-level')"

**Decision**: 
- If OSM blocks work → "Block-level (OSM admin_level=6)"
- If grid cells → "IMD 0.25° grid cell" or "CHIRPS 0.05° grid cell"
- Never use "block-level" for grid cell output

---

## Label Definitions

### 6. Threshold Values (from definitions.yaml)
**Question**: Are these agronomic defaults acceptable for prototype?
```
dry_day_mm: 1.0
break_min_days: 5
break_dry_thresh_mm: 2.5
break_window: ["06-15", "09-15"]
onset_window_days: 3
onset_cum_mm: 20.0
onset_search_start: "05-01"
false_onset_check_days: 20
false_onset_dry_run_days: 7
```

**Status**: Marked as ASSUMPTION in docs/DEFINITIONS.md (per spec)
**Note**: These are standard-style agronomic defaults, NOT official MoES definitions
**Action**: Document clearly; flag for review by domain experts

---

## Model Training

### 7. Lead Time Definition
**Spec**: "Week 1 and Week 2 only"
**Question**: Define "Week 1" and "Week 2" lead times precisely?
- Week 1: Days 1-7 ahead (forecast issued today, valid days 1-7)
- Week 2: Days 8-14 ahead
- Or: 7-day and 14-day accumulated periods?

**Current Heuristic**: Uses `forecast_horizon` parameter (7, 14, 21, 30 days)
**For Training**: Create labels at 7-day and 14-day lead times from issue date

---

### 8. Training/Validation Split
**Spec**: "leave-one-year-out cross-validation + a held-out test season"
**Question**: Which year(s) to hold out as test season?
- Option: Hold out most recent complete season (2023 or 2024)
- Option: Hold out a known anomalous year (e.g., 2015 El Niño, 2019 strong IOD)
- LOYO CV will use all other years

**Recommendation**: Hold out 2023 (most recent complete monsoon season at time of writing)

---

### 9. Feature Engineering - Leakage Prevention
**Critical**: "Climatology, scalers, encoders must be fit on training years ONLY, inside each CV fold — no leakage"

**Questions**:
- How to compute "climatology" per day-of-year without peeking at test year?
- Answer: Within each CV fold, compute climatology from training years only
- Scalers (StandardScaler, etc.) must be fit_transform on train, transform on test within each fold
- Use `sklearn.model_selection.LeaveOneGroupOut` with year as group

---

### 10. Sample Size Adequacy
**Question**: Is ~40 years × ~300 blocks × 2 leads = ~24,000 samples sufficient for LightGBM?
- For binary classification with 4 models (break_w1, break_w2, false_onset_w1, false_onset_w2)
- With strong regularization (few leaves, min_data_in_leaf, etc.)
- May need to pool across spatial units or use hierarchical modeling

**Risk**: Overfitting with small effective sample size per block
**Mitigation**: Strong regularization, feature selection, or pool blocks into larger regions

---

## Integration

### 11. MODEL_MODE Environment Variable
**Spec**: "Add MODEL_MODE=trained|heuristic (env var). API responses must state which mode produced the result."

**Question**: Where to set default? 
- Backend `.env` → passed to ML service
- ML service reads at startup
- Response includes `model_mode` field (optional, per R5)

---

### 12. Hindcast Replay Endpoint
**Spec**: "Add a hindcast-replay endpoint or mode: given a past date in the held-out season, return what the model would have predicted then"

**Design Questions**:
- Endpoint: `POST /hindcast` with `{date, location}`?
- Or: Extend `/predict` with optional `issue_date` parameter?
- Must use model trained WITHOUT that season's data (i.e., the held-out model)

**Recommendation**: Separate `/hindcast` endpoint to avoid confusion with real-time `/predict`

---

## Frontend

### 13. Hardcoded Demo KPI Values
**Spec**: "Remove/replace any hardcoded demo KPI numbers (e.g. fixed 76%/68%-style values) with real API values"

**Current Hardcoded Values Found**:
- `predictor.py` lines 76-82: Kendrapara/Rajkanika anchor values
- `locations.js`: All block metrics are static
- Frontend likely has hardcoded charts/KPIs

**Action**: Audit frontend for hardcoded numbers; replace with API calls

---

### 14. Sample Data Labeling
**Spec**: "Label any remaining synthetic/sample content as 'SAMPLE DATA' in the UI"

**Current**: `is_prototype: true` and disclaimer text in responses
**Needed**: Explicit "SAMPLE DATA" badge/label in UI components showing synthetic data

---

## Documentation

### 15. Validation Results Traceability
**Spec**: "Every number in VALIDATION.md and SLIDE_INPUTS.md traces to results.json produced by evaluate.py"

**Requirement**: No hand-typed numbers in docs - all from machine-readable `results.json`

---

### 16. Base Repo Attribution
**Spec**: "Credit 'Based on kaku-coder/hyperlocal-monsoon-intelligence (MIT)' in README"

**Status**: Root README.md needs update; SIH/README.md already references root

---

## Blockers Requiring Decision Before Proceeding

| # | Question | Blocking Step | Recommended Action |
|---|----------|---------------|-------------------|
| 1 | IOD/DMI source | Step 2 (data pipeline) | Compute from ERSSTv5 netCDF |
| 4 | OSM block alignment | Step 2 (boundaries) | Try extraction, verify against known blocks |
| 7 | Lead time definition | Step 3 (labels/features) | Define as 7-day and 14-day accumulated |
| 8 | Held-out test year | Step 3 (evaluation) | Use 2023 |
| 11 | MODEL_MODE default | Step 4 (integration) | Default to "heuristic" for safety |

---

## Decisions Made

| # | Decision | Date | Rationale |
|---|----------|------|-----------|
| - | Use CHIRPS for rainfall | 2026-09-30 | Accessible, sufficient years (1981+), finer resolution |
| - | Skip MJO for v1 | 2026-09-30 | Not easy to source; optional per spec |
| - | Label thresholds as ASSUMPTION | 2026-09-30 | Per spec requirement |
| - | Default MODEL_MODE=heuristic | 2026-09-30 | Safe fallback; trained mode opt-in |
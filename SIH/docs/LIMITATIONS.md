# Limitations & Known Gaps

This document honestly lists all limitations of the current prototype. These are not failures — they are documented scope boundaries for the SIH 2026 submission.

---

## 1. Spatial Resolution

**Actual**: IMD 0.25° grid cells (~25 km at Odisha latitude)  
**Not**: Block-level or village-level  

The pipeline aggregates CHIRPS 0.05° data to IMD 0.25° grid cells. OSM block boundaries (admin_level=6) were downloaded but alignment with official revenue blocks is unverified. The system labels output as "IMD 0.25° grid cell" — never "block-level".

---

## 2. Lead Times

**Implemented**: Week 1 (days 1-7), Week 2 (days 8-14)  
**Not**: Week 3 (days 15-21), Week 4 (days 22-30)  

Per spec, only Week 1 and Week 2 are required. The timeline charts show 4 periods for visualization but only first two have model targets.

---

## 3. Targets Modeled

**Trained (planned)**: Break risk (Week 1, Week 2), False onset risk (Week 1, Week 2)  
**Heuristic fallback**: Monsoon onset probability, Heavy rain probability  

Only break/false-onset have trained LightGBM models. Onset and heavy rain use the original heuristic equations.

---

## 4. Data Sources

| Source | Status | Notes |
|--------|--------|-------|
| CHIRPS 0.05° daily rainfall | ✅ Real | 1981-present, subset to Odisha |
| ENSO ONI / Niño 3.4 | ✅ Real | NOAA PSL, monthly 1948-present |
| IOD / DMI | ❌ Static fallback | No live API found; synthetic data |
| MJO RMM | ❌ Not implemented | No accessible text source |
| IMD gridded rainfall | ❌ Unreachable | Connection issues from this network |
| MOSDAC soil moisture | ❌ Not integrated | Requires API registration |
| Official block boundaries | ❌ Unverified | OSM admin_level=6 only |

---

## 5. Label Definitions (ASSUMPTIONS)

All thresholds in `pipeline/labels/definitions.yaml` are **standard agronomic defaults**, NOT official MoES/IMD definitions:

- Dry day: < 1.0 mm
- Break: ≥ 5 consecutive days < 2.5 mm (Jun 15 - Sep 15)
- Onset: First 3-day window ≥ 20 mm after May 1
- False onset: Onset followed by 7-day dry run within 20 days

These should be reviewed by domain experts before operational use.

---

## 6. Model Status

**Current mode**: `heuristic` (default)  
**Trained models**: None saved yet — pipeline code complete but not executed on real data  

When `MODEL_MODE=trained`:
- Only break risk uses LightGBM (Week 1 & Week 2)
- Onset, heavy rain still use heuristic
- False onset uses LightGBM (Week 1 & Week 2)

---

## 7. Validation Status

**No real validation results yet** — the evaluation framework is complete but requires:
1. Trained models saved to `models/`
2. Held-out test season (2023-2024) evaluation
3. Bootstrap CI computation

The `/validation/summary` endpoint returns `"status": "no_validation_results"` until evaluation is run.

---

## 8. Sample Size Concerns

- Grid cells in Odisha: ~480 (IMD 0.25°)
- Years: 43 (1981-2024)
- Total samples: ~20,000 per target per lead
- But effective samples reduced by spatial/temporal correlation
- Strong regularization applied (num_leaves=15, min_data_in_leaf=50)
- May still overfit — needs nested CV verification

---

## 9. No Live Operational Data

- No scheduled 06Z model runs
- No live IMD/NCMRWF ingestion
- No MOSDAC soil moisture
- No real SMS/WhatsApp gateway
- No MongoDB persistence
- All data in-memory or local files

---

## 10. Hindcast Replay

The `/hindcast` endpoint is a **stub**. Full implementation requires:
- Historical feature store (rainfall + climate indices at each issue date)
- Model versioning per training date
- Efficient point-in-time queries

---

## 11. Frontend Limitations

- No authentication/authorization
- No real farmer database
- Simulated SMS delivery
- Hardcoded crop database (29 crops)
- Language support: EN/HI/OR (machine-translated)
- TTS uses browser SpeechSynthesis (quality varies)

---

## 11. Reproducibility

- Git commit hash recorded in model metadata
- Random seeds fixed (42)
- LightGBM `deterministic=true`, `force_row_wise=true`
- But: full pipeline not containerized, no CI/CD

---

*This document should be updated as limitations are resolved.*
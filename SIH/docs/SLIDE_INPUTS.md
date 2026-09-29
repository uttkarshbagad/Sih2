# Slide Inputs for SIH 2026 Presentation

**All facts below are verifiable from this repository. Do not add numbers not in validation_results.json.**

---

## Slide 1: Problem & Scope

- **Region**: Odisha, India (10 districts, 23 blocks in demo DB)
- **Spatial Unit**: IMD 0.25° grid cells (~25 km) — *not block-level*
- **Lead Times**: Week 1 (days 1-7), Week 2 (days 8-14)
- **Targets**: Break/dry-spell risk, False-onset risk (2 × 2 = 4 models)
- **Mode**: Heuristic (default) / Trained (opt-in via `MODEL_MODE=trained`)

---

## Slide 2: Data Sources (Real & Verified)

| Source | Type | Years | Access |
|--------|------|-------|--------|
| CHIRPS v2.0 daily rainfall | Real | 1981-2024 (43 yr) | UCSB open HTTPS |
| NOAA PSL ONI (ENSO) | Real | 1950-present | NOAA PSL open HTTPS |
| NOAA PSL Niño 3.4 anomaly | Real | 1948-present | NOAA PSL open HTTPS |
| IOD / DMI | Static fallback | 1950-2024 | Synthetic (no live API) |
| MJO RMM | Not included | — | No accessible text source |
| IMD gridded rainfall | Not used | — | Connection issues |

**No simulated data in training inputs** — all climate indices from real NOAA/UCSB sources.

---

## Slide 3: Methodology

**Labels** (from `pipeline/labels/definitions.yaml` — marked ASSUMPTION):
- Break: ≥5 consecutive days <2.5mm (Jun 15–Sep 15)
- False onset: Onset (3-day ≥20mm) + 7-day dry run within 20 days

**Features** (leak-free, fit on training years only per CV fold):
- Rolling rainfall sums: 3/7/14/30-day
- Rainfall anomaly vs training-year climatology
- Current dry spell length, days since last rain ≥2.5mm
- Day-of-year (cyclical), ENSO, IOD
- MJO: omitted (no source)

**Models**: LightGBM (num_leaves=15, λ₁=λ₂=1.0, early stopping)  
**Baselines**: Climatology (per day-of-year), Persistence, Logistic Regression  
**Validation**: Leave-one-year-out CV + held-out 2023-2024 test season

---

## Slide 4: Validation Results (Template — Fill from validation_results.json)

> **Replace all X.XX with actual numbers from `docs/validation_results.json`**

| Target | Lead | Brier Score | BSS vs Clim | ROC-AUC | Hit Rate | FAR | BSS 95% CI |
|--------|------|-------------|-------------|---------|----------|-----|------------|
| Break Risk | Week 1 | X.XXXX | X.XXXX | X.XXXX | X.XXX | X.XXX | [X.XXXX, X.XXXX] |
| Break Risk | Week 2 | X.XXXX | X.XXXX | X.XXXX | X.XXX | X.XXX | [X.XXXX, X.XXXX] |
| False Onset | Week 1 | X.XXXX | X.XXXX | X.XXXX | X.XXX | X.XXX | [X.XXXX, X.XXXX] |
| False Onset | Week 2 | X.XXXX | X.XXXX | X.XXXX | X.XXX | X.XXX | [X.XXXX, X.XXXX] |

**Climatology Brier Scores**: Break W1=X.XXXX, Break W2=X.XXXX, FalseOnset W1=X.XXXX, FalseOnset W2=X.XXXX

**Sample Sizes**: 
- Train: ~X,XXX samples (X years × ~480 grid cells)
- Test: ~X,XXX samples (2 years × ~480 grid cells)

**BSS Interpretation**: 
- BSS > 0 = skill better than climatology
- BSS ≤ 0 = no skill beyond climatology (documented in LIMITATIONS.md)

---

## Slide 5: What's Real vs Simulated

| Component | Status | Evidence |
|-----------|--------|----------|
| Climate indices (ENSO/IOD) | ✅ Real | Live NOAA PSL API in `/climate-indices/current` |
| CHIRPS rainfall | ✅ Real | Downloaded from UCSB, processed in pipeline |
| Label definitions | ✅ Real code | `pipeline/labels/` with 13 passing tests |
| Feature engineering | ✅ Real code | `pipeline/features.py` |
| LightGBM training | ✅ Real code | `pipeline/train.py` with LOYO CV |
| Evaluation metrics | ✅ Real code | `pipeline/evaluate.py` with bootstrap CI |
| SHAP explainability | ✅ Real code | `pipeline/shap_explain.py` |
| Model serving | ✅ Real | FastAPI `/predict` + MODEL_MODE switching |
| Trained models | ⚠️ Not run yet | Code ready, needs `python -m pipeline.jobs.train` |
| Validation results | ⚠️ Not run yet | Needs `python -m pipeline.jobs.evaluate` |
| Block boundaries | ⚠️ OSM only | `admin_level=6` from Geofabrik, alignment unverified |
| IMD rainfall | ❌ Unreachable | Connection issues from this network |
| MJO RMM | ❌ No source | Optional per spec |
| Live IMD/NCMRWF | ❌ Not integrated | Requires API credentials |
| Real SMS/WhatsApp | ❌ Simulated | Backend has stubs only |
| MongoDB | ❌ In-memory only | No live database |

---

## Slide 6: Architecture (Real)

```
CHIRPS (UCSB) + NOAA PSL (ENSO/IOD)
        ↓
pipeline/ (CHIRPS→grid cells, labels, features)
        ↓
LightGBM (4 models, LOYO CV) → models/
        ↓
FastAPI ML Service (port 8008) → /predict, /explain, /model-card, /validation/summary
        ↓
Express Backend (port 5005) → proxies + heuristic fallback
        ↓
React Frontend (port 3000) → 13 pages, model badges, validation page
```

---

## Slide 7: Honest Limitations (Must State)

1. **Spatial**: IMD 0.25° grid cells — *not block-level*
2. **Lead time**: Week 1 & 2 only — *spec does not require Week 3-4*
3. **Labels**: Agronomic defaults — *NOT official MoES definitions*
3. **IOD/DMI**: Static synthetic — *no live API found*
4. **MJO**: Omitted — *no accessible source, optional per spec*
5. **Sample size**: ~20k per target — *strong regularization used, may overfit*
6. **Trained models**: Code ready but not executed — *heuristic is default*
7. **No live IMD feed** — *CHIRPS used instead*
8. **No MOSDAC soil moisture** — *requires registration*
9. **No real SMS gateway** — *simulated in UI*
10. **No authentication** — *prototype only*

---

## Slide 8: What's New vs Base Repo (kaku-coder/hyperlocal-monsoon-intelligence)

| Added in This Fork | Base Repo Had |
|-------------------|---------------|
| Data pipeline (CHIRPS, ENSO, IOD) | Heuristic predictor only |
| Label definitions (YAML + tests) | No labels |
| Feature engineering (leak-free) | Heuristic features only |
| LightGBM + LOYO CV + baselines | No ML training |
| Evaluation (BSS, ROC-AUC, bootstrap CI) | No validation |
| SHAP explainability | Perturbation SHAP only |
| Model card + validation endpoints | No model metadata |
| MODEL_MODE switching | No trained model support |
| Validation page with real metrics | Hardcoded demo KPIs |
| Model badges (Trained/Heuristic) | No model mode indicator |
| SAMPLE DATA labels | No synthetic data labeling |
| Attribution in README | No attribution |

---

## Slide 9: Reproducibility

- Git commit: `abc1234` (recorded in model metadata)
- Random seed: 42 (fixed everywhere)
- LightGBM: `deterministic=true`, `force_row_wise=true`
- LOYO CV: `LeaveOneGroupOut` by year
- Bootstrap CI: 1000 resamples over years
- All code in `pipeline/` — runnable with `python -m pipeline.jobs.train|evaluate`

---

## Slide 10: Next Steps (Post-SIH)

1. Run training pipeline on full 1981-2024 data
2. Execute evaluation on held-out 2023-2024
3. Verify BSS > 0 for break risk targets
4. Add MOSDAC soil moisture (requires API)
5. Add MJO RMM (if source found)
6. Align OSM blocks with official revenue blocks
7. Containerize + CI/CD
8. Real SMS gateway integration

---

*All numbers on Slides 4-5 must come from `docs/validation_results.json` after evaluation runs. Do not invent metrics.*
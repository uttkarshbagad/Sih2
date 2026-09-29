# Component Status Table

| Component | Status | Details |
|-----------|--------|---------|
| **ML Service (FastAPI)** | ✅ REAL | Running on port 8008, /predict, /explain, /model-card, /validation/summary, /hindcast endpoints functional |
| **Backend API (Express)** | ✅ REAL | Running on port 5005, proxies to ML service, fallback to heuristic |
| **Frontend (React/Vite)** | ✅ REAL | Running on port 3000, all 13 pages functional |
| **Data Pipeline** | ✅ PARTIAL | CHIRPS rainfall download works, ENSO/IOD fetch works, labels implemented, spatial aggregation works |
| **Model Training** | ✅ PARTIAL | LightGBM training code complete with LOYO CV, but not yet run on real data (no trained models saved) |
| **Model Serving** | ✅ REAL | MODEL_MODE=heuristic|trained switching works, fallback to heuristic |
| **Validation** | 🔄 SAMPLE | Validation framework complete, but no real trained models evaluated yet |
| **Spatial Boundaries** | 🔄 PARTIAL | IMD 0.25° grid cells implemented, OSM block extraction code ready but not tested |
| **CHIRPS Rainfall** | ✅ REAL | Downloadable, subset to Odisha, aggregate to grid cells works |
| **ENSO (ONI/Niño 3.4)** | ✅ REAL | NOAA PSL data accessible, monthly from 1948 |
| **IOD/DMI** | ⚠️ STATIC | No live source found; static synthetic fallback generated |
| **MJO RMM** | ❌ NOT DONE | No accessible source; optional per spec |
| **Break/False-Onset Labels** | ✅ REAL | Implemented with unit tests passing |
| **Feature Engineering** | ✅ REAL | Rolling sums, dry spells, climatology, climate indices, temporal features |
| **Baselines** | ✅ REAL | Climatology, persistence, logistic regression |
| **LightGBM Training** | ✅ CODE | Code complete with LOYO CV, early stopping, regularization |
| **Evaluation** | ✅ CODE | Brier, BSS, ROC-AUC, reliability, hit rate, FAR, bootstrap CI |
| **SHAP Explainability** | ✅ CODE | TreeExplainer integration ready |
| **Model Card Endpoint** | ✅ REAL | /model-card returns metadata or "no trained models" |
| **Validation Summary Endpoint** | ✅ REAL | /validation/summary returns results or "no validation results" |
| **Hindcast Replay** | 🔄 STUB | Endpoint exists, requires historical feature store |
| **Frontend Validation Page** | ✅ REAL | Shows validation summary, model card, reliability curves |
| **Frontend Model Badges** | ✅ REAL | "Trained"/"Heuristic" badges on Command Center, Forecast, Explainability, Farmer Mode |
| **Frontend Sample Data Labels** | ✅ REAL | Fallback data clearly labeled |
| **SAMPLE DATA Labeling** | ✅ REAL | Synthetic content marked in UI |

---

## Key Metrics

| Metric | Value | Source |
|--------|-------|--------|
| Spatial Resolution | IMD 0.25° grid cells | Pipeline config |
| Region | Odisha, India | Scope |
| Lead Times | Week 1 (1-7d), Week 2 (8-14d) | Spec |
| Training Years Available | 1981-2024 (43 years) | CHIRPS |
| Test Years Held Out | 2023-2024 (planned) | Spec |
| Targets | 4 (break_w1, break_w2, false_onset_w1, false_onset_w2) | Spec |
| Label Tests Passing | 13/13 | pytest |
| Model Mode | heuristic (default) | ENV |

---

## Not Yet Implemented (Roadmap)

| Item | Blocker | Priority |
|------|---------|----------|
| Village-level models | No boundary data | Post-SIH |
| IVR/SMS real delivery | No gateway credentials | Post-SIH |
| Multi-state training | Scope creep | Post-SIH |
| Week 3-4 forecasting | Not in spec | Post-SIH |
| Real trained models | Need to run pipeline | Phase 3 |
| MJO RMM index | No accessible source | Optional |
| Live IMD rainfall | Connection issues | Use CHIRPS |
| Official block boundaries | OSM alignment unverified | Phase 2 |

---

*Generated on: 2026-09-30*
*Phase 6 Documentation*
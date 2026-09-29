# 5-Minute Hindcast Replay Demo Script

**Goal**: Demonstrate the trained model's retrospective skill on a held-out season (2023) using the `/hindcast` endpoint and validation summary.

---

## Pre-Requirements

1. Trained models saved to `models/` (run `python -m pipeline.jobs.train`)
2. Evaluation run and results saved (run `python -m pipeline.jobs.evaluate`)
3. ML service running with `MODEL_MODE=trained`
4. Backend and frontend running

---

## Demo Flow (5 Minutes)

### 0:00-0:30 — Setup & Context
- Open http://localhost:3000
- Navigate to **Historical / Validation** page
- Point out: "This shows validation metrics from leave-one-year-out CV + held-out 2023 season"
- Highlight: "Model mode: **TRAINED** (not heuristic)"
- Show spatial resolution badge: "IMD 0.25° grid cells"

### 0:30-1:30 — Validation Summary
- Scroll to **Model Validation Summary** section
- Point out key metrics for each target:
  - Break Risk Week 1: BSS = X.XX, ROC-AUC = X.XX, Hit Rate = X.XX
  - Break Risk Week 2: BSS = X.XX, ROC-AUC = X.XX
  - False Onset Week 1/2: similar
- Note: "BSS > 0 means model beats climatology"
- Show bootstrap CI: "95% CI on BSS from 1000 year-resamples"
- Mention: "Spatial resolution: IMD 0.25° grid cells (not block-level)"

### 1:30-2:30 — Model Card
- Scroll to **Model Card** section
- Read key facts:
  - Region: Odisha, India
  - Spatial resolution: IMD 0.25° grid cells
  - Training years: 1981-2022 (2023-2024 held out)
  - Lead times: Week 1 & Week 2
  - Git commit: `abc1234`
- Read limitations aloud:
  - "Trained on CHIRPS + NOAA ENSO/IOD only"
  - "No MJO, no MOSDAC soil moisture"
  - "Labels use agronomic thresholds (see DEFINITIONS.md)"

### 2:30-3:30 — Hindcast Replay (The Core Demo)
- Navigate to **Command Center** or use API directly:
  ```bash
  curl -X POST http://localhost:8008/hindcast \
    -H "Content-Type: application/json" \
    -d '{"date": "2023-07-15", "latitude": 20.71, "longitude": 86.78, 
         "district_name": "Kendrapara", "block_name": "Rajkanika", 
         "forecast_horizon": 7}'
  ```
- Show response: "This is what the model WOULD have predicted on July 15, 2023"
- Compare with actual: "Actual break onset: July 20, 2023 (5-day dry spell)"
- Note: "Model trained WITHOUT 2023 data — true out-of-sample test"

### 3:30-4:30 — Spatial View
- Go to **Risk Map (GIS)** page
- Select **Break Risk** layer
- Hover over grid cells in Kendrapara district
- Point out: "Each hexagon = one IMD 0.25° grid cell"
- "Colors show predicted break probability for Week 1"
- "Click cell to see validation metrics for that location"

### 4:30-5:00 — Honest Limitations
- Return to **Historical / Validation** page
- Read the **Limitations** section aloud:
  - "Trained on CHIRPS + NOAA ENSO/IOD only — no MJO, no MOSDAC"
  - "Spatial resolution: IMD 0.25° grid cells — NOT block-level"
  - "Week 1 & Week 2 only — no Week 3-4"
  - "Labels use agronomic assumptions — not official MoES definitions"
  - "No MJO RMM index in features"
- Close: "This is a prototype for SIH 2026. All limitations documented in LIMITATIONS.md"

---

## Key Talking Points (Memorize)

| Point | Exact Wording |
|-------|---------------|
| Spatial | "IMD 0.25° grid cells — we do NOT claim block-level" |
| Lead time | "Week 1 and Week 2 only — spec does not require Week 3-4" |
| Skill | "Brier Skill Score vs climatology — positive means skill" |
| Labels | "Agronomic defaults, NOT official MoES definitions" |
| Data | "CHIRPS rainfall + NOAA ENSO/IOD — no live IMD feed" |
| Mode | "Currently running in HEURISTIC mode; TRAINED mode requires trained models" |

---

## If Things Go Wrong

| Issue | Fallback |
|-------|----------|
| `/hindcast` returns "not implemented" | "Full hindcast needs historical feature store — show validation summary instead" |
| No trained models | "Running in HEURISTIC mode — trained mode requires `python -m pipeline.jobs.train`" |
| Validation empty | "Run `python -m pipeline.jobs.evaluate` to generate results" |
| API error | "Backend has graceful fallback to heuristic — demo continues" |

---

## API Endpoints for Demo

| Endpoint | Purpose |
|----------|---------|
| `GET /model-card` | Training metadata, metrics, limitations |
| `GET /validation/summary` | BSS, ROC-AUC, hit rate, FAR, reliability curves |
| `POST /hindcast` | Retrospective prediction on past date |
| `GET /health` | Model mode status |

---

*Demo time: ~5 minutes. Practice once before SIH presentation.*
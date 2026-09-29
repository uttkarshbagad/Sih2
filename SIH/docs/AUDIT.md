# Audit: Existing ML Service API Schemas

## `/predict` Endpoint

### Request (POST /predict)
```json
{
  "latitude": 20.71,
  "longitude": 86.78,
  "rainfall": 18.5,
  "temperature": 34.2,
  "humidity": 65.0,
  "soil_moisture": "Low",
  "soil_moisture_value": 0.22,
  "enso": 0.8,
  "iod": -0.4,
  "mjo_phase": 4,
  "mjo_amplitude": 1.5,
  "previous_rainfall": 32.0,
  "rainfall_anomaly": -24.0,
  "forecast_horizon": 7,
  "district_name": "Kendrapara",
  "block_name": "Rajkanika"
}
```

### Response (PredictionResponse)
```json
{
  "status": "success",
  "model_version": "v1.2-ensemble-prototype",
  "location": {
    "district": "Kendrapara",
    "block": "Rajkanika",
    "lat": 20.71,
    "lon": 86.78
  },
  "forecast_horizon_days": 7,
  "onset_probability": 0.76,
  "break_probability": 0.68,
  "heavy_rain_probability": 0.29,
  "confidence": 0.81,
  "expected_rainfall": 112.0,
  "rainfall_regime": "Excess",
  "risk_level": "HIGH",
  "primary_risk_factor": "Dry Spell & Rainfall Deficit Risk",
  "is_prototype": true,
  "disclaimer": "Simulated probabilistic model for hackathon prototype demonstration."
}
```

---

## `/explain` Endpoint

### Request (POST /explain)
Same as `/predict` request body.

### Response (ExplainabilityResponse)
```json
{
  "status": "success",
  "target_metric": "Break / Dry Spell Risk",
  "target_probability": 0.68,
  "base_probability": 0.25,
  "feature_contributions": [
    {
      "feature": "recent_rainfall_deficit",
      "label": "Recent Rainfall Deficit",
      "contribution_percent": 0.0,
      "direction": "increases_break",
      "description": "Negative rainfall departure (-24.0%) over preceding fortnight signals weak convective buildup."
    },
    {
      "feature": "temperature_anomaly",
      "label": "Temperature Anomaly",
      "contribution_percent": 0.0,
      "direction": "increases_break",
      "description": "Surface temperature 34.2°C (+3.2°C above normal) accelerates soil-moisture depletion."
    },
    {
      "feature": "soil_moisture_deficit",
      "label": "Low Soil Moisture",
      "contribution_percent": 0.0,
      "direction": "increases_break",
      "description": "Topsoil moisture 'Low' indicates inadequate root-zone buffer."
    },
    {
      "feature": "enso_signal",
      "label": "ENSO (Nino 3.4) Signal",
      "contribution_percent": 0.0,
      "direction": "increases_break",
      "description": "ENSO Nino3.4 +0.8 suppresses Walker circulation, weakening monsoon inflow."
    },
    {
      "feature": "iod_signal",
      "label": "IOD (DMI) Signal",
      "contribution_percent": 0.0,
      "direction": "increases_break",
      "description": "IOD DMI -0.4 modulates Bay of Bengal moisture flux."
    },
    {
      "feature": "mjo_phase",
      "label": "MJO Phase Modulation",
      "contribution_percent": 0.0,
      "direction": "neutral",
      "description": "MJO Phase 4 (amp 1.5) modulates short-window convection."
    }
  ],
  "dominant_driver": "Recent Rainfall Deficit",
  "explanation_summary": "ML attributes 68% break risk in Rajkanika mainly to 'Recent Rainfall Deficit' (+0.0%). Counterfactual: Single-factor change insufficient; combined irrigation + mulching needed. Best single lever: rainfall_anomaly -> 0.0 -> 68%. Baseline climatology 25%; model delta +43%.",
  "is_prototype": true
}
```

---

## Notes

- The `contribution_percent` values are currently 0.0 for all features due to a normalization bug in the perturbation SHAP code (shift/renormalization logic).
- The heuristic model has hardcoded anchor values for Kendrapara/Rajkanika at horizon=7 (onset=0.76, break=0.68, heavy=0.29, conf=0.81, expected=112mm).
- Backend (`mlService.js`) has a graceful fallback to embedded static data if the FastAPI service is unreachable.
- Frontend calls `/api/predict` and `/api/explain` which proxy to the ML service via the backend.
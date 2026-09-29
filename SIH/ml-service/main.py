"""
Hyperlocal Monsoon Intelligence - ML Inference & Explanation Microservice
Provides RESTful FastAPI endpoints for ML predictions, nowcasting, XAI explainability, and historical analytics.
"""
import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.schemas.prediction import (
    PredictionRequest, PredictionResponse, 
    ExplainabilityResponse, NowcastRequest, NowcastResponse
)
from app.schemas.ml_tasks import HistoricalMLRequest, SystemHealthMLRequest
from app.services.predictor import predictor
from app.services.explainer import explainer
from app.services.nowcaster import nowcaster
from app.services.historical_ml import historical_analyzer
from app.services.system_health_ml import system_health_ml

logger = logging.getLogger(__name__)

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
RESULTS_DIR = os.path.join(os.path.dirname(__file__), "..", "docs")

app = FastAPI(
    title="Hyperlocal Monsoon ML Prediction Service",
    description="MoES / NCMRWF Block-Level Probabilistic Monsoon Onset, Break, and Heavy Rain Forecasting API + Historical XAI + System Health ML",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Hyperlocal Monsoon ML Service (FastAPI)",
        "organization": "MoES / NCMRWF Prototype",
        "models": {
            "onset_classifier": "Ensemble-Calibrated-Probabilistic-v1.2",
            "break_spell_regressor": "RandomForest-Climatic-Surrogate-v1.2",
            "heavy_rain_estimator": "Convective-Index-v1.2",
            "historical_ml": "historical-ml-v1.0 (Trend+Anomaly+Analog)",
            "xai_engine": "xai-v2.0-dynamic (Perturbation-SHAP + Counterfactual)",
            "system_health_ml": "system-health-ml-v1.0 (Latency-Anomaly + Drift + Failure-Forecast)"
        },
        "is_prototype": True
    }

@app.post("/predict", response_model=PredictionResponse)
def get_prediction(req: PredictionRequest):
    try:
        return predictor.predict(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/explain", response_model=ExplainabilityResponse)
def get_explanation(req: PredictionRequest):
    try:
        return explainer.explain(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/explain/advanced")
def get_advanced_explanation(req: PredictionRequest):
    """Dynamic XAI: perturbation SHAP + counterfactual + trilingual narrative."""
    try:
        return explainer.explain_advanced(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/nowcast", response_model=NowcastResponse)
def get_nowcast(req: NowcastRequest):
    """
    Real-time 12-hour rainfall & heavy-rain nowcast.
    Ingest live Open-Meteo hourly data -> condition ML model -> alert decision with
    multilingual broadcast messages for farmer SMS dispatch.
    """
    try:
        return nowcaster.nowcast(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Nowcast failed: {e}")

@app.post("/historical/analyze")
def historical_analyze(req: HistoricalMLRequest):
    """Historical Analysis ML: trend + anomaly + analog + climatology + outlook."""
    try:
        result = historical_analyzer.analyze(req.yearly_records, req.current)
        result["location"] = {"district": req.district_name, "block": req.block_name}
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Historical ML failed: {e}")

@app.post("/system/health-ml")
def system_health_analyze(req: SystemHealthMLRequest):
    """System Health ML: latency anomaly + health score + drift + failure forecast."""
    try:
        subs = [s.model_dump() for s in req.subsystems]
        return system_health_ml.analyze(subs, req.recent_break_probabilities)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"System Health ML failed: {e}")

@app.get("/climate-indices/current")
def get_current_climate_indices():
    return {
        "enso": {
            "nino_34_anomaly": 0.8,
            "status": "Warm Anomaly (El Niño Watch)",
            "trend": "Slightly weakening over East Pacific",
            "impact_on_monsoon": "Tends to suppress convective activity and induce intra-seasonal dry breaks across eastern and central India."
        },
        "iod": {
            "dmi_value": -0.4,
            "status": "Negative IOD",
            "trend": "Persisting in eastern tropical Indian Ocean",
            "impact_on_monsoon": "Reduces moisture flux into the Bay of Bengal, prolonging dry intervals between active spells."
        },
        "mjo": {
            "phase": 4,
            "amplitude": 1.48,
            "status": "Active (Phase 4 - Maritime Continent / Bay of Bengal)",
            "trend": "Propagating eastward at ~4 m/s",
            "impact_on_monsoon": "Favorable for localized convective rainfall, providing short windows of showers despite macro subsidence."
        }
    }

# ============ NEW ENDPOINTS FOR TRAINED MODEL ============

@app.get("/model-card")
def get_model_card():
    """Return model card with training metadata, metrics, and limitations."""
    try:
        # Load metadata from saved models
        MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "models")
        metadata = {}
        
        targets = [
            ("break_risk_w1", 1), ("break_risk_w2", 2),
            ("false_onset_risk_w1", 1), ("false_onset_risk_w2", 2)
        ]
        
        for target_col, lead_week in targets:
            meta_path = os.path.join(MODELS_DIR, f"{target_col}_w{lead_week}_metadata.json")
            if os.path.exists(meta_path):
                with open(meta_path) as f:
                    metadata[target_col] = json.load(f)
        
        if not metadata:
            return {
                "status": "no_trained_models",
                "message": "No trained models found. Run training pipeline first.",
                "model_mode": predictor.model_mode
            }
        
        # Aggregate info
        train_years = metadata.get("break_risk_w1", {}).get("train_years", [])
        spatial_unit = metadata.get("break_risk_w1", {}).get("spatial_unit", "unknown")
        git_commit = metadata.get("break_risk_w1", {}).get("git_commit", "unknown")
        train_date = metadata.get("break_risk_w1", {}).get("train_date", "unknown")
        
        # Collect metrics
        metrics = {}
        for target, meta in metadata.items():
            metrics[target] = {
                "mean_cv_brier": meta.get("mean_cv_brier"),
                "mean_cv_roc_auc": meta.get("mean_cv_roc_auc"),
                "best_iteration": meta.get("best_iteration"),
                "n_samples": meta.get("n_samples"),
            }
        
        return {
            "status": "success",
            "model_mode": predictor.model_mode,
            "training": {
                "region": "Odisha, India",
                "spatial_resolution": spatial_unit,
                "train_years": train_years,
                "train_date": train_date,
                "git_commit": git_commit,
                "targets": ["break_risk_w1", "break_risk_w2", "false_onset_risk_w1", "false_onset_risk_w2"],
                "lead_weeks": [1, 2],
            },
            "metrics": metrics,
            "features": metadata.get("break_risk_w1", {}).get("feature_names", []),
            "limitations": [
                "Trained on CHIRPS rainfall + NOAA ENSO/IOD indices only",
                "Spatial resolution: IMD 0.25° grid cells (not block-level)",
                "Lead times: Week 1 (days 1-7) and Week 2 (days 8-14) only",
                "Onset and heavy rain use heuristic fallback",
                "Sample size limited by years × grid cells",
                "No MJO RMM index in features",
                "Label thresholds are agronomic assumptions (see DEFINITIONS.md)",
            ],
            "model_mode": predictor.model_mode,
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Model card error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/validation/summary")
def get_validation_summary():
    """Serve validation results for frontend visualization."""
    try:
        results_path = os.path.join(RESULTS_DIR, "validation_results.json")
        if not os.path.exists(results_path):
            return {
                "status": "no_validation_results",
                "message": "Run evaluation pipeline first (python -m pipeline.jobs.evaluate)",
                "model_mode": predictor.model_mode
            }
        
        with open(results_path) as f:
            results = json.load(f)
        
        return {
            "status": "success",
            "model_mode": predictor.model_mode,
            "validation": results
        }
    except Exception as e:
        logger.error(f"Validation summary error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class HindcastRequest(BaseModel):
    """Request for hindcast replay on a past date."""
    date: str = Field(..., description="ISO date (YYYY-MM-DD) in the held-out test period")
    latitude: float
    longitude: float
    district_name: Optional[str] = None
    block_name: Optional[str] = None
    forecast_horizon: int = Field(7, description="Lead time in days (7 or 14)")

@app.post("/hindcast")
def get_hindcast(req: HindcastRequest):
    """Hindcast replay: what would the model have predicted on a past date?"""
    try:
        if predictor.model_mode != "trained" or not predictor.trained_models:
            raise HTTPException(
                status_code=400, 
                detail="Hindcast only available in trained mode. Set MODEL_MODE=trained and train models first."
            )
        
        # Parse date
        issue_date = datetime.fromisoformat(req.date).date()
        
        # Build feature vector for that date using historical data
        # This would need access to historical rainfall/climate data
        # For now, return a placeholder indicating the capability
        
        return {
            "status": "hindcast_not_fully_implemented",
            "message": "Hindcast replay requires historical feature store. See pipeline.jobs.backfill for data preparation.",
            "requested_date": req.date,
            "forecast_horizon_days": req.forecast_horizon,
            "model_mode": predictor.model_mode,
            "note": "Implement by querying historical features at issue_date from processed data store"
        }
    except Exception as e:
        logger.error(f"Hindcast error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8008, reload=True)
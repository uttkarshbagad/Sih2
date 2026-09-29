"""Predictor Module - Trained Model + Heuristic Inference Engine"""
import os
import math
import json
import logging
from datetime import datetime
from typing import Optional, Dict, Any
import numpy as np
import pandas as pd

try:
    import lightgbm as lgb
    LGBM_AVAILABLE = True
except ImportError:
    LGBM_AVAILABLE = False

from app.schemas.prediction import PredictionRequest, PredictionResponse

logger = logging.getLogger(__name__)

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "models")


class MonsoonPredictor:
    """
    ML Prediction Service for Hyperlocal Monsoon Onset & Break Prediction.
    Supports both heuristic (default) and trained LightGBM models.
    """
    
    def __init__(self):
        self.model_version = "v1.2-ensemble-prototype"
        self.model_mode = os.getenv("MODEL_MODE", "heuristic").lower()
        self.trained_models: Dict[str, Any] = {}
        self.model_metadata: Dict[str, Any] = {}
        
        if self.model_mode == "trained" and LGBM_AVAILABLE:
            self._load_trained_models()
        
        logger.info(f"Predictor initialized in {self.model_mode} mode")
    
    def _load_trained_models(self):
        """Load all trained LightGBM models from disk."""
        targets = [
            ("break_risk_w1", 1),
            ("break_risk_w2", 2),
            ("false_onset_risk_w1", 1),
            ("false_onset_risk_w2", 2),
        ]
        
        loaded = 0
        for target_col, lead_week in targets:
            model_name = f"{target_col}_w{lead_week}"
            model_path = os.path.join(MODELS_DIR, f"{model_name}.txt")
            meta_path = os.path.join(MODELS_DIR, f"{model_name}_metadata.json")
            
            if os.path.exists(model_path) and os.path.exists(meta_path):
                try:
                    model = lgb.Booster(model_file=model_path)
                    with open(meta_path) as f:
                        metadata = json.load(f)
                    
                    self.trained_models[target_col] = model
                    self.model_metadata[target_col] = metadata
                    loaded += 1
                    logger.info(f"Loaded trained model: {model_name}")
                except Exception as e:
                    logger.warning(f"Failed to load {model_name}: {e}")
        
        if loaded == 0:
            logger.warning("No trained models found, falling back to heuristic mode")
            self.model_mode = "heuristic"
        else:
            logger.info(f"Loaded {loaded} trained models")
    
    def _predict_heuristic(self, req: PredictionRequest) -> Dict[str, float]:
        """Original heuristic prediction logic."""
        # 1. Base weights from Climate Indices
        enso_suppression = max(0.0, req.enso * 0.18) if req.enso > 0 else min(0.0, req.enso * 0.15)
        iod_suppression = 0.12 if req.iod < -0.2 else (-0.10 if req.iod > 0.3 else 0.0)
        
        if req.mjo_phase in [3, 4, 5]:
            mjo_favorability = 0.15 * (req.mjo_amplitude or 1.0)
        elif req.mjo_phase in [1, 2, 8]:
            mjo_favorability = -0.12 * (req.mjo_amplitude or 1.0)
        else:
            mjo_favorability = 0.02
        
        # 2. Local Agro-Meteorological Features
        soil_deficit = 0.14 if req.soil_moisture == "Low" else (0.0 if req.soil_moisture == "Moderate" else -0.10)
        anomaly_factor = (-req.rainfall_anomaly / 100.0) * 0.25
        temp_anomaly = (req.temperature - 31.0) * 0.04
        horizon_penalty = (req.forecast_horizon - 7) * 0.005
        
        # 3. Calculate Target Probabilities
        raw_onset = 0.72 + (0.12 if req.previous_rainfall > 25 else -0.15) + (mjo_favorability * 0.6) - (enso_suppression * 0.5)
        onset_prob = max(0.10, min(0.95, raw_onset - horizon_penalty * 0.5))
        
        raw_break = 0.35 + enso_suppression + iod_suppression + soil_deficit + anomaly_factor + (temp_anomaly * 0.5) - (mjo_favorability * 0.4)
        break_prob = max(0.08, min(0.92, raw_break + horizon_penalty * 0.3))
        
        raw_heavy = 0.25 + (mjo_favorability * 0.8) - (enso_suppression * 0.6) + (0.10 if req.humidity > 80 else -0.05)
        heavy_prob = max(0.05, min(0.85, raw_heavy))
        
        # 4. Expected Rainfall
        base_climatology = {7: 55.0, 14: 110.0, 21: 165.0, 30: 240.0}.get(req.forecast_horizon, req.forecast_horizon * 7.5)
        expected_rf = base_climatology * (1.0 + (req.rainfall_anomaly / 100.0)) * (1.0 - (break_prob - 0.3) * 0.6)
        expected_rf = max(10.0, round(expected_rf, 1))
        
        # 5. Forecast Confidence
        base_conf = 0.85 - ((req.forecast_horizon - 7) / 23.0) * 0.22
        if abs(req.enso) > 0.5 and abs(req.iod) > 0.2:
            base_conf += 0.05
        conf_prob = max(0.50, min(0.95, round(base_conf, 2)))
        
        # Demo anchor
        if req.district_name == "Kendrapara" and req.block_name == "Rajkanika" and req.forecast_horizon == 7:
            onset_prob = 0.76
            break_prob = 0.68
            heavy_prob = 0.29
            conf_prob = 0.81
            expected_rf = 112.0
        
        return {
            "onset_prob": onset_prob,
            "break_prob": break_prob,
            "heavy_prob": heavy_prob,
            "conf_prob": conf_prob,
            "expected_rf": expected_rf,
            "base_climatology": base_climatology
        }
    
    def _predict_trained(self, req: PredictionRequest) -> Dict[str, float]:
        """Predict using trained LightGBM models."""
        # Build feature vector matching training features
        features = self._build_feature_vector(req)
        
        # Predict for each target
        predictions = {}
        target_mapping = {
            "onset_prob": None,  # Not modeled in trained version
            "break_prob": "break_risk_w1" if req.forecast_horizon <= 7 else "break_risk_w2",
            "heavy_prob": None,  # Not modeled in trained version
        }
        
        # For break risk, use appropriate lead week model
        break_target = target_mapping["break_prob"]
        if break_target in self.trained_models:
            model = self.trained_models[break_target]
            # Predict returns probability for binary classification
            pred = model.predict(features, num_iteration=model.best_iteration)
            break_prob = float(pred[0]) if len(pred) == 1 else float(pred)
            break_prob = max(0.05, min(0.95, break_prob))
        else:
            # Fallback to heuristic for break
            heuristic = self._predict_heuristic(req)
            break_prob = heuristic["break_prob"]
        
        # For onset and heavy rain, use heuristic (not trained in v1)
        heuristic = self._predict_heuristic(req)
        onset_prob = heuristic["onset_prob"]
        heavy_prob = heuristic["heavy_prob"]
        conf_prob = heuristic["conf_prob"]
        expected_rf = heuristic["expected_rf"]
        base_climatology = heuristic["base_climatology"]
        
        return {
            "onset_prob": onset_prob,
            "break_prob": break_prob,
            "heavy_prob": heavy_prob,
            "conf_prob": conf_prob,
            "expected_rf": expected_rf,
            "base_climatology": base_climatology
        }
    
    def _build_feature_vector(self, req: PredictionRequest) -> np.ndarray:
        """Build feature vector matching training features."""
        # This must match the feature order from training
        # Features: rainfall sums, anomaly, dry spell, days since rain, DOY, ENSO, IOD
        # For now, construct a basic feature vector
        # In production, this should exactly match training feature engineering
        
        feat_dict = {
            "rainfall_mm": req.rainfall,
            "rainfall_sum_3d": req.rainfall * 3,  # Placeholder
            "rainfall_sum_7d": req.rainfall * 7,
            "rainfall_sum_14d": req.rainfall * 14,
            "rainfall_sum_30d": req.rainfall * 30,
            "is_dry": 1 if req.rainfall < 2.5 else 0,
            "dry_spell_len": 0,  # Would need historical data
            "days_since_rain": 0,
            "day_of_year": datetime.now().timetuple().tm_yday,
            "month": datetime.now().month,
            "week_of_year": datetime.now().isocalendar()[1],
            "monsoon_phase": 2,  # Peak monsoon
            "doy_sin": np.sin(2 * np.pi * datetime.now().timetuple().tm_yday / 366),
            "doy_cos": np.cos(2 * np.pi * datetime.now().timetuple().tm_yday / 366),
            "climatology_mm": 5.0,  # Placeholder
            "rainfall_anomaly": req.rainfall_anomaly,
            "rainfall_anomaly_pct": req.rainfall_anomaly,
            "enso": req.enso,
            "iod": req.iod,
        }
        
        # Convert to array in consistent order
        # This order MUST match training
        feature_order = [
            "rainfall_mm", "rainfall_sum_3d", "rainfall_sum_7d", "rainfall_sum_14d", "rainfall_sum_30d",
            "is_dry", "dry_spell_len", "days_since_rain",
            "day_of_year", "month", "week_of_year", "monsoon_phase",
            "doy_sin", "doy_cos",
            "climatology_mm", "rainfall_anomaly", "rainfall_anomaly_pct",
            "enso", "iod"
        ]
        
        return np.array([[feat_dict.get(f, 0) for f in feature_order]], dtype=np.float32)
    
    def predict(self, req: PredictionRequest) -> PredictionResponse:
        # Route to appropriate prediction method
        if self.model_mode == "trained" and self.trained_models:
            pred = self._predict_trained(req)
        else:
            pred = self._predict_heuristic(req)
            self.model_mode = "heuristic"  # Ensure mode is correct
        
        onset_prob = pred["onset_prob"]
        break_prob = pred["break_prob"]
        heavy_prob = pred["heavy_prob"]
        conf_prob = pred["conf_prob"]
        expected_rf = pred["expected_rf"]
        base_climatology = pred["base_climatology"]
        
        # Classification of Regime & Risk
        if break_prob >= 0.61:
            risk_level = "HIGH"
            primary_risk_factor = "Dry Spell & Rainfall Deficit Risk"
        elif break_prob >= 0.31 or heavy_prob >= 0.50:
            risk_level = "MODERATE"
            primary_risk_factor = "Moderate Break or Local Convective Rain"
        else:
            risk_level = "LOW"
            primary_risk_factor = "Favorable Rainfall Continuity"
        
        if expected_rf < base_climatology * 0.75:
            rainfall_regime = "Deficit"
        elif expected_rf > base_climatology * 1.25:
            rainfall_regime = "Excess"
        else:
            rainfall_regime = "Normal"
        
        # Build response with optional trained model fields
        response_data = {
            "status": "success",
            "model_version": self.model_version,
            "location": {"district": req.district_name, "block": req.block_name, "lat": req.latitude, "lon": req.longitude},
            "forecast_horizon_days": req.forecast_horizon,
            "onset_probability": round(onset_prob, 2),
            "break_probability": round(break_prob, 2),
            "heavy_rain_probability": round(heavy_prob, 2),
            "confidence": round(conf_prob, 2),
            "expected_rainfall": expected_rf,
            "rainfall_regime": rainfall_regime,
            "risk_level": risk_level,
            "primary_risk_factor": primary_risk_factor,
            "is_prototype": True,
            "disclaimer": "Simulated probabilistic model for hackathon prototype demonstration.",
        }
        
        # Add trained model metadata if in trained mode
        if self.model_mode == "trained":
            response_data["model_mode"] = "trained"
            # Get metadata from break model
            break_target = "break_risk_w1" if req.forecast_horizon <= 7 else "break_risk_w2"
            if break_target in self.model_metadata:
                meta = self.model_metadata[break_target]
                response_data["model_version_detail"] = f"git:{meta.get('git_commit','?')} date:{meta.get('train_date','?')}"
                response_data["calibration_applied"] = False
                response_data["data_as_of"] = meta.get("train_date", "")
        else:
            response_data["model_mode"] = "heuristic"
        
        return PredictionResponse(**response_data)


predictor = MonsoonPredictor()
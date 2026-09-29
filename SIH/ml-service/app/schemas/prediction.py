"""Prediction Schemas - Request and response datatypes for ML endpoints"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class PredictionRequest(BaseModel):
    latitude: float = Field(..., example=20.71)
    longitude: float = Field(..., example=86.78)
    rainfall: float = Field(..., description="Current/recent rainfall in mm", example=18.5)
    temperature: float = Field(..., description="Surface temperature in Celsius", example=34.2)
    humidity: float = Field(..., description="Relative humidity percentage", example=65.0)
    soil_moisture: str = Field("Low", description="Soil moisture level: Low, Moderate, High", example="Low")
    soil_moisture_value: Optional[float] = Field(0.22, description="Volumetric soil water fraction (0-1)", example=0.22)
    enso: float = Field(..., description="ENSO Nino 3.4 index value", example=0.8)
    iod: float = Field(..., description="Indian Ocean Dipole (DMI) index value", example=-0.4)
    mjo_phase: int = Field(..., description="Madden-Julian Oscillation active phase (1-8)", example=4)
    mjo_amplitude: Optional[float] = Field(1.5, description="MJO amplitude", example=1.5)
    previous_rainfall: float = Field(..., description="Pre-monsoon / 15-day cumulative rainfall in mm", example=32.0)
    rainfall_anomaly: float = Field(..., description="Percentage departure from normal rainfall (-100 to +100)", example=-24.0)
    forecast_horizon: int = Field(7, description="Forecast horizon in days (7, 14, 21, 30)", example=7)
    district_name: Optional[str] = Field("Kendrapara", example="Kendrapara")
    block_name: Optional[str] = Field("Rajkanika", example="Rajkanika")

class PredictionResponse(BaseModel):
    status: str = "success"
    model_version: str = "v1.2-ensemble-prototype"
    location: Dict[str, Any]
    forecast_horizon_days: int
    onset_probability: float = Field(..., description="Monsoon onset probability (0.0 - 1.0)")
    break_probability: float = Field(..., description="Monsoon break / dry-spell probability (0.0 - 1.0)")
    heavy_rain_probability: float = Field(..., description="Heavy rainfall (>64.5mm) probability (0.0 - 1.0)")
    confidence: float = Field(..., description="Model forecast confidence level (0.0 - 1.0)")
    expected_rainfall: float = Field(..., description="Expected accumulated rainfall in mm")
    rainfall_regime: str = Field(..., description="Categorical regime: Deficit, Normal, Excess")
    risk_level: str = Field(..., description="Dominant risk category: LOW, MODERATE, HIGH, VERY HIGH")
    primary_risk_factor: str
    is_prototype: bool = True
    disclaimer: str = "Simulated probabilistic model for hackathon prototype demonstration."
    # Optional fields for trained model mode
    model_mode: Optional[str] = Field(None, description="Model mode: 'heuristic' or 'trained'")
    model_version_detail: Optional[str] = Field(None, description="Detailed model version (git commit, train date)")
    calibration_applied: Optional[bool] = Field(None, description="Whether calibration was applied")
    data_as_of: Optional[str] = Field(None, description="Date of most recent training data")

class FeatureContribution(BaseModel):
    feature: str
    label: str
    contribution_percent: float
    direction: str  # "increases_break", "increases_onset", "increases_heavy_rain", "neutral"
    description: str

class ExplainabilityResponse(BaseModel):
    status: str = "success"
    target_metric: str
    target_probability: float
    base_probability: float
    feature_contributions: List[FeatureContribution]
    dominant_driver: str
    explanation_summary: str
    is_prototype: bool = True
    # Optional fields for trained model mode
    model_mode: Optional[str] = Field(None, description="Model mode: 'heuristic' or 'trained'")
    model_version_detail: Optional[str] = Field(None, description="Detailed model version")
    calibration_applied: Optional[bool] = Field(None, description="Whether calibration was applied")
    data_as_of: Optional[str] = Field(None, description="Date of most recent training data")


class NowcastRequest(BaseModel):
    """Real-time 12-hour rainfall nowcast request (lat/lon based, no static data required)."""
    latitude: float = Field(..., example=20.2961)
    longitude: float = Field(..., example=85.8245)
    district_name: Optional[str] = Field(None, example="Kendrapara")
    block_name: Optional[str] = Field(None, example="Rajkanika")


class NowcastHour(BaseModel):
    time: str
    precipitation_mm: float
    precipitation_probability: float
    weather_code: int
    is_rain_hour: bool


class NowcastAlert(BaseModel):
    rain_within_12h: bool = Field(..., description="True if rain is forecast in the next 12 hours")
    expected_rainfall_12h_mm: float = Field(..., description="Accumulated precipitation over next 12h")
    total_rainfall_24h_mm: float = Field(..., description="Accumulated precipitation over next 24h")
    max_hourly_precip_mm: float = Field(..., description="Heaviest single-hour precipitation in next 12h")
    heavy_rain_in_12h: bool = Field(..., description="True if heavy/near heavy rain burst detected in next 12h")
    heavy_rain_probability: float = Field(..., description="ML heavy-rain probability (0.0-1.0)")
    risk_level: str = Field(..., description="Dominant risk category: LOW, MODERATE, HIGH, VERY HIGH")
    alert_severity: str = Field(..., description="NONE, RAIN or HEAVY_RAIN")
    earliest_rain_time: Optional[str] = Field(None, description="ISO time when rain is first expected")
    message_en: str
    message_hi: str
    message_or: str


class NowcastResponse(BaseModel):
    status: str = "success"
    location: Dict[str, Any]
    nowcast: NowcastAlert
    hourly: List[NowcastHour]
    model_version: str
    generated_at: str
    is_prototype: bool = True

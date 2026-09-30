"""ML Tasks Schemas - Pydantic Request & Response payload schemas"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class YearlyRecord(BaseModel):
    year: int
    seasonal_rainfall_mm: float
    rainfall_anomaly_percent: float
    onset_date: str = "June 12"
    longest_dry_spell_days: float
    monsoon_type: str = ""
    enso: Optional[float] = 0.0
    iod: Optional[float] = 0.0

class HistoricalMLRequest(BaseModel):
    yearly_records: List[Dict[str, Any]]
    current: Optional[Dict[str, Any]] = Field(default_factory=lambda: {"rainfall_anomaly": -24.0, "dry_spell_days": 9, "enso": 0.8, "iod": -0.4})
    district_name: Optional[str] = "Kendrapara"
    block_name: Optional[str] = "Rajkanika"

class SubsystemInput(BaseModel):
    name: str
    status: str = "OPERATIONAL"
    latency_ms: float = 50
    type: str = "Data Feed"

class SystemHealthMLRequest(BaseModel):
    subsystems: List[SubsystemInput]
    recent_break_probabilities: Optional[List[float]] = None
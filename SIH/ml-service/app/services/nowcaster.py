"""Nowcaster Module - Short-term Radar Precipitation Forecasting Engine"""
"""
Real-Time Nowcast Engine (ML + Live Weather).
Fetches live Open-Meteo hourly forecasts for any lat/lon, runs the calibrated
Monsoon ML model over the observed fields, and produces a 12-hour rainfall &
heavy-rain alert decision with multilingual farmer-facing broadcast messages.
"""

import json
import time
import urllib.parse
import urllib.request
from datetime import datetime
from typing import Any, Dict, List

from app.schemas.prediction import (
    NowcastAlert,
    NowcastHour,
    NowcastRequest,
    NowcastResponse,
    PredictionRequest,
)
from app.services.predictor import predictor

OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast"

# Thresholds (IMD-aligned heuristics scaled to sub-daily windows)
RAIN_HOURLY_MM = 1.0          # any hour with >=1mm counts as a rain hour
RAIN_PROBABILITY_PCT = 45.0   # or high forecast probability
HEAVY_RAIN_HOURLY_MM = 20.0   # convective squall intensity
HEAVY_RAIN_12H_MM = 32.0      # scaled early-warning total for a 12h window
HEAVY_RAIN_PROB_ALERT = 0.60  # model probability to escalate to HEAVY_RAIN

# Shared climate index defaults (mirror of /climate-indices/current)
CLIMATE_DEFAULTS = {
    "enso": 0.8,
    "iod": -0.4,
    "mjo_phase": 4,
    "mjo_amplitude": 1.5,
}


def fetch_hourly_forecast(lat: float, lon: float, hours: int = 24) -> Dict[str, Any]:
    """Pull real-time hourly forecast from Open-Meteo (live data)."""
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "precipitation,precipitation_probability,weather_code,wind_speed_10m,temperature_2m,relative_humidity_2m",
        "forecast_hours": hours,
        "timezone": "auto",
    }
    url = f"{OPEN_METEO_BASE}?{urllib.parse.urlencode(params)}"
    with urllib.request.urlopen(url, timeout=20) as resp:
        return json.loads(resp.read().decode("utf-8"))


def analyze_next_hours(payload: Dict[str, Any], window_hours: int = 12) -> Dict[str, Any]:
    """Analyze the hourly payload for rain events within the next window."""
    hourly = payload.get("hourly", {}) or {}
    times = hourly.get("time", []) or []
    precip = hourly.get("precipitation", []) or [0.0] * len(times)
    prob = hourly.get("precipitation_probability", []) or [0] * len(times)
    weather_code = hourly.get("weather_code", []) or [0] * len(times)

    rain_hours: List[str] = []
    total_window = 0.0
    total_24h = 0.0
    max_hourly = 0.0
    heavy_12h = False
    hourly_rows: List[Dict[str, Any]] = []

    n = min(window_hours, len(times))
    for i in range(n):
        p = float(precip[i] or 0.0)
        pr = float(prob[i] or 0.0)
        wc = int(weather_code[i] or 0)
        if p >= RAIN_HOURLY_MM or pr >= RAIN_PROBABILITY_PCT:
            rain_hours.append(times[i])
        total_window += p
        max_hourly = max(max_hourly, p)
        if p >= HEAVY_RAIN_HOURLY_MM:
            heavy_12h = True
        hourly_rows.append({
            "time": times[i],
            "precipitation_mm": round(p, 1),
            "precipitation_probability": round(pr, 1),
            "weather_code": wc,
            "is_rain_hour": bool(p >= RAIN_HOURLY_MM or pr >= RAIN_PROBABILITY_PCT),
        })

    total_24h = sum(float(precip[i] or 0.0) for i in range(min(24, len(times))))

    if total_window >= HEAVY_RAIN_12H_MM:
        heavy_12h = True

    return {
        "rain_within_12h": len(rain_hours) > 0,
        "rain_hours": rain_hours,
        "expected_rainfall_12h_mm": round(total_window, 1),
        "total_rainfall_24h_mm": round(total_24h, 1),
        "max_hourly_precip_mm": round(max_hourly, 1),
        "heavy_rain_in_12h": heavy_12h,
        "earliest_rain_time": rain_hours[0] if rain_hours else None,
        "hourly_rows": hourly_rows,
        # Live observed fields used to condition the ML model
        "temperature": float((hourly.get("temperature_2m") or [30.0])[0]),
        "humidity": float((hourly.get("relative_humidity_2m") or [70.0])[0]),
    }


def run_ml_model(req: NowcastRequest, live: Dict[str, Any]) -> Dict[str, Any]:
    """Condition the calibrated ML predictor with the live observed fields."""
    pred = predictor.predict(
        PredictionRequest(
            latitude=req.latitude,
            longitude=req.longitude,
            rainfall=live["total_rainfall_24h_mm"],
            temperature=live["temperature"],
            humidity=live["humidity"],
            soil_moisture="Moderate",
            enso=CLIMATE_DEFAULTS["enso"],
            iod=CLIMATE_DEFAULTS["iod"],
            mjo_phase=CLIMATE_DEFAULTS["mjo_phase"],
            mjo_amplitude=CLIMATE_DEFAULTS["mjo_amplitude"],
            previous_rainfall=round(live["total_rainfall_24h_mm"] * 0.5, 1),
            rainfall_anomaly=0.0,
            forecast_horizon=7,
            district_name=req.district_name,
            block_name=req.block_name,
        )
    )
    return {
        "heavy_rain_probability": pred.heavy_rain_probability,
        "risk_level": pred.risk_level,
        "model_version": pred.model_version,
    }


def resolve_severity(live: Dict[str, Any], model: Dict[str, Any]) -> str:
    if live["heavy_rain_in_12h"] or model["heavy_rain_probability"] >= HEAVY_RAIN_PROB_ALERT:
        return "HEAVY_RAIN"
    if live["rain_within_12h"]:
        return "RAIN"
    return "NONE"


def build_messages(severity: str, area_label: str, rain_mm: float) -> Dict[str, str]:
    loc = area_label or "your area"
    if severity == "HEAVY_RAIN":
        return {
            "en": (
                f"🔴 HEAVY RAIN ALERT - {loc}: The AI model flags heavy rainfall "
                f"within the next 12 hours (about {rain_mm:.0f} mm expected). "
                f"Clear field drainage, avoid fertilizer spray, and keep livestock safe. - MoES / NCMRWF"
            ),
            "hi": (
                f"🔴 भारी वर्षा चेतावनी - {loc}: अगले 12 घंटों में भारी बारिश की प्रबल संभावना "
                f"(लगभग {rain_mm:.0f} मिमी)। खेत की नालियां साफ करें, खाद का छिड़काव न करें और "
                f"पशुओं को सुरक्षित रखें। - MoES / NCMRWF"
            ),
            "or": (
                f"🔴 ପ୍ରବଳ ବର୍ଷା ସତର୍କତା - {loc}: ପରବର୍ତ୍ତୀ ୧୨ ଘଣ୍ଟା ମଧ୍ୟରେ ପ୍ରବଳ ବର୍ଷା ହେବାର "
                f"ଅଧିକ ସମ୍ଭାବନା (ପ୍ରାୟ {rain_mm:.0f} ମି.ମି.)। ଜମିର ଜଳ ନିଷ୍କାସନ ନାଳି ସଫା କରନ୍ତୁ, "
                f"ସାର ପ୍ରୟୋଗ ବନ୍ଦ ରଖନ୍ତୁ ଏବଂ ପଶୁମାନଙ୍କୁ ସୁରକ୍ଷିତ ରଖନ୍ତୁ। - MoES / NCMRWF"
            ),
        }
    if severity == "RAIN":
        return {
            "en": (
                f"🌧️ RAIN EXPECTED - {loc}: Rainfall is likely within the next 12 hours "
                f"(about {rain_mm:.0f} mm expected). Ideal time to finish sowing and keep "
                f"harvested grain dry. - MoES / NCMRWF"
            ),
            "hi": (
                f"🌧️ वर्षा की संभावना - {loc}: अगले 12 घंटों में बारिश की संभावना है "
                f"(लगभग {rain_mm:.0f} मिमी)। बुवाई जल्दी पूरी करें और अनाज को सूखा रखें। - MoES / NCMRWF"
            ),
            "or": (
                f"🌧️ ବର୍ଷା ସମ୍ଭାବନା - {loc}: ପରବର୍ତ୍ତୀ ୧୨ ଘଣ୍ଟା ମଧ୍ୟରେ ବର୍ଷା ହେବାର ସମ୍ଭାବନା "
                f"(ପ୍ରାୟ {rain_mm:.0f} ମି.ମି.)। ବୁଣା ଶୀଘ୍ର ଶେଷ କରନ୍ତୁ ଏବଂ ସଂଗୃହୀତ ଶସ୍ୟ ଶୁଖିଲା ରଖନ୍ତୁ। - MoES / NCMRWF"
            ),
        }
    return {
        "en": (
            f"☀️ No significant rainfall expected in {loc} for the next 12 hours. "
            f"Open outdoor farm work is suitable. - MoES / NCMRWF"
        ),
        "hi": (
            f"☀️ {loc} में अगले 12 घंटों में कोई महत्वपूर्ण वर्षा नहीं। "
            f"खेत के बाहरी कार्य कर सकते हैं। - MoES / NCMRWF"
        ),
        "or": (
            f"☀️ {loc} ରେ ପରବର୍ତ୍ତୀ ୧୨ ଘଣ୍ଟା ମଧ୍ୟରେ କୌଣସି ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ ବର୍ଷା ନାହିଁ। "
            f"ଖେତର କାର୍ଯ୍ୟ କରିପାରିବେ। - MoES / NCMRWF"
        ),
    }


class RealTimeNowcaster:
    def __init__(self):
        self.model_version = "nowcast-v1.2-realtime"

    def nowcast(self, req: NowcastRequest) -> NowcastResponse:
        payload = fetch_hourly_forecast(req.latitude, req.longitude)
        live = analyze_next_hours(payload)
        model = run_ml_model(req, live)
        severity = resolve_severity(live, model)

        area_label = req.block_name or req.district_name
        messages = build_messages(severity, area_label, live["expected_rainfall_12h_mm"])

        alert = NowcastAlert(
            rain_within_12h=live["rain_within_12h"],
            expected_rainfall_12h_mm=live["expected_rainfall_12h_mm"],
            total_rainfall_24h_mm=live["total_rainfall_24h_mm"],
            max_hourly_precip_mm=live["max_hourly_precip_mm"],
            heavy_rain_in_12h=live["heavy_rain_in_12h"],
            heavy_rain_probability=model["heavy_rain_probability"],
            risk_level=model["risk_level"],
            alert_severity=severity,
            earliest_rain_time=live["earliest_rain_time"],
            message_en=messages["en"],
            message_hi=messages["hi"],
            message_or=messages["or"],
        )

        return NowcastResponse(
            status="success",
            location={
                "lat": req.latitude,
                "lon": req.longitude,
                "district": req.district_name,
                "block": req.block_name,
            },
            nowcast=alert,
            hourly=[NowcastHour(**row) for row in live["hourly_rows"]],
            model_version=self.model_version,
            generated_at=datetime.utcnow().isoformat() + "Z",
            is_prototype=True,
        )


nowcaster = RealTimeNowcaster()
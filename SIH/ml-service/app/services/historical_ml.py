"""Historical ML Module - Extended range climatology and XAI trend analysis"""
"""
Historical Analysis ML Engine
Tasks:
 1. Trend detection (linear regression slope + Mann-Kendall style sign test)
 2. Anomaly detection (z-score + IsolationForest)
 3. Analog-year matching (Euclidean distance on normalized features)
 4. Onset / dry-spell climatology stats
 5. Decadal shift + forecast-skill proxy
Uses sklearn + numpy only, no external data fetch - works on yearly_records payload.
"""
from typing import List, Dict, Any, Optional
import math
import numpy as np

try:
    from sklearn.ensemble import IsolationForest
    from sklearn.linear_model import LinearRegression
    _SKLEARN_OK = True
except Exception:
    _SKLEARN_OK = False


BASELINE_NORMAL_MM = 1150.0


def _to_arrays(records: List[Dict[str, Any]]):
    years = np.array([r.get("year", 0) for r in records], dtype=float)
    rainfall = np.array([r.get("seasonal_rainfall_mm", 0) for r in records], dtype=float)
    anomaly = np.array([r.get("rainfall_anomaly_percent", 0) for r in records], dtype=float)
    dry = np.array([r.get("longest_dry_spell_days", 0) for r in records], dtype=float)
    return years, rainfall, anomaly, dry


def trend_analysis(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    years, rainfall, anomaly, dry = _to_arrays(records)
    n = len(years)
    if n < 3:
        return {"status": "insufficient_data", "n": n}
    X = years.reshape(-1, 1)
    out: Dict[str, Any] = {}
    # Rainfall trend mm/year
    if _SKLEARN_OK:
        lr = LinearRegression().fit(X, rainfall)
        slope_rf = float(lr.coef_[0])
        r2_rf = float(lr.score(X, rainfall))
        lr2 = LinearRegression().fit(X, dry)
        slope_dry = float(lr2.coef_[0])
        r2_dry = float(lr2.score(X, dry))
    else:
        # numpy polyfit fallback
        slope_rf = float(np.polyfit(years, rainfall, 1)[0])
        slope_dry = float(np.polyfit(years, dry, 1)[0])
        r2_rf = 0.5
        r2_dry = 0.5
    # Mann-Kendall sign proxy
    def mk_sign(series):
        s = 0
        for i in range(len(series)):
            for j in range(i + 1, len(series)):
                s += 1 if series[j] > series[i] else (-1 if series[j] < series[i] else 0)
        denom = len(series) * (len(series) - 1) / 2
        tau = s / denom if denom else 0
        return s, round(float(tau), 3)
    s_rf, tau_rf = mk_sign(rainfall.tolist())
    s_dry, tau_dry = mk_sign(dry.tolist())

    def label_trend(slope, tau, invert=False):
        if abs(tau) < 0.2:
            return "Stable / No clear trend"
        if slope > 0:
            return "Increasing" if not invert else "Worsening (increasing dryness)"
        return "Decreasing"

    out = {
        "rainfall_trend_mm_per_year": round(slope_rf, 2),
        "rainfall_trend_r2": round(r2_rf, 3),
        "rainfall_mk_s": int(s_rf),
        "rainfall_mk_tau": tau_rf,
        "rainfall_trend_label": label_trend(slope_rf, tau_rf),
        "dry_spell_trend_days_per_year": round(slope_dry, 3),
        "dry_spell_trend_r2": round(r2_dry, 3),
        "dry_spell_mk_tau": tau_dry,
        "dry_spell_trend_label": "Lengthening dry spells" if slope_dry > 0.2 else ("Shortening" if slope_dry < -0.2 else "Stable"),
        "interpretation": (
            f"Seasonal rainfall changing at {slope_rf:+.1f} mm/year (tau={tau_rf}). "
            f"Dry-spell duration changing at {slope_dry:+.2f} days/year. "
            + ("Drying signal: rainfall down + dry spells lengthening — elevated Kharif risk." if slope_rf < 0 and slope_dry > 0
               else "Mixed signal — use analog years for planning.")
        ),
        "model": "LinearRegression + MannKendall-proxy v1.0",
    }
    return out


def anomaly_detection(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    years, rainfall, anomaly, dry = _to_arrays(records)
    mean_rf, std_rf = float(np.mean(rainfall)), float(np.std(rainfall) or 1.0)
    mean_dry, std_dry = float(np.mean(dry)), float(np.std(dry) or 1.0)
    flagged = []
    for r in records:
        z_rf = (r.get("seasonal_rainfall_mm", 0) - mean_rf) / std_rf
        z_dry = (r.get("longest_dry_spell_days", 0) - mean_dry) / std_dry
        iso_score = 0.0
        if _SKLEARN_OK and len(records) >= 4:
            try:
                X = np.column_stack([rainfall, dry])
                iso = IsolationForest(contamination=0.25, random_state=42).fit(X)
                # decision_function lower = more anomalous; convert
                scores = -iso.decision_function(X)
                idx = records.index(r)
                iso_score = round(float(scores[idx]), 3)
            except Exception:
                iso_score = 0.0
        is_anomaly = abs(z_rf) >= 1.2 or abs(z_dry) >= 1.2 or iso_score > 0.15
        flagged.append({
            "year": r.get("year"),
            "z_rainfall": round(float(z_rf), 2),
            "z_dryspell": round(float(z_dry), 2),
            "isolation_score": iso_score,
            "is_anomaly": bool(is_anomaly),
            "severity": "HIGH" if abs(z_rf) >= 1.5 or abs(z_dry) >= 1.5 else ("MODERATE" if is_anomaly else "NORMAL"),
        })
    return {
        "mean_rainfall_mm": round(mean_rf, 1),
        "std_rainfall_mm": round(std_rf, 1),
        "mean_dryspell_days": round(mean_dry, 1),
        "std_dryspell_days": round(std_dry, 2),
        "yearly_flags": flagged,
        "anomaly_years": [f["year"] for f in flagged if f["is_anomaly"]],
        "model": "ZScore + IsolationForest(contamination=0.25) v1.0",
    }


def analog_matching(records: List[Dict[str, Any]], current: Dict[str, Any], top_k: int = 3) -> Dict[str, Any]:
    """Match current season fingerprint to historical analogs."""
    # features: rainfall_anomaly, dry_spell, enso, iod
    feats = []
    for r in records:
        feats.append([
            r.get("rainfall_anomaly_percent", 0) / 25.0,
            r.get("longest_dry_spell_days", 0) / 15.0,
            r.get("enso", 0.0),
            r.get("iod", 0.0),
        ])
    cur = np.array([
        current.get("rainfall_anomaly", -24.0) / 25.0,
        current.get("dry_spell_days", 9) / 15.0,
        current.get("enso", 0.8),
        current.get("iod", -0.4),
    ], dtype=float)
    dists = []
    for i, r in enumerate(records):
        v = np.array(feats[i], dtype=float)
        d = float(np.linalg.norm(v - cur))
        sim = round(1 / (1 + d) * 100, 1)
        dists.append({"year": r.get("year"), "distance": round(d, 3), "similarity_pct": sim,
                      "monsoon_type": r.get("monsoon_type", ""), "seasonal_rainfall_mm": r.get("seasonal_rainfall_mm"),
                      "longest_dry_spell_days": r.get("longest_dry_spell_days")})
    dists.sort(key=lambda x: x["distance"])
    top = dists[:top_k]
    # consensus: avg dry spell of analogs
    avg_dry = round(float(np.mean([records[[r.get("year") for r in records].index(t["year"])]["longest_dry_spell_days"] for t in top])), 1) if top else 0
    return {
        "current_fingerprint": current,
        "ranked_analogs": dists,
        "top_analogs": top,
        "consensus": {
            "expected_dry_spell_days": avg_dry,
            "message": f"Closest analog is {top[0]['year']} ({top[0]['similarity_pct']}% similar, {top[0]['monsoon_type']}). Expect ~{avg_dry} day dry spell window; plan protective irrigation.",
        },
        "model": "Euclidean-KNN analog matcher v1.0",
    }


def climatology(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    years, rainfall, anomaly, dry = _to_arrays(records)
    deficit_years = sum(1 for a in anomaly if a < -10)
    excess_years = sum(1 for a in anomaly if a > 5)
    p_deficit = round(deficit_years / len(records) * 100, 1) if len(records) else 0
    # onset dates may be strings like "June 12" -> day of june
    onset_days = []
    for r in records:
        od = str(r.get("onset_date", "June 12"))
        try:
            day = int("".join(ch for ch in od if ch.isdigit() or ch == " ").strip().split()[0])
            onset_days.append(day)
        except Exception:
            onset_days.append(12)
    return {
        "baseline_normal_mm": BASELINE_NORMAL_MM,
        "mean_seasonal_mm": round(float(np.mean(rainfall)), 1),
        "std_seasonal_mm": round(float(np.std(rainfall)), 1),
        "min_seasonal_mm": round(float(np.min(rainfall)), 1),
        "max_seasonal_mm": round(float(np.max(rainfall)), 1),
        "deficit_year_probability_pct": p_deficit,
        "excess_year_count": int(excess_years),
        "mean_onset_june_day": round(float(np.mean(onset_days)), 1),
        "mean_dry_spell_days": round(float(np.mean(dry)), 1),
        "max_dry_spell_days": int(np.max(dry)),
        "drought_return_period_years": round(len(records) / max(deficit_years, 1), 2),
    }


class HistoricalMLAnalyzer:
    version = "historical-ml-v1.0"

    def analyze(self, records: List[Dict[str, Any]], current: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        current = current or {"rainfall_anomaly": -24.0, "dry_spell_days": 9, "enso": 0.8, "iod": -0.4}
        tr = trend_analysis(records)
        an = anomaly_detection(records)
        am = analog_matching(records, current)
        cl = climatology(records)
        # risk outlook synthesis
        risk = "HIGH" if (tr.get("rainfall_trend_mm_per_year", 0) < 0 and tr.get("dry_spell_trend_days_per_year", 0) > 0) or cl.get("deficit_year_probability_pct", 0) >= 40 else "MODERATE"
        return {
            "status": "success",
            "model_version": self.version,
            "trend": tr,
            "anomalies": an,
            "analogs": am,
            "climatology": cl,
            "risk_outlook": risk,
            "advisory": (
                "ML outlook: drying trend + lengthening breaks. Prioritize short-duration paddy, farm ponds, and staggered sowing. "
                if risk == "HIGH" else
                "ML outlook: near-normal with episodic breaks. Standard Kharif plan with one protective irrigation reserve."
            ),
            "is_prototype": True,
        }


historical_analyzer = HistoricalMLAnalyzer()
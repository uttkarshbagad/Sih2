"""System Health ML Module - Infrastructure metric anomaly detection engine"""
"""
System Health ML Engine
Tasks:
 1. Latency anomaly detection (z-score + IsolationForest on subsystem latencies)
 2. Predictive health scoring (weighted uptime + latency + error proxy)
 3. Model drift detection (PSI-style distribution shift on recent predictions)
 4. Failure-risk forecast (simple logistic proxy)
 5. Auto-remediation recommendations
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
import math
import numpy as np

try:
    from sklearn.ensemble import IsolationForest
    _SK_OK = True
except Exception:
    _SK_OK = False

HEALTHY_LATENCY_MS = {
    "Data Feed": 80, "Teleconnection Index": 80, "GIS Engine": 50,
    "AI/ML Service": 150, "AI/ML Service (Port 8000)": 150,
    "Expert Rule Matrix": 50, "Advisory Engine": 50,
    "Broadcast Service": 200, "MongoDB-Compatible": 50,
    "Index Service": 80, "Broadcast Queue": 200, "MongoDB-Ready": 50,
}


def _norm_type(t: str) -> str:
    return (t or "").strip()


def latency_anomaly(subsystems: List[Dict[str, Any]]) -> Dict[str, Any]:
    lats = np.array([float(s.get("latency_ms", 0)) for s in subsystems], dtype=float)
    mean_l, std_l = float(np.mean(lats)) if len(lats) else 0, float(np.std(lats) or 1.0)
    flags = []
    iso_scores = [0.0] * len(subsystems)
    if _SK_OK and len(lats) >= 4:
        try:
            X = lats.reshape(-1, 1)
            iso = IsolationForest(contamination=0.2, random_state=7).fit(X)
            raw = -iso.decision_function(X)
            iso_scores = [round(float(v), 3) for v in raw]
        except Exception:
            pass
    for i, s in enumerate(subsystems):
        lat = float(s.get("latency_ms", 0))
        z = (lat - mean_l) / (std_l or 1.0)
        threshold = HEALHY_TH = HEALTHY_LATENCY_MS.get(_norm_type(s.get("type", "")), 120)
        over = lat > threshold * 1.5
        is_anom = abs(z) >= 1.3 or iso_scores[i] > 0.12 or over
        flags.append({
            "name": s.get("name"), "latency_ms": lat, "z_score": round(float(z), 2),
            "isolation_score": iso_scores[i], "threshold_ms": threshold,
            "is_anomaly": bool(is_anom),
            "severity": "HIGH" if (over and abs(z) >= 1.0) else ("MODERATE" if is_anom else "NORMAL"),
        })
    return {"mean_latency_ms": round(mean_l, 1), "std_latency_ms": round(std_l, 1),
            "flags": flags, "anomalous_services": [f["name"] for f in flags if f["is_anomaly"]],
            "model": "ZScore + IsolationForest(contamination=0.2) v1.0"}


def health_score(subsystems: List[Dict[str, Any]]) -> Dict[str, Any]:
    scores = []
    for s in subsystems:
        status = str(s.get("status", "")).upper()
        lat = float(s.get("latency_ms", 0))
        thr = HEALTHY_LATENCY_MS.get(_norm_type(s.get("type", "")), 120)
        status_pts = 100 if status in ("OPERATIONAL", "AVAILABLE", "CONNECTED") else (70 if status == "SIMULATED" else 30)
        lat_pts = max(0, 100 - max(0, (lat - thr) / thr * 60))
        combined = round(0.6 * status_pts + 0.4 * lat_pts, 1)
        scores.append({"name": s.get("name"), "status": status, "latency_ms": lat,
                       "health_pts": combined,
                       "health_label": "HEALTHY" if combined >= 85 else ("DEGRADED" if combined >= 60 else "CRITICAL")})
    overall = round(float(np.mean([x["health_pts"] for x in scores])), 1) if scores else 0
    return {"overall_health_pct": overall,
            "overall_label": "OPERATIONAL" if overall >= 85 else ("DEGRADED" if overall >= 60 else "OUTAGE-RISK"),
            "services": scores, "model": "Weighted health scorer v1.0"}


def drift_check(recent_probs: Optional[List[float]] = None) -> Dict[str, Any]:
    """PSI-like drift: compare recent break-prob distribution vs training baseline (mean 0.35, std 0.15)."""
    base_mean, base_std = 0.35, 0.15
    if not recent_probs:
        recent_probs = [0.68, 0.62, 0.71, 0.55, 0.66, 0.60, 0.69, 0.58]
    arr = np.array(recent_probs, dtype=float)
    m, sd = float(np.mean(arr)), float(np.std(arr) or 0.01)
    # simple PSI proxy with 5 bins
    bins = [0, 0.2, 0.4, 0.6, 0.8, 1.01]
    hist_recent, _ = np.histogram(arr, bins=bins)
    # expected baseline histogram from normal(0.35,0.15) approx
    expected_pct = np.array([0.16, 0.34, 0.34, 0.13, 0.03])
    actual_pct = hist_recent / max(hist_recent.sum(), 1)
    psi = 0.0
    for e, a in zip(expected_pct, actual_pct):
        e = max(e, 0.005); a = max(a, 0.005)
        psi += (a - e) * math.log(a / e)
    psi = round(float(psi), 3)
    drift = "NO-DRIFT" if psi < 0.1 else ("MILD-DRIFT" if psi < 0.25 else "SIGNIFICANT-DRIFT")
    return {"psi": psi, "drift_label": drift, "recent_mean": round(m, 3), "recent_std": round(sd, 3),
            "baseline_mean": base_mean, "baseline_std": base_std, "n_samples": len(arr),
            "action": "No action." if drift == "NO-DRIFT" else ("Monitor + schedule recalibration." if drift == "MILD-DRIFT" else "Trigger model retraining + threshold review."),
            "model": "PSI drift detector v1.0"}


def failure_forecast(overall_health: float, psi: float, n_anomalies: int) -> Dict[str, Any]:
    # logistic proxy: logit = -4 + 0.05*(100-health) + 3*psi + 0.8*n_anomalies
    logit = -4.0 + 0.05 * (100 - overall_health) + 3.0 * psi + 0.8 * n_anomalies
    p = 1 / (1 + math.exp(-logit))
    p = round(float(p), 3)
    level = "LOW" if p < 0.25 else ("MODERATE" if p < 0.55 else "HIGH")
    return {"failure_probability_24h": p, "risk_level": level,
            "recommendations": (
                ["All nominal."] if level == "LOW" else
                (["Scale ML replicas to 2.", "Warm fallback cache.", "Alert on-call if latency p95 > 200ms."] if level == "MODERATE" else
                 ["Failover to embedded fallback engine.", "Freeze non-critical broadcasts.", "Page SRE + rerun model validation."]))
            }


class SystemHealthML:
    version = "system-health-ml-v1.0"

    def analyze(self, subsystems: List[Dict[str, Any]], recent_probs: Optional[List[float]] = None) -> Dict[str, Any]:
        lat = latency_anomaly(subsystems)
        hs = health_score(subsystems)
        dr = drift_check(recent_probs)
        ff = failure_forecast(hs["overall_health_pct"], dr["psi"], len(lat["anomalous_services"]))
        return {"status": "success", "model_version": self.version,
                "generated_at": datetime.utcnow().isoformat() + "Z",
                "latency_ml": lat, "health_ml": hs, "drift_ml": dr, "failure_forecast": ff,
                "is_prototype": True}


system_health_ml = SystemHealthML()
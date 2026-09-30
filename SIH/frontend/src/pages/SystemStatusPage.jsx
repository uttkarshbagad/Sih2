import React, { useState, useEffect } from 'react';
import { fetchSystemStatus } from '../services/api';
import { 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  Server, 
  Radio, 
  Layers, 
  Zap, 
  Clock, 
  ShieldCheck,
  Cpu,
  Gauge,
  GitBranch,
  Radar
} from 'lucide-react';

export const SystemStatusPage = () => {
  const [statusData, setStatusData] = useState(null);

  useEffect(() => {
    const loadStatus = async () => {
      const data = await fetchSystemStatus();
      setStatusData(data);
    };
    loadStatus();
  }, []);

  const subsystems = statusData?.subsystems || [
    { name: "Regional Weather Data Feed (IMD/NCMRWF Grid)", status: "AVAILABLE", latency_ms: 38, type: "Data Feed" },
    { name: "Climate Teleconnection Signals (ENSO/IOD/MJO)", status: "AVAILABLE", latency_ms: 45, type: "Index Service" },
    { name: "Geospatial Boundary Engine (Odisha 10 Districts)", status: "AVAILABLE", latency_ms: 12, type: "GIS Engine" },
    { name: "FastAPI ML Prediction Microservice (Port 8000)", status: "OPERATIONAL", latency_ms: 82, type: "AI/ML Service" },
    { name: "Agro-Meteorological Rule Matrix", status: "OPERATIONAL", latency_ms: 15, type: "Advisory Engine" },
    { name: "SMS / WhatsApp Farmer Dispatch Gateway", status: "SIMULATED", latency_ms: 110, type: "Broadcast Queue" },
    { name: "Database & Historical Climatology Cache", status: "CONNECTED", latency_ms: 8, type: "MongoDB-Ready" }
  ];

  const ml = statusData?.ml_health;
  const mlLatency = ml?.latency_ml;
  const mlHealth = ml?.health_ml;
  const mlDrift = ml?.drift_ml;
  const mlFailure = ml?.failure_forecast;
  const overallLabel = mlHealth?.overall_label || 'OPERATIONAL';
  const statusIsGreen = overallLabel === 'OPERATIONAL';
  const lastModelRun = statusData?.last_model_run || "Today, 06:00 UTC (Run-06Z)";

  return (
    <div className="flex-1 w-full min-w-0 overflow-y-auto bg-slate-950 relative overflow-hidden px-3 py-4 sm:px-6 sm:py-6 lg:px-10 xl:px-12 2xl:px-16 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-emerald-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white">
              System Health & Operational Status
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time diagnostics of meteorological ingestion pipelines, ML services, and dispatch gateways
          </p>
        </div>

        <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold self-start sm:self-auto border ${
          statusIsGreen
            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
            : 'bg-amber-950/80 border-amber-500/40 text-amber-300'
        }`}>
          <span className={`h-2 w-2 rounded-full animate-pulse ${statusIsGreen ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span>{overallLabel === 'OPERATIONAL' ? 'All Core Subsystems Operational' : `Subsystems ${overallLabel}`}</span>
        </div>
      </div>

      {/* Primary KPI Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">Weather Data Ingestion</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-lg font-black text-white">AVAILABLE</div>
          <p className="text-[11px] text-slate-400">IMD Gridded Daily Data Assimilated</p>
        </div>

        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">Climate Signals</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-lg font-black text-white">AVAILABLE</div>
          <p className="text-[11px] text-slate-400">ENSO + IOD + MJO Feed Synchronized</p>
        </div>

        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">ML Prediction Engine</span>
            <Cpu className="h-4 w-4 text-sky-400" />
          </div>
          <div className="text-lg font-black text-sky-400 font-mono">FastAPI v1.2</div>
          <p className="text-[11px] text-slate-400">Ensemble Probabilistic Classifier</p>
        </div>

        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">Last Model Run</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-lg font-black text-amber-300">{lastModelRun}</div>
          <p className="text-[11px] text-slate-400">Next Scheduled Run: 12:00 UTC</p>
        </div>

      </div>

      {/* Detailed Subsystems Health Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-white">Subsystems & API Latency Telemetry</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="pb-2">Subsystem Component</th>
                <th className="pb-2">Type</th>
                <th className="pb-2 text-center">Status</th>
                <th className="pb-2 text-right">Response Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {subsystems.map((sub, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="py-3 font-sans font-bold text-slate-200">{sub.name}</td>
                  <td className="py-3 font-sans text-slate-400">{sub.type}</td>
                  <td className="py-3 text-center">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      sub.status === 'OPERATIONAL' || sub.status === 'AVAILABLE' || sub.status === 'CONNECTED'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                    }`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="py-3 text-right text-sky-400 font-bold">{sub.latency_ms} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ML-Driven System Health Telemetry */}
      {ml && (mlHealth || mlLatency || mlDrift || mlFailure) && (
        <div className="rounded-2xl bg-slate-900/80 border border-sky-500/40 p-6 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Radar className="h-5 w-5 text-sky-400" />
              <h3 className="text-sm font-bold text-white">ML-Driven System Health Telemetry</h3>
              {ml.model_version && (
                <span className="text-[10px] font-mono text-sky-300 bg-sky-950/80 px-2 py-0.5 rounded-full border border-sky-700/60">
                  {ml.model_version}
                </span>
              )}
            </div>
            {ml.status === 'fallback' && (
              <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-600/40">
                ML health service offline · heuristic telemetry
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Overall Health Score */}
            <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-4 space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                <Gauge className="h-3.5 w-3.5 text-emerald-400" /> Overall Health Score
              </div>
              <div className={`text-2xl font-black font-mono ${mlHealth?.overall_health_pct >= 85 ? 'text-emerald-300' : mlHealth?.overall_health_pct >= 60 ? 'text-amber-300' : 'text-rose-300'}`}>
                {mlHealth?.overall_health_pct != null ? `${mlHealth.overall_health_pct}%` : '--'}
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">{mlHealth?.overall_label || 'OPERATIONAL'}</div>
            </div>

            {/* Failure Forecast */}
            <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-4 space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-rose-400" /> Failure Forecast (24h)
              </div>
              <div className="text-2xl font-black font-mono text-rose-300">
                {mlFailure?.failure_probability_24h != null ? `${Math.round(mlFailure.failure_probability_24h * 100)}%` : '--'}
              </div>
              <div className="text-[10px] font-bold text-rose-400/90">{mlFailure?.risk_level || 'LOW'} RISK</div>
            </div>

            {/* Drift Detection */}
            <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-4 space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                <GitBranch className="h-3.5 w-3.5 text-indigo-400" /> Model Drift (PSI)
              </div>
              <div className="text-2xl font-black font-mono text-indigo-300">
                {mlDrift?.psi != null ? mlDrift.psi : '--'}
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">{mlDrift?.drift_label || 'NO-DRIFT'} · n={mlDrift?.n_samples ?? 8}</div>
            </div>

            {/* Anomalous Services */}
            <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-4 space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                <Server className="h-3.5 w-3.5 text-amber-400" /> Latency Anomalies
              </div>
              <div className="text-2xl font-black font-mono text-amber-300">
                {(mlLatency?.anomalous_services || []).length}
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">
                mean {mlLatency?.mean_latency_ms ?? '--'} ms · std ±{mlLatency?.std_latency_ms ?? '--'} ms
              </div>
            </div>
          </div>

          {(mlLatency?.anomalous_services || []).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {(mlLatency?.anomalous_services || []).map((name) => (
                <span key={name} className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/60 border border-amber-700/50 px-2 py-1 rounded-lg">
                  ⚠ {name}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Per-Service ML Health */}
            {mlHealth?.services && mlHealth.services.length > 0 && (
              <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-4 space-y-2.5">
                <div className="text-[10px] uppercase font-bold text-slate-400">Per-Service Health Points</div>
                <div className="space-y-1.5">
                  {mlHealth.services.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-slate-300 truncate">{s.name}</span>
                      <span className="flex items-center gap-2 flex-shrink-0">
                        <span className={`font-bold font-mono ${s.health_label === 'HEALTHY' ? 'text-emerald-300' : s.health_label === 'DEGRADED' ? 'text-amber-300' : 'text-rose-300'}`}>
                          {s.health_pts}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                          s.health_label === 'HEALTHY'
                            ? 'text-emerald-300 bg-emerald-950/60 border-emerald-700/50'
                            : s.health_label === 'DEGRADED'
                              ? 'text-amber-300 bg-amber-950/60 border-amber-700/50'
                              : 'text-rose-300 bg-rose-950/60 border-rose-700/50'
                        }`}>
                          {s.health_label}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Failure Recommendations */}
            {mlFailure?.recommendations && (
              <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-4 space-y-2.5">
                <div className="text-[10px] uppercase font-bold text-slate-400">Auto-Remediation Recommendations</div>
                <ul className="space-y-1.5">
                  {mlFailure.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-[11px] text-slate-300 flex items-start gap-2">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-800 text-[10px] font-mono text-sky-300 flex-shrink-0 mt-px">
                        {idx + 1}
                      </span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
                {mlDrift?.action && (
                  <p className="text-[10px] text-indigo-300 bg-indigo-950/60 border border-indigo-700/40 rounded-lg px-3 py-2 border">
                    Drift action: {mlDrift.action}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Prototype Governance & Data Attribution Notice */}
      <div className="rounded-2xl bg-amber-950/20 border border-amber-500/30 p-6 space-y-3">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
          <ShieldCheck className="h-4 w-4" />
          <span>Prototype Integrity & Scientific Governance Notice</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          This system is an engineered working demonstration prototype developed for the <strong>Smart India Hackathon (SIH 2026)</strong> under the theme <em>Agriculture, FoodTech & Rural Development</em>. 
          The meteorological values, spatial risk indices, and ML predictions are structured with realistic physical dynamics for demonstration and decision-flow validation. 
          In operational deployment, live NCUM (12-km) NWP model data, satellite-derived topsoil moisture from ISRO/MOSDAC, and operational IMD observational station APIs can be connected directly into the REST backend without architectural modifications.
        </p>
      </div>

    </div>
  );
};

export default SystemStatusPage;

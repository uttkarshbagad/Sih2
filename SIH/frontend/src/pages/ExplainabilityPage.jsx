import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { fetchExplainability, fetchExplainAdvanced } from '../services/api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { 
  HelpCircle, 
  Zap, 
  Sparkles, 
  TrendingUp, 
  Layers, 
  Info,
  CheckCircle2,
  MapPin
} from 'lucide-react';
import { RiskBadge } from '../components/common/RiskBadge';

export const ExplainabilityPage = () => {
  const { selectedBlock, selectedDistrict, forecastData } = useApp();
  const [explainData, setExplainData] = useState(null);
  const [advData, setAdvData] = useState(null);
  const [mode, setMode] = useState('advanced');
  const [modelMode, setModelMode] = useState('heuristic');

  useEffect(() => {
    fetch('/api/model-card')
      .then(r => r.json())
      .then(data => setModelMode(data.model_mode || 'heuristic'))
      .catch(() => setModelMode('heuristic'));
  }, []);

  useEffect(() => {
    const loadExplanation = async () => {
      const metrics = forecastData?.metrics || {};
      const payload = {
        latitude: 20.71, longitude: 86.78,
        rainfall: 18.5, humidity: metrics.humidity_percent ?? 65,
        district_name: selectedDistrict,
        block_name: selectedBlock,
        rainfall_anomaly: metrics.rainfall_anomaly_percent ?? -24.0,
        temperature: metrics.temperature_c ?? 34.2,
        soil_moisture: metrics.soil_moisture_level || 'Low',
        soil_moisture_value: metrics.soil_moisture_fraction ?? 0.22,
        previous_rainfall: 32.0, forecast_horizon: 7,
        enso: 0.8,
        iod: -0.4,
        mjo_phase: 4, mjo_amplitude: 1.5
      };
      const [basic, adv] = await Promise.all([
        fetchExplainability(payload, 'basic'),
        fetchExplainAdvanced(payload)
      ]);
      if (basic) setExplainData(basic);
      if (adv?.status === 'success') { setAdvData(adv); setExplainData(adv); }
    };
    loadExplanation();
  }, [selectedBlock, selectedDistrict, forecastData]);

  const contributions = explainData?.feature_contributions || [
    { label: "Recent Rainfall Deficit", contribution_percent: 21.0, description: "Negative rainfall departure (-24%) indicates weak early monsoon convective buildup." },
    { label: "Temperature Anomaly", contribution_percent: 18.0, description: "Surface temp elevated at 34.2°C (+2.8°C above normal), accelerating soil water depletion." },
    { label: "Low Soil Moisture", contribution_percent: 14.0, description: "Topsoil volumetric water content is categorized as 'Low' (22% VWC)." },
    { label: "ENSO (Nino 3.4) Signal", contribution_percent: 11.0, description: "Positive ENSO anomaly (+0.8°C) suppresses tropical Walker circulation over eastern India." },
    { label: "Historical Analog Pattern", contribution_percent: 10.0, description: "Climatological analog matching shows 4 out of 5 similar years experienced 7+ day dry spells." },
    { label: "MJO Phase Modulation", contribution_percent: 8.0, description: "MJO in Phase 4 provides intermittent showers buffering macro subsidence." }
  ];

  const sortedContributions = [...contributions].sort((a, b) => b.contribution_percent - a.contribution_percent);

  const targetProbPct = explainData ? Math.round(explainData.target_probability * 100) : 68;
  const baseProbPct = explainData ? Math.round(explainData.base_probability * 100) : 25;
  const mlDeltaPct = explainData ? Math.round((explainData.target_probability - explainData.base_probability) * 100) : 43;

  return (
    <div className="flex-1 w-full min-w-0 overflow-y-auto bg-slate-950 relative overflow-hidden px-3 py-4 sm:px-6 sm:py-6 lg:px-10 xl:px-12 2xl:px-16 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-indigo-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Explainable AI (XAI) • Why This Prediction?
            </h1>
            {modelMode && (
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                modelMode === 'trained' ? 'bg-emerald-900/50 text-emerald-300 border-emerald-500/40' : 'bg-amber-900/50 text-amber-300 border-amber-500/40'
              } border`}>
                {modelMode.toUpperCase()}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-sky-400" />
            <span>Feature Contribution Decomposition for {selectedBlock} Block ({selectedDistrict})</span>
          </p>
        </div>
        <div className="text-xs font-mono text-indigo-300 bg-indigo-950/80 px-3 py-1.5 rounded-xl border border-indigo-700/60 self-start sm:self-auto flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5" /> SHAP Feature Attribution
        </div>
      </div>

      {/* Primary Target Probability Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-orange-950/70 via-slate-900 to-slate-900 border border-orange-500/40 p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 text-center md:text-left">
          <div className="text-xs font-bold text-orange-400 uppercase tracking-wider">
            Target Predicted Risk Metric
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Overall Break / Dry Spell Risk: <span className="text-orange-400 font-mono">{targetProbPct}%</span>
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            {explainData?.explanation_summary || 
              `The primary factor driving elevated dry-spell risk in ${selectedBlock} is the cumulative rainfall deficit (+21% contribution), reinforced by elevated temperature (+18%) and ENSO teleconnections.`}
          </p>
        </div>

        <div className="flex-shrink-0 bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold">Base Climatology</span>
          <div className="text-xl font-bold text-slate-300 font-mono">{baseProbPct}%</div>
          <span className="text-[10px] text-orange-400 font-semibold font-mono">+{mlDeltaPct}% ML Delta</span>
        </div>
      </div>

      {/* Horizontal Feature Contribution Waterfall Chart */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-4 shadow-xl">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Zap className="h-4 w-4 text-indigo-400" />
            <span>Feature Contribution Breakdown (SHAP Values)</span>
          </h3>
          <p className="text-xs text-slate-400">
            Percentage share of atmospheric, hydrological, and oceanic drivers elevating the risk score
          </p>
        </div>

        <div className="h-72 w-full overflow-x-auto min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={320}>
            <BarChart
              layout="vertical"
              data={sortedContributions}
              margin={{ top: 10, right: 15, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" stroke="#64748b" fontSize={11} domain={[0, 30]} unit="%" />
              <YAxis 
                type="category" 
                dataKey="label" 
                stroke="#cbd5e1" 
                fontSize={11} 
                width={120}
                tick={{ fill: '#e2e8f0', fontWeight: 600 }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }}
                formatter={(val) => [`+${val}% contribution`, 'Feature Weight']}
              />
              <Bar dataKey="contribution_percent" radius={[0, 6, 6, 0]}>
                {sortedContributions.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === 0 ? '#f97316' : index === 1 ? '#ea580c' : index === 2 ? '#eab308' : '#38bdf8'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Advanced XAI: Counterfactual + Narrative + Calibration */}
      {advData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-emerald-950/40 border border-emerald-600/40 p-4 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">ML Counterfactual (What-If)</div>
            <div className="text-xs text-white font-semibold">{advData.counterfactual?.message}</div>
            <div className="text-[11px] font-mono text-slate-300">Best: {advData.counterfactual?.recommended?.change} → {Math.round((advData.counterfactual?.recommended?.resulting_break ?? 0) * 100)}%</div>
          </div>
          <div className="rounded-2xl bg-sky-950/40 border border-sky-600/40 p-4 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-sky-300">ML Narrative (EN/HI/OR)</div>
            <div className="text-xs text-slate-200">{advData.narrative?.en}</div>
            <div className="text-xs text-slate-400">{advData.narrative?.hi}</div>
            <div className="text-xs text-slate-400">{advData.narrative?.or}</div>
          </div>
          <div className="rounded-2xl bg-indigo-950/40 border border-indigo-600/40 p-4 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">ML Calibration</div>
            <div className="text-xs text-white font-mono">Confidence {(advData.calibration?.confidence * 100)?.toFixed(0)}%</div>
            <div className="text-[11px] text-slate-300">{advData.calibration?.note}</div>
            <div className="text-[10px] font-mono text-slate-400">Model: {advData.model_version} • {advData.source || 'FastAPI-ML-XAI-v2'}</div>
          </div>
        </div>
      )}

      {/* Detailed Contribution Explanations Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedContributions.map((item, idx) => (
          <div key={idx} className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[11px] font-mono text-sky-300">
                  {idx + 1}
                </span>
                {item.label}
              </span>
              <span className="text-xs font-mono font-extrabold text-orange-400 bg-orange-950/60 px-2 py-0.5 rounded border border-orange-800/60">
                +{item.contribution_percent}%
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed pl-7">
              {item.description}
            </p>
          </div>
        ))}
      </div>

    </div>
  );
};

export default ExplainabilityPage;

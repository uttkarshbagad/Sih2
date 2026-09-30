import React, { useState, useEffect } from 'react';
import { fetchClimateSignals } from '../services/api';
import { 
  Radio, 
  Globe2, 
  Activity, 
  Wind, 
  Compass, 
  Layers, 
  Zap, 
  ArrowDown, 
  Info,
  TrendingDown,
  TrendingUp
} from 'lucide-react';

export const ClimateSignalsPage = () => {
  const [signals, setSignals] = useState(null);

  useEffect(() => {
    const loadSignals = async () => {
      const data = await fetchClimateSignals();
      setSignals(data);
    };
    loadSignals();
  }, []);

  const enso = signals?.enso || {
    value: 0.8,
    status: "Warm Anomaly (El Niño Watch)",
    description: "Positive SST anomalies in central-eastern equatorial Pacific. Suppresses large-scale Indian monsoon Walker circulation.",
    regional_impact: "Tends to elevate break/dry-spell probabilities by 18-24%."
  };

  const iod = signals?.iod || {
    value: -0.4,
    status: "Negative IOD",
    description: "Cooler sea-surface temperatures in western Indian Ocean suppress moisture flux into the Bay of Bengal.",
    regional_impact: "Reduces atmospheric moisture transport to Odisha coastal blocks."
  };

  const mjo = signals?.mjo || {
    phase: 4,
    amplitude: 1.48,
    status: "Active (Phase 4 - Bay of Bengal)",
    description: "Convective envelope active over Maritime Continent and Bay of Bengal.",
    regional_impact: "Provides short windows of localized convective rainfall buffering against macro subsidence."
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="h-6 w-6 text-sky-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Large-Scale Climate Signals & Teleconnections
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Global oceanic and atmospheric oscillation indices modulating Indian monsoon intra-seasonal variability
          </p>
        </div>
        <span className="text-[11px] font-mono font-bold px-3 py-1 bg-sky-950 border border-sky-800 text-sky-300 rounded-lg self-start sm:self-auto">
          MoES Assimilation Feed: Active
        </span>
      </div>

      {/* 3 Core Climate Driver Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* ENSO Card */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe2 className="h-5 w-5 text-amber-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                ENSO (Niño 3.4)
              </h2>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
              +{enso.value}°C
            </span>
          </div>

          <div>
            <div className="text-2xl font-black text-amber-300 font-mono">
              {enso.status}
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {enso.description}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] text-amber-200/90 space-y-1">
            <div className="font-bold flex items-center gap-1">
              <TrendingDown className="h-3.5 w-3.5 text-amber-400" /> Regional Impact:
            </div>
            <div>{enso.regional_impact}</div>
          </div>
        </div>

        {/* IOD Card */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-rose-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Indian Ocean Dipole (IOD)
              </h2>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
              {iod.value}°C
            </span>
          </div>

          <div>
            <div className="text-2xl font-black text-rose-400 font-mono">
              {iod.status}
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {iod.description}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] text-rose-200/90 space-y-1">
            <div className="font-bold flex items-center gap-1">
              <TrendingDown className="h-3.5 w-3.5 text-rose-400" /> Regional Impact:
            </div>
            <div>{iod.regional_impact}</div>
          </div>
        </div>

        {/* MJO Card */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wind className="h-5 w-5 text-emerald-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Madden-Julian (MJO)
              </h2>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Phase {mjo.phase} (Amp {mjo.amplitude})
            </span>
          </div>

          <div>
            <div className="text-2xl font-black text-emerald-300 font-mono">
              {mjo.status}
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {mjo.description}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] text-emerald-200/90 space-y-1">
            <div className="font-bold flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> Regional Impact:
            </div>
            <div>{mjo.regional_impact}</div>
          </div>
        </div>

      </div>

      {/* Visual Influence Modeling Diagram */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-6 shadow-xl">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Zap className="h-5 w-5 text-indigo-400" />
            <span>How Large-Scale Climate Signals Influence Local Block Predictions</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Input features flow through the multi-layer ML ensemble to modulate block-level probabilities without asserting single-cause determinism.
          </p>
        </div>

        {/* Flow visual */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-center">
            
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-700/50 space-y-1">
              <div className="text-[11px] font-bold text-amber-300">ENSO (+0.8°C)</div>
              <p className="text-[10px] text-slate-400">Suppresses Walker cell</p>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-700/50 space-y-1">
              <div className="text-[11px] font-bold text-rose-300">Negative IOD (-0.4°C)</div>
              <p className="text-[10px] text-slate-400">Weaker Bay of Bengal flux</p>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-700/50 space-y-1">
              <div className="text-[11px] font-bold text-emerald-300">MJO Phase 4</div>
              <p className="text-[10px] text-slate-400">Short convective pulses</p>
            </div>

            <div className="p-3.5 rounded-xl bg-sky-950/40 border border-sky-700/50 space-y-1">
              <div className="text-[11px] font-bold text-sky-300">Regional Weather</div>
              <p className="text-[10px] text-slate-400">Wind sheer & soil water</p>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-700/50 space-y-1">
              <div className="text-[11px] font-bold text-indigo-300">Historical Climatology</div>
              <p className="text-[10px] text-slate-400">1991–2020 IMD Norms</p>
            </div>

          </div>

          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 bg-indigo-950/60 border border-indigo-500/50 px-4 py-2 rounded-xl text-xs font-bold text-indigo-300">
              <ArrowDown className="h-4 w-4 text-indigo-400 animate-bounce" />
              <span>Fed into FastAPI Machine Learning Prediction Service (XGBoost / Calibrated RF)</span>
              <ArrowDown className="h-4 w-4 text-indigo-400 animate-bounce" />
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-950 border border-slate-700 text-center space-y-2">
            <div className="text-xs font-bold text-sky-400 uppercase tracking-wider">
              Output: Hyperlocal Block Probabilistic Classification (e.g. Rajkanika)
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono">
              <span className="px-3 py-1 rounded-lg bg-emerald-950/80 border border-emerald-700 text-emerald-300 font-bold">
                Onset Prob: 76%
              </span>
              <span className="px-3 py-1 rounded-lg bg-orange-950/80 border border-orange-700 text-orange-300 font-bold">
                Break / Dry Spell Risk: 68%
              </span>
              <span className="px-3 py-1 rounded-lg bg-cyan-950/80 border border-cyan-700 text-cyan-300 font-bold">
                Heavy Rain Risk: 29%
              </span>
              <span className="px-3 py-1 rounded-lg bg-sky-950/80 border border-sky-700 text-sky-300 font-bold">
                Expected 14d Rain: 112 mm
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default ClimateSignalsPage;

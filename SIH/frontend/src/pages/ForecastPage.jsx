import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { 
  Calendar, 
  TrendingUp, 
  CloudRain, 
  SunMedium, 
  Droplets, 
  AlertCircle,
  MapPin
} from 'lucide-react';
import { RiskBadge } from '../components/common/RiskBadge';

export const ForecastPage = () => {
const { 
    selectedDistrict, 
    selectedBlock, 
    forecastHorizon, 
    setForecastHorizon,
    forecastData 
} = useApp();
  const [activeMetric, setActiveMetric] = useState('all');
  const [modelMode, setModelMode] = useState('heuristic');

  useEffect(() => {
    fetch('/api/model-card')
      .then(r => r.json())
      .then(data => setModelMode(data.model_mode || 'heuristic'))
      .catch(() => setModelMode('heuristic'));
  }, []);

  const timelineData = forecastData?.timeline || [];
  const displayTimeline = timelineData.length > 0 ? timelineData : [
    { period: "1–7 days", horizon_days: 7, onset: 0, break: 0, heavy_rain: 0, expected_rain: 0, rainfall_probability: 0, status: "Loading..." },
    { period: "8–14 days", horizon_days: 14, onset: 0, break: 0, heavy_rain: 0, expected_rain: 0, rainfall_probability: 0, status: "Loading..." },
    { period: "15–21 days", horizon_days: 21, onset: 0, break: 0, heavy_rain: 0, expected_rain: 0, rainfall_probability: 0, status: "Loading..." },
    { period: "22–30 days", horizon_days: 30, onset: 0, break: 0, heavy_rain: 0, expected_rain: 0, rainfall_probability: 0, status: "Loading..." }
  ];

  // Daily simulated timeline curve for granular chart
  const dailyData = forecastData?.daily_strip ? forecastData.daily_strip.map((d, i) => ({
    day: d.day,
    rainProb: d.probability,
    expRain: d.rain_mm,
    breakRisk: 0,
    onsetProb: 0,
    heavyProb: 0,
    temp: d.temp_max
  })) : [
    { day: "Day 1", rainProb: 0, expRain: 0, breakRisk: 0, onsetProb: 0, heavyProb: 0, temp: 0 },
    { day: "Day 3", rainProb: 0, expRain: 0, breakRisk: 0, onsetProb: 0, heavyProb: 0, temp: 0 },
    { day: "Day 5", rainProb: 0, expRain: 0, breakRisk: 0, onsetProb: 0, heavyProb: 0, temp: 0 },
    { day: "Day 7", rainProb: 0, expRain: 0, breakRisk: 0, onsetProb: 0, heavyProb: 0, temp: 0 },
    { day: "Day 9", rainProb: 0, expRain: 0, breakRisk: 0, onsetProb: 0, heavyProb: 0, temp: 0 },
    { day: "Day 11", rainProb: 0, expRain: 0, breakRisk: 0, onsetProb: 0, heavyProb: 0, temp: 0 },
    { day: "Day 13", rainProb: 0, expRain: 0, breakRisk: 0, onsetProb: 0, heavyProb: 0, temp: 0 },
    { day: "Day 15", rainProb: 0, expRain: 0, breakRisk: 0, onsetProb: 0, heavyProb: 0, temp: 0 },
    { day: "Day 18", rainProb: 0, expRain: 0, breakRisk: 0, onsetProb: 0, heavyProb: 0, temp: 0 },
    { day: "Day 21", rainProb: 0, expRain: 0, breakRisk: 0, onsetProb: 0, heavyProb: 0, temp: 0 },
    { day: "Day 25", rainProb: 0, expRain: 0, breakRisk: 0, onsetProb: 0, heavyProb: 0, temp: 0 },
    { day: "Day 30", rainProb: 0, expRain: 0, breakRisk: 0, onsetProb: 0, heavyProb: 0, temp: 0 }
  ];

  return (
    <div className="flex-1 w-full min-w-0 overflow-y-auto bg-slate-950 relative overflow-hidden px-3 py-4 sm:px-6 sm:py-6 lg:px-10 xl:px-12 2xl:px-16 space-y-6">
      
      {/* Header & Horizon Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-sky-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white">
              7–30 Day Probabilistic Forecast Outlook
            </h1>
            {modelMode && (
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                modelMode === 'trained' ? 'bg-emerald-900/50 text-emerald-300 border-emerald-500/40' : 'bg-amber-900/50 text-amber-300 border-amber-500/40'
              } border`}>
                {modelMode.toUpperCase()}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <MapPin className="h-3 w-3 text-sky-400" />
            <span>Target Location: {selectedBlock} Block, {selectedDistrict} (Odisha Zone 11)</span>
          </p>
        </div>

        {/* Horizon Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          {[7, 14, 21, 30].map(h => (
            <button
              key={h}
              onClick={() => setForecastHorizon(h)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                forecastHorizon === h
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {h} Days Horizon
            </button>
          ))}
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Probabilities Timeline (Onset vs Break vs Heavy Rain) */}
        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-400" />
                <span>Monsoon Probability Timeline (0–30 Days)</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Tracking Onset vs Break Risk transition across the 30-day window
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="breakGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="onsetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="heavyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} unit="%" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="breakRisk" name="Break / Dry Spell Risk %" stroke="#f97316" strokeWidth={2.5} fillOpacity={1} fill="url(#breakGrad)" />
                <Area type="monotone" dataKey="onsetProb" name="Onset Probability %" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#onsetGrad)" />
                <Area type="monotone" dataKey="heavyProb" name="Heavy Rain Risk %" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#heavyGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Expected Rainfall & Daily Rain Probability */}
        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Droplets className="h-4 w-4 text-sky-400" />
                <span>Expected Precipitation & Probability</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Estimated daily accumulation (mm) vs Rainfall Likelihood (%)
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="expRain" name="Expected Rain (mm)" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="rainProb" name="Rainfall Prob %" stroke="#38bdf8" strokeWidth={2} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 4-Period Progression Forecast Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">
              7–30 Day Period-by-Period Risk Matrix Table
            </h3>
            <p className="text-xs text-slate-400">
              Aggregated meteorological parameters across 4 standard sub-seasonal horizons
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
            {selectedBlock} Block
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 font-semibold bg-slate-950/60">
                <th className="p-3">Period Range</th>
                <th className="p-3 text-center">Onset Prob</th>
                <th className="p-3 text-center">Break / Dry Spell</th>
                <th className="p-3 text-center">Heavy Rain (&gt;65mm)</th>
                <th className="p-3 text-center">Expected Rain</th>
                <th className="p-3 text-center">Rainfall Likelihood</th>
                <th className="p-3 text-right">Agro-Meteorological Regime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {timelineData.map((row, idx) => (
                <tr 
                  key={idx} 
                  className={`hover:bg-slate-800/40 transition-colors ${
                    row.break >= 60 ? 'bg-orange-950/20' : ''
                  }`}
                >
                  <td className="p-3 font-sans font-bold text-slate-200 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-sky-400" />
                    {row.period}
                  </td>
                  <td className="p-3 text-center font-bold text-emerald-400">{row.onset}%</td>
                  <td className="p-3 text-center font-bold text-orange-400">{row.break}%</td>
                  <td className="p-3 text-center text-cyan-400 font-bold">{row.heavy_rain}%</td>
                  <td className="p-3 text-center text-sky-300 font-bold">{row.expected_rain} mm</td>
                  <td className="p-3 text-center text-slate-300">{row.rainfall_probability}%</td>
                  <td className="p-3 text-right font-sans">
                    <RiskBadge 
                      probability={row.break} 
                      customLabel={row.status} 
                      size="sm" 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default ForecastPage;

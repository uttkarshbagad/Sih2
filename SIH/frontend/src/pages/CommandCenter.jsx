import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { RiskBadge } from '../components/common/RiskBadge';
import { SpeakButton } from '../components/common/SpeakButton';
import { translations } from '../utils/localization';
import { 
  CloudRain, 
  SunMedium, 
  AlertTriangle, 
  Droplets, 
  Thermometer, 
  Wind, 
  CheckCircle2, 
  ArrowUpRight, 
  Sparkles, 
  HelpCircle,
  Sprout,
  Send,
  Calendar,
  Layers,
  MapPin
} from 'lucide-react';
import { fetchAlerts, acknowledgeAlertApi } from '../services/api';

export const CommandCenter = () => {
  const { 
    selectedState,
    selectedDistrict,
    selectedBlock,
    selectedPanchayat,
    forecastHorizon,
    setForecastHorizon,
    forecastData,
    loadingForecast,
    setActiveTab,
    farmerLanguage
  } = useApp();
  const [modelMode, setModelMode] = useState('heuristic');

  useEffect(() => {
    fetch('/api/model-card')
      .then(r => r.json())
      .then(data => setModelMode(data.model_mode || 'heuristic'))
      .catch(() => setModelMode('heuristic'));
  }, []);

  const t = translations[farmerLanguage] || translations.en;
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const loadAlerts = async () => {
      const data = await fetchAlerts();
      setAlerts(data);
    };
    loadAlerts();
  }, []);

  const handleAck = async (id) => {
    await acknowledgeAlertApi(id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'ACKNOWLEDGED' } : a));
  };

  const m = forecastData?.metrics || {
    onset_probability: 0.76,
    break_probability: 0.68,
    heavy_rain_probability: 0.29,
    confidence: 0.81,
    expected_rainfall_mm: 112.0,
    soil_moisture_level: 'Low',
    soil_moisture_fraction: 0.22,
    temperature_c: 34.2,
    temperature_anomaly: 2.8,
    humidity_percent: 65.0,
    rainfall_anomaly_percent: -24.0,
    dominant_risk: 'HIGH',
    risk_factor: 'Extended Dry Spell during Early Crop Establishment'
  };

  return (
    <div className="flex-1 w-full min-w-0 overflow-y-auto bg-slate-950 relative overflow-hidden px-3 py-4 sm:px-6 sm:py-6 lg:px-10 xl:px-12 2xl:px-16 space-y-6">
      
      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 sm:p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {t.cmdTitle}
            </h1>
            <span className="bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
              {t.cmdBadge}
            </span>
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
            <span className="font-semibold text-slate-300">{selectedState}</span> → 
            <span className="font-semibold text-slate-300">{selectedDistrict} {t.district}</span> → 
            <span className="font-bold text-amber-300">{selectedBlock} {t.block}</span>
            {selectedPanchayat && <span className="text-slate-400">({selectedPanchayat} GP)</span>}
          </p>
        </div>

        {/* Forecast Horizon Selector */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-slate-950 p-1 rounded-xl border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 px-2 flex items-center gap-1">
            <Calendar className="h-3 w-3 text-sky-400" /> {t.cmdHorizon}:
          </span>
          {[7, 14, 21, 30].map(h => (
            <button
              key={h}
              onClick={() => setForecastHorizon(h)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                forecastHorizon === h
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {h} {t.days}
            </button>
          ))}
        </div>
      </div>

      {/* Top 4 Primary KPI Probability Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Monsoon Onset */}
        <div className="relative rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t.cmdOnset}
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CloudRain className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
              {Math.round(m.onset_probability * 100)}%
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400">
                {m.onset_probability >= 0.70 ? t.cmdFavorable : t.cmdModerateWindow}
              </span>
              <RiskBadge probability={m.onset_probability} customLabel="ONSET PROB" size="sm" />
            </div>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.round(m.onset_probability * 100)}%` }} 
            />
          </div>
        </div>

        {/* KPI 2: Break / Dry Spell Risk */}
        <div className="relative rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t.cmdBreak}
            </span>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <SunMedium className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-orange-400 font-mono">
              {Math.round(m.break_probability * 100)}%
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-orange-300">
                {m.break_probability >= 0.60 ? t.cmdElevated : t.cmdLowDry}
              </span>
              <RiskBadge probability={m.break_probability} size="sm" />
            </div>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-orange-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.round(m.break_probability * 100)}%` }} 
            />
          </div>
        </div>

        {/* KPI 3: Heavy Rain Risk */}
        <div className="relative rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t.cmdHeavyRain}
            </span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Droplets className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
              {Math.round(m.heavy_rain_probability * 100)}%
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-300">
                {m.heavy_rain_probability >= 0.50 ? t.cmdHighInundation : t.cmdModConvection}
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {m.heavy_rain_probability >= 0.50 ? 'HIGH' : 'MODERATE'}
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-cyan-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.round(m.heavy_rain_probability * 100)}%` }} 
            />
          </div>
        </div>

        {/* KPI 4: Forecast Confidence */}
        <div className="relative rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t.cmdConfidence}
            </span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-sky-300 font-mono">
              {Math.round(m.confidence * 100)}%
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                {t.cmdCoupledModel}
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                {t.cmdHighConf}
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-sky-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.round(m.confidence * 100)}%` }} 
            />
          </div>
        </div>

      </div>

      {/* Secondary Agro-Meteorological Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-3.5 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
            <Droplets className="h-3.5 w-3.5 text-sky-400" /> {t.cmdExpectedRain} ({forecastHorizon}{t.days})
          </div>
          <div className="text-lg font-bold text-white font-mono">
            {m.expected_rainfall_mm} <span className="text-xs text-slate-400 font-normal">{t.mm}</span>
          </div>
          <p className="text-[10px] text-slate-500">
            {t.cmdClimatNormal}: {forecastHorizon === 7 ? 55 : forecastHorizon === 14 ? 110 : forecastHorizon === 21 ? 165 : 240} {t.mm}
          </p>
        </div>

        <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-3.5 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
            <CloudRain className="h-3.5 w-3.5 text-rose-400" /> {t.cmdRainAnomaly}
          </div>
          <div className={`text-lg font-bold font-mono ${m.rainfall_anomaly_percent < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {m.rainfall_anomaly_percent > 0 ? `+${m.rainfall_anomaly_percent}` : m.rainfall_anomaly_percent}%
          </div>
          <p className="text-[10px] text-slate-500">
            {t.cmdDeparture}
          </p>
        </div>

        <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-3.5 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
            <Sprout className="h-3.5 w-3.5 text-amber-400" /> {t.cmdSoilMoisture}
          </div>
          <div className="text-lg font-bold text-amber-300 font-mono">
            {m.soil_moisture_level} <span className="text-xs text-slate-400 font-normal">({(m.soil_moisture_fraction * 100).toFixed(0)}% VWC)</span>
          </div>
          <p className="text-[10px] text-slate-500">
            {t.cmdRootZone}
          </p>
        </div>

        <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-3.5 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
            <Thermometer className="h-3.5 w-3.5 text-orange-400" /> {t.cmdSurfaceTemp}
          </div>
          <div className="text-lg font-bold text-white font-mono">
            {m.temperature_c}°C <span className="text-xs text-orange-400 font-semibold">(+{m.temperature_anomaly}°C)</span>
          </div>
          <p className="text-[10px] text-slate-500">
            {t.cmdEvap}
          </p>
        </div>

      </div>

      {/* Main Grid: Live Advisory Banner + Explainability Callout + Officer Alert Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Active Advisory Card & 3 Core Questions UI */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Sowing Caution Banner */}
          <div className="rounded-2xl bg-gradient-to-r from-orange-950/70 via-slate-900 to-slate-900 border border-orange-500/40 p-6 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-orange-400 animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider text-orange-300 bg-orange-500/20 px-2.5 py-1 rounded-md border border-orange-500/30">
                  {t.cmdAdvisoryActive}
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-400">{t.cmdTargetCrop}: {t.rice}</span>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white">
                {t.cmdSowingCaution} {selectedBlock}
              </h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {t.cmdAdvisoryDesc}
              </p>
            </div>

            {/* 3 Core UX Principles Highlight */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400">{t.cmdQ1}</div>
                <div className="text-xs font-semibold text-slate-200">
                  {t.cmdQ1A}
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">{t.cmdQ2}</div>
                <div className="text-xs font-semibold text-slate-200">
                  {t.cmdQ2A}
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">{t.cmdQ3}</div>
                <div className="text-xs font-semibold text-slate-200">
                  {t.cmdQ3A}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <SpeakButton
                text={`${t.cmdSowingCaution}. ${t.cmdQ2A} ${t.cmdQ3A}`}
                lang={farmerLanguage}
                t={t}
              />

              <button
                onClick={() => setActiveTab('advisories')}
                className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                <Sprout className="h-4 w-4" />
                <span>{t.cmdOpenAdvisory}</span>
              </button>

              <button
                onClick={() => setActiveTab('explainability')}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                <HelpCircle className="h-4 w-4 text-indigo-400" />
                <span>{t.cmdWhyPrediction}</span>
              </button>

              <button
                onClick={() => setActiveTab('notifications')}
                className="flex items-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{t.cmdBroadcast}</span>
              </button>
            </div>
          </div>

          {/* Forecast Quick Timeline Preview */}
          <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-sky-400" />
                <span>{t.cmdTimeline}</span>
              </h3>
              <button
                onClick={() => setActiveTab('forecast')}
                className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
              >
                <span>{t.cmdFullTimeline}</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="pb-2">{t.cmdPeriod}</th>
                    <th className="pb-2 text-center">{t.cmdOnsetProb}</th>
                    <th className="pb-2 text-center">{t.cmdBreakRisk}</th>
                    <th className="pb-2 text-center">{t.cmdHeavyRisk}</th>
                    <th className="pb-2 text-right">{t.cmdExpectedRainTbl}</th>
                    <th className="pb-2 text-right">{t.cmdStatus}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  <tr>
                    <td className="py-2.5 font-sans font-bold text-slate-200">1–7 {t.days}</td>
                    <td className="py-2.5 text-center text-emerald-400 font-bold">76%</td>
                    <td className="py-2.5 text-center text-slate-300">18%</td>
                    <td className="py-2.5 text-center text-slate-300">29%</td>
                    <td className="py-2.5 text-right text-sky-300 font-bold">54 {t.mm}</td>
                    <td className="py-2.5 text-right font-sans text-emerald-400 font-semibold">{t.cmdFavOnset}</td>
                  </tr>
                  <tr className="bg-orange-950/20">
                    <td className="py-2.5 font-sans font-bold text-orange-300">8–14 {t.days}</td>
                    <td className="py-2.5 text-center text-slate-300">68%</td>
                    <td className="py-2.5 text-center text-orange-400 font-bold">68%</td>
                    <td className="py-2.5 text-center text-slate-300">38%</td>
                    <td className="py-2.5 text-right text-orange-300 font-bold">38 {t.mm}</td>
                    <td className="py-2.5 text-right font-sans text-orange-400 font-bold">{t.cmdDryBreak}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-sans font-bold text-slate-200">15–21 {t.days}</td>
                    <td className="py-2.5 text-center text-slate-300">58%</td>
                    <td className="py-2.5 text-center text-amber-400 font-bold">52%</td>
                    <td className="py-2.5 text-center text-slate-300">24%</td>
                    <td className="py-2.5 text-right text-sky-300 font-bold">29 {t.mm}</td>
                    <td className="py-2.5 text-right font-sans text-amber-400 font-semibold">{t.cmdModStress}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-sans font-bold text-slate-200">22–30 {t.days}</td>
                    <td className="py-2.5 text-center text-slate-300">52%</td>
                    <td className="py-2.5 text-center text-slate-300">32%</td>
                    <td className="py-2.5 text-center text-cyan-400 font-bold">42%</td>
                    <td className="py-2.5 text-right text-sky-300 font-bold">42 {t.mm}</td>
                    <td className="py-2.5 text-right font-sans text-sky-400 font-semibold">{t.cmdMonsoonRecovery}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Col: Live Officer Alert Feed */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white">{t.cmdAlertsFeed}</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {alerts.filter(a => a.status === 'ACTIVE').length} {t.cmdActive}
              </span>
            </div>

            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-xl border text-xs space-y-2 transition-all ${
                    alert.status === 'ACTIVE'
                      ? 'bg-slate-950/90 border-slate-700 shadow-md'
                      : 'bg-slate-900/40 border-slate-800/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${alert.status === 'ACTIVE' ? 'bg-rose-500 animate-ping' : 'bg-slate-500'}`} />
                      {alert.block} ({alert.district})
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {alert.metric_value}
                    </span>
                  </div>

                  <h4 className="font-semibold text-white text-[12px]">{alert.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{alert.message}</p>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-amber-300 font-medium">
                      Action: {alert.action_suggested}
                    </span>
                    {alert.status === 'ACTIVE' ? (
                      <button
                        onClick={() => handleAck(alert.id)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                      >
                        {t.cmdAcknowledge}
                      </button>
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> {t.cmdAcknowledged}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick GIS Map Trigger Link */}
            <div 
              onClick={() => setActiveTab('risk-map')}
              className="p-3.5 rounded-xl bg-gradient-to-r from-sky-950/50 to-indigo-950/50 border border-sky-800/50 flex items-center justify-between cursor-pointer group hover:border-sky-500 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Layers className="h-5 w-5 text-sky-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="text-xs font-bold text-white">{t.cmdGISMap}</div>
                  <div className="text-[11px] text-slate-400">{t.cmdGISDesc}</div>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-sky-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};

export default CommandCenter;

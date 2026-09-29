import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { fetchHistorical, fetchHistoricalML, fetchValidationSummary, fetchModelCard } from '../services/api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
  Cell
} from 'recharts';
import { History, Calendar, TrendingDown, AlertCircle, MapPin, Cpu, Sparkles, GitCompare, Activity } from 'lucide-react';

export const HistoricalPage = () => {
  const { selectedLocationId, selectedBlock, selectedDistrict } = useApp();
  const [histData, setHistData] = useState(null);
  const [mlData, setMlData] = useState(null);
  const [validationSummary, setValidationSummary] = useState(null);
  const [modelCard, setModelCard] = useState(null);

  useEffect(() => {
    const loadHist = async () => {
      const data = await fetchHistorical(selectedLocationId);
      setHistData(data);
      // Prefer embedded ml_insights; else call dedicated ML endpoint
      if (data?.ml_insights?.status === 'success') {
        setMlData(data.ml_insights);
      } else if (data?.yearly_records) {
        const ml = await fetchHistoricalML({
          yearly_records: data.yearly_records,
          current: { rainfall_anomaly: -24.0, dry_spell_days: 9, enso: 0.8, iod: -0.4 },
          district_name: selectedDistrict, block_name: selectedBlock
        });
        if (ml?.status === 'success') setMlData(ml);
      }
      
      // Load validation summary and model card
      const [valSummary, modelCard] = await Promise.all([
        fetchValidationSummary(),
        fetchModelCard()
      ]);
      if (valSummary) setValidationSummary(valSummary);
      if (modelCard) setModelCard(modelCard);
    };
    loadHist();
  }, [selectedLocationId]);

  const yearlyRecords = histData?.yearly_records || [
    { year: 2021, seasonal_rainfall_mm: 1069.5, rainfall_anomaly_percent: -7.0, onset_date: "June 12", longest_dry_spell_days: 8, monsoon_type: "Near Normal with Late Break" },
    { year: 2022, seasonal_rainfall_mm: 1196.0, rainfall_anomaly_percent: 4.0, onset_date: "June 08", longest_dry_spell_days: 5, monsoon_type: "Timely & Favorable" },
    { year: 2023, seasonal_rainfall_mm: 1012.0, rainfall_anomaly_percent: -12.0, onset_date: "June 18", longest_dry_spell_days: 14, monsoon_type: "El Niño Influenced Deficit" },
    { year: 2024, seasonal_rainfall_mm: 1242.0, rainfall_anomaly_percent: 8.0, onset_date: "June 09", longest_dry_spell_days: 6, monsoon_type: "La Niña Modulated Surplus" },
    { year: 2025, seasonal_rainfall_mm: 1092.5, rainfall_anomaly_percent: -5.0, onset_date: "June 14", longest_dry_spell_days: 9, monsoon_type: "Neutral ENSO" },
    { year: 2026, seasonal_rainfall_mm: 943.0, rainfall_anomaly_percent: -18.0, onset_date: "June 19", longest_dry_spell_days: 16, monsoon_type: "Active Dry Spell (Prototype)" }
  ];

  return (
    <div className="flex-1 w-full min-w-0 overflow-y-auto bg-slate-950 relative overflow-hidden px-3 py-4 sm:px-6 sm:py-6 lg:px-10 xl:px-12 2xl:px-16 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <History className="h-6 w-6 text-sky-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Historical Monsoon Climatology (2021–2026)
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-sky-400" />
            <span>Retrospective analysis and analog matching for {selectedBlock} Block ({selectedDistrict})</span>
          </p>
        </div>
        <div className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
          Baseline IMD Normal: <strong className="text-sky-300">1,150 mm</strong>
        </div>
      </div>

      {/* Model Validation Summary */}
      {validationSummary && (
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-emerald-400" />
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Model Validation Summary
                {modelCard && modelCard.model_mode && (
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    modelCard.model_mode === 'trained' ? 'bg-emerald-900/50 text-emerald-300' : 'bg-amber-900/50 text-amber-300'
                  }`}>
                    {modelCard.model_mode.toUpperCase()}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Skill metrics from leave-one-year-out CV + held-out test season
              </p>
            </div>
          </div>
          
          {validationSummary.targets && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(validationSummary.targets).map(([target, metrics]) => (
                <div key={target} className="rounded-xl bg-slate-950/60 border border-slate-800 p-3 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {target.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="text-slate-500">Brier Score</div>
                    <div className="text-white font-mono font-bold">{metrics.brier_score?.toFixed ? metrics.brier_score.toFixed(4) : 'N/A'}</div>
                    <div className="text-slate-500">BSS vs Clim</div>
                    <div className={`text-white font-mono font-bold ${metrics.brier_skill_score > 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {metrics.brier_skill_score?.toFixed ? metrics.brier_skill_score.toFixed(4) : 'N/A'}
                    </div>
                    <div className="text-slate-500">ROC-AUC</div>
                    <div className="text-white font-mono font-bold">{metrics.roc_auc?.toFixed ? metrics.roc_auc.toFixed(4) : 'N/A'}</div>
                    <div className="text-slate-500">Hit Rate</div>
                    <div className="text-white font-mono font-bold">{metrics.hit_rate?.toFixed ? metrics.hit_rate.toFixed(3) : 'N/A'}</div>
                    <div className="text-slate-500">FAR</div>
                    <div className="text-white font-mono font-bold">{metrics.false_alarm_ratio?.toFixed ? metrics.false_alarm_ratio.toFixed(3) : 'N/A'}</div>
                    <div className="text-slate-500">Prevalence</div>
                    <div className="text-white font-mono font-bold">{metrics.prevalence?.toFixed ? (metrics.prevalence * 100).toFixed(1) + '%' : 'N/A'}</div>
                  </div>
                  {metrics.bss_bootstrap_ci && (
                    <div className="text-[9px] text-slate-500 border-t border-slate-800 pt-1.5">
                      BSS 95% CI: [{metrics.bss_bootstrap_ci.ci_lower.toFixed(4)}, {metrics.bss_bootstrap_ci.ci_upper.toFixed(4)}]
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-3 flex flex-wrap gap-4">
            <span>Spatial: {validationSummary.spatial_unit || 'IMD 0.25° grid'}</span>
            <span>Train: {validationSummary.train_years?.join(', ')}</span>
            <span>Test: {validationSummary.test_years?.join(', ')}</span>
            <span>Samples: {validationSummary.test_samples?.toLocaleString()}</span>
          </div>
        </div>
      )}
      
      {/* Model Card Info */}
      {modelCard && modelCard.training && (
        <div className="rounded-2xl bg-indigo-950/40 border border-indigo-500/40 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-indigo-300" />
            <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Model Card</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="text-slate-400">Region</div>
            <div className="text-white">{modelCard.training.region}</div>
            <div className="text-slate-400">Resolution</div>
            <div className="text-white">{modelCard.training.spatial_resolution}</div>
            <div className="text-slate-400">Train Years</div>
            <div className="text-white">{modelCard.training.train_years?.join(', ')}</div>
            <div className="text-slate-400">Git Commit</div>
            <div className="text-white font-mono">{modelCard.training.git_commit?.slice(0, 8)}</div>
          </div>
          <div className="text-[10px] text-slate-400">
            Limitations: {modelCard.limitations?.join('; ')}
          </div>
        </div>
      )}
      
      {/* Historical Charts Grid */}
        
        {/* Chart 1: Year vs Rainfall Anomaly */}
        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 space-y-4 shadow-xl">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-orange-400" />
              <span>Rainfall Anomaly (% Departure from Normal)</span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Positive values indicate excess monsoon; negative values indicate drought/deficit stress
            </p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyRecords} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="year" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit="%" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }}
                />
                <Bar dataKey="rainfall_anomaly_percent" name="Anomaly %">
                  {yearlyRecords.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.rainfall_anomaly_percent >= 0 ? '#10b981' : '#f97316'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Longest Dry Spell Duration (Days) */}
        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 space-y-4 shadow-xl">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-rose-400" />
              <span>Longest Intra-Seasonal Dry Spell (Days)</span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Consecutive rainless days during critical Kharif vegetative window
            </p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={yearlyRecords} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="year" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit="d" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="longest_dry_spell_days" 
                  name="Dry Spell Duration (Days)" 
                  stroke="#ef4444" 
                  strokeWidth={3} 
                  dot={{ r: 5, fill: '#ef4444' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ML Insights: Trend + Anomaly + Analog + Climatology */}
      {mlData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-gradient-to-br from-sky-950/80 to-slate-900 border border-sky-700/40 p-5 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400">ML Trend Detection</div>
            <div className="text-sm font-bold text-white">{mlData.trend?.interpretation}</div>
            <div className="text-xs font-mono text-slate-300">Rainfall {mlData.trend?.rainfall_trend_mm_per_year} mm/yr (R² {mlData.trend?.rainfall_trend_r2}) • Dry {mlData.trend?.dry_spell_trend_days_per_year} d/yr</div>
            <div className="text-[11px] text-slate-400">Model: {mlData.trend?.model} • v{mlData.model_version}</div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-orange-950/60 to-slate-900 border border-orange-700/40 p-5 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-orange-400">ML Anomaly Years</div>
            <div className="text-sm font-bold text-white">Anomalies: {(mlData.anomalies?.anomaly_years || []).join(', ') || 'None'}</div>
            <div className="text-xs text-slate-300">Mean {mlData.anomalies?.mean_rainfall_mm} mm (±{mlData.anomalies?.std_rainfall_mm}) • Dry {mlData.anomalies?.mean_dryspell_days}d</div>
            <div className="text-[11px] text-slate-400">Model: {mlData.anomalies?.model}</div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-700/40 p-5 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">ML Analog + Outlook ({mlData.risk_outlook})</div>
            <div className="text-sm font-bold text-white">{mlData.analogs?.consensus?.message}</div>
            <div className="text-xs text-slate-300">Top: {(mlData.analogs?.top_analogs || []).map(a => `${a.year} (${a.similarity_pct}%)`).join(' • ')}</div>
            <div className="text-[11px] text-amber-300">{mlData.advisory}</div>
          </div>
        </div>
      )}

      {/* Historical Records Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-white">5-Year Historical Climatology Archive (Odisha Zone 11)</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 font-semibold bg-slate-950/60">
                <th className="p-3">Year</th>
                <th className="p-3 text-center">Seasonal Rainfall</th>
                <th className="p-3 text-center">Departure</th>
                <th className="p-3 text-center">Onset Date</th>
                <th className="p-3 text-center">Longest Dry Spell</th>
                <th className="p-3 text-right">Monsoon Regime Character</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {yearlyRecords.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40">
                  <td className="p-3 font-sans font-bold text-white">{row.year}</td>
                  <td className="p-3 text-center text-sky-300 font-bold">{row.seasonal_rainfall_mm} mm</td>
                  <td className={`p-3 text-center font-bold ${row.rainfall_anomaly_percent >= 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
                    {row.rainfall_anomaly_percent > 0 ? `+${row.rainfall_anomaly_percent}` : row.rainfall_anomaly_percent}%
                  </td>
                  <td className="p-3 text-center font-sans text-slate-200">{row.onset_date}</td>
                  <td className="p-3 text-center font-bold text-rose-400">{row.longest_dry_spell_days} days</td>
                  <td className="p-3 text-right font-sans text-slate-300">{row.monsoon_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Analysis ML Engine Insights */}
      {histData?.ml_insights && (
        <div className="rounded-2xl bg-slate-900/80 border border-indigo-500/40 p-6 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">
                Historical Analysis ML Engine
              </h3>
              {histData.ml_insights.model_version && (
                <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded-full border border-indigo-700/60">
                  {histData.ml_insights.model_version}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {histData.ml_insights.status === 'fallback' ? (
                <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-600/40">
                  ML service offline · static climatology
                </span>
              ) : (
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-600/40">
                  {histData.ml_insights.source || 'ML engine live'}
                </span>
              )}
              {histData.ml_insights.risk_outlook && (
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                  histData.ml_insights.risk_outlook === 'HIGH'
                    ? 'text-rose-300 bg-rose-950/60 border-rose-600/40'
                    : 'text-amber-300 bg-amber-950/60 border-amber-600/40'
                }`}>
                  {histData.ml_insights.risk_outlook} RISK
                </span>
              )}
            </div>
          </div>

          {histData.ml_insights.status === 'fallback' && histData.ml_insights.message && (
            <p className="text-[11px] text-amber-300/90 bg-amber-950/30 border border-amber-600/30 rounded-lg px-3 py-2">
              {histData.ml_insights.message}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Trend Analysis */}
            {histData.ml_insights.trend && (
              <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-orange-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">ML Trend Detection</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold">Rainfall Trend</div>
                    <div className="text-lg font-black text-orange-300 font-mono">
                      {histData.ml_insights.trend.rainfall_trend_mm_per_year != null
                        ? `${histData.ml_insights.trend.rainfall_trend_mm_per_year > 0 ? '+' : ''}${histData.ml_insights.trend.rainfall_trend_mm_per_year} mm/yr`
                        : '--'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      {histData.ml_insights.trend.rainfall_trend_label}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold">Dry-Spell Trend</div>
                    <div className="text-lg font-black text-rose-300 font-mono">
                      {histData.ml_insights.trend.dry_spell_trend_days_per_year != null
                        ? `${histData.ml_insights.trend.dry_spell_trend_days_per_year > 0 ? '+' : ''}${histData.ml_insights.trend.dry_spell_trend_days_per_year} d/yr`
                        : '--'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      {histData.ml_insights.trend.dry_spell_trend_label}
                    </div>
                  </div>
                </div>
                {histData.ml_insights.trend.interpretation && (
                  <p className="text-[11px] text-slate-300 leading-relaxed border-t border-slate-800 pt-2">
                    {histData.ml_insights.trend.interpretation}
                  </p>
                )}
              </div>
            )}

            {/* Anomaly Detection */}
            {histData.ml_insights.anomalies && (
              <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">ML Anomaly Detection</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(histData.ml_insights.anomalies.anomaly_years || []).length > 0 ? (
                    histData.ml_insights.anomalies.anomaly_years.map((yr) => (
                      <span key={yr} className="text-[10px] font-mono font-bold text-rose-300 bg-rose-950/60 border border-rose-700/50 px-2 py-1 rounded-lg">
                        {yr} flagged
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">No statistically anomalous years detected.</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div className="text-slate-300"><span className="text-slate-500">Mean:</span> {histData.ml_insights.anomalies.mean_rainfall_mm} mm</div>
                  <div className="text-slate-300"><span className="text-slate-500">Std:</span> ±{histData.ml_insights.anomalies.std_rainfall_mm} mm</div>
                  <div className="text-slate-300"><span className="text-slate-500">Mean dry spell:</span> {histData.ml_insights.anomalies.mean_dryspell_days} d</div>
                  <div className="text-slate-300"><span className="text-slate-500">Std dry spell:</span> ±{histData.ml_insights.anomalies.std_dryspell_days} d</div>
                </div>
                {histData.ml_insights.anomalies.model && (
                  <div className="text-[9px] font-mono text-slate-500">{histData.ml_insights.anomalies.model}</div>
                )}
              </div>
            )}

            {/* Analog Matching */}
            {histData.ml_insights.analogs && (
              <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <GitCompare className="h-4 w-4 text-sky-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Historical Analog Matching</span>
                </div>
                <div className="space-y-1.5">
                  {(histData.ml_insights.analogs.top_analogs || []).map((a, i) => (
                    <div key={a.year} className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-sky-300">{i + 1}</span>
                        <div>
                          <div className="text-xs font-bold text-white font-mono">{a.year}</div>
                          <div className="text-[10px] text-slate-400">{a.monsoon_type} · {a.longest_dry_spell_days}d dry spell</div>
                        </div>
                      </div>
                      <span className="text-xs font-black font-mono text-emerald-400">{a.similarity_pct}%</span>
                    </div>
                  ))}
                </div>
                {histData.ml_insights.analogs.consensus?.message && (
                  <p className="text-[11px] text-sky-200 bg-sky-950/40 border border-sky-700/40 rounded-lg px-3 py-2 leading-relaxed">
                    {histData.ml_insights.analogs.consensus.message}
                  </p>
                )}
              </div>
            )}

            {/* Climatology Stats */}
            {histData.ml_insights.climatology && (
              <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">ML Climatology Stats</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] text-slate-400">Mean Seasonal Rainfall</div>
                    <div className="text-lg font-black text-sky-300 font-mono">{histData.ml_insights.climatology.mean_seasonal_mm} mm</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Deficit-Year Probability</div>
                    <div className="text-lg font-black text-orange-300 font-mono">{histData.ml_insights.climatology.deficit_year_probability_pct}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Drought Return Period</div>
                    <div className="text-lg font-black text-amber-300 font-mono">{histData.ml_insights.climatology.drought_return_period_years} yr</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Mean Onset Date</div>
                    <div className="text-lg font-black text-emerald-300 font-mono">
                      June {histData.ml_insights.climatology.mean_onset_june_day}
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-2">
                  Range {histData.ml_insights.climatology.min_seasonal_mm}–{histData.ml_insights.climatology.max_seasonal_mm} mm · Max dry spell {histData.ml_insights.climatology.max_dry_spell_days} d · Baseline {histData.ml_insights.climatology.baseline_normal_mm} mm
                </div>
              </div>
            )}
          </div>

          {histData.ml_insights.advisory && (
            <div className="rounded-xl bg-gradient-to-r from-indigo-950/70 to-slate-900 border border-indigo-500/40 p-4 flex items-start gap-3">
              <Sparkles className="h-4 w-4 text-indigo-300 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">ML Advisory Outlook</div>
                <p className="text-xs text-slate-200 leading-relaxed mt-0.5">{histData.ml_insights.advisory}</p>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default HistoricalPage;

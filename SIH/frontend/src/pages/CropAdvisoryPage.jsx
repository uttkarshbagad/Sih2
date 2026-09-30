import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { fetchCrops, generateAdvisory } from '../services/api';
import { SpeakButton } from '../components/common/SpeakButton';
import { translations } from '../utils/localization';
import { 
  Sprout, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Droplets, 
  SunMedium, 
  ShieldAlert, 
  ArrowRight,
  Send,
  Sparkles,
  Info
} from 'lucide-react';
import { RiskBadge } from '../components/common/RiskBadge';

export const CropAdvisoryPage = () => {
  const { 
    selectedDistrict, 
    selectedBlock, 
    selectedLocationId,
    selectedCrop, 
    setSelectedCrop,
    forecastHorizon,
    farmerLanguage,
    setActiveTab
  } = useApp();

  const t = translations[farmerLanguage] || translations.en;

  const [cropsList, setCropsList] = useState([]);
  const [advisory, setAdvisory] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCrops = async () => {
      const list = await fetchCrops();
      setCropsList(list);
    };
    loadCrops();
  }, []);

  useEffect(() => {
    const loadAdvisory = async () => {
      setLoading(true);
      const data = await generateAdvisory(selectedCrop, selectedLocationId, selectedDistrict, selectedBlock);
      setAdvisory(data);
      setLoading(false);
    };
    loadAdvisory();
  }, [selectedCrop, selectedLocationId, selectedBlock, selectedDistrict]);

  const activeCropObj = cropsList.find(c => c.id === selectedCrop) || cropsList[0];

  const getLocalized = (obj) => {
    if (!obj) return "";
    return obj[farmerLanguage] || obj.en || "";
  };

  const getLocalizedArray = (obj) => {
    if (!obj) return [];
    return obj[farmerLanguage] || obj.en || [];
  };

  const cropEmojis = { rice: '🌾', maize: '🌽', groundnut: '🥜', pulses: '🌱', vegetables: '🥦' };

  return (
    <div className="flex-1 w-full min-w-0 overflow-y-auto bg-slate-950 relative overflow-hidden px-3 py-4 sm:px-6 sm:py-6 lg:px-10 xl:px-12 2xl:px-16 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <Sprout className="h-6 w-6 text-emerald-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white">
              {t.navAdvisory}
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {t.landingAdvisoryDesc}
          </p>
        </div>
        <div className="text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 self-start sm:self-auto font-mono">
          {t.fmLocation}: <strong className="text-amber-300">{selectedBlock}</strong> ({selectedDistrict})
        </div>
      </div>

      {/* Crop Selector Chips */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {t.cmdTargetCrop}:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          {cropsList.map((crop) => {
            const isSelected = selectedCrop === crop.id;
            return (
              <button
                key={crop.id}
                onClick={() => setSelectedCrop(crop.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-lg shadow-emerald-950/40'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-lg">
                    {cropEmojis[crop.id] || '🪴'}
                  </span>
                  {isSelected && <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />}
                </div>
                <div className="font-bold text-xs truncate">{crop.name_en || crop.name}</div>
                <div className="text-[10px] text-slate-500 font-odia">{crop.name_or || ""}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Advisory Display Banner */}
      {advisory && (
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-700 p-6 space-y-6 shadow-2xl">
          
          {/* Top Banner with Type & Urgency */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                advisory.advisoryType === 'Delay Sowing' ? 'bg-orange-500/20 text-orange-300 border-orange-500/40' :
                advisory.advisoryType === 'Proceed with Sowing' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                advisory.advisoryType === 'Prepare Drainage' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' :
                'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {advisory.advisoryType}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                {t.fmMyCrop}: <strong className="text-slate-200">{activeCropObj?.name_en || activeCropObj?.name}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-mono">
                Advisory ID: ADV-{advisory.cropId.toUpperCase()}-{selectedBlock.slice(0,3).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Localized Recommendation Title */}
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
              {getLocalized(advisory.title)}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {t.cmdDeparture}
            </p>
          </div>

          {/* Action Bullet Points */}
          <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> {t.cmdAdvisoryActive}:
            </h3>

            <ul className="space-y-2.5 text-xs text-slate-200">
              {getLocalizedArray(advisory.actionPoints).map((action, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-sky-950 text-[11px] font-bold text-sky-400 border border-sky-800 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{action}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* "Why this Recommendation?" Trigger Section */}
          <div className="rounded-xl bg-orange-950/20 border border-orange-800/40 p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-2">
              <HelpCircle className="h-4 w-4" /> {t.cmdQ2}:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {advisory.triggerReasons.map((reason, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
                  <span className="leading-relaxed">{reason}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Crop Profile & Requirements Summary Card */}
          {activeCropObj && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              <div>
                <span className="text-[10px] text-slate-400 block">{t.cmdExpectedRain}</span>
                <strong className="text-white font-mono">{activeCropObj.optimal_rainfall_mm} {t.mm}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">{t.cmdRainAnomaly}</span>
                <strong className="text-orange-400">{activeCropObj.drought_sensitivity}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">{t.cmdHeavyRain}</span>
                <strong className="text-cyan-400">{activeCropObj.heavy_rain_sensitivity}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">{t.cmdHorizon}</span>
                <strong className="text-emerald-400">{activeCropObj.sowing_window}</strong>
              </div>
            </div>
          )}

          {/* Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2">
              <SpeakButton
                text={getLocalized(advisory.title) + '. ' + getLocalizedArray(advisory.actionPoints).join('. ')}
                lang={farmerLanguage}
                t={t}
              />

              <button
                onClick={() => setActiveTab('farmer-mode')}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
              >
                <span>{t.fmAppTitle}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => setActiveTab('notifications')}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                <Send className="h-3.5 w-3.5 text-sky-400" />
                <span>{t.cmdBroadcast}</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-500 font-mono">
              {t.footerLeft}
            </span>
          </div>

        </div>
      )}

    </div>
  );
};

export default CropAdvisoryPage;

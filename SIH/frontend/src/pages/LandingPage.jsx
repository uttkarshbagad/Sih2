import React from 'react';
import { useApp } from '../context/AppContext';
import { SpeakButton } from '../components/common/SpeakButton';
import { translations } from '../utils/localization';
import { 
  CloudRain, 
  Map, 
  Sprout, 
  Smartphone, 
  Radio, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Activity,
  Layers,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

export const LandingPage = () => {
  const { setActiveTab, farmerLanguage } = useApp();
  const t = translations[farmerLanguage] || translations.en;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-7xl mx-auto space-y-12">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-gov-card to-slate-950 border border-slate-800 p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3.5 py-1 text-xs font-semibold text-sky-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>{t.landingMinistry}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {t.landingHero}
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            {t.landingDesc}
          </p>

          {/* Key Capabilities Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
            {(t.landingPills || []).map((pill, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3 py-2 rounded-xl text-xs text-slate-300 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                <span>{pill}</span>
              </div>
            ))}
          </div>

          {/* Call to Actions */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button
              onClick={() => setActiveTab('command-center')}
              className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 hover:from-sky-400 hover:to-indigo-500 transition-all cursor-pointer group"
            >
              <span>{t.landingOpenCmd}</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => setActiveTab('farmer-mode')}
              className="flex items-center gap-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/40 px-6 py-3.5 text-sm font-bold text-emerald-300 hover:bg-emerald-600/30 transition-all cursor-pointer"
            >
              <Smartphone className="h-4 w-4 text-emerald-400" />
              <span>{t.landingExploreFarmer}</span>
            </button>

            <SpeakButton
              text={t.landingDesc}
              lang={farmerLanguage}
              t={t}
              className="bg-sky-600 hover:bg-sky-500 shadow-sky-700/30"
            />
          </div>
        </div>
      </div>

      {/* Visual Pipeline Flow Diagram */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-sky-400" />
              <span>{t.landingPipeline}</span>
            </h2>
            <p className="text-xs text-slate-400">
              {t.landingPipelineDesc}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
          {(t.landingSteps || []).map((item, idx) => {
            const icons = [Radio, CloudRain, Zap, Map, Sprout];
            const colors = ['text-blue-400', 'text-sky-400', 'text-indigo-400', 'text-amber-400', 'text-emerald-400'];
            const bgs = ['bg-blue-950/40 border-blue-800/50', 'bg-sky-950/40 border-sky-800/50', 'bg-indigo-950/40 border-indigo-800/50', 'bg-amber-950/40 border-amber-800/50', 'bg-emerald-950/40 border-emerald-800/50'];
            const Icon = icons[idx];
            return (
              <div
                key={idx}
                className={`relative rounded-2xl border p-5 ${bgs[idx]} flex flex-col justify-between space-y-3 transition-transform hover:-translate-y-1`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-slate-500 tracking-wider">
                    STEP {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className={`p-2 rounded-xl bg-slate-900/80 ${colors[idx]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Showcase Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div 
          onClick={() => setActiveTab('risk-map')}
          className="group rounded-2xl bg-slate-900/60 border border-slate-800 p-6 hover:border-sky-500/50 transition-all cursor-pointer space-y-4"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 group-hover:scale-110 transition-transform">
            <Map className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors">
              {t.landingGIS}
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {t.landingGISDesc}
            </p>
          </div>
          <div className="text-xs font-semibold text-sky-400 flex items-center gap-1">
            <span>{t.landingGISLink}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('advisories')}
          className="group rounded-2xl bg-slate-900/60 border border-slate-800 p-6 hover:border-emerald-500/50 transition-all cursor-pointer space-y-4"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
            <Sprout className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
              {t.landingAdvisory}
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {t.landingAdvisoryDesc}
            </p>
          </div>
          <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
            <span>{t.landingAdvisoryLink}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('explainability')}
          className="group rounded-2xl bg-slate-900/60 border border-slate-800 p-6 hover:border-indigo-500/50 transition-all cursor-pointer space-y-4"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
              {t.landingXAI}
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {t.landingXAIDesc}
            </p>
          </div>
          <div className="text-xs font-semibold text-indigo-400 flex items-center gap-1">
            <span>{t.landingXAILink}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </div>

      </div>

    </div>
  );
};

export default LandingPage;

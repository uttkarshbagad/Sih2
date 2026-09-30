import React from 'react';
import { AlertCircle, ShieldAlert, Sparkles } from 'lucide-react';

export const PrototypeBanner = () => {
  return (
    <div className="bg-gradient-to-r from-amber-500/15 via-sky-500/10 to-indigo-500/15 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-200/90 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
        <span className="font-semibold text-amber-300 uppercase tracking-wider text-[11px] bg-amber-400/20 px-2 py-0.5 rounded border border-amber-400/30">
          Prototype Simulation
        </span>
        <span className="hidden sm:inline text-slate-300">
          MoES / NCMRWF AI Decision Support System | Demonstration Model (Odisha Focus)
        </span>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-slate-400">
        <span className="hidden md:inline">Model: Coupled Ensemble v1.2 (06Z Cycle)</span>
        <span className="text-emerald-400 font-mono flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span> API: Connected
        </span>
      </div>
    </div>
  );
};

export default PrototypeBanner;

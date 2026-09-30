/**
 * Centralized Risk Classification Utility
 * Standardized across entire prototype
 * LOW: 0 - 30%
 * MODERATE: 31 - 60%
 * HIGH: 61 - 80%
 * VERY HIGH: 81 - 100%
 */

export const RISK_LEVELS = {
  LOW: {
    label: "LOW",
    color: "#10b981", // Emerald Green
    bgClass: "bg-emerald-950/60",
    borderClass: "border-emerald-700/60",
    textClass: "text-emerald-400",
    badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    description: "Favorable conditions. Normal agricultural operations recommended."
  },
  MODERATE: {
    label: "MODERATE",
    color: "#f59e0b", // Amber Yellow
    bgClass: "bg-amber-950/60",
    borderClass: "border-amber-700/60",
    textClass: "text-amber-400",
    badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    description: "Watch status. Intermittent weather fluctuations possible."
  },
  HIGH: {
    label: "HIGH",
    color: "#f97316", // Orange
    bgClass: "bg-orange-950/60",
    borderClass: "border-orange-700/60",
    textClass: "text-orange-400",
    badgeBg: "bg-orange-500/20 text-orange-300 border-orange-500/40",
    description: "Elevated risk. Preventive agricultural measures advised."
  },
  VERY_HIGH: {
    label: "VERY HIGH",
    color: "#ef4444", // Rose Red
    bgClass: "bg-rose-950/60",
    borderClass: "border-rose-700/60",
    textClass: "text-rose-400",
    badgeBg: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    description: "Severe meteorological hazard. Immediate proactive advisory response."
  },
  HEAVY_RAIN: {
    label: "HEAVY RAIN RISK",
    color: "#06b6d4", // Cyan
    bgClass: "bg-cyan-950/60",
    borderClass: "border-cyan-700/60",
    textClass: "text-cyan-400",
    badgeBg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    description: "High precipitation & waterlogging hazard."
  }
};

export const classifyProbability = (probValue) => {
  const prob = typeof probValue === 'number' && probValue <= 1.0 ? probValue * 100 : probValue;
  if (prob >= 81) return RISK_LEVELS.VERY_HIGH;
  if (prob >= 61) return RISK_LEVELS.HIGH;
  if (prob >= 31) return RISK_LEVELS.MODERATE;
  return RISK_LEVELS.LOW;
};

export const getRiskColor = (probValue) => {
  return classifyProbability(probValue).color;
};

export const getRiskBadgeClass = (probValue) => {
  return classifyProbability(probValue).badgeBg;
};

export const formatPercentage = (val) => {
  if (val === undefined || val === null) return "--%";
  const num = typeof val === 'number' && val <= 1.0 ? Math.round(val * 100) : Math.round(val);
  return `${num}%`;
};

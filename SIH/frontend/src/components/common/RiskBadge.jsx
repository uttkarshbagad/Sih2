/**
 * @module components/common/RiskBadge
 * @description Colored risk level badge indicator for climate advisory cards.
 */
import React from 'react';
import { classifyProbability } from '../../utils/risk';

export const RiskBadge = ({ probability, customLabel, size = "md", className = "" }) => {
  const risk = classifyProbability(probability);
  const label = customLabel || risk.label;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-semibold",
    md: "px-2.5 py-1 text-xs font-bold tracking-wide",
    lg: "px-3.5 py-1.5 text-sm font-extrabold tracking-wider"
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${risk.badgeBg} ${sizeClasses[size]} ${className}`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full animate-pulse"
        style={{ backgroundColor: risk.color }}
      />
      {label}
    </span>
  );
};

export default RiskBadge;

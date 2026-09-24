import React from 'react';
import { getRiskLevel } from '../data/casesData';
import type { RiskLevel } from '../data/casesData';

interface RiskBadgeProps {
  riskScore: number | null;
  showScore?: boolean;
}

const levelStyles: Record<RiskLevel, string> = {
  High: 'bg-red-500/15 text-red-400 border-red-500/30',
  Medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Unscored: 'bg-slate-800 text-slate-400 border-slate-700',
};

export const RiskBadge: React.FC<RiskBadgeProps> = ({ riskScore, showScore = true }) => {
  const level = getRiskLevel(riskScore);
  const style = levelStyles[level];

  return (
    <div className="inline-flex items-center gap-1.5">
      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${style}`}>
        {level}
      </span>
      {showScore && (
        <span className="text-xs font-mono text-slate-400">
          {riskScore !== null ? riskScore.toFixed(2) : 'N/A'}
        </span>
      )}
    </div>
  );
};

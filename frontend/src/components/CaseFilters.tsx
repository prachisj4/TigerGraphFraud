import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';

interface CaseFiltersProps {
  selectedRisk: string;
  onRiskChange: (risk: string) => void;
  selectedTrigger: string;
  onTriggerChange: (trigger: string) => void;
  triggerTypes: string[];
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export const CaseFilters: React.FC<CaseFiltersProps> = ({
  selectedRisk,
  onRiskChange,
  selectedTrigger,
  onTriggerChange,
  triggerTypes,
  onClearFilters,
  hasActiveFilters,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Risk Filter */}
      <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs">
        <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="text-slate-400 font-medium mr-1">Risk:</span>
        {['All', 'Low', 'Medium', 'High'].map((risk) => (
          <button
            key={risk}
            type="button"
            onClick={() => onRiskChange(risk)}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              selectedRisk === risk
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {risk}
          </button>
        ))}
      </div>

      {/* Trigger Type Dropdown */}
      <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs">
        <span className="text-slate-400 font-medium">Trigger Type:</span>
        <select
          value={selectedTrigger}
          onChange={(e) => onTriggerChange(e.target.value)}
          className="bg-slate-950 border border-slate-800 text-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-cyan-500/50"
        >
          <option value="All">All Triggers</option>
          {triggerTypes.map((trigger) => (
            <option key={trigger} value={trigger}>
              {trigger}
            </option>
          ))}
        </select>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3 text-slate-400" />
          <span>Clear Filters</span>
        </button>
      )}
    </div>
  );
};

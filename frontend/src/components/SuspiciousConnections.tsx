import React from 'react';
import { GitCompare, ShieldAlert } from 'lucide-react';

export const SuspiciousConnections: React.FC = () => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-500/10 border border-red-500/30 rounded text-red-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">Suspicious Connections</h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
            Rule Check
          </span>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          High-confidence fraud ring patterns and shared entity anomalies
        </p>

        <div className="p-6 bg-slate-950 border border-slate-800 rounded-lg text-center flex flex-col items-center justify-center min-h-[120px]">
          <GitCompare className="w-6 h-6 text-slate-600 mb-2" />
          <p className="text-xs font-medium text-slate-300 mb-1">
            No graph investigation has been executed yet.
          </p>
          <p className="text-[11px] text-slate-500 max-w-xs">
            Multi-hop graph queries and anomaly algorithms will run upon agent trigger.
          </p>
        </div>
      </div>
    </div>
  );
};

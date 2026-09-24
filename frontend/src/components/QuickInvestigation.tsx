import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchCode, AlertCircle, ArrowRight } from 'lucide-react';

export const QuickInvestigation: React.FC = () => {
  const [caseIdInput, setCaseIdInput] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInvestigate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = caseIdInput.trim();
    if (!trimmed) {
      setError('Please enter a valid Case ID (e.g., HHG-001)');
      return;
    }
    setError('');
    navigate(`/investigation/${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded text-cyan-400">
            <SearchCode className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">
            Quick Investigation
          </h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Enter a Case ID to start an agentic fraud investigation workspace
        </p>

        <form onSubmit={handleInvestigate} className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={caseIdInput}
                onChange={(e) => {
                  setCaseIdInput(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Enter Case ID (e.g. HHG-001)"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shrink-0 cursor-pointer"
            >
              <span>Investigate Case</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {error && (
            <div className="flex items-center gap-1.5 text-[11px] text-red-400 mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span>Frontend routing ready</span>
        <span className="text-[10px] text-amber-400/90 font-mono">Backend API Pending</span>
      </div>
    </div>
  );
};

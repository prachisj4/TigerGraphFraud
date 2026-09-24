import React from 'react';
import { History as HistoryIcon } from 'lucide-react';

export const History: React.FC = () => {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-2xl mb-4 text-slate-400">
          <HistoryIcon className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-medium text-slate-200 mb-2">Investigation History</h3>
        <p className="text-sm text-slate-400 max-w-md">
          Historical investigation logs, audit trails, and agent decision histories will appear here.
        </p>
      </div>
    </div>
  );
};

import React from 'react';
import { Search, X } from 'lucide-react';

interface CaseSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const CaseSearch: React.FC<CaseSearchProps> = ({ searchTerm, onSearchChange }) => {
  return (
    <div className="relative flex-1 min-w-[240px]">
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search Case ID, Customer ID, Card ID, Txn ID, or Trigger text..."
        className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
      />
      {searchTerm && (
        <button
          type="button"
          onClick={() => onSearchChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

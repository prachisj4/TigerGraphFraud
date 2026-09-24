import React from 'react';
import { Search, Bell, User } from 'lucide-react';

interface TopbarProps {
  pageTitle: string;
}

export const Topbar: React.FC<TopbarProps> = ({ pageTitle }) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-10">
      {/* Current Page Title */}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-slate-100 tracking-wide">
          {pageTitle}
        </h2>
      </div>

      {/* Right Controls: Search, Notifications, Profile */}
      <div className="flex items-center gap-4">
        {/* Search Field */}
        <div className="relative w-64 md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search cases, entities, transactions..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>

        {/* Notification Icon */}
        <button
          type="button"
          aria-label="Notifications"
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-700 transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyan-400 rounded-full"></span>
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-800" />

        {/* Investigator Profile */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-medium text-slate-200">Investigator</span>
            <span className="text-[10px] text-slate-400">Lead Analyst</span>
          </div>
        </div>
      </div>
    </header>
  );
};

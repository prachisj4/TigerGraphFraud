import React, { useEffect, useState } from 'react';
import {
  summaryMetrics,
  riskDistributionData,
  recentCasesData,
  recentActivityData,
} from '../data/dashboardData';
import { fetchHealth, type HealthStatus } from '../services/api';
import { MetricCard } from '../components/MetricCard';
import { RiskDistribution } from '../components/RiskDistribution';
import { RecentCases } from '../components/RecentCases';
import { ActivityFeed } from '../components/ActivityFeed';
import { QuickInvestigation } from '../components/QuickInvestigation';
import { Server, Database, Bot, Share2 } from 'lucide-react';

export const Overview: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    fetchHealth().then(setHealth);
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Real System Status Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <h2 className="text-sm font-bold text-slate-100 tracking-wide uppercase">
              System Health & Connector Status
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Real-time Status Monitoring
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          {/* Backend Status */}
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <Server className="w-3.5 h-3.5 text-cyan-400" />
              <span>FastAPI Backend</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
              health?.backend === 'connected' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'
            }`}>
              {health?.backend || 'checking'}
            </span>
          </div>

          {/* Dataset Status */}
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>Dataset (20 Cases)</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
              health?.dataset === 'available' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
            }`}>
              {health?.dataset || 'checking'}
            </span>
          </div>

          {/* Gemini Agent Status */}
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <Bot className="w-3.5 h-3.5 text-amber-400" />
              <span>Gemini Agent</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
              health?.agent === 'connected' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
            }`}>
              {health?.agent || 'checking'}
            </span>
          </div>

          {/* TigerGraph Status */}
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>TigerGraph Savanna</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
              health?.tigergraph === 'connected' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
            }`}>
              {health?.tigergraph || 'checking'}
            </span>
          </div>
        </div>
      </div>

      {/* 1. TOP SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryMetrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      {/* 2. MAIN SECTION: RECENT CASES & QUICK INVESTIGATION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentCases cases={recentCasesData} />
        </div>
        <div className="lg:col-span-1">
          <QuickInvestigation />
        </div>
      </div>

      {/* 3. SECONDARY SECTION: RISK DISTRIBUTION CHART & ACTIVITY FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RiskDistribution data={riskDistributionData} />
        <ActivityFeed activities={recentActivityData} />
      </div>
    </div>
  );
};

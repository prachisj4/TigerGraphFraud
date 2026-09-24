import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  SearchCode,
  GitFork,
  History,
  ShieldAlert,
  Bot,
  Server,
  Database,
  Globe,
} from 'lucide-react';
import { fetchHealth, type HealthStatus } from '../services/api';

export const Sidebar: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus>({
    status: 'checking',
    backend: 'checking',
    dataset: 'available',
    agent: 'not_connected',
    tigergraph: 'not_connected',
  });

  useEffect(() => {
    let isMounted = true;
    fetchHealth().then((res) => {
      if (isMounted) setHealth(res);
    });
    const interval = setInterval(() => {
      fetchHealth().then((res) => {
        if (isMounted) setHealth(res);
      });
    }, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    { name: 'Overview', path: '/', icon: LayoutDashboard },
    { name: 'Cases', path: '/cases', icon: Briefcase },
    { name: 'Investigation', path: '/investigation', icon: SearchCode },
    { name: 'Graph Intelligence', path: '/graph', icon: GitFork },
    { name: 'History', path: '/history', icon: History },
  ];

  const systemStatus = [
    {
      name: 'Backend API',
      icon: Globe,
      status: health.backend === 'connected' ? 'Connected' : 'Disconnected',
      stateColor:
        health.backend === 'connected'
          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
          : 'bg-red-500/20 text-red-400 border-red-500/30',
    },
    {
      name: 'Dataset',
      icon: Database,
      status: 'Available',
      stateColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
    {
      name: 'Agent',
      icon: Bot,
      status: health.agent === 'connected' ? 'Connected' : health.agent === 'checking' ? 'Checking...' : 'Not Connected',
      stateColor:
        health.agent === 'connected'
          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
          : 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    },
    {
      name: 'TigerGraph',
      icon: Server,
      status: health.tigergraph === 'connected' ? 'Connected' : health.tigergraph === 'checking' ? 'Checking...' : 'Not Connected',
      stateColor:
        health.tigergraph === 'connected'
          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
          : 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    },
  ];

  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col h-screen shrink-0 sticky top-0">
      {/* Header Branding */}
      <div className="p-5 border-b border-slate-800 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-semibold text-slate-100 leading-tight text-base tracking-wide">
              Fraud Investigation Agent
            </h1>
          </div>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed font-normal mt-1">
          Agentic investigation powered by AI + graph intelligence
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* System Status Section */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
          System Status
        </div>
        <div className="space-y-2">
          {systemStatus.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.name}
                className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2 text-slate-300">
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                  <span>{item.name}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-medium border ${item.stateColor}`}
                >
                  {item.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

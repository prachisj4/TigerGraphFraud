import React from 'react';
import { FolderArchive, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { MetricItem } from '../data/dashboardData';

const iconMap: Record<string, LucideIcon> = {
  FolderArchive,
  CheckCircle2,
  AlertTriangle,
  Clock,
};

export const MetricCard: React.FC<MetricItem> = ({
  title,
  value,
  iconName,
  subtitle,
}) => {
  const IconComponent = iconMap[iconName] || FolderArchive;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/50 text-cyan-400">
          <IconComponent className="w-4 h-4" />
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-100 mb-1 tracking-tight">
          {value}
        </div>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
};

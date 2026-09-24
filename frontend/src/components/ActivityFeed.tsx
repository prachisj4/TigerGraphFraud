import React from 'react';
import { FileSearch, Activity, ShieldCheck, GitBranch, Send } from 'lucide-react';
import type { ActivityItem } from '../data/dashboardData';

interface ActivityFeedProps {
  activities: ActivityItem[];
}

const activityIconMap: Record<ActivityItem['type'], React.ElementType> = {
  opened: FileSearch,
  analyzed: Activity,
  checked: ShieldCheck,
  requested: GitBranch,
  review: Send,
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">
            Recent Investigation Activity
          </h3>
          <p className="text-xs text-slate-400">
            Demo workflow events preview
          </p>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
          Demo Stream
        </span>
      </div>

      <div className="space-y-3 relative flex-1">
        <div className="absolute left-3.5 top-3 bottom-3 w-px bg-slate-800" />
        {activities.map((item) => {
          const Icon = activityIconMap[item.type] || Activity;
          return (
            <div key={item.id} className="flex items-start gap-3 relative text-xs">
              <div className="p-1.5 rounded-full bg-slate-950 border border-slate-700 text-cyan-400 shrink-0 z-10">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="font-mono text-cyan-400 font-medium">
                    {item.caseId}
                  </span>
                  <span className="text-[10px] text-slate-500">{item.timestamp}</span>
                </div>
                <p className="text-slate-300 font-normal leading-tight">
                  {item.event}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

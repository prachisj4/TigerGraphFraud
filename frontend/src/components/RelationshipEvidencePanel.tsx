import React from 'react';
import { CreditCard, Laptop, MapPin, Mail, ShieldAlert, Clock } from 'lucide-react';

export const RelationshipEvidencePanel: React.FC = () => {
  const evidenceCategories = [
    { label: 'Shared Cards', icon: CreditCard },
    { label: 'Shared Devices', icon: Laptop },
    { label: 'Shared Billing Regions', icon: MapPin },
    { label: 'Shared Email Domains', icon: Mail },
    { label: 'Related Fraud Cases', icon: ShieldAlert },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-200">Relationship Evidence</h3>
          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
            Pending Query
          </span>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Deep graph pattern connections discovered across cases
        </p>

        <div className="space-y-2.5">
          {evidenceCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.label}
                className="flex items-center justify-between p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-xs"
              >
                <div className="flex items-center gap-2.5 text-slate-300">
                  <div className="p-1 rounded bg-slate-900 text-slate-400 border border-slate-800">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span>{cat.label}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">0 links</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 p-3 bg-slate-950/80 border border-slate-800 rounded-lg flex items-center gap-2 text-xs text-slate-400">
        <Clock className="w-4 h-4 text-amber-400 shrink-0" />
        <span>Awaiting TigerGraph analysis</span>
      </div>
    </div>
  );
};

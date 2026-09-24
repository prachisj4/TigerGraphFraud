import React from 'react';
import { CreditCard, Laptop, MapPin, Mail, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';
import { type GraphData } from './GraphView';

interface RelationshipEvidencePanelProps {
  graphData?: GraphData;
  isLoading?: boolean;
}

export const RelationshipEvidencePanel: React.FC<RelationshipEvidencePanelProps> = ({
  graphData,
  isLoading = false,
}) => {
  const nodes = graphData?.nodes || [];
  const edges = graphData?.edges || [];
  const isCompleted = nodes.length > 0;

  // Calculate actual evidence metrics from real graph data
  const cardCount = nodes.filter((n) => n.type === 'Card').length;
  const deviceCount = nodes.filter((n) => n.type === 'Device').length;
  const regionCount = nodes.filter((n) => n.type === 'BillingRegion').length;
  const emailCount = nodes.filter((n) => n.type === 'EmailDomain').length;
  const fraudCaseCount = nodes.filter((n) => n.type === 'FraudCase').length;

  const evidenceCategories = [
    { label: 'Shared Cards', icon: CreditCard, count: cardCount },
    { label: 'Shared Devices', icon: Laptop, count: deviceCount },
    { label: 'Shared Billing Regions', icon: MapPin, count: regionCount },
    { label: 'Shared Email Domains', icon: Mail, count: emailCount },
    { label: 'Related Fraud Cases', icon: ShieldAlert, count: fraudCaseCount },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-200">Relationship Evidence</h3>
          <span
            className={`text-[10px] px-2 py-0.5 rounded font-mono border ${
              isCompleted
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}
          >
            {isLoading ? 'Querying...' : isCompleted ? 'Completed' : 'Pending Query'}
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
                <span
                  className={`text-[10px] font-mono ${
                    cat.count > 0 ? 'text-emerald-400 font-bold' : 'text-slate-500'
                  }`}
                >
                  {cat.count} {cat.count === 1 ? 'link' : 'links'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 p-3 bg-slate-950/80 border border-slate-800 rounded-lg flex items-center gap-2 text-xs text-slate-400">
        {isCompleted ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Graph evidence active ({nodes.length} nodes, {edges.length} edges)</span>
          </>
        ) : (
          <>
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Awaiting TigerGraph analysis</span>
          </>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, SearchCode, Calendar, CreditCard, User, Tag, Hash, AlertTriangle } from 'lucide-react';
import type { CaseRecord } from '../data/casesData';
import { RiskBadge } from './RiskBadge';

interface CaseDetailsProps {
  caseRecord: CaseRecord | null;
  onClose: () => void;
}

export const CaseDetails: React.FC<CaseDetailsProps> = ({ caseRecord, onClose }) => {
  const navigate = useNavigate();

  if (!caseRecord) return null;

  const handleInvestigate = () => {
    navigate(`/investigation/${encodeURIComponent(caseRecord.case_id)}`);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col p-6 overflow-y-auto animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded text-cyan-400">
            <SearchCode className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-slate-100 text-sm">
              {caseRecord.case_id}
            </h3>
            <span className="text-[10px] text-slate-400">Case Preview Detail</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Details Body */}
      <div className="space-y-4 flex-1 text-xs">
        {/* Risk Badge Header */}
        <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400 font-medium">Model Risk Level</span>
          <RiskBadge riskScore={caseRecord.risk_score} />
        </div>

        {/* Info Grid */}
        <div className="space-y-3">
          <div className="flex items-start gap-2.5 text-slate-300">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-[10px] text-slate-400 font-medium uppercase">Opened At</div>
              <div className="font-mono text-slate-200">{caseRecord.opened_at}</div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-slate-300">
            <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-[10px] text-slate-400 font-medium uppercase">Customer ID</div>
              <div className="font-mono text-slate-200">{caseRecord.customer_id}</div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-slate-300">
            <CreditCard className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-[10px] text-slate-400 font-medium uppercase">Card ID</div>
              <div className="font-mono text-slate-200">{caseRecord.card_id}</div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-slate-300">
            <Hash className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-[10px] text-slate-400 font-medium uppercase">Flagged Transaction</div>
              <div className="font-mono text-slate-200">{caseRecord.flagged_txn_id}</div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-slate-300">
            <Tag className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-[10px] text-slate-400 font-medium uppercase">Trigger Type</div>
              <div className="font-mono text-cyan-400">{caseRecord.trigger_type}</div>
            </div>
          </div>
        </div>

        {/* Trigger Text Detail Box */}
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Trigger Text</span>
          </div>
          <p className="text-slate-300 text-xs leading-relaxed font-normal">
            {caseRecord.trigger_text}
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-slate-800 mt-4">
        <button
          type="button"
          onClick={handleInvestigate}
          className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <SearchCode className="w-4 h-4" />
          <span>Investigate Case</span>
        </button>
      </div>
    </div>
  );
};

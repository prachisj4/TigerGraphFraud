import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ExternalLink } from 'lucide-react';
import type { RecentCaseItem } from '../data/dashboardData';

interface RecentCasesProps {
  cases: RecentCaseItem[];
}

export const RecentCases: React.FC<RecentCasesProps> = ({ cases }) => {
  const navigate = useNavigate();

  const handleCaseClick = (caseId: string) => {
    navigate(`/investigation/${encodeURIComponent(caseId)}`);
  };

  const getRiskScoreBadge = (score: number | null) => {
    if (score === null) {
      return 'bg-slate-800 text-slate-400 border-slate-700';
    }
    if (score >= 0.70) {
      return 'bg-red-500/15 text-red-400 border-red-500/30';
    }
    if (score >= 0.40) {
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    }
    return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  };

  const getStatusBadge = (status: RecentCaseItem['status']) => {
    switch (status) {
      case 'Escalated':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'Under Review':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Investigated':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'Closed':
        return 'bg-slate-800 text-slate-400 border-slate-700';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Recent Cases</h3>
          <p className="text-xs text-slate-400">Latest flagged fraud cases for triage</p>
        </div>
        <button
          onClick={() => navigate('/cases')}
          className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium transition-colors"
        >
          <span>View all cases</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="pb-3 px-3">Case ID</th>
              <th className="pb-3 px-3">Customer ID</th>
              <th className="pb-3 px-3">Trigger</th>
              <th className="pb-3 px-3 text-center">Risk Score</th>
              <th className="pb-3 px-3 text-center">Status</th>
              <th className="pb-3 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {cases.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                onClick={() => handleCaseClick(item.id)}
              >
                <td className="py-3 px-3 font-mono font-medium text-cyan-400">
                  {item.id}
                </td>
                <td className="py-3 px-3 font-mono font-medium text-slate-200">
                  {item.customerId}
                </td>
                <td className="py-3 px-3 text-slate-400 max-w-xs truncate" title={item.trigger}>
                  {item.trigger}
                </td>
                <td className="py-3 px-3 text-center">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono font-semibold border ${getRiskScoreBadge(
                      item.riskScore
                    )}`}
                  >
                    {item.riskScore !== null ? item.riskScore.toFixed(2) : 'N/A'}
                  </span>
                </td>
                <td className="py-3 px-3 text-center">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-medium border ${getStatusBadge(
                      item.status
                    )}`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCaseClick(item.id);
                    }}
                    className="p-1 text-slate-400 group-hover:text-cyan-400 rounded hover:bg-slate-800 transition-colors"
                    title="Investigate case"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

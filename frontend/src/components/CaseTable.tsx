import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import type { CaseRecord } from '../data/casesData';
import { RiskBadge } from './RiskBadge';

interface CaseTableProps {
  cases: CaseRecord[];
  onSelectCase: (caseRecord: CaseRecord) => void;
  selectedCaseId?: string;
}

type SortField = 'case_id' | 'opened_at' | 'customer_id' | 'flagged_txn_id' | 'risk_score';
type SortOrder = 'asc' | 'desc';

export const CaseTable: React.FC<CaseTableProps> = ({
  cases,
  onSelectCase,
  selectedCaseId,
}) => {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField>('case_id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedCases = [...cases].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (valA === null || valA === undefined) valA = -1;
    if (valB === null || valB === undefined) valB = -1;

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-500" />;
    }
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-3 h-3 text-cyan-400" />
    ) : (
      <ChevronDown className="w-3 h-3 text-cyan-400" />
    );
  };

  const handleInvestigate = (e: React.MouseEvent, caseId: string) => {
    e.stopPropagation();
    navigate(`/investigation/${encodeURIComponent(caseId)}`);
  };

  if (cases.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
        <p className="text-slate-400 text-sm font-medium">
          No cases match your current search and filter criteria.
        </p>
        <p className="text-slate-500 text-xs mt-1">
          Try clearing your search term or adjusting filter values.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th
                className="py-3 px-4 cursor-pointer hover:text-slate-200 transition-colors"
                onClick={() => handleSort('case_id')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Case ID</span>
                  {renderSortIcon('case_id')}
                </div>
              </th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-slate-200 transition-colors"
                onClick={() => handleSort('opened_at')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Opened</span>
                  {renderSortIcon('opened_at')}
                </div>
              </th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-slate-200 transition-colors"
                onClick={() => handleSort('customer_id')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Customer ID</span>
                  {renderSortIcon('customer_id')}
                </div>
              </th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-slate-200 transition-colors"
                onClick={() => handleSort('flagged_txn_id')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Flagged Txn</span>
                  {renderSortIcon('flagged_txn_id')}
                </div>
              </th>
              <th className="py-3 px-4">Trigger</th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-slate-200 transition-colors"
                onClick={() => handleSort('risk_score')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Risk Score</span>
                  {renderSortIcon('risk_score')}
                </div>
              </th>
              <th className="py-3 px-4">Risk Level</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {sortedCases.map((item) => {
              const isSelected = selectedCaseId === item.case_id;
              return (
                <tr
                  key={item.case_id}
                  onClick={() => onSelectCase(item)}
                  className={`transition-colors cursor-pointer group ${
                    isSelected
                      ? 'bg-cyan-500/10 border-l-2 border-l-cyan-400'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                    {item.case_id}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                    {item.opened_at}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-200">
                    {item.customer_id}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    {item.flagged_txn_id}
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-[10px] text-cyan-400/90 font-medium">
                        [{item.trigger_type}]
                      </span>
                      <p className="text-slate-300 text-[11px] truncate" title={item.trigger_text}>
                        {item.trigger_text}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-200 font-medium">
                    {item.risk_score !== null ? item.risk_score.toFixed(2) : 'N/A'}
                  </td>
                  <td className="py-3 px-4">
                    <RiskBadge riskScore={item.risk_score} showScore={false} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => handleInvestigate(e, item.case_id)}
                      className="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-slate-950 border border-cyan-500/30 font-medium rounded text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Investigate</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

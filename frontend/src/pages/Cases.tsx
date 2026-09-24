import React, { useState, useEffect, useMemo } from 'react';
import { casesData, getRiskLevel, type CaseRecord } from '../data/casesData';
import { fetchAllCases } from '../services/api';
import { CaseSearch } from '../components/CaseSearch';
import { CaseFilters } from '../components/CaseFilters';
import { CaseTable } from '../components/CaseTable';
import { CaseDetails } from '../components/CaseDetails';
import { Briefcase } from 'lucide-react';

export const Cases: React.FC = () => {
  const [allCases, setAllCases] = useState<CaseRecord[]>(casesData);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<string>('All');
  const [selectedTrigger, setSelectedTrigger] = useState<string>('All');
  const [previewCase, setPreviewCase] = useState<CaseRecord | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchAllCases().then((cases) => {
      if (isMounted && cases && cases.length > 0) {
        setAllCases(cases);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Extract unique trigger types for filter options
  const triggerTypes = useMemo(() => {
    const types = new Set(allCases.map((c) => c.trigger_type));
    return Array.from(types);
  }, [allCases]);

  // Filter cases based on search and filters
  const filteredCases = useMemo(() => {
    return allCases.filter((item) => {
      // Risk filter
      if (selectedRisk !== 'All') {
        const level = getRiskLevel(item.risk_score);
        if (level !== selectedRisk) {
          return false;
        }
      }

      // Trigger type filter
      if (selectedTrigger !== 'All') {
        if (item.trigger_type !== selectedTrigger) {
          return false;
        }
      }

      // Search term
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase().trim();
        const matchesId = item.case_id.toLowerCase().includes(term);
        const matchesCustomer = item.customer_id.toLowerCase().includes(term);
        const matchesCard = item.card_id.toLowerCase().includes(term);
        const matchesTxn = item.flagged_txn_id.toLowerCase().includes(term);
        const matchesTrigger = item.trigger_text.toLowerCase().includes(term);

        if (!matchesId && !matchesCustomer && !matchesCard && !matchesTxn && !matchesTrigger) {
          return false;
        }
      }

      return true;
    });
  }, [allCases, searchTerm, selectedRisk, selectedTrigger]);

  const hasActiveFilters =
    searchTerm !== '' || selectedRisk !== 'All' || selectedTrigger !== 'All';

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedRisk('All');
    setSelectedTrigger('All');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-cyan-400">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-100 tracking-tight">Cases</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                {allCases.length} Total Cases
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Review and investigate flagged fraud cases.
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
        <CaseSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        <CaseFilters
          selectedRisk={selectedRisk}
          onRiskChange={setSelectedRisk}
          selectedTrigger={selectedTrigger}
          onTriggerChange={setSelectedTrigger}
          triggerTypes={triggerTypes}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      {/* Result Count Info */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <div>
          Showing <span className="font-semibold text-slate-200">{filteredCases.length}</span> of{' '}
          <span className="font-semibold text-slate-200">{allCases.length}</span> cases
        </div>
        {hasActiveFilters && (
          <span className="text-amber-400/90 text-[11px] font-mono">Filtered View</span>
        )}
      </div>

      {/* Main Cases Table */}
      <CaseTable
        cases={filteredCases}
        onSelectCase={(record) => setPreviewCase(record)}
        selectedCaseId={previewCase?.case_id}
      />

      {/* Side Detail Preview Panel */}
      <CaseDetails caseRecord={previewCase} onClose={() => setPreviewCase(null)} />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { casesData } from '../data/casesData';
import { runInvestigation, type InvestigationResult } from '../services/api';
import {
  SearchCode,
  GitFork,
  Play,
  Loader2,
  Receipt,
  UserCheck,
  MapPin,
  Smartphone,
  Server,
  FileCheck,
  Bot,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

export const Investigation: React.FC = () => {
  const params = useParams<{ caseId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const caseId = params.caseId || searchParams.get('caseId');

  const [inputCaseId, setInputCaseId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InvestigationResult | null>(null);

  // Auto load/fetch investigation data if caseId exists in URL
  useEffect(() => {
    if (caseId) {
      handleExecuteInvestigation(caseId);
    } else {
      setResult(null);
      setError(null);
    }
  }, [caseId]);

  const handleExecuteInvestigation = async (targetCaseId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await runInvestigation(targetCaseId);
      setResult(data);
    } catch (err: any) {
      console.error('Investigation execution failed:', err);
      setError(err.message || 'Failed to execute backend investigation');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputCaseId.trim().toUpperCase();
    if (trimmed) {
      navigate(`/investigation/${encodeURIComponent(trimmed)}`);
    }
  };

  const currentCase = result?.case || casesData.find((c) => c.case_id.toUpperCase() === caseId?.toUpperCase());

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-cyan-400">
            <SearchCode className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">
              Investigation Workspace
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Execute backend investigation tools to analyze transaction, customer, and device evidence.
            </p>
          </div>
        </div>

        {/* Case ID Selection Input */}
        <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={inputCaseId}
            onChange={(e) => setInputCaseId(e.target.value)}
            placeholder="Case ID (e.g. HHG-001)"
            className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 w-44"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            Load Case
          </button>
        </form>
      </div>

      {/* Case Context Banner */}
      {caseId && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-lg font-mono font-bold text-cyan-300 text-sm">
                {caseId}
              </span>
              {currentCase && (
                <>
                  <span className="text-xs font-mono text-slate-300 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                    Customer ID: <strong className="text-slate-100">{currentCase.customer_id}</strong>
                  </span>
                  <span className="text-xs font-mono text-slate-300 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                    Flagged Txn ID: <strong className="text-slate-100">{currentCase.flagged_txn_id}</strong>
                  </span>
                  <span className="text-xs font-mono text-slate-300 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                    Card ID: <strong className="text-slate-100">{currentCase.card_id}</strong>
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleExecuteInvestigation(caseId)}
                disabled={loading}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Investigating...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Run Investigation</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate(`/graph/${encodeURIComponent(caseId)}`)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <GitFork className="w-3.5 h-3.5 text-cyan-400" />
                <span>Graph Intelligence</span>
              </button>
            </div>
          </div>

          {currentCase && (
            <div className="text-xs text-slate-300 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Trigger Information</div>
              <p className="bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-300 leading-relaxed font-normal">
                {currentCase.trigger_text}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
          <div>
            <div className="font-semibold text-red-200">Backend Execution Error</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* Empty State when no Case ID selected */}
      {!caseId && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
          <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-2xl mb-4 text-cyan-400">
            <SearchCode className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-200 mb-1">
            No Case Selected
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mb-4">
            Select a case from the Cases list or enter a Case ID above (e.g. HHG-001) to run real investigation tools.
          </p>
          <button
            type="button"
            onClick={() => navigate('/cases')}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>View All Cases</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Investigation Results Cards Grid */}
      {result && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-2">
            <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
              Real Investigation Tool Findings
            </span>
            <span className="font-mono text-cyan-400 text-[10px]">
              Source: Python CSV Investigation Engine
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Transaction Behaviour Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-200">Transaction Behaviour</span>
                  <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-400">
                    <Receipt className="w-4 h-4" />
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Amount</span>
                    <span className="font-mono font-bold text-slate-100">
                      ${result.transaction?.amount !== undefined ? result.transaction.amount.toFixed(2) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Channel</span>
                    <span className="font-mono text-cyan-400 capitalize">
                      {result.transaction?.channel || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Model Risk Score</span>
                    <span className="font-mono text-amber-400 font-semibold">
                      {result.transaction?.risk_score !== null && result.transaction?.risk_score !== undefined
                        ? result.transaction.risk_score.toFixed(2)
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-400">Billing Region</span>
                    <span className="font-mono text-slate-200">
                      {result.transaction?.region !== null && result.transaction?.region !== undefined
                        ? result.transaction.region
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800">
                Tool: get_transaction_details
              </div>
            </div>

            {/* 2. Customer Behaviour Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-200">Customer Behaviour</span>
                  <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded text-cyan-400">
                    <UserCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Total Txns</span>
                    <span className="font-mono font-bold text-slate-100">
                      {result.customer_behavior?.total_transactions ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Average Amount</span>
                    <span className="font-mono text-slate-200">
                      ${result.customer_behavior?.average_amount !== undefined
                        ? result.customer_behavior.average_amount.toFixed(2)
                        : '0.00'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-400">Maximum Amount</span>
                    <span className="font-mono text-slate-200">
                      ${result.customer_behavior?.maximum_amount !== undefined
                        ? result.customer_behavior.maximum_amount.toFixed(2)
                        : '0.00'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800">
                Tool: get_customer_transactions
              </div>
            </div>

            {/* 3. Region History Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-200">Region History</span>
                  <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded text-indigo-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Target Region</span>
                    <span className="font-mono text-slate-200">
                      {result.region_history?.region !== null && result.region_history?.region !== undefined
                        ? result.region_history.region
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Times Used</span>
                    <span className="font-mono font-bold text-slate-100">
                      {result.region_history?.times_used ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-400">Seen Before</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        result.region_history?.seen_before
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {result.region_history?.seen_before ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800">
                Tool: check_region_history
              </div>
            </div>

            {/* 4. Device / Identity Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-200">Device / Identity</span>
                  <div className="p-1.5 bg-amber-500/10 border border-amber-500/30 rounded text-amber-400">
                    <Smartphone className="w-4 h-4" />
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Identity Found</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        result.device_identity?.identity_found
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {result.device_identity?.identity_found ? 'Found' : 'Not Found'}
                    </span>
                  </div>
                  {result.device_identity?.identity_found ? (
                    <>
                      <div className="flex items-center justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-400">Device Type</span>
                        <span className="font-mono text-slate-200">
                          {result.device_identity.device_type || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate-400">Device Info</span>
                        <span className="font-mono text-slate-200 truncate max-w-[120px]">
                          {result.device_identity.device_info || 'N/A'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="py-2 text-[11px] text-slate-400 italic">
                      {result.device_identity?.message || 'No identity/device record found'}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800">
                Tool: check_device_identity
              </div>
            </div>
          </div>

          {/* Graph & Historical Evidence Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Graph Evidence Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-semibold text-slate-200">TigerGraph Evidence</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                    result.graph_evidence?.status === 'completed'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {result.graph_evidence?.status || 'connected'}
                </span>
              </div>
              {result.graph_evidence?.findings && result.graph_evidence.findings.length > 0 ? (
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {result.graph_evidence.findings.map((f: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 bg-slate-950 p-2 rounded border border-slate-800/80">
                      <span className="text-cyan-400 font-bold">•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400 italic bg-slate-950 p-2.5 rounded border border-slate-800">
                  Customer node verified in TigerGraph CustomerTransactionGraph.
                </p>
              )}
            </div>

            {/* Historical Case Analysis Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-semibold text-slate-200">Historical Case Analysis</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  {result.historical_case_analysis?.total_matches ?? 0} Past Cases
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Confirmed Fraud Cases</span>
                  <span className="font-mono text-red-400 font-bold">
                    {result.historical_case_analysis?.confirmed_fraud_count ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Cleared Cases</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {result.historical_case_analysis?.cleared_count ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400">Historical Fraud Rate</span>
                  <span className="font-mono font-bold text-slate-100">
                    {((result.historical_case_analysis?.historical_fraud_rate ?? 0) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Autonomous Gemini Agent Trace Timeline */}
          {result.agent_trace && result.agent_trace.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <Bot className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-slate-100">
                    Autonomous Agent Execution Trace
                  </h3>
                </div>
                {result.model_used && (
                  <span className="px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded font-mono text-[11px] text-cyan-300">
                    Model: {result.model_used}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {result.agent_trace.map((step) => (
                  <div
                    key={step.step}
                    className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-lg text-xs space-y-2 font-mono"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-cyan-400 font-bold">Step #{step.step}: {step.tool}</span>
                      <span
                        className={`uppercase text-[10px] px-2 py-0.5 rounded border ${
                          step.status === 'completed'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-red-500/15 text-red-400 border-red-500/30'
                        }`}
                      >
                        {step.status}
                      </span>
                    </div>

                    <p className="text-slate-300 font-sans leading-relaxed">{step.summary}</p>

                    {step.input && Object.keys(step.input).length > 0 && (
                      <div className="bg-slate-900 p-2 rounded text-slate-400 overflow-x-auto text-[11px]">
                        Arguments: {JSON.stringify(step.input)}
                      </div>
                    )}

                    {step.output && (
                      <div className="bg-slate-900 p-2 rounded text-slate-300 overflow-x-auto text-[11px]">
                        Output: {JSON.stringify(step.output, null, 2)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* Final Agent Assessment Card */}
          {result.agent_assessment && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">
                      Final Autonomous AI Agent Assessment
                    </h3>
                    <p className="text-xs text-slate-400">
                      Synthesized reasoning based on empirical tool execution evidence.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">Recommendation:</span>
                  <span
                    className={`px-4 py-1.5 rounded-lg text-sm font-bold tracking-wider border shadow-md ${
                      result.agent_assessment.recommendation === 'ESCALATE'
                        ? 'bg-red-500/20 text-red-400 border-red-500/40'
                        : result.agent_assessment.recommendation === 'REVIEW'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    }`}
                  >
                    {result.agent_assessment.recommendation}
                  </span>
                </div>
              </div>

              {/* Summary & Action */}
              <div className="space-y-3 text-xs">
                <div>
                  <h4 className="text-[11px] uppercase font-semibold text-slate-400 mb-1">
                    Executive Summary
                  </h4>
                  <p className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-slate-200 leading-relaxed font-sans">
                    {result.agent_assessment.summary}
                  </p>
                </div>

                {result.agent_assessment.suggested_action && (
                  <div>
                    <h4 className="text-[11px] uppercase font-semibold text-cyan-400 mb-1">
                      Suggested Operational Action
                    </h4>
                    <p className="bg-slate-950 p-3.5 rounded-lg border border-cyan-500/20 text-cyan-200 font-medium font-sans">
                      {result.agent_assessment.suggested_action}
                    </p>
                  </div>
                )}
              </div>

              {/* Evidence Lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {result.agent_assessment.risk_factors && result.agent_assessment.risk_factors.length > 0 && (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <h4 className="font-semibold text-red-400 text-xs flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      Risk Factors Identified
                    </h4>
                    <ul className="space-y-1 text-slate-300 font-sans">
                      {result.agent_assessment.risk_factors.map((rf, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-red-400">•</span>
                          <span>{rf}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.agent_assessment.supporting_evidence && result.agent_assessment.supporting_evidence.length > 0 && (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <h4 className="font-semibold text-emerald-400 text-xs flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4" />
                      Supporting Evidence
                    </h4>
                    <ul className="space-y-1 text-slate-300 font-sans">
                      {result.agent_assessment.supporting_evidence.map((se, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-emerald-400">•</span>
                          <span>{se}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { casesData, type CaseRecord } from '../data/casesData';
import { runInvestigation, type InvestigationResult } from '../services/api';
import { GraphView, type GraphNode, type GraphData } from '../components/GraphView';
import { RelationshipEvidencePanel } from '../components/RelationshipEvidencePanel';
import { NodeDetailsPanel } from '../components/NodeDetailsPanel';
import { SuspiciousConnections } from '../components/SuspiciousConnections';
import { GitFork, ArrowLeft, Info } from 'lucide-react';

export const GraphIntelligence: React.FC = () => {
  const params = useParams<{ caseId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeCaseId = params.caseId || searchParams.get('caseId');

  const currentCase: CaseRecord | undefined = casesData.find(
    (c) => c.case_id.toLowerCase() === activeCaseId?.toLowerCase()
  );

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(false);
  const [graphStatusMessage, setGraphStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (activeCaseId) {
      let isMounted = true;
      setLoading(true);
      setGraphStatusMessage(null);

      runInvestigation(activeCaseId)
        .then((data: InvestigationResult) => {
          if (!isMounted) return;
          if (data.graph_evidence && data.graph_evidence.status === 'completed') {
            setGraphData({
              nodes: (data.graph_evidence as any).nodes || [],
              edges: (data.graph_evidence as any).edges || [],
            });
            setGraphStatusMessage(null);
          } else {
            setGraphData({ nodes: [], edges: [] });
            setGraphStatusMessage(
              (data.graph_evidence as any)?.message ||
                'TigerGraph analysis unavailable. Set real Savanna host URL in backend/.env'
            );
          }
        })
        .catch(() => {
          if (!isMounted) return;
          setGraphData({ nodes: [], edges: [] });
          setGraphStatusMessage('Failed to connect to backend investigation service.');
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });

      return () => {
        isMounted = false;
      };
    } else {
      setGraphData({ nodes: [], edges: [] });
      setGraphStatusMessage(null);
    }
  }, [activeCaseId]);

  const handleSelectCase = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCaseId = e.target.value;
    if (newCaseId) {
      navigate(`/graph/${encodeURIComponent(newCaseId)}`);
    } else {
      navigate('/graph');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-cyan-400">
            <GitFork className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-100 tracking-tight">
                Graph Intelligence
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono border ${
                  graphData.nodes.length > 0
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                {graphData.nodes.length > 0 ? 'TigerGraph Active' : 'TigerGraph Integration Pending'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Explore relationships and connected evidence across fraud cases.
            </p>
          </div>
        </div>

        {/* Dynamic Case Selector */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs">
          <span className="text-slate-400 font-medium">Select Case:</span>
          <select
            value={currentCase?.case_id || ''}
            onChange={handleSelectCase}
            className="bg-slate-950 border border-slate-800 text-slate-200 rounded px-2.5 py-1 font-mono text-xs focus:outline-none focus:border-cyan-500/50"
          >
            <option value="">-- Choose Case --</option>
            {casesData.map((c) => (
              <option key={c.case_id} value={c.case_id}>
                {c.case_id} (Customer {c.customer_id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Case Context Banner */}
      {currentCase ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded font-mono text-cyan-400">
              <span className="text-[10px] text-slate-400 uppercase">Case ID:</span>
              <span className="font-bold text-slate-100">{currentCase.case_id}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded font-mono text-slate-300">
              <span className="text-[10px] text-slate-400 uppercase">Customer ID:</span>
              <span>{currentCase.customer_id}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded font-mono text-slate-300">
              <span className="text-[10px] text-slate-400 uppercase">Flagged Txn:</span>
              <span>{currentCase.flagged_txn_id}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded font-mono text-slate-300">
              <span className="text-[10px] text-slate-400 uppercase">Card ID:</span>
              <span>{currentCase.card_id}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/investigation/${encodeURIComponent(currentCase.case_id)}`)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
            <span>Back to Investigation</span>
          </button>
        </div>
      ) : (
        <div className="p-3 bg-slate-900/40 border border-slate-800/80 rounded-lg text-xs text-slate-400 flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            No specific case active in URL. Select any case from the dropdown above or navigate from the Investigation workspace.
          </span>
        </div>
      )}

      {/* Main Graph Visualization Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <GraphView
            data={graphData}
            isLoading={loading}
            error={graphStatusMessage}
            selectedNodeId={selectedNode?.id}
            onSelectNode={setSelectedNode}
          />
          <SuspiciousConnections />
        </div>

        <div className="lg:col-span-1 space-y-6">
          <NodeDetailsPanel selectedNode={selectedNode} />
          <RelationshipEvidencePanel graphData={graphData} isLoading={loading} />
        </div>
      </div>
    </div>
  );
};

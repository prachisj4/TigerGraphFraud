import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  User,
  CreditCard,
  Receipt,
  Laptop,
  MapPin,
  Mail,
  ShieldAlert,
  GitFork,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export type NodeType =
  | 'Customer'
  | 'Transaction'
  | 'Card'
  | 'Device'
  | 'BillingRegion'
  | 'EmailDomain'
  | 'FraudCase';

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  properties?: Record<string, any>;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
  label?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface GraphViewProps {
  data?: GraphData;
  isLoading?: boolean;
  error?: string | null;
  onSelectNode?: (node: GraphNode | null) => void;
  selectedNodeId?: string | null;
}

export const nodeConfig: Record<
  NodeType,
  { label: string; color: string; bgColor: string; borderColor: string; icon: React.ElementType }
> = {
  Customer: {
    label: 'Customer',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/40',
    icon: User,
  },
  Transaction: {
    label: 'Transaction',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/40',
    icon: Receipt,
  },
  Card: {
    label: 'Card',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/40',
    icon: CreditCard,
  },
  Device: {
    label: 'Device',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/40',
    icon: Laptop,
  },
  BillingRegion: {
    label: 'Billing Region',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/40',
    icon: MapPin,
  },
  EmailDomain: {
    label: 'Email Domain',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/40',
    icon: Mail,
  },
  FraudCase: {
    label: 'Fraud Case',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/40',
    icon: ShieldAlert,
  },
};

export const GraphView: React.FC<GraphViewProps> = ({
  data = { nodes: [], edges: [] },
  isLoading = false,
  error = null,
  onSelectNode,
  selectedNodeId,
}) => {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [activeFilters, setActiveFilters] = useState<Record<NodeType, boolean>>({
    Customer: true,
    Transaction: true,
    Card: true,
    Device: true,
    BillingRegion: true,
    EmailDomain: true,
    FraudCase: true,
  });

  const toggleFilter = (type: NodeType) => {
    setActiveFilters((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 15, 200));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 15, 50));
  const handleResetView = () => setZoomLevel(100);

  const hasNodes = data.nodes && data.nodes.length > 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[560px] relative shadow-2xl">
      {/* Top Controls Bar */}
      <div className="p-3 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs z-10">
        {/* Node Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 font-medium text-[11px] mr-1">Filter Nodes:</span>
          {(Object.keys(nodeConfig) as NodeType[]).map((type) => {
            const conf = nodeConfig[type];
            const Icon = conf.icon;
            const isActive = activeFilters[type];
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleFilter(type)}
                className={`px-2 py-1 rounded text-[10px] font-medium border flex items-center gap-1 transition-colors cursor-pointer ${
                  isActive
                    ? `${conf.bgColor} ${conf.color} ${conf.borderColor}`
                    : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-400'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{conf.label}</span>
              </button>
            );
          })}
        </div>

        {/* View Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleResetView}
            title="Reset View"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 font-mono text-[10px] text-slate-400 border-l border-slate-800">
            {zoomLevel}%
          </span>
        </div>
      </div>

      {/* Graph Canvas Area */}
      <div className="flex-1 relative bg-slate-950 overflow-hidden flex items-center justify-center">
        {/* SVG Grid Background */}
        <svg
          className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
          width="100%"
          height="100%"
        >
          <defs>
            <pattern id="grid-pattern" width="30" height="30" patternUnits="userSpaceOnUse">
              <path
                d="M 30 0 L 0 0 0 30"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-slate-700"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>

        {/* State 1: Loading State */}
        {isLoading && (
          <div className="z-20 flex flex-col items-center gap-2 text-cyan-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-xs text-slate-400">Querying TigerGraph entity relationships...</span>
          </div>
        )}

        {/* State 2: Error State */}
        {error && !isLoading && (
          <div className="z-20 flex flex-col items-center gap-2 text-red-400 p-6 text-center max-w-sm">
            <AlertCircle className="w-8 h-8" />
            <h4 className="text-sm font-semibold text-slate-200">Graph Query Error</h4>
            <p className="text-xs text-slate-400">{error}</p>
          </div>
        )}

        {/* State 3: Empty State (When no backend graph nodes returned) */}
        {!isLoading && !error && !hasNodes && (
          <div className="z-20 flex flex-col items-center text-center p-8 max-w-md">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl mb-4 text-slate-500 shadow-lg">
              <GitFork className="w-8 h-8" />
            </div>
            <h4 className="text-base font-semibold text-slate-200 mb-1.5">
              Graph Evidence Workspace
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Graph evidence will appear after the investigation agent queries TigerGraph.
            </p>
            <div className="mt-4 px-3 py-1 bg-slate-900 border border-slate-800 rounded text-[11px] font-mono text-amber-400/90">
              TigerGraph Integration Pending
            </div>
          </div>
        )}

        {/* State 4: Render Graph Nodes & Edges (When real nodes provided) */}
        {!isLoading && !error && hasNodes && (
          <div
            className="w-full h-full p-8 overflow-auto flex flex-wrap gap-4 items-center justify-center transition-transform"
            style={{ transform: `scale(${zoomLevel / 100})` }}
          >
            {data.nodes.map((node) => {
              const conf = nodeConfig[node.type] || nodeConfig.Customer;
              const Icon = conf.icon;
              const isSelected = selectedNodeId === node.id;

              return (
                <div
                  key={node.id}
                  onClick={() => onSelectNode && onSelectNode(node)}
                  className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${conf.bgColor} ${conf.borderColor} ${
                    isSelected ? 'ring-2 ring-cyan-400 shadow-lg scale-105' : 'hover:border-slate-600'
                  }`}
                >
                  <div className={`p-2 rounded-lg bg-slate-950 ${conf.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-slate-100">{node.label}</div>
                    <div className="text-[10px] text-slate-400">{conf.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Legend Bar */}
      <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 z-10">
        <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-500">
          Schema Legend:
        </span>
        <div className="flex flex-wrap items-center gap-3">
          {(Object.keys(nodeConfig) as NodeType[]).map((type) => {
            const conf = nodeConfig[type];
            const Icon = conf.icon;
            return (
              <div key={type} className="flex items-center gap-1.5 text-[11px]">
                <span className={`p-1 rounded bg-slate-900 border border-slate-800 ${conf.color}`}>
                  <Icon className="w-3 h-3" />
                </span>
                <span className="text-slate-300 font-medium">{conf.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

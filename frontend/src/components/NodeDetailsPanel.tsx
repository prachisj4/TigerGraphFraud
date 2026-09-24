import React from 'react';
import { Info, MousePointer } from 'lucide-react';
import type { GraphNode } from './GraphView';
import { nodeConfig } from './GraphView';

interface NodeDetailsPanelProps {
  selectedNode: GraphNode | null;
}

export const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({ selectedNode }) => {
  if (!selectedNode) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center flex flex-col items-center justify-center min-h-[180px]">
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl mb-3 text-slate-500">
          <MousePointer className="w-5 h-5" />
        </div>
        <h4 className="text-xs font-medium text-slate-300 mb-1">Node Inspector</h4>
        <p className="text-xs text-slate-400 max-w-xs">
          Select a graph node to inspect its details.
        </p>
      </div>
    );
  }

  const conf = nodeConfig[selectedNode.type] || nodeConfig.Customer;
  const Icon = conf.icon;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg bg-slate-950 border ${conf.borderColor} ${conf.color}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold text-slate-100">{selectedNode.label}</h4>
            <span className="text-[10px] text-slate-400">{conf.label}</span>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${conf.bgColor} ${conf.color} ${conf.borderColor}`}>
          {selectedNode.type}
        </span>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
          <span className="text-slate-400">Node ID</span>
          <span className="font-mono text-slate-200">{selectedNode.id}</span>
        </div>
        <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
          <span className="text-slate-400">Entity Type</span>
          <span className="text-cyan-400 font-mono">{selectedNode.type}</span>
        </div>
        {selectedNode.properties &&
          Object.entries(selectedNode.properties).map(([key, val]) => (
            <div key={key} className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400 capitalize">{key}</span>
              <span className="font-mono text-slate-200">{String(val)}</span>
            </div>
          ))}
      </div>

      <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5 text-cyan-400" />
        <span>Properties retrieved from TigerGraph schema</span>
      </div>
    </div>
  );
};

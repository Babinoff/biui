import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { LayoutDashboard, Plus } from 'lucide-react';
import { useStore } from '../../store/useStore';

export function DashboardNode({ id }: { id: string }) {
  const edges = useStore(s => s.edges);
  const nodes = useStore(s => s.nodes);
  const addWidget = useStore(s => s.addWidget);
  const setRightPanelState = useStore(s => s.setRightPanelState);

  const incomingEdges = edges.filter(e => e.target === id);
  
  const handleAddToDashboard = () => {
    // Find all connected visualization nodes
    incomingEdges.forEach((edge, index) => {
      let sourceNode = nodes.find(n => n.id === edge.source);
      
      // Traverse back if it's a watch node
      while (sourceNode?.type === 'watch') {
        const watchIncomingEdges = edges.filter(e => e.target === sourceNode!.id);
        sourceNode = nodes.find(n => n.id === watchIncomingEdges[0]?.source);
      }

      if (sourceNode?.type === 'visualization' && sourceNode.data.outputChartConfig) {
        addWidget({
          id: `widget-${Date.now()}-${index}`,
          type: 'chart',
          x: (index % 2) * 420 + 20,
          y: Math.floor(index / 2) * 320 + 20,
          width: 400,
          height: 300,
          data: sourceNode.data.outputChartConfig,
          libraryId: sourceNode.data.outputLibraryId
        });
      }
    });

    setRightPanelState('maximized');
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg min-w-[200px] overflow-hidden">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-purple-500 border-2 border-slate-800" />
      
      <div className="bg-purple-900/50 p-2 border-b border-slate-700 flex items-center gap-2">
        <LayoutDashboard size={14} className="text-purple-400" />
        <span className="text-xs font-semibold text-slate-200">Dashboard</span>
      </div>
      
      <div className="p-3 flex flex-col gap-3">
        <div className="text-[10px] text-slate-400">
          Connected Inputs: {incomingEdges.length}
        </div>
        
        <div className="flex flex-col gap-1">
          {incomingEdges.map((edge, i) => (
            <div key={edge.id} className="text-[9px] text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-700">
              IN[{i}]: {nodes.find(n => n.id === edge.source)?.type || 'Unknown'}
            </div>
          ))}
          {incomingEdges.length === 0 && (
            <div className="text-[9px] text-slate-600 italic">No inputs connected</div>
          )}
        </div>

        <button
          onClick={handleAddToDashboard}
          disabled={incomingEdges.length === 0}
          className="flex items-center justify-center gap-1 w-full py-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white text-xs rounded transition-colors mt-1"
        >
          <Plus size={12} />
          Add to Dashboard
        </button>
      </div>
    </div>
  );
}

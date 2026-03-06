import React, { useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Database, ChevronDown } from 'lucide-react';
import { useStore } from '../../store/useStore';

export function DataSourceNode({ id, data }: { id: string, data: any }) {
  const dataSources = useStore((s) => s.dataSources);
  const updateNodeData = useStore((s) => s.updateNodeData);

  // Auto-select if only one data source exists and none is selected
  useEffect(() => {
    if (dataSources.length === 1 && !data.selectedSourceId) {
      updateNodeData(id, { selectedSourceId: dataSources[0].id });
    }
  }, [dataSources, data.selectedSourceId, id, updateNodeData]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateNodeData(id, { selectedSourceId: e.target.value });
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg min-w-[200px] overflow-hidden">
      <div className="bg-indigo-900/50 p-2 border-b border-slate-700 flex items-center gap-2">
        <Database size={14} className="text-indigo-400" />
        <span className="text-xs font-semibold text-slate-200">Data Source</span>
      </div>
      <div className="p-3 flex flex-col gap-2">
        <div className="text-xs text-slate-400">Select File:</div>
        <div className="relative">
          <select 
            className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-slate-300 appearance-none cursor-pointer focus:outline-none focus:border-indigo-500"
            value={data.selectedSourceId || ''}
            onChange={handleSelectChange}
          >
            <option value="" disabled>Select a file...</option>
            {dataSources.map(ds => (
              <option key={ds.id} value={ds.id}>{ds.name}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-indigo-500 border-2 border-slate-800"
      />
    </div>
  );
}

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Cpu } from 'lucide-react';
import { PromptEditor } from '../PromptEditor/PromptEditor';

export function TransformNode({ id, data }: { id: string, data: any }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg min-w-[350px] max-w-[450px] overflow-hidden">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-500 border-2 border-slate-800"
      />
      <div className="bg-blue-900/50 p-2 border-b border-slate-700 flex items-center gap-2">
        <Cpu size={14} className="text-blue-400" />
        <span className="text-xs font-semibold text-slate-200">Transform</span>
      </div>
      <div className="p-3">
        <PromptEditor nodeId={id} />
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-500 border-2 border-slate-800"
      />
    </div>
  );
}

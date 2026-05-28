import React from 'react';
import { Position } from '@xyflow/react';
import { Cpu } from 'lucide-react';
import { PromptEditor } from '../PromptEditor/PromptEditor';
import { BaseNode } from './BaseNode';

export function TransformNode({ id, data, selected }: { id: string, data: any, selected?: boolean }) {
  return (
    <BaseNode
      id={id}
      title="Transform"
      icon={<Cpu size={14} />}
      color="blue"
      selected={selected}
      className="min-w-[350px] max-w-[450px]"
      handles={[
        { type: 'target', position: Position.Left },
        { type: 'source', position: Position.Right }
      ]}
    >
      <div className="p-3">
        <PromptEditor nodeId={id} />
      </div>
    </BaseNode>
  );
}

import React from 'react';
import { NodeEditor } from './NodeEditor';

export function NodeCanvas() {
  return (
    <div className="flex-1 h-full relative overflow-hidden">
      <NodeEditor />
    </div>
  );
}

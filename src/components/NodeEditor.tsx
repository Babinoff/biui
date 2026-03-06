import React, { useCallback, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  Panel,
  NodeMouseHandler,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Save, Upload } from 'lucide-react';

import { useStore } from '../store/useStore';
import { DataSourceNode } from './nodes/DataSourceNode';
import { TransformNode } from './nodes/TransformNode';
import { VisualizationNode } from './nodes/VisualizationNode';
import { WatchNode } from './nodes/WatchNode';
import { DashboardNode } from './nodes/DashboardNode';

const nodeTypes = {
  dataSource: DataSourceNode,
  transform: TransformNode,
  visualization: VisualizationNode,
  watch: WatchNode,
  dashboard: DashboardNode,
};

function FlowEditor() {
  const { nodes, edges, dataSources, onNodesChange, onEdgesChange, onConnect, addNode, setSelectedNodeId, loadWorkspace } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const handleAddNode = (type: string) => {
    const position = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    
    // Slight random offset so they don't stack perfectly
    position.x += (Math.random() - 0.5) * 50;
    position.y += (Math.random() - 0.5) * 50;

    const newNode: any = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: { label: `New ${type} node` },
    };

    if (type === 'watch') {
      newNode.style = { width: 350, height: 250 };
    }

    addNode(newNode);
  };

  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    setSelectedNodeId(node.id);
  }, [setSelectedNodeId]);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  const handleSave = () => {
    const workspace = { 
      nodes: useStore.getState().nodes, 
      edges: useStore.getState().edges, 
      dataSources: useStore.getState().dataSources,
      widgets: useStore.getState().widgets
    };
    const json = JSON.stringify(workspace, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workspace-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const workspace = JSON.parse(content);
        if (workspace.nodes && workspace.edges && workspace.dataSources) {
          loadWorkspace(workspace);
        } else {
          alert('Invalid workspace file format.');
        }
      } catch (err) {
        console.error('Failed to parse workspace file:', err);
        alert('Failed to load workspace.');
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be loaded again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full h-full">
      <input 
        type="file" 
        accept=".json" 
        ref={fileInputRef} 
        onChange={handleLoad} 
        className="hidden" 
      />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-slate-950"
      >
        <Background color="#475569" variant={BackgroundVariant.Dots} gap={24} size={1} />
        <Controls className="bg-slate-800 border-slate-700 fill-slate-200" />
        <MiniMap 
          nodeColor={(node) => {
            switch (node.type) {
              case 'dataSource': return '#6366f1'; // indigo-500
              case 'transform': return '#3b82f6'; // blue-500
              case 'visualization': return '#10b981'; // emerald-500
              case 'watch': return '#f97316'; // orange-500
              default: return '#94a3b8'; // slate-400
            }
          }}
          maskColor="rgba(15, 23, 42, 0.7)"
          className="bg-slate-900 border-slate-700"
        />
        
        <Panel position="top-right" className="flex flex-col gap-2">
          <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700 backdrop-blur-sm flex gap-2 justify-end">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded transition-colors"
              title="Load Workspace"
            >
              <Upload size={14} />
              Load
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded transition-colors"
              title="Save Workspace"
            >
              <Save size={14} />
              Save
            </button>
          </div>
          <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700 backdrop-blur-sm flex gap-2">
            <button 
              onClick={() => handleAddNode('dataSource')}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded transition-colors"
            >
              + Data Source
            </button>
            <button 
              onClick={() => handleAddNode('transform')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
            >
              + Transform
            </button>
            <button 
              onClick={() => handleAddNode('watch')}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded transition-colors"
            >
              + Watch
            </button>
            <button 
              onClick={() => handleAddNode('visualization')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded transition-colors"
            >
              + Visualization
            </button>
            <button 
              onClick={() => handleAddNode('dashboard')}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors"
            >
              + Dashboard
            </button>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export function NodeEditor() {
  return (
    <ReactFlowProvider>
      <FlowEditor />
    </ReactFlowProvider>
  );
}

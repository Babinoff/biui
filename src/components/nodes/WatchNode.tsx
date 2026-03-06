import React from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import { Eye, Table2, BarChart2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { ChartCanvas } from '../ChartCanvas/ChartCanvas';

export function WatchNode({ id, selected }: { id: string, selected?: boolean }) {
  const edges = useStore(s => s.edges);
  const nodes = useStore(s => s.nodes);
  const dataSources = useStore(s => s.dataSources);
  
  const incomingEdge = edges.find(e => e.target === id);
  const sourceNode = nodes.find(n => n.id === incomingEdge?.source);
  
  let actualSourceNode = sourceNode;
  // Traverse back if the source is a watch node
  while (actualSourceNode?.type === 'watch') {
    const watchIncomingEdges = edges.filter(e => e.target === actualSourceNode!.id);
    actualSourceNode = nodes.find(n => n.id === watchIncomingEdges[0]?.source);
  }
  
  let headers: string[] = [];
  let data: any[][] = [];
  let outputChartConfig = null;
  let outputLibraryId = null;

  if (actualSourceNode) {
    if (actualSourceNode.type === 'visualization') {
      outputChartConfig = actualSourceNode.data.outputChartConfig;
      outputLibraryId = actualSourceNode.data.outputLibraryId;
    } else if (actualSourceNode.type === 'dataSource' && actualSourceNode.data.selectedSourceId) {
      const ds = dataSources.find(d => d.id === actualSourceNode.data.selectedSourceId);
      if (ds) {
        headers = ds.headers;
        data = ds.previewData;
      }
    } else {
      headers = actualSourceNode.data.outputHeaders || [];
      data = actualSourceNode.data.outputData || [];
    }
  }

  return (
    <>
      <NodeResizer minWidth={200} minHeight={150} isVisible={selected} />
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg w-full h-full flex flex-col overflow-hidden">
        <Handle type="target" position={Position.Left} className="w-3 h-3 bg-orange-500 border-2 border-slate-800" />
        <div className="bg-orange-900/50 p-2 border-b border-slate-700 flex items-center gap-2 shrink-0">
          <Eye size={14} className="text-orange-400" />
          <span className="text-xs font-semibold text-slate-200">Watch</span>
        </div>
        <div className="p-2 flex-1 overflow-hidden flex flex-col relative nodrag">
          {outputChartConfig && outputLibraryId ? (
            <div className="absolute inset-2">
              <ChartCanvas libraryId={outputLibraryId} config={outputChartConfig} className="w-full h-full" />
            </div>
          ) : headers.length > 0 ? (
            <div className="flex flex-col gap-1 h-full">
              <div className="text-[10px] text-slate-400 mb-1 flex items-center gap-1 shrink-0">
                <Table2 size={10} />
                {data.length} rows, {headers.length} cols
              </div>
              <div className="overflow-auto border border-slate-700 rounded flex-1 custom-scrollbar">
                <table className="w-full text-left border-collapse text-[8px]">
                  <thead className="bg-slate-900 sticky top-0">
                    <tr>
                      {headers.slice(0, 10).map((h: string, i: number) => (
                        <th key={i} className="p-1 border-b border-r border-slate-700 truncate max-w-[100px]">{h}</th>
                      ))}
                      {headers.length > 10 && <th className="p-1 border-b border-slate-700">...</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {data.slice(0, 50).map((row: any[], rowIndex: number) => (
                      <tr key={rowIndex} className="bg-slate-800">
                        {row.slice(0, 10).map((cell: any, cellIndex: number) => (
                          <td key={cellIndex} className="p-1 border-b border-r border-slate-700 truncate max-w-[100px] text-slate-300">
                            {String(cell)}
                          </td>
                        ))}
                        {row.length > 10 && <td className="p-1 border-b border-slate-700 text-slate-500">...</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 flex items-center justify-center h-full">No data. Run source node.</div>
          )}
        </div>
        <Handle type="source" position={Position.Right} className="w-3 h-3 bg-orange-500 border-2 border-slate-800" />
      </div>
    </>
  );
}

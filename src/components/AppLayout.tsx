import React, { useEffect } from 'react';
import { DataSourcePanel } from './DataSourcePanel';
import { NodeCanvas } from './NodeCanvas';
import { DashboardPanel } from './DashboardPanel';
import { useStore } from '../store/useStore';

export function AppLayout() {
  const theme = useStore(s => s.theme);
  const nodes = useStore(s => s.nodes);
  const edges = useStore(s => s.edges);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Sync dashboard widgets with connected visualization nodes
  useEffect(() => {
    const currentWidgets = useStore.getState().widgets;
    const addWidget = useStore.getState().addWidget;
    const updateWidget = useStore.getState().updateWidget;
    const removeWidget = useStore.getState().removeWidget;
    
    const connectedWidgetIds = new Set<string>();
    const processedSourceIds = new Set<string>();

    // Find all edges connected to ANY dashboard node
    const allDashboardEdges = edges.filter(e => nodes.find(n => n.id === e.target)?.type === 'dashboard');

    allDashboardEdges.forEach((edge, index) => {
      let sourceNode = nodes.find(n => n.id === edge.source);
      
      // Traverse back if it's a watch node
      while (sourceNode?.type === 'watch') {
        const watchIncomingEdges = edges.filter(e => e.target === sourceNode!.id);
        sourceNode = nodes.find(n => n.id === watchIncomingEdges[0]?.source);
      }

      if (sourceNode?.type === 'visualization' && sourceNode.data.outputChartConfig) {
        if (processedSourceIds.has(sourceNode.id)) return;
        processedSourceIds.add(sourceNode.id);

        const widgetId = `widget-${sourceNode.id}`;
        connectedWidgetIds.add(widgetId);
        
        const existingWidget = currentWidgets.find(w => w.id === widgetId);
        const newLibraryId = (sourceNode.data.outputLibraryId || sourceNode.data.libraryId || 'echarts') as string;
        
        if (!existingWidget) {
          addWidget({
            id: widgetId,
            type: 'chart',
            x: (index % 2) * 420 + 20,
            y: Math.floor(index / 2) * 320 + 20,
            width: 400,
            height: 300,
            data: sourceNode.data.outputChartConfig,
            libraryId: newLibraryId
          });
        } else {
          // Update widget data if it changed
          if (
            JSON.stringify(existingWidget.data) !== JSON.stringify(sourceNode.data.outputChartConfig) ||
            existingWidget.libraryId !== newLibraryId
          ) {
            updateWidget(widgetId, {
              data: sourceNode.data.outputChartConfig,
              libraryId: newLibraryId
            });
          }
        }
      }
    });

    // Remove chart widgets that are no longer connected
    currentWidgets.forEach(w => {
      // Only remove chart widgets that were auto-generated (their ID starts with 'widget-' and they are not text widgets)
      if (w.type === 'chart' && w.id.startsWith('widget-') && !connectedWidgetIds.has(w.id)) {
        removeWidget(w.id);
      }
    });
  }, [nodes, edges]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-200 transition-colors">
      <DataSourcePanel />
      <NodeCanvas />
      <DashboardPanel />
    </div>
  );
}

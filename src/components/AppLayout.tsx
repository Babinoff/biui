import React from 'react';
import { DataSourcePanel } from './DataSourcePanel';
import { NodeCanvas } from './NodeCanvas';
import { DashboardPanel } from './DashboardPanel';
import { useStore } from '../store/useStore';

export function AppLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950 font-sans text-slate-200">
      <DataSourcePanel />
      <NodeCanvas />
      <DashboardPanel />
    </div>
  );
}

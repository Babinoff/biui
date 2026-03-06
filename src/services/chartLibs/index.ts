import { VisualizationLibrary } from '../../types/visualization';

export const libraries: Record<string, VisualizationLibrary> = {
  echarts: {
    id: 'echarts',
    name: 'ECharts',
    version: '5.5.0',
    importUrl: 'https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js',
    supportedTypes: ['line', 'bar', 'pie', 'scatter'],
  },
  chartjs: {
    id: 'chartjs',
    name: 'Chart.js',
    version: '4.4.2',
    importUrl: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.js',
    supportedTypes: ['line', 'bar', 'pie', 'scatter'],
  },
  plotly: {
    id: 'plotly',
    name: 'Plotly',
    version: '2.30.0',
    importUrl: 'https://cdn.plot.ly/plotly-2.30.0.min.js',
    supportedTypes: ['line', 'bar', 'pie', 'scatter'],
  }
};

export const loadLibrary = async (libraryId: string): Promise<void> => {
  const lib = libraries[libraryId];
  if (!lib) throw new Error(`Library ${libraryId} not found`);

  // Check if already loaded
  if (libraryId === 'echarts' && (window as any).echarts) return;
  if (libraryId === 'chartjs' && (window as any).Chart) return;
  if (libraryId === 'plotly' && (window as any).Plotly) return;

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = lib.importUrl;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${lib.name}`));
    document.head.appendChild(script);
  });
};

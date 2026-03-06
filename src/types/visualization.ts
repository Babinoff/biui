export type ChartType = 'line' | 'bar' | 'pie' | 'scatter';

export interface VisualizationLibrary {
  id: string;
  name: string;
  version: string;
  importUrl: string;
  supportedTypes: ChartType[];
}

export interface ChartConfig {
  type: ChartType;
  data: any; // Library specific data/options
  options?: any;
}

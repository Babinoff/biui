export interface ColumnInfo {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'unknown';
}

export interface GenerationContext {
  schema: ColumnInfo[];
  sampleData: Record<string, any>[];
  previousTransforms?: string[];
}

export interface GenerationResult {
  code: string;
  rawResponse: string;
  metadata: {
    outputColumns: string[];
    variablesUsed: string[];
  };
}

export interface PromptHistoryItem {
  id: string;
  prompt: string;
  code: string;
  rawResponse: string;
  timestamp: number;
}

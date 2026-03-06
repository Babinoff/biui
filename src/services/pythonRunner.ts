declare global {
  interface Window {
    loadPyodide: any;
  }
}

let pyodideInstance: any = null;

export class PythonRunner {
  static async init(onLog?: (msg: string) => void) {
    if (!pyodideInstance) {
      if (!window.loadPyodide) {
        onLog?.('Injecting Pyodide script...');
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Pyodide script'));
          document.head.appendChild(script);
        });
      }
      
      onLog?.('Downloading and initializing Python runtime (Pyodide)... This may take a moment.');
      pyodideInstance = await window.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/',
      });
      
      onLog?.('Loading pandas library...');
      await pyodideInstance.loadPackage('pandas');
      onLog?.('Python runtime ready.');
    }
    return pyodideInstance;
  }

  static async run(code: string, headers: string[], data: any[][], onLog?: (msg: string) => void) {
    const pyodide = await this.init(onLog);
    
    onLog?.('Preparing data for Python...');
    // Convert data to JSON string to pass to Python
    const inputJson = JSON.stringify(data.map(row => {
      const obj: any = {};
      headers.forEach((h, i) => { obj[h] = row[i]; });
      return obj;
    }));

    // Set up the Python environment
    pyodide.globals.set('input_json', inputJson);
    
    const wrapperCode = `
import pandas as pd
import json

# Load input data
data_dicts = json.loads(input_json)
df = pd.DataFrame(data_dicts)

# --- USER CODE START ---
${code}
# --- USER CODE END ---

# Ensure result_df exists, fallback to df if not explicitly created
if 'result_df' not in locals():
    result_df = df

# Convert result back to JSON
result_json = result_df.to_json(orient='split', date_format='iso')
result_json
`;

    onLog?.('Executing Python code...');
    try {
      const resultJsonStr = await pyodide.runPythonAsync(wrapperCode);
      onLog?.('Execution successful. Parsing results...');
      
      const resultObj = JSON.parse(resultJsonStr);
      return {
        headers: resultObj.columns,
        data: resultObj.data
      };
    } catch (error: any) {
      console.error('Python execution error:', error);
      throw new Error(error.message || 'Python execution failed');
    }
  }
}

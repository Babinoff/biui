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

def run_user_code():
    data_dicts = json.loads(input_json)
    df = pd.DataFrame(data_dicts)
    
    user_globals = {'pd': pd, 'df': df}
    
    # Safely pass the user code
    import builtins
    user_globals['__builtins__'] = builtins
    
    user_code = ${JSON.stringify(code)}
    
    exec(user_code, user_globals)
    
    if 'result_df' in user_globals:
        return user_globals['result_df']
    else:
        return user_globals['df']

result_df = run_user_code()
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

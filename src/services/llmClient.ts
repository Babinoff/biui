import { GoogleGenAI } from '@google/genai';
import { Mistral } from '@mistralai/mistralai';
import { GenerationContext, GenerationResult } from '../types/llm';
import { parseCodeFromResponse } from './codeParser';
import { useStore } from '../store/useStore';

export class LLMClient {
  static async generateCode(
    prompt: string, 
    context: GenerationContext,
    onLog?: (msg: string) => void
  ): Promise<GenerationResult> {
    const storeState = useStore.getState();
    const provider = storeState.llmProvider;
    const mistralToken = storeState.mistralToken;
    const geminiToken = storeState.geminiToken;
    
    onLog?.(`Initializing ${provider === 'mistral' ? 'Mistral' : 'Gemini'} client...`);
    
    const systemInstruction = `
Твоя задача — написать Python-код (pandas) для обработки данных.
Код должен быть чистым, эффективным и содержать только необходимые импорты и логику.
Обязательно верни результат в виде Markdown блока кода (например, \`\`\`python ... \`\`\`).

ВАЖНОЕ ПРАВИЛО: 
- Входные данные уже загружены в переменную \`df\` (pandas DataFrame).
- Твой код должен преобразовать \`df\`.
- Итоговый датафрейм ДОЛЖЕН быть сохранен в переменную \`result_df\`.
- Не используй \`print()\`, просто сохрани результат в \`result_df\`.

Данные имеют следующую структуру:
Колонки: ${context.schema.map(c => c.name).join(', ')}
Типы: ${context.schema.map(c => c.type).join(', ')}

Пример данных (первые строки):
${JSON.stringify(context.sampleData, null, 2)}

${context.previousTransforms && context.previousTransforms.length > 0 ? 
  `Предыдущие преобразования:\n${context.previousTransforms.join('\n')}` : ''}
`;

    try {
      let text = '';
      if (provider === 'mistral') {
        if (!mistralToken) throw new Error('Mistral API Key is missing. Please provide it in the top menu.');
        onLog?.('Sending request to mistral-large-latest...');
        const client = new Mistral({ apiKey: mistralToken });
        const response = await client.chat.complete({
          model: 'mistral-large-latest',
          temperature: 0.2,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: `Выполни действие пользователя: ${prompt}` }
          ],
        });
        text = (response.choices?.[0]?.message?.content as string) || '';
      } else {
        if (!geminiToken) throw new Error('Gemini API Key is missing. Please provide it in the top menu.');
        onLog?.('Sending request to gemini-3.1-pro-preview...');
        const ai = new GoogleGenAI({ apiKey: geminiToken });
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: `Выполни действие пользователя: ${prompt}`,
          config: {
            systemInstruction,
            temperature: 0.2,
          },
        });
        text = response.text || '';
      }

      onLog?.('Response received. Parsing code...');
      const code = parseCodeFromResponse(text);

      onLog?.('Code parsed successfully.');
      return {
        code,
        rawResponse: text,
        metadata: {
          outputColumns: [], // Would require further parsing or a structured LLM response
          variablesUsed: [],
        },
      };
    } catch (error: any) {
      console.error('Error generating code:', error);
      onLog?.(`API Error: ${error.message}`);
      throw new Error(error.message || 'Failed to generate code. Please try again.');
    }
  }

  static async generateChartConfig(
    libraryId: string,
    headers: string[],
    data: any[][],
    prompt: string,
    onLog?: (msg: string) => void,
    promptHistory?: any[],
    uniqueCategories?: Record<string, string[]>
  ): Promise<{ chartType: string, config: any }> {
    const storeState = useStore.getState();
    const provider = storeState.llmProvider;
    const mistralToken = storeState.mistralToken;
    const geminiToken = storeState.geminiToken;

    onLog?.(`Initializing ${provider === 'mistral' ? 'Mistral' : 'Gemini'} client for chart generation...`);

    let libInstruction = '';
    if (libraryId === 'echarts') {
      libInstruction = `For the 'config' property, generate a valid ECharts option object. The root of this config should be the options (e.g., { xAxis: {...}, yAxis: {...}, series: [...] }).
IMPORTANT: DO NOT hardcode the actual data arrays. You MUST use the exact string placeholder "$dataset" for the FIRST \`dataset.source\` property (e.g. \`dataset: [{ source: "$dataset" }, ...]\`). We will inject the 2D data array there.
If you need to group data by a category to create multiple series (e.g. to show a legend with colors for each category), you MUST use ECharts \`dataset.transform\` of type \`filter\` for each unique category.
CRITICAL ECHARTS FILTER SYNTAX EXAMPLE:
If you want to group by "CategoryColumn" which has values "A" and "B":
"dataset": [
  { "source": "$dataset" },
  { "transform": { "type": "filter", "config": { "dimension": "CategoryColumn", "=": "A" } } },
  { "transform": { "type": "filter", "config": { "dimension": "CategoryColumn", "=": "B" } } }
],
"series": [
  { "type": "bar", "datasetIndex": 1, "name": "A" },
  { "type": "bar", "datasetIndex": 2, "name": "B" }
]
Do not use "eq" or "value" objects inside config! Use the exact syntax shown above.
DO NOT hardcode \`xAxis.data\` or \`legend.data\`. ECharts infers them automatically. Set \`xAxis.type: 'category'\` if needed.`;
    } else if (libraryId === 'chartjs') {
      libInstruction = `For the 'config' property, generate a valid Chart.js configuration object with 'data' and 'options' properties.
IMPORTANT: DO NOT hardcode the actual data arrays. For any data array (like labels or dataset data), you MUST use the exact string placeholder "$col_HEADERNAME" (e.g. "$col_Month" or "$col_Sales"). We will replace these placeholders with the actual data arrays before rendering.
NOTE: In Chart.js JSON, you cannot dynamically filter a single dataset into multiple grouped series. If the user asks to group by a category and show a legend, do your best using single datasets or mapping colors if possible, but you cannot create multiple datasets from a long-format table dynamically here.`;
    } else if (libraryId === 'plotly') {
      libInstruction = `For the 'config' property, generate a valid Plotly configuration object with 'data' (array of traces) and 'options' (layout) properties.
IMPORTANT: DO NOT hardcode the actual data arrays. For any data array (like x or y values in traces), you MUST use the exact string placeholder "$col_HEADERNAME" (e.g. "$col_Month" or "$col_Sales"). We will replace these placeholders with the actual data arrays before rendering.
NOTE: In Plotly JSON, you cannot dynamically filter a single dataset into multiple grouped traces. If the user asks to group by a category, do your best using 'color' or 'transforms' if Plotly supports it in JSON, otherwise use a single trace.`;
    }

    let historyContext = '';
    if (promptHistory && promptHistory.length > 0) {
      historyContext = `\nPrevious interactions:\n`;
      const recentHistory = [...promptHistory].slice(0, 3).reverse();
      recentHistory.forEach((item, index) => {
        historyContext += `\n--- Interaction ${index + 1} ---\nUser Request: ${item.prompt}\nGenerated Config:\n${item.config}\n`;
      });
      historyContext += `\n--- Current Request ---\n`;
    }

    const uniqueCategoriesStr = uniqueCategories ? JSON.stringify(uniqueCategories, null, 2) : '{}';

    const systemInstruction = `
You are a data visualization expert.
Your task is to choose the most appropriate chart type and generate a JSON configuration for it using the ${libraryId} library.
Supported chart types: 'line', 'bar', 'pie', 'scatter'.

${libInstruction}
IMPORTANT RULES:
1. Do not hardcode font colors, text colors, or background colors. Let the charting library handle them automatically so the chart can adapt to light and dark themes.
2. The configuration MUST be completely data-agnostic, relying ONLY on the column headers and the provided unique categories. 
3. Unique Category Values: If you need to create multiple series based on a categorical column (e.g., to create a legend with distinct colors), you CAN use the exact category values provided in the "Unique Category Values" JSON below. DO NOT guess categories from the sample data, use ONLY the provided Unique Category Values.

Input Data Headers: ${JSON.stringify(headers)}
Unique Category Values: ${uniqueCategoriesStr}
Input Data Sample (first 10 rows): ${JSON.stringify(data.slice(0, 10))}
${historyContext}
User Request: ${prompt}

You MUST return a JSON object with EXACTLY two properties:
1. "chartType": A string, one of ['line', 'bar', 'pie', 'scatter']
2. "config": The configuration object for the chosen chart type.

Return ONLY a valid JSON object. Do not include markdown formatting like \`\`\`json. Just the raw JSON string.
`;

    try {
      let text = '{}';
      if (provider === 'mistral') {
        if (!mistralToken) throw new Error('Mistral API Key is missing. Please provide it in the top menu.');
        onLog?.(`Sending request to mistral-large-latest for ${libraryId} config...`);
        const client = new Mistral({ apiKey: mistralToken });
        const response = await client.chat.complete({
          model: 'mistral-large-latest',
          temperature: 0.1,
          responseFormat: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemInstruction }
          ],
        });
        text = (response.choices?.[0]?.message?.content as string) || '{}';
      } else {
        if (!geminiToken) throw new Error('Gemini API Key is missing. Please provide it in the top menu.');
        onLog?.(`Sending request to gemini-3-flash-preview for ${libraryId} config...`);
        const ai = new GoogleGenAI({ apiKey: geminiToken });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: systemInstruction,
          config: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        });
        text = response.text || '{}';
      }

      onLog?.('Parsing chart configuration...');
      const result = JSON.parse(text);
      return result;
    } catch (error: any) {
      console.error('Chart generation error:', error);
      throw new Error(error.message || 'Failed to generate chart configuration');
    }
  }
}

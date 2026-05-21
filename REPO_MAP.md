# Структурная карта репозитория BIUI

**Ключевой стек и механика:** React 19 + Zustand + React Flow (`@xyflow/react`). 
*Главная фича архитектуры:* данные обрабатываются локально прямо в браузере через WASM Python (Pyodide). ИИ (Gemini / Mistral) только пишет код трансформации, но сами данные ему не отправляются (передается только схема и сэмпл).

## 🗂 Главные модули (`src/`)

**1. Состояние и Управление данными (Store)**
- `src/store/useStore.ts`
  - Единое хранилище Zustand.
  - Хранит граф (nodes, edges), исходные CSV-данные (`dataSources`), состояние UI-панелей и финальные виджеты дашборда (`widgets`).
  - Управляет настройками (тема, провайдер LLM).

**2. Сервисы (Ядро бизнес-логики)**
- `src/services/pythonRunner.ts`
  - Инициализирует Pyodide (WASM Python) в браузере.
  - Принимает JSON-данные и Python-код, прокидывает их в `pandas`, выполняет трансформацию локально и возвращает измененный DataFrame.
- `src/services/llmClient.ts`
  - Отвечает за связь с Gemini API (`@google/genai`) и Mistral API (`@mistralai/mistralai`).
  - *Два режима работы:* генерация pandas-кода для `TransformNode` и генерация JSON-конфигов (ECharts, Chart.js, Plotly) для `VisualizationNode`.
- `src/services/chartLibs/`
  - Обертки для унифицированного рендера графиков из JSON-конфигов, сгенерированных ИИ.

**3. Визуальный редактор (React Flow)**
- `src/components/NodeCanvas.tsx` & `src/components/NodeEditor.tsx`
  - Контейнер и холст для нод.
- **Узлы пайплайна (`src/components/nodes/`):**
  - `DataSourceNode.tsx`: Входная точка пайплайна (выбор загруженного датасета).
  - `TransformNode.tsx`: Трансформация данных (запрашивает код у `llmClient` и прогоняет через `pythonRunner`).
  - `VisualizationNode.tsx`: Узел настройки графиков (промпт -> ИИ -> JSON конфиг графика).
  - `WatchNode.tsx`: Узел-инспектор. Показывает Data Grid (таблицу) с текущим состоянием данных.
  - `DashboardNode.tsx`: Экспортирует результат пайплайна (график/таблицу) на финальный дашборд.

**4. Пользовательский интерфейс и Дашборд**
- `src/components/AppLayout.tsx`: Главный каркас приложения (холст по центру, панели по бокам).
- `src/components/DataSourcePanel.tsx`: Панель загрузки и парсинга CSV (через `papaparse`).
- `src/components/DashboardPanel.tsx` & `src/components/DashboardEditor/DashboardEditor.tsx`: Панель просмотра и компоновки финальных графиков/виджетов, переданных из пайплайна.
- `src/components/PromptEditor/PromptEditor.tsx`: UI-компонент ввода промптов для связи с ИИ внутри нод.

## 🔄 Жизненный цикл данных
1. Загрузка CSV в `DataSourcePanel` -> сохранение в `useStore`.
2. Выбор датасета в `DataSourceNode`.
3. Соединение с `TransformNode`: пишем промпт ("сгруппируй по дате"), выбранный LLM-провайдер генерирует Python-код, Pyodide исполняет код над данными из предыдущей ноды.
4. Вывод данных в `WatchNode` (проверка таблицы) или передача в `VisualizationNode` (создание графика с помощью ИИ).
5. Передача в `DashboardNode` -> виджет появляется в `DashboardPanel`.

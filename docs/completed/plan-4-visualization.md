# План реализации Этапа 4: Визуализация и Библиотеки

## Цель этапа
Реализовать динамическую поддержку библиотек визуализации (Chart.js, ECharts, Plotly и др.), создать компоненты отображения графиков в превью нод и реализовать генерацию кода для конкретной библиотеки на основе выбора пользователя.

---

## Задачи этапа

### 1. Поддержка библиотек визуализации
- [ ] Создать список поддерживаемых библиотек:
  - Chart.js (легковесная, простая)
  - ECharts (мощная, множество типов графиков)
  - Plotly (интерактивные графики)
  - Дополнительно: D3.js (для кастомной визуализации)
- [ ] Настройка динамического импорта библиотек:
  - Загрузка по запросу (lazy loading)
  - Кэширование загруженных библиотек
- [ ] Создать интерфейс `VisualizationLibrary`:
  ```typescript
  interface VisualizationLibrary {
    name: string;
    version: string;
    importUrl: string; // CDN или путь к модулю
    supportedTypes: ChartType[];
  }
  ```

### 2. Типы графиков и их настройка
- [ ] Определить поддерживаемые типы:
  - Линейный график (Line)
  - Столбчатая диаграмма (Bar)
  - Круговая/круговая с выделением (Pie/Doughnut)
  - Скаттерплот (Scatter)
  - Heatmap
- [ ] Создать интерфейс конфигурации для каждого типа:
  ```typescript
  interface ChartConfig {
    type: ChartType;
    data: any[];
    options?: Record<string, any>;
  }
  ```

### 3. Компоненты отображения графиков
- [ ] Создать компонент `ChartPreview` (используется в превью нод):
  - Адаптивный размер (высота ~150px)
  - Поддержка всех типов графиков
  - Базовые настройки темы (цвета, легенда)
- [ ] Создать компонент `ChartFullView` (используется в Dashboard):
  - Полноэкранный режим
  - Экспорт в PNG/SVG
  - Интерактивные элементы (zoom, tooltip)

### 4. Генерация кода для конкретной библиотеки
- [ ] Обновить шаблон промта с учетом выбора библиотеки:
  ```
  Используй библиотеку {libraryName} v{version}.
  Создай конфигурацию графика для следующих данных...
  ```
- [ ] Парсинг ответа LLM: извлечение конфигурации графика
- [ ] Валидация конфигурации перед рендерингом

### 5. Интеграция с нодой визуализации
- [ ] Обновить `VisualizationNode`:
  - Выбор библиотеки из выпадающего списка
  - Выбор типа графика
  - Параметры отображения (цвета, подписи)
  - Кнопка "Превью" для тестового рендеринга
- [ ] Отображение сгенерированного кода и превью одновременно

### 6. Ресайз и адаптивность графиков
- [ ] Реализовать обработку изменения размеров контейнера
- [ ] Перерисовка графика при изменении ширины/высоты
- [ ] Сохранение состояния ресайза в метаданных ноды

### 7. Экспорт и совместимость
- [ ] Функция экспорта конфигурации графика (JSON)
- [ ] Импорт конфигурации из JSON
- [ ] Сохранение настроек визуализации как часть состояния ноды

---

## Технические детали

### Структура компонентов

```
src/
├── components/
│   ├── ChartPreview/          # Превью в ноде
│   │   ├── ChartPreview.tsx
│   │   └── styles.scss
│   ├── ChartFullView/         # Полноэкранный режим
│   │   ├── ChartFullView.tsx
│   │   ├── ExportModal.tsx
│   │   └── styles.scss
│   ├── VisualizationNode/
│   │   └── ConfigPanel.tsx    # Выбор библиотеки и типа
│   └── ChartCanvas/           # Базовый компонент рендеринга
├── services/
│   ├── chartLibs/             # Конфигурации библиотек
│   │   ├── chartJs.ts
│   │   ├── echarts.ts
│   │   └── plotly.ts
│   └── chartGenerator.ts      # Генерация кода для конкретной библиотеки
└── hooks/
    └── useChartRenderer.ts    # Хук для управления рендерингом
```

### Пример интеграции Chart.js

```typescript
import { Line } from 'react-chartjs-2';

const ChartPreview = ({ config }: { config: ChartConfig }) => {
  return <Line data={config.data} options={config.options} />;
};

// Конфигурация библиотеки
export const chartJsLibrary: VisualizationLibrary = {
  name: 'Chart.js',
  version: '4.4.0',
  importUrl: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  supportedTypes: ['line', 'bar', 'pie', 'doughnut', 'scatter'],
};
```

### Пример интеграции ECharts

```typescript
import * as echarts from 'echarts';

const ChartFullView = ({ config, containerRef }) => {
  useEffect(() => {
    const chart = echarts.init(containerRef.current);
    chart.setOption(config.data);
    return () => chart.dispose();
  }, [config]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
};
```

### Система динамической загрузки

```typescript
const loadLibrary = async (library: VisualizationLibrary) => {
  const script = document.createElement('script');
  script.src = library.importUrl;
  script.onload = () => console.log(`${library.name} loaded`);
  document.head.appendChild(script);
};
```

---

## Критерии приемки Этапа 4

1. Можно выбрать библиотеку визуализации из списка
2. Графики корректно отображаются в превью ноды (150px высотой)
3. Выбранная библиотека и тип графика сохраняются в метаданных ноды
4. Генерация кода работает для выбранной библиотеки
5. Экспорт/импорт конфигурации графика работает
6. Графики адаптируются под размер контейнера

---

## Следующий этап: Этап 5 — Презентационный режим (Dashboard)
После завершения Этапа 4 перейти к реализации финальной панели дашборда с возможностью размещения, масштабирования и настройки графиков.
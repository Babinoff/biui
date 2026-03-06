import React, { useEffect, useRef, useState } from 'react';
import { loadLibrary, libraries } from '../../services/chartLibs';
import { ChartConfig } from '../../types/visualization';

interface ChartCanvasProps {
  libraryId: string;
  config: ChartConfig | null;
  className?: string;
}

export function ChartCanvas({ libraryId, config, className = '' }: ChartCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setIsLoaded(false);
    setError(null);
    
    loadLibrary(libraryId)
      .then(() => {
        if (mounted) setIsLoaded(true);
      })
      .catch(err => {
        if (mounted) setError(err.message);
      });
    return () => { mounted = false; };
  }, [libraryId]);

  useEffect(() => {
    if (!isLoaded || !config) return;

    try {
      if (libraryId === 'echarts' && containerRef.current) {
        if (chartInstanceRef.current) {
          chartInstanceRef.current.dispose();
        }
        const echarts = (window as any).echarts;
        const chart = echarts.init(containerRef.current);
        chart.setOption(config.data);
        chartInstanceRef.current = chart;
        
        const handleResize = () => chart.resize();
        window.addEventListener('resize', handleResize);
        
        // Setup ResizeObserver for container
        const resizeObserver = new ResizeObserver(() => {
          chart.resize();
        });
        resizeObserver.observe(containerRef.current);
        
        return () => {
          window.removeEventListener('resize', handleResize);
          resizeObserver.disconnect();
          chart.dispose();
        };
      } 
      else if (libraryId === 'chartjs' && canvasRef.current) {
        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy();
        }
        const Chart = (window as any).Chart;
        chartInstanceRef.current = new Chart(canvasRef.current, {
          type: config.type,
          data: config.data,
          options: { ...config.options, responsive: true, maintainAspectRatio: false }
        });
        return () => {
          if (chartInstanceRef.current) chartInstanceRef.current.destroy();
        };
      }
      else if (libraryId === 'plotly' && containerRef.current) {
        const Plotly = (window as any).Plotly;
        Plotly.newPlot(containerRef.current, config.data, { ...config.options, autosize: true }, { responsive: true });
        
        const resizeObserver = new ResizeObserver(() => {
          Plotly.Plots.resize(containerRef.current);
        });
        resizeObserver.observe(containerRef.current);
        
        return () => {
          resizeObserver.disconnect();
          Plotly.purge(containerRef.current);
        };
      }
    } catch (err: any) {
      console.error('Chart rendering error:', err);
      setError(err.message);
    }
  }, [isLoaded, config, libraryId]);

  if (error) {
    return <div className={`flex items-center justify-center text-red-400 text-xs h-full w-full ${className}`}>{error}</div>;
  }

  if (!isLoaded) {
    return <div className={`flex items-center justify-center text-slate-400 text-xs h-full w-full ${className}`}>Loading {libraries[libraryId]?.name}...</div>;
  }

  if (!config) {
    return <div className={`flex items-center justify-center text-slate-500 text-xs h-full w-full ${className}`}>No configuration</div>;
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {libraryId === 'chartjs' ? (
        <canvas ref={canvasRef} className="w-full h-full" />
      ) : (
        <div ref={containerRef} className="w-full h-full" />
      )}
    </div>
  );
}

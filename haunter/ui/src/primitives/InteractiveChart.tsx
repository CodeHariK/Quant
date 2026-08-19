import { createSignal, createEffect, onCleanup } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { createChart, IChartApi, Logical, LogicalRange } from 'lightweight-charts';
import { useTheme } from '../store/themeStore';

export interface MeasurementPoint {
  time: any; // lightweight-charts Time
  value: number; // e.g., close price or portfolio value
  high?: number;
  low?: number;
}

export interface InteractiveChartProps {
  onChartInit: (chart: IChartApi) => void;
  onVisibleRangeChange?: (range: LogicalRange) => void;
  measurementData: MeasurementPoint[];
  children?: JSX.Element;
  containerClass?: string;
  chartClass?: string;
}

export function InteractiveChart(props: InteractiveChartProps) {
  let chartContainerRef: HTMLDivElement | undefined;
  let chart: IChartApi | undefined;

  const { theme } = useTheme();

  const [selectionBox, setSelectionBox] = createSignal<{ left: number, width: number } | null>(null);
  const [measurement, setMeasurement] = createSignal<{ change: number, pct: number, bars: number, maxHigh: number, minLow: number, endPrice: number, startPrice: number } | null>(null);

  const initContainer = (el: HTMLDivElement) => {
    chartContainerRef = el;
    const currentTheme = theme();
    const isDark = currentTheme === 'dark';

    chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { color: 'transparent' },
        textColor: isDark ? '#f1f1f1' : '#1a1c1c',
        fontFamily: 'JetBrains Mono, monospace',
      },
      handleScroll: {
        pressedMouseMove: false,
        horzTouchDrag: true,
        vertTouchDrag: true,
        mouseWheel: true,
      },
      grid: {
        vertLines: { color: isDark ? '#2d3030' : '#f0f0f0' },
        horzLines: { color: isDark ? '#2d3030' : '#f0f0f0' },
      },
      rightPriceScale: {
        borderColor: isDark ? '#544c4d' : '#000000',
        borderVisible: false, // Override later if needed
      },
      timeScale: {
        borderColor: isDark ? '#544c4d' : '#000000',
        timeVisible: true,
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: isDark ? 'rgba(224, 227, 235, 0.4)' : 'rgba(0, 0, 0, 0.2)',
          labelBackgroundColor: '#4B9CFF',
        },
        horzLine: {
          color: isDark ? 'rgba(224, 227, 235, 0.4)' : 'rgba(0, 0, 0, 0.2)',
          labelBackgroundColor: '#4B9CFF',
        }
      }
    });

    // Let parent add series
    props.onChartInit(chart);

    // --- INTERACTION LOGIC ---
    let isSelecting = false;
    let isPanning = false;
    let startX = 0;
    let lastPanX = 0;
    let startLogical: Logical | null = null;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 1) { // Middle click to pan
        isPanning = true;
        lastPanX = e.clientX;
        setSelectionBox(null);
        setMeasurement(null);
        e.stopPropagation();
        e.preventDefault();
        return;
      }
      
      if (e.button === 0) { // Left click to select/measure
        isSelecting = true;
        startX = e.clientX;
        
        const rect = el.getBoundingClientRect();
        const xPos = startX - rect.left;
        
        startLogical = chart!.timeScale().coordinateToLogical(xPos);
        setSelectionBox({ left: xPos, width: 0 });
        setMeasurement(null);
        e.stopPropagation();
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        e.stopPropagation();
        e.preventDefault();
        const deltaX = e.clientX - lastPanX;
        lastPanX = e.clientX;
        
        const timeScale = chart!.timeScale();
        const range = timeScale.getVisibleLogicalRange();
        if (range) {
          const width = el.getBoundingClientRect().width;
          const logicalWidth = range.to - range.from;
          const barSpacing = width / logicalWidth;
          const shift = deltaX / barSpacing;
          
          timeScale.setVisibleLogicalRange({ 
            from: (range.from - shift) as Logical, 
            to: (range.to - shift) as Logical 
          });
        }
        return;
      }

      if (!isSelecting) return;
      e.stopPropagation();
      
      const rect = el.getBoundingClientRect();
      const rawCurrentX = e.clientX - rect.left;
      const currentX = Math.max(0, Math.min(rawCurrentX, rect.width));
      const initialX = startX - rect.left;
      
      setSelectionBox({
        left: Math.min(initialX, currentX),
        width: Math.abs(currentX - initialX)
      });

      const d = props.measurementData;
      if (startLogical !== null && d && d.length > 0) {
        const endLogical = chart!.timeScale().coordinateToLogical(currentX);
        if (endLogical !== null) {
          const startIdx = Math.max(0, Math.min(Math.round(startLogical as number), d.length - 1));
          const endIdx = Math.max(0, Math.min(Math.round(endLogical as number), d.length - 1));
          
          const startBar = d[startIdx];
          const endBar = d[endIdx];
          
          const change = endBar.value - startBar.value;
          const pct = startBar.value !== 0 ? (change / startBar.value) * 100 : 0;
          const bars = Math.abs(endIdx - startIdx);
          
          const rangeStart = Math.min(startIdx, endIdx);
          const rangeEnd = Math.max(startIdx, endIdx);
          const rangeCandles = d.slice(rangeStart, rangeEnd + 1);
          
          const maxHigh = rangeCandles.length > 0 ? Math.max(...rangeCandles.map(c => c.high ?? c.value)) : (startBar.high ?? startBar.value);
          const minLow = rangeCandles.length > 0 ? Math.min(...rangeCandles.map(c => c.low ?? c.value)) : (startBar.low ?? startBar.value);
          
          setMeasurement({ change, pct, bars, maxHigh, minLow, endPrice: endBar.value, startPrice: startBar.value });
        }
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (isPanning) {
        isPanning = false;
        e.stopPropagation();
        return;
      }
      if (isSelecting) {
        isSelecting = false;
        e.stopPropagation();
      }
    };

    const handleVisibleRangeChange = (range: LogicalRange | null) => {
      if (!isSelecting) {
        setSelectionBox(null);
        setMeasurement(null);
      }
      if (range && props.onVisibleRangeChange) {
        props.onVisibleRangeChange(range);
      }
    };

    chart.timeScale().subscribeVisibleLogicalRangeChange(handleVisibleRangeChange);

    el.addEventListener('mousedown', onMouseDown, { capture: true });
    window.addEventListener('mousemove', onMouseMove, { capture: true });
    window.addEventListener('mouseup', onMouseUp, { capture: true });

    onCleanup(() => {
      el.removeEventListener('mousedown', onMouseDown, { capture: true });
      window.removeEventListener('mousemove', onMouseMove, { capture: true });
      window.removeEventListener('mouseup', onMouseUp, { capture: true });
      if (chart) {
        chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleVisibleRangeChange);
        chart.remove();
      }
    });
  };

  createEffect(() => theme(), (currentTheme) => {
    if (chart) {
      const isDark = currentTheme === 'dark';
      chart.applyOptions({
        layout: { textColor: isDark ? '#f1f1f1' : '#1a1c1c' },
        grid: { vertLines: { color: isDark ? '#2d3030' : '#f0f0f0' }, horzLines: { color: isDark ? '#2d3030' : '#f0f0f0' } },
        rightPriceScale: { borderColor: isDark ? '#544c4d' : '#000000' },
        timeScale: { borderColor: isDark ? '#544c4d' : '#000000' }
      });
    }
  });

  return (
    <div class={props.containerClass || "w-full flex flex-col gap-2 relative select-none"}>
      <div class={props.chartClass || "w-full min-h-[400px] border border-outline-variant bg-surface p-1 relative"}>
        <div ref={initContainer} class="w-full h-full min-h-[400px]" />
        
        {/* Measurement Selection Overlay */}
        {selectionBox() && (
          <div 
            class={`absolute top-0 bottom-0 border pointer-events-none z-10 flex items-center justify-center overflow-visible ${measurement() && measurement()!.change >= 0 ? 'bg-blue-500/10 border-blue-500/50' : 'bg-orange-500/10 border-orange-500/50'}`}
            style={{
              left: `${selectionBox()!.left}px`,
              width: `${selectionBox()!.width}px`
            }}
          >
            {measurement() && selectionBox()!.width > 50 && (
              <div class={`absolute bg-surface border p-2 text-xs font-mono shadow-lg rounded ${measurement()!.change >= 0 ? 'border-green-500/50' : 'border-red-500/50'} z-50 pointer-events-none`}>
                <div class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 items-center">
                  <div class="text-gray-500 opacity-80 text-right">High:</div>
                  <div class="font-bold">{measurement()!.maxHigh.toFixed(2)}</div>
                  
                  <div class="text-gray-500 opacity-80 text-right">Low:</div>
                  <div class="font-bold">{measurement()!.minLow.toFixed(2)}</div>
                  
                  <div class="text-gray-500 opacity-80 text-right">Start:</div>
                  <div class="font-bold">{measurement()!.startPrice.toFixed(2)}</div>
                  
                  <div class="text-gray-500 opacity-80 text-right">Current:</div>
                  <div class="font-bold">{measurement()!.endPrice.toFixed(2)}</div>
                  
                  <div class="text-gray-500 opacity-80 text-right">Change:</div>
                  <div class={`font-bold ${measurement()!.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {measurement()!.change >= 0 ? '+' : ''}{measurement()!.pct.toFixed(2)}%
                  </div>
                  
                  <div class="text-gray-500 opacity-80 text-right">Period:</div>
                  <div class="font-bold">{measurement()!.bars} bars</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {props.children}
    </div>
  );
}

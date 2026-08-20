import { createEffect, createMemo, createSignal, onCleanup, Show } from 'solid-js';
import { IChartApi, LineSeries, createSeriesMarkers } from 'lightweight-charts';
import { useTheme } from '../../../store/themeStore';
import type { EquityPoint } from '../../../hooks/usePortfolioSimulation';
import { InteractiveChart, MeasurementPoint } from '../../../primitives/InteractiveChart';
import type { KiteTrade } from '../../../api/stockApi';

interface PortfolioEquityChartProps {
  equityCurve: EquityPoint[];
  stockCurves?: Record<string, {time: string, value: number}[]>;
  tradeHistory?: KiteTrade[];
  tradeMarkers?: any[];
}

const STOCK_COLORS = [
  '#FF5252', // Red
  '#4CAF50', // Green
  '#FFC107', // Amber
  '#E040FB', // Purple
  '#00BCD4', // Cyan
  '#FF9800', // Orange
  '#F48FB1', // Pink
  '#CDDc39', // Lime
  '#795548', // Brown
  '#607D8B', // Blue Grey
];

export function PortfolioEquityChart(props: PortfolioEquityChartProps) {
  let chartInstance: IChartApi | undefined;
  
  // Keep track of series for updates
  let mainSeries: any;
  let investedSeries: any;
  let stockSeriesMap: Record<string, any> = {};

  const [tooltip, setTooltip] = createSignal<{visible: boolean, x: number, y: number, text: string}>({ visible: false, x: 0, y: 0, text: '' });

  const { theme } = useTheme();

  const measurementData = createMemo<MeasurementPoint[]>(() => {
    if (!props.equityCurve) return [];
    return props.equityCurve.map(c => ({
      time: c.time,
      value: c.value
    }));
  });

  const onChartInit = (chart: IChartApi) => {
    chartInstance = chart;
    const isDark = theme() === 'dark';

    mainSeries = chart.addSeries(LineSeries, {
      color: '#4B9CFF',
      lineWidth: 2,
      crosshairMarkerRadius: 4,
    });

    investedSeries = chart.addSeries(LineSeries, {
      color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
      lineWidth: 2,
      lineStyle: 2, // Dashed
      crosshairMarkerRadius: 0,
    });

    chart.subscribeCrosshairMove(param => {
      if (!param.point || !param.time || param.point.x < 0 || param.point.y < 0) {
        setTooltip(s => ({ ...s, visible: false }));
        return;
      }

      if (props.tradeMarkers && props.tradeMarkers.length > 0) {
        const marker = props.tradeMarkers.find(m => m.time === param.time);
        if (marker && marker.text) {
          setTooltip({
            visible: true,
            x: param.point.x,
            y: param.point.y,
            text: marker.text
          });
        } else {
          setTooltip(s => ({ ...s, visible: false }));
        }
      } else {
        setTooltip(s => ({ ...s, visible: false }));
      }
    });

    if (props.equityCurve && props.equityCurve.length > 0) {
      mainSeries.setData(props.equityCurve.map(c => ({ time: c.time, value: c.value })));
      investedSeries.setData(props.equityCurve.map(c => ({ time: c.time, value: c.invested })));
      
      if (props.tradeMarkers !== undefined || props.tradeHistory !== undefined) {
        // Markers disabled, hover dialog handles it
      } else if (props.stockCurves) {
        let colorIndex = 0;
        Object.entries(props.stockCurves).forEach(([symbol, data]) => {
          const stockSeries = chart.addSeries(LineSeries, {
            color: STOCK_COLORS[colorIndex % STOCK_COLORS.length],
            lineWidth: 1,
            crosshairMarkerRadius: 3,
          });
          stockSeries.setData(data.map(c => ({ time: c.time, value: c.value })));
          stockSeriesMap[symbol] = stockSeries;
          colorIndex++;
        });
      }
      
      chart.timeScale().fitContent();
    }
  };

  createEffect(() => [props.equityCurve, props.stockCurves] as const, ([curve, stockCurves]) => {
    if (chartInstance && curve && curve.length > 0) {
      if (mainSeries) mainSeries.setData(curve.map(c => ({ time: c.time, value: c.value })));
      if (investedSeries) investedSeries.setData(curve.map(c => ({ time: c.time, value: c.invested })));

      if (props.tradeMarkers !== undefined || props.tradeHistory !== undefined) {
        Object.keys(stockSeriesMap).forEach(sym => {
          chartInstance!.removeSeries(stockSeriesMap[sym]);
          delete stockSeriesMap[sym];
        });
        
        // Markers disabled, hover dialog handles it
      } else if (stockCurves) {
        let colorIndex = 0;
        Object.entries(stockCurves).forEach(([symbol, data]) => {
          if (!stockSeriesMap[symbol]) {
             const stockSeries = chartInstance!.addSeries(LineSeries, {
              color: STOCK_COLORS[colorIndex % STOCK_COLORS.length],
              lineWidth: 1,
              crosshairMarkerRadius: 3,
            });
            stockSeriesMap[symbol] = stockSeries;
          }
          stockSeriesMap[symbol].setData(data.map(c => ({ time: c.time, value: c.value })));
          colorIndex++;
        });
        
        // Remove old series if they no longer exist
        Object.keys(stockSeriesMap).forEach(sym => {
          if (!stockCurves[sym]) {
            chartInstance!.removeSeries(stockSeriesMap[sym]);
            delete stockSeriesMap[sym];
          }
        });
      }
    }
  });

  createEffect(() => theme(), (currentTheme) => {
    if (investedSeries) {
      const isDark = currentTheme === 'dark';
      investedSeries.applyOptions({
        color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
      });
    }
  });

  return (
    <div class="w-full h-full relative">
      <InteractiveChart 
        onChartInit={onChartInit}
        measurementData={measurementData()}
        chartClass="absolute inset-0"
        containerClass="w-full h-full relative"
      />
      <Show when={tooltip().visible}>
        <div 
          class="absolute pointer-events-none z-50 bg-surface-container-highest border border-outline rounded p-3 shadow-lg flex flex-col gap-1 whitespace-pre-wrap max-w-sm"
          style={{
            left: `min(calc(100% - 250px), ${tooltip().x + 15}px)`,
            top: `${Math.max(10, tooltip().y - 10)}px`,
          }}
        >
          <div class="text-sm font-bold text-on-surface mb-1 text-primary">Trade Details</div>
          <div class="text-xs text-on-surface leading-relaxed">{tooltip().text}</div>
        </div>
      </Show>
    </div>
  );
}

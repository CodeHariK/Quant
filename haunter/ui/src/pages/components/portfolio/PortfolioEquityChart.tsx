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

function getStockColor(symbol: string): string {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  // The golden ratio conjugate helps distribute hues evenly
  const h = Math.abs(hash * 0.6180339887 * 360) % 360;
  return `hsl(${h.toFixed(0)}, 70%, 55%)`;
}

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

    let activeHoveredSymbol: string | null = null;

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
      } else if (props.stockCurves) {
        let closestSymbol: string | null = null;
        let minDistance = Infinity;

        Object.keys(stockSeriesMap).forEach(sym => {
          const series = stockSeriesMap[sym];
          const dataPoint = param.seriesData.get(series) as any;
          if (dataPoint !== undefined && dataPoint.value !== undefined) {
            const y = series.priceToCoordinate(dataPoint.value);
            if (y !== null && param.point) {
              const dist = Math.abs(y - param.point.y);
              if (dist < minDistance && dist < 30) { // within 30 pixels
                minDistance = dist;
                closestSymbol = sym;
              }
            }
          }
        });

        // Update thicknesses only if changed
        if (closestSymbol !== activeHoveredSymbol) {
          activeHoveredSymbol = closestSymbol;
          Object.keys(stockSeriesMap).forEach(sym => {
            const series = stockSeriesMap[sym];
            if (sym === closestSymbol) {
              series.applyOptions({ lineWidth: 3 });
            } else {
              series.applyOptions({ lineWidth: 1 });
            }
          });
        }

        if (closestSymbol) {
          setTooltip({
            visible: true,
            x: param.point!.x,
            y: param.point!.y,
            text: (closestSymbol as string).replace('.NS', '')
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
    }
    
    if (props.tradeMarkers !== undefined || props.tradeHistory !== undefined) {
      // Markers disabled, hover dialog handles it
    } else if (props.stockCurves) {
      Object.entries(props.stockCurves).forEach(([symbol, data]) => {
        const stockSeries = chart.addSeries(LineSeries, {
          color: getStockColor(symbol),
          lineWidth: 1,
          crosshairMarkerRadius: 3,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        stockSeries.setData(data.map(c => ({ time: c.time, value: c.value })));
        stockSeriesMap[symbol] = stockSeries;
      });
    }
    
    chart.timeScale().fitContent();
  };

  createEffect(() => [props.equityCurve, props.stockCurves] as const, ([curve, stockCurves]) => {
    if (chartInstance) {
      if (curve && curve.length > 0) {
        if (mainSeries) mainSeries.setData(curve.map(c => ({ time: c.time, value: c.value })));
        if (investedSeries) investedSeries.setData(curve.map(c => ({ time: c.time, value: c.invested })));
      }

      if (props.tradeMarkers !== undefined || props.tradeHistory !== undefined) {
        Object.keys(stockSeriesMap).forEach(sym => {
          chartInstance!.removeSeries(stockSeriesMap[sym]);
          delete stockSeriesMap[sym];
        });
        
        // Markers disabled, hover dialog handles it
      } else if (stockCurves) {
        Object.entries(stockCurves).forEach(([symbol, data]) => {
          if (!stockSeriesMap[symbol]) {
             const stockSeries = chartInstance!.addSeries(LineSeries, {
              color: getStockColor(symbol),
              lineWidth: 1,
              crosshairMarkerRadius: 3,
              priceLineVisible: false,
              lastValueVisible: false,
            });
            stockSeriesMap[symbol] = stockSeries;
          }
          stockSeriesMap[symbol].setData(data.map(c => ({ time: c.time, value: c.value })));
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

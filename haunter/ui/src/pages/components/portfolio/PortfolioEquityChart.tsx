import { createEffect, createMemo, onCleanup } from 'solid-js';
import { IChartApi, LineSeries, createSeriesMarkers } from 'lightweight-charts';
import { useTheme } from '../../../store/themeStore';
import type { EquityPoint } from '../../../hooks/usePortfolioSimulation';
import { InteractiveChart, MeasurementPoint } from '../../../primitives/InteractiveChart';
import type { KiteTrade } from '../../../api/stockApi';

interface PortfolioEquityChartProps {
  equityCurve: EquityPoint[];
  stockCurves?: Record<string, {time: string, value: number}[]>;
  tradeHistory?: KiteTrade[];
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

    if (props.equityCurve && props.equityCurve.length > 0) {
      mainSeries.setData(props.equityCurve.map(c => ({ time: c.time, value: c.value })));
      investedSeries.setData(props.equityCurve.map(c => ({ time: c.time, value: c.invested })));
      
      if (props.stockCurves) {
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

        if (props.tradeHistory && props.tradeHistory.length > 0) {
          Object.entries(stockSeriesMap).forEach(([symbol, series]) => {
            const rawSym = symbol.replace('.NS', '');
            const trades = props.tradeHistory!.filter(t => t.tradingsymbol === rawSym);
            if (trades.length > 0) {
              const markers = trades.map(trade => ({
                time: trade.tradeTimestamp.split('T')[0],
                position: trade.transactionType === 'BUY' ? 'belowBar' : 'aboveBar',
                color: trade.transactionType === 'BUY' ? '#4CAF50' : '#FF5252',
                shape: trade.transactionType === 'BUY' ? 'arrowUp' : 'arrowDown',
                text: `${trade.transactionType} ${trade.quantity} @ ₹${trade.averagePrice}`,
              }));
              createSeriesMarkers(series, markers as any);
            }
          });
        }
      }
      
      chart.timeScale().fitContent();
    }
  };

  createEffect(() => [props.equityCurve, props.stockCurves] as const, ([curve, stockCurves]) => {
    if (chartInstance && curve && curve.length > 0) {
      if (mainSeries) mainSeries.setData(curve.map(c => ({ time: c.time, value: c.value })));
      if (investedSeries) investedSeries.setData(curve.map(c => ({ time: c.time, value: c.invested })));

      if (stockCurves) {
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

        if (props.tradeHistory && props.tradeHistory.length > 0) {
          Object.entries(stockSeriesMap).forEach(([symbol, series]) => {
            const rawSym = symbol.replace('.NS', '');
            const trades = props.tradeHistory!.filter(t => t.tradingsymbol === rawSym);
            if (trades.length > 0) {
              const markers = trades.map(trade => ({
                time: trade.tradeTimestamp.split('T')[0],
                position: trade.transactionType === 'BUY' ? 'belowBar' : 'aboveBar',
                color: trade.transactionType === 'BUY' ? '#4CAF50' : '#FF5252',
                shape: trade.transactionType === 'BUY' ? 'arrowUp' : 'arrowDown',
                text: `${trade.transactionType} ${trade.quantity} @ ₹${trade.averagePrice}`,
              }));
              createSeriesMarkers(series, markers as any);
            }
          });
        }
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
    <InteractiveChart 
      onChartInit={onChartInit}
      measurementData={measurementData()}
      chartClass="absolute inset-0"
      containerClass="w-full h-full relative"
    />
  );
}

import { createEffect, onCleanup } from 'solid-js';
import { createChart, IChartApi, LineSeries } from 'lightweight-charts';
import { useTheme } from '../../../store/themeStore';
import type { EquityPoint } from '../../../hooks/usePortfolioSimulation';

interface PortfolioEquityChartProps {
  equityCurve: EquityPoint[];
}

export function PortfolioEquityChart(props: PortfolioEquityChartProps) {
  let chartContainerRef: HTMLDivElement | undefined;
  let chart: IChartApi | undefined;

  const { theme } = useTheme();

  createEffect(() => [props.equityCurve, theme()] as const, ([curve, currentTheme]) => {
    if (chart) {
      chart.remove();
      chart = undefined;
    }

    if (!curve || curve.length === 0 || !chartContainerRef) return;

    const isDark = currentTheme === 'dark';
    chart = createChart(chartContainerRef, {
      layout: {
        background: { color: 'transparent' },
        textColor: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
      },
      grid: {
        vertLines: { color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' },
        horzLines: { color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
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

    const series = chart.addSeries(LineSeries, {
      color: '#4B9CFF',
      lineWidth: 2,
      crosshairMarkerRadius: 4,
    });

    const investedSeries = chart.addSeries(LineSeries, {
      color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
      lineWidth: 2,
      lineStyle: 2, // Dashed
      crosshairMarkerRadius: 0,
    });

    series.setData(curve.map(c => ({ time: c.time, value: c.value })));
    investedSeries.setData(curve.map(c => ({ time: c.time, value: c.invested })));

    chart.timeScale().fitContent();
  });

  onCleanup(() => {
    if (chart) chart.remove();
  });

  return (
    <div class="absolute inset-0" ref={chartContainerRef} />
  );
}

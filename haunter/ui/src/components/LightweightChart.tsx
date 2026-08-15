import { onCleanup } from 'solid-js';
import { createChart, IChartApi, AreaSeries, AreaData, Time } from 'lightweight-charts';

export interface LightweightChartProps {
  data: AreaData<Time>[];
  height?: number;
}

export function LightweightChart(props: LightweightChartProps) {
  let chart: IChartApi | undefined;

  const initContainer = (el: HTMLDivElement) => {
    chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { color: '#f9f9f9' },
        textColor: '#1a1c1c',
        fontFamily: 'JetBrains Mono, monospace',
      },
      grid: {
        vertLines: { color: '#e2e2e2' },
        horzLines: { color: '#e2e2e2' },
      },
      rightPriceScale: {
        borderColor: '#000000',
      },
      timeScale: {
        borderColor: '#000000',
      },
    });

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: '#000000',
      topColor: 'rgba(0, 255, 65, 0.4)',
      bottomColor: 'rgba(249, 249, 249, 0.0)',
      lineWidth: 2,
    });

    areaSeries.setData(props.data);
  };

  onCleanup(() => {
    if (chart) {
      chart.remove();
    }
  });

  return <div ref={initContainer} class="w-full h-full min-h-[300px]" />;
}

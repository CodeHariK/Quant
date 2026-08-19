import { onCleanup, createEffect, createSignal, createMemo, Show } from 'solid-js';
import { createChart, IChartApi, CandlestickSeries, HistogramSeries, LineSeries, Time, LogicalRange } from 'lightweight-charts';
import type { HistoryBar } from '../../../types/events';
import { useTheme } from '../../../store/themeStore';
import { calculateSMA, calculateEMA, calculateBollingerBands, calculateMACD } from '../../../utils/technicalIndicators';
import { InteractiveChart, MeasurementPoint } from '../../../primitives/InteractiveChart';

export interface TickerPriceChartProps {
  data: HistoryBar[];
}

export function TickerPriceChart(props: TickerPriceChartProps) {
  let mainChart: IChartApi | undefined;
  let macdChart: IChartApi | undefined;
  let macdContainerRef: HTMLDivElement | undefined;
  
  const [showBB, setShowBB] = createSignal(false);
  const [showSMA, setShowSMA] = createSignal(false);
  const [showEMA, setShowEMA] = createSignal(false);
  const [showMACD, setShowMACD] = createSignal(false);
  const { theme } = useTheme();

  // Reference to Series
  let candleSeries: any;
  let volumeSeries: any;
  let smaSeries: any;
  let emaSeries: any;
  let bbUpper: any;
  let bbMiddle: any;
  let bbLower: any;

  // Process data reactively
  const processedData = createMemo(() => {
    if (!props.data || props.data.length === 0) return null;
    
    const candlestickData = props.data.map(d => ({
        time: (new Date(d.date).getTime() / 1000) as Time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
    })).sort((a, b) => (a.time as number) - (b.time as number));
    
    const histogramData = props.data.map(d => ({
        time: (new Date(d.date).getTime() / 1000) as Time,
        value: d.volume,
        color: d.close >= d.open ? 'rgba(47, 168, 79, 0.4)' : 'rgba(234, 67, 53, 0.4)',
    })).sort((a, b) => (a.time as number) - (b.time as number));

    const uniqueCandles = candlestickData.filter((v, i, a) => i === 0 || v.time !== a[i-1].time);
    const uniqueVolume = histogramData.filter((v, i, a) => i === 0 || v.time !== a[i-1].time);

    const closeValues = uniqueCandles.map(c => ({ value: c.close }));
    
    const smaRaw = calculateSMA(closeValues, 20);
    const emaRaw = calculateEMA(closeValues, 50);
    const bbRaw = calculateBollingerBands(closeValues, 20, 2);
    const macdRaw = calculateMACD(closeValues, 12, 26, 9);

    const filterValid = (arr: {value: number}[]) => arr.map((v, i) => ({ time: uniqueCandles[i].time, value: v.value })).filter(v => !isNaN(v.value));

    return {
      candles: uniqueCandles,
      volume: uniqueVolume,
      sma: filterValid(smaRaw),
      ema: filterValid(emaRaw),
      bbUpper: filterValid(bbRaw.upper),
      bbMiddle: filterValid(bbRaw.middle),
      bbLower: filterValid(bbRaw.lower),
      macdLine: filterValid(macdRaw.macdLine),
      macdSignal: filterValid(macdRaw.signalLine),
      macdHist: filterValid(macdRaw.histogram).map(v => ({ 
        time: v.time, 
        value: v.value, 
        color: v.value >= 0 ? 'rgba(47, 168, 79, 0.8)' : 'rgba(234, 67, 53, 0.8)' 
      }))
    };
  });

  const measurementData = createMemo<MeasurementPoint[]>(() => {
    const d = processedData();
    if (!d) return [];
    return d.candles.map(c => ({
      time: c.time,
      value: c.close,
      high: c.high,
      low: c.low
    }));
  });

  const onMainChartInit = (chart: IChartApi) => {
    mainChart = chart;
    
    // Setup Price Scale
    chart.priceScale('right').applyOptions({
      borderColor: theme() === 'dark' ? '#544c4d' : '#000000',
    });
    chart.timeScale().applyOptions({
      timeVisible: false,
    });

    candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#2fa84f',
      downColor: '#ea4335',
      borderVisible: false,
      wickUpColor: '#2fa84f',
      wickDownColor: '#ea4335',
    });

    volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: '', // overlay
    });
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    smaSeries = chart.addSeries(LineSeries, { color: '#2962FF', lineWidth: 2, visible: false });
    emaSeries = chart.addSeries(LineSeries, { color: '#FF6D00', lineWidth: 2, visible: false });
    bbUpper = chart.addSeries(LineSeries, { color: 'rgba(41, 98, 255, 0.5)', lineWidth: 1, visible: false });
    bbMiddle = chart.addSeries(LineSeries, { color: 'rgba(41, 98, 255, 0.5)', lineWidth: 1, lineStyle: 2, visible: false });
    bbLower = chart.addSeries(LineSeries, { color: 'rgba(41, 98, 255, 0.5)', lineWidth: 1, visible: false });

    const d = processedData();
    if (d) {
      candleSeries.setData(d.candles);
      volumeSeries.setData(d.volume);
      smaSeries.setData(d.sma);
      emaSeries.setData(d.ema);
      bbUpper.setData(d.bbUpper);
      bbMiddle.setData(d.bbMiddle);
      bbLower.setData(d.bbLower);
      chart.timeScale().fitContent();
    }
  };

  createEffect(() => processedData(), (d) => {
    if (d && mainChart && candleSeries) {
      candleSeries.setData(d.candles);
      volumeSeries.setData(d.volume);
      smaSeries.setData(d.sma);
      emaSeries.setData(d.ema);
      bbUpper.setData(d.bbUpper);
      bbMiddle.setData(d.bbMiddle);
      bbLower.setData(d.bbLower);
    }
  });

  createEffect(() => [showSMA(), showEMA(), showBB()], ([sma, ema, bb]) => {
    if (!smaSeries) return;
    smaSeries.applyOptions({ visible: sma as boolean });
    emaSeries.applyOptions({ visible: ema as boolean });
    bbUpper.applyOptions({ visible: bb as boolean });
    bbMiddle.applyOptions({ visible: bb as boolean });
    bbLower.applyOptions({ visible: bb as boolean });
  });

  // --- MACD CHART INIT ---
  const initMacdContainer = (el: HTMLDivElement) => {
    macdContainerRef = el;
    macdChart = createChart(el, {
      autoSize: true,
      layout: {
        background: { color: 'transparent' },
        textColor: theme() === 'dark' ? '#f1f1f1' : '#1a1c1c',
        fontFamily: 'JetBrains Mono, monospace',
      },
      handleScroll: {
        pressedMouseMove: false, // Disabling native pan so they use middle click on main chart
        horzTouchDrag: false,
        vertTouchDrag: false,
        mouseWheel: false,
      },
      grid: {
        vertLines: { color: theme() === 'dark' ? '#2d3030' : '#f0f0f0' },
        horzLines: { color: theme() === 'dark' ? '#2d3030' : '#f0f0f0' },
      },
      rightPriceScale: {
        borderColor: theme() === 'dark' ? '#544c4d' : '#000000',
      },
      timeScale: {
        borderColor: theme() === 'dark' ? '#544c4d' : '#000000',
        timeVisible: false,
      },
    });

    const macdSeries = macdChart.addSeries(LineSeries, { color: '#2962FF', lineWidth: 2 });
    const signalSeries = macdChart.addSeries(LineSeries, { color: '#FF6D00', lineWidth: 2 });
    const histSeries = macdChart.addSeries(HistogramSeries, { color: '#26a69a' });

    createEffect(() => processedData(), (d) => {
      if (!d) return;
      macdSeries.setData(d.macdLine);
      signalSeries.setData(d.macdSignal);
      histSeries.setData(d.macdHist as any);
      
      if (mainChart) {
         const range = mainChart.timeScale().getVisibleLogicalRange();
         if (range) macdChart?.timeScale().setVisibleLogicalRange(range);
      }
    });

    createEffect(() => theme(), (currentTheme) => {
      const isDark = currentTheme === 'dark';
      const options = {
        layout: { textColor: isDark ? '#f1f1f1' : '#1a1c1c' },
        grid: { vertLines: { color: isDark ? '#2d3030' : '#f0f0f0' }, horzLines: { color: isDark ? '#2d3030' : '#f0f0f0' } },
        rightPriceScale: { borderColor: isDark ? '#544c4d' : '#000000' },
        timeScale: { borderColor: isDark ? '#544c4d' : '#000000' }
      };
      if (macdChart) macdChart.applyOptions(options);
    });

    onCleanup(() => {
      if (macdChart) macdChart.remove();
      macdChart = undefined;
    });
  };

  const handleVisibleRangeChange = (range: LogicalRange) => {
    if (macdChart) {
      macdChart.timeScale().setVisibleLogicalRange(range);
    }
  };

  const buttonClass = (active: boolean) => 
    `px-3 py-1 text-xs font-bold rounded-full transition-colors border ${active ? 'bg-primary text-on-primary border-primary' : 'bg-surface text-foreground border-outline hover:bg-surface-variant'}`;

  return (
    <InteractiveChart 
      onChartInit={onMainChartInit} 
      measurementData={measurementData()}
      onVisibleRangeChange={handleVisibleRangeChange}
    >
      <div class="flex gap-2 items-center px-1">
        <span class="text-xs font-bold text-muted mr-1">Indicators:</span>
        <button class={buttonClass(showSMA())} onClick={() => setShowSMA(!showSMA())}>SMA 20</button>
        <button class={buttonClass(showEMA())} onClick={() => setShowEMA(!showEMA())}>EMA 50</button>
        <button class={buttonClass(showBB())} onClick={() => setShowBB(!showBB())}>Bollinger Bands</button>
        <button class={buttonClass(showMACD())} onClick={() => setShowMACD(!showMACD())}>MACD</button>
      </div>
      
      <Show when={showMACD()}>
        <div class="w-full h-[150px] border border-outline-variant bg-surface p-1 relative mt-2">
          <div ref={initMacdContainer} class="w-full h-full" />
        </div>
      </Show>
    </InteractiveChart>
  );
}

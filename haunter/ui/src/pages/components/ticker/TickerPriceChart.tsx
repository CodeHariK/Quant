import { onCleanup, createEffect, createSignal, createMemo, Show } from 'solid-js';
import { createChart, IChartApi, CandlestickSeries, HistogramSeries, LineSeries, Time, Logical } from 'lightweight-charts';
import type { HistoryBar } from '../../../types/events';
import { useTheme } from '../../../store/themeStore';
import { calculateSMA, calculateEMA, calculateBollingerBands, calculateMACD } from '../../../utils/technicalIndicators';

export interface TickerPriceChartProps {
  data: HistoryBar[];
}

export function TickerPriceChart(props: TickerPriceChartProps) {
  let mainChart: IChartApi | undefined;
  let macdChart: IChartApi | undefined;
  
  let mainContainerRef: HTMLDivElement | undefined;
  let macdContainerRef: HTMLDivElement | undefined;
  
  const [selectionBox, setSelectionBox] = createSignal<{left: number, width: number} | null>(null);
  const [measurement, setMeasurement] = createSignal<{change: number, pct: number, bars: number, maxHigh: number, minLow: number, endPrice: number, startPrice: number} | null>(null);

  const [showBB, setShowBB] = createSignal(false);
  const [showSMA, setShowSMA] = createSignal(false);
  const [showEMA, setShowEMA] = createSignal(false);
  const [showMACD, setShowMACD] = createSignal(false);
  const { theme } = useTheme();

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

    // Remove duplicates by time
    const uniqueCandles = candlestickData.filter((v, i, a) => i === 0 || v.time !== a[i-1].time);
    const uniqueVolume = histogramData.filter((v, i, a) => i === 0 || v.time !== a[i-1].time);

    // Calculate Indicators
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

  // --- MAIN CHART INIT ---
  const initMainContainer = (el: HTMLDivElement) => {
    mainContainerRef = el;
    mainChart = createChart(el, {
      autoSize: true,
      layout: {
        background: { color: 'transparent' },
        textColor: theme() === 'dark' ? '#f1f1f1' : '#1a1c1c',
        fontFamily: 'JetBrains Mono, monospace',
      },
      handleScroll: {
        pressedMouseMove: false,
        horzTouchDrag: true,
        vertTouchDrag: true,
        mouseWheel: true,
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

    const candleSeries = mainChart.addSeries(CandlestickSeries, {
      upColor: '#2fa84f',
      downColor: '#ea4335',
      borderVisible: false,
      wickUpColor: '#2fa84f',
      wickDownColor: '#ea4335',
    });

    const volumeSeries = mainChart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: '', // overlay
    });
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    // Indicator Series
    const smaSeries = mainChart.addSeries(LineSeries, { color: '#2962FF', lineWidth: 2, visible: false });
    const emaSeries = mainChart.addSeries(LineSeries, { color: '#FF6D00', lineWidth: 2, visible: false });
    const bbUpper = mainChart.addSeries(LineSeries, { color: 'rgba(41, 98, 255, 0.5)', lineWidth: 1, visible: false });
    const bbMiddle = mainChart.addSeries(LineSeries, { color: 'rgba(41, 98, 255, 0.5)', lineWidth: 1, lineStyle: 2, visible: false });
    const bbLower = mainChart.addSeries(LineSeries, { color: 'rgba(41, 98, 255, 0.5)', lineWidth: 1, visible: false });

    // Data Effect
    createEffect(() => processedData(), (d) => {
      if (!d) return;
      candleSeries.setData(d.candles);
      volumeSeries.setData(d.volume);
      smaSeries.setData(d.sma);
      emaSeries.setData(d.ema);
      bbUpper.setData(d.bbUpper);
      bbMiddle.setData(d.bbMiddle);
      bbLower.setData(d.bbLower);
      mainChart?.timeScale().fitContent();
    });

    // Visibility Effect
    createEffect(() => [showSMA(), showEMA(), showBB()], ([sma, ema, bb]) => {
      smaSeries.applyOptions({ visible: sma as boolean });
      emaSeries.applyOptions({ visible: ema as boolean });
      bbUpper.applyOptions({ visible: bb as boolean });
      bbMiddle.applyOptions({ visible: bb as boolean });
      bbLower.applyOptions({ visible: bb as boolean });
    });


    // Theme effect
    createEffect(() => theme(), (currentTheme) => {
      const isDark = currentTheme === 'dark';
      const options = {
        layout: { textColor: isDark ? '#f1f1f1' : '#1a1c1c' },
        grid: { vertLines: { color: isDark ? '#2d3030' : '#f0f0f0' }, horzLines: { color: isDark ? '#2d3030' : '#f0f0f0' } },
        rightPriceScale: { borderColor: isDark ? '#544c4d' : '#000000' },
        timeScale: { borderColor: isDark ? '#544c4d' : '#000000' }
      };
      if (mainChart) mainChart.applyOptions(options);
      if (macdChart) macdChart.applyOptions(options);
    });

    // --- CUSTOM INTERACTION LOGIC ---
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
        
        startLogical = mainChart!.timeScale().coordinateToLogical(xPos);
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
        
        const timeScale = mainChart!.timeScale();
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

      const d = processedData();
      if (startLogical !== null && d && d.candles.length > 0) {
        const endLogical = mainChart!.timeScale().coordinateToLogical(currentX);
        if (endLogical !== null) {
          const startIdx = Math.max(0, Math.min(Math.round(startLogical as number), d.candles.length - 1));
          const endIdx = Math.max(0, Math.min(Math.round(endLogical as number), d.candles.length - 1));
          
          const startBar = d.candles[startIdx];
          const endBar = d.candles[endIdx];
          
          const change = endBar.close - startBar.close;
          const pct = (change / startBar.close) * 100;
          const bars = Math.abs(endIdx - startIdx);
          
          const rangeStart = Math.min(startIdx, endIdx);
          const rangeEnd = Math.max(startIdx, endIdx);
          const rangeCandles = d.candles.slice(rangeStart, rangeEnd + 1);
          
          const maxHigh = rangeCandles.length > 0 ? Math.max(...rangeCandles.map(c => c.high)) : startBar.high;
          const minLow = rangeCandles.length > 0 ? Math.min(...rangeCandles.map(c => c.low)) : startBar.low;
          
          setMeasurement({ change, pct, bars, maxHigh, minLow, endPrice: endBar.close, startPrice: startBar.close });
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

    const handleVisibleRangeChange = () => {
      if (!isSelecting) {
        setSelectionBox(null);
        setMeasurement(null);
      }
      // Sync MACD chart
      if (macdChart && mainChart) {
        const range = mainChart.timeScale().getVisibleLogicalRange();
        if (range) macdChart.timeScale().setVisibleLogicalRange(range);
      }
    };

    if (mainChart) {
      mainChart.timeScale().subscribeVisibleLogicalRangeChange(handleVisibleRangeChange);
    }

    el.addEventListener('mousedown', onMouseDown, { capture: true });
    window.addEventListener('mousemove', onMouseMove, { capture: true });
    window.addEventListener('mouseup', onMouseUp, { capture: true });

    onCleanup(() => {
      el.removeEventListener('mousedown', onMouseDown, { capture: true });
      window.removeEventListener('mousemove', onMouseMove, { capture: true });
      window.removeEventListener('mouseup', onMouseUp, { capture: true });
      if (mainChart) {
        mainChart.timeScale().unsubscribeVisibleLogicalRangeChange(handleVisibleRangeChange);
        mainChart.remove();
      }
    });
  };

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
      
      // Sync initial range
      if (mainChart) {
         const range = mainChart.timeScale().getVisibleLogicalRange();
         if (range) macdChart?.timeScale().setVisibleLogicalRange(range);
      }
    });

    // When MACD chart range changes (e.g. from resize fitContent), sync back to main just in case
    // But since panning/zooming is disabled on MACD, it's driven entirely by Main chart.
    
    onCleanup(() => {
      if (macdChart) macdChart.remove();
      macdChart = undefined;
    });
  };

  const buttonClass = (active: boolean) => 
    `px-3 py-1 text-xs font-bold rounded-full transition-colors border ${active ? 'bg-primary text-on-primary border-primary' : 'bg-surface text-foreground border-outline hover:bg-surface-variant'}`;

  return (
    <div class="w-full flex flex-col gap-2 relative select-none">
      
      {/* Indicator Toolbar */}
      <div class="flex gap-2 items-center px-1">
        <span class="text-xs font-bold text-muted mr-1">Indicators:</span>
        <button class={buttonClass(showSMA())} onClick={() => setShowSMA(!showSMA())}>SMA 20</button>
        <button class={buttonClass(showEMA())} onClick={() => setShowEMA(!showEMA())}>EMA 50</button>
        <button class={buttonClass(showBB())} onClick={() => setShowBB(!showBB())}>Bollinger Bands</button>
        <button class={buttonClass(showMACD())} onClick={() => setShowMACD(!showMACD())}>MACD</button>
      </div>

      <div class="w-full min-h-[400px] border border-outline-variant bg-surface p-1 relative">
        <div ref={initMainContainer} class="w-full h-full min-h-[400px]" />
        
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

      <Show when={showMACD()}>
        <div class="w-full h-[150px] border border-outline-variant bg-surface p-1 relative">
          <div ref={initMacdContainer} class="w-full h-full" />
        </div>
      </Show>
    </div>
  );
}

import { createMemo, createSignal } from 'solid-js';
import { Text } from '../../../primitives/Text';
import { Table, Column } from '../../../primitives/Table';
import type { FullValuationReport, HistoryBar } from '../../../types/events';

interface TickerStrategySimulatorProps {
  fullReport: () => FullValuationReport | null;
}

interface TradeLog {
  date: string;
  type: 'BUY' | 'SELL';
  price: number;
  shares: number;
  reason: string;
  cashRemaining: number;
}

interface SimulatorResults {
  totalReturnPerc: number;
  buyHoldReturnPerc: number;
  strategyDrawdown: number;
  buyHoldDrawdown: number;
  trades: number;
  logs: TradeLog[];
}

export function TickerStrategySimulator(props: TickerStrategySimulatorProps) {

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(value);
  };

  const [triggerLossPerc, setTriggerLossPerc] = createSignal(7);
  const [maxLossPerc, setMaxLossPerc] = createSignal(25);
  const [lookbackMonths, setLookbackMonths] = createSignal(3);

  const [strategyType, setStrategyType] = createSignal<'STATIC' | 'ATR' | 'RSI' | 'MACD'>('STATIC');
  const [atrTslMult, setAtrTslMult] = createSignal(2.5);
  const [atrMaxLossMult, setAtrMaxLossMult] = createSignal(6.0);
  const [rsiOversold, setRsiOversold] = createSignal(30);
  const [rsiOverbought, setRsiOverbought] = createSignal(70);

  const calculateAtrArray = (history: HistoryBar[], period = 14) => {
    const atrArray: number[] = new Array(history.length).fill(0);
    if (history.length === 0) return atrArray;

    const trArray: number[] = new Array(history.length).fill(0);
    trArray[0] = history[0].high - history[0].low;

    for (let i = 1; i < history.length; i++) {
      const high = history[i].high;
      const low = history[i].low;
      const prevClose = history[i - 1].close;
      trArray[i] = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
    }

    let sumTr = 0;
    for (let i = 0; i < Math.min(period, history.length); i++) {
      sumTr += trArray[i];
      atrArray[i] = sumTr / (i + 1);
    }

    for (let i = period; i < history.length; i++) {
      atrArray[i] = (atrArray[i - 1] * (period - 1) + trArray[i]) / period;
    }

    return atrArray;
  };

  const calculateRSI = (history: HistoryBar[], period = 14) => {
    const rsiArray = new Array(history.length).fill(0);
    if (history.length <= period) return rsiArray;

    let avgGain = 0;
    let avgLoss = 0;

    for (let i = 1; i <= period; i++) {
      const diff = history[i].close - history[i - 1].close;
      if (diff >= 0) avgGain += diff;
      else avgLoss -= diff;
    }

    avgGain /= period;
    avgLoss /= period;

    let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsiArray[period] = avgLoss === 0 ? 100 : 100 - (100 / (1 + rs));

    for (let i = period + 1; i < history.length; i++) {
      const diff = history[i].close - history[i - 1].close;
      const gain = diff >= 0 ? diff : 0;
      const loss = diff < 0 ? -diff : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;

      rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsiArray[i] = avgLoss === 0 ? 100 : 100 - (100 / (1 + rs));
    }

    return rsiArray;
  };

  const calculateMACD = (history: HistoryBar[], shortPeriod = 12, longPeriod = 26, signalPeriod = 9) => {
    const macdArray = new Array(history.length).fill({ macdLine: 0, signalLine: 0, histogram: 0 });
    if (history.length <= longPeriod) return macdArray;

    const calcEMA = (data: number[], period: number) => {
      const ema = new Array(data.length).fill(0);
      let sum = 0;
      for (let i = 0; i < period; i++) sum += data[i];
      ema[period - 1] = sum / period;
      const multiplier = 2 / (period + 1);
      for (let i = period; i < data.length; i++) {
        ema[i] = (data[i] - ema[i - 1]) * multiplier + ema[i - 1];
      }
      return ema;
    };

    const closePrices = history.map(b => b.close);
    const shortEMA = calcEMA(closePrices, shortPeriod);
    const longEMA = calcEMA(closePrices, longPeriod);

    const macdLine = new Array(history.length).fill(0);
    for (let i = longPeriod - 1; i < history.length; i++) {
      macdLine[i] = shortEMA[i] - longEMA[i];
    }

    const validMacdLine = macdLine.slice(longPeriod - 1);
    const signalLineRaw = calcEMA(validMacdLine, signalPeriod);
    const signalLine = new Array(history.length).fill(0);
    for (let i = 0; i < signalLineRaw.length; i++) {
      signalLine[i + longPeriod - 1] = signalLineRaw[i];
    }

    for (let i = 0; i < history.length; i++) {
      macdArray[i] = {
        macdLine: macdLine[i],
        signalLine: signalLine[i],
        histogram: macdLine[i] - signalLine[i]
      };
    }

    return macdArray;
  };

  const results = createMemo<SimulatorResults | null>(() => {
    const report = props.fullReport();
    if (!report || !report.history || report.history.length === 0) return null;

    const history = report.history;
    const initialPrice = history[0].close;
    const finalPrice = history[history.length - 1].close;

    // --- Buy & Hold Baseline ---
    const bhShares = 100000 / initialPrice;
    const bhFinalValue = bhShares * finalPrice;
    const bhReturnPerc = ((bhFinalValue - 100000) / 100000) * 100;
    
    let bhMaxDrawdown = 0;
    let bhPeak = initialPrice;
    for (const b of history) {
      if (b.high > bhPeak) bhPeak = b.high;
      const dd = (bhPeak - b.low) / bhPeak;
      if (dd > bhMaxDrawdown) bhMaxDrawdown = dd;
    }

    // --- Strategy Simulation ---
    const stType = strategyType();
    const atrArray = calculateAtrArray(history);
    const rsiArray = calculateRSI(history);
    const macdArray = calculateMACD(history);

    const tl = triggerLossPerc() / 100;
    const ml = maxLossPerc() / 100;
    const dropZone = ml - tl;
    const step = dropZone / 4;
    const t1Trigger = tl + step * 1;
    const t2Trigger = tl + step * 2;
    const t3Trigger = tl + step * 3;
    const t4Trigger = ml;
    const lbDays = lookbackMonths() * 21; // ~21 trading days per month

    let cash = 100000;
    let coreShares = 0;
    let tradeShares = 0;
    let investedPeak = initialPrice;
    let averagingAnchorPeak = initialPrice;
    let atrAtSell = 0;
    let state: 'INVESTED' | 'SIDELINES' | 'TRANCHE_1' | 'TRANCHE_2' | 'TRANCHE_3' = 'INVESTED';
    let tradesCount = 0;
    let originalSidelinedCash = 0;
    const logs: TradeLog[] = [];

    // Day 1 Deployment
    const totalShares = cash / initialPrice;
    coreShares = totalShares * 0.20;
    tradeShares = totalShares * 0.80;
    cash = 0;
    
    logs.push({
      date: history[0].date,
      type: 'BUY',
      price: initialPrice,
      shares: totalShares,
      reason: 'Initial Deployment',
      cashRemaining: cash
    });
    tradesCount++;

    let stratMaxDrawdown = 0;
    let stratPeakPortfolioValue = 100000;

    for (let i = 1; i < history.length; i++) {
      const b = history[i];
      const currentPortfolioValue = cash + ((coreShares + tradeShares) * b.close);
      
      if (currentPortfolioValue > stratPeakPortfolioValue) {
        stratPeakPortfolioValue = currentPortfolioValue;
      }
      const dd = (stratPeakPortfolioValue - currentPortfolioValue) / stratPeakPortfolioValue;
      if (dd > stratMaxDrawdown) {
        stratMaxDrawdown = dd;
      }

      const currentPrice = b.close;

      if (stType === 'RSI') {
        if (state === 'INVESTED' && rsiArray[i] > rsiOverbought()) {
          cash += tradeShares * currentPrice;
          logs.push({ date: b.date, type: 'SELL', price: currentPrice, shares: tradeShares, reason: `RSI Overbought (${rsiArray[i].toFixed(1)})`, cashRemaining: cash });
          tradeShares = 0;
          state = 'SIDELINES';
          tradesCount++;
        } else if (state === 'SIDELINES' && rsiArray[i] < rsiOversold()) {
          const sharesBought = cash / currentPrice;
          tradeShares += sharesBought;
          cash = 0;
          logs.push({ date: b.date, type: 'BUY', price: currentPrice, shares: sharesBought, reason: `RSI Oversold (${rsiArray[i].toFixed(1)})`, cashRemaining: cash });
          tradesCount++;
          state = 'INVESTED';
        }
        continue;
      }

      if (stType === 'MACD') {
        const prevMacd = i > 0 ? macdArray[i-1] : macdArray[i];
        const currMacd = macdArray[i];
        
        const isBullCross = prevMacd.macdLine <= prevMacd.signalLine && currMacd.macdLine > currMacd.signalLine;
        const isBearCross = prevMacd.macdLine >= prevMacd.signalLine && currMacd.macdLine < currMacd.signalLine;

        if (state === 'INVESTED' && isBearCross) {
          cash += tradeShares * currentPrice;
          logs.push({ date: b.date, type: 'SELL', price: currentPrice, shares: tradeShares, reason: `MACD Bear Cross`, cashRemaining: cash });
          tradeShares = 0;
          state = 'SIDELINES';
          tradesCount++;
        } else if (state === 'SIDELINES' && isBullCross) {
          const sharesBought = cash / currentPrice;
          tradeShares += sharesBought;
          cash = 0;
          logs.push({ date: b.date, type: 'BUY', price: currentPrice, shares: sharesBought, reason: `MACD Bull Cross`, cashRemaining: cash });
          tradesCount++;
          state = 'INVESTED';
        }
        continue;
      }

      // Calculate Rolling Peak for Breakout (STATIC & ATR ONLY)
      let yesterdayRollingPeak = history[0].high;
      if (i > 0) {
        yesterdayRollingPeak = history[i-1].high;
        const sIdx = Math.max(0, (i - 1) - lbDays);
        for (let j = sIdx; j <= i - 1; j++) {
          if (history[j].high > yesterdayRollingPeak) yesterdayRollingPeak = history[j].high;
        }
      }

      if (b.high > investedPeak) {
        investedPeak = b.high;
      }

      if (state === 'INVESTED') {
        // Exit Rule: Trailing Stop Loss
        let tslPrice = 0;
        if (stType === 'STATIC') {
          tslPrice = investedPeak * (1 - tl);
        } else {
          tslPrice = Math.max(0.01, investedPeak - (atrArray[i] * atrTslMult()));
        }

        if (currentPrice < tslPrice && tradeShares > 0) {
          cash += tradeShares * currentPrice;
          originalSidelinedCash = cash;
          averagingAnchorPeak = investedPeak; // Lock in the exact peak that triggered the sell
          atrAtSell = atrArray[i]; // Lock in ATR for scaling out
          logs.push({
            date: b.date,
            type: 'SELL',
            price: currentPrice,
            shares: tradeShares,
            reason: stType === 'STATIC' ? `${triggerLossPerc()}% TSL Triggered` : `${atrTslMult().toFixed(1)}x ATR TSL Triggered`,
            cashRemaining: cash
          });
          tradeShares = 0;
          state = 'SIDELINES';
          tradesCount++;
        }
      } else {
        // We are on the sidelines (or partially deployed)
        // Re-Entry A: Momentum Breakout (New High) - Compare against YESTERDAY'S rolling peak!
        if (currentPrice > yesterdayRollingPeak) {
          if (cash > 0) {
            const sharesBought = cash / currentPrice;
            tradeShares += sharesBought;
            cash = 0;
            logs.push({
              date: b.date,
              type: 'BUY',
              price: currentPrice,
              shares: sharesBought,
              reason: `Breakout (${lookbackMonths()}M Peak)`,
              cashRemaining: cash
            });
            tradesCount++;
          }
          investedPeak = currentPrice;
          state = 'INVESTED';
        } else {
          // Re-Entry Averaging Down (Anchored to the TSL peak, NOT the rolling peak)
          let p1 = 0, p2 = 0, p3 = 0, p4 = 0;
          let maxLossLabel = '';

          if (stType === 'STATIC') {
            p1 = averagingAnchorPeak * (1 - t1Trigger);
            p2 = averagingAnchorPeak * (1 - t2Trigger);
            p3 = averagingAnchorPeak * (1 - t3Trigger);
            p4 = averagingAnchorPeak * (1 - t4Trigger);
            maxLossLabel = `${maxLossPerc()}%`;
          } else {
            const dropZoneAbs = atrAtSell * (atrMaxLossMult() - atrTslMult());
            const stepAbs = dropZoneAbs / 4;
            p1 = Math.max(0.01, averagingAnchorPeak - (atrAtSell * atrTslMult() + stepAbs * 1));
            p2 = Math.max(0.01, averagingAnchorPeak - (atrAtSell * atrTslMult() + stepAbs * 2));
            p3 = Math.max(0.01, averagingAnchorPeak - (atrAtSell * atrTslMult() + stepAbs * 3));
            p4 = Math.max(0.01, averagingAnchorPeak - (atrAtSell * atrMaxLossMult()));
            maxLossLabel = `${atrMaxLossMult().toFixed(1)}x ATR`;
          }

          if (currentPrice < p4 && cash > 0) {
            const sharesBought = cash / currentPrice;
            tradeShares += sharesBought;
            cash = 0;
            logs.push({ date: b.date, type: 'BUY', price: currentPrice, shares: sharesBought, reason: `Max Loss (${maxLossLabel}) Reached`, cashRemaining: cash });
            tradesCount++;
            investedPeak = currentPrice;
            state = 'INVESTED';
          } else if (currentPrice < p3 && ['SIDELINES', 'TRANCHE_1', 'TRANCHE_2'].includes(state)) {
            const mult = state === 'SIDELINES' ? 3 : state === 'TRANCHE_1' ? 2 : 1;
            const cashToDeploy = Math.min(cash, originalSidelinedCash * 0.25 * mult);
            const sharesBought = cashToDeploy / currentPrice;
            tradeShares += sharesBought;
            cash -= cashToDeploy;
            const label = stType === 'STATIC' ? `-${(t3Trigger*100).toFixed(1)}%` : `-${(atrTslMult() + (atrMaxLossMult()-atrTslMult())*0.75).toFixed(1)}x ATR`;
            logs.push({ date: b.date, type: 'BUY', price: currentPrice, shares: sharesBought, reason: `Averaging Down (${label})`, cashRemaining: cash });
            tradesCount++;
            state = 'TRANCHE_3';
          } else if (currentPrice < p2 && ['SIDELINES', 'TRANCHE_1'].includes(state)) {
            const mult = state === 'SIDELINES' ? 2 : 1;
            const cashToDeploy = Math.min(cash, originalSidelinedCash * 0.25 * mult);
            const sharesBought = cashToDeploy / currentPrice;
            tradeShares += sharesBought;
            cash -= cashToDeploy;
            const label = stType === 'STATIC' ? `-${(t2Trigger*100).toFixed(1)}%` : `-${(atrTslMult() + (atrMaxLossMult()-atrTslMult())*0.5).toFixed(1)}x ATR`;
            logs.push({ date: b.date, type: 'BUY', price: currentPrice, shares: sharesBought, reason: `Averaging Down (${label})`, cashRemaining: cash });
            tradesCount++;
            state = 'TRANCHE_2';
          } else if (currentPrice < p1 && state === 'SIDELINES') {
            const cashToDeploy = Math.min(cash, originalSidelinedCash * 0.25);
            const sharesBought = cashToDeploy / currentPrice;
            tradeShares += sharesBought;
            cash -= cashToDeploy;
            const label = stType === 'STATIC' ? `-${(t1Trigger*100).toFixed(1)}%` : `-${(atrTslMult() + (atrMaxLossMult()-atrTslMult())*0.25).toFixed(1)}x ATR`;
            logs.push({ date: b.date, type: 'BUY', price: currentPrice, shares: sharesBought, reason: `Averaging Down (${label})`, cashRemaining: cash });
            tradesCount++;
            state = 'TRANCHE_1';
          }
        }
      }
    }

    const finalPortfolioValue = cash + ((coreShares + tradeShares) * finalPrice);
    const stratReturnPerc = ((finalPortfolioValue - 100000) / 100000) * 100;

    return {
      totalReturnPerc: stratReturnPerc,
      buyHoldReturnPerc: bhReturnPerc,
      strategyDrawdown: stratMaxDrawdown * 100,
      buyHoldDrawdown: bhMaxDrawdown * 100,
      trades: tradesCount,
      logs: logs.reverse() // Newest first
    };
  });

  const columns: Column<TradeLog>[] = [
    {
      header: 'Date',
      accessor: 'date',
      cell: (row) => <span class="text-on-surface-variant">{row.date}</span>
    },
    {
      header: 'Action',
      accessor: 'type',
      cell: (row) => (
        <span class={`font-bold text-[11px] px-2 py-0.5 rounded ${row.type === 'BUY' ? 'bg-positive-green/20 text-positive-green' : 'bg-critical-red/20 text-critical-red'}`}>
          {row.type}
        </span>
      )
    },
    {
      header: 'Price',
      align: 'right',
      cell: (row) => <span class="font-medium">{formatCurrency(row.price)}</span>
    },
    {
      header: 'Trigger Reason',
      accessor: 'reason',
      cell: (row) => <span class="text-sm">{row.reason}</span>
    }
  ];

  return (
    <div class="mt-8 mb-12">
      <div class="flex items-center justify-between mb-4">
        <Text variant="h2" class="mb-0">STRATEGY SIMULATOR</Text>
        <select 
          class="bg-surface-variant text-on-surface text-[11px] font-bold px-3 py-1.5 rounded-full border border-outline focus:outline-none focus:border-primary cursor-pointer"
          value={strategyType()}
          onChange={(e) => setStrategyType(e.currentTarget.value as any)}
        >
          <option value="STATIC">STATIC SCALING</option>
          <option value="ATR">DYNAMIC ATR SCALING</option>
          <option value="RSI">RSI MEAN REVERSION</option>
          <option value="MACD">MACD MOMENTUM</option>
        </select>
      </div>

      <div class="p-5 mb-6 rounded-xl border border-outline bg-surface-container-low flex flex-col md:flex-row gap-8">
        
        {strategyType() === 'STATIC' && (
          <>
            <div class="flex-1">
              <div class="flex justify-between mb-2">
                <Text variant="body" class="font-bold text-on-surface">Trigger Loss (TSL)</Text>
                <span class="text-sm font-bold text-critical-red">-{triggerLossPerc()}%</span>
              </div>
              <input 
                type="range" 
                min="2" max="25" step="1" 
                value={triggerLossPerc()} 
                onInput={(e) => {
                  const val = parseInt(e.currentTarget.value);
                  setTriggerLossPerc(val);
                  if (val >= maxLossPerc()) setMaxLossPerc(val + 5);
                }}
                class="w-full accent-primary"
              />
              <Text variant="muted" class="text-xs mt-1">Sells 80% trade volume at this drop.</Text>
            </div>
            
            <div class="flex-1">
              <div class="flex justify-between mb-2">
                <Text variant="body" class="font-bold text-on-surface">Max Expected Loss</Text>
                <span class="text-sm font-bold text-on-surface">-{maxLossPerc()}%</span>
              </div>
              <input 
                type="range" 
                min="10" max="60" step="1" 
                value={maxLossPerc()} 
                onInput={(e) => {
                  const val = parseInt(e.currentTarget.value);
                  setMaxLossPerc(val);
                  if (val <= triggerLossPerc()) setTriggerLossPerc(val - 5 > 0 ? val - 5 : 2);
                }}
                class="w-full accent-primary"
              />
              <Text variant="muted" class="text-xs mt-1">Fully deployed again if it drops this low.</Text>
            </div>
          </>
        )}

        {strategyType() === 'ATR' && (
          <>
            <div class="flex-1">
              <div class="flex justify-between mb-2">
                <Text variant="body" class="font-bold text-on-surface">ATR TSL Multiplier</Text>
                <span class="text-sm font-bold text-critical-red">{atrTslMult().toFixed(1)}x</span>
              </div>
              <input 
                type="range" 
                min="1.0" max="8.0" step="0.1" 
                value={atrTslMult()} 
                onInput={(e) => {
                  const val = parseFloat(e.currentTarget.value);
                  setAtrTslMult(val);
                  if (val >= atrMaxLossMult()) setAtrMaxLossMult(val + 1.0);
                }}
                class="w-full accent-primary"
              />
              <Text variant="muted" class="text-xs mt-1">Volatility-adjusted trailing stop loss.</Text>
            </div>
            
            <div class="flex-1">
              <div class="flex justify-between mb-2">
                <Text variant="body" class="font-bold text-on-surface">Max Loss ATR Multiplier</Text>
                <span class="text-sm font-bold text-on-surface">{atrMaxLossMult().toFixed(1)}x</span>
              </div>
              <input 
                type="range" 
                min="3.0" max="15.0" step="0.5" 
                value={atrMaxLossMult()} 
                onInput={(e) => {
                  const val = parseFloat(e.currentTarget.value);
                  setAtrMaxLossMult(val);
                  if (val <= atrTslMult()) setAtrTslMult(val - 1.0 > 1.0 ? val - 1.0 : 1.0);
                }}
                class="w-full accent-primary"
              />
              <Text variant="muted" class="text-xs mt-1">Fully deployed again if drop is this severe.</Text>
            </div>
          </>
        )}

        {strategyType() === 'RSI' && (
          <>
            <div class="flex-1">
              <div class="flex justify-between mb-2">
                <Text variant="body" class="font-bold text-on-surface">Oversold Threshold (Buy)</Text>
                <span class="text-sm font-bold text-secondary">{rsiOversold()}</span>
              </div>
              <input 
                type="range" 
                min="10" max="50" step="1" 
                value={rsiOversold()} 
                onInput={(e) => {
                  const val = parseInt(e.currentTarget.value);
                  setRsiOversold(val);
                  if (val >= rsiOverbought()) setRsiOverbought(val + 10);
                }}
                class="w-full accent-primary"
              />
              <Text variant="muted" class="text-xs mt-1">Buys 100% when RSI drops below this.</Text>
            </div>
            
            <div class="flex-1">
              <div class="flex justify-between mb-2">
                <Text variant="body" class="font-bold text-on-surface">Overbought Threshold (Sell)</Text>
                <span class="text-sm font-bold text-critical-red">{rsiOverbought()}</span>
              </div>
              <input 
                type="range" 
                min="50" max="90" step="1" 
                value={rsiOverbought()} 
                onInput={(e) => {
                  const val = parseInt(e.currentTarget.value);
                  setRsiOverbought(val);
                  if (val <= rsiOversold()) setRsiOversold(val - 10 > 10 ? val - 10 : 10);
                }}
                class="w-full accent-primary"
              />
              <Text variant="muted" class="text-xs mt-1">Sells 100% when RSI crosses above this.</Text>
            </div>
          </>
        )}

        {strategyType() === 'MACD' && (
          <div class="flex-1 flex items-center justify-center py-4 text-center border border-outline rounded-lg bg-surface/50">
            <div>
              <Text variant="body" class="font-bold text-on-surface mb-1">Standard MACD (12, 26, 9)</Text>
              <Text variant="muted" class="text-xs">Buys on Bull Cross. Sells on Bear Cross. Fully automated.</Text>
            </div>
          </div>
        )}

        {['STATIC', 'ATR'].includes(strategyType()) && (
          <div class="flex-1">
            <div class="flex justify-between mb-2">
              <Text variant="body" class="font-bold text-on-surface">Breakout Lookback</Text>
              <span class="text-sm font-bold text-on-surface">{lookbackMonths()} Months</span>
            </div>
            <input 
              type="range" 
              min="1" max="12" step="1" 
              value={lookbackMonths()} 
              onInput={(e) => setLookbackMonths(parseInt(e.currentTarget.value))}
              class="w-full accent-primary"
            />
            <Text variant="muted" class="text-xs mt-1">Months to track for breakout peak.</Text>
          </div>
        )}
      </div>

      {results() && (
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div class="lg:col-span-1 flex flex-col gap-4">
            <div class="p-5 rounded-xl border border-outline bg-surface-container-low">
              <Text variant="muted" class="mb-1 text-xs font-bold tracking-wider">STRATEGY RETURN</Text>
              <div class="flex items-end gap-2">
                <Text variant="h1" class={results()!.totalReturnPerc >= 0 ? 'text-positive-green' : 'text-critical-red'}>
                  {results()!.totalReturnPerc >= 0 ? '+' : ''}{results()!.totalReturnPerc.toFixed(1)}%
                </Text>
              </div>
              <Text variant="muted" class="mt-2 text-xs">
                Buy & Hold Return: <span class="font-medium text-on-surface">{results()!.buyHoldReturnPerc.toFixed(1)}%</span>
              </Text>
            </div>

            <div class="p-5 rounded-xl border border-outline bg-surface-container-low">
              <Text variant="muted" class="mb-1 text-xs font-bold tracking-wider">MAX DRAWDOWN (RISK)</Text>
              <div class="flex items-end gap-2">
                <Text variant="h2" class="text-critical-red">
                  -{results()!.strategyDrawdown.toFixed(1)}%
                </Text>
              </div>
              <Text variant="muted" class="mt-2 text-xs">
                Buy & Hold Drawdown: <span class="font-medium text-on-surface">-{results()!.buyHoldDrawdown.toFixed(1)}%</span>
              </Text>
            </div>
            
            <div class="p-5 rounded-xl border border-outline bg-surface-container-low">
              <Text variant="muted" class="mb-1 text-xs font-bold tracking-wider">TRADE COUNTER</Text>
              <div class="flex items-end gap-2">
                <Text variant="h2" class="text-on-surface">
                  {results()!.trades} Trades
                </Text>
              </div>
              <Text variant="muted" class="mt-2 text-xs">
                Over 5-Year History
              </Text>
            </div>
          </div>

          <div class="lg:col-span-2">
            <div class="h-full border border-outline rounded-xl overflow-hidden bg-surface-container-low flex flex-col">
              <div class="p-4 border-b border-outline bg-surface-container">
                <Text variant="body" class="font-bold text-on-surface">Execution Log</Text>
              </div>
              <div class="flex-1 overflow-auto max-h-[300px]">
                <Table data={results()!.logs} columns={columns} />
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

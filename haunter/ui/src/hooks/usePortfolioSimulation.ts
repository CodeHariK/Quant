import { createSignal, createEffect } from 'solid-js';
import { fetchValuationReport, Portfolio } from '../api/stockApi';
import type { HistoryBar } from '../types/events';

export interface EquityPoint {
  time: string;
  value: number;
  invested: number;
}

export interface StockSummary {
  symbol: string;
  initialQuantity: number;
  sipAmount: number;
  totalInvested: number;
  currentValue: number;
  currentQty: number;
  lumpsumReturn: number;
}

export type SimulationMode = 'MANUAL' | 'HOLDING_LUMPSUM' | 'TRADEBOOK_EXACT';

export function usePortfolioSimulation(
  portfolio: () => Portfolio | undefined,
  timeframe: () => '1Y' | '5Y' | 'MAX',
  mode: () => SimulationMode = () => 'MANUAL'
) {
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  
  const [equityCurve, setEquityCurve] = createSignal<EquityPoint[]>([]);
  const [stockCurves, setStockCurves] = createSignal<Record<string, {time: string, value: number}[]>>({});
  const [stockBreakdown, setStockBreakdown] = createSignal<StockSummary[]>([]);
  
  const [totalInvested, setTotalInvested] = createSignal(0);
  const [currentValue, setCurrentValue] = createSignal(0);

  createEffect(() => [portfolio(), timeframe(), mode()] as const, ([p, tf, simMode]) => {
    if (!p || !p.stocks || p.stocks.length === 0) {
      setTotalInvested(0);
      setCurrentValue(0);
      setEquityCurve([]);
      setStockBreakdown([]);
      return;
    }

    setLoading(true);
    setError(null);

    Promise.all(
      p.stocks.map(async (stock) => {
        try {
          const report = await fetchValuationReport(stock.symbol, false);
          return { stock, history: report.history };
        } catch (e) {
          console.error(`Failed to fetch history for ${stock.symbol}`, e);
          return { stock, history: [] as HistoryBar[] };
        }
      })
    ).then((results) => {
      // 1. Gather all unique dates across all stocks
      const dateSet = new Set<string>();
      results.forEach(res => {
        res.history.forEach(bar => dateSet.add(bar.date));
      });
      const allDates = Array.from(dateSet).sort();

      // 2. Filter dates by timeframe
      let filteredDates = allDates;
      if (tf === '1Y') {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0];
        filteredDates = allDates.filter(d => d >= oneYearAgoStr);
      } else if (tf === '5Y') {
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
        const fiveYearsAgoStr = fiveYearsAgo.toISOString().split('T')[0];
        filteredDates = allDates.filter(d => d >= fiveYearsAgoStr);
      }

      if (filteredDates.length === 0) {
        setLoading(false);
        return;
      }

      // 3. Create price maps
      const priceMaps: Record<string, Map<string, number>> = {};
      results.forEach(res => {
        const map = new Map<string, number>();
        res.history.forEach(bar => map.set(bar.date, bar.close));
        priceMaps[res.stock.symbol] = map;
      });

      // 4. Simulate
      const curve: EquityPoint[] = [];
      const stockCurvesRaw: Record<string, {time: string, value: number}[]> = {};
      const currentQty: Record<string, number> = {};
      const lastKnownPrice: Record<string, number> = {};
      const stockInvested: Record<string, number> = {};
      
      // Calculate Weighted SIP amounts for Kite
      const GLOBAL_SIP_AMOUNT = 10000;
      const stockWeightedSip: Record<string, number> = {};
      if (p.isKite) {
        let totalPortfolioCurrentValue = 0;
        const stockCurrentValues: Record<string, number> = {};
        results.forEach(res => {
          const sym = res.stock.symbol;
          const qty = res.stock.currentQuantity || 0;
          const history = res.history;
          const latestPrice = history.length > 0 ? history[history.length - 1].close : 0;
          const val = qty * latestPrice;
          stockCurrentValues[sym] = val;
          totalPortfolioCurrentValue += val;
        });

        if (totalPortfolioCurrentValue > 0) {
          results.forEach(res => {
            const sym = res.stock.symbol;
            const weight = stockCurrentValues[sym] / totalPortfolioCurrentValue;
            stockWeightedSip[sym] = GLOBAL_SIP_AMOUNT * weight;
          });
        }
      }
      let lastMonthStr = "";
      let runningInvested = 0;

      const isTradebookExact = simMode === 'TRADEBOOK_EXACT';
      
      // Trade mapping for Kite
      const tradesByDate: Record<string, any[]> = {};
      const priorTradeQty: Record<string, number> = {};
      const priorTradeInvested: Record<string, number> = {};

      if (isTradebookExact && p.tradeHistory) {
        p.tradeHistory.forEach(trade => {
          const date = trade.tradeTimestamp.split('T')[0];
          const sym = trade.tradingsymbol.endsWith('.NS') ? trade.tradingsymbol : `${trade.tradingsymbol}.NS`;

          if (date < filteredDates[0]) {
             if (!priorTradeQty[sym]) priorTradeQty[sym] = 0;
             if (!priorTradeInvested[sym]) priorTradeInvested[sym] = 0;
             if (trade.transactionType === 'BUY') {
                priorTradeQty[sym] += trade.quantity;
                priorTradeInvested[sym] += (trade.quantity * trade.averagePrice);
             } else if (trade.transactionType === 'SELL') {
                priorTradeQty[sym] = Math.max(0, priorTradeQty[sym] - trade.quantity);
                priorTradeInvested[sym] = Math.max(0, priorTradeInvested[sym] - (trade.quantity * trade.averagePrice));
             }
          } else {
             if (!tradesByDate[date]) tradesByDate[date] = [];
             tradesByDate[date].push(trade);
          }
        });
      }

      // Initialize based on period start
      results.forEach(res => {
        const sym = res.stock.symbol;
        if (isTradebookExact) {
            currentQty[sym] = priorTradeQty[sym] || 0;
            stockInvested[sym] = priorTradeInvested[sym] || 0;
        } else {
            currentQty[sym] = res.stock.initialQuantity;
            const firstPrice = priceMaps[sym].get(filteredDates[0]) || 0;
            stockInvested[sym] = res.stock.initialQuantity * firstPrice;
        }
        lastKnownPrice[sym] = 0;
        stockCurvesRaw[sym] = [];
      });

      filteredDates.forEach(date => {
        const monthStr = date.substring(0, 7);
        const isNewMonth = monthStr !== lastMonthStr;
        lastMonthStr = monthStr;

        let dailyPortfolioValue = 0;

        // Process Kite trades for today BEFORE calculating value
        if (isTradebookExact && tradesByDate[date]) {
          tradesByDate[date].forEach(trade => {
            const sym = trade.tradingsymbol.endsWith('.NS') ? trade.tradingsymbol : `${trade.tradingsymbol}.NS`;
            if (currentQty[sym] !== undefined) {
              if (trade.transactionType === 'BUY') {
                currentQty[sym] += trade.quantity;
                stockInvested[sym] += (trade.quantity * trade.averagePrice);
              } else if (trade.transactionType === 'SELL') {
                currentQty[sym] = Math.max(0, currentQty[sym] - trade.quantity);
                stockInvested[sym] = Math.max(0, stockInvested[sym] - (trade.quantity * trade.averagePrice));
              }
            }
          });
        }

        results.forEach(res => {
          const sym = res.stock.symbol;
          const priceToday = priceMaps[sym].get(date);
          
          if (priceToday !== undefined) {
             lastKnownPrice[sym] = priceToday;
          }

          if (simMode === 'MANUAL' && isNewMonth && lastKnownPrice[sym] > 0) {
            let sipAmt = res.stock.sipAmount;
            if (p.isKite && stockWeightedSip[sym] !== undefined) {
               sipAmt = stockWeightedSip[sym];
            }
            if (sipAmt > 0) {
               const sharesBought = sipAmt / lastKnownPrice[sym];
               currentQty[sym] += sharesBought;
               stockInvested[sym] += sipAmt;
               runningInvested += sipAmt;
            }
          }

          const dailyStockValue = currentQty[sym] * lastKnownPrice[sym];
          dailyPortfolioValue += dailyStockValue;
          
          stockCurvesRaw[sym].push({ time: date, value: dailyStockValue });
        });

        curve.push({
          time: date,
          value: dailyPortfolioValue,
          invested: Object.values(stockInvested).reduce((a, b) => a + b, 0),
        });
      });

      // Calculate final breakdown
      const breakdown: StockSummary[] = results.map(res => {
        const sym = res.stock.symbol;
        const firstPrice = priceMaps[sym].get(filteredDates[0]) || 0;
        const lastPrice = lastKnownPrice[sym] || 0;
        const lumpsumReturn = firstPrice > 0 ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0;
        
        let displaySip = res.stock.sipAmount;
        if (p.isKite && stockWeightedSip[sym] !== undefined && simMode === 'MANUAL') {
          displaySip = stockWeightedSip[sym];
        }

        return {
          symbol: sym,
          initialQuantity: res.stock.initialQuantity,
          sipAmount: displaySip,
          totalInvested: stockInvested[sym],
          currentValue: currentQty[sym] * lastKnownPrice[sym],
          currentQty: currentQty[sym],
          lumpsumReturn,
        };
      });

      setEquityCurve(curve);
      setStockCurves(stockCurvesRaw);
      setStockBreakdown(breakdown);
      
      const finalInvested = curve.length > 0 ? curve[curve.length - 1].invested : 0;
      const finalValue = curve.length > 0 ? curve[curve.length - 1].value : 0;
      
      setTotalInvested(finalInvested);
      setCurrentValue(finalValue);
      setLoading(false);
    });
  });

  return {
    loading,
    error,
    equityCurve,
    stockCurves,
    stockBreakdown,
    totalInvested,
    currentValue,
  };
}

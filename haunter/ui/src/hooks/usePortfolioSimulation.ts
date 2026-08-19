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
}

export function usePortfolioSimulation(
  portfolio: () => Portfolio | undefined,
  timeframe: () => '1Y' | '5Y' | 'MAX'
) {
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  
  const [equityCurve, setEquityCurve] = createSignal<EquityPoint[]>([]);
  const [stockBreakdown, setStockBreakdown] = createSignal<StockSummary[]>([]);
  
  const [totalInvested, setTotalInvested] = createSignal(0);
  const [currentValue, setCurrentValue] = createSignal(0);

  createEffect(() => [portfolio(), timeframe()] as const, ([p, tf]) => {
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
      const currentQty: Record<string, number> = {};
      const lastKnownPrice: Record<string, number> = {};
      const stockInvested: Record<string, number> = {};
      let lastMonthStr = "";
      let runningInvested = 0;

      // Initialize based on period start
      results.forEach(res => {
        currentQty[res.stock.symbol] = res.stock.initialQuantity;
        lastKnownPrice[res.stock.symbol] = 0;
        
        const firstPrice = priceMaps[res.stock.symbol].get(filteredDates[0]) || 0;
        stockInvested[res.stock.symbol] = res.stock.initialQuantity * firstPrice;
      });

      filteredDates.forEach(date => {
        const monthStr = date.substring(0, 7);
        const isNewMonth = monthStr !== lastMonthStr;
        lastMonthStr = monthStr;

        let dailyPortfolioValue = 0;

        results.forEach(res => {
          const sym = res.stock.symbol;
          const priceToday = priceMaps[sym].get(date);
          
          if (priceToday !== undefined) {
             lastKnownPrice[sym] = priceToday;
          }

          if (isNewMonth && res.stock.sipAmount > 0 && lastKnownPrice[sym] > 0) {
            const sharesBought = res.stock.sipAmount / lastKnownPrice[sym];
            currentQty[sym] += sharesBought;
            stockInvested[sym] += res.stock.sipAmount;
            runningInvested += res.stock.sipAmount;
          }

          dailyPortfolioValue += (currentQty[sym] * lastKnownPrice[sym]);
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
        return {
          symbol: sym,
          initialQuantity: res.stock.initialQuantity,
          sipAmount: res.stock.sipAmount,
          totalInvested: stockInvested[sym],
          currentValue: currentQty[sym] * lastKnownPrice[sym],
          currentQty: currentQty[sym],
        };
      });

      setEquityCurve(curve);
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
    stockBreakdown,
    totalInvested,
    currentValue,
  };
}

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
  targetWeight?: number;
  actualInvested?: number;
  actualPortfolioValue?: number;
  actualQty?: number;
  actualValue?: number;
}

export type SimulationMode = 'MANUAL' | 'HOLDING_LUMPSUM' | 'TRADEBOOK_EXACT';
export type ClusterMode = 'day' | 'week' | 'month';

export function usePortfolioSimulation(
  portfolio: () => Portfolio | undefined,
  timeframe: () => '1y' | '5y' | '10y' | 'max',
  mode: () => SimulationMode = () => 'MANUAL',
  sipDistribution: () => 'WEIGHTED' | 'EQUAL' | 'RETURN_WEIGHTED' = () => 'WEIGHTED',
  clusterBy: () => ClusterMode = () => 'week'
) {
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  
  const [equityCurve, setEquityCurve] = createSignal<EquityPoint[]>([]);
  const [stockCurves, setStockCurves] = createSignal<Record<string, {time: string, value: number}[]>>({});
  const [normalizedStockCurves, setNormalizedStockCurves] = createSignal<Record<string, {time: string, value: number}[]>>({});
  const [stockBreakdown, setStockBreakdown] = createSignal<StockSummary[]>([]);
  const [tradeMarkers, setTradeMarkers] = createSignal<any[]>([]);
  
  const [totalInvested, setTotalInvested] = createSignal(0);
  const [currentValue, setCurrentValue] = createSignal(0);

  createEffect(() => [portfolio(), timeframe(), mode(), sipDistribution(), clusterBy()] as const, ([p, tf, simMode, dist, cluster]) => {
    if (!p) {
      setTotalInvested(0);
      setCurrentValue(0);
      setEquityCurve([]);
      setStockBreakdown([]);
      return;
    }

    let stocksToFetch = p.stocks || [];
    
    // For TRADEBOOK_EXACT, we MUST fetch history for every stock ever traded, even if fully sold
    if (simMode === 'TRADEBOOK_EXACT' && p.tradeHistory) {
      const tradedSymbols = new Set(stocksToFetch.map(s => s.symbol));
      p.tradeHistory.forEach(t => {
        const sym = t.tradingsymbol.endsWith('.NS') ? t.tradingsymbol : `${t.tradingsymbol}.NS`;
        if (!tradedSymbols.has(sym)) {
          tradedSymbols.add(sym);
          stocksToFetch.push({ symbol: sym, initialQuantity: 0, sipAmount: 0, currentQuantity: 0 });
        }
      });
    }

    if (stocksToFetch.length === 0) {
      setTotalInvested(0);
      setCurrentValue(0);
      setEquityCurve([]);
      setStockBreakdown([]);
      return;
    }

    setLoading(true);
    setError(null);

    Promise.all(
      stocksToFetch.map(async (stock) => {
        try {
          const report = await fetchValuationReport(stock.symbol, false, tf);
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
      if (tf === '1y') {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0];
        filteredDates = allDates.filter(d => d >= oneYearAgoStr);
      } else if (tf === '5y') {
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
        const fiveYearsAgoStr = fiveYearsAgo.toISOString().split('T')[0];
        filteredDates = allDates.filter(d => d >= fiveYearsAgoStr);
      } else if (tf === '10y') {
        const tenYearsAgo = new Date();
        tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
        const tenYearsAgoStr = tenYearsAgo.toISOString().split('T')[0];
        filteredDates = allDates.filter(d => d >= tenYearsAgoStr);
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
      
      // Calculate Dynamic SIP amounts for Kite
      const GLOBAL_SIP_AMOUNT = 10000;
      const stockDynamicSip: Record<string, number> = {};
      if (p.isKite) {
        if (dist === 'EQUAL') {
          const activeStocks = results.filter(res => (res.stock.currentQuantity || res.stock.initialQuantity || 0) > 0);
          const numStocks = activeStocks.length;
          const equalAmount = numStocks > 0 ? GLOBAL_SIP_AMOUNT / numStocks : 0;
          activeStocks.forEach(res => {
             stockDynamicSip[res.stock.symbol] = equalAmount;
          });
        } else if (dist === 'RETURN_WEIGHTED') {
          const activeStocks = results.filter(res => (res.stock.currentQuantity || res.stock.initialQuantity || 0) > 0);
          
          let totalReturnScore = 0;
          const stockReturns: Record<string, number> = {};
          
          activeStocks.forEach(res => {
            const sym = res.stock.symbol;
            let firstPrice = 0;
            for (let i = 0; i < filteredDates.length; i++) {
               const p = priceMaps[sym]?.get(filteredDates[i]);
               if (p && p > 0) {
                  firstPrice = p;
                  break;
               }
            }
            const history = res.history;
            const lastPrice = history.length > 0 ? history[history.length - 1].close : 0;
            const lumpsumReturn = firstPrice > 0 ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0;
            
            // We use max(0, return) so negative returning stocks get 0 weight
            const score = Math.max(0, lumpsumReturn);
            stockReturns[sym] = score;
            totalReturnScore += score;
          });

          if (totalReturnScore > 0) {
            activeStocks.forEach(res => {
              const sym = res.stock.symbol;
              const weight = stockReturns[sym] / totalReturnScore;
              stockDynamicSip[sym] = GLOBAL_SIP_AMOUNT * weight;
            });
          } else {
            // Fallback to equal if no positive returns
            const numStocks = activeStocks.length;
            const equalAmount = numStocks > 0 ? GLOBAL_SIP_AMOUNT / numStocks : 0;
            activeStocks.forEach(res => {
               stockDynamicSip[res.stock.symbol] = equalAmount;
            });
          }
        } else {
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
              stockDynamicSip[sym] = GLOBAL_SIP_AMOUNT * weight;
            });
          }
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
                // If they sold, we reduce quantity
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
            // Pure forward reconstruction: start exactly from what they held at filteredDates[0]
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
            if (p.isKite && stockDynamicSip[sym] !== undefined) {
               sipAmt = stockDynamicSip[sym];
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

    let finalCurve = curve;
    const finalMarkers: any[] = [];
    
    if (isTradebookExact) {
      const getCluster = (dStr: string) => {
         if (cluster === 'day') return dStr;
         if (cluster === 'month') return dStr.substring(0, 7);
         
         const d = new Date(dStr);
         d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
         const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
         const weekNo = Math.ceil(( ( (d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
         return `${d.getUTCFullYear()}-W${weekNo}`;
      };

      const clusterPoints: EquityPoint[] = [];
      const clusterTrades: Record<string, { buy: number, sell: number, buyVal: number, sellVal: number }> = {};
      
      filteredDates.forEach((date, i) => {
         const currentCluster = getCluster(date);
         
         if (tradesByDate[date]) {
            tradesByDate[date].forEach(t => {
               const sym = t.tradingsymbol.endsWith('.NS') ? t.tradingsymbol : `${t.tradingsymbol}.NS`;
               if (!clusterTrades[sym]) clusterTrades[sym] = { buy: 0, sell: 0, buyVal: 0, sellVal: 0 };
               if (t.transactionType === 'BUY') {
                  clusterTrades[sym].buy += t.quantity;
                  clusterTrades[sym].buyVal += (t.quantity * t.averagePrice);
               } else if (t.transactionType === 'SELL') {
                  clusterTrades[sym].sell += t.quantity;
                  clusterTrades[sym].sellVal += (t.quantity * t.averagePrice);
               }
            });
         }
         
         const nextDate = filteredDates[i+1];
         const nextCluster = nextDate ? getCluster(nextDate) : null;
         
         if (currentCluster !== nextCluster) { // Last trading day of the cluster
            clusterPoints.push(curve[i]);
            
            const textLines: string[] = [];
            Object.keys(clusterTrades).forEach(sym => {
               const wt = clusterTrades[sym];
               const avgBuy = wt.buy > 0 ? (wt.buyVal / wt.buy) : 0;
               const avgSell = wt.sell > 0 ? (wt.sellVal / wt.sell) : 0;
               if (wt.buy > 0) textLines.push(`BUY ${sym.replace('.NS', '')}: ${wt.buy} @ ₹${avgBuy.toFixed(2)}`);
               if (wt.sell > 0) textLines.push(`SELL ${sym.replace('.NS', '')}: ${wt.sell} @ ₹${avgSell.toFixed(2)}`);
            });
            
            if (textLines.length > 0) {
                finalMarkers.push({
                   time: date,
                   position: 'aboveBar',
                   color: '#2196F3',
                   shape: 'circle',
                   text: textLines.join('\n')
                });
            }
            
            // Reset cluster trades for the next cluster
            Object.keys(clusterTrades).forEach(k => delete clusterTrades[k]);
         }
      });
      finalCurve = clusterPoints;
    }

      // Calculate final breakdown
      const breakdown: StockSummary[] = results.map(res => {
        const sym = res.stock.symbol;
        let firstPrice = 0;
        for (let i = 0; i < filteredDates.length; i++) {
           const p = priceMaps[sym]?.get(filteredDates[i]);
           if (p && p > 0) {
              firstPrice = p;
              break;
           }
        }
        const lastPrice = lastKnownPrice[sym] || 0;
        const lumpsumReturn = firstPrice > 0 ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0;
        
        let displaySip = res.stock.sipAmount;
        if (p.isKite && stockDynamicSip[sym] !== undefined && simMode === 'MANUAL') {
          displaySip = stockDynamicSip[sym];
        }

        const actualQty = p.isKite ? (res.stock.currentQuantity || res.stock.initialQuantity || 0) : currentQty[sym];
        const actualInvested = p.isKite && res.stock.averagePrice ? actualQty * res.stock.averagePrice : stockInvested[sym];

        return {
          symbol: sym,
          initialQuantity: res.stock.initialQuantity,
          sipAmount: displaySip,
          totalInvested: stockInvested[sym],
          currentValue: currentQty[sym] * lastKnownPrice[sym],
          currentQty: currentQty[sym],
          lumpsumReturn,
          targetWeight: p.isKite && stockDynamicSip[sym] !== undefined ? stockDynamicSip[sym] / 10000 : undefined,
          actualInvested: actualInvested,
          actualQty: actualQty,
          actualValue: actualQty * lastKnownPrice[sym]
        };
      }).filter(s => !p.isKite || s.currentQty > 0 || (s.actualInvested && s.actualInvested > 0));

      // Calculate actual portfolio value for isolated target math
      let actualPortfolioValue = 0;
      if (p.isKite) {
        breakdown.forEach(s => {
          const qty = p.stocks.find(st => st.symbol === s.symbol)?.currentQuantity || 0;
          actualPortfolioValue += qty * (lastKnownPrice[s.symbol] || 0);
        });
        breakdown.forEach(s => s.actualPortfolioValue = actualPortfolioValue);
      }

      // Calculate normalized pure price curves (ignoring quantities)
      const normalizedRaw: Record<string, {time: string, value: number}[]> = {};
      results.forEach(res => {
         const sym = res.stock.symbol;
         const purePriceCurve: {time: string, value: number}[] = [];
         let lastKnown = 0;
         let maxVal = 0;
         
         filteredDates.forEach(date => {
            const p = priceMaps[sym]?.get(date);
            if (p !== undefined) lastKnown = p;
            
            purePriceCurve.push({ time: date, value: lastKnown });
            if (lastKnown > maxVal) maxVal = lastKnown;
         });
         
         if (maxVal > 0) {
            normalizedRaw[sym] = purePriceCurve.map(p => ({
               time: p.time,
               value: (p.value / maxVal) * 100
            }));
         } else {
            normalizedRaw[sym] = purePriceCurve.map(p => ({ time: p.time, value: 0 }));
         }
      });

      setEquityCurve(finalCurve);
      setStockCurves(stockCurvesRaw);
      setNormalizedStockCurves(normalizedRaw);
      setStockBreakdown(breakdown);
      setTradeMarkers(finalMarkers);
      
      const finalInvested = finalCurve.length > 0 ? finalCurve[finalCurve.length - 1].invested : 0;
      const finalValue = finalCurve.length > 0 ? finalCurve[finalCurve.length - 1].value : 0;
      
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
    normalizedStockCurves,
    stockBreakdown,
    tradeMarkers,
    totalInvested,
    currentValue
  };
}

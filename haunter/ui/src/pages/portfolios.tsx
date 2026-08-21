import { createSignal, createMemo, Show, For } from 'solid-js';
import {
  Portfolio,
  PortfolioStock,
  fetchPortfolios,
  savePortfolio,
  deletePortfolio,
  fetchKitePortfolio,
  fetchTradebookRecords
} from '../api/stockApi';
import { PortfolioEquityChart } from './components/portfolio/PortfolioEquityChart';
import { useAppStore } from '../store/appStore';
import { PortfolioLedgerTable } from './components/portfolio/PortfolioLedgerTable';
import { PortfolioRebalanceTable } from './components/portfolio/PortfolioRebalanceTable';
import { GttSafetyNetTable } from './components/portfolio/GttSafetyNetTable';
import { CorrelationMatrixTable } from './components/portfolio/CorrelationMatrixTable';
import { PageLayout } from './components/PageLayout';
import { usePortfolioSimulation } from '../hooks/usePortfolioSimulation';

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = createSignal<Portfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = createSignal<string | null>(null);

  const [kitePortfolio, setKitePortfolio] = createSignal<Portfolio | null>(null);

  const selectedPortfolio = () => {
    if (selectedPortfolioId() === 'kite-live') return kitePortfolio() || undefined;
    return portfolios()?.find(p => p.id === selectedPortfolioId());
  };

  const refetch = async () => {
    try {
      const data = await fetchPortfolios();
      setPortfolios(data);
    } catch (e) {
      console.error(e);
    }
    
    try {
      const [kiteData, tradebookRes] = await Promise.all([
        fetchKitePortfolio().catch(() => null),
        fetchTradebookRecords().catch(() => ({ records: [] }))
      ]);

      if (kiteData && kiteData.holdings) {
        const historicalTrades = (tradebookRes.records || []).map(r => ({
          tradeId: r.tradeId,
          orderId: r.orderId,
          exchange: r.exchange,
          tradingsymbol: r.symbol,
          transactionType: (r.transactionType || '').toUpperCase() as 'BUY' | 'SELL',
          quantity: r.quantity,
          averagePrice: r.price,
          tradeTimestamp: r.tradeDate
        }));

        const kp: Portfolio = {
          id: 'kite-live',
          name: '🎯 Kite Portfolio (Live)',
          createdAt: kiteData.fetchedAt || new Date().toISOString(),
          isKite: true,
          tradeHistory: historicalTrades.length > 0 ? historicalTrades : (kiteData.tradeHistory || []),
          stocks: kiteData.holdings.map(h => ({
            symbol: h.tradingsymbol.endsWith('.NS') ? h.tradingsymbol : `${h.tradingsymbol}.NS`,
            initialQuantity: 0,
            sipAmount: 0,
            currentQuantity: h.quantity,
            averagePrice: h.averagePrice
          }))
        };
        setKitePortfolio(kp);
      } else {
        setKitePortfolio(null);
      }
    } catch (e) {
       setKitePortfolio(null);
    }
  };

  // Initial fetch
  refetch();

  // Chart state
  const { timeframe } = useAppStore();
  const [sipDistribution, setSipDistribution] = createSignal<'WEIGHTED' | 'EQUAL' | 'RETURN_WEIGHTED'>('RETURN_WEIGHTED');

  // Simulation
  const sim = usePortfolioSimulation(
    selectedPortfolio, 
    timeframe, 
    () => 'MANUAL',
    sipDistribution
  );

  const [clusterBy, setClusterBy] = createSignal<'day' | 'week' | 'month'>('week');
  const [unselectedNormalizedStocks, setUnselectedNormalizedStocks] = createSignal<Set<string>>(new Set());

  const simExact = usePortfolioSimulation(
    () => selectedPortfolio()?.isKite ? selectedPortfolio() : undefined,
    timeframe,
    () => 'TRADEBOOK_EXACT',
    () => 'WEIGHTED',
    clusterBy
  );

  const activeStocks = createMemo(() => simExact.stockBreakdown().filter(s => s.currentQty > 0).map(s => s.symbol).sort());

  const filteredNormalizedCurves = createMemo(() => {
    const curves = simExact.normalizedStockCurves();
    const unselected = unselectedNormalizedStocks();
    const active = activeStocks();
    const filtered: Record<string, any> = {};
    active.forEach(sym => {
       if (!unselected.has(sym) && curves[sym]) {
          filtered[sym] = curves[sym];
       }
    });
    return filtered;
  });

  const correlationScore = createMemo(() => {
    const curves = filteredNormalizedCurves();
    const symbols = Object.keys(curves);
    if (symbols.length !== 2) return null;
    
    const [sym1, sym2] = symbols;
    const data1 = curves[sym1];
    const data2 = curves[sym2];
    
    const returns1: number[] = [];
    const returns2: number[] = [];
    
    for (let i = 0; i < data1.length; i++) {
       returns1.push(data1[i].value);
       returns2.push(data2[i].value);
    }
    
    const n = returns1.length;
    if (n === 0) return null;
    
    let sum1 = 0, sum2 = 0, sum1Sq = 0, sum2Sq = 0, pSum = 0;
    for (let i = 0; i < n; i++) {
      sum1 += returns1[i];
      sum2 += returns2[i];
      sum1Sq += returns1[i] ** 2;
      sum2Sq += returns2[i] ** 2;
      pSum += returns1[i] * returns2[i];
    }
    const num = pSum - (sum1 * sum2 / n);
    const den = Math.sqrt((sum1Sq - (sum1 ** 2) / n) * (sum2Sq - (sum2 ** 2) / n));
    if (den === 0) return 0;
    
    return num / den;
  });

  // Create new portfolio state
  const [isCreating, setIsCreating] = createSignal(false);
  const [newPortfolioName, setNewPortfolioName] = createSignal('');

  // Handle create
  const handleCreatePortfolio = async (e: Event) => {
    e.preventDefault();
    if (!newPortfolioName().trim()) return;

    try {
      const newPortfolio = {
        id: crypto.randomUUID(),
        name: newPortfolioName().trim(),
        stocks: [],
      };
      await savePortfolio(newPortfolio);
      setNewPortfolioName('');
      setIsCreating(false);
      refetch();
    } catch (err) {
      console.error(err);
      alert('Failed to create portfolio');
    }
  };

  const handleDeletePortfolio = async (id: string, e: Event) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this portfolio?')) return;
    try {
      await deletePortfolio(id);
      if (selectedPortfolioId() === id) {
        setSelectedPortfolioId(null);
      }
      refetch();
    } catch (err) {
      console.error(err);
      alert('Failed to delete portfolio');
    }
  };

  // Add stock state
  const [isAddingStock, setIsAddingStock] = createSignal(false);
  const [newSymbol, setNewSymbol] = createSignal('');
  const [newQty, setNewQty] = createSignal(0);
  const [newSip, setNewSip] = createSignal(1000);

  const handleAddStock = async (p: Portfolio, e: Event) => {
    e.preventDefault();
    if (!newSymbol().trim()) return;

    try {
      const updatedPortfolio = {
        ...p,
        stocks: [
          ...(p.stocks || []),
          {
            symbol: newSymbol().trim().toUpperCase(),
            initialQuantity: newQty(),
            sipAmount: newSip(),
          }
        ]
      };
      await savePortfolio(updatedPortfolio);
      setNewSymbol('');
      setNewQty(0);
      setNewSip(1000);
      setIsAddingStock(false);
      refetch();
    } catch (err) {
      console.error(err);
      alert('Failed to add stock');
    }
  };

  const handleRemoveStock = async (p: Portfolio, symbolToRemove: string) => {
    if (!confirm(`Remove ${symbolToRemove} from portfolio?`)) return;
    try {
      const updatedPortfolio = {
        ...p,
        stocks: p.stocks.filter(s => s.symbol !== symbolToRemove)
      };
      await savePortfolio(updatedPortfolio);
      refetch();
    } catch (err) {
      console.error(err);
      alert('Failed to remove stock');
    }
  };

  return (
    <PageLayout title="Portfolio" mainClass="flex-1 flex flex-col md:flex-row overflow-hidden p-0">

      {/* Sidebar - Portfolio List */}
      <div class="w-full md:w-64 border-r border-outline flex flex-col h-full bg-surface-container">
        <div class="p-4 border-b border-outline flex justify-between items-center">
          <h2 class="text-lg font-semibold tracking-tight text-on-surface">Portfolios</h2>
          <button
            onClick={() => setIsCreating(true)}
            class="text-xs bg-surface-container-highest hover:bg-surface-variant text-on-surface px-2 py-1 rounded transition-colors"
          >
            + New
          </button>
        </div>

        <Show when={isCreating()}>
          <form onSubmit={handleCreatePortfolio} class="p-4 border-b border-outline bg-surface-container-high">
            <input
              type="text"
              value={newPortfolioName()}
              onInput={(e) => setNewPortfolioName(e.currentTarget.value)}
              placeholder="Portfolio Name"
              class="w-full bg-surface text-on-surface border border-outline rounded px-2 py-1 text-sm outline-none focus:border-primary transition-colors mb-2"
              autofocus
            />
            <div class="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                class="text-xs text-muted-gray hover:text-on-surface"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="text-xs bg-primary text-on-primary px-3 py-1 rounded font-medium hover:bg-primary-container hover:text-on-primary-container"
              >
                Create
              </button>
            </div>
          </form>
        </Show>

        <div class="flex-1 overflow-y-auto">
          <Show when={kitePortfolio()}>
            {(kp) => (
              <div
                onClick={() => setSelectedPortfolioId(kp().id)}
                class={`p-3 border-b border-outline-variant cursor-pointer flex justify-between items-center group transition-colors ${selectedPortfolioId() === kp().id ? 'bg-white/10 border-l-2 border-l-[#4B9CFF]' : 'hover:bg-surface-container-low'}`}
              >
                <div class="flex flex-col overflow-hidden">
                  <span class="font-bold text-on-surface truncate">{kp().name}</span>
                  <span class="text-xs text-muted-gray">{kp().stocks.length} assets</span>
                </div>
              </div>
            )}
          </Show>

          <For
            each={portfolios()}
            fallback={<div class="p-4 text-sm text-muted-gray italic text-center">No portfolios found.</div>}
          >
            {(p) => (
              <div
                onClick={() => setSelectedPortfolioId(p.id)}
                class={`p-3 border-b border-outline-variant cursor-pointer flex justify-between items-center group transition-colors ${selectedPortfolioId() === p.id ? 'bg-white/10 border-l-2 border-l-[#4B9CFF]' : 'hover:bg-surface-container-low'}`}
              >
                <div class="flex flex-col overflow-hidden">
                  <span class="text-sm font-medium text-on-surface truncate">{p.name}</span>
                  <span class="text-xs text-muted-gray">{p.stocks?.length || 0} stocks</span>
                </div>
                <button
                  onClick={(e) => handleDeletePortfolio(p.id, e)}
                  class="text-outline hover:text-critical-red opacity-0 group-hover:opacity-100 transition-all ml-2"
                  title="Delete Portfolio"
                >
                  ✕
                </button>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Main Content Area */}
      <div class="flex-1 flex flex-col h-full bg-surface overflow-hidden">
        <Show
          when={selectedPortfolio()}
          fallback={
            <div class="flex-1 flex items-center justify-center text-muted-gray">
              Select or create a portfolio to view details.
            </div>
          }
        >
          {(p) => (
            <>
              <div class="p-6 border-b border-outline flex justify-between items-center bg-surface-container">
                <div>
                  <h1 class="text-2xl font-bold tracking-tight">{p().name}</h1>
                  <p class="text-sm text-muted-gray mt-1">Manage stocks and simulate SIP performance</p>
                </div>
              </div>

              <div class="flex-1 overflow-y-auto p-6">
                <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Charting Pane */}
                  <div class="xl:col-span-3 flex flex-col gap-6">
                    <div class="border border-outline rounded-xl overflow-hidden bg-surface-container-low flex flex-col h-[600px]">
                      <div class="p-4 border-b border-outline bg-surface-container-low font-medium flex justify-between items-center shrink-0">
                        <span>{p().isKite ? (sipDistribution() === 'WEIGHTED' ? "Value Weighted SIP Strategy (₹10,000/mo)" : sipDistribution() === 'RETURN_WEIGHTED' ? "Return Weighted SIP Strategy (₹10,000/mo)" : "Equal SIP Strategy (₹10,000/mo)") : "Simulated Equity Curve"}</span>
                        <div class="flex gap-1 text-xs">
                          {p().isKite && (
                            <div class="flex bg-surface-container-highest rounded p-1">
                              <button 
                                onClick={() => setSipDistribution('WEIGHTED')} 
                                class={`px-2 py-1 rounded transition-colors ${sipDistribution() === 'WEIGHTED' ? 'bg-primary text-on-primary' : 'text-on-surface hover:bg-surface-variant'}`}
                              >
                                Value W.
                              </button>
                              <button 
                                onClick={() => setSipDistribution('RETURN_WEIGHTED')} 
                                class={`px-2 py-1 rounded transition-colors ${sipDistribution() === 'RETURN_WEIGHTED' ? 'bg-primary text-on-primary' : 'text-on-surface hover:bg-surface-variant'}`}
                              >
                                Return W.
                              </button>
                              <button 
                                onClick={() => setSipDistribution('EQUAL')} 
                                class={`px-2 py-1 rounded transition-colors ${sipDistribution() === 'EQUAL' ? 'bg-primary text-on-primary' : 'text-on-surface hover:bg-surface-variant'}`}
                              >
                                Equal
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div class="flex-1 flex flex-col overflow-hidden relative">
                        <PortfolioEquityChart equityCurve={sim.equityCurve()} />
                      </div>
                    </div>

                    <Show when={p().isKite}>
                      <div class="border border-outline rounded-xl overflow-hidden bg-surface-container-low flex flex-col h-[600px]">
                        <div class="p-4 border-b border-outline bg-surface-container-low font-medium flex justify-between items-center shrink-0">
                          <span>Tradebook Execution Curve (Exact)</span>
                          <div class="flex gap-1 text-xs">
                            <div class="flex bg-surface-container-highest rounded p-1">
                              <button 
                                onClick={() => setClusterBy('day')} 
                                class={`px-2 py-1 rounded transition-colors ${clusterBy() === 'day' ? 'bg-primary text-on-primary' : 'text-on-surface hover:bg-surface-variant'}`}
                              >
                                Day
                              </button>
                              <button 
                                onClick={() => setClusterBy('week')} 
                                class={`px-2 py-1 rounded transition-colors ${clusterBy() === 'week' ? 'bg-primary text-on-primary' : 'text-on-surface hover:bg-surface-variant'}`}
                              >
                                Week
                              </button>
                              <button 
                                onClick={() => setClusterBy('month')} 
                                class={`px-2 py-1 rounded transition-colors ${clusterBy() === 'month' ? 'bg-primary text-on-primary' : 'text-on-surface hover:bg-surface-variant'}`}
                              >
                                Month
                              </button>
                            </div>
                          </div>
                        </div>
                        <div class="flex-1 flex flex-col overflow-hidden relative">
                          <PortfolioEquityChart equityCurve={simExact.equityCurve()} stockCurves={simExact.stockCurves()} tradeMarkers={simExact.tradeMarkers()} />
                        </div>
                      </div>

                      <div class="border border-outline rounded-xl overflow-hidden bg-surface-container-low flex flex-col h-[600px]">
                        <div class="p-4 border-b border-outline bg-surface-container-low font-medium flex justify-between items-center shrink-0">
                          <div class="flex items-center gap-4">
                            <span>Normalized Asset Curves (Peak = 100)</span>
                            <Show when={correlationScore() !== null}>
                              <div class="px-2 py-1 bg-surface-container-highest rounded text-xs flex items-center gap-1 border border-outline">
                                <span class="text-on-surface-variant font-normal">Trend Correlation:</span>
                                <span class={correlationScore()! > 0.7 ? "text-blue-500 font-bold" : correlationScore()! < 0.3 ? "text-green-500 font-bold" : "text-amber-500 font-bold"}>
                                  {correlationScore()!.toFixed(2)}
                                </span>
                              </div>
                            </Show>
                          </div>
                          <div class="flex gap-2">
                            <button 
                              class="text-xs text-primary hover:underline"
                              onClick={() => setUnselectedNormalizedStocks(new Set(activeStocks()))}
                            >
                              Clear All
                            </button>
                            <button 
                              class="text-xs text-primary hover:underline"
                              onClick={() => setUnselectedNormalizedStocks(new Set())}
                            >
                              Select All
                            </button>
                          </div>
                        </div>
                        <div class="p-3 border-b border-outline bg-surface-container-lowest flex flex-wrap gap-3 max-h-[100px] overflow-y-auto">
                          <For each={activeStocks()}>
                            {(sym) => (
                              <label class="flex items-center gap-1.5 text-xs cursor-pointer select-none text-on-surface">
                                <input 
                                  type="checkbox" 
                                  class="accent-primary"
                                  checked={!unselectedNormalizedStocks().has(sym)}
                                  onChange={(e) => {
                                    const s = new Set(unselectedNormalizedStocks());
                                    if (e.currentTarget.checked) s.delete(sym);
                                    else s.add(sym);
                                    setUnselectedNormalizedStocks(s);
                                  }}
                                />
                                <span>{sym.replace('.NS', '')}</span>
                              </label>
                            )}
                          </For>
                        </div>
                        <div class="flex-1 flex flex-col overflow-hidden relative">
                          <PortfolioEquityChart equityCurve={[]} stockCurves={filteredNormalizedCurves()} />
                        </div>
                      </div>
                    </Show>
                  </div>
                </div>

                {/* Ledger Table */}
                <PortfolioLedgerTable 
                  stockBreakdown={sim.stockBreakdown()} 
                  isKite={p().isKite || false}
                  onRemoveStock={(symbol, e) => {
                    e.stopPropagation();
                    handleRemoveStock(p(), symbol);
                  }}
                  isAddingStock={isAddingStock()}
                  setIsAddingStock={setIsAddingStock}
                  handleAddStock={(e) => handleAddStock(p(), e)}
                  newSymbol={newSymbol()}
                  setNewSymbol={setNewSymbol}
                  newQty={newQty()}
                  setNewQty={setNewQty}
                  newSip={newSip()}
                  setNewSip={setNewSip}
                />
                
                <Show when={p().isKite}>
                  <PortfolioRebalanceTable stockBreakdown={sim.stockBreakdown()} />
                  <GttSafetyNetTable stockBreakdown={sim.stockBreakdown()} />
                </Show>

                <CorrelationMatrixTable 
                  activeStocks={activeStocks().filter(sym => !unselectedNormalizedStocks().has(sym))}
                  normalizedCurves={simExact.normalizedStockCurves()}
                />
              </div>
            </>
          )}
        </Show>
      </div>
    </PageLayout>
  );
}

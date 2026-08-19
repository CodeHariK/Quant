import { createSignal, Show, For } from 'solid-js';
import {
  Portfolio,
  PortfolioStock,
  fetchPortfolios,
  savePortfolio,
  deletePortfolio,
} from '../api/stockApi';
import { PortfolioEquityChart } from './components/portfolio/PortfolioEquityChart';
import { PortfolioLedgerTable } from './components/portfolio/PortfolioLedgerTable';
import { PageLayout } from './components/PageLayout';
import { usePortfolioSimulation } from '../hooks/usePortfolioSimulation';

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = createSignal<Portfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = createSignal<string | null>(null);

  const selectedPortfolio = () => portfolios()?.find(p => p.id === selectedPortfolioId());

  const refetch = async () => {
    try {
      const data = await fetchPortfolios();
      setPortfolios(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Initial fetch
  refetch();

  // Chart state
  const [timeframe, setTimeframe] = createSignal<'1Y' | '5Y' | 'MAX'>('1Y');

  // Simulation
  const sim = usePortfolioSimulation(selectedPortfolio, timeframe);

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
                  {/* Stocks Management Pane */}
                  <div class="xl:col-span-1 border border-outline rounded-xl overflow-hidden bg-surface-container-low flex flex-col h-[600px]">
                    <div class="p-4 border-b border-outline bg-surface-container-low font-medium flex justify-between items-center shrink-0">
                      <span>Holdings</span>
                      <button
                        onClick={() => setIsAddingStock(!isAddingStock())}
                        class="text-xs bg-primary text-on-primary px-2 py-1 rounded hover:bg-primary-container hover:text-on-primary-container transition-colors"
                      >
                        {isAddingStock() ? 'Cancel' : '+ Add Stock'}
                      </button>
                    </div>

                    <Show when={isAddingStock()}>
                      <form onSubmit={(e) => handleAddStock(p(), e)} class="p-4 border-b border-outline bg-surface-container-high flex flex-col gap-2 shrink-0">
                        <div class="flex flex-col gap-1">
                          <label class="text-xs text-muted-gray">Symbol</label>
                          <input type="text" required placeholder="e.g. RELIANCE.NS" value={newSymbol()} onInput={e => setNewSymbol(e.currentTarget.value)} class="bg-surface text-on-surface border border-outline rounded px-2 py-1 text-sm outline-none focus:border-primary" />
                        </div>
                        <div class="flex gap-2">
                          <div class="flex flex-col gap-1 flex-1">
                            <label class="text-xs text-muted-gray">Start Qty</label>
                            <input type="number" min="0" step="0.01" value={newQty()} onInput={e => setNewQty(parseFloat(e.currentTarget.value) || 0)} class="bg-surface text-on-surface border border-outline rounded px-2 py-1 text-sm outline-none focus:border-primary" />
                          </div>
                          <div class="flex flex-col gap-1 flex-1">
                            <label class="text-xs text-muted-gray">SIP/Mo (₹)</label>
                            <input type="number" min="0" value={newSip()} onInput={e => setNewSip(parseFloat(e.currentTarget.value) || 0)} class="bg-surface text-on-surface border border-outline rounded px-2 py-1 text-sm outline-none focus:border-primary" />
                          </div>
                        </div>
                        <button type="submit" class="mt-2 text-xs bg-on-surface text-surface px-3 py-1.5 rounded font-medium hover:bg-outline-variant transition-colors w-full">Save Holding</button>
                      </form>
                    </Show>

                    <div class="p-4 flex flex-col gap-3 flex-1 overflow-y-auto">
                      <For each={p().stocks} fallback={<div class="text-sm text-muted-gray italic text-center py-4">No stocks added yet.</div>}>
                        {(stock) => (
                          <div class="flex justify-between items-center p-3 rounded-lg bg-surface border border-outline-variant hover:border-outline transition-colors">
                            <div>
                              <div class="font-medium text-primary">{stock.symbol}</div>
                              <div class="text-xs text-muted-gray flex gap-2 mt-1">
                                <span>Qty: {stock.initialQuantity}</span>
                                <span>•</span>
                                <span>SIP: ₹{stock.sipAmount}/mo</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveStock(p(), stock.symbol)}
                              class="text-muted-gray hover:text-critical-red transition-colors"
                              title="Remove"
                            >✕</button>
                          </div>
                        )}
                      </For>
                    </div>
                  </div>

                  {/* Charting Pane */}
                  <div class="xl:col-span-2 border border-outline rounded-xl overflow-hidden bg-surface-container-low flex flex-col h-[600px]">
                    <div class="p-4 border-b border-outline bg-surface-container-low font-medium flex justify-between items-center shrink-0">
                      <span>Simulated Equity Curve</span>
                      <div class="flex gap-1 text-xs">
                        <button onClick={() => setTimeframe('1Y')} class={`px-2 py-1 rounded transition-colors ${timeframe() === '1Y' ? 'bg-primary text-on-primary' : 'bg-surface-container-highest hover:bg-surface-variant text-on-surface'}`}>1Y</button>
                        <button onClick={() => setTimeframe('5Y')} class={`px-2 py-1 rounded transition-colors ${timeframe() === '5Y' ? 'bg-primary text-on-primary' : 'bg-surface-container-highest hover:bg-surface-variant text-on-surface'}`}>5Y</button>
                        <button onClick={() => setTimeframe('MAX')} class={`px-2 py-1 rounded transition-colors ${timeframe() === 'MAX' ? 'bg-primary text-on-primary' : 'bg-surface-container-highest hover:bg-surface-variant text-on-surface'}`}>MAX</button>
                      </div>
                    </div>
                    <div class="flex-1 flex flex-col overflow-hidden relative">
                      <PortfolioEquityChart equityCurve={sim.equityCurve()} />
                    </div>
                  </div>
                </div>

                {/* Ledger Table */}
                <PortfolioLedgerTable stockBreakdown={sim.stockBreakdown()} />
              </div>
            </>
          )}
        </Show>
      </div>
    </PageLayout>
  );
}

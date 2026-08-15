import { Title } from '@solidjs/meta';
import { useSearchParams } from '@solidjs/router';
import { createSignal, createEffect } from 'solid-js';
import { PageLayout } from '../components/PageLayout';
import { Table } from '../components/Table';
import { fetchValuationReport, fetchWatchlist, addToWatchlist, removeFromWatchlist } from '../api/stockApi';
import type { FullValuationReport } from '../types/events';

export default function ModelDetail() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial symbol from URL query parameter (e.g. ?symbol=GVT%26D.NS or ?symbol=AAPL)
  const rawSymbol = Array.isArray(searchParams.symbol) ? searchParams.symbol[0] : searchParams.symbol;
  const initialSymbol = rawSymbol ? decodeURIComponent(rawSymbol) : 'RELIANCE.NS';

  const [selectedSymbol, setSelectedSymbol] = createSignal<string>(initialSymbol);
  const [watchlist, setWatchlist] = createSignal<string[]>(['RELIANCE.NS', 'TATAMOTORS.NS', 'INFY.NS', 'TCS.NS', 'AAPL', 'MSFT', 'NVDA']);
  const [newSymbolInput, setNewSymbolInput] = createSignal<string>('');
  const [fullReport, setFullReport] = createSignal<FullValuationReport | null>(null);
  const [loading, setLoading] = createSignal<boolean>(false);
  const [error, setError] = createSignal<string | null>(null);

  // Sync Watchlist from backend on mount; respect URL symbol if provided
  createEffect(
    () => true,
    () => {
      fetchWatchlist()
        .then((list) => {
          if (list.length > 0) {
            setWatchlist(list);
            // If no symbol parameter was present in the URL, default to first watchlist item
            if (!searchParams.symbol) {
              setSelectedSymbol(list[0]);
            }
          }
        })
        .catch(() => { });
    }
  );

  const loadStockReport = (sym: string, force = false) => {
    setLoading(true);
    setError(null);
    fetchValuationReport(sym, force)
      .then((report) => {
        setFullReport(report);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  // Whenever selectedSymbol changes: load report and update URL query parameter
  createEffect(
    () => selectedSymbol(),
    (sym) => {
      if (sym) {
        setSearchParams({ symbol: sym });
        loadStockReport(sym, false); // Load from BoltDB cache
      }
    }
  );

  const handleAddSymbol = (e: Event) => {
    e.preventDefault();
    const sym = newSymbolInput().trim().toUpperCase();
    if (!sym) return;

    addToWatchlist(sym)
      .then((list) => {
        setWatchlist(list);
        setSelectedSymbol(sym);
        setNewSymbolInput('');
      })
      .catch((err) => setError(err.message));
  };

  const handleRemoveSymbol = (sym: string, e: Event) => {
    e.stopPropagation();
    removeFromWatchlist(sym)
      .then((list) => {
        setWatchlist(list);
        if (selectedSymbol() === sym && list.length > 0) {
          setSelectedSymbol(list[0]);
        }
      })
      .catch((err) => setError(err.message));
  };

  const stockInfo = () => fullReport()?.rawInfo || (fullReport() as any)?.info;

  return (
    <PageLayout showSidebar={false}>
      <Title>Model & Stock Valuation - ALPHA ARENA</Title>

      {/* Watchlist Management & Asset Selector Bar */}
      <div class="border border-black bg-white p-4 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <label class="font-label-caps text-label-caps text-muted-gray uppercase">WATCHLIST (BOLTDB):</label>
          <div class="flex flex-wrap items-center gap-2">
            {watchlist().map((sym) => (
              <div
                onClick={() => setSelectedSymbol(sym)}
                class={`px-3 py-1 text-xs font-bold uppercase cursor-pointer border flex items-center gap-2 transition-colors ${selectedSymbol() === sym ? 'bg-black text-white border-black' : 'bg-surface hover:bg-gray-100 border-gray-300 text-black'
                  }`}
              >
                <span>{sym}</span>
                <span
                  onClick={(e) => handleRemoveSymbol(sym, e)}
                  class="material-symbols-outlined text-[14px] opacity-60 hover:opacity-100 hover:text-critical-red"
                  title="Remove from watchlist"
                >
                  close
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Add Symbol Form */}
        <form onSubmit={handleAddSymbol} class="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="ADD TICKER (e.g. AMZN, RELIANCE.NS)"
            value={newSymbolInput()}
            onInput={(e) => setNewSymbolInput(e.currentTarget.value)}
            class="border border-black px-3 py-1 font-code-md text-code-md uppercase w-full md:w-64 bg-white"
          />
          <button type="submit" class="bg-black text-white px-3 py-1 text-xs font-bold border border-black hover:bg-gray-800 uppercase cursor-pointer">
            + ADD
          </button>
        </form>
      </div>

      {loading() && <div class="font-code-md text-code-md text-muted-gray mb-4 animate-pulse">Loading stock report from BoltDB cache...</div>}
      {error() && <div class="font-code-md text-code-md text-critical-red mb-4">{error()}</div>}

      {/* Model & Stock Header */}
      <header class="border border-black bg-white p-6 relative mb-8">
        <div class="absolute top-0 left-0 w-full h-1 bg-black"></div>
        <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div class="flex items-center gap-3 mb-2 text-xs">
              <span class="w-3 h-3 bg-[#00FF41] inline-block border border-black"></span>
              <span class="uppercase font-bold">VALUATION ENGINE: YFINANCE (FULL RAW DATA)</span>
              <span class="text-gray-500 border border-gray-200 px-2 py-0.5 ml-2 font-bold">{stockInfo()?.symbol || selectedSymbol()}</span>
            </div>
            <h1 class="text-3xl text-black uppercase tracking-tight font-bold">{stockInfo()?.longName || selectedSymbol()}</h1>
            <p class="text-xs text-gray-500 mt-2 font-mono">
              SECTOR: {stockInfo()?.sector || 'N/A'} | INDUSTRY: {stockInfo()?.industry || 'N/A'}
            </p>
          </div>
          <div class="flex gap-2 text-xs font-bold">
            <button
              onClick={() => loadStockReport(selectedSymbol(), true)}
              disabled={loading()}
              class="bg-black text-white px-4 py-2 border border-black hover:bg-gray-800 disabled:opacity-50 uppercase cursor-pointer"
            >
              {loading() ? 'FETCHING...' : 'FORCE REFRESH 🔄'}
            </button>
            <button class="bg-transparent border border-black text-black px-4 py-2 hover:bg-gray-100 uppercase">EXPORT VALUATION</button>
          </div>
        </div>
      </header>

      {/* Categorized & Grouped Financial Statistics */}
      {stockInfo() && (() => {
        const info = stockInfo() || {};

        const ignoredKeys = new Set([
          'symbol', 'shortname', 'longname', 'sector', 'industry', 'fulltimeemployees',
          'city', 'country', 'phone', 'address1', 'address2', 'zip',
          'companyofficers', 'quotetype', 'exchange', 'financialcurrency'
        ]);

        const categories: { title: string; keys: string[] }[] = [
          {
            title: '📊 VALUATION & KEY RATIOS',
            keys: [
              'marketCap', 'enterpriseValue', 'currentPrice', 'trailingPE', 'forwardPE',
              'pegRatio', 'priceToBook', 'bookValue', 'priceToSalesTrailing12Months',
              'enterpriseToRevenue', 'enterpriseToEbitda', 'trailingEps', 'forwardEps'
            ],
          },
          {
            title: '💼 FINANCIAL HEALTH & SOLVENCY',
            keys: [
              'totalCash', 'totalDebt', 'debtToEquity', 'totalCashPerShare',
              'quickRatio', 'currentRatio', 'freeCashflow', 'operatingCashflow'
            ],
          },
          {
            title: '📈 OPERATING PERFORMANCE & MARGINS',
            keys: [
              'ebitda', 'totalRevenue', 'grossProfits', 'netIncomeToCommon', 'revenuePerShare',
              'profitMargins', 'operatingMargins', 'grossMargins', 'ebitdaMargins',
              'revenueGrowth', 'earningsGrowth', 'earningsQuarterlyGrowth', 'returnOnAssets', 'returnOnEquity'
            ],
          },
          {
            title: '📉 MARKET PRICE & TRADING VOLUME',
            keys: [
              'previousClose', 'open', 'dayLow', 'dayHigh', 'fiftyTwoWeekLow', 'fiftyTwoWeekHigh',
              'fiftyDayAverage', 'twoHundredDayAverage', '52WeekChange', 'volume',
              'averageVolume', 'averageVolume10days', 'beta', 'floatShares', 'sharesOutstanding'
            ],
          },
          {
            title: '🎯 ANALYST TARGETS & RECOMMENDATIONS',
            keys: [
              'targetMeanPrice', 'targetHighPrice', 'targetLowPrice', 'targetMedianPrice',
              'recommendationKey', 'recommendationMean', 'numberOfAnalystOpinions'
            ],
          },
        ];

        // Track used keys to render any remaining items in an "OTHER METRICS" group
        const usedKeys = new Set<string>();
        categories.forEach((cat) => cat.keys.forEach((k) => usedKeys.add(k.toLowerCase())));

        const remainingKeys = Object.keys(info).filter(
          (k) => !ignoredKeys.has(k.toLowerCase()) && !usedKeys.has(k.toLowerCase())
        );

        if (remainingKeys.length > 0) {
          categories.push({
            title: '📋 OTHER STATISTICS & PERIOD EPOCHS',
            keys: remainingKeys,
          });
        }

        const renderValue = (val: any) => {
          if (val === null || val === undefined) return <span class="text-gray-400 font-mono">null</span>;
          if (typeof val === 'object') return <pre class="font-mono text-xs bg-gray-100 p-2 overflow-x-auto">{JSON.stringify(val, null, 2)}</pre>;
          if (typeof val === 'number') return <span class="font-mono font-bold text-terminal-green">{val.toLocaleString()}</span>;
          if (typeof val === 'boolean') return <span class="font-mono text-blue-600">{val ? 'TRUE' : 'FALSE'}</span>;
          return <span class="font-mono text-black">{String(val)}</span>;
        };

        return (
          <div class="space-y-6 mb-8">
            {categories.map((cat) => {
              const items = cat.keys
                .map((k) => {
                  const actualKey = Object.keys(info).find((x) => x.toLowerCase() === k.toLowerCase());
                  return actualKey ? [actualKey, info[actualKey]] : null;
                })
                .filter((x): x is [string, any] => x !== null && x[1] !== undefined);

              if (items.length === 0) return null;

              return (
                <section class="border border-black bg-white overflow-hidden">
                  <div class="border-b border-black px-4 py-3 bg-gray-50 flex justify-between items-center text-xs font-bold uppercase tracking-wide">
                    <span>{cat.title}</span>
                    <span class="text-gray-500 font-mono">{items.length} METRICS</span>
                  </div>

                  <div class="divide-y divide-gray-200">
                    {items.map(([key, val]) => (
                      <div class="px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-2 hover:bg-gray-50 transition-colors">
                        <span class="font-label-caps text-label-caps text-muted-gray uppercase font-bold tracking-wider md:w-1/3">{key}</span>
                        <div class="md:w-2/3 text-sm text-right md:text-left">{renderValue(val)}</div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        );
      })()}

      {/* Raw Complete JSON Payload Inspector */}
      {fullReport() && (
        <section class="border border-black bg-white p-4 mb-8 overflow-hidden">
          <div class="font-bold text-xs uppercase mb-2 border-b border-gray-200 pb-2 flex justify-between items-center">
            <span>FULL 5-YEAR UNTRUNCATED JSON PAYLOAD ({selectedSymbol()})</span>
            <span class="text-gray-500 font-mono">Fetched At: {fullReport()?.fetchedAt}</span>
          </div>
          <pre class="bg-gray-50 dark:bg-zinc-900 text-xs p-4 overflow-x-auto max-h-96 border border-gray-300 font-mono">
            {JSON.stringify(fullReport(), null, 2)}
          </pre>
        </section>
      )}

      {/* Trade History Table */}
      <section class="border border-black bg-white overflow-hidden">
        <div class="border-b border-gray-200 p-3 bg-gray-50 flex justify-between items-center text-xs">
          <span class="font-bold uppercase">RECENT EXECUTION LOG</span>
          <span class="text-gray-500">Showing last 5 trades</span>
        </div>
        <Table
          columns={[
            { header: 'TIMESTAMP', accessor: 'timestamp', className: 'p-3 text-gray-500' },
            { header: 'SYMBOL', accessor: 'symbol', className: 'p-3 font-bold text-black' },
            {
              header: 'TYPE',
              cell: (row) => <span class={`font-bold ${row.type === 'LONG' ? 'text-[#008800]' : 'text-[#FF3B30]'}`}>{row.type}</span>,
              className: 'p-3',
            },
            { header: 'ENTRY', accessor: 'entry', className: 'p-3 text-black' },
            { header: 'EXIT', accessor: 'exit', className: 'p-3 text-black' },
            {
              header: 'P&L',
              cell: (row) => <span class="text-right text-[#008800] font-bold">{row.pnl}</span>,
              align: 'right',
              className: 'p-3 text-right',
            },
          ]}
          data={[
            { timestamp: '2024-05-12 14:32:01', symbol: selectedSymbol(), type: 'LONG', entry: '$890.45', exit: '$912.30', pnl: '+$4,560.00' },
            { timestamp: '2024-05-12 11:15:44', symbol: selectedSymbol(), type: 'SHORT', entry: '$175.20', exit: '$170.10', pnl: '+$2,140.00' },
          ]}
        />
      </section>
    </PageLayout>
  );
}

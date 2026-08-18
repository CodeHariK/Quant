import { Title } from '@solidjs/meta';
import { useSearchParams } from '@solidjs/router';
import { createSignal, createEffect } from 'solid-js';
import { PageLayout } from '../pages/components/PageLayout';
import { Card } from '../primitives/Card';
import { WatchlistModal } from '../pages/components/WatchlistModal';
import { ChipColor } from '../primitives/Chip';
import { Table } from '../primitives/Table';
import { Chip } from '../primitives/Chip';
import { Input, FilledButton, OutlineButton } from '../primitives/FormControls';
import { FinancialStatementViewer } from '../pages/components/FinancialStatementViewer';
import { Text } from '../primitives/Text';
import { fetchValuationReport, fetchWatchlist, addToWatchlist, removeFromWatchlist } from '../api/stockApi';
import type { FullValuationReport } from '../types/events';
import { TickerHeader } from './components/ticker/TickerHeader';
import { TickerTrendRadar } from './components/ticker/TickerTrendRadar';
import { TickerAnalystConsensus } from './components/ticker/TickerAnalystConsensus';
import { TickerRiskMetrics } from './components/ticker/TickerRiskMetrics';
import { TickerValuationRatios } from './components/ticker/TickerValuationRatios';
import { TickerFormulaModals } from './components/ticker/TickerFormulaModals';
import { TickerFinancialStats } from './components/ticker/TickerFinancialStats';
import { TickerTradeHistory } from './components/ticker/TickerTradeHistory';
import { TickerRawInspector } from './components/ticker/TickerRawInspector';
import { TickerPriceChart } from './components/ticker/TickerPriceChart';


export default function Ticker() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial symbol from URL query parameter (e.g. ?symbol=GVT%26D.NS or ?symbol=AAPL)
  const rawSymbol = Array.isArray(searchParams.symbol) ? searchParams.symbol[0] : searchParams.symbol;
  const initialSymbol = rawSymbol ? decodeURIComponent(rawSymbol) : 'GLD';

  const [selectedSymbol, setSelectedSymbol] = createSignal<string>(initialSymbol);
  const [watchlist, setWatchlist] = createSignal<string[]>(['AAPL', 'NVDA']);
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

  const [activeModal, setActiveModal] = createSignal<'sharpe' | 'sortino' | 'volatility' | 'drawdown' | 'dcf' | 'watchlist' | 'peg' | 'earningsYield' | null>(null);

  const getSharpeGrade = (val: number): { grade: string; color: ChipColor } => {
    if (val >= 3.0) return { grade: 'EXCELLENT', color: 'accent' };
    if (val >= 2.0) return { grade: 'VERY GOOD', color: 'accent' };
    if (val >= 1.0) return { grade: 'GOOD', color: 'success' };
    if (val >= 0.0) return { grade: 'ACCEPTABLE', color: 'info' };
    return { grade: 'POOR / SUB-PAR', color: 'error' };
  };

  const getSortinoGrade = (val: number): { grade: string; color: ChipColor } => {
    if (val >= 3.0) return { grade: 'EXCELLENT', color: 'accent' };
    if (val >= 2.0) return { grade: 'VERY GOOD', color: 'accent' };
    if (val >= 1.0) return { grade: 'GOOD', color: 'success' };
    if (val >= 0.0) return { grade: 'ACCEPTABLE', color: 'info' };
    return { grade: 'HIGH DOWNSIDE', color: 'error' };
  };

  const getVolGrade = (val: number): { grade: string; color: ChipColor } => {
    if (val <= 20) return { grade: 'LOW RISK', color: 'accent' };
    if (val <= 35) return { grade: 'MODERATE', color: 'info' };
    if (val <= 50) return { grade: 'HIGH VOLATILITY', color: 'warning' };
    return { grade: 'EXTREME RISK', color: 'error' };
  };

  const getDrawdownGrade = (val: number): { grade: string; color: ChipColor } => {
    if (val <= 20) return { grade: 'SAFE (-20%)', color: 'accent' };
    if (val <= 35) return { grade: 'MODERATE (-35%)', color: 'info' };
    if (val <= 50) return { grade: 'HIGH (-50%)', color: 'warning' };
    return { grade: 'SEVERE (-50%+)', color: 'error' };
  };

  return (
    <PageLayout showSidebar={false} mainClass="flex-grow p-8 max-w-[1600px] mx-auto w-full">
      <Title>{`${selectedSymbol()} - Stock Report & Financial Statement Analysis`}</Title>

      {loading() && <Text variant="muted" class="mb-4 block animate-pulse">Loading valuation report from BoltDB cache...</Text>}
      {error() && <Text status="error" class="mb-4 block">{error()}</Text>}

      <TickerHeader
        selectedSymbol={selectedSymbol}
        stockInfo={stockInfo}
        fullReport={fullReport}
        loading={loading}
        loadStockReport={loadStockReport}
      />

      {fullReport()?.history && fullReport()!.history.length > 0 && (
        <div class="mb-8">
          <Text variant="h2" class="mb-4 block">PRICE ACTION & VOLUME</Text>
          <TickerPriceChart data={fullReport()!.history} />
        </div>
      )}

      <TickerTrendRadar
        fullReport={fullReport}
        selectedSymbol={selectedSymbol}
        stockInfo={stockInfo}
        setActiveModal={setActiveModal}
      />

      <TickerAnalystConsensus fullReport={fullReport} />

      <TickerRiskMetrics
        fullReport={fullReport}
        setActiveModal={setActiveModal}
        getSharpeGrade={getSharpeGrade}
        getSortinoGrade={getSortinoGrade}
        getVolGrade={getVolGrade}
        getDrawdownGrade={getDrawdownGrade}
      />

      <TickerValuationRatios
        fullReport={fullReport}
        setActiveModal={setActiveModal}
      />

      <TickerFormulaModals
        activeModal={activeModal}
        setActiveModal={setActiveModal}
      />

      {/* Standalone Dark-Mode Watchlist Modal */}
      <WatchlistModal
        isOpen={activeModal() === 'watchlist'}
        onClose={() => setActiveModal(null)}
        watchlist={watchlist}
        selectedSymbol={selectedSymbol}
        onSelectSymbol={(sym) => setSelectedSymbol(sym)}
        onAddSymbol={async (sym) => {
          const list = await addToWatchlist(sym);
          setWatchlist(list);
          setSelectedSymbol(sym);
        }}
        onRemoveSymbol={async (sym, e) => {
          await handleRemoveSymbol(sym, e);
        }}
      />

      <TickerFinancialStats stockInfo={stockInfo} />

      {/* 5-Year Annual Financial Statements (Balance Sheet, Income Statement, Cash Flow) */}
      {fullReport() && (
        <>
          <FinancialStatementViewer
            title="BALANCE SHEET STATEMENT (5-YEAR)"
            data={fullReport()?.balanceSheet}
          />
          <FinancialStatementViewer
            title="INCOME STATEMENT (5-YEAR)"
            data={fullReport()?.incomeStatement}
          />
          <FinancialStatementViewer
            title="CASH FLOW STATEMENT (5-YEAR)"
            data={fullReport()?.cashFlow}
            allowChart={false}
          />
        </>
      )}

      <TickerRawInspector fullReport={fullReport} selectedSymbol={selectedSymbol} />

      <TickerTradeHistory selectedSymbol={selectedSymbol} />
      {/* Floating Action Button (FAB) for Quick Watchlist Access */}
      <button
        onClick={() => setActiveModal('watchlist')}
        title="Open Watchlist"
        class="fixed bottom-6 right-6 z-40 bg-inverse-surface text-inverse-on-surface border-2 border-outline shadow-2xl rounded-full p-4 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer font-mono font-bold text-xs"
      >
        <span class="text-base">⭐</span>
        <span class="hidden md:inline">WATCHLIST ({watchlist().length})</span>
      </button>
    </PageLayout>
  );
}

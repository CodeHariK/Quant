import { Title } from '@solidjs/meta';
import { useSearchParams } from '@solidjs/router';
import { createSignal, createEffect } from 'solid-js';
import { PageLayout } from '../components/PageLayout';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { Chip, ChipColor } from '../components/Chip';
import { Table } from '../components/Table';
import { Input, FilledButton, OutlineButton } from '../components/FormControls';
import { FinancialStatementViewer } from '../components/FinancialStatementViewer';
import { Text } from '../components/Text';
import { fetchValuationReport, fetchWatchlist, addToWatchlist, removeFromWatchlist } from '../api/stockApi';
import type { FullValuationReport } from '../types/events';

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

  const [activeModal, setActiveModal] = createSignal<'sharpe' | 'sortino' | 'volatility' | 'drawdown' | 'dcf' | null>(null);

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

      {/* Watchlist Management & Asset Selector Bar */}
      <div class="border border-black bg-white p-4 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <Text variant="label">WATCHLIST (BOLTDB):</Text>
          <div class="flex flex-wrap items-center gap-2">
            {watchlist().map((sym) => (
              <Chip
                label={sym}
                color={selectedSymbol() === sym ? 'accent' : 'neutral'}
                onClick={() => setSelectedSymbol(sym)}
                onRemove={(e) => handleRemoveSymbol(sym, e)}
                class={selectedSymbol() === sym ? 'border-2 font-bold' : ''}
              />
            ))}
          </div>
        </div>

        {/* Add Symbol Form */}
        <form onSubmit={handleAddSymbol} class="flex items-center gap-2 w-full md:w-auto">
          <Input
            type="text"
            placeholder="ADD TICKER (e.g. GLD)"
            value={newSymbolInput()}
            onInput={(e) => setNewSymbolInput(e.currentTarget.value)}
            class="w-full md:w-64"
          />
          <FilledButton type="submit">
            + ADD
          </FilledButton>
        </form>
      </div>

      {loading() && <Text variant="muted" class="mb-4 block animate-pulse">Loading valuation report from BoltDB cache...</Text>}
      {error() && <Text variant="error" class="mb-4 block">{error()}</Text>}

      {/* Model & Stock Header */}
      <header class="border border-black bg-white p-6 relative mb-8">
        <div class="absolute top-0 left-0 w-full h-1 bg-black"></div>
        <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div class="flex items-center gap-3 mb-2 text-xs">
              <span class="w-3 h-3 bg-[#2fa84f] inline-block border border-black"></span>
              <Text variant="label">VALUATION ENGINE: YFINANCE (FULL RAW DATA)</Text>
              <Text variant="code" class="border border-gray-200 px-2 py-0.5 ml-2 font-bold">{stockInfo()?.symbol || selectedSymbol()}</Text>
            </div>
            <Text variant="h1" class="block">{stockInfo()?.longName || selectedSymbol()}</Text>
            <Text variant="muted" class="mt-2 block">
              SECTOR: {stockInfo()?.sector || 'N/A'} | INDUSTRY: {stockInfo()?.industry || 'N/A'}
            </Text>
          </div>
          <div class="flex gap-2 text-xs font-bold">
            <FilledButton
              onClick={() => loadStockReport(selectedSymbol(), true)}
              loading={loading()}
            >
              FORCE REFRESH 🔄
            </FilledButton>
            <OutlineButton>EXPORT VALUATION</OutlineButton>
          </div>
        </div>
      </header>

      {/* 🎯 INTRINSIC VALUATION & BUY/SELL ZONE RADAR HERO SECTION */}
      {fullReport() && (
        <div class="border-2 border-black bg-white p-6 mb-8 relative">
          <div class="flex justify-between items-center mb-4 border-b border-gray-200 pb-3">
            <div>
              <Text variant="h2" class="text-lg">🎯 QUANTITATIVE TREND & PRICE DEVIATION RADAR</Text>
              <Text variant="muted" class="block text-xs mt-1">1-Year Recency-Weighted Trend Price Baseline & Trend Deviation Radar</Text>
            </div>
            <button
              onClick={() => setActiveModal('dcf')}
              class="text-xs font-mono font-bold border border-black px-3 py-1 bg-gray-100 hover:bg-black hover:text-white transition-colors"
            >
              ℹ️ HOW TREND BASELINE IS CALCULATED
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
            {/* Valuation Status Badge */}
            <div class="border border-black p-4 bg-gray-50 dark:bg-zinc-900 text-center">
              <Text variant="label" class="block mb-1">TREND STATUS</Text>
              <Chip
                label={fullReport()?.valuationStatus?.replace('_', ' ') || 'EVALUATING'}
                color={
                  (fullReport()?.priceToTrendDeviation ?? fullReport()?.marginOfSafety ?? 0) >= 10
                    ? 'success'
                    : (fullReport()?.priceToTrendDeviation ?? fullReport()?.marginOfSafety ?? 0) <= -10
                    ? 'error'
                    : 'info'
                }
                class="text-sm py-1 px-3 font-bold"
              />
              <Text variant="muted" class="block mt-2 text-[10px]">
                {(fullReport()?.priceToTrendDeviation ?? fullReport()?.marginOfSafety ?? 0) >= 0
                  ? `${(fullReport()?.priceToTrendDeviation ?? fullReport()?.marginOfSafety ?? 0).toFixed(1)}% Below Trend Baseline`
                  : `${Math.abs(fullReport()?.priceToTrendDeviation ?? fullReport()?.marginOfSafety ?? 0).toFixed(1)}% Above Trend Baseline`}
              </Text>
            </div>

            {/* Fair Value vs Market Price */}
            <div class="border border-black p-4 bg-gray-50 dark:bg-zinc-900">
              <Text variant="label" class="block mb-1">WEIGHTED TREND BASELINE</Text>
              <Text variant="h1" class="text-2xl text-terminal-green font-bold block">
                {selectedSymbol().endsWith('.NS') || selectedSymbol().endsWith('.BO') || stockInfo()?.currency === 'INR' ? '₹' : '$'}
                {(fullReport()?.weightedTrendPrice ?? fullReport()?.intrinsicValue ?? 0).toFixed(2)}
              </Text>
              <Text variant="muted" class="block mt-1 text-[11px]">
                Current Price: <span class="font-bold text-black dark:text-white">
                  {selectedSymbol().endsWith('.NS') || selectedSymbol().endsWith('.BO') || stockInfo()?.currency === 'INR' ? '₹' : '$'}
                  {(fullReport()?.currentPrice ?? 0).toFixed(2)}
                </span>
              </Text>
            </div>

            {/* NEXT MONTH PRICE FORECAST */}
            <div class="border border-black p-4 bg-gray-50 dark:bg-zinc-900">
              <Text variant="label" class="block mb-1">
                NEXT MONTH FORECAST 🔮 ({(fullReport()?.monthlyGrowthPerc ?? 0) >= 0 ? '+' : ''}{(fullReport()?.monthlyGrowthPerc ?? 0).toFixed(2)}%)
              </Text>
              <Text variant="h1" class="text-2xl text-blue-500 font-bold block">
                {selectedSymbol().endsWith('.NS') || selectedSymbol().endsWith('.BO') || stockInfo()?.currency === 'INR' ? '₹' : '$'}
                {(fullReport()?.nextMonthForecast ?? 0).toFixed(2)}
              </Text>
              <Text variant="muted" class="block mt-1 text-[10px]">
                Range (±{(fullReport()?.monthlyVolPerc ?? 10).toFixed(1)}% Vol): <span class="font-bold text-black dark:text-white">
                  {selectedSymbol().endsWith('.NS') || selectedSymbol().endsWith('.BO') || stockInfo()?.currency === 'INR' ? '₹' : '$'}
                  {(fullReport()?.nextMonthMin ?? 0).toFixed(0)} - {(fullReport()?.nextMonthMax ?? 0).toFixed(0)}
                </span>
              </Text>
            </div>

            {/* Price to Trend Deviation */}
            <div class="border border-black p-4 bg-gray-50 dark:bg-zinc-900">
              <Text variant="label" class="block mb-1">TREND DEVIATION</Text>
              <Text
                variant={(fullReport()?.priceToTrendDeviation ?? fullReport()?.marginOfSafety ?? 0) >= 5 ? 'success' : (fullReport()?.priceToTrendDeviation ?? fullReport()?.marginOfSafety ?? 0) >= 0 ? 'accent' : 'error'}
                class="text-2xl font-bold block"
              >
                {(fullReport()?.priceToTrendDeviation ?? fullReport()?.marginOfSafety ?? 0) >= 0 ? '+' : ''}
                {(fullReport()?.priceToTrendDeviation ?? fullReport()?.marginOfSafety ?? 0).toFixed(1)}%
              </Text>
              <Text variant="muted" class="block mt-1 text-[11px]">Baseline Band: ±10.0%</Text>
            </div>

            {/* Recommendation Decision */}
            <div class="border border-black p-4 bg-black text-white text-center">
              <Text variant="label" class="block mb-1 text-gray-300">SIGNAL</Text>
              <Text variant="h1" class="text-xl text-[#00FF41] font-bold block tracking-wider">
                {fullReport()?.buySellZone?.replace('_', ' ') || 'HOLD'}
              </Text>
              <span class="text-[10px] uppercase font-mono text-gray-400 block mt-1">Quant Momentum Signal</span>
            </div>
          </div>
        </div>
      )}

      {/* Wall Street Analyst Consensus Recommendations Banner */}
      {fullReport()?.recommendations && (() => {
        const rec = fullReport()?.recommendations as any;
        const trend = Array.isArray(rec?.trend) && rec.trend.length > 0 ? rec.trend[0] : (rec?.trend ?? rec);
        return (
          <div class="border border-black bg-white p-4 mb-8">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-3 border-b border-gray-200 pb-2">
              <Text variant="label" class="font-bold text-xs">🏛️ WALL STREET ANALYST CONSENSUS RATINGS (CURRENT MONTH)</Text>
              <span class="text-[10px] font-mono text-gray-500">Source: Yahoo Finance Analyst Consensus</span>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div class="border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 p-3 text-center">
                <Text variant="label" class="text-[10px] text-emerald-800 dark:text-emerald-300 block mb-1">STRONG BUY</Text>
                <Text variant="h1" class="text-xl text-emerald-600 font-bold">
                  {trend?.strongBuy ?? trend?.StrongBuy ?? 0}
                </Text>
              </div>

              <div class="border border-green-300 bg-green-50 dark:bg-green-950/20 p-3 text-center">
                <Text variant="label" class="text-[10px] text-green-800 dark:text-green-300 block mb-1">BUY</Text>
                <Text variant="h1" class="text-xl text-green-600 font-bold">
                  {trend?.buy ?? trend?.Buy ?? 0}
                </Text>
              </div>

              <div class="border border-blue-300 bg-blue-50 dark:bg-blue-950/20 p-3 text-center">
                <Text variant="label" class="text-[10px] text-blue-800 dark:text-blue-300 block mb-1">HOLD</Text>
                <Text variant="h1" class="text-xl text-blue-600 font-bold">
                  {trend?.hold ?? trend?.Hold ?? 0}
                </Text>
              </div>

              <div class="border border-orange-300 bg-orange-50 dark:bg-orange-950/20 p-3 text-center">
                <Text variant="label" class="text-[10px] text-orange-800 dark:text-orange-300 block mb-1">SELL</Text>
                <Text variant="h1" class="text-xl text-orange-600 font-bold">
                  {trend?.sell ?? trend?.Sell ?? 0}
                </Text>
              </div>

              <div class="border border-red-300 bg-red-50 dark:bg-red-950/20 p-3 text-center">
                <Text variant="label" class="text-[10px] text-red-800 dark:text-red-300 block mb-1">STRONG SELL</Text>
                <Text variant="h1" class="text-xl text-red-600 font-bold">
                  {trend?.strongSell ?? trend?.StrongSell ?? 0}
                </Text>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Quant Risk & Volatility Metrics Header Grid with Colored Grade Badges & Formula Info Modals */}
      {fullReport() && (
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Sharpe Ratio Card */}
          <Card containerClass="border border-black bg-white p-4 relative flex flex-col justify-between">
            <div>
              <div class="flex justify-between items-start mb-2">
                <Text variant="label">SHARPE RATIO (5Y)</Text>
                <button
                  onClick={() => setActiveModal('sharpe')}
                  class="text-[11px] font-mono text-gray-500 hover:text-black dark:hover:text-white underline cursor-pointer"
                >
                  ℹ️ FORMULA
                </button>
              </div>
              <Text
                variant={(fullReport()?.sharpeRatio ?? 0) >= 1 ? 'success' : (fullReport()?.sharpeRatio ?? 0) >= 0 ? 'accent' : 'error'}
                class="text-2xl font-bold block"
              >
                {(fullReport()?.sharpeRatio ?? 0).toFixed(2)}
              </Text>
            </div>
            <div class="mt-3 flex items-center justify-between border-t border-gray-100 pt-2">
              <Text variant="muted" class="text-[10px]">Rf: 7.0% RBI</Text>
              <Chip
                label={`GRADE: ${getSharpeGrade(fullReport()?.sharpeRatio ?? 0).grade}`}
                color={getSharpeGrade(fullReport()?.sharpeRatio ?? 0).color}
                class="text-[10px] py-0.5 px-2"
              />
            </div>
          </Card>

          {/* Sortino Ratio Card */}
          <Card containerClass="border border-black bg-white p-4 relative flex flex-col justify-between">
            <div>
              <div class="flex justify-between items-start mb-2">
                <Text variant="label">SORTINO RATIO (5Y)</Text>
                <button
                  onClick={() => setActiveModal('sortino')}
                  class="text-[11px] font-mono text-gray-500 hover:text-black dark:hover:text-white underline cursor-pointer"
                >
                  ℹ️ FORMULA
                </button>
              </div>
              <Text
                variant={(fullReport()?.sortinoRatio ?? 0) >= 1.5 ? 'success' : (fullReport()?.sortinoRatio ?? 0) >= 0 ? 'accent' : 'error'}
                class="text-2xl font-bold block"
              >
                {!isFinite(fullReport()?.sortinoRatio ?? 0)
                  ? '∞ (PERFECT)'
                  : (fullReport()?.sortinoRatio ?? 0).toFixed(2)}
              </Text>
            </div>
            <div class="mt-3 flex items-center justify-between border-t border-gray-100 pt-2">
              <Text variant="muted" class="text-[10px]">Downside Vol Only</Text>
              <Chip
                label={`GRADE: ${getSortinoGrade(fullReport()?.sortinoRatio ?? 0).grade}`}
                color={getSortinoGrade(fullReport()?.sortinoRatio ?? 0).color}
                class="text-[10px] py-0.5 px-2"
              />
            </div>
          </Card>

          {/* Annual Volatility Card */}
          <Card containerClass="border border-black bg-white p-4 relative flex flex-col justify-between">
            <div>
              <div class="flex justify-between items-start mb-2">
                <Text variant="label">ANNUAL VOLATILITY</Text>
                <button
                  onClick={() => setActiveModal('volatility')}
                  class="text-[11px] font-mono text-gray-500 hover:text-black dark:hover:text-white underline cursor-pointer"
                >
                  ℹ️ FORMULA
                </button>
              </div>
              <Text variant="code" class="text-2xl font-bold block">
                {(fullReport()?.annualizedVolatility ?? 0).toFixed(2)}%
              </Text>
            </div>
            <div class="mt-3 flex items-center justify-between border-t border-gray-100 pt-2">
              <Text variant="muted" class="text-[10px]">252 Days Std Dev</Text>
              <Chip
                label={getVolGrade(fullReport()?.annualizedVolatility ?? 0).grade}
                color={getVolGrade(fullReport()?.annualizedVolatility ?? 0).color}
                class="text-[10px] py-0.5 px-2"
              />
            </div>
          </Card>

          {/* Max 5Y Drawdown Card */}
          <Card containerClass="border border-black bg-white p-4 relative flex flex-col justify-between">
            <div>
              <div class="flex justify-between items-start mb-2">
                <Text variant="label">MAX 5Y DRAWDOWN</Text>
                <button
                  onClick={() => setActiveModal('drawdown')}
                  class="text-[11px] font-mono text-gray-500 hover:text-black dark:hover:text-white underline cursor-pointer"
                >
                  ℹ️ FORMULA
                </button>
              </div>
              <Text variant="error" class="text-2xl font-bold block">
                -{(fullReport()?.maxDrawdown ?? 0).toFixed(2)}%
              </Text>
            </div>
            <div class="mt-3 flex items-center justify-between border-t border-gray-100 pt-2">
              <Text variant="muted" class="text-[10px]">Peak to Trough</Text>
              <Chip
                label={getDrawdownGrade(fullReport()?.maxDrawdown ?? 0).grade}
                color={getDrawdownGrade(fullReport()?.maxDrawdown ?? 0).color}
                class="text-[10px] py-0.5 px-2"
              />
            </div>
          </Card>
        </div>
      )}

      {/* Valuation Ratios Grid: PEG Ratio & Earnings Yield */}
      {fullReport() && (
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* PEG Ratio Card */}
          <Card containerClass="border border-black bg-white p-4 relative flex flex-col justify-between">
            <div>
              <div class="flex justify-between items-start mb-2">
                <Text variant="label">PEG RATIO (P/E to Growth)</Text>
                <button
                  onClick={() => setActiveModal('peg')}
                  class="text-[11px] font-mono text-gray-500 hover:text-black dark:hover:text-white underline cursor-pointer"
                >
                  ℹ️ FORMULA
                </button>
              </div>
              <Text
                variant={(fullReport()?.pegRatio ?? 0) > 0 && (fullReport()?.pegRatio ?? 0) <= 1.0 ? 'success' : (fullReport()?.pegRatio ?? 0) <= 2.0 ? 'accent' : 'error'}
                class="text-2xl font-bold block"
              >
                {(fullReport()?.pegRatio ?? 0) > 0 ? (fullReport()?.pegRatio ?? 0).toFixed(2) : 'N/A'}
              </Text>
            </div>
            <div class="mt-3 flex items-center justify-between border-t border-gray-100 pt-2">
              <Text variant="muted" class="text-[10px]">Bench: &lt;1.0 Cheap | &gt;2.0 Expensive</Text>
              <Chip
                label={
                  (fullReport()?.pegRatio ?? 0) > 0 && (fullReport()?.pegRatio ?? 0) <= 1.0
                    ? 'CHEAP (< 1.0)'
                    : (fullReport()?.pegRatio ?? 0) <= 2.0 && (fullReport()?.pegRatio ?? 0) > 0
                    ? 'FAIR (1.0 - 2.0)'
                    : 'EXPENSIVE (> 2.0)'
                }
                color={
                  (fullReport()?.pegRatio ?? 0) > 0 && (fullReport()?.pegRatio ?? 0) <= 1.0
                    ? 'success'
                    : (fullReport()?.pegRatio ?? 0) <= 2.0 && (fullReport()?.pegRatio ?? 0) > 0
                    ? 'info'
                    : 'error'
                }
                class="text-[10px] py-0.5 px-2"
              />
            </div>
          </Card>

          {/* Earnings Yield Card */}
          <Card containerClass="border border-black bg-white p-4 relative flex flex-col justify-between">
            <div>
              <div class="flex justify-between items-start mb-2">
                <Text variant="label">EARNINGS YIELD %</Text>
                <button
                  onClick={() => setActiveModal('earningsYield')}
                  class="text-[11px] font-mono text-gray-500 hover:text-black dark:hover:text-white underline cursor-pointer"
                >
                  ℹ️ FORMULA
                </button>
              </div>
              <Text
                variant={(fullReport()?.earningsYield ?? 0) >= 7.0 ? 'success' : 'error'}
                class="text-2xl font-bold block"
              >
                {(fullReport()?.earningsYield ?? 0).toFixed(2)}%
              </Text>
            </div>
            <div class="mt-3 flex items-center justify-between border-t border-gray-100 pt-2">
              <Text variant="muted" class="text-[10px]">Risk-Free Benchmark: 7.0% RBI Rate</Text>
              <Chip
                label={
                  (fullReport()?.earningsYield ?? 0) >= 7.0
                    ? 'BEATS RISK-FREE (>= 7%)'
                    : 'BELOW RISK-FREE (< 7%)'
                }
                color={(fullReport()?.earningsYield ?? 0) >= 7.0 ? 'success' : 'error'}
                class="text-[10px] py-0.5 px-2"
              />
            </div>
          </Card>
        </div>
      )}

      {/* Formula Explanation Modals */}
      <Modal
        isOpen={activeModal() === 'peg'}
        onClose={() => setActiveModal(null)}
        title="PEG Ratio (Price/Earnings-to-Growth)"
      >
        <p class="font-mono bg-gray-100 dark:bg-zinc-800 p-3 border border-black text-center font-bold">
          PEG Ratio = Trailing P/E / Annual Earnings Growth Rate (%)
        </p>
        <div class="space-y-2 text-xs">
          <p><strong>Overview:</strong> The PEG ratio adjusts the standard Price-to-Earnings ratio by taking the company's expected earnings growth rate into account.</p>
          <p><strong>Interpretation Guide:</strong></p>
          <ul class="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
            <li><strong>PEG &lt; 1.0 (CHEAP):</strong> The stock is trading at a discount relative to its annual earnings growth rate. High growth at a bargain valuation.</li>
            <li><strong>1.0 &le; PEG &le; 2.0 (FAIR):</strong> Fairly valued relative to earnings growth.</li>
            <li><strong>PEG &gt; 2.0 (EXPENSIVE):</strong> You are paying a heavy valuation premium for limited earnings growth.</li>
          </ul>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal() === 'earningsYield'}
        onClose={() => setActiveModal(null)}
        title="Earnings Yield (Equity Yield vs Risk-Free Rate)"
      >
        <p class="font-mono bg-gray-100 dark:bg-zinc-800 p-3 border border-black text-center font-bold">
          Earnings Yield (%) = (Earnings Per Share / Current Stock Price) &times; 100
        </p>
        <div class="space-y-2 text-xs">
          <p><strong>Overview:</strong> Earnings Yield is the reciprocal of the Price-to-Earnings ratio (1 / PE). It measures the percentage of net profit the company generates per dollar invested in the stock.</p>
          <p><strong>Risk-Free Hurdle Rate Comparison:</strong> Evaluated against the <strong>7.0% RBI Risk-Free Benchmark Rate</strong>.</p>
          <ul class="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
            <li><strong>Yield &ge; 7.0% (BEATS RISK-FREE):</strong> The equity investment yields more return than guaranteed risk-free government bonds.</li>
            <li><strong>Yield &lt; 7.0% (BELOW RISK-FREE):</strong> The stock yields less than risk-free treasury bonds. The stock is mathematically overvalued unless earnings grow rapidly.</li>
          </ul>
        </div>
      </Modal>

      {/* Formula Explanation Modals */}
      <Modal
        isOpen={activeModal() === 'sharpe'}
        onClose={() => setActiveModal(null)}
        title="Sharpe Ratio (Risk-Adjusted Return)"
      >
        <p class="font-mono bg-gray-100 dark:bg-zinc-800 p-3 border border-black text-center font-bold">
          Sharpe Ratio = (Rp - Rf) / σp
        </p>
        <div class="space-y-2 text-xs">
          <p><strong>Rp:</strong> Annualized return of the stock computed over 5 years of daily price closes.</p>
          <p><strong>Rf:</strong> Risk-free rate of return (assumed at 7.0% based on standard RBI 10Y Indian Govt Bonds / US Treasury yields).</p>
          <p><strong>σp:</strong> Annualized standard deviation (volatility) of total daily returns (scaled across 252 trading days).</p>
        </div>
        <div class="border-t border-gray-200 pt-2 text-[11px] text-gray-600 dark:text-gray-300">
          <strong>Grade Scale:</strong> &ge;3.0 (Excellent) | &ge;2.0 (Very Good) | &ge;1.0 (Good) | &ge;0 (Acceptable) | &lt;0 (Poor).
        </div>
      </Modal>

      <Modal
        isOpen={activeModal() === 'sortino'}
        onClose={() => setActiveModal(null)}
        title="Sortino Ratio (Downside Risk-Adjusted)"
      >
        <p class="font-mono bg-gray-100 dark:bg-zinc-800 p-3 border border-black text-center font-bold">
          Sortino Ratio = (Rp - Rf) / σd
        </p>
        <div class="space-y-2 text-xs">
          <p><strong>Rp:</strong> Annualized return of the stock over 5 years.</p>
          <p><strong>Rf:</strong> Risk-free rate of return (7.0%).</p>
          <p><strong>σd:</strong> Downside volatility. Unlike Sharpe ratio which penalizes both upside and downside price swings, Sortino only calculates volatility for negative daily returns below the risk-free rate.</p>
        </div>
        <div class="border-t border-gray-200 pt-2 text-[11px] text-gray-600 dark:text-gray-300">
          A high Sortino ratio relative to Sharpe indicates that most of the stock's volatility comes from positive upside growth rallies!
        </div>
      </Modal>

      <Modal
        isOpen={activeModal() === 'volatility'}
        onClose={() => setActiveModal(null)}
        title="Annualized Volatility (%)"
      >
        <p class="font-mono bg-gray-100 dark:bg-zinc-800 p-3 border border-black text-center font-bold">
          Annualized Volatility = Standard Deviation(Daily Returns) × √252
        </p>
        <div class="space-y-2 text-xs">
          <p>Measures the dispersion of price returns around their mean over a 252-day trading year.</p>
          <p>Higher volatility means larger price swings, requiring wider risk management and position sizing.</p>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal() === 'drawdown'}
        onClose={() => setActiveModal(null)}
        title="Maximum 5-Year Drawdown (%)"
      >
        <p class="font-mono bg-gray-100 dark:bg-zinc-800 p-3 border border-black text-center font-bold">
          Max Drawdown = (Peak Value - Trough Value) / Peak Value
        </p>
        <div class="space-y-2 text-xs">
          <p>Measures the worst historical loss an investor would have suffered buying at the 5-year peak before price bottomed out.</p>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal() === 'dcf'}
        onClose={() => setActiveModal(null)}
        title="1-Year Recency-Weighted Monthly Mean Valuation Engine"
      >
        <p class="font-mono bg-gray-100 dark:bg-zinc-800 p-3 border border-black text-center font-bold">
          Fair Value Target = ∑ [ Month_Mean × Weight ] / Total_Weights (12 Months)
        </p>
        <div class="space-y-2 text-xs">
          <p><strong>Monthly High/Low Mean:</strong> Takes `(Monthly High + Monthly Low) / 2` for each of the past 12 months.</p>
          <p><strong>Linear Recency Weighting:</strong> Gives higher weight to more recent months (Month 12 weight = 12, Month 1 weight = 1).</p>
          <p><strong>Monthly Volatility Percentage Range 🔮:</strong> Calculates `(Monthly High - Monthly Low) / MonthAvg` for each month, averages the % spread across 12 months, and applies this mean % volatility to forecast next month's expected price range.</p>
          <p><strong>Margin of Safety:</strong> % Discount or Premium of the current stock market price relative to the 1-Year weighted average mean price.</p>
          <div class="bg-surface dark:bg-zinc-800 p-3 border border-gray-300 dark:border-zinc-700 mt-2">
            <p class="font-bold text-black dark:text-white mb-1">Buy/Sell Zone Guide:</p>
            <ul class="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
              <li><strong>STRONG BUY / BUY:</strong> Stock is trading at a &gt;3-10% discount below its recency-weighted mean.</li>
              <li><strong>HOLD:</strong> Stock is trading close to its 1-year recency-weighted mean.</li>
              <li><strong>SELL / STRONG SELL:</strong> Stock is trading at a &gt;3-10% premium above its recency-weighted mean.</li>
            </ul>
          </div>
        </div>
      </Modal>

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
          if (val === null || val === undefined) return <Text variant="muted">null</Text>;
          if (typeof val === 'object') return <pre class="font-mono text-xs bg-gray-100 p-2 overflow-x-auto">{JSON.stringify(val, null, 2)}</pre>;
          if (typeof val === 'number') return <Text variant="success">{val.toLocaleString()}</Text>;
          if (typeof val === 'boolean') return <Text variant="accent">{val ? 'TRUE' : 'FALSE'}</Text>;
          return <Text variant="code">{String(val)}</Text>;
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
                    <Text variant="h3" class="text-xs">{cat.title}</Text>
                    <Text variant="muted">{items.length} METRICS</Text>
                  </div>

                  <div class="divide-y divide-gray-200">
                    {items.map(([key, val]) => (
                      <div class="px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-2 hover:bg-gray-50 transition-colors">
                        <Text variant="label" class="md:w-1/3">{key}</Text>
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

      {/* Raw Complete JSON Payload Inspector */}
      {fullReport() && (
        <section class="border border-black bg-white p-4 mb-8 overflow-hidden">
          <div class="font-bold text-xs uppercase mb-2 border-b border-gray-200 pb-2 flex justify-between items-center">
            <Text variant="label">FULL 5-YEAR UNTRUNCATED JSON PAYLOAD ({selectedSymbol()})</Text>
            <Text variant="muted">Fetched At: {fullReport()?.fetchedAt}</Text>
          </div>
          <pre class="bg-gray-50 dark:bg-zinc-900 text-xs p-4 overflow-x-auto max-h-96 border border-gray-300 font-mono">
            {JSON.stringify(fullReport(), null, 2)}
          </pre>
        </section>
      )}

      {/* Trade History Table */}
      <section class="border border-black bg-white overflow-hidden">
        <div class="border-b border-gray-200 p-3 bg-gray-50 flex justify-between items-center text-xs">
          <Text variant="h3" class="text-xs">RECENT EXECUTION LOG</Text>
          <Text variant="muted">Showing last 5 trades</Text>
        </div>
        <Table
          columns={[
            {
              header: 'TIMESTAMP',
              cell: (row) => <Text variant="muted">{row.timestamp}</Text>,
              className: 'p-3',
            },
            {
              header: 'SYMBOL',
              cell: (row) => <Text variant="code" class="font-bold">{row.symbol}</Text>,
              className: 'p-3',
            },
            {
              header: 'TYPE',
              cell: (row) => <Text variant={row.type === 'LONG' ? 'success' : 'error'}>{row.type}</Text>,
              className: 'p-3',
            },
            {
              header: 'ENTRY',
              cell: (row) => <Text variant="code">{row.entry}</Text>,
              className: 'p-3',
            },
            {
              header: 'EXIT',
              cell: (row) => <Text variant="code">{row.exit}</Text>,
              className: 'p-3',
            },
            {
              header: 'P&L',
              cell: (row) => <Text variant="success" class="text-right block">{row.pnl}</Text>,
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

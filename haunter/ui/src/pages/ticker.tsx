import { useSearchParams } from '@solidjs/router';
import { createSignal, createEffect } from 'solid-js';
import { useAppStore } from '../store/appStore';
import { PageLayout } from '../pages/components/PageLayout';
import { ChipColor } from '../primitives/Chip';
import { FinancialStatementViewer } from '../pages/components/FinancialStatementViewer';
import { Text } from '../primitives/Text';
import { fetchValuationReport } from '../api/stockApi';
import type { FullValuationReport } from '../types/events';
import { TickerHeader } from './components/ticker/TickerHeader';
import { TickerTrendRadar } from './components/ticker/TickerTrendRadar';
import { TickerRiskMetrics } from './components/ticker/TickerRiskMetrics';
import { TickerValuationRatios } from './components/ticker/TickerValuationRatios';
import { TickerFormulaModals } from './components/ticker/TickerFormulaModals';
import { TickerFinancialStats } from './components/ticker/TickerFinancialStats';
import { TickerRawInspector } from './components/ticker/TickerRawInspector';
import { TickerPriceChart } from './components/ticker/TickerPriceChart';


export default function Ticker() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial symbol from URL query parameter (e.g. ?symbol=GVT%26D.NS or ?symbol=AAPL)
  const rawSymbol = Array.isArray(searchParams.symbol) ? searchParams.symbol[0] : searchParams.symbol;
  const initialSymbol = rawSymbol ? decodeURIComponent(rawSymbol) : 'GLD';

  const [selectedSymbol, setSelectedSymbol] = createSignal<string>(initialSymbol);
  const [fullReport, setFullReport] = createSignal<FullValuationReport | null>(null);
  const [loading, setLoading] = createSignal<boolean>(false);
  const [error, setError] = createSignal<string | null>(null);

  const { timeframe } = useAppStore();

  const loadStockReport = (sym: string, force = false, period = timeframe()) => {
    setLoading(true);
    setError(null);
    fetchValuationReport(sym, force, period)
      .then((report) => {
        setFullReport(report);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  // Whenever selectedSymbol or timeframe changes: load report and update URL query parameter
  createEffect(
    () => [selectedSymbol(), timeframe()] as const,
    ([sym, tf]) => {
      if (sym) {
        setSearchParams({ symbol: sym });
        loadStockReport(sym, false, tf); // Load from BoltDB cache
      }
    }
  );



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
    <PageLayout title={`${selectedSymbol()} - Stock Report`}>

      {loading() && <Text variant="muted" class="mb-4 block animate-pulse">Loading valuation report from BoltDB cache...</Text>}
      {error() && <Text status="error" class="mb-4 block">{error()}</Text>}

      <TickerHeader
        selectedSymbol={selectedSymbol}
        stockInfo={stockInfo}
        fullReport={fullReport}
        loading={loading}
        loadStockReport={loadStockReport}
      />

      <TickerTrendRadar
        fullReport={fullReport}
        selectedSymbol={selectedSymbol}
        stockInfo={stockInfo}
        setActiveModal={setActiveModal}
      />



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

      {fullReport()?.history && fullReport()!.history.length > 0 && (
        <div class="mb-8">
          <Text variant="h2" class="mb-4 block">PRICE ACTION & VOLUME</Text>
          <TickerPriceChart data={fullReport()!.history} />
        </div>
      )}

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

    </PageLayout>
  );
}

import { Title } from '@solidjs/meta';
import { createSignal, createEffect } from 'solid-js';
import { PageLayout } from '../components/PageLayout';
import { Table } from '../components/Table';
import { fetchStockInfo } from '../api/stockApi';
import type { StockInfo } from '../types/events';

export default function ModelDetail() {
  const [selectedSymbol, setSelectedSymbol] = createSignal<string>('RELIANCE.NS');
  const [stockInfo, setStockInfo] = createSignal<StockInfo | null>(null);
  const [loading, setLoading] = createSignal<boolean>(false);
  const [error, setError] = createSignal<string | null>(null);

  const stocks = [
    { label: 'RELIANCE (NSE)', symbol: 'RELIANCE.NS' },
    { label: 'TATA MOTORS (NSE)', symbol: 'TATAMOTORS.NS' },
    { label: 'INFOSYS (NSE)', symbol: 'INFY.NS' },
    { label: 'TCS (NSE)', symbol: 'TCS.NS' },
    { label: 'APPLE (NASDAQ)', symbol: 'AAPL' },
    { label: 'MICROSOFT (NASDAQ)', symbol: 'MSFT' },
    { label: 'NVIDIA (NASDAQ)', symbol: 'NVDA' },
  ];

  createEffect(
    () => selectedSymbol(),
    (sym) => {
      setLoading(true);
      setError(null);
      fetchStockInfo(sym)
        .then((info) => {
          setStockInfo(info);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    }
  );

  return (
    <PageLayout showSidebar={false}>
      <Title>Model & Stock Valuation - ALPHA ARENA</Title>

      {/* Stock Selection Bar */}
      <div class="border border-black bg-white p-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div class="flex items-center gap-3">
          <label class="font-label-caps text-label-caps text-muted-gray uppercase">SELECT ASSET FOR VALUATION:</label>
          <select
            value={selectedSymbol()}
            onChange={(e) => setSelectedSymbol(e.currentTarget.value)}
            class="border border-black bg-white py-1 px-3 font-code-md text-code-md font-bold uppercase cursor-pointer"
          >
            {stocks.map((s) => (
              <option value={s.symbol}>{s.label}</option>
            ))}
          </select>
        </div>
        {loading() && <span class="font-code-md text-code-md text-muted-gray animate-pulse">Fetching yfinance data...</span>}
        {error() && <span class="font-code-md text-code-md text-critical-red">{error()}</span>}
      </div>

      {/* Model & Stock Header */}
      <header class="border border-black bg-white p-6 relative mb-8">
        <div class="absolute top-0 left-0 w-full h-1 bg-black"></div>
        <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div class="flex items-center gap-3 mb-2 text-xs">
              <span class="w-3 h-3 bg-[#00FF41] inline-block border border-black"></span>
              <span class="uppercase font-bold">VALUATION ENGINE: YFINANCE</span>
              <span class="text-gray-500 border border-gray-200 px-2 py-0.5 ml-2 font-bold">{stockInfo()?.symbol || selectedSymbol()}</span>
            </div>
            <h1 class="text-3xl text-black uppercase tracking-tight font-bold">{stockInfo()?.longName || selectedSymbol()}</h1>
            <p class="text-xs text-gray-500 mt-2 font-mono">
              SECTOR: {stockInfo()?.sector || 'N/A'} | INDUSTRY: {stockInfo()?.industry || 'N/A'}
            </p>
          </div>
          <div class="flex gap-2 text-xs font-bold">
            <button class="bg-black text-white px-4 py-2 border border-black hover:bg-gray-800">REFRESH DATA</button>
            <button class="bg-transparent border border-black text-black px-4 py-2 hover:bg-gray-100">EXPORT VALUATION</button>
          </div>
        </div>
      </header>

      {/* Key Metrics Bar from yfinance */}
      <section class="grid grid-cols-2 md:grid-cols-4 gap-0 border border-black bg-white mb-6">
        <div class="p-4 border-r border-b md:border-b-0 border-gray-200 flex flex-col justify-center">
          <span class="font-label-caps text-label-caps text-muted-gray mb-1">CURRENT PRICE</span>
          <span class="font-headline-md text-headline-md font-bold text-black">${stockInfo()?.currentPrice?.toFixed(2) || '0.00'}</span>
        </div>
        <div class="p-4 border-r border-b md:border-b-0 border-gray-200 flex flex-col justify-center">
          <span class="font-label-caps text-label-caps text-muted-gray mb-1">TRAILING P/E</span>
          <span class="font-headline-md text-headline-md font-bold text-terminal-green">
            {stockInfo()?.trailingPE ? stockInfo()?.trailingPE?.toFixed(2) : 'N/A'}
          </span>
        </div>
        <div class="p-4 border-r border-b md:border-b-0 border-gray-200 flex flex-col justify-center">
          <span class="font-label-caps text-label-caps text-muted-gray mb-1">FORWARD P/E</span>
          <span class="font-headline-md text-headline-md font-bold text-black">
            {stockInfo()?.forwardPE ? stockInfo()?.forwardPE?.toFixed(2) : 'N/A'}
          </span>
        </div>
        <div class="p-4 flex flex-col justify-center">
          <span class="font-label-caps text-label-caps text-muted-gray mb-1">PRICE / BOOK</span>
          <span class="font-headline-md text-headline-md font-bold text-black">
            {stockInfo()?.priceToBook ? stockInfo()?.priceToBook?.toFixed(2) : 'N/A'}
          </span>
        </div>
      </section>

      {/* Extended Valuation & Financial Statement Metrics */}
      <section class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="border border-black bg-white p-4">
          <div class="font-label-caps text-label-caps text-muted-gray mb-2 border-b border-gray-200 pb-1">EBITDA</div>
          <div class="font-headline-sm text-headline-sm font-bold text-primary">
            {stockInfo()?.ebitda ? `$${(stockInfo()!.ebitda / 1e9).toFixed(2)}B` : 'N/A'}
          </div>
        </div>
        <div class="border border-black bg-white p-4">
          <div class="font-label-caps text-label-caps text-muted-gray mb-2 border-b border-gray-200 pb-1">DEBT TO EQUITY</div>
          <div class="font-headline-sm text-headline-sm font-bold text-primary">
            {stockInfo()?.debtToEquity ? `${stockInfo()?.debtToEquity?.toFixed(2)}%` : 'N/A'}
          </div>
        </div>
        <div class="border border-black bg-white p-4">
          <div class="font-label-caps text-label-caps text-muted-gray mb-2 border-b border-gray-200 pb-1">TOTAL CASH / DEBT</div>
          <div class="font-code-md text-code-md font-bold text-primary">
            {stockInfo()?.totalCash ? `$${(stockInfo()!.totalCash / 1e9).toFixed(1)}B` : '$0'} / {stockInfo()?.totalDebt ? `$${(stockInfo()!.totalDebt / 1e9).toFixed(1)}B` : '$0'}
          </div>
        </div>
        <div class="border border-black bg-white p-4">
          <div class="font-label-caps text-label-caps text-muted-gray mb-2 border-b border-gray-200 pb-1">PROFIT MARGIN</div>
          <div class="font-headline-sm text-headline-sm font-bold text-terminal-green">
            {stockInfo()?.profitMargins ? `${(stockInfo()!.profitMargins * 100).toFixed(2)}%` : 'N/A'}
          </div>
        </div>
      </section>

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

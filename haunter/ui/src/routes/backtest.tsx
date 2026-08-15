import { Title } from '@solidjs/meta';
import { LightweightChart } from '../components/LightweightChart';
import { PageLayout } from '../components/PageLayout';
import { Table } from '../components/Table';
import { AreaData, Time } from 'lightweight-charts';

export default function Backtest() {
  const sampleEquityData: AreaData<Time>[] = [
    { time: '2023-01-01', value: 100000 },
    { time: '2023-02-01', value: 108500 },
    { time: '2023-03-01', value: 106200 },
    { time: '2023-04-01', value: 114800 },
    { time: '2023-05-01', value: 112000 },
    { time: '2023-06-01', value: 122500 },
    { time: '2023-07-01', value: 119000 },
    { time: '2023-08-01', value: 128400 },
    { time: '2023-09-01', value: 125100 },
    { time: '2023-10-01', value: 136200 },
    { time: '2023-11-01', value: 132000 },
    { time: '2023-12-01', value: 142500 },
  ];

  return (
    <PageLayout showSidebar={true}>
      <Title>Alpha Arena - Backtest</Title>

      <div class="flex flex-col lg:flex-row gap-4 h-full">
        {/* Configuration Sidebar */}
        <div class="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4">
          <div class="border border-primary bg-surface p-4">
            <h2 class="font-headline-sm text-headline-sm border-b border-subtle pb-2 mb-4 uppercase flex items-center justify-between">
              Configuration
              <span class="w-2 h-2 rounded-full bg-terminal-green"></span>
            </h2>
            <div class="space-y-4">
              <div>
                <label class="block font-label-caps text-label-caps text-muted-gray mb-1 uppercase">Model Selection</label>
                <select class="w-full border border-primary bg-transparent py-1 px-2 font-code-md text-code-md focus:border-[2px] focus:outline-none focus:ring-0 rounded-none appearance-none cursor-pointer">
                  <option>ALPHA-V1-FAST</option>
                  <option>ALPHA-V2-DEEP</option>
                  <option>OMEGA-QUANT-X</option>
                </select>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block font-label-caps text-label-caps text-muted-gray mb-1 uppercase">Start Date</label>
                  <input class="w-full border border-primary bg-transparent py-1 px-2 font-code-md text-code-md focus:border-[2px] focus:outline-none focus:ring-0 rounded-none" type="date" value="2020-01-01" />
                </div>
                <div>
                  <label class="block font-label-caps text-label-caps text-muted-gray mb-1 uppercase">End Date</label>
                  <input class="w-full border border-primary bg-transparent py-1 px-2 font-code-md text-code-md focus:border-[2px] focus:outline-none focus:ring-0 rounded-none" type="date" value="2023-12-31" />
                </div>
              </div>
              <div>
                <label class="block font-label-caps text-label-caps text-muted-gray mb-1 uppercase">Starting Capital</label>
                <div class="relative">
                  <span class="absolute left-2 top-1/2 -translate-y-1/2 font-code-md text-code-md">$</span>
                  <input class="w-full border border-primary bg-transparent py-1 pl-6 pr-2 font-code-md text-code-md focus:border-[2px] focus:outline-none focus:ring-0 rounded-none" type="text" value="100,000" />
                </div>
              </div>
              <div class="pt-2 border-t border-subtle">
                <label class="block font-label-caps text-label-caps text-primary mb-2 uppercase">Strategy Parameters</label>
                <div class="space-y-3">
                  <div>
                    <div class="flex justify-between font-label-sm text-label-sm text-muted-gray mb-1">
                      <span>Lookback Period</span>
                      <span>14 Days</span>
                    </div>
                    <input class="w-full accent-primary h-1 bg-border-subtle appearance-none cursor-pointer" max="60" min="1" type="range" value="14" />
                  </div>
                  <div>
                    <div class="flex justify-between font-label-sm text-label-sm text-muted-gray mb-1">
                      <span>Stop Loss</span>
                      <span>2.5%</span>
                    </div>
                    <input class="w-full accent-primary h-1 bg-border-subtle appearance-none cursor-pointer" max="10" min="0.1" step="0.1" type="range" value="2.5" />
                  </div>
                </div>
              </div>
              <button class="w-full bg-primary text-on-primary font-label-caps text-label-caps py-2 border border-primary hover:bg-inverse-surface transition-colors mt-4">
                RUN BACKTEST
              </button>
            </div>
          </div>
        </div>

        {/* Results Canvas */}
        <div class="flex-1 flex flex-col gap-4">
          <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div class="border border-primary bg-surface p-3 flex flex-col justify-between">
              <span class="font-label-sm text-label-sm text-muted-gray uppercase">Total Return</span>
              <span class="font-headline-md text-headline-md text-terminal-green">+142.5%</span>
            </div>
            <div class="border border-primary bg-surface p-3 flex flex-col justify-between">
              <span class="font-label-sm text-label-sm text-muted-gray uppercase">Ann. Return</span>
              <span class="font-headline-md text-headline-md text-primary">24.7%</span>
            </div>
            <div class="border border-primary bg-surface p-3 flex flex-col justify-between">
              <span class="font-label-sm text-label-sm text-muted-gray uppercase">Sharpe Ratio</span>
              <span class="font-headline-md text-headline-md text-primary">1.84</span>
            </div>
            <div class="border border-primary bg-surface p-3 flex flex-col justify-between">
              <span class="font-label-sm text-label-sm text-muted-gray uppercase">Sortino Ratio</span>
              <span class="font-headline-md text-headline-md text-primary">2.61</span>
            </div>
            <div class="border border-primary bg-surface p-3 flex flex-col justify-between">
              <span class="font-label-sm text-label-sm text-muted-gray uppercase">Max Drawdown</span>
              <span class="font-headline-md text-headline-md text-critical-red">-14.2%</span>
            </div>
          </div>

          {/* Equity Curve Chart rendered with TradingView Lightweight Charts */}
          <div class="border border-primary bg-surface flex-1 min-h-[350px] flex flex-col relative overflow-hidden">
            <div class="p-2 border-b border-subtle flex justify-between items-center z-10 bg-surface">
              <h3 class="font-label-caps text-label-caps uppercase">Equity Curve (TradingView Lightweight)</h3>
              <div class="flex gap-2">
                <span class="bg-surface-container-low border border-subtle px-2 py-0.5 font-label-sm text-label-sm">LOG</span>
                <span class="bg-primary text-on-primary border border-primary px-2 py-0.5 font-label-sm text-label-sm">LIN</span>
              </div>
            </div>
            <div class="flex-1 w-full h-full relative">
              <LightweightChart data={sampleEquityData} />
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 h-64">
            <div class="border border-primary bg-surface flex flex-col">
              <h3 class="font-label-caps text-label-caps uppercase p-2 border-b border-subtle">Trade Dist</h3>
              <div class="flex-1 p-2 flex items-end gap-1 px-4 relative grid-bg">
                <div class="w-full bg-critical-red h-[10%]" title="-5%"></div>
                <div class="w-full bg-critical-red h-[30%]" title="-2%"></div>
                <div class="w-full bg-surface-tint h-[80%]" title="0%"></div>
                <div class="w-full bg-terminal-green h-[50%]" title="+2%"></div>
                <div class="w-full bg-terminal-green h-[20%]" title="+5%"></div>
              </div>
            </div>

            <div class="border border-primary bg-surface lg:col-span-2 flex flex-col overflow-hidden">
              <h3 class="font-label-caps text-label-caps uppercase p-2 border-b border-subtle">Simulated Trade Log</h3>
              <div class="flex-1 overflow-auto">
                <Table
                  containerClass="w-full overflow-x-auto"
                  tableClass="w-full text-left border-collapse"
                  headerClass="sticky top-0 bg-surface z-10 border-b border-primary font-label-caps text-label-caps"
                  columns={[
                    { header: 'TIMESTAMP', accessor: 'timestamp', className: 'p-2' },
                    {
                      header: 'ACTION',
                      cell: (row) => (
                        <span class={`bg-surface-container-low border border-primary px-1 font-bold ${row.action === 'BUY' ? 'text-terminal-green' : 'text-critical-red'}`}>
                          {row.action}
                        </span>
                      ),
                      className: 'p-2',
                    },
                    { header: 'ASSET', accessor: 'asset', className: 'p-2 font-bold' },
                    { header: 'PRICE', accessor: 'price', className: 'p-2' },
                    {
                      header: 'P/L',
                      cell: (row) => (
                        <span class={`font-bold ${row.pl.startsWith('+') ? 'text-terminal-green' : row.pl.startsWith('-') ? 'text-critical-red' : 'text-muted-gray'}`}>
                          {row.pl}
                        </span>
                      ),
                      align: 'right',
                      className: 'p-2 text-right',
                    },
                  ]}
                  data={[
                    { timestamp: '2023-11-01 09:30', action: 'BUY', asset: 'TSLA', price: '$210.50', pl: '+$450.00' },
                    { timestamp: '2023-11-02 14:15', action: 'SELL', asset: 'AAPL', price: '$175.20', pl: '-$120.50' },
                    { timestamp: '2023-11-03 10:00', action: 'BUY', asset: 'NVDA', price: '$450.00', pl: '+$1,200.00' },
                    { timestamp: '2023-11-04 11:45', action: 'BUY', asset: 'MSFT', price: '$340.10', pl: '$0.00' },
                  ]}
                  rowClass={() => 'border-b border-subtle hover:bg-surface-container transition-colors cursor-pointer font-code-md text-code-md'}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

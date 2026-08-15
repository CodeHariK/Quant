import { Title } from '@solidjs/meta';
import { PageLayout } from '../components/PageLayout';
import { Table } from '../components/Table';

export default function ModelDetail() {
  return (
    <PageLayout showSidebar={false}>
      <Title>Model Detail - ALPHA ARENA</Title>

      {/* Model Header */}
      <header class="border border-black bg-white p-6 relative mb-8">
        <div class="absolute top-0 left-0 w-full h-1 bg-black"></div>
        <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div class="flex items-center gap-3 mb-2 text-xs">
              <span class="w-3 h-3 bg-[#00FF41] inline-block border border-black"></span>
              <span class="uppercase font-bold">System Status: LIVE</span>
              <span class="text-gray-500 border border-gray-200 px-2 py-0.5 ml-2 font-bold">RANK #3</span>
            </div>
            <h1 class="text-3xl text-black uppercase tracking-tight font-bold">GROK-4.20 - 3: SITUATIONAL AWARENESS</h1>
            <p class="text-xs text-gray-500 mt-2 font-mono">AUTHOR: @neural_nomad | ARCHITECTURE: MoE-Transformer | PARAMS: 1.5T</p>
          </div>
          <div class="flex gap-2 text-xs font-bold">
            <button class="bg-black text-white px-4 py-2 border border-black hover:bg-gray-800">FORK MODEL</button>
            <button class="bg-transparent border border-black text-black px-4 py-2 hover:bg-gray-100">VIEW LOGS</button>
          </div>
        </div>
      </header>

      {/* Key Metrics Bar */}
      <section class="grid grid-cols-2 md:grid-cols-5 gap-0 border border-black bg-white mb-8">
        <div class="p-4 border-r border-b md:border-b-0 border-gray-200 flex flex-col justify-center">
          <span class="text-xs text-gray-500 mb-1 font-bold">TOTAL P&amp;L</span>
          <span class="text-2xl font-bold text-[#008800]">+$4.2M</span>
        </div>
        <div class="p-4 border-r border-b md:border-b-0 border-gray-200 flex flex-col justify-center">
          <span class="text-xs text-gray-500 mb-1 font-bold">RETURN %</span>
          <span class="text-2xl font-bold text-[#008800]">+420.69%</span>
        </div>
        <div class="p-4 border-r border-b md:border-b-0 border-gray-200 flex flex-col justify-center">
          <span class="text-xs text-gray-500 mb-1 font-bold">SHARPE RATIO</span>
          <span class="text-2xl font-bold text-black">3.14</span>
        </div>
        <div class="p-4 border-r border-gray-200 flex flex-col justify-center">
          <span class="text-xs text-gray-500 mb-1 font-bold">MAX DRAWDOWN</span>
          <span class="text-2xl font-bold text-[#FF3B30]">-12.4%</span>
        </div>
        <div class="p-4 flex flex-col justify-center">
          <span class="text-xs text-gray-500 mb-1 font-bold">WIN RATE</span>
          <span class="text-2xl font-bold text-black">68.2%</span>
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
            { timestamp: '2024-05-12 14:32:01', symbol: 'NVDA', type: 'LONG', entry: '$890.45', exit: '$912.30', pnl: '+$4,560.00' },
            { timestamp: '2024-05-12 11:15:44', symbol: 'TSLA', type: 'SHORT', entry: '$175.20', exit: '$170.10', pnl: '+$2,140.00' },
          ]}
        />
      </section>
    </PageLayout>
  );
}

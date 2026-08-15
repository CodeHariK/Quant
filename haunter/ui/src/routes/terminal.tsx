import { Title } from '@solidjs/meta';
import { PageLayout } from '../components/PageLayout';

export default function Terminal() {
  return (
    <PageLayout showSidebar={false} mainClass="flex-1 p-0 overflow-hidden">
      <Title>Terminal View - Alpha Arena Analytics</Title>

      {/* Main IDE/Terminal Layout */}
      <div class="flex flex-col md:flex-row w-full h-[calc(100vh-64px-40px)] overflow-hidden">
        {/* Left Sidebar: Live Data Streams */}
        <aside class="w-full md:w-64 border-r border-gray-200 bg-white flex flex-col h-full overflow-y-auto">
          <div class="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h2 class="text-xs font-bold text-gray-500">LIVE TICKERS</h2>
            <div class="w-2 h-2 rounded-full bg-[#00FF41] animate-pulse"></div>
          </div>
          <div class="flex flex-col">
            <div class="p-3 border-b border-gray-200 flex justify-between items-center hover:bg-gray-50 cursor-pointer">
              <div>
                <div class="font-bold text-xs">BTC/USD</div>
                <div class="text-[10px] text-gray-500">BINANCE</div>
              </div>
              <div class="text-right">
                <div class="text-xs text-[#00FF41] font-bold">64,231.00</div>
                <div class="text-[10px] text-[#00FF41]">+2.4%</div>
              </div>
            </div>
            <div class="p-3 border-b border-gray-200 flex justify-between items-center hover:bg-gray-50 cursor-pointer">
              <div>
                <div class="font-bold text-xs">ETH/USD</div>
                <div class="text-[10px] text-gray-500">COINBASE</div>
              </div>
              <div class="text-right">
                <div class="text-xs text-[#FF3B30] font-bold">3,412.50</div>
                <div class="text-[10px] text-[#FF3B30]">-1.2%</div>
              </div>
            </div>
            <div class="p-3 border-b border-gray-200 flex justify-between items-center hover:bg-gray-50 cursor-pointer">
              <div>
                <div class="font-bold text-xs">TSLA</div>
                <div class="text-[10px] text-gray-500">NASDAQ</div>
              </div>
              <div class="text-right">
                <div class="text-xs font-bold">185.34</div>
                <div class="text-[10px] text-gray-500">0.0%</div>
              </div>
            </div>
            <div class="p-3 border-b border-gray-200 flex justify-between items-center hover:bg-gray-50 cursor-pointer">
              <div>
                <div class="font-bold text-xs">NVDA</div>
                <div class="text-[10px] text-gray-500">NASDAQ</div>
              </div>
              <div class="text-right">
                <div class="text-xs text-[#00FF41] font-bold">894.52</div>
                <div class="text-[10px] text-[#00FF41]">+4.8%</div>
              </div>
            </div>
          </div>
          <div class="mt-auto p-4 border-t border-gray-200 bg-gray-50">
            <div class="text-[10px] font-bold text-gray-500 mb-2">SYSTEM STATUS</div>
            <div class="flex items-center gap-2 text-xs">
              <span class="text-[#00FF41]">●</span>
              <span>API LATENCY: 12ms</span>
            </div>
          </div>
        </aside>

        {/* Center Column: Order Entry & Logs */}
        <section class="flex-grow flex flex-col min-w-0 bg-white">
          {/* Order Entry Panel */}
          <div class="h-1/2 border-b border-gray-200 flex flex-col">
            <div class="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 class="text-xs font-bold text-gray-500">ORDER ENTRY [EXEC_ENV: PROD]</h2>
              <div class="px-2 py-1 bg-gray-200 border border-gray-300 text-xs font-bold">
                BAL: $1,245,000.00
              </div>
            </div>
            <div class="p-6 flex-grow flex flex-col gap-4 overflow-y-auto">
              <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-1">
                  <label class="text-xs font-bold text-gray-500">SYMBOL</label>
                  <input class="bg-white border border-black p-2 text-xs font-bold uppercase" type="text" value="BTC/USD" />
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-xs font-bold text-gray-500">ORDER TYPE</label>
                  <select class="bg-white border border-black p-2 text-xs font-bold uppercase">
                    <option>LIMIT</option>
                    <option>MARKET</option>
                    <option>STOP</option>
                  </select>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-1">
                  <label class="text-xs font-bold text-gray-500">QUANTITY</label>
                  <input class="bg-white border border-black p-2 text-xs text-right font-bold" placeholder="0.00" type="number" />
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-xs font-bold text-gray-500">PRICE (LIMIT)</label>
                  <input class="bg-white border border-black p-2 text-xs text-right font-bold" placeholder="Market Price" type="number" />
                </div>
              </div>
              <div class="mt-auto grid grid-cols-2 gap-4">
                <button class="bg-[#00FF41] text-black border border-black p-3 font-bold text-sm uppercase hover:opacity-80">
                  BUY / LONG
                </button>
                <button class="bg-[#FF3B30] text-white border border-black p-3 font-bold text-sm uppercase hover:opacity-80">
                  SELL / SHORT
                </button>
              </div>
            </div>
          </div>

          {/* System Logs */}
          <div class="h-1/2 flex flex-col bg-white">
            <div class="p-2 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 class="text-xs font-bold text-gray-500">EXECUTION LOGS</h2>
            </div>
            <div class="p-4 flex-grow overflow-y-auto text-xs text-gray-600 space-y-1">
              <div class="flex gap-4"><span class="text-black font-bold">[14:32:01]</span> <span class="text-blue-600 font-bold">INFO</span> <span>System initialized. Connecting to WebSocket...</span></div>
              <div class="flex gap-4"><span class="text-black font-bold">[14:32:02]</span> <span class="text-[#008800] font-bold">SUCCESS</span> <span>Connected to trade engine endpoint.</span></div>
              <div class="flex gap-4"><span class="text-black font-bold">[14:35:14]</span> <span class="text-gray-700 font-bold">REQ</span> <span>&#123; "action": "CREATE_ORDER", "symbol": "BTC/USD", "side": "BUY" &#125;</span></div>
              <div class="flex gap-4"><span class="text-black font-bold">[14:36:22]</span> <span class="text-[#008800] font-bold">FILLED</span> <span>Order ID: #A7X9-221B executed @ 64200.00.</span></div>
            </div>
          </div>
        </section>

        {/* Right Sidebar: Depth of Market */}
        <aside class="w-full md:w-80 border-l border-gray-200 bg-white flex flex-col h-full overflow-hidden">
          <div class="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h2 class="text-xs font-bold text-gray-500">ORDER BOOK (BTC/USD)</h2>
          </div>
          <div class="grid grid-cols-3 p-2 border-b border-gray-200 text-xs font-bold text-gray-500 bg-white text-right">
            <div class="text-left">PRICE</div>
            <div>SIZE</div>
            <div>TOTAL</div>
          </div>
          <div class="flex-1 overflow-hidden flex flex-col justify-center text-xs text-right font-mono p-2">
            <div class="grid grid-cols-3 py-1 text-[#FF3B30] font-bold"><span class="text-left">64,240.00</span><span>1.250</span><span>12.500</span></div>
            <div class="grid grid-cols-3 py-1 text-[#FF3B30] font-bold"><span class="text-left">64,238.50</span><span>0.500</span><span>11.250</span></div>
            <div class="py-2 border-y border-gray-200 flex justify-between items-center px-2 bg-gray-100 my-2">
              <span class="text-sm font-bold text-[#00FF41]">64,231.00</span>
              <span class="text-[10px] text-gray-500">SPREAD: 1.50</span>
            </div>
            <div class="grid grid-cols-3 py-1 text-[#008800] font-bold"><span class="text-left">64,231.00</span><span>1.100</span><span>1.100</span></div>
            <div class="grid grid-cols-3 py-1 text-[#008800] font-bold"><span class="text-left">64,229.50</span><span>0.450</span><span>1.550</span></div>
          </div>
        </aside>
      </div>
    </PageLayout>
  );
}

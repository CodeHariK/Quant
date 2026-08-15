import { Title } from '@solidjs/meta';
import { createSignal, createEffect } from 'solid-js';
import { PageLayout } from '../components/PageLayout';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { Input, FilledButton, OutlineButton } from '../components/FormControls';
import { fetchKitePortfolio, fetchKiteSession, saveKiteSession, type KitePortfolioReport } from '../api/stockApi';

export default function Dashboard() {
  const [kiteReport, setKiteReport] = createSignal<KitePortfolioReport | null>(null);
  const [kiteAuth, setKiteAuth] = createSignal<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = createSignal<string>('');
  const [apiSecretInput, setApiSecretInput] = createSignal<string>('');
  const [requestTokenInput, setRequestTokenInput] = createSignal<string>('');
  const [authError, setAuthError] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal<boolean>(false);

  const loadPortfolio = () => {
    setLoading(true);
    fetchKitePortfolio()
      .then((data) => {
        setKiteReport(data);
        setKiteAuth(true);
        setLoading(false);
      })
      .catch((err) => {
        setKiteAuth(false);
        setLoading(false);
      });
  };

  createEffect(
    () => true,
    () => {
      fetchKiteSession().then((res) => {
        if (res.authenticated) {
          setKiteAuth(true);
          loadPortfolio();
        }
      });
    }
  );

  const handleKiteAuthenticate = (e: Event) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);

    saveKiteSession(apiKeyInput().trim(), apiSecretInput().trim(), requestTokenInput().trim())
      .then(() => {
        setKiteAuth(true);
        loadPortfolio();
      })
      .catch((err) => {
        setAuthError(err.message);
        setLoading(false);
      });
  };

  return (
    <PageLayout showSidebar={false} mainClass="flex-grow p-8 max-w-[1600px] mx-auto w-full flex flex-col gap-6">
      <Title>Alpha Arena - Financial Dashboard & Zerodha Portfolio</Title>

      {/* Top Section: Zerodha KiteConnect Session Banner */}
      {!kiteAuth() ? (
        <Card containerClass="border border-black bg-white p-6">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 border-b border-gray-200 pb-4">
            <div>
              <h2 class="font-headline-md text-headline-md uppercase font-bold text-black flex items-center gap-2">
                <span>⚡ ZERODHA KITECONNECT INTEGRATION</span>
              </h2>
              <p class="font-code-md text-code-md text-muted-gray mt-1">
                Authenticate with your Zerodha KiteConnect API key to load live equity holdings, position P&L, and executed trade logs.
              </p>
            </div>
            <a
              href="https://kite.trade/"
              target="_blank"
              class="border border-black px-3 py-1 font-label-caps text-label-caps hover:bg-gray-100 uppercase"
            >
              KITE DEVELOPER CONSOLE ↗
            </a>
          </div>

          <form onSubmit={handleKiteAuthenticate} class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <Input
              label="API KEY"
              type="text"
              placeholder="e.g. 12345xyz"
              value={apiKeyInput()}
              onInput={(e) => setApiKeyInput(e.currentTarget.value)}
              required
            />
            <Input
              label="API SECRET"
              type="password"
              placeholder="e.g. secretabc..."
              value={apiSecretInput()}
              onInput={(e) => setApiSecretInput(e.currentTarget.value)}
              required
            />
            <Input
              label="REQUEST TOKEN (FROM OAUTH CALLBACK)"
              type="text"
              placeholder="e.g. req_tok_123..."
              value={requestTokenInput()}
              onInput={(e) => setRequestTokenInput(e.currentTarget.value)}
              required
            />
            <FilledButton type="submit" loading={loading()} class="py-2.5">
              CONNECT ZERODHA KITE 🔑
            </FilledButton>
          </form>
          {authError() && <div class="font-code-md text-code-md text-critical-red mt-3">{authError()}</div>}
        </Card>
      ) : (
        <div class="border border-black bg-white p-4 flex justify-between items-center text-xs">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 bg-terminal-green inline-block border border-black"></span>
            <span class="font-bold uppercase">ZERODHA KITECONNECT CONNECTED (PERSISTED IN BOLTDB)</span>
          </div>
          <OutlineButton onClick={loadPortfolio}>
            REFRESH PORTFOLIO 🔄
          </OutlineButton>
        </div>
      )}

      {/* Equity Holdings Table from KiteConnect */}
      {kiteReport() && kiteReport()!.holdings.length > 0 && (
        <Card
          containerClass="border border-black bg-white p-6"
          headerClass="flex justify-between items-center mb-4 border-b border-black pb-3"
          title={`Zerodha Equity Holdings (${kiteReport()!.holdings.length} Assets)`}
          titleClass="font-headline-md text-headline-md uppercase font-bold text-black"
        >
          <Table
            columns={[
              { header: 'SYMBOL', accessor: 'tradingsymbol', className: 'p-3 font-bold text-black' },
              { header: 'EXCHANGE', accessor: 'exchange', className: 'p-3 text-gray-500' },
              { header: 'QTY', accessor: 'quantity', className: 'p-3 font-mono' },
              { header: 'AVG PRICE', cell: (r) => `₹${r.averagePrice.toFixed(2)}`, className: 'p-3 font-mono' },
              { header: 'LAST PRICE', cell: (r) => `₹${r.lastPrice.toFixed(2)}`, className: 'p-3 font-mono' },
              {
                header: 'P&L (INR)',
                cell: (r) => (
                  <span class={`font-bold ${r.pnl >= 0 ? 'text-terminal-green' : 'text-critical-red'}`}>
                    {r.pnl >= 0 ? `+₹${r.pnl.toFixed(2)}` : `-₹${Math.abs(r.pnl).toFixed(2)}`}
                  </span>
                ),
                align: 'right',
                className: 'p-3 text-right',
              },
            ]}
            data={kiteReport()!.holdings}
          />
        </Card>
      )}

      {/* Executed Trade Logs & Purchase Dates from KiteConnect */}
      {kiteReport() && kiteReport()!.tradeHistory.length > 0 && (
        <Card
          containerClass="border border-black bg-white p-6"
          headerClass="flex justify-between items-center mb-4 border-b border-black pb-3"
          title="Executed Trade Logs & Timestamps (KiteConnect)"
          titleClass="font-headline-md text-headline-md uppercase font-bold text-black"
        >
          <Table
            columns={[
              {
                header: 'DATE & TIMESTAMP',
                cell: (r) => <span class="font-mono text-gray-600">{new Date(r.tradeTimestamp).toLocaleString()}</span>,
                className: 'p-3',
              },
              { header: 'SYMBOL', accessor: 'tradingsymbol', className: 'p-3 font-bold text-black' },
              {
                header: 'TYPE',
                cell: (r) => (
                  <span class={`font-bold px-2 py-0.5 text-xs ${r.transactionType === 'BUY' ? 'bg-terminal-green/20 text-green-800' : 'bg-critical-red/20 text-red-800'}`}>
                    {r.transactionType}
                  </span>
                ),
                className: 'p-3',
              },
              { header: 'QTY', accessor: 'quantity', className: 'p-3 font-mono' },
              { header: 'AVG EXECUTION PRICE', cell: (r) => `₹${r.averagePrice.toFixed(2)}`, className: 'p-3 font-mono' },
              { header: 'ORDER ID', accessor: 'orderId', className: 'p-3 font-mono text-gray-500 text-xs' },
            ]}
            data={kiteReport()!.tradeHistory}
          />
        </Card>
      )}

      {/* Aggregate Performance Section */}
      <Card containerClass="border border-primary bg-surface-container-lowest p-6">
        <div class="flex justify-between items-start mb-6 border-b border-primary pb-4">
          <div>
            <h1 class="font-headline-lg text-headline-lg uppercase mb-2">Aggregate Performance</h1>
            <p class="font-code-md text-code-md text-muted-gray">Total portfolio value across all active models.</p>
          </div>
          <div class="text-right">
            <div class="font-label-caps text-label-caps text-muted-gray mb-1">TOTAL ACCOUNT VALUE</div>
            <div class="font-headline-lg text-headline-lg font-bold">$124,574.82</div>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="border border-primary p-4 flex flex-col justify-between">
            <div class="font-label-caps text-label-caps text-muted-gray mb-2">AVAILABLE CASH</div>
            <div class="font-headline-md text-headline-md">$41,797.52</div>
          </div>
          <div class="md:col-span-2 border border-primary p-4 flex flex-col justify-center items-center bg-surface-container-high h-32 relative">
            <span class="font-code-md text-code-md text-muted-gray z-10">AGGREGATE INDEX CHART [RENDERING...]</span>
            <div class="absolute inset-0 opacity-20" style={{ "background-image": "linear-gradient(to right, transparent 0%, #00FF41 50%, transparent 100%)" }}></div>
          </div>
        </div>
      </Card>
    </PageLayout>
  );
}


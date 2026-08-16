import { Title } from '@solidjs/meta';
import { useSearchParams } from '@solidjs/router';
import { createSignal, createEffect } from 'solid-js';
import { PageLayout } from '../components/PageLayout';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { Input, FilledButton, OutlineButton } from '../components/FormControls';
import { Text } from '../components/Text';
import { fetchKitePortfolio, fetchKiteSession, saveKiteSession, deleteKiteSession, type KitePortfolioReport } from '../api/stockApi';

export default function Dashboard() {
  const [searchParams] = useSearchParams();
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
      .catch(() => {
        setKiteAuth(false);
        setLoading(false);
      });
  };

  const handleKiteLogout = () => {
    deleteKiteSession()
      .then(() => {
        setKiteAuth(false);
        setKiteReport(null);
        setRequestTokenInput('');
      })
      .catch(() => {
        setKiteAuth(false);
        setKiteReport(null);
      });
  };

  // Load saved API Key & Secret from localStorage if available
  createEffect(
    () => true,
    () => {
      const savedKey = localStorage.getItem('haunter_kite_api_key');
      const savedSecret = localStorage.getItem('haunter_kite_api_secret');
      if (savedKey) setApiKeyInput(savedKey);
      if (savedSecret) setApiSecretInput(savedSecret);

      fetchKiteSession().then((res) => {
        if (res.authenticated) {
          setKiteAuth(true);
          if (res.apiKey) setApiKeyInput(res.apiKey);
          loadPortfolio();
        }
      });

      // Auto-extract request_token if redirected back from Zerodha login & auto-authenticate
      const reqTok = Array.isArray(searchParams.request_token)
        ? searchParams.request_token[0]
        : searchParams.request_token;

      if (reqTok) {
        const decodedToken = decodeURIComponent(reqTok);
        setRequestTokenInput(decodedToken);

        const currentKey = apiKeyInput().trim() || localStorage.getItem('haunter_kite_api_key') || '';
        const currentSecret = apiSecretInput().trim() || localStorage.getItem('haunter_kite_api_secret') || '';

        if (currentKey && currentSecret && decodedToken) {
          setLoading(true);
          saveKiteSession(currentKey, currentSecret, decodedToken)
            .then(() => {
              setKiteAuth(true);
              loadPortfolio();
            })
            .catch((err) => {
              setAuthError(`Auto-login error: ${err.message}`);
              setLoading(false);
            });
        }
      }
    }
  );

  const handleKiteAuthenticate = (e: Event) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);

    const key = apiKeyInput().trim();
    const secret = apiSecretInput().trim();
    localStorage.setItem('haunter_kite_api_key', key);
    localStorage.setItem('haunter_kite_api_secret', secret);

    saveKiteSession(key, secret, requestTokenInput().trim())
      .then(() => {
        setKiteAuth(true);
        loadPortfolio();
      })
      .catch((err) => {
        setAuthError(err.message);
        setLoading(false);
      });
  };

  const handleSaveCredentials = () => {
    const key = apiKeyInput().trim();
    const secret = apiSecretInput().trim();
    if (key) localStorage.setItem('haunter_kite_api_key', key);
    if (secret) localStorage.setItem('haunter_kite_api_secret', secret);
  };

  const getKiteLoginUrl = () => {
    const key = apiKeyInput().trim();
    if (!key) return '#';
    return `https://kite.zerodha.com/connect/login?v=3&api_key=${encodeURIComponent(key)}`;
  };

  return (
    <PageLayout showSidebar={false} mainClass="flex-grow p-8 max-w-[1600px] mx-auto w-full flex flex-col gap-6">
      <Title>Alpha Arena - Financial Dashboard & Zerodha Portfolio</Title>

      {/* Top Section: Zerodha KiteConnect Session Banner */}
      {!kiteAuth() ? (
        <Card containerClass="border border-black bg-white p-6">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 border-b border-gray-200 pb-4">
            <div>
              <Text variant="h2" class="flex items-center gap-2">
                <span>⚡ ZERODHA KITECONNECT INTEGRATION</span>
              </Text>
              <Text variant="muted" class="mt-1 block">
                Authenticate with your Zerodha KiteConnect API key to load live equity holdings, position P&L, and executed trade logs.
              </Text>
            </div>
            <a
              href="https://kite.trade/"
              target="_blank"
              class="border border-black px-3 py-1 font-label-caps text-label-caps hover:bg-gray-100 uppercase"
            >
              KITE DEVELOPER CONSOLE ↗
            </a>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <Input
              label="API KEY"
              type="text"
              placeholder="e.g. 12345xyz"
              value={apiKeyInput()}
              onInput={(e) => {
                const val = e.currentTarget.value;
                setApiKeyInput(val);
                localStorage.setItem('haunter_kite_api_key', val.trim());
              }}
              required
            />
            <Input
              label="API SECRET"
              type="password"
              placeholder="e.g. secretabc..."
              value={apiSecretInput()}
              onInput={(e) => {
                const val = e.currentTarget.value;
                setApiSecretInput(val);
                localStorage.setItem('haunter_kite_api_secret', val.trim());
              }}
              required
            />
            <div class="flex items-center">
              {apiKeyInput().trim() && apiSecretInput().trim() ? (
                <a href={getKiteLoginUrl()} target="_blank" class="w-full">
                  <FilledButton class="w-full py-3">
                    LOGIN WITH ZERODHA 🔑 ↗
                  </FilledButton>
                </a>
              ) : (
                <OutlineButton disabled class="w-full py-3 opacity-50 cursor-not-allowed">
                  Enter Key & Secret to Login
                </OutlineButton>
              )}
            </div>
          </div>
          {authError() && <div class="font-code-md text-code-md text-critical-red mt-3">{authError()}</div>}
        </Card>
      ) : (
        <Card containerClass="border border-black bg-white p-4">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 bg-terminal-green inline-block border border-black"></span>
              <Text variant="h3" class="text-xs">ZERODHA KITECONNECT CONNECTED (PERSISTED IN BOLTDB)</Text>
            </div>
            <div class="flex items-center gap-2">
              <OutlineButton onClick={loadPortfolio} size="sm">
                REFRESH PORTFOLIO 🔄
              </OutlineButton>
              <OutlineButton onClick={handleKiteLogout} size="sm" class="border-critical-red text-critical-red">
                LOGOUT 🚪
              </OutlineButton>
            </div>
          </div>
        </Card>
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
              {
                header: 'SYMBOL',
                cell: (r) => <Text variant="code" class="font-bold">{r.tradingsymbol}</Text>,
                className: 'p-3',
                aggregate: 'count',
              },
              {
                header: 'EXCHANGE',
                cell: (r) => <Text variant="code">{r.exchange}</Text>,
                className: 'p-3',
              },
              {
                header: 'QTY',
                cell: (r) => <Text variant="code">{r.quantity}</Text>,
                className: 'p-3',
                sortValue: (r) => r.quantity,
                aggregate: 'sum',
              },
              {
                header: 'AVG PRICE',
                cell: (r) => <Text variant="code">₹{r.averagePrice.toFixed(2)}</Text>,
                className: 'p-3',
                sortValue: (r) => r.averagePrice,
                aggregate: 'avg',
                aggregateFormatter: (v) => `₹${v.toFixed(2)}`,
              },
              {
                header: 'LAST PRICE',
                cell: (r) => <Text variant="code">₹{r.lastPrice.toFixed(2)}</Text>,
                className: 'p-3',
                sortValue: (r) => r.lastPrice,
              },
              {
                header: 'P&L (INR)',
                cell: (r) => (
                  <Text variant={r.pnl >= 0 ? 'success' : 'error'}>
                    {r.pnl >= 0 ? `+₹${r.pnl.toFixed(2)}` : `-₹${Math.abs(r.pnl).toFixed(2)}`}
                  </Text>
                ),
                align: 'right',
                className: 'p-3 text-right',
                sortValue: (r) => r.pnl,
                aggregate: 'sum',
                aggregateFormatter: (v) => (v >= 0 ? `+₹${v.toFixed(2)}` : `-₹${Math.abs(v).toFixed(2)}`),
              },
            ]}
            data={kiteReport()!.holdings}
            showSummary
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
                cell: (r) => <Text variant="muted">{new Date(r.tradeTimestamp).toLocaleString()}</Text>,
                className: 'p-3',
              },
              {
                header: 'SYMBOL',
                cell: (r) => <Text variant="code" class="font-bold">{r.tradingsymbol}</Text>,
                className: 'p-3',
              },
              {
                header: 'TYPE',
                cell: (r) => (
                  <Text variant={r.transactionType === 'BUY' ? 'success' : 'error'}>
                    {r.transactionType}
                  </Text>
                ),
                className: 'p-3',
              },
              {
                header: 'QTY',
                cell: (r) => <Text variant="code">{r.quantity}</Text>,
                className: 'p-3',
              },
              {
                header: 'AVG EXECUTION PRICE',
                cell: (r) => <Text variant="code">₹{r.averagePrice.toFixed(2)}</Text>,
                className: 'p-3',
              },
              {
                header: 'ORDER ID',
                cell: (r) => <Text variant="muted">{r.orderId}</Text>,
                className: 'p-3',
              },
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


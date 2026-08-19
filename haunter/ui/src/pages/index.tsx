import { Title } from '@solidjs/meta';
import { useSearchParams } from '@solidjs/router';
import { createSignal, createEffect } from 'solid-js';
import { PageLayout } from '../pages/components/PageLayout';
import { Text } from '../primitives/Text';
import { KiteConnectBanner } from './components/dashboard/KiteConnectBanner';
import { KiteHoldingsTable } from './components/dashboard/KiteHoldingsTable';
import { KiteGTTTable } from './components/dashboard/KiteGTTTable';
import { KiteTradeLogs } from './components/dashboard/KiteTradeLogs';
import { AggregatePerformance } from './components/dashboard/AggregatePerformance';

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

  const loadPortfolio = (force: boolean = false) => {
    setLoading(true);
    fetchKitePortfolio(force)
      .then((data) => {
        setKiteReport(data);
        setKiteAuth(true);
        setLoading(false);
      })
      .catch((err) => {
        setKiteAuth(false);
        setKiteReport(null);
        setLoading(false);
        setAuthError(err.message || 'Zerodha session expired. Auto-logging out and redirecting to Zerodha...');

        // 1. Auto-purge stale BoltDB session
        deleteKiteSession().catch(() => { });

        // 2. Auto-redirect to Zerodha Login if API Key is saved in localStorage
        const savedKey = localStorage.getItem('haunter_kite_api_key');
        if (savedKey) {
          const zerodhaLoginUrl = `https://kite.zerodha.com/connect/login?v=3&api_key=${encodeURIComponent(savedKey)}`;
          setTimeout(() => {
            window.location.href = zerodhaLoginUrl;
          }, 1500);
        }
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

      <KiteConnectBanner 
        kiteAuth={kiteAuth}
        authError={authError}
        apiKeyInput={apiKeyInput}
        apiSecretInput={apiSecretInput}
        setApiKeyInput={setApiKeyInput}
        setApiSecretInput={setApiSecretInput}
        getKiteLoginUrl={getKiteLoginUrl}
        loadPortfolio={loadPortfolio}
        handleKiteLogout={handleKiteLogout}
      />

      {kiteReport() && kiteReport()!.holdings.length > 0 && (
        <KiteHoldingsTable kiteReport={kiteReport} />
      )}

      {kiteAuth() && (
        <KiteGTTTable />
      )}

      {kiteReport() && kiteReport()!.tradeHistory.length > 0 && (
        <KiteTradeLogs kiteReport={kiteReport} />
      )}

      <AggregatePerformance />
    </PageLayout>
  );
}

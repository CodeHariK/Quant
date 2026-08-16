import type { FullValuationReport } from '../types/events';

const API_BASE_URL = 'http://localhost:8080';

export async function fetchValuationReport(symbol: string, forceRefresh = false): Promise<FullValuationReport> {
  const url = `${API_BASE_URL}/api/valuation-report?symbol=${encodeURIComponent(symbol)}&force=${forceRefresh}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch valuation report for ${symbol}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchWatchlist(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/api/watchlist`);
  if (!response.ok) {
    throw new Error(`Failed to fetch watchlist: ${response.statusText}`);
  }
  const data = await response.json();
  return data.watchlist || [];
}

export async function addToWatchlist(symbol: string): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/api/watchlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol }),
  });
  if (!response.ok) {
    throw new Error(`Failed to add ${symbol} to watchlist: ${response.statusText}`);
  }
  const data = await response.json();
  return data.watchlist || [];
}

export async function removeFromWatchlist(symbol: string): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/api/watchlist?symbol=${encodeURIComponent(symbol)}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Failed to remove ${symbol} from watchlist: ${response.statusText}`);
  }
  const data = await response.json();
  return data.watchlist || [];
}

export interface KiteHolding {
  tradingsymbol: string;
  exchange: string;
  quantity: number;
  averagePrice: number;
  lastPrice: number;
  closePrice: number;
  pnl: number;
  dayChangePercentage: number;
  authorizedDate?: string;
}

export interface KiteTrade {
  tradeId: string;
  orderId: string;
  exchange: string;
  tradingsymbol: string;
  transactionType: 'BUY' | 'SELL';
  quantity: number;
  averagePrice: number;
  tradeTimestamp: string;
}

export interface KitePortfolioReport {
  holdings: KiteHolding[];
  positions: KiteHolding[];
  tradeHistory: KiteTrade[];
  fetchedAt: string;
}

export async function fetchKitePortfolio(): Promise<KitePortfolioReport> {
  const response = await fetch(`${API_BASE_URL}/api/kite/portfolio`);
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Zerodha KiteConnect session inactive`);
  }
  return response.json();
}

export async function fetchKiteSession(): Promise<{ authenticated: boolean; apiKey?: string }> {
  const response = await fetch(`${API_BASE_URL}/api/kite/session`);
  if (!response.ok) return { authenticated: false };
  return response.json();
}

export async function saveKiteSession(apiKey: string, apiSecret: string, requestToken: string) {
  const response = await fetch(`${API_BASE_URL}/api/kite/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey, apiSecret, requestToken }),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to authenticate with Zerodha KiteConnect');
  }
  return response.json();
}

export async function deleteKiteSession() {
  const response = await fetch(`${API_BASE_URL}/api/kite/session`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to logout Zerodha KiteConnect session');
  }
  return response.json();
}

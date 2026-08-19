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
  settledQuantity?: number;
  t1Quantity?: number;
  dayQuantity?: number;
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

export async function fetchKitePortfolio(force: boolean = false): Promise<KitePortfolioReport> {
  const url = `${API_BASE_URL}/api/kite/portfolio${force ? '?force=true' : ''}`;
  const response = await fetch(url);
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

export interface TradebookRecord {
  symbol: string;
  isin?: string;
  tradeId: string;
  orderId: string;
  exchange: string;
  segment: string;
  transactionType: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  tradeDate: string;
  year: number;
}

export async function uploadTradebookCSV(file: File): Promise<{ success: boolean; importedCount: number }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/tradebook`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to upload tradebook CSV');
  }
  return response.json();
}

export async function fetchTradebookRecords(year?: number): Promise<{ records: TradebookRecord[]; availableYears: number[]; count: number }> {
  const url = `${API_BASE_URL}/api/tradebook${year ? `?year=${year}` : ''}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch tradebook records');
  }
  return response.json();
}

export interface KiteGTTOrder {
  exchange: string;
  tradingsymbol: string;
  transaction_type: 'buy' | 'sell';
  quantity: number;
  price: number;
  order_type: string;
  product: string;
}

export interface KiteGTTCondition {
  exchange: string;
  tradingsymbol: string;
  trigger_values: number[];
  last_price: number;
}

export interface KiteGTT {
  id: number;
  user_id: string;
  type: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
  status: string;
  condition: KiteGTTCondition;
  orders: KiteGTTOrder[];
}

export async function fetchKiteGTTs(): Promise<{ gtts: KiteGTT[]; count: number }> {
  const response = await fetch(`${API_BASE_URL}/api/kite/gtt`);
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to fetch GTT orders');
  }
  return response.json();
}

export interface PortfolioStock {
  symbol: string;
  initialQuantity: number;
  sipAmount: number;
}

export interface Portfolio {
  id: string;
  name: string;
  stocks: PortfolioStock[];
  createdAt: string;
  isKite?: boolean;
  tradeHistory?: KiteTrade[];
}

export async function fetchPortfolios(): Promise<Portfolio[]> {
  const response = await fetch(`${API_BASE_URL}/api/portfolios`);
  if (!response.ok) {
    throw new Error('Failed to fetch portfolios');
  }
  const data = await response.json();
  return data.portfolios || [];
}

export async function savePortfolio(portfolio: Partial<Portfolio>): Promise<Portfolio> {
  const response = await fetch(`${API_BASE_URL}/api/portfolios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(portfolio),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to save portfolio');
  }
  const data = await response.json();
  return data.portfolio;
}

export async function deletePortfolio(id: string): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/api/portfolios?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete portfolio');
  }
  return true;
}

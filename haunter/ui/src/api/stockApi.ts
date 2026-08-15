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

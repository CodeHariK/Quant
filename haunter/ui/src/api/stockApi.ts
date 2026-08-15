import type { StockInfo } from '../types/events';

const API_BASE_URL = 'http://localhost:8080';

export async function fetchStockInfo(symbol: string): Promise<StockInfo> {
  const response = await fetch(`${API_BASE_URL}/api/stock-info?symbol=${encodeURIComponent(symbol)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch stock info for ${symbol}: ${response.statusText}`);
  }
  return response.json();
}

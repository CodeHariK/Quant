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

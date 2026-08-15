export type EventType = 'market_ticker' | 'portfolio_update' | 'execution_log' | 'watchdog_update';

export interface StockInfo {
  symbol: string;
  longName: string;
  sector: string;
  industry: string;
  currentPrice: number;
  marketCap: number;
  trailingPE: number;
  forwardPE: number;
  priceToBook: number;
  pegRatio: number;
  bookValue: number;
  ebitda: number;
  totalCash: number;
  totalDebt: number;
  debtToEquity: number;
  profitMargins: number;
  operatingMargins: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  targetMeanPrice: number;
}

export interface MarketTickerPayload {
  symbol: string;
  price: number;
  changePercent: number;
  isPositive: boolean;
}

export interface PortfolioPayload {
  totalAccountValue: number;
  availableCash: number;
  totalPnL: number;
  totalFees: number;
  netRealized: number;
  unrealizedPnL: number;
}

export interface ExecutionLogPayload {
  id: string;
  timestamp: string;
  level: 'INFO' | 'SUCCESS' | 'REQ' | 'FILLED';
  message: string;
  symbol?: string;
  side?: 'BUY' | 'SELL';
  price?: number;
  pnl?: number;
}

export interface WatchdogPayload {
  symbol: string;
  latestPrice: number;
  trendStatus: string;
  rsi14: number;
  cautionLevel: string;
  warnings: string[];
  timestamp: string;
}

export interface SSEEvent<T = any> {
  event: EventType;
  data: T;
}

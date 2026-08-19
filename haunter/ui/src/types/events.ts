export type EventType = 'market_ticker' | 'portfolio_update' | 'execution_log' | 'watchdog_update';

export interface FinancialStatementItem {
  period: string;
  values: Record<string, number>;
}

export interface HistoryBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface FullValuationReport {
  symbol: string;
  fetchedAt: string;
  sharpeRatio?: number;
  sortinoRatio?: number;
  annualizedVolatility?: number;
  maxDrawdown?: number;
  intrinsicValue?: number;
  currentPrice?: number;
  marginOfSafety?: number;
  weightedTrendPrice?: number;
  priceToTrendDeviation?: number;
  valuationStatus?: string;
  buySellZone?: string;
  relativePE?: number;
  sectorPE?: number;
  nextMonthForecast?: number;
  nextMonthMin?: number;
  nextMonthMax?: number;
  monthlyVolPerc?: number;
  monthlyGrowthPerc?: number;
  pegRatio?: number;
  pegyRatio?: number;
  earningsYield?: number;
  recommendations?: Record<string, any>;
  rawInfo: Record<string, any>;
  history: HistoryBar[];
  cashFlow: FinancialStatementItem[];
  incomeStatement: FinancialStatementItem[];
  balanceSheet: FinancialStatementItem[];
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

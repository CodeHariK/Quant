package types

import "time"

// EventType demarcation for SSE events
type EventType string

const (
	EventMarketTicker EventType = "market_ticker"
	EventPortfolio    EventType = "portfolio_update"
	EventExecutionLog EventType = "execution_log"
	EventWatchdog     EventType = "watchdog_update"
)

// LogLevel string enum for execution log levels
type LogLevel string

const (
	LogLevelInfo    LogLevel = "INFO"
	LogLevelSuccess LogLevel = "SUCCESS"
	LogLevelReq     LogLevel = "REQ"
	LogLevelFilled  LogLevel = "FILLED"
)

// OrderSide string enum for trading order direction
type OrderSide string

const (
	SideBuy  OrderSide = "BUY"
	SideSell OrderSide = "SELL"
)

// CautionLevel string enum for watchdog status
type CautionLevel string

const (
	CautionLow    CautionLevel = "LOW"
	CautionMedium CautionLevel = "MEDIUM"
	CautionHigh   CautionLevel = "HIGH"
)

// StockInfo represents Tier 1 Relative Valuation & Key Statistics from Ticker.Info
type StockInfo struct {
	Symbol           string  `json:"symbol"`
	LongName         string  `json:"longName"`
	Sector           string  `json:"sector"`
	Industry         string  `json:"industry"`
	CurrentPrice     float64 `json:"currentPrice"`
	MarketCap        int64   `json:"marketCap"`
	TrailingPE       float64 `json:"trailingPE"`
	ForwardPE        float64 `json:"forwardPE"`
	PriceToBook      float64 `json:"priceToBook"`
	PEGRatio         float64 `json:"pegRatio"`
	BookValue        float64 `json:"bookValue"`
	EBITDA           float64 `json:"ebitda"`
	TotalCash        float64 `json:"totalCash"`
	TotalDebt        float64 `json:"totalDebt"`
	DebtToEquity     float64 `json:"debtToEquity"`
	ProfitMargins    float64 `json:"profitMargins"`
	OperatingMargins float64 `json:"operatingMargins"`
	FiftyTwoWeekHigh float64 `json:"fiftyTwoWeekHigh"`
	FiftyTwoWeekLow  float64 `json:"fiftyTwoWeekLow"`
	TargetMeanPrice  float64 `json:"targetMeanPrice"`
}

// FinancialStatementItem represents a line item entry in CashFlow / Income / Balance Sheet
type FinancialStatementItem struct {
	Period string             `json:"period"`
	Values map[string]float64 `json:"values"`
}

// FullValuationReport consolidates the 5 Core Tier 1 yfinance endpoints:
// 1. History (OHLCV time series)
// 2. Info (Ratios & Overview)
// 3. CashFlow (DCF inputs: Operating Cash Flow, CapEx, Free Cash Flow)
// 4. IncomeStatement (Revenue, EBIT, Net Income growth)
// 5. BalanceSheet (Assets, Total Debt, Cash reserves)
type FullValuationReport struct {
	Symbol          string                   `json:"symbol"`
	FetchedAt       time.Time                `json:"fetchedAt"`
	Info            *StockInfo               `json:"info"`
	History         []HistoryBar             `json:"history"`
	CashFlow        []FinancialStatementItem `json:"cashFlow"`
	IncomeStatement []FinancialStatementItem `json:"incomeStatement"`
	BalanceSheet    []FinancialStatementItem `json:"balanceSheet"`
}

type HistoryBar struct {
	Date   string  `json:"date"`
	Open   float64 `json:"open"`
	High   float64 `json:"high"`
	Low    float64 `json:"low"`
	Close  float64 `json:"close"`
	Volume int64   `json:"volume"`
}

// ExecutionLogPayload represents trade logs and execution events
type ExecutionLogPayload struct {
	ID        string    `json:"id"`
	Timestamp time.Time `json:"timestamp"`
	Level     LogLevel  `json:"level"`
	Message   string    `json:"message"`
	Symbol    string    `json:"symbol,omitempty"`
	Side      OrderSide `json:"side,omitempty"`
	Price     float64   `json:"price,omitempty"`
	PnL       float64   `json:"pnl,omitempty"`
}

// WatchdogPayload represents stock analysis watchdog metrics
type WatchdogPayload struct {
	Symbol       string       `json:"symbol"`
	LatestPrice  float64      `json:"latestPrice"`
	TrendStatus  string       `json:"trendStatus"`
	RSI14        float64      `json:"rsi14"`
	CautionLevel CautionLevel `json:"cautionLevel"`
	Warnings     []string     `json:"warnings"`
	Timestamp    time.Time    `json:"timestamp"`
}

// SSEEvent wraps generic SSE payload with event metadata
type SSEEvent struct {
	Event EventType   `json:"event"`
	Data  interface{} `json:"data"`
}

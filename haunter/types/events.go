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

// StockInfo represents detailed valuation & company info from yfinance
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

// MarketTickerPayload represents streaming asset prices & changes
type MarketTickerPayload struct {
	Symbol        string  `json:"symbol"`
	Price         float64 `json:"price"`
	ChangePercent float64 `json:"changePercent"`
	IsPositive    bool    `json:"isPositive"`
}

// PortfolioPayload represents aggregate performance metrics
type PortfolioPayload struct {
	TotalAccountValue float64 `json:"totalAccountValue"`
	AvailableCash     float64 `json:"availableCash"`
	TotalPnL          float64 `json:"totalPnL"`
	TotalFees         float64 `json:"totalFees"`
	NetRealized       float64 `json:"netRealized"`
	UnrealizedPnL     float64 `json:"unrealizedPnL"`
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

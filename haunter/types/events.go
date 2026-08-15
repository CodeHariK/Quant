package types

import (
	"time"

	"github.com/wnjoon/go-yfinance/pkg/models"
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

// FinancialStatementItem represents a line item entry in CashFlow / Income / Balance Sheet
type FinancialStatementItem struct {
	Period string             `json:"period"`
	Values map[string]float64 `json:"values"`
}

// FullValuationReport consolidates complete 5-Year Data from go-yfinance without discarding fields:
// 1. Info: Complete raw models.Info struct (100+ fields)
// 2. History: Complete 5Y daily OHLCV candles
// 3. CashFlow: Complete annual line items map
// 4. IncomeStatement: Complete annual line items map
// 5. BalanceSheet: Complete annual line items map
type FullValuationReport struct {
	Symbol          string                   `json:"symbol"`
	FetchedAt       time.Time                `json:"fetchedAt"`
	RawInfo         *models.Info             `json:"rawInfo"`
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

type EventType string

const (
	EventMarketTicker EventType = "market_ticker"
	EventPortfolio    EventType = "portfolio_update"
	EventExecutionLog EventType = "execution_log"
	EventWatchdog     EventType = "watchdog_update"
)

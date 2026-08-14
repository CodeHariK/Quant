package analyzer

import (
	"fmt"

	indicator "github.com/cinar/indicator"
)

type AnalysisResult struct {
	Symbol       string
	LatestPrice  float64
	SMA50        float64
	EMA20        float64
	RSI14        float64
	UpperBand    float64
	LowerBand    float64
	MACD         float64
	MACDSignal   float64
	TrendStatus  string
	CautionLevel string
	Warnings     []string
}

// AnalyzeStock computes TA indicators using cinar/indicator v1.3.0
func AnalyzeStock(symbol string, prices []float64) (*AnalysisResult, error) {
	if len(prices) < 50 {
		return nil, fmt.Errorf("insufficient price points (%d), need at least 50", len(prices))
	}

	// 1. Calculate Technical Indicators using cinar/indicator v1.3.0
	sma50 := indicator.Sma(50, prices)
	ema20 := indicator.Ema(20, prices)
	_, rsi14 := indicator.Rsi(prices)
	macd, macdSignal := indicator.Macd(prices)
	upperBand, _, lowerBand := indicator.BollingerBands(prices)

	lastIdx := len(prices) - 1
	latestPrice := prices[lastIdx]

	lastSMA50 := sma50[lastIdx]
	lastEMA20 := ema20[lastIdx]
	lastRSI := rsi14[lastIdx]
	lastUpper := upperBand[lastIdx]
	lastLower := lowerBand[lastIdx]
	lastMACD := macd[lastIdx]
	lastMACDSig := macdSignal[lastIdx]

	// 2. Trend & Caution Evaluation
	trendStatus := "BULLISH 📈"
	if lastEMA20 < lastSMA50 {
		trendStatus = "BEARISH 📉"
	}

	var warnings []string
	if lastRSI >= 70 {
		warnings = append(warnings, fmt.Sprintf("RSI Overbought (%.1f)", lastRSI))
	} else if lastRSI <= 30 {
		warnings = append(warnings, fmt.Sprintf("RSI Oversold (%.1f)", lastRSI))
	}

	if latestPrice >= lastUpper {
		warnings = append(warnings, "Price at Upper Bollinger Band (+2σ Overextended)")
	} else if latestPrice <= lastLower {
		warnings = append(warnings, "Price at Lower Bollinger Band (-2σ)")
	}

	if latestPrice < lastEMA20 {
		warnings = append(warnings, "Price below EMA 20 (Short-term breakdown)")
	}

	cautionLevel := "✅ HEALTHY"
	if len(warnings) > 0 {
		cautionLevel = "⚠️ CAUTION"
	}

	return &AnalysisResult{
		Symbol:       symbol,
		LatestPrice:  latestPrice,
		SMA50:        lastSMA50,
		EMA20:        lastEMA20,
		RSI14:        lastRSI,
		UpperBand:    lastUpper,
		LowerBand:    lastLower,
		MACD:         lastMACD,
		MACDSignal:   lastMACDSig,
		TrendStatus:  trendStatus,
		CautionLevel: cautionLevel,
		Warnings:     warnings,
	}, nil
}

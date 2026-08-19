package analyzer

import (
	"fmt"
	"math"

	indicator "github.com/cinar/indicator"
	"haunter/config"
	"haunter/types"
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

// CalculateRiskMetrics computes Sharpe Ratio, Sortino Ratio, Annualized Volatility, and Max Drawdown from price history bars.
// Sortino Ratio denominator uses float64(downsideCount) for academic accuracy.
func CalculateRiskMetrics(bars []types.HistoryBar, annualRiskFreeRate float64) (sharpe float64, sortino float64, vol float64, maxDD float64) {
	if len(bars) < 2 {
		return 0, 0, 0, 0
	}

	returns := make([]float64, 0, len(bars)-1)
	peak := bars[0].Close
	maxDrawdownVal := 0.0

	for i := 0; i < len(bars); i++ {
		if bars[i].Close > peak {
			peak = bars[i].Close
		}
		if peak > 0 {
			dd := (peak - bars[i].Close) / peak
			if dd > maxDrawdownVal {
				maxDrawdownVal = dd
			}
		}

		if i > 0 && bars[i-1].Close > 0 && bars[i].Close > 0 {
			// Logarithmic Return: ln(Price_Today / Price_Yesterday) for time-additivity & statistical normality
			r := math.Log(bars[i].Close / bars[i-1].Close)
			returns = append(returns, r)
		}
	}

	if len(returns) == 0 {
		return 0, 0, 0, maxDrawdownVal
	}

	sumReturn := 0.0
	for _, r := range returns {
		sumReturn += r
	}
	meanReturn := sumReturn / float64(len(returns))

	sumSquareDiff := 0.0
	sumDownsideSquareDiff := 0.0
	downsideCount := 0

	dailyRiskFreeRate := annualRiskFreeRate / config.TradingDaysPerYear

	for _, r := range returns {
		diff := r - meanReturn
		sumSquareDiff += diff * diff

		if r < dailyRiskFreeRate {
			dDiff := r - dailyRiskFreeRate
			sumDownsideSquareDiff += dDiff * dDiff
			downsideCount++
		}
	}

	dailyVariance := sumSquareDiff / float64(len(returns))
	dailyVolatility := math.Sqrt(dailyVariance)

	annualizedReturn := meanReturn * config.TradingDaysPerYear
	annualizedVol := dailyVolatility * math.Sqrt(config.TradingDaysPerYear)

	// Sortino Ratio Calculation: Divide by downsideCount for exact downside risk normalization
	downsideVolatility := 0.0
	if downsideCount > 0 && sumDownsideSquareDiff > 0 {
		downsideVolatility = math.Sqrt(sumDownsideSquareDiff/float64(downsideCount)) * math.Sqrt(config.TradingDaysPerYear)
	}

	if annualizedVol > 0 {
		sharpe = (annualizedReturn - annualRiskFreeRate) / annualizedVol
	}

	// Sortino Zero-Downside Risk Edge Case Handling
	if downsideVolatility > 0 {
		sortino = (annualizedReturn - annualRiskFreeRate) / downsideVolatility
	} else if annualizedReturn > annualRiskFreeRate {
		// Infinite Sortino when zero downside risk exists on a positive return trajectory
		sortino = math.Inf(1)
	}

	return sharpe, sortino, annualizedVol * 100.0, maxDrawdownVal * 100.0
}

// ValuationAnalysis holds the output of the Recency-Weighted Trend Deviation engine
type ValuationAnalysis struct {
	CurrentPrice          float64
	WeightedTrendPrice    float64
	PriceToTrendDeviation float64
	ValuationStatus       string
	BuySellZone           string
	NextMonthForecast     float64
	NextMonthMin          float64
	NextMonthMax          float64
	MonthlyVolPerc        float64
	MonthlyGrowthPerc     float64
}

// CalculateTrendDeviation evaluates 1-Year Recency-Weighted Trend Baseline and Next Month Forecast Range
func CalculateTrendDeviation(currentPrice float64, bars []types.HistoryBar) *ValuationAnalysis {
	if currentPrice <= 0 && len(bars) > 0 {
		currentPrice = bars[len(bars)-1].Close
	}

	type MonthStats struct {
		High float64
		Low  float64
	}

	monthMap := make(map[string]*MonthStats)
	monthKeys := make([]string, 0)

	startIdx := 0
	if len(bars) > 252 {
		startIdx = len(bars) - 252
	}

	for i := startIdx; i < len(bars); i++ {
		b := bars[i]
		// Normalize date format safely (supports YYYY-MM-DD, YYYY/MM/DD, ISO timestamps)
		ym := b.Date
		if len(b.Date) >= 7 {
			ym = b.Date[:7]
		}

		if stats, exists := monthMap[ym]; exists {
			if b.High > stats.High {
				stats.High = b.High
			}
			if b.Low < stats.Low && b.Low > 0 {
				stats.Low = b.Low
			}
		} else {
			monthMap[ym] = &MonthStats{
				High: b.High,
				Low:  b.Low,
			}
			monthKeys = append(monthKeys, ym)
		}
	}

	if len(monthKeys) > 12 {
		monthKeys = monthKeys[len(monthKeys)-12:]
	}

	weightedMeanSum := 0.0
	totalWeight := 0.0
	monthlyVolatilityPercSum := 0.0
	monthlyTrendChangeSum := 0.0
	trendCount := 0

	monthlyMeans := make([]float64, 0, len(monthKeys))

	for idx, ym := range monthKeys {
		stats := monthMap[ym]
		monthMean := (stats.High + stats.Low) / 2.0
		monthlyMeans = append(monthlyMeans, monthMean)

		weight := float64(idx + 1)
		weightedMeanSum += monthMean * weight
		totalWeight += weight

		if monthMean > 0 {
			mVolPerc := (stats.High - stats.Low) / monthMean
			monthlyVolatilityPercSum += mVolPerc
		}

		if idx > 0 && monthlyMeans[idx-1] > 0 {
			pctChange := (monthMean - monthlyMeans[idx-1]) / monthlyMeans[idx-1]
			monthlyTrendChangeSum += pctChange
			trendCount++
		}
	}

	weightedTrendPrice := currentPrice
	if totalWeight > 0 {
		weightedTrendPrice = weightedMeanSum / totalWeight
	}

	avgMonthlyVolPerc := 0.10
	if len(monthKeys) > 0 {
		avgMonthlyVolPerc = monthlyVolatilityPercSum / float64(len(monthKeys))
	}

	avgMonthlyTrendGrowth := 0.0
	if trendCount > 0 {
		avgMonthlyTrendGrowth = monthlyTrendChangeSum / float64(trendCount)
	}

	nextMonthForecast := currentPrice * (1.0 + avgMonthlyTrendGrowth)
	halfBandPerc := avgMonthlyVolPerc / 2.0
	nextMonthMin := nextMonthForecast * (1.0 - halfBandPerc)
	nextMonthMax := nextMonthForecast * (1.0 + halfBandPerc)

	priceToTrendDeviation := 0.0
	if weightedTrendPrice > 0 {
		priceToTrendDeviation = ((weightedTrendPrice - currentPrice) / weightedTrendPrice) * 100.0
	}

	valStatus := "FAIRLY_VALUED"
	buyZone := "HOLD"

	if priceToTrendDeviation >= 10.0 {
		valStatus = "DEEPLY_UNDERVALUED"
		buyZone = "STRONG_BUY"
	} else if priceToTrendDeviation >= 3.0 {
		valStatus = "UNDERVALUED"
		buyZone = "BUY"
	} else if priceToTrendDeviation <= -10.0 {
		valStatus = "DEEPLY_OVERVALUED"
		buyZone = "STRONG_SELL"
	} else if priceToTrendDeviation <= -3.0 {
		valStatus = "OVERVALUED"
		buyZone = "SELL"
	}

	return &ValuationAnalysis{
		CurrentPrice:          currentPrice,
		WeightedTrendPrice:    weightedTrendPrice,
		PriceToTrendDeviation: priceToTrendDeviation,
		ValuationStatus:       valStatus,
		BuySellZone:           buyZone,
		NextMonthForecast:     nextMonthForecast,
		NextMonthMin:          nextMonthMin,
		NextMonthMax:          nextMonthMax,
		MonthlyVolPerc:        avgMonthlyVolPerc * 100.0,
		MonthlyGrowthPerc:     avgMonthlyTrendGrowth * 100.0,
	}
}

// ValuationRatios holds pure valuation metrics (PEG Ratio, PEGY Ratio, Earnings Yield)
type ValuationRatios struct {
	PEGRatio      float64
	PEGYRatio     float64
	EarningsYield float64
}

// CalculateValuationRatios computes PEG Ratio, PEGY Ratio (P/E / (Growth % + Dividend Yield %)),
// and Earnings Yield % ((Trailing EPS / Current Price) * 100).
func CalculateValuationRatios(rawPeg float64, peRatio float64, eps float64, currentPrice float64, earningsGrowth float64, dividendYield float64) *ValuationRatios {
	peg := 0.0
	pegy := 0.0
	earningsYield := 0.0

	// Standardize growth rate
	growthPercentage := earningsGrowth
	if growthPercentage > 0 && growthPercentage < 2.0 {
		growthPercentage = growthPercentage * 100.0 // Convert decimal 0.15 -> 15.0%
	}

	// 1. PEG Ratio: Use Yahoo Finance's direct PegRatio if provided and valid (> 0)
	if rawPeg > 0 {
		peg = rawPeg
	} else {
		// Fallback: Trailing P/E / Earnings Growth %
		if peRatio > 0 && growthPercentage > 0 {
			peg = peRatio / growthPercentage
		}
	}

	// 2. PEGY Ratio: Trailing P/E / (Earnings Growth % + Dividend Yield %)
	divYieldPercentage := dividendYield
	if divYieldPercentage > 0 && divYieldPercentage < 1.0 {
		divYieldPercentage = divYieldPercentage * 100.0 // Convert decimal 0.015 -> 1.5%
	}

	totalReturnRate := growthPercentage + divYieldPercentage
	if peRatio > 0 && totalReturnRate > 0 {
		pegy = peRatio / totalReturnRate
	}

	// 3. Earnings Yield % Calculation: (EPS / Current Price) * 100
	if currentPrice > 0 && eps > 0 {
		earningsYield = (eps / currentPrice) * 100.0
	} else if peRatio > 0 {
		// Fallback: Inverse of P/E ratio ( (1 / P/E) * 100 )
		earningsYield = (1.0 / peRatio) * 100.0
	}

	return &ValuationRatios{
		PEGRatio:      peg,
		PEGYRatio:     pegy,
		EarningsYield: earningsYield,
	}
}

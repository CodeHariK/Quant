package fetcher

import (
	"fmt"
	"log"
	"math"
	"time"

	"github.com/wnjoon/go-yfinance/pkg/models"
	"github.com/wnjoon/go-yfinance/pkg/multi"
	"github.com/wnjoon/go-yfinance/pkg/ticker"
	"haunter/config"
	"haunter/logger"
	"haunter/store"
	"haunter/types"
)

// FetchFullValuationReport fetches 5-Year Core Valuation Data (Info, 5y History, 5y CashFlow, 5y IncomeStatement, 5y BalanceSheet).
// Preserves the COMPLETE raw info model & financial statements without discarding any fields.
func FetchFullValuationReport(symbol string, forceRefresh bool) (*types.FullValuationReport, error) {
	st := store.GetStore()

	// 1. Check local BoltDB cache first (if not forcing refresh)
	if !forceRefresh && st != nil {
		if cachedReport, ok := st.GetValuationReport(symbol); ok {
			log.Printf("📦 [CACHE_HIT] Loaded 5-Year Valuation Report for [%s] from BoltDB (Last updated %s ago)\n",
				symbol, time.Since(cachedReport.FetchedAt).Truncate(time.Second))
			return cachedReport, nil
		}
	}

	log.Printf("🌐 [CACHE_MISS] Fetching 5-Year Valuation Report for [%s] from Yahoo Finance...\n", symbol)

	if err := logger.LogYahooRequest(fmt.Sprintf("FetchFullValuationReport(5Y, %s)", symbol)); err != nil {
		return nil, err
	}

	t, err := ticker.New(symbol)
	if err != nil {
		return nil, fmt.Errorf("go-yfinance ticker initialization failed for %s: %v", symbol, err)
	}
	defer t.Close()

	// 1. Raw Info (Complete company profile, ratios, statistics)
	rawInfo, _ := t.Info()
	if rawInfo == nil {
		rawInfo = &models.Info{Symbol: symbol, LongName: symbol}
	}

	// 2. History (5-Year Daily OHLCV Candles)
	bars, _ := t.History(models.HistoryParams{Period: "5y", Interval: "1d"})
	historyBars := make([]types.HistoryBar, 0, len(bars))
	for _, b := range bars {
		historyBars = append(historyBars, types.HistoryBar{
			Date:   b.Date.Format("2006-01-02"),
			Open:   b.Open,
			High:   b.High,
			Low:    b.Low,
			Close:  b.Close,
			Volume: b.Volume,
		})
	}

	// Helper to extract complete financial statement fields dynamically without dropping keys
	extractStatement := func(fs *models.FinancialStatement) []types.FinancialStatementItem {
		items := make([]types.FinancialStatementItem, 0)
		if fs == nil {
			return items
		}
		for _, date := range fs.Dates {
			vals := make(map[string]float64)
			for _, field := range fs.Fields() {
				if val, ok := fs.Get(field, date); ok {
					vals[field] = val
				}
			}
			items = append(items, types.FinancialStatementItem{
				Period: date.Format("2006-01-02"),
				Values: vals,
			})
		}
		return items
	}

	// 3. CashFlow (All annual line items)
	cfItems := make([]types.FinancialStatementItem, 0)
	if cf, err := t.CashFlow(string(models.FrequencyAnnual)); err == nil && cf != nil {
		cfItems = extractStatement(cf)
	}

	// 4. IncomeStatement (All annual line items)
	isItems := make([]types.FinancialStatementItem, 0)
	if inc, err := t.IncomeStatement(string(models.FrequencyAnnual)); err == nil && inc != nil {
		isItems = extractStatement(inc)
	}

	// 5. BalanceSheet (All annual line items)
	bsItems := make([]types.FinancialStatementItem, 0)
	if bs, err := t.BalanceSheet(string(models.FrequencyAnnual)); err == nil && bs != nil {
		bsItems = extractStatement(bs)
	}

	// Helper to calculate Sharpe Ratio, Sortino Ratio, Annualized Volatility, and Max Drawdown
	computeRiskMetrics := func(bars []types.HistoryBar) (sharpe float64, sortino float64, vol float64, maxDD float64) {
		if len(bars) < 2 {
			return 0, 0, 0, 0
		}

		// Calculate daily returns
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

			if i > 0 && bars[i-1].Close > 0 {
				r := (bars[i].Close - bars[i-1].Close) / bars[i-1].Close
				returns = append(returns, r)
			}
		}

		if len(returns) == 0 {
			return 0, 0, 0, maxDrawdownVal
		}

		// Calculate Mean Daily Return
		sumReturn := 0.0
		for _, r := range returns {
			sumReturn += r
		}
		meanReturn := sumReturn / float64(len(returns))

		// Calculate Total Variance & Downside Variance
		sumSquareDiff := 0.0
		sumDownsideSquareDiff := 0.0
		downsideCount := 0

		// Risk-free rate assumptions from config
		annualRiskFreeRate := config.AnnualRiskFreeRate
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

		// Annualized Return & Annualized Volatility (252 trading days)
		annualizedReturn := meanReturn * config.TradingDaysPerYear
		annualizedVol := dailyVolatility * math.Sqrt(config.TradingDaysPerYear)

		// Annualized Downside Volatility
		downsideVolatility := 0.0
		if len(returns) > 0 && sumDownsideSquareDiff > 0 {
			downsideVolatility = math.Sqrt(sumDownsideSquareDiff/float64(len(returns))) * math.Sqrt(config.TradingDaysPerYear)
		}

		// Sharpe Ratio = (Annualized Return - Risk Free Rate) / Annualized Volatility
		if annualizedVol > 0 {
			sharpe = (annualizedReturn - annualRiskFreeRate) / annualizedVol
		}

		// Sortino Ratio = (Annualized Return - Risk Free Rate) / Downside Volatility
		if downsideVolatility > 0 {
			sortino = (annualizedReturn - annualRiskFreeRate) / downsideVolatility
		}

		return sharpe, sortino, annualizedVol * 100.0, maxDrawdownVal * 100.0
	}

	sharpeVal, sortinoVal, volVal, maxDDVal := computeRiskMetrics(historyBars)

	// 1-Year Recency-Weighted Monthly Mean Valuation & Next Month Forecast Engine
	computeValuation := func(info *models.Info, bars []types.HistoryBar) (float64, float64, float64, string, string, float64, float64, float64, float64, float64, float64, float64) {
		currentPrice := 0.0
		if info != nil {
			currentPrice = info.CurrentPrice
		}
		if currentPrice == 0 && len(bars) > 0 {
			currentPrice = bars[len(bars)-1].Close
		}

		peRatio := 0.0
		sectorPE := 22.5
		if info != nil {
			peRatio = info.TrailingPE
		}

		// Group price bars by year-month (YYYY-MM) over the last 12 months (252 trading bars)
		type MonthStats struct {
			High float64
			Low  float64
		}

		monthMap := make(map[string]*MonthStats)
		monthKeys := make([]string, 0)

		// Filter for the last ~252 trading bars (1 Year)
		startIdx := 0
		if len(bars) > 252 {
			startIdx = len(bars) - 252
		}

		for i := startIdx; i < len(bars); i++ {
			b := bars[i]
			// Parse date timestamp string (e.g., 2026-08-15) to YYYY-MM
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

		// Keep at most last 12 months
		if len(monthKeys) > 12 {
			monthKeys = monthKeys[len(monthKeys)-12:]
		}

		// Calculate:
		// 1. Average Monthly Volatility Percentage Spread: mean( (High - Low) / MonthAvg )
		// 2. Average Monthly Trend Growth Rate: mean( (MonthAvg[i] - MonthAvg[i-1]) / MonthAvg[i-1] )
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

			weight := float64(idx + 1) // Linear recency weight
			weightedMeanSum += monthMean * weight
			totalWeight += weight

			// Calculate percentage spread for this month: (High - Low) / MonthAvg
			if monthMean > 0 {
				mVolPerc := (stats.High - stats.Low) / monthMean
				monthlyVolatilityPercSum += mVolPerc
			}

			// Calculate month-over-month percentage price trend change
			if idx > 0 && monthlyMeans[idx-1] > 0 {
				pctChange := (monthMean - monthlyMeans[idx-1]) / monthlyMeans[idx-1]
				monthlyTrendChangeSum += pctChange
				trendCount++
			}
		}

		intrinsicValue := currentPrice
		if totalWeight > 0 {
			intrinsicValue = weightedMeanSum / totalWeight
		}

		// Average Volatility Percentage per month
		avgMonthlyVolPerc := 0.10 // 10% default fallback
		if len(monthKeys) > 0 {
			avgMonthlyVolPerc = monthlyVolatilityPercSum / float64(len(monthKeys))
		}

		// Average Month-over-Month Trend Growth Rate %
		avgMonthlyTrendGrowth := 0.0
		if trendCount > 0 {
			avgMonthlyTrendGrowth = monthlyTrendChangeSum / float64(trendCount)
		}

		// Project Next Month Forecast Target Price: Current Price * (1 + Average Monthly Trend Growth)
		nextMonthForecast := currentPrice * (1.0 + avgMonthlyTrendGrowth)

		// Expected Next Month Lower & Upper Range Bounds using the Mean Volatility Percentage Spread
		halfBandPerc := avgMonthlyVolPerc / 2.0
		nextMonthMin := nextMonthForecast * (1.0 - halfBandPerc)
		nextMonthMax := nextMonthForecast * (1.0 + halfBandPerc)

		// Calculate Margin of Safety (% Discount or Premium relative to 1Y Recency-Weighted Fair Value)
		marginOfSafety := 0.0
		if intrinsicValue > 0 {
			marginOfSafety = ((intrinsicValue - currentPrice) / intrinsicValue) * 100.0
		}

		// Determine Valuation Status & Buy/Sell Zone
		valStatus := "FAIRLY_VALUED"
		buyZone := "HOLD"

		if marginOfSafety >= 10.0 {
			valStatus = "DEEPLY_UNDERVALUED"
			buyZone = "STRONG_BUY"
		} else if marginOfSafety >= 3.0 {
			valStatus = "UNDERVALUED"
			buyZone = "BUY"
		} else if marginOfSafety <= -10.0 {
			valStatus = "DEEPLY_OVERVALUED"
			buyZone = "STRONG_SELL"
		} else if marginOfSafety <= -3.0 {
			valStatus = "OVERVALUED"
			buyZone = "SELL"
		}

		return currentPrice, intrinsicValue, marginOfSafety, valStatus, buyZone, peRatio, sectorPE, nextMonthForecast, nextMonthMin, nextMonthMax, avgMonthlyVolPerc * 100.0, avgMonthlyTrendGrowth * 100.0
	}

	curPrice, fairValue, marginSafety, valStatus, buyZone, relPE, secPE, nextFC, nextMin, nextMax, mVolPerc, mGrowthPerc := computeValuation(rawInfo, historyBars)

	report := &types.FullValuationReport{
		Symbol:               symbol,
		FetchedAt:            time.Now(),
		SharpeRatio:          sharpeVal,
		SortinoRatio:         sortinoVal,
		AnnualizedVolatility: volVal,
		MaxDrawdown:          maxDDVal,
		CurrentPrice:         curPrice,
		IntrinsicValue:       fairValue,
		MarginOfSafety:       marginSafety,
		ValuationStatus:      valStatus,
		BuySellZone:          buyZone,
		RelativePE:           relPE,
		SectorPE:             secPE,
		NextMonthForecast:    nextFC,
		NextMonthMin:         nextMin,
		NextMonthMax:         nextMax,
		MonthlyVolPerc:       mVolPerc,
		MonthlyGrowthPerc:    mGrowthPerc,
		RawInfo:              rawInfo,
		History:              historyBars,
		CashFlow:             cfItems,
		IncomeStatement:      isItems,
		BalanceSheet:         bsItems,
	}

	// Save complete 5-year report to BoltDB
	if st != nil {
		if err := st.SaveValuationReport(report); err != nil {
			log.Printf("⚠️ Failed to save report for [%s] to BoltDB: %v\n", symbol, err)
		} else {
			log.Printf("💾 [CACHE_STORED] Saved Complete 5-Year Valuation Report for [%s] (Sharpe: %.2f, Volatility: %.2f%%)\n",
				symbol, sharpeVal, volVal)
		}
	}

	return report, nil
}

// FetchMultiWatchlist batch fetches historical bar data for multiple tickers concurrently via go-yfinance multi package.
func FetchMultiWatchlist(symbols []string, period string, interval string) (map[string][]types.HistoryBar, error) {
	if err := logger.LogYahooRequest(fmt.Sprintf("FetchMultiWatchlist(%v)", symbols)); err != nil {
		return nil, err
	}

	result, err := multi.Download(symbols, &models.DownloadParams{
		Period:   period,
		Interval: interval,
	})
	if err != nil {
		return nil, fmt.Errorf("multi.Download failed: %v", err)
	}

	output := make(map[string][]types.HistoryBar)
	for sym, bars := range result.Data {
		hBars := make([]types.HistoryBar, 0, len(bars))
		for _, b := range bars {
			hBars = append(hBars, types.HistoryBar{
				Date:   b.Date.Format("2006-01-02"),
				Open:   b.Open,
				High:   b.High,
				Low:    b.Low,
				Close:  b.Close,
				Volume: b.Volume,
			})
		}
		output[sym] = hBars
	}

	return output, nil
}

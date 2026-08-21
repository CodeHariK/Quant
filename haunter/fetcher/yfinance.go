package fetcher

import (
	"fmt"
	"log"
	"time"

	"github.com/wnjoon/go-yfinance/pkg/models"
	"github.com/wnjoon/go-yfinance/pkg/multi"
	"github.com/wnjoon/go-yfinance/pkg/ticker"
	"haunter/analyzer"
	"haunter/config"
	"haunter/logger"
	"haunter/store"
	"haunter/types"
)

// FetchFullValuationReport fetches Core Valuation Data (Info, History by period, 5y CashFlow, 5y IncomeStatement, 5y BalanceSheet).
// Preserves the COMPLETE raw info model & financial statements without discarding any fields.
func FetchFullValuationReport(symbol string, forceRefresh bool, period string) (*types.FullValuationReport, error) {
	st := store.GetStore()

	cacheKey := fmt.Sprintf("%s:%s", symbol, period)
	// 1. Check local BoltDB cache first (if not forcing refresh)
	if !forceRefresh && st != nil {
		if cachedReport, ok := st.GetValuationReport(cacheKey); ok {
			// Auto-refresh if cache is older than 1 week
			if time.Since(cachedReport.FetchedAt) < 7*24*time.Hour {
				log.Printf("📦 [CACHE_HIT] Loaded Valuation Report for [%s] from BoltDB (Last updated %s ago)\n",
					symbol, time.Since(cachedReport.FetchedAt).Truncate(time.Second))
				return cachedReport, nil
			}
			log.Printf("⏰ [CACHE_EXPIRED] Cache for [%s] is older than 1 week (Last updated %s ago). Auto-refreshing from Yahoo Finance...\n",
				symbol, time.Since(cachedReport.FetchedAt).Truncate(time.Second))
		}
	}

	log.Printf("🌐 [CACHE_MISS] Fetching Valuation Report for [%s] from Yahoo Finance (Period: %s)...\n", symbol, period)

	if err := logger.LogYahooRequest(fmt.Sprintf("FetchFullValuationReport(%s, %s)", period, symbol)); err != nil {
		return nil, err
	}

	t, err := ticker.New(symbol)
	if err != nil {
		return nil, fmt.Errorf("go-yfinance ticker initialization failed for %s: %v", symbol, err)
	}
	defer t.Close()

	// 1. Raw Info (Complete company profile, ratios, statistics)
	rawInfo, err := t.Info()
	if err != nil {
		log.Printf("⚠️ Warning: Failed to fetch Info for %s: %v", symbol, err)
		rawInfo = &models.Info{Symbol: symbol, LongName: symbol} // Safe fallback
	}

	// 2. History (Daily OHLCV Candles for requested period)
	bars, err := t.History(models.HistoryParams{Period: period, Interval: "1d"})
	if err != nil {
		log.Printf("⚠️ Error: Failed to fetch %s History for %s: %v", period, symbol, err)
		return nil, fmt.Errorf("failed to fetch %s daily history bars for %s: %w", period, symbol, err)
	}

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
	} else if err != nil {
		log.Printf("⚠️ Warning: Failed to fetch CashFlow for %s: %v", symbol, err)
	}

	// 4. IncomeStatement (All annual line items)
	isItems := make([]types.FinancialStatementItem, 0)
	if inc, err := t.IncomeStatement(string(models.FrequencyAnnual)); err == nil && inc != nil {
		isItems = extractStatement(inc)
	} else if err != nil {
		log.Printf("⚠️ Warning: Failed to fetch IncomeStatement for %s: %v", symbol, err)
	}

	// 5. BalanceSheet (All annual line items)
	bsItems := make([]types.FinancialStatementItem, 0)
	if bs, err := t.BalanceSheet(string(models.FrequencyAnnual)); err == nil && bs != nil {
		bsItems = extractStatement(bs)
	} else if err != nil {
		log.Printf("⚠️ Warning: Failed to fetch BalanceSheet for %s: %v", symbol, err)
	}

	// 6. Wall Street Recommendation Trends
	recTrend, err := t.Recommendations()
	if err != nil {
		log.Printf("⚠️ Warning: Failed to fetch Recommendations for %s: %v", symbol, err)
	} else if recTrend != nil {
		log.Printf("🔍 Debug Recommendations for %s: %+v", symbol, recTrend)
	}

	// Pure Package-Level Quant Calculations (Delegated to haunter/analyzer)
	sharpeVal, sortinoVal, volVal, maxDDVal := analyzer.CalculateRiskMetrics(historyBars, config.AnnualRiskFreeRate)

	curPrice := rawInfo.CurrentPrice
	if curPrice == 0 && len(historyBars) > 0 {
		curPrice = historyBars[len(historyBars)-1].Close
	}

	trendAnalysis := analyzer.CalculateTrendDeviation(curPrice, historyBars)

	peRatio := rawInfo.TrailingPE
	eps := rawInfo.TrailingEps
	earningsGrowth := rawInfo.EarningsGrowth
	rawPeg := rawInfo.PegRatio
	divYield := rawInfo.DividendYield

	quantRatios := analyzer.CalculateValuationRatios(rawPeg, peRatio, eps, curPrice, earningsGrowth, divYield)

	// Technical Analysis (RSI, MACD, Bollinger Bands) using cinar/indicator
	closingPrices := make([]float64, 0, len(historyBars))
	for _, b := range historyBars {
		closingPrices = append(closingPrices, b.Close)
	}
	taResult, err := analyzer.AnalyzeStock(symbol, closingPrices)
	if err != nil {
		log.Printf("⚠️ Warning: Failed to calculate technical indicators for %s: %v", symbol, err)
	}

	report := &types.FullValuationReport{
		Symbol:                symbol,
		FetchedAt:             time.Now(),
		SharpeRatio:           sharpeVal,
		SortinoRatio:          sortinoVal,
		AnnualizedVolatility:  volVal,
		MaxDrawdown:           maxDDVal,
		CurrentPrice:          curPrice,
		WeightedTrendPrice:    trendAnalysis.WeightedTrendPrice,
		IntrinsicValue:        trendAnalysis.WeightedTrendPrice, // Trend price baseline
		PriceToTrendDeviation: trendAnalysis.PriceToTrendDeviation,
		MarginOfSafety:        trendAnalysis.PriceToTrendDeviation, // Trend deviation %
		ValuationStatus:       trendAnalysis.ValuationStatus,
		BuySellZone:           trendAnalysis.BuySellZone,
		RelativePE:            peRatio,
		PEGRatio:              quantRatios.PEGRatio,
		PEGYRatio:             quantRatios.PEGYRatio,
		EarningsYield:         quantRatios.EarningsYield,
		Recommendations:       recTrend,
		NextMonthForecast:     trendAnalysis.NextMonthForecast,
		NextMonthMin:          trendAnalysis.NextMonthMin,
		NextMonthMax:          trendAnalysis.NextMonthMax,
		MonthlyVolPerc:        trendAnalysis.MonthlyVolPerc,
		MonthlyGrowthPerc:     trendAnalysis.MonthlyGrowthPerc,
		RawInfo:               rawInfo,
		History:               historyBars,
		TechnicalAnalysis:     taResult,
		CashFlow:              cfItems,
		IncomeStatement:       isItems,
		BalanceSheet:          bsItems,
	}

	// Save complete 5-year report to BoltDB
	if st != nil {
		if err := st.SaveValuationReport(cacheKey, report); err != nil {
			log.Printf("⚠️ Failed to cache report for %s: %v", cacheKey, err)
		} else {
			log.Printf("💾 [CACHE_STORED] Saved Report for [%s] (Sharpe: %.2f, Sortino: %.2f, Volatility: %.2f%%)\n",
				symbol, sharpeVal, sortinoVal, volVal)
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

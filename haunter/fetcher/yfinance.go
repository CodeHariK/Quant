package fetcher

import (
	"fmt"
	"log"
	"time"

	"github.com/wnjoon/go-yfinance/pkg/models"
	"github.com/wnjoon/go-yfinance/pkg/multi"
	"github.com/wnjoon/go-yfinance/pkg/ticker"
	"haunter/logger"
	"haunter/store"
	"haunter/types"
)

// FetchFullValuationReport fetches 5-Year Core Valuation Data (Info, 5y History, 5y CashFlow, 5y IncomeStatement, 5y BalanceSheet).
// Uses BoltDB embedded caching (24-hour TTL). Pass forceRefresh = true to override cache.
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

	// Log rate limit request
	if err := logger.LogYahooRequest(fmt.Sprintf("FetchFullValuationReport(5Y, %s)", symbol)); err != nil {
		return nil, err
	}

	t, err := ticker.New(symbol)
	if err != nil {
		return nil, fmt.Errorf("go-yfinance ticker initialization failed for %s: %v", symbol, err)
	}
	defer t.Close()

	// 1. Info (Key Ratios & Company Overview)
	var stockInfo *types.StockInfo
	if info, err := t.Info(); err == nil && info != nil {
		name := info.LongName
		if name == "" {
			name = info.ShortName
		}
		if name == "" {
			name = symbol
		}
		stockInfo = &types.StockInfo{
			Symbol:           symbol,
			LongName:         name,
			Sector:           info.Sector,
			Industry:         info.Industry,
			CurrentPrice:     info.CurrentPrice,
			MarketCap:        info.MarketCap,
			TrailingPE:       info.TrailingPE,
			ForwardPE:        info.ForwardPE,
			PriceToBook:      info.PriceToBook,
			PEGRatio:         info.PegRatio,
			BookValue:        info.BookValue,
			EBITDA:           float64(info.Ebitda),
			TotalCash:        float64(info.TotalCash),
			TotalDebt:        float64(info.TotalDebt),
			DebtToEquity:     info.DebtToEquity,
			ProfitMargins:    info.ProfitMargins,
			OperatingMargins: info.OperatingMargins,
			FiftyTwoWeekHigh: info.FiftyTwoWeekHigh,
			FiftyTwoWeekLow:  info.FiftyTwoWeekLow,
			TargetMeanPrice:  info.TargetMeanPrice,
		}
	} else {
		stockInfo = &types.StockInfo{Symbol: symbol, LongName: symbol}
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

	// Helper to extract multi-year financial statements
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

	// 3. CashFlow (Multi-Year Annual DCF inputs: Operating Cash Flow, CapEx, FCF)
	cfItems := make([]types.FinancialStatementItem, 0)
	if cf, err := t.CashFlow(string(models.FrequencyAnnual)); err == nil && cf != nil {
		cfItems = extractStatement(cf)
	}

	// 4. IncomeStatement (Multi-Year Annual Revenue, EBIT, Net Income)
	isItems := make([]types.FinancialStatementItem, 0)
	if inc, err := t.IncomeStatement(string(models.FrequencyAnnual)); err == nil && inc != nil {
		isItems = extractStatement(inc)
	}

	// 5. BalanceSheet (Multi-Year Annual Assets, Debt, Cash reserves)
	bsItems := make([]types.FinancialStatementItem, 0)
	if bs, err := t.BalanceSheet(string(models.FrequencyAnnual)); err == nil && bs != nil {
		bsItems = extractStatement(bs)
	}

	report := &types.FullValuationReport{
		Symbol:          symbol,
		FetchedAt:       time.Now(),
		Info:            stockInfo,
		History:         historyBars,
		CashFlow:        cfItems,
		IncomeStatement: isItems,
		BalanceSheet:    bsItems,
	}

	// Save fresh 5-year report to BoltDB
	if st != nil {
		if err := st.SaveValuationReport(report); err != nil {
			log.Printf("⚠️ Failed to save report for [%s] to BoltDB: %v\n", symbol, err)
		} else {
			log.Printf("💾 [CACHE_STORED] Saved 5-Year Valuation Report for [%s] to BoltDB (5y candles: %d)\n", symbol, len(historyBars))
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

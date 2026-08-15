package fetcher

import (
	"fmt"
	"time"

	"github.com/wnjoon/go-yfinance/pkg/models"
	"github.com/wnjoon/go-yfinance/pkg/ticker"
	"haunter/types"
)

type StockData struct {
	Symbol      string
	Price       float64
	Timestamps  []time.Time
	ClosePrices []float64
}

// FetchHistory fetches OHLCV history using native github.com/wnjoon/go-yfinance Go package
func FetchHistory(symbol string, interval string, rangeStr string) (*StockData, error) {
	t, err := ticker.New(symbol)
	if err != nil {
		return nil, fmt.Errorf("go-yfinance ticker initialization failed for %s: %v", symbol, err)
	}
	defer t.Close()

	bars, err := t.History(models.HistoryParams{
		Period:   rangeStr,
		Interval: interval,
	})
	if err != nil {
		return nil, fmt.Errorf("go-yfinance history fetch failed for %s: %v", symbol, err)
	}

	if len(bars) == 0 {
		return nil, fmt.Errorf("no bar data found for %s", symbol)
	}

	var cleanPrices []float64
	var timestamps []time.Time

	for _, bar := range bars {
		if bar.Close > 0 {
			cleanPrices = append(cleanPrices, bar.Close)
			timestamps = append(timestamps, bar.Date)
		}
	}

	latestPrice := cleanPrices[len(cleanPrices)-1]

	return &StockData{
		Symbol:      symbol,
		Price:       latestPrice,
		Timestamps:  timestamps,
		ClosePrices: cleanPrices,
	}, nil
}

// FetchStockInfo fetches complete company info & valuation metrics using native github.com/wnjoon/go-yfinance Go package
func FetchStockInfo(symbol string) (*types.StockInfo, error) {
	t, err := ticker.New(symbol)
	if err != nil {
		return nil, fmt.Errorf("go-yfinance ticker initialization failed for %s: %v", symbol, err)
	}
	defer t.Close()

	info, err := t.Info()
	if err != nil {
		return nil, fmt.Errorf("go-yfinance info fetch failed for %s: %v", symbol, err)
	}

	name := info.LongName
	if name == "" {
		name = info.ShortName
	}
	if name == "" {
		name = symbol
	}

	return &types.StockInfo{
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
	}, nil
}

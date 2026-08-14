package fetcher

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type YFinanceResponse struct {
	Chart struct {
		Result []struct {
			Meta struct {
				Symbol             string  `json:"symbol"`
				RegularMarketPrice float64 `json:"regularMarketPrice"`
			} `json:"meta"`
			Timestamp []int64 `json:"timestamp"`
			Indicators struct {
				Quote []struct {
					Close  []float64 `json:"close"`
					Open   []float64 `json:"open"`
					High   []float64 `json:"high"`
					Low    []float64 `json:"low"`
					Volume []int64   `json:"volume"`
				} `json:"quote"`
			} `json:"indicators"`
		} `json:"result"`
		Error interface{} `json:"error"`
	} `json:"chart"`
}

type StockData struct {
	Symbol      string
	Price       float64
	Timestamps  []time.Time
	ClosePrices []float64
}

// FetchHistory fetches OHLCV history from Yahoo Finance v8 API in pure Go
func FetchHistory(symbol string, interval string, rangeStr string) (*StockData, error) {
	url := fmt.Sprintf("https://query1.finance.yahoo.com/v8/finance/chart/%s?interval=%s&range=%s", symbol, interval, rangeStr)
	
	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("yahoo finance api returned status: %d", resp.StatusCode)
	}

	var data YFinanceResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}

	if len(data.Chart.Result) == 0 {
		return nil, fmt.Errorf("no data found for symbol %s", symbol)
	}

	res := data.Chart.Result[0]
	quotes := res.Indicators.Quote[0].Close

	// Clean NaNs / null prices
	var cleanPrices []float64
	var timestamps []time.Time

	for i, p := range quotes {
		if p > 0 {
			cleanPrices = append(cleanPrices, p)
			if i < len(res.Timestamp) {
				timestamps = append(timestamps, time.Unix(res.Timestamp[i], 0))
			}
		}
	}

	return &StockData{
		Symbol:      res.Meta.Symbol,
		Price:       res.Meta.RegularMarketPrice,
		Timestamps:  timestamps,
		ClosePrices: cleanPrices,
	}, nil
}

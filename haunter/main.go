package main

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"strings"
	"time"

	"haunter/analyzer"
	"haunter/api"
	"haunter/fetcher"
	"haunter/types"
)

var watchlist = []string{"AAPL", "GOOGL", "MSFT", "AMZN", "META"}

func main() {
	fmt.Println("🚀 Starting Haunter Backend Server...")
	fmt.Println("---------------------------------------------------------------")

	hub := api.NewSSEHub()
	go hub.Run()

	// 1. SSE Stream endpoint on /api/stream
	http.Handle("/api/stream", hub)

	// 2. Stock Info REST endpoint on /api/stock-info?symbol=RELIANCE.NS
	http.HandleFunc("/api/stock-info", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Content-Type", "application/json")

		symbol := r.URL.Query().Get("symbol")
		if symbol == "" {
			symbol = "RELIANCE.NS"
		}

		info, err := fetcher.FetchStockInfo(symbol)
		if err != nil {
			http.Error(w, fmt.Sprintf(`{"error": "%v"}`, err), http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(info)
	})

	go func() {
		fmt.Println("📡 HTTP & SSE Server listening on http://localhost:8080")
		if err := http.ListenAndServe(":8080", nil); err != nil {
			fmt.Printf("❌ HTTP Server Error: %v\n", err)
		}
	}()

	// Background ticker for watchdog cycles
	go runBackgroundSimulation(hub)

	runWatchdogCycle(hub)

	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		runWatchdogCycle(hub)
	}
}

func runWatchdogCycle(hub *api.SSEHub) {
	fmt.Printf("\n⏰ [%s] Fetching Watchlist Quotes...\n", time.Now().Format("15:04:05"))

	for _, symbol := range watchlist {
		stockData, err := fetcher.FetchHistory(symbol, "1d", "3mo")
		if err != nil {
			fmt.Printf("❌ Error fetching %s: %v\n", symbol, err)
			continue
		}

		res, err := analyzer.AnalyzeStock(symbol, stockData.ClosePrices)
		if err != nil {
			fmt.Printf("⚠️ Analysis error for %s: %v\n", symbol, err)
			continue
		}

		warningsStr := "None"
		if len(res.Warnings) > 0 {
			warningsStr = strings.Join(res.Warnings, " | ")
		}

		fmt.Printf("[%s] Price: $%.2f | Trend: %s | RSI: %.1f | Status: %s (%s)\n",
			res.Symbol, res.LatestPrice, res.TrendStatus, res.RSI14, res.CautionLevel, warningsStr)

		// Broadcast Watchdog SSE Event
		hub.Broadcast(types.SSEEvent{
			Event: types.EventWatchdog,
			Data: types.WatchdogPayload{
				Symbol:       res.Symbol,
				LatestPrice:  res.LatestPrice,
				TrendStatus:  res.TrendStatus,
				RSI14:        res.RSI14,
				CautionLevel: types.CautionLevel(res.CautionLevel),
				Warnings:     res.Warnings,
				Timestamp:    time.Now(),
			},
		})
	}
}

func runBackgroundSimulation(hub *api.SSEHub) {
	simTicker := time.NewTicker(2 * time.Second)
	defer simTicker.Stop()

	symbols := []string{"TSLA", "NDX", "NVDA", "MSFT", "AMZN", "GOOGL", "PLTR"}

	for range simTicker.C {
		// Broadcast random ticker updates
		sym := symbols[rand.Intn(len(symbols))]
		change := (rand.Float64()*4 - 2.0)
		hub.Broadcast(types.SSEEvent{
			Event: types.EventMarketTicker,
			Data: types.MarketTickerPayload{
				Symbol:        sym,
				Price:         200.0 + rand.Float64()*100,
				ChangePercent: change,
				IsPositive:    change >= 0,
			},
		})
	}
}

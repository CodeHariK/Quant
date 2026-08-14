package main

import (
	"fmt"
	"strings"
	"time"

	"haunter/analyzer"
	"haunter/fetcher"
)

var watchlist = []string{"AAPL", "GOOGL", "MSFT", "AMZN", "META"}

func main() {
	fmt.Println("🚀 Starting Ultra-Lightweight Go Quant Stock Watchdog Server...")
	fmt.Println("---------------------------------------------------------------")

	runWatchdogCycle()

	// Ticker loop: Run every 5 minutes
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		runWatchdogCycle()
	}
}

func runWatchdogCycle() {
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
	}
}

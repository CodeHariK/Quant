package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"

	"haunter/api"
	"haunter/fetcher"
	"haunter/store"
)

func main() {
	fmt.Println("🚀 Starting Haunter Backend Server with BoltDB Cache...")
	fmt.Println("---------------------------------------------------------------")

	// Initialize embedded BoltDB store
	st, err := store.InitStore()
	if err != nil {
		log.Fatalf("❌ Failed to initialize BoltDB store: %v", err)
	}
	defer st.Close()

	hub := api.NewSSEHub()
	go hub.Run()

	// 1. Full 5-Year Valuation Report REST endpoint on /api/valuation-report?symbol=RELIANCE.NS&force=false
	http.HandleFunc("/api/valuation-report", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Content-Type", "application/json")

		symbol := r.URL.Query().Get("symbol")
		if symbol == "" {
			symbol = "RELIANCE.NS"
		}

		force := r.URL.Query().Get("force") == "true"

		report, err := fetcher.FetchFullValuationReport(symbol, force)
		if err != nil {
			http.Error(w, fmt.Sprintf(`{"error": "%v"}`, err), http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(report)
	})

	// Background simulation ticker for live UI testing
	go runBackgroundSimulation(hub)

	fmt.Println("📡 HTTP Server listening on http://localhost:8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		fmt.Printf("❌ HTTP Server Error: %v\n", err)
	}
}

func runBackgroundSimulation(hub *api.SSEHub) {
	symbols := []string{"TSLA", "NDX", "NVDA", "MSFT", "AMZN", "GOOGL", "PLTR"}
	_ = symbols
	_ = rand.Intn
}

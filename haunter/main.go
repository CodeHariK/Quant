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

type WatchlistRequest struct {
	Symbol string `json:"symbol"`
}

func main() {
	fmt.Println("🚀 Starting Haunter Backend Server with BoltDB Watchlist & Valuation Cache...")
	fmt.Println("-----------------------------------------------------------------------------")

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
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Content-Type", "application/json")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

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

	// 2. Watchlist Management REST Endpoints on /api/watchlist (GET, POST, DELETE)
	http.HandleFunc("/api/watchlist", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Content-Type", "application/json")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		switch r.Method {
		case http.MethodGet:
			list, err := st.GetWatchlist()
			if err != nil {
				http.Error(w, fmt.Sprintf(`{"error": "%v"}`, err), http.StatusInternalServerError)
				return
			}
			json.NewEncoder(w).Encode(map[string]interface{}{"watchlist": list})

		case http.MethodPost:
			var req WatchlistRequest
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Symbol == "" {
				http.Error(w, `{"error": "invalid payload, expected symbol field"}`, http.StatusBadRequest)
				return
			}
			updated, err := st.AddWatchlistSymbol(req.Symbol)
			if err != nil {
				http.Error(w, fmt.Sprintf(`{"error": "%v"}`, err), http.StatusInternalServerError)
				return
			}
			json.NewEncoder(w).Encode(map[string]interface{}{"watchlist": updated, "message": "Symbol added successfully"})

		case http.MethodDelete:
			symbol := r.URL.Query().Get("symbol")
			if symbol == "" {
				var req WatchlistRequest
				_ = json.NewDecoder(r.Body).Decode(&req)
				symbol = req.Symbol
			}
			if symbol == "" {
				http.Error(w, `{"error": "symbol query parameter or json payload required"}`, http.StatusBadRequest)
				return
			}
			updated, err := st.RemoveWatchlistSymbol(symbol)
			if err != nil {
				http.Error(w, fmt.Sprintf(`{"error": "%v"}`, err), http.StatusInternalServerError)
				return
			}
			json.NewEncoder(w).Encode(map[string]interface{}{"watchlist": updated, "message": "Symbol removed successfully"})

		default:
			http.Error(w, `{"error": "method not allowed"}`, http.StatusMethodNotAllowed)
		}
	})

	// 3. KiteConnect Portfolio & Trade History REST Endpoint
	http.HandleFunc("/api/kite/portfolio", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Content-Type", "application/json")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		report, err := fetcher.FetchKitePortfolio()
		if err != nil {
			http.Error(w, fmt.Sprintf(`{"error": "%v"}`, err), http.StatusUnauthorized)
			return
		}

		json.NewEncoder(w).Encode(report)
	})

	// 4. KiteConnect OAuth Callback & Session Generation Endpoint
	http.HandleFunc("/api/kite/session", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		w.Header().Set("Content-Type", "application/json")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		if r.Method == http.MethodGet {
			session, ok := st.GetKiteSession()
			if !ok {
				http.Error(w, `{"authenticated": false}`, http.StatusOK)
				return
			}
			json.NewEncoder(w).Encode(map[string]interface{}{
				"authenticated": true,
				"apiKey":        session.APIKey,
				"createdAt":     session.CreatedAt,
			})
			return
		}

		type SessionReq struct {
			APIKey       string `json:"apiKey"`
			APISecret    string `json:"apiSecret"`
			RequestToken string `json:"requestToken"`
		}

		var req SessionReq
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.APIKey == "" || req.APISecret == "" || req.RequestToken == "" {
			http.Error(w, `{"error": "apiKey, apiSecret, and requestToken are required"}`, http.StatusBadRequest)
			return
		}

		session, err := fetcher.GenerateKiteSession(req.APIKey, req.APISecret, req.RequestToken)
		if err != nil {
			http.Error(w, fmt.Sprintf(`{"error": "%v"}`, err), http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "session": session})
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

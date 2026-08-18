package main

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"sort"
	"strings"
	"time"

	"haunter/api"
	"haunter/config"
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

	// 1. Full 5-Year Valuation Report REST endpoint on /api/valuation-report?symbol=gld&force=false
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
			symbol = "^NSEMDCP50"
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
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Content-Type", "application/json")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		force := r.URL.Query().Get("force") == "true"

		// If force is false, return cached BoltDB portfolio first for fast UI load
		if !force {
			if cached, found := fetcher.GetCachedKitePortfolio(); found {
				log.Printf("📦 [CACHE_HIT] Loaded Zerodha Portfolio from BoltDB (Fetched at %s)\n", cached.FetchedAt.Format(time.RFC3339))
				json.NewEncoder(w).Encode(cached)
				return
			}
		}

		// Fetch fresh portfolio from Zerodha Kite API
		report, err := fetcher.FetchKitePortfolio()
		if err != nil {
			log.Printf("⚠️ Zerodha API error (%v). Session expired or invalid - auto purging session.\n", err)
			// Automatically purge expired session from BoltDB so UI registers unauthenticated state & prompts re-login
			_ = st.DeleteKiteSession()

			http.Error(w, fmt.Sprintf(`{"error": "%v", "sessionExpired": true}`, err), http.StatusUnauthorized)
			return
		}

		json.NewEncoder(w).Encode(report)
	})

	// 4. KiteConnect OAuth Callback & Session Generation Endpoint
	http.HandleFunc("/api/kite/session", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Content-Type", "application/json")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		if r.Method == http.MethodDelete {
			if err := st.DeleteKiteSession(); err != nil {
				http.Error(w, fmt.Sprintf(`{"error": "%v"}`, err), http.StatusInternalServerError)
				return
			}
			json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "message": "Zerodha session logged out successfully"})
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

	// Tradebook Upload CSV & Retrieval API Endpoint
	http.HandleFunc("/api/tradebook", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		st := store.GetStore()
		if st == nil {
			http.Error(w, `{"error": "Database not initialized"}`, http.StatusInternalServerError)
			return
		}

		// GET: Return tradebook records filtered by year
		if r.Method == "GET" {
			yearStr := r.URL.Query().Get("year")
			yearFilter := 0
			if yearStr != "" {
				fmt.Sscanf(yearStr, "%d", &yearFilter)
			}

			records, availableYears, err := st.GetTradebookRecords(yearFilter)
			if err != nil {
				http.Error(w, fmt.Sprintf(`{"error": "%v"}`, err), http.StatusInternalServerError)
				return
			}

			sort.Slice(availableYears, func(i, j int) bool { return availableYears[i] > availableYears[j] })

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"records":        records,
				"availableYears": availableYears,
				"count":          len(records),
			})
			return
		}

		// POST: Parse uploaded CSV file from Zerodha Console
		if r.Method == "POST" {
			file, _, err := r.FormFile("file")
			if err != nil {
				http.Error(w, `{"error": "Missing CSV file parameter 'file'"}`, http.StatusBadRequest)
				return
			}
			defer file.Close()

			reader := csv.NewReader(file)
			reader.FieldsPerRecord = -1 // Allow variable columns
			lines, err := reader.ReadAll()
			if err != nil || len(lines) < 2 {
				http.Error(w, `{"error": "Invalid or empty CSV file"}`, http.StatusBadRequest)
				return
			}

			// Map header column indices dynamically
			headers := lines[0]
			colMap := make(map[string]int)
			for i, h := range headers {
				cleanH := strings.ToLower(strings.TrimSpace(h))
				colMap[cleanH] = i
			}

			var parsedRecords []store.TradebookRecord

			for _, row := range lines[1:] {
				if len(row) == 0 {
					continue
				}

				getVal := func(keys ...string) string {
					for _, k := range keys {
						if idx, ok := colMap[k]; ok && idx < len(row) {
							return strings.TrimSpace(row[idx])
						}
					}
					return ""
				}

				symbol := getVal("symbol", "trading_symbol", "tradingsymbol")
				if symbol == "" {
					continue
				}

				tradeID := getVal("trade_id", "tradeid", "id")
				orderID := getVal("order_id", "orderid")
				exchange := getVal("exchange")
				segment := getVal("segment")
				txType := strings.ToUpper(getVal("trade_type", "transaction_type", "type"))

				qtyStr := getVal("quantity", "qty")
				priceStr := getVal("price", "average_price", "rate")
				dateStr := getVal("order_execution_time", "trade_date", "date", "timestamp")

				var qty, price float64
				fmt.Sscanf(qtyStr, "%f", &qty)
				fmt.Sscanf(priceStr, "%f", &price)

				var tradeDate time.Time
				// Try multiple common date formats from Zerodha Console Tradebook exports
				dateFormats := []string{
					"2006-01-02T15:04:05", "2006-01-02 15:04:05", "2006-01-02",
					"02/01/2006", "02-01-2006", "2006/01/02", time.RFC3339,
				}
				for _, fmtStr := range dateFormats {
					if t, err := time.Parse(fmtStr, dateStr); err == nil {
						tradeDate = t
						break
					}
				}
				if tradeDate.IsZero() {
					// Fallback to trade_date if order_execution_time missing or unparseable
					altDateStr := getVal("trade_date")
					for _, fmtStr := range dateFormats {
						if t, err := time.Parse(fmtStr, altDateStr); err == nil {
							tradeDate = t
							break
						}
					}
				}
				if tradeDate.IsZero() {
					tradeDate = time.Now()
				}

				parsedRecords = append(parsedRecords, store.TradebookRecord{
					Symbol:          symbol,
					TradeID:         tradeID,
					OrderID:         orderID,
					Exchange:        exchange,
					Segment:         segment,
					TransactionType: txType,
					Quantity:        qty,
					Price:           price,
					TradeDate:       tradeDate,
					Year:            tradeDate.Year(),
				})
			}

			if len(parsedRecords) == 0 {
				http.Error(w, `{"error": "No valid trade records parsed from CSV"}`, http.StatusBadRequest)
				return
			}

			if err := st.SaveTradebookRecords(parsedRecords); err != nil {
				http.Error(w, fmt.Sprintf(`{"error": "%v"}`, err), http.StatusInternalServerError)
				return
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success":       true,
				"importedCount": len(parsedRecords),
			})
			return
		}
	})

	// Background simulation ticker for live UI testing
	go runBackgroundSimulation(hub)

	fmt.Printf("📡 HTTP Server listening on http://localhost%s\n", config.DefaultServerPort)
	if err := http.ListenAndServe(config.DefaultServerPort, nil); err != nil {
		fmt.Printf("❌ HTTP Server Error: %v\n", err)
	}
}

func runBackgroundSimulation(hub *api.SSEHub) {
	symbols := config.DefaultWatchlist
	_ = symbols
	_ = rand.Intn
}

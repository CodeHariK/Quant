package fetcher

import (
	"fmt"
	"log"
	"time"

	kiteconnect "github.com/zerodha/gokiteconnect/v4"
	"haunter/store"
)

type KitePortfolioHolding struct {
	Tradingsymbol   string    `json:"tradingsymbol"`
	Exchange        string    `json:"exchange"`
	InstrumentToken uint32    `json:"instrumentToken"`
	Quantity        int       `json:"quantity"`
	AveragePrice    float64   `json:"averagePrice"`
	LastPrice       float64   `json:"lastPrice"`
	ClosePrice      float64   `json:"closePrice"`
	PNL             float64   `json:"pnl"`
	DayChange       float64   `json:"dayChange"`
	DayChangePerc   float64   `json:"dayChangePercentage"`
	AuthorizedDate  string    `json:"authorizedDate,omitempty"`
}

type KiteTradeRecord struct {
	TradeID        string    `json:"tradeId"`
	OrderID        string    `json:"orderId"`
	Exchange       string    `json:"exchange"`
	Tradingsymbol  string    `json:"tradingsymbol"`
	Transaction    string    `json:"transactionType"` // BUY or SELL
	Quantity       float64   `json:"quantity"`
	AveragePrice   float64   `json:"averagePrice"`
	TradeTimestamp time.Time `json:"tradeTimestamp"`
}

type KitePortfolioReport struct {
	Holdings     []KitePortfolioHolding `json:"holdings"`
	Positions    []KitePortfolioHolding `json:"positions"`
	TradeHistory []KiteTradeRecord     `json:"tradeHistory"`
	FetchedAt    time.Time              `json:"fetchedAt"`
}

// GetKiteClient instantiates zerodha KiteConnect client using stored session token
func GetKiteClient() (*kiteconnect.Client, error) {
	st := store.GetStore()
	if st == nil {
		return nil, fmt.Errorf("store unavailable")
	}

	session, ok := st.GetKiteSession()
	if !ok || session.AccessToken == "" {
		return nil, fmt.Errorf("no active KiteConnect session found. Please authenticate with Zerodha first")
	}

	kc := kiteconnect.New(session.APIKey)
	kc.SetAccessToken(session.AccessToken)
	return kc, nil
}

// FetchKitePortfolio fetches long-term holdings, net positions, and executed trade logs via KiteConnect
func FetchKitePortfolio() (*KitePortfolioReport, error) {
	kc, err := GetKiteClient()
	if err != nil {
		return nil, err
	}

	report := &KitePortfolioReport{
		Holdings:     make([]KitePortfolioHolding, 0),
		Positions:    make([]KitePortfolioHolding, 0),
		TradeHistory: make([]KiteTradeRecord, 0),
		FetchedAt:    time.Now(),
	}

	// 1. Fetch Portfolio Holdings (Delivery Equities)
	holdings, err := kc.GetHoldings()
	if err != nil {
		log.Printf("⚠️ Failed to fetch Kite holdings: %v\n", err)
		return nil, fmt.Errorf("Zerodha session expired or invalid: %w", err)
	}
	for _, h := range holdings {
		report.Holdings = append(report.Holdings, KitePortfolioHolding{
			Tradingsymbol:   h.Tradingsymbol,
			Exchange:        h.Exchange,
			InstrumentToken: h.InstrumentToken,
			Quantity:        h.Quantity,
			AveragePrice:    h.AveragePrice,
			LastPrice:       h.LastPrice,
			ClosePrice:      h.ClosePrice,
			PNL:             h.PnL,
			DayChange:       h.DayChange,
			DayChangePerc:   h.DayChangePercentage,
			AuthorizedDate:  h.AuthorisedDate.Time.Format("2006-01-02"),
		})
	}

	// 2. Fetch Net Positions
	positions, err := kc.GetPositions()
	if err != nil {
		log.Printf("⚠️ Failed to fetch Kite positions: %v\n", err)
	} else {
		for _, p := range positions.Net {
			report.Positions = append(report.Positions, KitePortfolioHolding{
				Tradingsymbol:   p.Tradingsymbol,
				Exchange:        p.Exchange,
				InstrumentToken: p.InstrumentToken,
				Quantity:        p.Quantity,
				AveragePrice:    p.AveragePrice,
				LastPrice:       p.LastPrice,
				ClosePrice:      p.ClosePrice,
				PNL:             p.PnL,
			})
		}
	}

	// 3. Fetch Executed Trades (What was bought/sold and on what date/timestamp)
	trades, err := kc.GetTrades()
	if err != nil {
		log.Printf("⚠️ Failed to fetch Kite trade history: %v\n", err)
	} else {
		for _, t := range trades {
			report.TradeHistory = append(report.TradeHistory, KiteTradeRecord{
				TradeID:        t.TradeID,
				OrderID:        t.OrderID,
				Exchange:       t.Exchange,
				Tradingsymbol:  t.TradingSymbol,
				Transaction:    t.TransactionType,
				Quantity:       t.Quantity,
				AveragePrice:   t.AveragePrice,
			})
		}
	}

	// Persist fresh portfolio report to BoltDB
	if st := store.GetStore(); st != nil {
		_ = st.SaveKitePortfolio(report)
	}

	return report, nil
}

// GetCachedKitePortfolio loads cached Zerodha portfolio report from BoltDB
func GetCachedKitePortfolio() (*KitePortfolioReport, bool) {
	st := store.GetStore()
	if st == nil {
		return nil, false
	}

	var report KitePortfolioReport
	if found := st.GetKitePortfolio(&report); found {
		return &report, true
	}
	return nil, false
}

// GenerateKiteSession exchanges request_token for access_token and saves to BoltDB
func GenerateKiteSession(apiKey string, apiSecret string, requestToken string) (*store.KiteSessionData, error) {
	kc := kiteconnect.New(apiKey)

	session, err := kc.GenerateSession(requestToken, apiSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to generate KiteConnect session: %w", err)
	}

	stData := &store.KiteSessionData{
		APIKey:      apiKey,
		APISecret:   apiSecret,
		AccessToken: session.AccessToken,
		CreatedAt:   time.Now(),
	}

	st := store.GetStore()
	if st != nil {
		if err := st.SaveKiteSession(stData); err != nil {
			return nil, fmt.Errorf("failed to save kite session: %w", err)
		}
	}

	return stData, nil
}

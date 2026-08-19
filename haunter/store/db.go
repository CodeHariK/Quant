package store

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"haunter/config"
	"haunter/types"

	"github.com/boltdb/bolt"
)

type TradebookRecord struct {
	Symbol          string    `json:"symbol"`
	ISIN            string    `json:"isin,omitempty"`
	TradeID         string    `json:"tradeId"`
	OrderID         string    `json:"orderId"`
	Exchange        string    `json:"exchange"`
	Segment         string    `json:"segment"`
	TransactionType string    `json:"transactionType"`
	Quantity        float64   `json:"quantity"`
	Price           float64   `json:"price"`
	TradeDate       time.Time `json:"tradeDate"`
	Year            int       `json:"year"`
}

type Store struct {
	db *bolt.DB
}

type KiteSessionData struct {
	APIKey      string    `json:"apiKey"`
	APISecret   string    `json:"apiSecret"`
	AccessToken string    `json:"accessToken"`
	CreatedAt   time.Time `json:"createdAt"`
}

var globalStore *Store

// InitStore opens embedded BoltDB and creates ValuationReports, Watchlist, KiteSession, and TradebookRecords buckets
func InitStore() (*Store, error) {
	db, err := bolt.Open(config.DBPath, 0600, &bolt.Options{Timeout: 1 * time.Second})
	if err != nil {
		return nil, fmt.Errorf("failed to open bolt DB: %w", err)
	}

	err = db.Update(func(tx *bolt.Tx) error {
		if _, err := tx.CreateBucketIfNotExists([]byte(config.ReportsBucket)); err != nil {
			return err
		}
		if _, err := tx.CreateBucketIfNotExists([]byte(config.WatchlistBucket)); err != nil {
			return err
		}
		if _, err := tx.CreateBucketIfNotExists([]byte(config.KiteBucket)); err != nil {
			return err
		}
		if _, err := tx.CreateBucketIfNotExists([]byte(config.KitePortfolioBucket)); err != nil {
			return err
		}
		if _, err := tx.CreateBucketIfNotExists([]byte(config.TradebookBucket)); err != nil {
			return err
		}
		if _, err := tx.CreateBucketIfNotExists([]byte(config.PortfoliosBucket)); err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create buckets: %w", err)
	}

	globalStore = &Store{db: db}

	// Seed default watchlist if empty
	current, _ := globalStore.GetWatchlist()
	if len(current) == 0 {
		_ = globalStore.SaveWatchlist(config.DefaultWatchlist)
	}

	return globalStore, nil
}

// GetStore returns global store instance
func GetStore() *Store {
	if globalStore == nil {
		store, _ := InitStore()
		return store
	}
	return globalStore
}

// Close closes the BoltDB connection
func (s *Store) Close() error {
	if s.db != nil {
		return s.db.Close()
	}
	return nil
}

// GetValuationReport retrieves cached report for a symbol if it exists (persists indefinitely)
func (s *Store) GetValuationReport(symbol string) (*types.FullValuationReport, bool) {
	var report types.FullValuationReport
	found := false

	err := s.db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(config.ReportsBucket))
		if b == nil {
			return nil
		}

		data := b.Get([]byte(symbol))
		if data == nil {
			return nil
		}

		if err := json.Unmarshal(data, &report); err != nil {
			return err
		}

		found = true
		return nil
	})

	if err != nil || !found {
		return nil, false
	}
	return &report, true
}

// SaveValuationReport saves a FullValuationReport to BoltDB
func (s *Store) SaveValuationReport(report *types.FullValuationReport) error {
	return s.db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(config.ReportsBucket))
		if b == nil {
			return fmt.Errorf("bucket not found")
		}

		data, err := json.Marshal(report)
		if err != nil {
			return err
		}

		return b.Put([]byte(report.Symbol), data)
	})
}

// GetWatchlist retrieves stored watchlist symbols from BoltDB
func (s *Store) GetWatchlist() ([]string, error) {
	var list []string
	err := s.db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(config.WatchlistBucket))
		if b == nil {
			return nil
		}
		data := b.Get([]byte(config.WatchlistKey))
		if data == nil {
			return nil
		}
		return json.Unmarshal(data, &list)
	})
	return list, err
}

// SaveWatchlist saves current list of symbols to BoltDB
func (s *Store) SaveWatchlist(symbols []string) error {
	return s.db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(config.WatchlistBucket))
		if b == nil {
			return fmt.Errorf("watchlist bucket not found")
		}
		data, err := json.Marshal(symbols)
		if err != nil {
			return err
		}
		return b.Put([]byte(config.WatchlistKey), data)
	})
}

// AddWatchlistSymbol adds a symbol to BoltDB watchlist
func (s *Store) AddWatchlistSymbol(symbol string) ([]string, error) {
	sym := strings.TrimSpace(strings.ToUpper(symbol))
	if sym == "" {
		return s.GetWatchlist()
	}

	list, err := s.GetWatchlist()
	if err != nil {
		list = []string{}
	}

	for _, existing := range list {
		if strings.EqualFold(existing, sym) {
			return list, nil // Already exists
		}
	}

	list = append(list, sym)
	if err := s.SaveWatchlist(list); err != nil {
		return nil, err
	}
	return list, nil
}

// RemoveWatchlistSymbol removes a symbol from BoltDB watchlist
func (s *Store) RemoveWatchlistSymbol(symbol string) ([]string, error) {
	sym := strings.TrimSpace(strings.ToUpper(symbol))
	list, err := s.GetWatchlist()
	if err != nil {
		return list, err
	}

	updated := make([]string, 0, len(list))
	for _, existing := range list {
		if !strings.EqualFold(existing, sym) {
			updated = append(updated, existing)
		}
	}

	if err := s.SaveWatchlist(updated); err != nil {
		return nil, err
	}
	return updated, nil
}

// SaveKiteSession stores Kite API key, secret, and access token to BoltDB
func (s *Store) SaveKiteSession(session *KiteSessionData) error {
	return s.db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(config.KiteBucket))
		if b == nil {
			return fmt.Errorf("kite bucket not found")
		}
		data, err := json.Marshal(session)
		if err != nil {
			return err
		}
		return b.Put([]byte(config.KiteSessionKey), data)
	})
}

// GetKiteSession retrieves stored Kite credentials from BoltDB
func (s *Store) GetKiteSession() (*KiteSessionData, bool) {
	var session KiteSessionData
	found := false
	err := s.db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(config.KiteBucket))
		if b == nil {
			return nil
		}
		data := b.Get([]byte(config.KiteSessionKey))
		if data == nil {
			return nil
		}
		if err := json.Unmarshal(data, &session); err != nil {
			return err
		}
		found = true
		return nil
	})
	if err != nil || !found {
		return nil, false
	}
	return &session, true
}

// DeleteKiteSession removes stored Zerodha session & cached portfolio from BoltDB
func (s *Store) DeleteKiteSession() error {
	return s.db.Update(func(tx *bolt.Tx) error {
		if b := tx.Bucket([]byte(config.KiteBucket)); b != nil {
			_ = b.Delete([]byte(config.KiteSessionKey))
		}
		if b := tx.Bucket([]byte(config.KitePortfolioBucket)); b != nil {
			_ = b.Delete([]byte(config.KitePortfolioKey))
		}
		return nil
	})
}

// SaveKitePortfolio persists the fetched Zerodha portfolio JSON payload to BoltDB
func (s *Store) SaveKitePortfolio(report interface{}) error {
	return s.db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(config.KitePortfolioBucket))
		if b == nil {
			return fmt.Errorf("kite portfolio bucket not found")
		}
		data, err := json.Marshal(report)
		if err != nil {
			return err
		}
		return b.Put([]byte(config.KitePortfolioKey), data)
	})
}

// GetKitePortfolio retrieves stored Zerodha portfolio report from BoltDB
func (s *Store) GetKitePortfolio(target interface{}) bool {
	found := false
	_ = s.db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(config.KitePortfolioBucket))
		if b == nil {
			return nil
		}
		data := b.Get([]byte(config.KitePortfolioKey))
		if data == nil {
			return nil
		}
		if err := json.Unmarshal(data, target); err == nil {
			found = true
		}
		return nil
	})
	return found
}

// SaveTradebookRecords persists parsed Zerodha Tradebook records to BoltDB
func (s *Store) SaveTradebookRecords(records []TradebookRecord) error {
	return s.db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(config.TradebookBucket))
		if b == nil {
			return fmt.Errorf("tradebook bucket not found")
		}

		for _, r := range records {
			key := fmt.Sprintf("%d_%s_%s_%s", r.Year, r.Symbol, r.TradeID, r.TradeDate.Format("20060102150405"))
			data, err := json.Marshal(r)
			if err != nil {
				continue
			}
			if err := b.Put([]byte(key), data); err != nil {
				return err
			}
		}
		return nil
	})
}

// GetTradebookRecords fetches all stored Tradebook records, optionally filtered by year
func (s *Store) GetTradebookRecords(yearFilter int) ([]TradebookRecord, []int, error) {
	var records []TradebookRecord
	yearsMap := make(map[int]bool)

	err := s.db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(config.TradebookBucket))
		if b == nil {
			return nil
		}

		return b.ForEach(func(k, v []byte) error {
			var rec TradebookRecord
			if err := json.Unmarshal(v, &rec); err != nil {
				return nil
			}

			if rec.Year > 0 {
				yearsMap[rec.Year] = true
			}

			if yearFilter <= 0 || rec.Year == yearFilter {
				records = append(records, rec)
			}
			return nil
		})
	})

	years := make([]int, 0, len(yearsMap))
	for y := range yearsMap {
		years = append(years, y)
	}

	return records, years, err
}

// --- PORTFOLIOS ---

type PortfolioStock struct {
	Symbol          string  `json:"symbol"`
	InitialQuantity float64 `json:"initialQuantity"`
	SIPAmount       float64 `json:"sipAmount"` // e.g. 1000 rupees per month
}

type Portfolio struct {
	ID        string           `json:"id"`
	Name      string           `json:"name"`
	Stocks    []PortfolioStock `json:"stocks"`
	CreatedAt time.Time        `json:"createdAt"`
}

// GetPortfolios retrieves all custom portfolios from BoltDB
func (s *Store) GetPortfolios() ([]Portfolio, error) {
	var portfolios []Portfolio
	err := s.db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(config.PortfoliosBucket))
		if b == nil {
			return nil
		}

		return b.ForEach(func(k, v []byte) error {
			var p Portfolio
			if err := json.Unmarshal(v, &p); err == nil {
				portfolios = append(portfolios, p)
			}
			return nil
		})
	})
	return portfolios, err
}

// SavePortfolio saves a portfolio to BoltDB (creates or updates)
func (s *Store) SavePortfolio(p *Portfolio) error {
	return s.db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(config.PortfoliosBucket))
		if b == nil {
			return fmt.Errorf("portfolios bucket not found")
		}

		data, err := json.Marshal(p)
		if err != nil {
			return err
		}

		return b.Put([]byte(p.ID), data)
	})
}

// DeletePortfolio removes a portfolio from BoltDB by ID
func (s *Store) DeletePortfolio(id string) error {
	return s.db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(config.PortfoliosBucket))
		if b == nil {
			return fmt.Errorf("portfolios bucket not found")
		}
		return b.Delete([]byte(id))
	})
}


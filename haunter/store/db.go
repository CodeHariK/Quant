package store

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/boltdb/bolt"
	"haunter/types"
)

const (
	dbPath          = "haunter_cache.db"
	reportsBucket   = "ValuationReports"
	watchlistBucket = "Watchlist"
	watchlistKey    = "user_watchlist"
	kiteBucket      = "KiteSession"
	kiteSessionKey  = "user_kite_session"
)

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

// InitStore opens embedded BoltDB and creates ValuationReports, Watchlist, and KiteSession buckets
func InitStore() (*Store, error) {
	db, err := bolt.Open(dbPath, 0600, &bolt.Options{Timeout: 1 * time.Second})
	if err != nil {
		return nil, fmt.Errorf("failed to open bolt DB: %w", err)
	}

	err = db.Update(func(tx *bolt.Tx) error {
		if _, err := tx.CreateBucketIfNotExists([]byte(reportsBucket)); err != nil {
			return err
		}
		if _, err := tx.CreateBucketIfNotExists([]byte(watchlistBucket)); err != nil {
			return err
		}
		if _, err := tx.CreateBucketIfNotExists([]byte(kiteBucket)); err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create buckets: %w", err)
	}

	globalStore = &Store{db: db}

	// Seed default watchlist if empty
	defaultWatchlist := []string{"RELIANCE.NS", "TATAMOTORS.NS", "INFY.NS", "TCS.NS", "AAPL", "MSFT", "NVDA"}
	current, _ := globalStore.GetWatchlist()
	if len(current) == 0 {
		_ = globalStore.SaveWatchlist(defaultWatchlist)
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
		b := tx.Bucket([]byte(reportsBucket))
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
		b := tx.Bucket([]byte(reportsBucket))
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
		b := tx.Bucket([]byte(watchlistBucket))
		if b == nil {
			return nil
		}
		data := b.Get([]byte(watchlistKey))
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
		b := tx.Bucket([]byte(watchlistBucket))
		if b == nil {
			return fmt.Errorf("watchlist bucket not found")
		}
		data, err := json.Marshal(symbols)
		if err != nil {
			return err
		}
		return b.Put([]byte(watchlistKey), data)
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
		b := tx.Bucket([]byte(kiteBucket))
		if b == nil {
			return fmt.Errorf("kite bucket not found")
		}
		data, err := json.Marshal(session)
		if err != nil {
			return err
		}
		return b.Put([]byte(kiteSessionKey), data)
	})
}

// GetKiteSession retrieves stored Kite credentials from BoltDB
func (s *Store) GetKiteSession() (*KiteSessionData, bool) {
	var session KiteSessionData
	found := false
	err := s.db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(kiteBucket))
		if b == nil {
			return nil
		}
		data := b.Get([]byte(kiteSessionKey))
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

// DeleteKiteSession removes stored Zerodha session & access token from BoltDB
func (s *Store) DeleteKiteSession() error {
	return s.db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(kiteBucket))
		if b == nil {
			return nil
		}
		return b.Delete([]byte(kiteSessionKey))
	})
}

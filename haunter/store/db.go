package store

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/boltdb/bolt"
	"haunter/types"
)

const (
	dbPath       = "haunter_cache.db"
	reportsBucket = "ValuationReports"
)

type Store struct {
	db *bolt.DB
}

var globalStore *Store

// InitStore opens embedded BoltDB and creates ValuationReports bucket
func InitStore() (*Store, error) {
	db, err := bolt.Open(dbPath, 0600, &bolt.Options{Timeout: 1 * time.Second})
	if err != nil {
		return nil, fmt.Errorf("failed to open bolt DB: %w", err)
	}

	err = db.Update(func(tx *bolt.Tx) error {
		_, err := tx.CreateBucketIfNotExists([]byte(reportsBucket))
		return err
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create bucket: %w", err)
	}

	globalStore = &Store{db: db}
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

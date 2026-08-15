package logger

import (
	"fmt"
	"log"
	"sync"
	"time"
)

// RateLimiter tracks and curbs requests per hour
type RateLimiter struct {
	maxReqsPerHour int
	requests       []time.Time
	mu             sync.Mutex
}

var (
	defaultLimiter *RateLimiter
	once           sync.Once
)

// InitLimiter sets up global rate limiter with max requests per hour (default 60/hr)
func InitLimiter(maxPerHour int) *RateLimiter {
	if maxPerHour <= 0 {
		maxPerHour = 60
	}
	return &RateLimiter{
		maxReqsPerHour: maxPerHour,
		requests:       make([]time.Time, 0),
	}
}

// GetLimiter returns the singleton rate limiter
func GetLimiter() *RateLimiter {
	once.Do(func() {
		defaultLimiter = InitLimiter(60) // Default 60 req/hr
	})
	return defaultLimiter
}

// Allow checks if a request to Yahoo API is allowed under rate limits, cleans old logs, and logs invocation
func (r *RateLimiter) Allow(target string) (bool, int, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	now := time.Now()
	oneHourAgo := now.Add(-1 * time.Hour)

	// Clean requests older than 1 hour sliding window
	valid := make([]time.Time, 0, len(r.requests))
	for _, t := range r.requests {
		if t.After(oneHourAgo) {
			valid = append(valid, t)
		}
	}
	r.requests = valid

	currentCount := len(r.requests)
	if currentCount >= r.maxReqsPerHour {
		log.Printf("⚠️ [YAHOO_API_LIMIT] BLOCKED request to [%s]. Current rate: %d/%d req/hr (Exceeds Limit)\n",
			target, currentCount, r.maxReqsPerHour)
		return false, currentCount, fmt.Errorf("rate limit exceeded: %d/%d requests in the last hour", currentCount, r.maxReqsPerHour)
	}

	// Record request
	r.requests = append(r.requests, now)
	newCount := len(r.requests)

	log.Printf("📊 [YAHOO_API_LOG] [%s] Target: %s | Usage: %d/%d req/hr\n",
		now.Format("15:04:05"), target, newCount, r.maxReqsPerHour)

	return true, newCount, nil
}

// LogYahooRequest helper function for easy logging & rate limiting in fetcher calls
func LogYahooRequest(target string) error {
	allowed, _, err := GetLimiter().Allow(target)
	if !allowed {
		return err
	}
	return nil
}

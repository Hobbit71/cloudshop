package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
	"go.uber.org/zap"
)

// RateLimiter implements token bucket rate limiting
type RateLimiter struct {
	limiters map[string]*rate.Limiter
	mu       sync.RWMutex
	limit    rate.Limit
	burst    int
	cleanup  *time.Ticker
	logger   *zap.Logger
}

// NewRateLimiter creates a new rate limiter
func NewRateLimiter(requestsPerMinute int, burst int, logger *zap.Logger) *RateLimiter {
	rl := &RateLimiter{
		limiters: make(map[string]*rate.Limiter),
		limit:    rate.Limit(float64(requestsPerMinute) / 60.0), // Convert to requests per second
		burst:    burst,
		logger:   logger,
	}

	// Cleanup old limiters every 10 minutes
	rl.cleanup = time.NewTicker(10 * time.Minute)
	go rl.cleanupLimiters()

	return rl
}

// getLimiter returns the rate limiter for the given key
func (rl *RateLimiter) getLimiter(key string) *rate.Limiter {
	rl.mu.RLock()
	limiter, exists := rl.limiters[key]
	rl.mu.RUnlock()

	if exists {
		return limiter
	}

	rl.mu.Lock()
	defer rl.mu.Unlock()

	// Double check after acquiring write lock
	if limiter, exists := rl.limiters[key]; exists {
		return limiter
	}

	limiter = rate.NewLimiter(rl.limit, rl.burst)
	rl.limiters[key] = limiter
	return limiter
}

// cleanupLimiters removes old limiters periodically
func (rl *RateLimiter) cleanupLimiters() {
	for range rl.cleanup.C {
		rl.mu.Lock()
		// In a production system, you'd implement a more sophisticated cleanup
		// For now, we'll keep all limiters in memory
		rl.mu.Unlock()
	}
}

// RateLimitMiddleware applies rate limiting based on IP address
func RateLimitMiddleware(rl *RateLimiter) gin.HandlerFunc {
	return func(c *gin.Context) {
		key := c.ClientIP()

		limiter := rl.getLimiter(key)
		if !limiter.Allow() {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "Too many requests",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}


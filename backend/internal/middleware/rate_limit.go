package middleware

import (
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/config"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/utils"
)

type rateBucket struct {
	count     int
	resetTime time.Time
}

func RateLimit(cfg config.Config) gin.HandlerFunc {
	limit, err := strconv.Atoi(cfg.RateLimitRPM)
	if err != nil || limit <= 0 {
		limit = 120
	}

	buckets := map[string]rateBucket{}
	var mu sync.Mutex

	return func(c *gin.Context) {
		key := c.ClientIP()
		now := time.Now()

		mu.Lock()
		bucket := buckets[key]
		if bucket.resetTime.IsZero() || now.After(bucket.resetTime) {
			bucket = rateBucket{resetTime: now.Add(time.Minute)}
		}
		bucket.count++
		buckets[key] = bucket
		remaining := limit - bucket.count
		mu.Unlock()

		c.Writer.Header().Set("X-RateLimit-Limit", strconv.Itoa(limit))
		if remaining >= 0 {
			c.Writer.Header().Set("X-RateLimit-Remaining", strconv.Itoa(remaining))
		}

		if bucket.count > limit {
			utils.JSONError(c, http.StatusTooManyRequests, "rate limit exceeded")
			c.Abort()
			return
		}

		c.Next()
	}
}

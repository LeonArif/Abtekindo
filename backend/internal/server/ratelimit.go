package server

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/httprate"
)

// Burst limits for the one public endpoint that writes to the database.
//
// This is the in-process half of abuse control and resets when the process
// restarts. The lead service applies a second, database-backed limit over a
// longer window that survives restarts. Five submissions a minute is far above
// anything a real customer filling in a form would produce.
const (
	leadBurstLimit  = 5
	leadBurstWindow = time.Minute
)

// leadPath is the only route this limiter guards.
const leadPath = "/v1/leads"

// RateLimitLeads throttles submissions to the public contact endpoint.
//
// It is scoped to a single method and path rather than applied globally, so
// browsing the catalog is never throttled: a visitor comparing a dozen products
// in a minute is exactly the behaviour this site wants to encourage.
func RateLimitLeads() func(http.Handler) http.Handler {
	limiter := httprate.NewRateLimiter(leadBurstLimit, leadBurstWindow)

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Method != http.MethodPost || r.URL.Path != leadPath {
				next.ServeHTTP(w, r)
				return
			}

			key, err := httprate.KeyByIP(r)
			if err != nil {
				// No usable address to key on. The database-backed limit still
				// applies, so this is not an unguarded path.
				next.ServeHTTP(w, r)
				return
			}

			if limiter.OnLimit(w, r, key) {
				// Matches the RFC 7807 shape huma uses for every other error,
				// so the frontend has one response format to handle.
				w.Header().Set("Content-Type", "application/problem+json")
				w.WriteHeader(http.StatusTooManyRequests)
				_ = json.NewEncoder(w).Encode(map[string]any{
					"title":  "Too Many Requests",
					"status": http.StatusTooManyRequests,
					"detail": "terlalu banyak pengiriman, silakan coba lagi sebentar lagi atau hubungi kami melalui WhatsApp",
				})
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

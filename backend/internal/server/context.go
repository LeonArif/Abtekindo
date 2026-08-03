package server

import (
	"context"
	"net/http"
	"time"
)

// contextWithTimeout derives a bounded context from the request so a slow
// dependency cannot hold a probe open indefinitely.
func contextWithTimeout(r *http.Request, d time.Duration) (context.Context, context.CancelFunc) {
	return context.WithTimeout(r.Context(), d)
}

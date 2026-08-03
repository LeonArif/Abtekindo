package server

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5/middleware"
)

// RequestLogger logs one structured line per completed request.
//
// It deliberately logs after the handler returns so status and duration are
// known, and it keeps 5xx at error level so alerting can key off severity
// rather than parsing the status field.
func RequestLogger(logger *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Health checks run every few seconds on managed platforms and would
			// otherwise drown out real traffic in the logs.
			if r.URL.Path == "/healthz" || r.URL.Path == "/readyz" {
				next.ServeHTTP(w, r)
				return
			}

			ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)
			start := time.Now()

			defer func() {
				attrs := []any{
					slog.String("method", r.Method),
					slog.String("path", r.URL.Path),
					slog.Int("status", ww.Status()),
					slog.Int("bytes", ww.BytesWritten()),
					slog.Duration("duration", time.Since(start)),
					slog.String("request_id", middleware.GetReqID(r.Context())),
					slog.String("ip", r.RemoteAddr),
				}

				switch {
				case ww.Status() >= http.StatusInternalServerError:
					logger.LogAttrs(r.Context(), slog.LevelError, "request failed", toAttrs(attrs)...)
				case ww.Status() >= http.StatusBadRequest:
					logger.LogAttrs(r.Context(), slog.LevelWarn, "request rejected", toAttrs(attrs)...)
				default:
					logger.LogAttrs(r.Context(), slog.LevelInfo, "request", toAttrs(attrs)...)
				}
			}()

			next.ServeHTTP(ww, r)
		})
	}
}

func toAttrs(values []any) []slog.Attr {
	attrs := make([]slog.Attr, 0, len(values))
	for _, v := range values {
		if a, ok := v.(slog.Attr); ok {
			attrs = append(attrs, a)
		}
	}
	return attrs
}

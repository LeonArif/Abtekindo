// Package server wires the HTTP router, middleware chain and OpenAPI surface.
package server

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"time"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humachi"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/LeonArif/Abtekindo/backend/internal/config"
)

// Version is the API version reported in the OpenAPI document.
const Version = "1.0.0"

// Server holds the HTTP surface and its dependencies.
type Server struct {
	cfg    config.Config
	logger *slog.Logger
	pool   *pgxpool.Pool
	router chi.Router
	api    huma.API
}

// New builds a server with the full middleware chain and an empty API surface.
// Route registration is left to the caller so that the wiring of handlers stays
// visible in main rather than hidden inside this constructor.
func New(cfg config.Config, logger *slog.Logger, pool *pgxpool.Pool) *Server {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	// RealIP reads X-Forwarded-For, which is trustworthy here because the API
	// only ever receives traffic through the platform's proxy. Rate limiting and
	// lead attribution both depend on it being correct.
	r.Use(middleware.RealIP)
	r.Use(RequestLogger(logger))
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(30 * time.Second))
	r.Use(middleware.Compress(5))

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: cfg.CORSOrigins,
		AllowedMethods: []string{http.MethodGet, http.MethodPost, http.MethodPatch, http.MethodPut, http.MethodDelete, http.MethodOptions},
		AllowedHeaders: []string{"Accept", "Content-Type", "Authorization", "X-CSRF-Token"},
		// Credentials are required: admin sessions travel as httpOnly cookies
		// from the frontend origin to this API's subdomain.
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Use(RateLimitLeads())

	s := &Server{cfg: cfg, logger: logger, pool: pool, router: r}
	s.registerOperational()

	s.api = humachi.New(r, HumaConfig())

	return s
}

// HumaConfig builds the OpenAPI configuration.
//
// It is exported and dependency-free so `cmd/openapi` can produce the exact
// same document without a database, which is what lets the frontend generate
// its types in CI without standing up the whole stack.
func HumaConfig() huma.Config {
	cfg := huma.DefaultConfig("Abtekindo API", Version)
	cfg.Info.Description = "API publik dan admin untuk situs PT Abtekindo Primalestari."
	cfg.Servers = []*huma.Server{{URL: "/"}}
	// Drop huma's JSON-Schema link transformer. It injects a "$schema" property
	// into every response body, which would surface as a stray field in the
	// TypeScript types the frontend generates from this document.
	cfg.CreateHooks = nil
	cfg.SchemasPath = ""
	// The frontend generates its TypeScript types from this document, so the
	// security scheme has to be described accurately rather than omitted.
	cfg.Components.SecuritySchemes = map[string]*huma.SecurityScheme{
		"cookieAuth": {
			Type: "apiKey",
			In:   "cookie",
			Name: AccessTokenCookie,
		},
	}
	return cfg
}

// AccessTokenCookie is the cookie the admin session's access token travels in.
const AccessTokenCookie = "abtekindo_access"

// API exposes the huma API so route packages can register their operations.
func (s *Server) API() huma.API { return s.api }

// Handler returns the root HTTP handler.
func (s *Server) Handler() http.Handler { return s.router }

// registerOperational mounts liveness and readiness probes directly on chi
// rather than through huma. They are platform plumbing, not part of the API
// contract the frontend generates types from, so they stay out of the spec.
func (s *Server) registerOperational() {
	s.router.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	s.router.Get("/readyz", func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := contextWithTimeout(r, 3*time.Second)
		defer cancel()

		if err := s.pool.Ping(ctx); err != nil {
			s.logger.ErrorContext(ctx, "readiness check failed", slog.Any("error", err))
			writeJSON(w, http.StatusServiceUnavailable, map[string]string{
				"status": "unavailable",
				"reason": "database unreachable",
			})
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"status": "ready"})
	})
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

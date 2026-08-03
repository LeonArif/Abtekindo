// Command api runs the Abtekindo HTTP API.
package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"

	"github.com/LeonArif/Abtekindo/backend/internal/api"
	"github.com/LeonArif/Abtekindo/backend/internal/auth"
	"github.com/LeonArif/Abtekindo/backend/internal/catalog"
	"github.com/LeonArif/Abtekindo/backend/internal/config"
	"github.com/LeonArif/Abtekindo/backend/internal/leads"
	"github.com/LeonArif/Abtekindo/backend/internal/mailer"
	"github.com/LeonArif/Abtekindo/backend/internal/revalidate"
	"github.com/LeonArif/Abtekindo/backend/internal/server"
	"github.com/LeonArif/Abtekindo/backend/internal/storage"
	"github.com/LeonArif/Abtekindo/backend/internal/store"
)

func main() {
	if err := run(); err != nil {
		slog.Error("fatal", slog.Any("error", err))
		os.Exit(1)
	}
}

func run() error {
	// A missing .env is normal: in production configuration comes from the
	// platform's environment, not a file.
	_ = godotenv.Load()

	cfg, err := config.Load()
	if err != nil {
		return err
	}

	logger := newLogger(cfg)
	slog.SetDefault(logger)

	// Signal handling is installed before any dependency is opened so that a
	// Ctrl+C during slow startup still exits cleanly.
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	pool, err := store.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		return err
	}
	defer pool.Close()

	logger.Info("database connected")

	warnAboutDisabledServices(cfg, logger)

	srv := server.New(cfg, logger, pool)

	// Dependency wiring is kept here rather than inside server.New so the shape
	// of the application stays visible in one place.
	queries := store.New(pool)
	tokens := auth.NewTokenIssuer(cfg.JWT.Secret, cfg.JWT.AccessTTL)

	uploader, err := storage.New(ctx, cfg.Storage)
	if err != nil {
		return err
	}

	api.NewHandler(api.Deps{
		Catalog:     catalog.New(pool, cfg.Storage.PublicBaseURL),
		Auth:        auth.NewService(queries, tokens, cfg.JWT.RefreshTTL, logger),
		Cookies:     api.NewCookieSettings(cfg.JWT.CookieDomain, cfg.IsProduction()),
		Revalidator: revalidate.New(cfg.FrontendURL, cfg.RevalidateSecret, logger),
		Uploads:     uploader,
		Leads: leads.NewService(
			queries,
			mailer.New(cfg.Mailer, cfg.FrontendURL, logger),
			logger,
		),
		Turnstile: leads.NewTurnstile(cfg.TurnstileSecretKey, logger),
		Logger:    logger,
	}).Register(srv.API())

	httpServer := &http.Server{
		Addr:              cfg.Addr(),
		Handler:           srv.Handler(),
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      60 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	serveErr := make(chan error, 1)
	go func() {
		logger.Info("api listening",
			slog.String("addr", httpServer.Addr),
			slog.String("env", string(cfg.Env)),
			slog.String("docs", "http://localhost"+httpServer.Addr+"/docs"),
		)
		if err := httpServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			serveErr <- err
			return
		}
		serveErr <- nil
	}()

	select {
	case err := <-serveErr:
		return err
	case <-ctx.Done():
		logger.Info("shutdown signal received, draining connections")
	}

	// Give in-flight requests a bounded window to finish. Anything still running
	// after this is abandoned so the process cannot hang a deploy.
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		return err
	}
	logger.Info("shutdown complete")
	return nil
}

func newLogger(cfg config.Config) *slog.Logger {
	if cfg.IsProduction() {
		// JSON in production so the hosting platform can index the fields.
		return slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	}
	return slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelDebug}))
}

// warnAboutDisabledServices makes degraded behaviour loud at startup. These
// services are optional in development, and silence here would let a
// half-configured deployment look healthy while dropping lead notifications.
func warnAboutDisabledServices(cfg config.Config, logger *slog.Logger) {
	if !cfg.Storage.Configured() {
		logger.Warn("object storage not configured, admin image uploads are disabled")
	}
	if !cfg.Mailer.Configured() {
		logger.Warn("mailer not configured, lead notification emails will not be sent")
	}
	if cfg.TurnstileSecretKey == "" {
		logger.Warn("Turnstile not configured, lead form spam protection is disabled")
	}
}

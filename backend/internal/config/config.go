// Package config loads and validates runtime configuration from the environment.
//
// Configuration is read exactly once at startup. Anything required but missing
// is reported as an error rather than defaulted, so a misconfigured deployment
// fails immediately instead of misbehaving under traffic.
package config

import (
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

// Env identifies which environment the process is running in.
type Env string

const (
	EnvDevelopment Env = "development"
	EnvProduction  Env = "production"
)

// Config is the fully resolved configuration for the API process.
type Config struct {
	Env  Env
	Port int

	DatabaseURL string
	CORSOrigins []string

	JWT     JWTConfig
	Storage StorageConfig
	Mailer  MailerConfig

	TurnstileSecretKey string

	FrontendURL      string
	RevalidateSecret string
}

// JWTConfig holds session and token settings.
type JWTConfig struct {
	Secret       []byte
	CookieDomain string
	// AccessTTL is deliberately short: the refresh token in the database is
	// what makes a session long-lived, and what makes it revocable.
	AccessTTL  time.Duration
	RefreshTTL time.Duration
}

// StorageConfig holds Cloudflare R2 credentials for presigned image uploads.
type StorageConfig struct {
	AccountID       string
	AccessKeyID     string
	SecretAccessKey string
	Bucket          string
	PublicBaseURL   string
}

// Configured reports whether object storage is usable. Uploads are an admin-only
// feature, so the API is allowed to start without it in development.
func (s StorageConfig) Configured() bool {
	return s.AccountID != "" && s.AccessKeyID != "" && s.SecretAccessKey != "" && s.Bucket != ""
}

// MailerConfig holds Resend settings for lead notification emails.
type MailerConfig struct {
	APIKey string
	From   string
	To     string
}

// Configured reports whether lead notification email can be sent. Leads are
// always persisted regardless, so email is an enhancement rather than a
// requirement.
func (m MailerConfig) Configured() bool {
	return m.APIKey != "" && m.From != "" && m.To != ""
}

// IsProduction reports whether the process runs with production defaults, which
// tighten cookie flags and require every secret to be set.
func (c Config) IsProduction() bool { return c.Env == EnvProduction }

// Load reads configuration from the environment and validates it.
//
// All validation problems are collected and returned together, so a fresh
// deployment surfaces every missing variable at once rather than one per
// restart.
func Load() (Config, error) {
	cfg := Config{
		Env:         Env(getenv("APP_ENV", string(EnvDevelopment))),
		DatabaseURL: os.Getenv("DATABASE_URL"),
		CORSOrigins: splitAndTrim(getenv("CORS_ORIGINS", "http://localhost:3000")),
		JWT: JWTConfig{
			Secret:       []byte(os.Getenv("JWT_SECRET")),
			CookieDomain: os.Getenv("COOKIE_DOMAIN"),
			AccessTTL:    15 * time.Minute,
			RefreshTTL:   30 * 24 * time.Hour,
		},
		Storage: StorageConfig{
			AccountID:       os.Getenv("R2_ACCOUNT_ID"),
			AccessKeyID:     os.Getenv("R2_ACCESS_KEY_ID"),
			SecretAccessKey: os.Getenv("R2_SECRET_ACCESS_KEY"),
			Bucket:          os.Getenv("R2_BUCKET"),
			PublicBaseURL:   strings.TrimRight(os.Getenv("R2_PUBLIC_BASE_URL"), "/"),
		},
		Mailer: MailerConfig{
			APIKey: os.Getenv("RESEND_API_KEY"),
			From:   os.Getenv("LEAD_NOTIFY_FROM"),
			To:     os.Getenv("LEAD_NOTIFY_TO"),
		},
		TurnstileSecretKey: os.Getenv("TURNSTILE_SECRET_KEY"),
		FrontendURL:        strings.TrimRight(getenv("FRONTEND_URL", "http://localhost:3000"), "/"),
		RevalidateSecret:   os.Getenv("REVALIDATE_SECRET"),
	}

	var problems []error

	port, err := strconv.Atoi(getenv("PORT", "8080"))
	switch {
	case err != nil:
		problems = append(problems, fmt.Errorf("PORT must be a number, got %q", os.Getenv("PORT")))
	case port < 1 || port > 65535:
		problems = append(problems, fmt.Errorf("PORT must be between 1 and 65535, got %d", port))
	default:
		cfg.Port = port
	}

	if cfg.Env != EnvDevelopment && cfg.Env != EnvProduction {
		problems = append(problems, fmt.Errorf(
			"APP_ENV must be %q or %q, got %q", EnvDevelopment, EnvProduction, cfg.Env))
	}

	if cfg.DatabaseURL == "" {
		problems = append(problems, errors.New("DATABASE_URL is required"))
	}

	// 32 bytes is the floor for an HMAC-SHA256 signing key. A short secret here
	// would silently weaken every session token the API issues.
	if len(cfg.JWT.Secret) < 32 {
		problems = append(problems, fmt.Errorf(
			"JWT_SECRET must be at least 32 characters, got %d", len(cfg.JWT.Secret)))
	}

	if len(cfg.CORSOrigins) == 0 {
		problems = append(problems, errors.New("CORS_ORIGINS must list at least one origin"))
	}

	if cfg.RevalidateSecret == "" {
		problems = append(problems, errors.New("REVALIDATE_SECRET is required"))
	}

	// Optional-in-development services become mandatory in production, where a
	// silently disabled mailer would mean quietly losing customer leads.
	if cfg.IsProduction() {
		if !cfg.Storage.Configured() {
			problems = append(problems, errors.New(
				"R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET are required in production"))
		}
		if cfg.Storage.PublicBaseURL == "" {
			problems = append(problems, errors.New("R2_PUBLIC_BASE_URL is required in production"))
		}
		if !cfg.Mailer.Configured() {
			problems = append(problems, errors.New(
				"RESEND_API_KEY, LEAD_NOTIFY_FROM and LEAD_NOTIFY_TO are required in production"))
		}
		if cfg.TurnstileSecretKey == "" {
			problems = append(problems, errors.New("TURNSTILE_SECRET_KEY is required in production"))
		}
		if cfg.CookieDomainMissing() {
			problems = append(problems, errors.New("COOKIE_DOMAIN is required in production"))
		}
	}

	if len(problems) > 0 {
		return Config{}, fmt.Errorf("invalid configuration: %w", errors.Join(problems...))
	}
	return cfg, nil
}

// CookieDomainMissing reports whether the shared cookie domain is unset. In
// production the frontend and API live on different subdomains, so the session
// cookie must be scoped to the parent domain to be sent at all.
func (c Config) CookieDomainMissing() bool { return c.JWT.CookieDomain == "" }

// Addr returns the listen address for the HTTP server.
func (c Config) Addr() string { return fmt.Sprintf(":%d", c.Port) }

func getenv(key, fallback string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return fallback
}

func splitAndTrim(s string) []string {
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, p)
		}
	}
	return out
}

package leads

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/netip"
	"net/url"
	"strings"
	"time"
)

// turnstileVerifyURL is Cloudflare's siteverify endpoint.
const turnstileVerifyURL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

// Turnstile verifies Cloudflare Turnstile tokens.
//
// A public form with no challenge will be found and abused by bots, which fills
// the inbox with noise until the owner stops reading it. Turnstile is invisible
// to genuine visitors, which matters here: any friction on the contact form
// costs real enquiries.
type Turnstile struct {
	secret string
	http   *http.Client
	logger *slog.Logger
}

// NewTurnstile builds a verifier. An empty secret disables verification.
func NewTurnstile(secret string, logger *slog.Logger) *Turnstile {
	return &Turnstile{
		secret: secret,
		http:   &http.Client{Timeout: 10 * time.Second},
		logger: logger,
	}
}

// Enabled reports whether verification is configured.
func (t *Turnstile) Enabled() bool { return t != nil && t.secret != "" }

type turnstileResponse struct {
	Success    bool     `json:"success"`
	ErrorCodes []string `json:"error-codes"`
}

// Verify reports whether a token is valid.
//
// When Turnstile is not configured it returns true, which is what allows local
// development without Cloudflare credentials. Production config makes the
// secret mandatory, so this cannot silently disable spam protection on a live
// deployment.
func (t *Turnstile) Verify(ctx context.Context, token string, ip *netip.Addr) bool {
	if !t.Enabled() {
		return true
	}
	if strings.TrimSpace(token) == "" {
		return false
	}

	form := url.Values{}
	form.Set("secret", t.secret)
	form.Set("response", token)
	if ip != nil {
		form.Set("remoteip", ip.String())
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, turnstileVerifyURL,
		strings.NewReader(form.Encode()))
	if err != nil {
		t.logger.ErrorContext(ctx, "build turnstile request", slog.Any("error", err))
		return false
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := t.http.Do(req)
	if err != nil {
		// Cloudflare is unreachable. Failing closed would take the contact form
		// down with it; the per-IP rate limits still apply, so the exposure is
		// bounded while the outage lasts.
		t.logger.WarnContext(ctx, "turnstile unreachable, accepting submission without verification",
			slog.Any("error", err))
		return true
	}
	defer func() { _ = resp.Body.Close() }()

	var body turnstileResponse
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		t.logger.WarnContext(ctx, "decode turnstile response", slog.Any("error", err))
		return true
	}

	if !body.Success {
		t.logger.InfoContext(ctx, "turnstile rejected a submission",
			slog.Any("error_codes", body.ErrorCodes))
	}
	return body.Success
}

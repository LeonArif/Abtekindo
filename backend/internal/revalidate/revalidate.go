// Package revalidate notifies the frontend that cached content is stale.
//
// The public site renders from a tag-based cache, which is what lets it serve
// like a static site while being database-backed. This webhook is what closes
// the loop: without it, an edit in the CMS would not appear publicly until the
// cache aged out on its own.
package revalidate

import (
	"bytes"
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"time"
)

// Client calls the frontend's revalidation endpoint.
type Client struct {
	frontendURL string
	secret      string
	http        *http.Client
	logger      *slog.Logger
}

// New builds a revalidation client. A blank frontendURL or secret disables it.
func New(frontendURL, secret string, logger *slog.Logger) *Client {
	return &Client{
		frontendURL: frontendURL,
		secret:      secret,
		// Short timeout: this runs after a successful write, so it must never
		// be able to hold the admin's request open.
		http:   &http.Client{Timeout: 5 * time.Second},
		logger: logger,
	}
}

// Enabled reports whether the webhook is configured.
func (c *Client) Enabled() bool {
	return c.frontendURL != "" && c.secret != ""
}

type payload struct {
	Tags []string `json:"tags"`
}

// Revalidate asks the frontend to expire the given cache tags.
//
// Failures are logged and swallowed. The write has already been committed by
// this point, so returning an error would tell the admin their save failed when
// it did not. The cost of a missed call is a stale page until the cache expires
// on its own, which is recoverable; a false failure report is not.
func (c *Client) Revalidate(ctx context.Context, tags ...string) {
	if !c.Enabled() || len(tags) == 0 {
		return
	}

	body, err := json.Marshal(payload{Tags: tags})
	if err != nil {
		c.logger.ErrorContext(ctx, "encode revalidation payload", slog.Any("error", err))
		return
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		c.frontendURL+"/api/revalidate", bytes.NewReader(body))
	if err != nil {
		c.logger.ErrorContext(ctx, "build revalidation request", slog.Any("error", err))
		return
	}
	req.Header.Set("Content-Type", "application/json")
	// A shared secret rather than a signature: both services are ours, the
	// call crosses only the platform network, and the endpoint's sole power is
	// to expire a cache entry.
	req.Header.Set("X-Revalidate-Secret", c.secret)

	resp, err := c.http.Do(req)
	if err != nil {
		c.logger.WarnContext(ctx, "revalidation request failed, public pages may be stale",
			slog.Any("error", err), slog.Any("tags", tags))
		return
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode >= http.StatusBadRequest {
		c.logger.WarnContext(ctx, "revalidation rejected, public pages may be stale",
			slog.Int("status", resp.StatusCode), slog.Any("tags", tags))
		return
	}

	c.logger.InfoContext(ctx, "revalidated frontend cache", slog.Any("tags", tags))
}

package api

import (
	"context"
	"errors"
	"net"
	"net/http"
	"net/netip"

	"github.com/danielgtaylor/huma/v2"

	"github.com/LeonArif/Abtekindo/backend/internal/auth"
)

// contextKey is unexported so no other package can collide with these keys.
type contextKey int

const (
	adminContextKey contextKey = iota
	clientIPContextKey
)

// AdminFromContext returns the authenticated administrator, if any.
func AdminFromContext(ctx context.Context) (auth.User, bool) {
	user, ok := ctx.Value(adminContextKey).(auth.User)
	return user, ok
}

// ClientIPFromContext returns the caller's address, if it could be parsed.
func ClientIPFromContext(ctx context.Context) (netip.Addr, bool) {
	addr, ok := ctx.Value(clientIPContextKey).(netip.Addr)
	return addr, ok
}

// withClientIP parses the caller address once and stores it for handlers.
//
// chi's RealIP middleware has already rewritten RemoteAddr from the proxy
// headers by this point, so this only has to parse it.
func (h *Handler) withClientIP(ctx huma.Context, next func(huma.Context)) {
	if addr, ok := parseRemoteAddr(ctx.RemoteAddr()); ok {
		ctx = huma.WithValue(ctx, clientIPContextKey, addr)
	}
	next(ctx)
}

// requireAdmin rejects requests without a valid session.
//
// It runs per operation rather than globally so that mounting a new public
// endpoint cannot accidentally inherit, or accidentally skip, authentication.
func (h *Handler) requireAdmin(ctx huma.Context, next func(huma.Context)) {
	token := readCookie(ctx, AccessTokenCookie)
	if token == "" {
		h.writeUnauthorized(ctx, "tidak terautentikasi")
		return
	}

	user, err := h.auth.Authenticate(ctx.Context(), token)
	if err != nil {
		if !errors.Is(err, auth.ErrInvalidToken) {
			// A malformed or expired token is routine and not worth logging.
			// Anything else means the lookup itself failed.
			h.logger.ErrorContext(ctx.Context(), "authentication failed", "error", err)
		}
		h.writeUnauthorized(ctx, "sesi tidak valid atau telah berakhir")
		return
	}

	next(huma.WithValue(ctx, adminContextKey, user))
}

func (h *Handler) writeUnauthorized(ctx huma.Context, message string) {
	if err := huma.WriteErr(h.api, ctx, http.StatusUnauthorized, message); err != nil {
		h.logger.ErrorContext(ctx.Context(), "write unauthorized response", "error", err)
	}
}

func readCookie(ctx huma.Context, name string) string {
	cookie, err := huma.ReadCookie(ctx, name)
	if err != nil || cookie == nil {
		return ""
	}
	return cookie.Value
}

// parseRemoteAddr accepts both "host:port" and a bare address, since different
// proxies normalise it differently.
func parseRemoteAddr(remote string) (netip.Addr, bool) {
	if remote == "" {
		return netip.Addr{}, false
	}
	if host, _, err := net.SplitHostPort(remote); err == nil {
		remote = host
	}
	addr, err := netip.ParseAddr(remote)
	if err != nil {
		return netip.Addr{}, false
	}
	return addr.Unmap(), true
}

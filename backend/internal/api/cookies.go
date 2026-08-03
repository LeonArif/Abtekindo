package api

import (
	"net/http"
	"time"

	"github.com/LeonArif/Abtekindo/backend/internal/auth"
)

const (
	// AccessTokenCookie carries the short-lived JWT.
	AccessTokenCookie = "abtekindo_access"
	// RefreshTokenCookie carries the long-lived opaque token.
	RefreshTokenCookie = "abtekindo_refresh"
	// refreshCookiePath scopes the refresh cookie to the only endpoints that
	// need it, so it is not attached to every ordinary admin request.
	refreshCookiePath = "/v1/auth"
)

// CookieSettings describes how session cookies are written for this deployment.
//
// The methods return encoded Set-Cookie values rather than writing to a
// ResponseWriter, because huma emits response headers from the output struct:
// a []string field tagged `header:"Set-Cookie"` becomes one header per element.
type CookieSettings struct {
	// Domain is empty on localhost and ".abtekindo.com" in production, where
	// the frontend and the api. subdomain must share the cookie.
	Domain string
	// Secure is disabled in development because localhost is plain HTTP.
	Secure bool
}

// NewCookieSettings derives cookie settings from the environment.
func NewCookieSettings(domain string, production bool) CookieSettings {
	return CookieSettings{Domain: domain, Secure: production}
}

// Session returns the Set-Cookie values that establish a session.
//
// Both cookies are HttpOnly, so no script can read them and an XSS bug cannot
// exfiltrate a session. SameSite=Lax keeps them off cross-site POSTs, which is
// the CSRF protection for the admin API; the frontend and API share a parent
// domain, so genuine same-site requests still carry them.
func (c CookieSettings) Session(s auth.Session) []string {
	access := &http.Cookie{
		Name:     AccessTokenCookie,
		Value:    s.AccessToken,
		Path:     "/",
		Domain:   c.Domain,
		Expires:  s.AccessExpiresAt,
		MaxAge:   maxAgeUntil(s.AccessExpiresAt),
		HttpOnly: true,
		Secure:   c.Secure,
		SameSite: http.SameSiteLaxMode,
	}
	refresh := &http.Cookie{
		Name:     RefreshTokenCookie,
		Value:    s.RefreshToken,
		Path:     refreshCookiePath,
		Domain:   c.Domain,
		Expires:  s.RefreshExpiresAt,
		MaxAge:   maxAgeUntil(s.RefreshExpiresAt),
		HttpOnly: true,
		Secure:   c.Secure,
		SameSite: http.SameSiteLaxMode,
	}
	return []string{access.String(), refresh.String()}
}

// Cleared returns the Set-Cookie values that end a session.
//
// The attributes must match those used when setting the cookies, or the browser
// creates a second cookie instead of replacing the original and the user stays
// logged in.
func (c CookieSettings) Cleared() []string {
	paths := map[string]string{
		AccessTokenCookie:  "/",
		RefreshTokenCookie: refreshCookiePath,
	}

	out := make([]string, 0, len(paths))
	for name, path := range paths {
		ck := &http.Cookie{
			Name:     name,
			Value:    "",
			Path:     path,
			Domain:   c.Domain,
			Expires:  time.Unix(0, 0),
			MaxAge:   -1,
			HttpOnly: true,
			Secure:   c.Secure,
			SameSite: http.SameSiteLaxMode,
		}
		out = append(out, ck.String())
	}
	return out
}

// maxAgeUntil converts an absolute expiry to a relative one. Browsers prefer
// Max-Age over Expires, and it is immune to client clock skew.
func maxAgeUntil(t time.Time) int {
	secs := int(time.Until(t).Seconds())
	if secs < 1 {
		// A zero Max-Age means "session cookie", which is not what an already
		// expired credential should produce.
		return -1
	}
	return secs
}

package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// ErrInvalidToken covers every reason an access token is unusable: bad
// signature, wrong algorithm, expired, or malformed. Callers get one answer
// because a client can do nothing different with any of them.
var ErrInvalidToken = errors.New("invalid or expired token")

const (
	issuer = "abtekindo-api"
	// refreshTokenBytes is the entropy of an opaque refresh token. 32 bytes is
	// well beyond guessing range and keeps the cookie a reasonable size.
	refreshTokenBytes = 32
)

// Claims is the payload of an admin access token.
type Claims struct {
	jwt.RegisteredClaims
	Name string `json:"name"`
}

// UserID returns the admin user this token authenticates.
func (c Claims) UserID() string { return c.Subject }

// TokenIssuer mints and verifies access tokens.
type TokenIssuer struct {
	secret    []byte
	accessTTL time.Duration
}

// NewTokenIssuer builds an issuer over the configured signing secret.
func NewTokenIssuer(secret []byte, accessTTL time.Duration) *TokenIssuer {
	return &TokenIssuer{secret: secret, accessTTL: accessTTL}
}

// IssueAccessToken returns a signed HS256 token for the given admin user,
// along with the moment it expires.
func (t *TokenIssuer) IssueAccessToken(userID, name string) (string, time.Time, error) {
	now := time.Now()
	expiresAt := now.Add(t.accessTTL)

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, Claims{
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID,
			Issuer:    issuer,
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(expiresAt),
		},
		Name: name,
	})

	signed, err := token.SignedString(t.secret)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("sign access token: %w", err)
	}
	return signed, expiresAt, nil
}

// ParseAccessToken verifies a token and returns its claims.
func (t *TokenIssuer) ParseAccessToken(raw string) (Claims, error) {
	var claims Claims

	_, err := jwt.ParseWithClaims(raw, &claims, func(token *jwt.Token) (any, error) {
		return t.secret, nil
	},
		// Pinning the algorithm is what closes the "alg: none" and
		// RS256-to-HS256 confusion attacks. Without it, the parser would
		// accept whatever the token's own header claims.
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
		jwt.WithIssuer(issuer),
		jwt.WithExpirationRequired(),
	)
	if err != nil {
		return Claims{}, fmt.Errorf("%w: %s", ErrInvalidToken, err)
	}
	if claims.Subject == "" {
		return Claims{}, fmt.Errorf("%w: missing subject", ErrInvalidToken)
	}
	return claims, nil
}

// NewRefreshToken returns a fresh opaque refresh token and the hash to store.
//
// Refresh tokens are random rather than signed, because their authority comes
// from a database row that can be revoked. Only the hash is ever persisted, so
// a database leak does not yield usable sessions.
func NewRefreshToken() (token string, hash []byte, err error) {
	raw := make([]byte, refreshTokenBytes)
	if _, err := rand.Read(raw); err != nil {
		return "", nil, fmt.Errorf("generate refresh token: %w", err)
	}
	token = base64.RawURLEncoding.EncodeToString(raw)
	return token, HashRefreshToken(token), nil
}

// HashRefreshToken returns the stored form of a refresh token.
//
// A plain SHA-256 is correct here, unlike for passwords: the input is 256 bits
// of uniform randomness, so there is no dictionary to attack and no benefit to
// a slow hash. Using argon2 here would only add latency to every refresh.
func HashRefreshToken(token string) []byte {
	sum := sha256.Sum256([]byte(token))
	return sum[:]
}

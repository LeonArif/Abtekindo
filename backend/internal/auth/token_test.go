package auth

import (
	"bytes"
	"errors"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var testSecret = []byte("a-test-secret-that-is-long-enough-to-use")

func TestIssueAndParseAccessToken(t *testing.T) {
	issuer := NewTokenIssuer(testSecret, 15*time.Minute)

	token, expiresAt, err := issuer.IssueAccessToken("user-123", "Budi")
	if err != nil {
		t.Fatalf("IssueAccessToken: %v", err)
	}
	if !expiresAt.After(time.Now()) {
		t.Error("token expiry is not in the future")
	}

	claims, err := issuer.ParseAccessToken(token)
	if err != nil {
		t.Fatalf("ParseAccessToken: %v", err)
	}
	if claims.UserID() != "user-123" {
		t.Errorf("UserID() = %q, want %q", claims.UserID(), "user-123")
	}
	if claims.Name != "Budi" {
		t.Errorf("Name = %q, want %q", claims.Name, "Budi")
	}
}

func TestParseAccessTokenRejectsExpired(t *testing.T) {
	// A negative TTL produces a token that expired before it was returned.
	issuer := NewTokenIssuer(testSecret, -time.Minute)

	token, _, err := issuer.IssueAccessToken("user-123", "Budi")
	if err != nil {
		t.Fatalf("IssueAccessToken: %v", err)
	}

	if _, err := issuer.ParseAccessToken(token); !errors.Is(err, ErrInvalidToken) {
		t.Errorf("expired token error = %v, want ErrInvalidToken", err)
	}
}

func TestParseAccessTokenRejectsWrongSecret(t *testing.T) {
	good := NewTokenIssuer(testSecret, 15*time.Minute)
	attacker := NewTokenIssuer([]byte("a-different-secret-of-sufficient-length"), 15*time.Minute)

	token, _, err := attacker.IssueAccessToken("user-123", "Penyerang")
	if err != nil {
		t.Fatalf("IssueAccessToken: %v", err)
	}

	if _, err := good.ParseAccessToken(token); !errors.Is(err, ErrInvalidToken) {
		t.Errorf("token signed with another secret was accepted, err = %v", err)
	}
}

func TestParseAccessTokenRejectsUnsignedToken(t *testing.T) {
	// The classic "alg: none" downgrade. WithValidMethods is what stops it, so
	// this test fails loudly if that option is ever dropped.
	unsigned := jwt.NewWithClaims(jwt.SigningMethodNone, Claims{
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   "user-123",
			Issuer:    issuer,
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
		},
	})
	raw, err := unsigned.SignedString(jwt.UnsafeAllowNoneSignatureType)
	if err != nil {
		t.Fatalf("build unsigned token: %v", err)
	}

	tokenIssuer := NewTokenIssuer(testSecret, 15*time.Minute)
	if _, err := tokenIssuer.ParseAccessToken(raw); !errors.Is(err, ErrInvalidToken) {
		t.Errorf("an unsigned token was accepted, err = %v", err)
	}
}

func TestParseAccessTokenRejectsGarbage(t *testing.T) {
	tokenIssuer := NewTokenIssuer(testSecret, 15*time.Minute)

	for _, raw := range []string{"", "not.a.token", "a.b.c", "Bearer xyz"} {
		if _, err := tokenIssuer.ParseAccessToken(raw); !errors.Is(err, ErrInvalidToken) {
			t.Errorf("ParseAccessToken(%q) error = %v, want ErrInvalidToken", raw, err)
		}
	}
}

func TestNewRefreshTokenIsUniqueAndHashed(t *testing.T) {
	first, firstHash, err := NewRefreshToken()
	if err != nil {
		t.Fatalf("NewRefreshToken: %v", err)
	}
	second, secondHash, err := NewRefreshToken()
	if err != nil {
		t.Fatalf("NewRefreshToken: %v", err)
	}

	if first == second {
		t.Error("two refresh tokens were identical, randomness is broken")
	}
	if bytes.Equal(firstHash, secondHash) {
		t.Error("two refresh token hashes were identical")
	}
	if len(firstHash) != 32 {
		t.Errorf("hash length = %d, want 32 (sha256)", len(firstHash))
	}

	// The hash must be reproducible from the token, since that is how a
	// presented token is looked up.
	if !bytes.Equal(HashRefreshToken(first), firstHash) {
		t.Error("HashRefreshToken did not reproduce the hash returned at creation")
	}
	// The stored hash must not be the token itself.
	if string(firstHash) == first {
		t.Error("the stored hash is the raw token")
	}
}

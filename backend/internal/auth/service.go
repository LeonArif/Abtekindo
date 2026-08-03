package auth

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/netip"
	"strings"
	"sync"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/LeonArif/Abtekindo/backend/internal/store"
)

// ErrInvalidCredentials is returned for any failed login.
//
// It deliberately does not distinguish "no such user" from "wrong password",
// because doing so would turn the login form into an account enumeration
// oracle.
var ErrInvalidCredentials = errors.New("invalid credentials")

// ErrSessionExpired is returned when a refresh token is unknown, expired, or
// already revoked.
var ErrSessionExpired = errors.New("session expired")

// User is an authenticated administrator.
type User struct {
	ID    string
	Email string
	Name  string
}

// Session is a freshly issued credential pair.
type Session struct {
	User             User
	AccessToken      string
	AccessExpiresAt  time.Time
	RefreshToken     string
	RefreshExpiresAt time.Time
}

// Service handles admin authentication.
type Service struct {
	q          *store.Queries
	tokens     *TokenIssuer
	refreshTTL time.Duration
	logger     *slog.Logger
}

// NewService builds the authentication service.
func NewService(q *store.Queries, tokens *TokenIssuer, refreshTTL time.Duration, logger *slog.Logger) *Service {
	return &Service{q: q, tokens: tokens, refreshTTL: refreshTTL, logger: logger}
}

// decoyHash is a real Argon2id hash of an unguessable value, verified against
// when no user matches. Without it, a missing account would return noticeably
// faster than a wrong password and leak which emails are registered.
var decoyHash = sync.OnceValue(func() string {
	h, err := HashPassword("decoy-password-that-nobody-will-ever-use")
	if err != nil {
		// Only reachable if the system CSPRNG fails, in which case nothing
		// about this process is trustworthy anyway.
		panic("auth: cannot build decoy hash: " + err.Error())
	}
	return h
})

// Login verifies credentials and opens a session.
func (s *Service) Login(ctx context.Context, email, password, userAgent string, ip *netip.Addr) (Session, error) {
	email = NormaliseEmail(email)

	user, err := s.q.GetAdminUserByEmail(ctx, email)
	if errors.Is(err, pgx.ErrNoRows) {
		// Spend the same work as a real verification before failing.
		_, _ = VerifyPassword(password, decoyHash())
		return Session{}, ErrInvalidCredentials
	}
	if err != nil {
		return Session{}, fmt.Errorf("look up admin user: %w", err)
	}

	ok, err := VerifyPassword(password, user.PasswordHash)
	if err != nil {
		// A corrupt stored hash is an operational problem, not a client one.
		s.logger.ErrorContext(ctx, "stored password hash is unreadable",
			slog.String("user_id", user.ID.String()), slog.Any("error", err))
		return Session{}, ErrInvalidCredentials
	}
	if !ok {
		return Session{}, ErrInvalidCredentials
	}

	return s.issueSession(ctx, User{
		ID:    user.ID.String(),
		Email: user.Email,
		Name:  user.Name,
	}, userAgent, ip)
}

// Refresh rotates a refresh token and issues a new session.
//
// The presented token is revoked as part of the exchange, so every refresh
// token is single use. A stolen token is therefore only useful until the real
// user's next refresh, at which point one of the two parties is cut off and the
// theft becomes visible.
func (s *Service) Refresh(ctx context.Context, refreshToken, userAgent string, ip *netip.Addr) (Session, error) {
	if refreshToken == "" {
		return Session{}, ErrSessionExpired
	}

	hash := HashRefreshToken(refreshToken)

	session, err := s.q.GetActiveSessionByTokenHash(ctx, hash)
	if errors.Is(err, pgx.ErrNoRows) {
		return Session{}, ErrSessionExpired
	}
	if err != nil {
		return Session{}, fmt.Errorf("look up session: %w", err)
	}

	user, err := s.q.GetAdminUserByID(ctx, session.UserID)
	if errors.Is(err, pgx.ErrNoRows) {
		// The account was deleted while the session was still live.
		return Session{}, ErrSessionExpired
	}
	if err != nil {
		return Session{}, fmt.Errorf("look up admin user: %w", err)
	}

	if err := s.q.RevokeSession(ctx, session.ID); err != nil {
		return Session{}, fmt.Errorf("revoke rotated session: %w", err)
	}

	return s.issueSession(ctx, User{
		ID:    user.ID.String(),
		Email: user.Email,
		Name:  user.Name,
	}, userAgent, ip)
}

// Logout revokes the session behind a refresh token.
//
// An unknown token is not an error: logging out is idempotent, and reporting
// failure would tell a caller whether a token was valid.
func (s *Service) Logout(ctx context.Context, refreshToken string) error {
	if refreshToken == "" {
		return nil
	}
	if err := s.q.RevokeSessionByTokenHash(ctx, HashRefreshToken(refreshToken)); err != nil {
		return fmt.Errorf("revoke session: %w", err)
	}
	return nil
}

// Authenticate verifies an access token and returns the admin it belongs to.
//
// This reads the user from the database rather than trusting the token's claims
// alone, so a deleted account cannot keep acting until its token expires.
func (s *Service) Authenticate(ctx context.Context, accessToken string) (User, error) {
	claims, err := s.tokens.ParseAccessToken(accessToken)
	if err != nil {
		return User{}, err
	}

	id, err := parseUUID(claims.UserID())
	if err != nil {
		return User{}, ErrInvalidToken
	}

	user, err := s.q.GetAdminUserByID(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return User{}, ErrInvalidToken
	}
	if err != nil {
		return User{}, fmt.Errorf("look up admin user: %w", err)
	}

	return User{ID: user.ID.String(), Email: user.Email, Name: user.Name}, nil
}

// CreateAdmin registers an administrator. There is no public endpoint for this;
// it is driven by the createadmin command.
func (s *Service) CreateAdmin(ctx context.Context, email, password, name string) (User, error) {
	email = NormaliseEmail(email)

	if err := ValidatePassword(password); err != nil {
		return User{}, err
	}

	hash, err := HashPassword(password)
	if err != nil {
		return User{}, fmt.Errorf("hash password: %w", err)
	}

	user, err := s.q.CreateAdminUser(ctx, store.CreateAdminUserParams{
		Email:        email,
		PasswordHash: hash,
		Name:         strings.TrimSpace(name),
	})
	if err != nil {
		return User{}, fmt.Errorf("create admin user: %w", err)
	}

	return User{ID: user.ID.String(), Email: user.Email, Name: user.Name}, nil
}

// issueSession mints an access token and stores a new refresh token row.
func (s *Service) issueSession(ctx context.Context, user User, userAgent string, ip *netip.Addr) (Session, error) {
	accessToken, accessExpiresAt, err := s.tokens.IssueAccessToken(user.ID, user.Name)
	if err != nil {
		return Session{}, err
	}

	refreshToken, refreshHash, err := NewRefreshToken()
	if err != nil {
		return Session{}, err
	}
	refreshExpiresAt := time.Now().Add(s.refreshTTL)

	userID, err := parseUUID(user.ID)
	if err != nil {
		return Session{}, err
	}

	if _, err := s.q.CreateSession(ctx, store.CreateSessionParams{
		UserID:           userID,
		RefreshTokenHash: refreshHash,
		UserAgent:        truncate(userAgent, 512),
		Ip:               ip,
		ExpiresAt:        pgtype.Timestamptz{Time: refreshExpiresAt, Valid: true},
	}); err != nil {
		return Session{}, fmt.Errorf("create session: %w", err)
	}

	return Session{
		User:             user,
		AccessToken:      accessToken,
		AccessExpiresAt:  accessExpiresAt,
		RefreshToken:     refreshToken,
		RefreshExpiresAt: refreshExpiresAt,
	}, nil
}

// NormaliseEmail lowercases and trims an address. The admin_users table has a
// CHECK constraint requiring lowercase, so this is what keeps inserts valid and
// lookups case-insensitive.
func NormaliseEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

// MinPasswordLength is the floor for admin passwords. Length is the property
// that actually resists offline cracking, so it is enforced instead of
// composition rules that mostly produce predictable substitutions.
const MinPasswordLength = 12

// ValidatePassword checks an admin password against the policy.
func ValidatePassword(password string) error {
	if len(password) < MinPasswordLength {
		return fmt.Errorf("password must be at least %d characters", MinPasswordLength)
	}
	if strings.TrimSpace(password) == "" {
		return errors.New("password must not be only whitespace")
	}
	return nil
}

func parseUUID(s string) (pgtype.UUID, error) {
	var id pgtype.UUID
	if err := id.Scan(s); err != nil {
		return pgtype.UUID{}, fmt.Errorf("invalid uuid %q: %w", s, err)
	}
	return id, nil
}

func truncate(s string, max int) string {
	if len(s) <= max {
		return s
	}
	return s[:max]
}

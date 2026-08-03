package api

import (
	"context"
	"errors"
	"net/http"
	"net/netip"

	"github.com/danielgtaylor/huma/v2"

	"github.com/LeonArif/Abtekindo/backend/internal/auth"
)

// UserDTO is the authenticated administrator.
type UserDTO struct {
	ID    string `json:"id" format:"uuid"`
	Email string `json:"email" format:"email"`
	Name  string `json:"name"`
}

// LoginRequest is the admin login body.
type LoginRequest struct {
	Email    string `json:"email" format:"email" maxLength:"255" doc:"Admin email address"`
	Password string `json:"password" minLength:"1" maxLength:"512" doc:"Admin password"`
}

// LoginInput carries the login body plus the request metadata recorded on the
// session, which is what makes a stolen-session investigation possible later.
type LoginInput struct {
	Body      LoginRequest
	UserAgent string `header:"User-Agent"`
}

// SessionOutput returns the authenticated user and sets the session cookies.
type SessionOutput struct {
	SetCookie []string `header:"Set-Cookie"`
	Body      UserBody
}

// UserBody wraps the authenticated administrator.
type UserBody struct {
	User UserDTO `json:"user"`
}

// RefreshInput reads the refresh token from its cookie.
type RefreshInput struct {
	RefreshToken string `cookie:"abtekindo_refresh"`
	UserAgent    string `header:"User-Agent"`
}

// LogoutInput reads the refresh token so the session row can be revoked.
type LogoutInput struct {
	RefreshToken string `cookie:"abtekindo_refresh"`
}

// LogoutOutput clears the session cookies.
type LogoutOutput struct {
	SetCookie []string `header:"Set-Cookie"`
	Status    int
}

// MeOutput is the current administrator.
type MeOutput struct {
	Body UserBody
}

func (h *Handler) registerAuth(api huma.API) {
	huma.Register(api, huma.Operation{
		OperationID: "login",
		Method:      http.MethodPost,
		Path:        "/v1/auth/login",
		Summary:     "Log in as an administrator",
		Description: "Verifies credentials and sets HttpOnly session cookies.",
		Tags:        []string{"Auth"},
		Errors:      []int{http.StatusUnauthorized, http.StatusTooManyRequests},
	}, h.login)

	huma.Register(api, huma.Operation{
		OperationID: "refreshSession",
		Method:      http.MethodPost,
		Path:        "/v1/auth/refresh",
		Summary:     "Rotate the session",
		Description: "Exchanges the refresh cookie for a new session. Refresh tokens are single use.",
		Tags:        []string{"Auth"},
		Errors:      []int{http.StatusUnauthorized},
	}, h.refresh)

	huma.Register(api, huma.Operation{
		OperationID:   "logout",
		Method:        http.MethodPost,
		Path:          "/v1/auth/logout",
		Summary:       "Log out",
		Description:   "Revokes the session and clears the cookies. Safe to call when already logged out.",
		Tags:          []string{"Auth"},
		DefaultStatus: http.StatusNoContent,
	}, h.logout)

	huma.Register(api, huma.Operation{
		OperationID: "getCurrentUser",
		Method:      http.MethodGet,
		Path:        "/v1/auth/me",
		Summary:     "Get the current administrator",
		Tags:        []string{"Auth"},
		Security:    []map[string][]string{{"cookieAuth": {}}},
		Errors:      []int{http.StatusUnauthorized},
		Middlewares: huma.Middlewares{h.requireAdmin},
	}, h.me)
}

func (h *Handler) login(ctx context.Context, in *LoginInput) (*SessionOutput, error) {
	session, err := h.auth.Login(ctx, in.Body.Email, in.Body.Password, in.UserAgent, clientIP(ctx))
	if errors.Is(err, auth.ErrInvalidCredentials) {
		// One message for both "no such account" and "wrong password", so the
		// form cannot be used to discover which emails are registered.
		return nil, huma.Error401Unauthorized("email atau kata sandi salah")
	}
	if err != nil {
		return nil, h.internal(ctx, "login", err)
	}

	return &SessionOutput{
		SetCookie: h.cookies.Session(session),
		Body:      UserBody{User: toUserDTO(session.User)},
	}, nil
}

func (h *Handler) refresh(ctx context.Context, in *RefreshInput) (*SessionOutput, error) {
	session, err := h.auth.Refresh(ctx, in.RefreshToken, in.UserAgent, clientIP(ctx))
	if errors.Is(err, auth.ErrSessionExpired) {
		return nil, huma.Error401Unauthorized("sesi telah berakhir, silakan masuk kembali")
	}
	if err != nil {
		return nil, h.internal(ctx, "refresh session", err)
	}

	return &SessionOutput{
		SetCookie: h.cookies.Session(session),
		Body:      UserBody{User: toUserDTO(session.User)},
	}, nil
}

func (h *Handler) logout(ctx context.Context, in *LogoutInput) (*LogoutOutput, error) {
	if err := h.auth.Logout(ctx, in.RefreshToken); err != nil {
		return nil, h.internal(ctx, "logout", err)
	}
	// The cookies are cleared even when the token was already unknown, so a
	// stale browser session cannot get stuck holding a dead cookie.
	return &LogoutOutput{
		SetCookie: h.cookies.Cleared(),
		Status:    http.StatusNoContent,
	}, nil
}

func (h *Handler) me(ctx context.Context, _ *struct{}) (*MeOutput, error) {
	user, ok := AdminFromContext(ctx)
	if !ok {
		return nil, huma.Error401Unauthorized("tidak terautentikasi")
	}
	return &MeOutput{Body: UserBody{User: toUserDTO(user)}}, nil
}

func toUserDTO(u auth.User) UserDTO {
	return UserDTO{ID: u.ID, Email: u.Email, Name: u.Name}
}

// clientIP reads the caller address recorded by the request-scoped middleware.
func clientIP(ctx context.Context) *netip.Addr {
	addr, ok := ClientIPFromContext(ctx)
	if !ok {
		return nil
	}
	return &addr
}

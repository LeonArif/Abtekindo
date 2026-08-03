package api

import (
	"context"
	"log/slog"

	"github.com/danielgtaylor/huma/v2"

	"github.com/LeonArif/Abtekindo/backend/internal/auth"
	"github.com/LeonArif/Abtekindo/backend/internal/catalog"
	"github.com/LeonArif/Abtekindo/backend/internal/leads"
	"github.com/LeonArif/Abtekindo/backend/internal/revalidate"
	"github.com/LeonArif/Abtekindo/backend/internal/storage"
)

// Handler holds the dependencies every operation shares.
type Handler struct {
	catalog     *catalog.Catalog
	auth        *auth.Service
	cookies     CookieSettings
	revalidator *revalidate.Client
	uploads     *storage.Uploader
	leads       *leads.Service
	turnstile   *leads.Turnstile
	logger      *slog.Logger

	// api is captured during Register so middleware can write error responses
	// through the same serialiser the operations use.
	api huma.API
}

// Deps are the collaborators the API needs.
type Deps struct {
	Catalog     *catalog.Catalog
	Auth        *auth.Service
	Cookies     CookieSettings
	Revalidator *revalidate.Client
	Uploads     *storage.Uploader
	Leads       *leads.Service
	Turnstile   *leads.Turnstile
	Logger      *slog.Logger
}

// NewHandler builds the API handler.
func NewHandler(d Deps) *Handler {
	return &Handler{
		catalog:     d.Catalog,
		auth:        d.Auth,
		cookies:     d.Cookies,
		revalidator: d.Revalidator,
		uploads:     d.Uploads,
		leads:       d.Leads,
		turnstile:   d.Turnstile,
		logger:      d.Logger,
	}
}

// Register mounts every operation onto the given huma API.
func (h *Handler) Register(api huma.API) {
	h.api = api

	// Applies to every operation registered after this call, so handlers can
	// rely on the caller's address being available.
	api.UseMiddleware(h.withClientIP)

	h.registerPublic(api)
	h.registerAuth(api)
	h.registerAdmin(api)
	h.registerUploads(api)
	h.registerLeads(api)
}

// internal logs the underlying cause and returns a generic 500.
//
// The real error is never sent to the client: a database error message can
// disclose schema details, and there is nothing a visitor can do with it
// regardless.
func (h *Handler) internal(ctx context.Context, op string, err error) error {
	h.logger.ErrorContext(ctx, "request failed", slog.String("operation", op), slog.Any("error", err))
	return huma.Error500InternalServerError("terjadi kesalahan pada server")
}

// revalidate expires the given frontend cache tags after a successful write.
//
// It is best effort by design: see revalidate.Client.Revalidate for why a
// failure here must not surface as a failed save.
func (h *Handler) revalidate(ctx context.Context, tags ...string) {
	if h.revalidator == nil {
		return
	}
	h.revalidator.Revalidate(ctx, tags...)
}

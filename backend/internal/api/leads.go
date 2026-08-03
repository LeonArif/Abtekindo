package api

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/danielgtaylor/huma/v2"

	"github.com/LeonArif/Abtekindo/backend/internal/leads"
	"github.com/LeonArif/Abtekindo/backend/internal/store"
)

// LeadSource is where an enquiry came from. Its enum is derived at runtime from
// the leads package, so the schema cannot drift from the parser.
type LeadSource string

// Schema implements huma.SchemaProvider.
func (LeadSource) Schema(huma.Registry) *huma.Schema {
	return &huma.Schema{
		Type:        huma.TypeString,
		Title:       "LeadSource",
		Description: "Which page the enquiry came from",
		Enum:        toAnySlice(leads.SourceValues()),
	}
}

// LeadStatus is a lead's position in the inbox workflow.
type LeadStatus string

// Schema implements huma.SchemaProvider.
func (LeadStatus) Schema(huma.Registry) *huma.Schema {
	return &huma.Schema{
		Type:        huma.TypeString,
		Title:       "LeadStatus",
		Description: "Inbox workflow state",
		Enum:        toAnySlice(leads.StatusValues()),
	}
}

// LeadRequest is a contact form submission.
type LeadRequest struct {
	Name    string     `json:"name" minLength:"1" maxLength:"120" doc:"Customer name"`
	Phone   string     `json:"phone" minLength:"1" maxLength:"30" doc:"Indonesian mobile number, e.g. 081234567890"`
	Email   string     `json:"email" required:"false" maxLength:"255" doc:"Optional. Many customers only have a phone number."`
	Message string     `json:"message" minLength:"10" maxLength:"2000"`
	Source  LeadSource `json:"source" required:"false" doc:"Defaults to the contact form"`
	// Product and service references are optional context, so the admin can see
	// what the customer was looking at when they got in touch.
	ProductID string `json:"productId" required:"false" doc:"Product the enquiry is about, if any"`
	ServiceID string `json:"serviceId" required:"false" doc:"Service the enquiry is about, if any"`
	// TurnstileToken is required in production, where the secret is mandatory.
	TurnstileToken string `json:"turnstileToken" required:"false" doc:"Cloudflare Turnstile response token"`
}

// CreateLeadInput carries the submission plus request metadata.
type CreateLeadInput struct {
	Body      LeadRequest
	UserAgent string `header:"User-Agent"`
}

// LeadAcceptedBody confirms a submission without echoing it back.
type LeadAcceptedBody struct {
	ID      string `json:"id" format:"uuid"`
	Message string `json:"message" doc:"Confirmation text to show the visitor, in Indonesian"`
}

// CreateLeadOutput is the public submission response.
type CreateLeadOutput struct {
	Body LeadAcceptedBody
}

// LeadDTO is a stored enquiry as shown in the admin inbox.
type LeadDTO struct {
	ID        string     `json:"id" format:"uuid"`
	Name      string     `json:"name"`
	Phone     string     `json:"phone"`
	Email     string     `json:"email"`
	Message   string     `json:"message"`
	Source    LeadSource `json:"source"`
	Status    LeadStatus `json:"status"`
	ProductID string     `json:"productId" doc:"Empty when the enquiry was not about a product"`
	ServiceID string     `json:"serviceId" doc:"Empty when the enquiry was not about a service"`
	CreatedAt time.Time  `json:"createdAt"`
}

// LeadListBody is a page of the admin inbox.
type LeadListBody struct {
	Leads      []LeadDTO        `json:"leads" nullable:"false"`
	Pagination PaginationDTO    `json:"pagination"`
	Counts     map[string]int64 `json:"counts" doc:"Lead totals per status, every status present even at zero"`
}

// AdminListLeadsInput filters the inbox.
type AdminListLeadsInput struct {
	Status   string `query:"status" required:"false" doc:"Filter by status. Omit for all leads."`
	Page     int    `query:"page" default:"1" minimum:"1"`
	PageSize int    `query:"pageSize" default:"50" minimum:"1" maximum:"100"`
}

// AdminLeadListOutput is a page of leads.
type AdminLeadListOutput struct {
	Body LeadListBody
}

// UpdateLeadStatusRequest moves a lead through the workflow.
type UpdateLeadStatusRequest struct {
	Status LeadStatus `json:"status"`
}

// AdminUpdateLeadInput identifies the lead and the new status.
type AdminUpdateLeadInput struct {
	ID   string `path:"id" format:"uuid"`
	Body UpdateLeadStatusRequest
}

// AdminLeadOutput wraps a single lead.
type AdminLeadOutput struct {
	Body AdminLeadBody
}

// AdminLeadBody wraps one lead.
type AdminLeadBody struct {
	Lead LeadDTO `json:"lead"`
}

func (h *Handler) registerLeads(api huma.API) {
	huma.Register(api, huma.Operation{
		OperationID: "createLead",
		Method:      http.MethodPost,
		Path:        "/v1/leads",
		Summary:     "Submit a contact enquiry",
		Description: "Public endpoint. Rate limited per IP and protected by Cloudflare Turnstile.",
		Tags:        []string{"Leads"},
		Errors: []int{
			http.StatusUnprocessableEntity,
			http.StatusTooManyRequests,
			http.StatusForbidden,
		},
		DefaultStatus: http.StatusCreated,
	}, h.createLead)

	guard := huma.Middlewares{h.requireAdmin}

	huma.Register(api, huma.Operation{
		OperationID: "adminListLeads",
		Method:      http.MethodGet,
		Path:        "/v1/admin/leads",
		Summary:     "List enquiries",
		Tags:        []string{"Admin"},
		Security:    adminSecurity,
		Middlewares: guard,
		Errors:      []int{http.StatusUnauthorized},
	}, h.adminListLeads)

	huma.Register(api, huma.Operation{
		OperationID: "adminUpdateLeadStatus",
		Method:      http.MethodPatch,
		Path:        "/v1/admin/leads/{id}",
		Summary:     "Update an enquiry's status",
		Tags:        []string{"Admin"},
		Security:    adminSecurity,
		Middlewares: guard,
		Errors:      []int{http.StatusUnauthorized, http.StatusNotFound, http.StatusUnprocessableEntity},
	}, h.adminUpdateLeadStatus)
}

func (h *Handler) createLead(ctx context.Context, in *CreateLeadInput) (*CreateLeadOutput, error) {
	ip := clientIP(ctx)

	if !h.turnstile.Verify(ctx, in.Body.TurnstileToken, ip) {
		return nil, huma.Error403Forbidden("verifikasi keamanan gagal, silakan muat ulang halaman dan coba lagi")
	}

	lead, err := h.leads.Submit(ctx, leads.Submission{
		Name:      in.Body.Name,
		Phone:     in.Body.Phone,
		Email:     in.Body.Email,
		Message:   in.Body.Message,
		Source:    store.LeadSource(in.Body.Source),
		ProductID: in.Body.ProductID,
		ServiceID: in.Body.ServiceID,
		IP:        ip,
		UserAgent: in.UserAgent,
	})

	var verr leads.ErrValidation
	switch {
	case errors.As(err, &verr):
		// The message is already written in Indonesian for the visitor.
		return nil, huma.Error422UnprocessableEntity(verr.Message)
	case errors.Is(err, leads.ErrRateLimited):
		return nil, huma.Error429TooManyRequests(
			"terlalu banyak pengiriman dari perangkat ini, silakan hubungi kami melalui WhatsApp")
	case err != nil:
		return nil, h.internal(ctx, "create lead", err)
	}

	return &CreateLeadOutput{Body: LeadAcceptedBody{
		ID:      lead.ID,
		Message: "Terima kasih, pesan Anda sudah kami terima. Tim kami akan menghubungi Anda segera.",
	}}, nil
}

func (h *Handler) adminListLeads(ctx context.Context, in *AdminListLeadsInput) (*AdminLeadListOutput, error) {
	items, total, err := h.leads.List(ctx, in.Status, in.Page, in.PageSize)
	var verr leads.ErrValidation
	if errors.As(err, &verr) {
		return nil, huma.Error422UnprocessableEntity(verr.Message)
	}
	if err != nil {
		return nil, h.internal(ctx, "list leads", err)
	}

	counts, err := h.leads.Counts(ctx)
	if err != nil {
		return nil, h.internal(ctx, "count leads", err)
	}

	out := make([]LeadDTO, 0, len(items))
	for _, l := range items {
		out = append(out, toLeadDTO(l))
	}

	pageSize := in.PageSize
	totalPages := 1
	if pageSize > 0 && total > 0 {
		totalPages = int((total + int64(pageSize) - 1) / int64(pageSize))
	}

	return &AdminLeadListOutput{Body: LeadListBody{
		Leads: out,
		Pagination: PaginationDTO{
			Page: in.Page, PageSize: pageSize, Total: total, TotalPages: totalPages,
		},
		Counts: counts,
	}}, nil
}

func (h *Handler) adminUpdateLeadStatus(ctx context.Context, in *AdminUpdateLeadInput) (*AdminLeadOutput, error) {
	lead, err := h.leads.UpdateStatus(ctx, in.ID, string(in.Body.Status))

	var verr leads.ErrValidation
	switch {
	case errors.As(err, &verr):
		return nil, huma.Error422UnprocessableEntity(verr.Message)
	case errors.Is(err, leads.ErrNotFound):
		return nil, huma.Error404NotFound("prospek tidak ditemukan")
	case err != nil:
		return nil, h.internal(ctx, "update lead status", err)
	}

	return &AdminLeadOutput{Body: AdminLeadBody{Lead: toLeadDTO(lead)}}, nil
}

func toLeadDTO(l leads.Lead) LeadDTO {
	return LeadDTO{
		ID:        l.ID,
		Name:      l.Name,
		Phone:     l.Phone,
		Email:     l.Email,
		Message:   l.Message,
		Source:    LeadSource(l.Source),
		Status:    LeadStatus(l.Status),
		ProductID: l.ProductID,
		ServiceID: l.ServiceID,
		CreatedAt: l.CreatedAt,
	}
}

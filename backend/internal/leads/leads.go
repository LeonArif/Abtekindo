// Package leads captures and manages customer enquiries.
//
// WhatsApp is the primary way customers reach the company, but a message that
// arrives while nobody is watching is easy to lose. The contact form is the
// durable path: every submission becomes a database row that persists until
// someone marks it handled.
package leads

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/netip"
	"regexp"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/LeonArif/Abtekindo/backend/internal/store"
)

// ErrNotFound is returned when a lead id does not exist.
var ErrNotFound = errors.New("lead not found")

// ErrRateLimited is returned when one address submits too many leads.
var ErrRateLimited = errors.New("too many submissions")

// ErrValidation reports a rejected submission. The message is shown to the
// visitor, so it is written in Indonesian.
type ErrValidation struct {
	Field   string
	Message string
}

func (e ErrValidation) Error() string { return e.Field + ": " + e.Message }

// Limits on stored text. These match what the form allows and keep a scripted
// submitter from writing a novel into the database.
const (
	maxNameLength    = 120
	maxPhoneLength   = 30
	maxEmailLength   = 255
	maxMessageLength = 2000
	minMessageLength = 10
)

// perIPWindow and perIPLimit form the persistent half of abuse control. The
// in-memory limiter in front of the handler resets whenever the process
// restarts; this one does not.
const (
	perIPWindow = time.Hour
	perIPLimit  = 10
)

// Lead is a captured enquiry.
type Lead struct {
	ID        string
	Name      string
	Phone     string
	Email     string
	Message   string
	Source    store.LeadSource
	ProductID string
	ServiceID string
	Status    store.LeadStatus
	CreatedAt time.Time
}

// Submission is an incoming enquiry from the public form.
type Submission struct {
	Name      string
	Phone     string
	Email     string
	Message   string
	Source    store.LeadSource
	ProductID string
	ServiceID string
	IP        *netip.Addr
	UserAgent string
}

// Notifier is told about new leads. Implemented by the mailer, and left as an
// interface so a failing mail provider cannot become a reason a lead is lost.
type Notifier interface {
	NotifyNewLead(ctx context.Context, lead Lead)
}

// Service captures and manages leads.
type Service struct {
	q        *store.Queries
	notifier Notifier
	logger   *slog.Logger
}

// NewService builds the lead service.
func NewService(q *store.Queries, notifier Notifier, logger *slog.Logger) *Service {
	return &Service{q: q, notifier: notifier, logger: logger}
}

// indonesianPhone matches the shapes Indonesian visitors actually type:
// 08xxx, +628xxx, 628xxx, optionally with spaces or dashes.
var indonesianPhone = regexp.MustCompile(`^(\+?62|0)8[1-9][0-9]{6,11}$`)

// Submit validates and stores an enquiry.
func (s *Service) Submit(ctx context.Context, in Submission) (Lead, error) {
	clean, err := validate(in)
	if err != nil {
		return Lead{}, err
	}

	if err := s.checkRateLimit(ctx, in.IP); err != nil {
		return Lead{}, err
	}

	row, err := s.q.CreateLead(ctx, store.CreateLeadParams{
		Name:      clean.Name,
		Phone:     clean.Phone,
		Email:     clean.Email,
		Message:   clean.Message,
		Source:    clean.Source,
		ProductID: optionalUUID(clean.ProductID),
		ServiceID: optionalUUID(clean.ServiceID),
		Ip:        in.IP,
		UserAgent: truncate(in.UserAgent, 512),
	})
	if err != nil {
		return Lead{}, fmt.Errorf("create lead: %w", err)
	}

	lead := toLead(row)

	// Notification is deliberately after the commit and never fatal: the lead
	// is already safe in the database, and failing the visitor's submission
	// because an email provider was down would lose the very thing we are
	// trying to protect.
	if s.notifier != nil {
		s.notifier.NotifyNewLead(ctx, lead)
	}

	return lead, nil
}

// checkRateLimit rejects an address that has already submitted too many leads.
func (s *Service) checkRateLimit(ctx context.Context, ip *netip.Addr) error {
	if ip == nil {
		// No usable address, which happens behind some proxies. The in-memory
		// limiter still applies, so this is not an open door.
		return nil
	}

	// Built from fields rather than parsed: pgtype.Interval.Scan expects
	// Postgres interval syntax, not Go's "1h0m0s" duration format.
	window := pgtype.Interval{Microseconds: perIPWindow.Microseconds(), Valid: true}

	count, err := s.q.CountRecentLeadsByIP(ctx, store.CountRecentLeadsByIPParams{
		Ip:     ip,
		Within: window,
	})
	if err != nil {
		// Failing open is the right call: a broken counter must not stop
		// genuine customers from making contact.
		s.logger.ErrorContext(ctx, "lead rate limit check failed, allowing submission",
			slog.Any("error", err))
		return nil
	}

	if count >= perIPLimit {
		return ErrRateLimited
	}
	return nil
}

// List returns a page of leads for the admin inbox.
func (s *Service) List(ctx context.Context, status string, page, pageSize int) ([]Lead, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 50
	}

	// A nil filter means "every status", which is what the query's
	// IS NULL branch checks for.
	var filter *store.LeadStatus
	if status != "" {
		parsed, ok := ParseStatus(status)
		if !ok {
			return nil, 0, ErrValidation{Field: "status", Message: "status tidak dikenal"}
		}
		filter = &parsed
	}

	rows, err := s.q.ListLeads(ctx, store.ListLeadsParams{
		Status:       filter,
		ResultLimit:  int32(pageSize),
		ResultOffset: int32((page - 1) * pageSize),
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list leads: %w", err)
	}

	out := make([]Lead, 0, len(rows))
	var total int64
	for _, r := range rows {
		out = append(out, toLead(r.Lead))
		total = r.TotalCount
	}
	return out, total, nil
}

// Counts returns how many leads sit in each status, for the inbox badge.
func (s *Service) Counts(ctx context.Context) (map[string]int64, error) {
	rows, err := s.q.CountLeadsByStatus(ctx)
	if err != nil {
		return nil, fmt.Errorf("count leads: %w", err)
	}

	// Every status is present even at zero, so the UI never has to distinguish
	// "none" from "not reported".
	counts := map[string]int64{
		string(store.LeadStatusNew):       0,
		string(store.LeadStatusContacted): 0,
		string(store.LeadStatusClosed):    0,
	}
	for _, r := range rows {
		counts[string(r.Status)] = r.Total
	}
	return counts, nil
}

// UpdateStatus moves a lead through the inbox workflow.
func (s *Service) UpdateStatus(ctx context.Context, id, status string) (Lead, error) {
	parsed, ok := ParseStatus(status)
	if !ok {
		return Lead{}, ErrValidation{Field: "status", Message: "status tidak dikenal"}
	}

	uid, err := parseUUID(id)
	if err != nil {
		return Lead{}, ErrNotFound
	}

	row, err := s.q.UpdateLeadStatus(ctx, store.UpdateLeadStatusParams{ID: uid, Status: parsed})
	if errors.Is(err, pgx.ErrNoRows) {
		return Lead{}, ErrNotFound
	}
	if err != nil {
		return Lead{}, fmt.Errorf("update lead status: %w", err)
	}
	return toLead(row), nil
}

// AllStatuses is the single source of truth for accepted status values.
var AllStatuses = []store.LeadStatus{
	store.LeadStatusNew,
	store.LeadStatusContacted,
	store.LeadStatusClosed,
}

// StatusValues returns the accepted statuses as strings, for schema generation.
func StatusValues() []string {
	out := make([]string, 0, len(AllStatuses))
	for _, s := range AllStatuses {
		out = append(out, string(s))
	}
	return out
}

// ParseStatus converts an untrusted string into a LeadStatus.
func ParseStatus(s string) (store.LeadStatus, bool) {
	for _, v := range AllStatuses {
		if string(v) == s {
			return v, true
		}
	}
	return "", false
}

// AllSources is the single source of truth for accepted source values.
var AllSources = []store.LeadSource{
	store.LeadSourceContact,
	store.LeadSourceService,
	store.LeadSourceProduct,
}

// SourceValues returns the accepted sources as strings.
func SourceValues() []string {
	out := make([]string, 0, len(AllSources))
	for _, s := range AllSources {
		out = append(out, string(s))
	}
	return out
}

// ParseSource converts an untrusted string into a LeadSource.
func ParseSource(s string) (store.LeadSource, bool) {
	for _, v := range AllSources {
		if string(v) == s {
			return v, true
		}
	}
	return "", false
}

// validate normalises and checks a submission.
func validate(in Submission) (Submission, error) {
	out := in
	out.Name = strings.TrimSpace(in.Name)
	out.Phone = normalisePhone(in.Phone)
	out.Email = strings.ToLower(strings.TrimSpace(in.Email))
	out.Message = strings.TrimSpace(in.Message)

	switch {
	case out.Name == "":
		return out, ErrValidation{Field: "name", Message: "nama wajib diisi"}
	case len([]rune(out.Name)) > maxNameLength:
		return out, ErrValidation{Field: "name", Message: "nama terlalu panjang"}
	}

	switch {
	case out.Phone == "":
		return out, ErrValidation{Field: "phone", Message: "nomor telepon wajib diisi"}
	case len(out.Phone) > maxPhoneLength:
		return out, ErrValidation{Field: "phone", Message: "nomor telepon terlalu panjang"}
	case !indonesianPhone.MatchString(out.Phone):
		return out, ErrValidation{Field: "phone", Message: "format nomor telepon tidak valid, contoh: 081234567890"}
	}

	if out.Email != "" {
		if len(out.Email) > maxEmailLength {
			return out, ErrValidation{Field: "email", Message: "email terlalu panjang"}
		}
		if !strings.Contains(out.Email, "@") || strings.HasPrefix(out.Email, "@") || strings.HasSuffix(out.Email, "@") {
			return out, ErrValidation{Field: "email", Message: "format email tidak valid"}
		}
	}

	switch {
	case out.Message == "":
		return out, ErrValidation{Field: "message", Message: "pesan wajib diisi"}
	case len([]rune(out.Message)) < minMessageLength:
		return out, ErrValidation{Field: "message", Message: "pesan terlalu singkat, mohon jelaskan kebutuhan Anda"}
	case len([]rune(out.Message)) > maxMessageLength:
		return out, ErrValidation{Field: "message", Message: "pesan terlalu panjang"}
	}

	if out.Source == "" {
		out.Source = store.LeadSourceContact
	}
	if _, ok := ParseSource(string(out.Source)); !ok {
		return out, ErrValidation{Field: "source", Message: "sumber tidak dikenal"}
	}

	return out, nil
}

// normalisePhone strips the separators people type so that validation and
// later comparison see one canonical form.
func normalisePhone(phone string) string {
	var b strings.Builder
	for _, r := range strings.TrimSpace(phone) {
		switch {
		case r >= '0' && r <= '9':
			b.WriteRune(r)
		case r == '+' && b.Len() == 0:
			b.WriteRune(r)
		}
	}
	return b.String()
}

func toLead(r store.Lead) Lead {
	return Lead{
		ID:        r.ID.String(),
		Name:      r.Name,
		Phone:     r.Phone,
		Email:     r.Email,
		Message:   r.Message,
		Source:    r.Source,
		ProductID: uuidString(r.ProductID),
		ServiceID: uuidString(r.ServiceID),
		Status:    r.Status,
		CreatedAt: r.CreatedAt.Time,
	}
}

func uuidString(id pgtype.UUID) string {
	if !id.Valid {
		return ""
	}
	return id.String()
}

// optionalUUID converts an optional id string into a nullable column value. An
// unparseable id becomes NULL rather than an error: the association is a
// convenience for the admin, and a bad one must not block a customer enquiry.
func optionalUUID(s string) pgtype.UUID {
	if s == "" {
		return pgtype.UUID{}
	}
	id, err := parseUUID(s)
	if err != nil {
		return pgtype.UUID{}
	}
	return id
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

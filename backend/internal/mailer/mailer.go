// Package mailer sends lead notification emails through Resend.
//
// Notifications are an alert, not a system of record. The lead is already
// committed to the database before anything here runs, so every failure path
// logs and returns rather than propagating.
package mailer

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"html"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/LeonArif/Abtekindo/backend/internal/config"
	"github.com/LeonArif/Abtekindo/backend/internal/leads"
	"github.com/LeonArif/Abtekindo/backend/internal/store"
)

const resendEndpoint = "https://api.resend.com/emails"

// Mailer notifies the company about new leads.
type Mailer struct {
	cfg         config.MailerConfig
	frontendURL string
	http        *http.Client
	logger      *slog.Logger
}

// New builds a mailer. A mailer with unset credentials is still usable; it
// simply logs instead of sending, which is the development behaviour.
func New(cfg config.MailerConfig, frontendURL string, logger *slog.Logger) *Mailer {
	return &Mailer{
		cfg:         cfg,
		frontendURL: strings.TrimRight(frontendURL, "/"),
		http:        &http.Client{Timeout: 10 * time.Second},
		logger:      logger,
	}
}

type resendRequest struct {
	From    string   `json:"from"`
	To      []string `json:"to"`
	Subject string   `json:"subject"`
	HTML    string   `json:"html"`
	ReplyTo string   `json:"reply_to,omitempty"`
}

// NotifyNewLead implements leads.Notifier.
func (m *Mailer) NotifyNewLead(ctx context.Context, lead leads.Lead) {
	if !m.cfg.Configured() {
		m.logger.InfoContext(ctx, "new lead received, email notification disabled",
			slog.String("lead_id", lead.ID),
			slog.String("name", lead.Name),
			slog.String("phone", lead.Phone))
		return
	}

	payload := resendRequest{
		From:    m.cfg.From,
		To:      []string{m.cfg.To},
		Subject: fmt.Sprintf("Prospek baru dari %s (%s)", lead.Name, sourceLabel(lead.Source)),
		HTML:    m.renderBody(lead),
	}
	// Setting reply-to means hitting Reply in the inbox writes straight back to
	// the customer, which is the fastest possible path to a response.
	if lead.Email != "" {
		payload.ReplyTo = lead.Email
	}

	body, err := json.Marshal(payload)
	if err != nil {
		m.logger.ErrorContext(ctx, "encode lead notification", slog.Any("error", err))
		return
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, resendEndpoint, bytes.NewReader(body))
	if err != nil {
		m.logger.ErrorContext(ctx, "build lead notification request", slog.Any("error", err))
		return
	}
	req.Header.Set("Authorization", "Bearer "+m.cfg.APIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := m.http.Do(req)
	if err != nil {
		m.logger.ErrorContext(ctx, "send lead notification, the lead is still saved",
			slog.String("lead_id", lead.ID), slog.Any("error", err))
		return
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode >= http.StatusBadRequest {
		m.logger.ErrorContext(ctx, "lead notification rejected, the lead is still saved",
			slog.String("lead_id", lead.ID), slog.Int("status", resp.StatusCode))
		return
	}

	m.logger.InfoContext(ctx, "lead notification sent", slog.String("lead_id", lead.ID))
}

// renderBody builds the notification email.
//
// Every interpolated value is a customer-supplied string, so all of it is
// HTML-escaped. An unescaped message field would let a submitter inject markup
// into the owner's inbox.
func (m *Mailer) renderBody(lead leads.Lead) string {
	var b strings.Builder

	b.WriteString(`<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:600px">`)
	b.WriteString(`<h2 style="margin:0 0 16px">Prospek baru dari website</h2>`)
	b.WriteString(`<table cellpadding="8" style="border-collapse:collapse;width:100%">`)

	row := func(label, value string) {
		if value == "" {
			return
		}
		b.WriteString(`<tr><td style="background:#f1f5f9;font-weight:600;width:140px">`)
		b.WriteString(html.EscapeString(label))
		b.WriteString(`</td><td>`)
		b.WriteString(html.EscapeString(value))
		b.WriteString(`</td></tr>`)
	}

	row("Nama", lead.Name)
	row("Telepon", lead.Phone)
	row("Email", lead.Email)
	row("Sumber", sourceLabel(lead.Source))
	row("Waktu", lead.CreatedAt.Format("02 Jan 2006, 15:04 WIB"))

	b.WriteString(`<tr><td style="background:#f1f5f9;font-weight:600;vertical-align:top">Pesan</td><td>`)
	// Newlines are converted after escaping so the customer's line breaks
	// survive without letting any other markup through.
	b.WriteString(strings.ReplaceAll(html.EscapeString(lead.Message), "\n", "<br>"))
	b.WriteString(`</td></tr></table>`)

	// WhatsApp is how the company actually replies, so the primary action in
	// the email is a chat link rather than a link back into the CMS.
	if wa := whatsappLink(lead.Phone); wa != "" {
		b.WriteString(`<p style="margin:20px 0"><a href="` + wa + `" `)
		b.WriteString(`style="background:#16a34a;color:#fff;padding:12px 20px;border-radius:8px;`)
		b.WriteString(`text-decoration:none;display:inline-block">Balas via WhatsApp</a></p>`)
	}

	if m.frontendURL != "" {
		b.WriteString(`<p style="color:#64748b;font-size:14px">`)
		b.WriteString(`Kelola prospek di <a href="` + m.frontendURL + `/admin/prospek">panel admin</a>.</p>`)
	}

	b.WriteString(`</div>`)
	return b.String()
}

// whatsappLink converts a stored Indonesian number into a wa.me URL.
func whatsappLink(phone string) string {
	digits := strings.Map(func(r rune) rune {
		if r >= '0' && r <= '9' {
			return r
		}
		return -1
	}, phone)

	switch {
	case digits == "":
		return ""
	case strings.HasPrefix(digits, "0"):
		// Local format: swap the leading 0 for the country code.
		digits = "62" + digits[1:]
	case !strings.HasPrefix(digits, "62"):
		return ""
	}
	return "https://wa.me/" + digits
}

// sourceLabel turns a lead source into Indonesian for the email subject and
// body, so the owner can see at a glance where an enquiry came from.
func sourceLabel(source store.LeadSource) string {
	switch source {
	case store.LeadSourceProduct:
		return "halaman produk"
	case store.LeadSourceService:
		return "halaman layanan"
	case store.LeadSourceContact:
		return "form kontak"
	default:
		return string(source)
	}
}

package leads

import (
	"errors"
	"testing"

	"github.com/LeonArif/Abtekindo/backend/internal/store"
)

func validSubmission() Submission {
	return Submission{
		Name:    "Budi Santoso",
		Phone:   "081234567890",
		Email:   "budi@example.com",
		Message: "Saya ingin memesan cuci AC untuk 3 unit di rumah.",
		Source:  store.LeadSourceContact,
	}
}

func TestValidateAcceptsAGoodSubmission(t *testing.T) {
	out, err := validate(validSubmission())
	if err != nil {
		t.Fatalf("validate rejected a valid submission: %v", err)
	}
	if out.Name != "Budi Santoso" {
		t.Errorf("Name = %q", out.Name)
	}
	if out.Source != store.LeadSourceContact {
		t.Errorf("Source = %q", out.Source)
	}
}

func TestValidateRequiresCoreFields(t *testing.T) {
	tests := []struct {
		name      string
		mutate    func(*Submission)
		wantField string
	}{
		{"empty name", func(s *Submission) { s.Name = "" }, "name"},
		{"whitespace-only name", func(s *Submission) { s.Name = "   " }, "name"},
		{"empty phone", func(s *Submission) { s.Phone = "" }, "phone"},
		{"empty message", func(s *Submission) { s.Message = "" }, "message"},
		{"message too short", func(s *Submission) { s.Message = "halo" }, "message"},
		{"name too long", func(s *Submission) { s.Name = string(make([]rune, maxNameLength+1)) }, "name"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			in := validSubmission()
			tt.mutate(&in)

			_, err := validate(in)
			var verr ErrValidation
			if !errors.As(err, &verr) {
				t.Fatalf("validate error = %v, want ErrValidation", err)
			}
			if verr.Field != tt.wantField {
				t.Errorf("rejected field = %q, want %q", verr.Field, tt.wantField)
			}
			if verr.Message == "" {
				t.Error("validation message is empty, the visitor would see nothing")
			}
		})
	}
}

func TestValidatePhoneFormats(t *testing.T) {
	tests := []struct {
		phone string
		valid bool
	}{
		{"081234567890", true},
		{"+6281234567890", true},
		{"6281234567890", true},
		{"0812-3456-7890", true}, // separators are stripped before checking
		{"0812 3456 7890", true},
		{"+62 812 3456 7890", true},
		{"12345", false},        // too short
		{"071234567890", false}, // Indonesian mobiles start 08
		{"bukan-nomor", false},
		{"08", false},
		{"+1234567890123", false}, // not an Indonesian number
	}

	for _, tt := range tests {
		t.Run(tt.phone, func(t *testing.T) {
			in := validSubmission()
			in.Phone = tt.phone

			_, err := validate(in)
			if tt.valid && err != nil {
				t.Errorf("phone %q was rejected: %v", tt.phone, err)
			}
			if !tt.valid && err == nil {
				t.Errorf("phone %q was accepted but should not be", tt.phone)
			}
		})
	}
}

func TestValidateEmailIsOptional(t *testing.T) {
	// Many Indonesian customers have no email and reach out by phone only.
	// Requiring one would cost real leads.
	in := validSubmission()
	in.Email = ""

	if _, err := validate(in); err != nil {
		t.Errorf("an empty email was rejected: %v", err)
	}

	in.Email = "bukan-email"
	if _, err := validate(in); err == nil {
		t.Error("a malformed email was accepted")
	}
}

func TestValidateNormalises(t *testing.T) {
	in := validSubmission()
	in.Name = "  Budi Santoso  "
	in.Email = "  BUDI@Example.COM "
	in.Phone = "+62 812-3456-7890"
	in.Message = "  Saya ingin memesan cuci AC.  "

	out, err := validate(in)
	if err != nil {
		t.Fatalf("validate: %v", err)
	}
	if out.Name != "Budi Santoso" {
		t.Errorf("Name = %q, want trimmed", out.Name)
	}
	if out.Email != "budi@example.com" {
		t.Errorf("Email = %q, want lowercased and trimmed", out.Email)
	}
	if out.Phone != "+6281234567890" {
		t.Errorf("Phone = %q, want separators stripped", out.Phone)
	}
	if out.Message != "Saya ingin memesan cuci AC." {
		t.Errorf("Message = %q, want trimmed", out.Message)
	}
}

func TestValidateDefaultsSource(t *testing.T) {
	in := validSubmission()
	in.Source = ""

	out, err := validate(in)
	if err != nil {
		t.Fatalf("validate: %v", err)
	}
	if out.Source != store.LeadSourceContact {
		t.Errorf("Source = %q, want the contact default", out.Source)
	}

	in.Source = store.LeadSource("bukan-sumber")
	if _, err := validate(in); err == nil {
		t.Error("an unknown source was accepted")
	}
}

func TestParseStatus(t *testing.T) {
	for _, s := range StatusValues() {
		if _, ok := ParseStatus(s); !ok {
			t.Errorf("ParseStatus(%q) failed for a published status value", s)
		}
	}
	if _, ok := ParseStatus("selesai"); ok {
		t.Error("ParseStatus accepted a value outside the schema enum")
	}
	if _, ok := ParseStatus(""); ok {
		t.Error("ParseStatus accepted an empty status")
	}
}

func TestOptionalUUID(t *testing.T) {
	if got := optionalUUID(""); got.Valid {
		t.Error("an empty id should produce NULL")
	}
	// A malformed id must degrade to NULL rather than fail the submission:
	// losing the product association is far better than losing the lead.
	if got := optionalUUID("not-a-uuid"); got.Valid {
		t.Error("a malformed id should produce NULL, not a value")
	}
	if got := optionalUUID("e092765c-ecb1-4f5d-8806-7ea20be9f396"); !got.Valid {
		t.Error("a valid uuid should be stored")
	}
}

package auth

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"strings"
	"testing"

	"golang.org/x/crypto/argon2"
)

func TestHashPasswordRoundTrip(t *testing.T) {
	const password = "kata-sandi-yang-panjang-123"

	hash, err := HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword: %v", err)
	}

	ok, err := VerifyPassword(password, hash)
	if err != nil {
		t.Fatalf("VerifyPassword: %v", err)
	}
	if !ok {
		t.Error("the correct password failed to verify")
	}
}

func TestVerifyPasswordRejectsWrongPassword(t *testing.T) {
	hash, err := HashPassword("kata-sandi-yang-benar")
	if err != nil {
		t.Fatalf("HashPassword: %v", err)
	}

	for _, wrong := range []string{
		"kata-sandi-yang-salah",
		"kata-sandi-yang-bena", // one character short
		"Kata-Sandi-Yang-Benar",
		"",
	} {
		ok, err := VerifyPassword(wrong, hash)
		if err != nil {
			t.Fatalf("VerifyPassword(%q): %v", wrong, err)
		}
		if ok {
			t.Errorf("wrong password %q verified successfully", wrong)
		}
	}
}

func TestHashPasswordIsSaltedPerCall(t *testing.T) {
	const password = "kata-sandi-yang-sama"

	first, err := HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword: %v", err)
	}
	second, err := HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword: %v", err)
	}

	// Identical passwords must not produce identical hashes, otherwise a
	// database leak would reveal which admins share a password.
	if first == second {
		t.Error("hashing the same password twice produced the same hash, salt is not random")
	}

	// Both must still verify.
	for i, h := range []string{first, second} {
		ok, err := VerifyPassword(password, h)
		if err != nil || !ok {
			t.Errorf("hash %d failed to verify: ok=%v err=%v", i, ok, err)
		}
	}
}

func TestHashPasswordFormat(t *testing.T) {
	hash, err := HashPassword("apa-saja")
	if err != nil {
		t.Fatalf("HashPassword: %v", err)
	}

	if !strings.HasPrefix(hash, "$argon2id$v=19$") {
		t.Errorf("hash does not use the PHC argon2id format: %q", hash)
	}
	// Parameters must be embedded so cost can be raised later without
	// invalidating existing passwords.
	if !strings.Contains(hash, "m=19456,t=2,p=") {
		t.Errorf("hash does not embed the expected cost parameters: %q", hash)
	}
	if n := strings.Count(hash, "$"); n != 5 {
		t.Errorf("hash has %d separators, want 5: %q", n, hash)
	}
}

func TestVerifyPasswordRejectsMalformedHash(t *testing.T) {
	tests := []struct {
		name string
		hash string
	}{
		{"empty", ""},
		{"not a hash", "hello"},
		{"wrong algorithm", "$bcrypt$v=19$m=19456,t=2,p=4$c2FsdA$aGFzaA"},
		{"too few segments", "$argon2id$v=19$m=19456,t=2,p=4"},
		{"malformed parameters", "$argon2id$v=19$m=abc,t=2,p=4$c2FsdA$aGFzaA"},
		{"invalid base64 salt", "$argon2id$v=19$m=19456,t=2,p=4$not!base64$aGFzaA"},
		{"unsupported version", "$argon2id$v=13$m=19456,t=2,p=4$c2FsdA$aGFzaA"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ok, err := VerifyPassword("apa-saja", tt.hash)
			if ok {
				t.Error("a malformed hash must never verify successfully")
			}
			if err == nil {
				t.Error("a malformed hash must report an error, not a silent false")
			}
		})
	}
}

func TestVerifyPasswordAcceptsHashWithDifferentCost(t *testing.T) {
	// A hash created under older, cheaper parameters must keep verifying: the
	// parameters are read from the hash itself, not from current defaults.
	// Otherwise raising the cost would lock every existing admin out.
	const password = "kata-sandi-lama"

	legacy := encodeArgon2id(t, password, argon2idParams{
		memoryKiB:   8 * 1024, // well below the current 19 MiB default
		iterations:  1,
		parallelism: 1,
		saltLength:  16,
		keyLength:   32,
	})

	ok, err := VerifyPassword(password, legacy)
	if err != nil {
		t.Fatalf("VerifyPassword against a lower-cost hash: %v", err)
	}
	if !ok {
		t.Error("a hash created with lower cost parameters failed to verify")
	}

	// It must still reject the wrong password at the old cost.
	ok, err = VerifyPassword("kata-sandi-salah", legacy)
	if err != nil {
		t.Fatalf("VerifyPassword: %v", err)
	}
	if ok {
		t.Error("wrong password verified against a lower-cost hash")
	}
}

// encodeArgon2id builds a PHC-format hash using explicit parameters, so tests
// can construct hashes that current defaults would never produce.
func encodeArgon2id(t *testing.T, password string, p argon2idParams) string {
	t.Helper()

	salt := make([]byte, p.saltLength)
	if _, err := rand.Read(salt); err != nil {
		t.Fatalf("generate salt: %v", err)
	}
	key := argon2.IDKey([]byte(password), salt, p.iterations, p.memoryKiB, p.parallelism, p.keyLength)

	return fmt.Sprintf("$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s",
		argon2.Version, p.memoryKiB, p.iterations, p.parallelism,
		base64.RawStdEncoding.EncodeToString(salt),
		base64.RawStdEncoding.EncodeToString(key),
	)
}

// Package auth implements admin password hashing and session tokens.
package auth

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"runtime"
	"strings"

	"golang.org/x/crypto/argon2"
)

// ErrInvalidHash is returned when a stored hash cannot be parsed, which means
// the record is corrupt rather than the password being wrong.
var ErrInvalidHash = errors.New("invalid password hash format")

// argon2idParams are the cost parameters for new hashes.
//
// These follow the OWASP recommendation for Argon2id: 19 MiB of memory with 2
// iterations. Memory cost is what makes GPU cracking expensive, so it is the
// parameter that matters most. The values are embedded in each stored hash, so
// raising them later does not invalidate existing passwords: old hashes keep
// verifying with their original parameters.
type argon2idParams struct {
	memoryKiB   uint32
	iterations  uint32
	parallelism uint8
	saltLength  uint32
	keyLength   uint32
}

func defaultParams() argon2idParams {
	parallelism := runtime.NumCPU()
	if parallelism > 4 {
		parallelism = 4
	}
	if parallelism < 1 {
		parallelism = 1
	}
	return argon2idParams{
		memoryKiB:   19 * 1024,
		iterations:  2,
		parallelism: uint8(parallelism),
		saltLength:  16,
		keyLength:   32,
	}
}

// HashPassword returns an encoded Argon2id hash in the standard PHC string
// format, which carries the parameters and salt alongside the digest.
func HashPassword(password string) (string, error) {
	p := defaultParams()

	salt := make([]byte, p.saltLength)
	if _, err := rand.Read(salt); err != nil {
		return "", fmt.Errorf("generate salt: %w", err)
	}

	key := argon2.IDKey([]byte(password), salt, p.iterations, p.memoryKiB, p.parallelism, p.keyLength)

	return fmt.Sprintf(
		"$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s",
		argon2.Version,
		p.memoryKiB,
		p.iterations,
		p.parallelism,
		base64.RawStdEncoding.EncodeToString(salt),
		base64.RawStdEncoding.EncodeToString(key),
	), nil
}

// VerifyPassword reports whether password matches the encoded hash.
//
// The comparison is constant time so that response timing cannot be used to
// discover how much of a guess was correct.
func VerifyPassword(password, encodedHash string) (bool, error) {
	p, salt, key, err := decodeHash(encodedHash)
	if err != nil {
		return false, err
	}

	candidate := argon2.IDKey([]byte(password), salt, p.iterations, p.memoryKiB, p.parallelism, uint32(len(key)))

	return subtle.ConstantTimeCompare(key, candidate) == 1, nil
}

func decodeHash(encoded string) (argon2idParams, []byte, []byte, error) {
	var p argon2idParams

	parts := strings.Split(encoded, "$")
	if len(parts) != 6 || parts[1] != "argon2id" {
		return p, nil, nil, ErrInvalidHash
	}

	var version int
	if _, err := fmt.Sscanf(parts[2], "v=%d", &version); err != nil {
		return p, nil, nil, ErrInvalidHash
	}
	if version != argon2.Version {
		return p, nil, nil, fmt.Errorf("%w: unsupported argon2 version %d", ErrInvalidHash, version)
	}

	if _, err := fmt.Sscanf(parts[3], "m=%d,t=%d,p=%d", &p.memoryKiB, &p.iterations, &p.parallelism); err != nil {
		return p, nil, nil, ErrInvalidHash
	}

	salt, err := base64.RawStdEncoding.Strict().DecodeString(parts[4])
	if err != nil {
		return p, nil, nil, ErrInvalidHash
	}
	key, err := base64.RawStdEncoding.Strict().DecodeString(parts[5])
	if err != nil {
		return p, nil, nil, ErrInvalidHash
	}

	p.saltLength = uint32(len(salt))
	p.keyLength = uint32(len(key))
	return p, salt, key, nil
}

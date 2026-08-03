-- name: GetAdminUserByEmail :one
SELECT * FROM admin_users WHERE email = $1;

-- name: GetAdminUserByID :one
SELECT * FROM admin_users WHERE id = $1;

-- name: CreateAdminUser :one
INSERT INTO admin_users (email, password_hash, name)
VALUES ($1, $2, $3)
RETURNING *;

-- name: UpdateAdminPassword :exec
UPDATE admin_users SET password_hash = $2 WHERE id = $1;

-- name: CountAdminUsers :one
SELECT count(*) FROM admin_users;

-- --------------------------------------------------------------------------
-- Sessions
-- --------------------------------------------------------------------------

-- name: CreateSession :one
INSERT INTO sessions (user_id, refresh_token_hash, user_agent, ip, expires_at)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetActiveSessionByTokenHash :one
-- Both conditions matter: an expired session and a revoked session must be
-- indistinguishable from a nonexistent one.
SELECT * FROM sessions
WHERE refresh_token_hash = $1
  AND revoked_at IS NULL
  AND expires_at > now();

-- name: RevokeSession :exec
UPDATE sessions SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL;

-- name: RevokeSessionByTokenHash :exec
UPDATE sessions SET revoked_at = now()
WHERE refresh_token_hash = $1 AND revoked_at IS NULL;

-- name: RevokeAllUserSessions :exec
UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL;

-- name: DeleteExpiredSessions :execrows
-- Housekeeping: rows that can no longer authenticate anything.
DELETE FROM sessions WHERE expires_at < now() - interval '30 days';

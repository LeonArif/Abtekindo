-- name: CreateLead :one
INSERT INTO leads (name, phone, email, message, source, product_id, service_id, ip, user_agent)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING *;

-- name: ListLeads :many
-- Admin inbox. A null status filter returns every lead.
SELECT
    sqlc.embed(leads),
    count(*) OVER () AS total_count
FROM leads
WHERE (sqlc.narg('status')::lead_status IS NULL OR status = sqlc.narg('status')::lead_status)
ORDER BY created_at DESC
LIMIT @result_limit OFFSET @result_offset;

-- name: GetLeadByID :one
SELECT * FROM leads WHERE id = $1;

-- name: UpdateLeadStatus :one
UPDATE leads SET status = $2 WHERE id = $1 RETURNING *;

-- name: CountLeadsByStatus :many
-- Powers the unread badge in the admin navigation.
SELECT status, count(*) AS total FROM leads GROUP BY status;

-- name: CountRecentLeadsByIP :one
-- Second layer of abuse control behind the in-memory rate limiter. The limiter
-- resets when the process restarts; this does not.
SELECT count(*) FROM leads
WHERE ip = @ip AND created_at > now() - @within::interval;

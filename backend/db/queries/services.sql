-- name: ListPublishedServices :many
SELECT * FROM services WHERE published ORDER BY sort_order, name;

-- name: GetPublishedServiceBySlug :one
SELECT * FROM services WHERE slug = $1 AND published;

-- name: ListServiceRates :many
-- Batched for a set of services, then grouped in Go.
SELECT * FROM service_rates
WHERE service_id = ANY (@service_ids::uuid[])
ORDER BY service_id, sort_order;

-- name: ListPublishedServiceSlugs :many
SELECT slug, updated_at FROM services WHERE published ORDER BY slug;

-- --------------------------------------------------------------------------
-- Admin
-- --------------------------------------------------------------------------

-- name: ListAllServices :many
SELECT * FROM services ORDER BY sort_order, name;

-- name: GetServiceByID :one
SELECT * FROM services WHERE id = $1;

-- name: FindServiceBySlug :one
-- Ignores the published flag, for the seeder and slug-uniqueness checks.
SELECT * FROM services WHERE slug = $1;

-- name: CreateService :one
INSERT INTO services (slug, name, summary, description, bullets, icon, published, sort_order)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: UpdateService :one
UPDATE services SET
    slug        = $2,
    name        = $3,
    summary     = $4,
    description = $5,
    bullets     = $6,
    icon        = $7,
    published   = $8,
    sort_order  = $9
WHERE id = $1
RETURNING *;

-- name: DeleteService :execrows
DELETE FROM services WHERE id = $1;

-- name: DeleteServiceRates :exec
DELETE FROM service_rates WHERE service_id = $1;

-- name: AddServiceRate :one
INSERT INTO service_rates (service_id, label, unit, price_from, note, sort_order)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

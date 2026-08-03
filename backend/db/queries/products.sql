-- name: ListPublishedProducts :many
-- Catalog listing with optional multi-select facets.
--
-- An empty filter array means "no filter on this facet", which lets one query
-- serve every combination the catalog UI can produce. The window count returns
-- the unpaginated total alongside the page, avoiding a second round trip.
SELECT
    sqlc.embed(products),
    count(*) OVER () AS total_count
FROM products
WHERE published
  AND (cardinality(@brands::brand[]) = 0 OR brand = ANY (@brands::brand[]))
  AND (cardinality(@types::product_type[]) = 0 OR type = ANY (@types::product_type[]))
  AND (cardinality(@capacities::numeric[]) = 0 OR capacity_pk = ANY (@capacities::numeric[]))
ORDER BY sort_order, created_at DESC
LIMIT @result_limit OFFSET @result_offset;

-- name: GetPublishedProductBySlug :one
SELECT * FROM products WHERE slug = $1 AND published;

-- name: ListFeaturedProducts :many
SELECT * FROM products
WHERE published AND featured
ORDER BY sort_order, created_at DESC
LIMIT $1;

-- name: ListRelatedProducts :many
-- Products of the same type, excluding the one being viewed. Same brand first,
-- so a Daikin page suggests other Daikin units before other brands.
SELECT * FROM products
WHERE published
  AND type = @type
  AND id <> @exclude_id
ORDER BY (brand = @brand) DESC, sort_order, created_at DESC
LIMIT @result_limit;

-- name: ListPublishedProductSlugs :many
-- Drives sitemap generation and static path generation on the frontend.
SELECT slug, updated_at FROM products WHERE published ORDER BY slug;

-- name: ListProductImages :many
-- Loaded in one batch for a page of products, then grouped in Go. Keeps the
-- listing query free of JSON aggregation.
SELECT * FROM product_images
WHERE product_id = ANY (@product_ids::uuid[])
ORDER BY product_id, sort_order;

-- --------------------------------------------------------------------------
-- Admin
-- --------------------------------------------------------------------------

-- name: ListAllProducts :many
-- Admin listing: includes unpublished rows.
SELECT
    sqlc.embed(products),
    count(*) OVER () AS total_count
FROM products
ORDER BY sort_order, created_at DESC
LIMIT @result_limit OFFSET @result_offset;

-- name: GetProductByID :one
SELECT * FROM products WHERE id = $1;

-- name: FindProductBySlug :one
-- Ignores the published flag. Used by the seeder and by slug-uniqueness checks
-- on admin writes, both of which must see unpublished rows.
SELECT * FROM products WHERE slug = $1;

-- name: CreateProduct :one
INSERT INTO products (
    slug, name, brand, type, capacity_pk, btu, starting_price, inverter,
    refrigerant, power_watt, room_size, description, features, featured,
    published, sort_order
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
)
RETURNING *;

-- name: UpdateProduct :one
UPDATE products SET
    slug           = $2,
    name           = $3,
    brand          = $4,
    type           = $5,
    capacity_pk    = $6,
    btu            = $7,
    starting_price = $8,
    inverter       = $9,
    refrigerant    = $10,
    power_watt     = $11,
    room_size      = $12,
    description    = $13,
    features       = $14,
    featured       = $15,
    published      = $16,
    sort_order     = $17
WHERE id = $1
RETURNING *;

-- name: DeleteProduct :execrows
DELETE FROM products WHERE id = $1;

-- name: ReplaceProductImages :exec
DELETE FROM product_images WHERE product_id = $1;

-- name: AddProductImage :one
INSERT INTO product_images (product_id, object_key, alt, sort_order)
VALUES ($1, $2, $3, $4)
RETURNING *;

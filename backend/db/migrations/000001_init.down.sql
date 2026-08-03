-- Reverses 000001_init.up.sql. Dropped in dependency order.

DROP TABLE IF EXISTS leads;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS admin_users;
DROP TABLE IF EXISTS service_rates;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS products;

DROP FUNCTION IF EXISTS set_updated_at();

DROP TYPE IF EXISTS lead_status;
DROP TYPE IF EXISTS lead_source;
DROP TYPE IF EXISTS product_type;
DROP TYPE IF EXISTS brand;

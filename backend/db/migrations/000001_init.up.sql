-- Initial schema for the Abtekindo catalog CMS and lead inbox.

-- Enumerated domains are modelled as Postgres enums so an invalid brand or
-- status is rejected by the database rather than only by application code.
-- Adding a value is a deliberate migration, which is appropriate: a new brand
-- also needs a logo and UI copy, so it is a deploy rather than a data entry.
CREATE TYPE brand AS ENUM ('gree', 'daikin', 'panasonic', 'midea');
CREATE TYPE product_type AS ENUM (
    'split-wall',
    'cassette',
    'floor-standing',
    'ceiling-suspended',
    'portable'
);
CREATE TYPE lead_source AS ENUM ('contact', 'service', 'product');
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'closed');

-- Keeps updated_at honest. Relying on every query to set it would eventually
-- miss one, and a stale timestamp is worse than none.
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------------------------------------
-- Catalog
-- --------------------------------------------------------------------------

CREATE TABLE products (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug           text NOT NULL UNIQUE,
    name           text NOT NULL,
    brand          brand NOT NULL,
    type           product_type NOT NULL,
    capacity_pk    numeric(4, 2) NOT NULL,
    btu            integer NOT NULL,
    -- Rupiah has no practical minor unit, so prices are whole rupiah in a
    -- bigint. No floating point is used anywhere near money.
    starting_price bigint NOT NULL,
    inverter       boolean NOT NULL DEFAULT false,
    refrigerant    text NOT NULL DEFAULT '',
    power_watt     integer NOT NULL,
    room_size      text NOT NULL DEFAULT '',
    description    text NOT NULL DEFAULT '',
    features       text[] NOT NULL DEFAULT '{}',
    featured       boolean NOT NULL DEFAULT false,
    published      boolean NOT NULL DEFAULT true,
    sort_order     integer NOT NULL DEFAULT 0,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT products_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    CONSTRAINT products_name_not_blank CHECK (length(btrim(name)) > 0),
    CONSTRAINT products_starting_price_positive CHECK (starting_price > 0),
    CONSTRAINT products_capacity_positive CHECK (capacity_pk > 0),
    CONSTRAINT products_btu_positive CHECK (btu > 0),
    CONSTRAINT products_power_watt_positive CHECK (power_watt > 0)
);

-- Catalog listings always filter on published and order by sort_order, so the
-- composite index covers the common path; the partial indexes serve the brand
-- and type facets.
CREATE INDEX products_listing_idx ON products (published, sort_order, created_at DESC);
CREATE INDEX products_brand_idx ON products (brand) WHERE published;
CREATE INDEX products_type_idx ON products (type) WHERE published;
CREATE INDEX products_featured_idx ON products (featured) WHERE published AND featured;

CREATE TRIGGER products_set_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE product_images (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    -- Object key within the R2 bucket. The public URL is composed at read time
    -- from R2_PUBLIC_BASE_URL so the CDN domain can change without a data migration.
    object_key text NOT NULL,
    alt        text NOT NULL DEFAULT '',
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT product_images_object_key_not_blank CHECK (length(btrim(object_key)) > 0)
);

CREATE INDEX product_images_product_idx ON product_images (product_id, sort_order);

-- --------------------------------------------------------------------------
-- Services and published rates
-- --------------------------------------------------------------------------

CREATE TABLE services (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        text NOT NULL UNIQUE,
    name        text NOT NULL,
    summary     text NOT NULL DEFAULT '',
    description text NOT NULL DEFAULT '',
    bullets     text[] NOT NULL DEFAULT '{}',
    icon        text NOT NULL DEFAULT '',
    published   boolean NOT NULL DEFAULT true,
    sort_order  integer NOT NULL DEFAULT 0,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT services_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    CONSTRAINT services_name_not_blank CHECK (length(btrim(name)) > 0)
);

CREATE INDEX services_listing_idx ON services (published, sort_order);

CREATE TRIGGER services_set_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE service_rates (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id uuid NOT NULL REFERENCES services (id) ON DELETE CASCADE,
    label      text NOT NULL,
    unit       text NOT NULL DEFAULT 'unit',
    price_from bigint NOT NULL,
    note       text NOT NULL DEFAULT '',
    sort_order integer NOT NULL DEFAULT 0,

    CONSTRAINT service_rates_label_not_blank CHECK (length(btrim(label)) > 0),
    CONSTRAINT service_rates_price_positive CHECK (price_from > 0)
);

CREATE INDEX service_rates_service_idx ON service_rates (service_id, sort_order);

-- --------------------------------------------------------------------------
-- Admin authentication
-- --------------------------------------------------------------------------

CREATE TABLE admin_users (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email         text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    name          text NOT NULL,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),

    -- Emails are stored lowercase so the UNIQUE constraint is genuinely
    -- case-insensitive without needing the citext extension.
    CONSTRAINT admin_users_email_lowercase CHECK (email = lower(email)),
    CONSTRAINT admin_users_email_format CHECK (position('@' IN email) > 1),
    CONSTRAINT admin_users_name_not_blank CHECK (length(btrim(name)) > 0)
);

CREATE TABLE sessions (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            uuid NOT NULL REFERENCES admin_users (id) ON DELETE CASCADE,
    -- Only the SHA-256 of the refresh token is stored. A database leak
    -- therefore does not hand over usable sessions.
    refresh_token_hash bytea NOT NULL UNIQUE,
    user_agent         text NOT NULL DEFAULT '',
    ip                 inet,
    expires_at         timestamptz NOT NULL,
    revoked_at         timestamptz,
    created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sessions_user_idx ON sessions (user_id);
CREATE INDEX sessions_active_idx ON sessions (expires_at) WHERE revoked_at IS NULL;

-- --------------------------------------------------------------------------
-- Leads
-- --------------------------------------------------------------------------

CREATE TABLE leads (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name       text NOT NULL,
    phone      text NOT NULL,
    email      text NOT NULL DEFAULT '',
    message    text NOT NULL,
    source     lead_source NOT NULL DEFAULT 'contact',
    -- A deleted product must never take its enquiries with it, so these are
    -- nulled rather than cascaded.
    product_id uuid REFERENCES products (id) ON DELETE SET NULL,
    service_id uuid REFERENCES services (id) ON DELETE SET NULL,
    status     lead_status NOT NULL DEFAULT 'new',
    ip         inet,
    user_agent text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT leads_name_not_blank CHECK (length(btrim(name)) > 0),
    CONSTRAINT leads_phone_not_blank CHECK (length(btrim(phone)) > 0),
    CONSTRAINT leads_message_not_blank CHECK (length(btrim(message)) > 0)
);

CREATE INDEX leads_status_idx ON leads (status, created_at DESC);
CREATE INDEX leads_created_idx ON leads (created_at DESC);

CREATE TRIGGER leads_set_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER admin_users_set_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

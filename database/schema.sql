-- e-list base database schema (PostgreSQL)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('user', 'admin');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attribute_value_type') THEN
    CREATE TYPE attribute_value_type AS ENUM ('text', 'number', 'boolean', 'option');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attribute_filter_type') THEN
    CREATE TYPE attribute_filter_type AS ENUM ('select', 'range', 'boolean', 'text');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'offer_availability') THEN
    CREATE TYPE offer_availability AS ENUM ('in_stock', 'out_of_stock', 'preorder', 'unknown');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'import_source_type') THEN
    CREATE TYPE import_source_type AS ENUM ('manual', 'parser', 'api', 'feed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'import_run_status') THEN
    CREATE TYPE import_run_status AS ENUM ('pending', 'running', 'success', 'partial_success', 'failed');
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  website_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE attribute_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (category_id, slug)
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  model_code TEXT,
  sku TEXT,
  description TEXT,
  image_url TEXT,
  released_at DATE,
  search_text TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (brand_id, model_code)
);

CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  group_id UUID REFERENCES attribute_groups(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  value_type attribute_value_type NOT NULL,
  filter_type attribute_filter_type NOT NULL DEFAULT 'select',
  unit TEXT,
  is_filterable BOOLEAN NOT NULL DEFAULT TRUE,
  is_comparable BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (category_id, slug)
);

CREATE TABLE attribute_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_id UUID NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  slug TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (attribute_id, slug)
);

CREATE TABLE product_attribute_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  attribute_id UUID NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, attribute_id),
  CHECK (jsonb_typeof(value) IN ('string', 'number', 'boolean', 'object', 'array'))
);

CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  website_url TEXT,
  rating NUMERIC(3,2),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE import_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  source_type import_source_type NOT NULL DEFAULT 'manual',
  base_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE import_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES import_sources(id) ON DELETE CASCADE,
  status import_run_status NOT NULL DEFAULT 'pending',
  items_processed INT NOT NULL DEFAULT 0,
  items_created INT NOT NULL DEFAULT 0,
  items_updated INT NOT NULL DEFAULT 0,
  items_failed INT NOT NULL DEFAULT 0,
  error_message TEXT,
  payload JSONB,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  source_id UUID REFERENCES import_sources(id) ON DELETE SET NULL,
  external_offer_id TEXT,
  external_product_id TEXT,
  product_url TEXT,
  availability offer_availability NOT NULL DEFAULT 'unknown',
  price NUMERIC(14,2) NOT NULL CHECK (price >= 0),
  old_price NUMERIC(14,2) CHECK (old_price IS NULL OR old_price >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_seen_at TIMESTAMPTZ,
  updated_from_source_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE NULLS NOT DISTINCT (shop_id, product_id, external_offer_id)
);

CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  price NUMERIC(14,2) NOT NULL CHECK (price >= 0),
  old_price NUMERIC(14,2) CHECK (old_price IS NULL OR old_price >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE favorites (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, product_id)
);

CREATE TABLE compare_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name TEXT NOT NULL DEFAULT 'default',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, category_id, name)
);

CREATE TABLE compare_list_items (
  compare_list_id UUID NOT NULL REFERENCES compare_lists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (compare_list_id, product_id)
);

CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_attribute_groups_category_id ON attribute_groups(category_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_products_active_category ON products(category_id, is_active);
CREATE INDEX idx_attributes_category_id ON attributes(category_id);
CREATE INDEX idx_attributes_group_id ON attributes(group_id);
CREATE INDEX idx_attribute_options_attribute_id ON attribute_options(attribute_id);
CREATE INDEX idx_pav_product_id ON product_attribute_values(product_id);
CREATE INDEX idx_pav_attribute_id ON product_attribute_values(attribute_id);
CREATE INDEX idx_pav_value_gin ON product_attribute_values USING GIN (value);
CREATE INDEX idx_offers_product_id ON offers(product_id);
CREATE INDEX idx_offers_shop_id ON offers(shop_id);
CREATE INDEX idx_offers_source_id ON offers(source_id);
CREATE INDEX idx_offers_price ON offers(price);
CREATE INDEX idx_offers_last_seen_at ON offers(last_seen_at);
CREATE INDEX idx_price_history_offer_id ON price_history(offer_id);
CREATE INDEX idx_price_history_captured_at ON price_history(captured_at);
CREATE INDEX idx_favorites_product_id ON favorites(product_id);
CREATE INDEX idx_compare_lists_user_id ON compare_lists(user_id);
CREATE INDEX idx_compare_list_items_product_id ON compare_list_items(product_id);
CREATE INDEX idx_import_runs_source_id ON import_runs(source_id);
CREATE INDEX idx_import_runs_status ON import_runs(status);

CREATE INDEX idx_products_name_tsv ON products USING GIN (to_tsvector('simple', name));
CREATE INDEX idx_products_search_tsv ON products USING GIN (to_tsvector('simple', COALESCE(search_text, '')));

CREATE TRIGGER trg_users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_categories_set_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_brands_set_updated_at
BEFORE UPDATE ON brands
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_attribute_groups_set_updated_at
BEFORE UPDATE ON attribute_groups
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_products_set_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_attributes_set_updated_at
BEFORE UPDATE ON attributes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_attribute_options_set_updated_at
BEFORE UPDATE ON attribute_options
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_product_attribute_values_set_updated_at
BEFORE UPDATE ON product_attribute_values
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_shops_set_updated_at
BEFORE UPDATE ON shops
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_import_sources_set_updated_at
BEFORE UPDATE ON import_sources
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_offers_set_updated_at
BEFORE UPDATE ON offers
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_compare_lists_set_updated_at
BEFORE UPDATE ON compare_lists
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

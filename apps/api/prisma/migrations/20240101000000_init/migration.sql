-- Create required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Tables
CREATE TABLE "titles" (
    "isbn13" VARCHAR(13) PRIMARY KEY,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "authors" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "publisher" TEXT,
    "pub_date" TIMESTAMP(3),
    "binding" TEXT,
    "msrp_cents" INTEGER,
    "subjects" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "edition" TEXT,
    "language" TEXT,
    "dimensions" TEXT,
    "weight" TEXT
);

CREATE TABLE "items" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "isbn13" VARCHAR(13) NOT NULL,
    "condition" TEXT NOT NULL,
    "signed" BOOLEAN NOT NULL,
    "first_edition" BOOLEAN NOT NULL,
    "notes" TEXT,
    "taxable" BOOLEAN NOT NULL,
    "sku_override" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE TABLE "locations" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "store_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL
);

CREATE TABLE "inventory" (
    "item_id" UUID NOT NULL,
    "store_id" TEXT NOT NULL,
    "qty_on_hand" INTEGER NOT NULL,
    "qty_reserved" INTEGER NOT NULL,
    "bin" TEXT,
    PRIMARY KEY ("item_id", "store_id")
);

CREATE TABLE "stock_movements" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "item_id" UUID NOT NULL,
    "store_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "ref_type" TEXT,
    "ref_id" TEXT,
    "user_id" TEXT,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE TABLE "customers" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "marketing_opt_in" BOOLEAN NOT NULL,
    "store_credit_cents" INTEGER NOT NULL DEFAULT 0,
    "loyalty_points" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE TABLE "orders" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "store_id" TEXT NOT NULL,
    "customer_id" UUID,
    "status" TEXT NOT NULL,
    "subtotal_cents" INTEGER NOT NULL,
    "tax_cents" INTEGER NOT NULL,
    "discount_cents" INTEGER NOT NULL,
    "total_cents" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE TABLE "order_lines" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "qty" INTEGER NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "discount_cents" INTEGER NOT NULL,
    "tax_cents" INTEGER NOT NULL
);

CREATE TABLE "payments" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "method" TEXT NOT NULL,
    "external_txn_id" TEXT,
    "amount_cents" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE TABLE "vendors" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "account_num" TEXT,
    "edi_qualifier" TEXT,
    "edi_id" TEXT,
    "payment_terms" TEXT,
    "contact" TEXT
);

CREATE TABLE "purchase_orders" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "vendor_id" UUID NOT NULL,
    "store_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE TABLE "po_lines" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "po_id" UUID NOT NULL,
    "isbn13" VARCHAR(13) NOT NULL,
    "ordered_qty" INTEGER NOT NULL,
    "received_qty" INTEGER NOT NULL DEFAULT 0,
    "cost_cents" INTEGER NOT NULL
);

CREATE TABLE "receipts" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "po_id" UUID NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "received_by" TEXT NOT NULL
);

CREATE TABLE "reorder_rules" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "item_id" UUID NOT NULL,
    "store_id" TEXT NOT NULL,
    "min" INTEGER NOT NULL,
    "max" INTEGER NOT NULL,
    "lead_time_days" INTEGER NOT NULL,
    CONSTRAINT "reorder_rules_item_store_unique" UNIQUE ("item_id", "store_id")
);

CREATE TABLE "channels" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "kind" TEXT NOT NULL,
    "credentials_ref" TEXT,
    "enabled" BOOLEAN NOT NULL
);

CREATE TABLE "listings" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "item_id" UUID NOT NULL,
    "channel_id" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "state" TEXT NOT NULL,
    "last_synced_at" TIMESTAMP(3),
    "error_message" TEXT
);

CREATE TABLE "requests" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "customer_id" UUID NOT NULL,
    "isbn13" VARCHAR(13),
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE TABLE "consignors" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "split_percent" INTEGER NOT NULL,
    "settlement_terms" TEXT
);

CREATE TABLE "consignor_items" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "consignor_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "split_percent_override" INTEGER
);

-- Foreign keys
ALTER TABLE "items"
  ADD CONSTRAINT "items_isbn13_fkey"
  FOREIGN KEY ("isbn13") REFERENCES "titles"("isbn13") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "inventory"
  ADD CONSTRAINT "inventory_item_id_fkey"
  FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "stock_movements"
  ADD CONSTRAINT "stock_movements_item_id_fkey"
  FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_customer_id_fkey"
  FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "order_lines"
  ADD CONSTRAINT "order_lines_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_lines"
  ADD CONSTRAINT "order_lines_item_id_fkey"
  FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "payments"
  ADD CONSTRAINT "payments_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "purchase_orders"
  ADD CONSTRAINT "purchase_orders_vendor_id_fkey"
  FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "po_lines"
  ADD CONSTRAINT "po_lines_po_id_fkey"
  FOREIGN KEY ("po_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "po_lines"
  ADD CONSTRAINT "po_lines_isbn13_fkey"
  FOREIGN KEY ("isbn13") REFERENCES "titles"("isbn13") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "receipts"
  ADD CONSTRAINT "receipts_po_id_fkey"
  FOREIGN KEY ("po_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reorder_rules"
  ADD CONSTRAINT "reorder_rules_item_id_fkey"
  FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "listings"
  ADD CONSTRAINT "listings_item_id_fkey"
  FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "listings"
  ADD CONSTRAINT "listings_channel_id_fkey"
  FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "requests"
  ADD CONSTRAINT "requests_customer_id_fkey"
  FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "requests"
  ADD CONSTRAINT "requests_isbn13_fkey"
  FOREIGN KEY ("isbn13") REFERENCES "titles"("isbn13") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "consignor_items"
  ADD CONSTRAINT "consignor_items_consignor_id_fkey"
  FOREIGN KEY ("consignor_id") REFERENCES "consignors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "consignor_items"
  ADD CONSTRAINT "consignor_items_item_id_fkey"
  FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "titles_title_idx" ON "titles" ("title");
CREATE INDEX "items_isbn13_idx" ON "items" ("isbn13");
CREATE INDEX "orders_customer_idx" ON "orders" ("customer_id");
CREATE INDEX "order_lines_order_idx" ON "order_lines" ("order_id");
CREATE INDEX "order_lines_item_idx" ON "order_lines" ("item_id");
CREATE INDEX "payments_order_idx" ON "payments" ("order_id");
CREATE INDEX "purchase_orders_vendor_idx" ON "purchase_orders" ("vendor_id");
CREATE INDEX "listings_channel_idx" ON "listings" ("channel_id");
CREATE INDEX "listings_item_idx" ON "listings" ("item_id");
CREATE INDEX "requests_customer_idx" ON "requests" ("customer_id");

-- Search optimisations
CREATE INDEX "titles_title_trgm_idx" ON "titles" USING GIN ("title" gin_trgm_ops);
CREATE INDEX "titles_authors_trgm_idx" ON "titles" USING GIN ((array_to_string("authors", ' ')) gin_trgm_ops);

CREATE MATERIALIZED VIEW "title_search" AS
SELECT
  t."isbn13",
  t."title",
  t."subtitle",
  t."authors",
  array_to_string(t."authors", ' ') AS authors_text,
  setweight(to_tsvector('simple', coalesce(t."title", '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(t."subtitle", '')), 'B') ||
  setweight(to_tsvector('simple', array_to_string(t."authors", ' ')), 'B')
  AS document
FROM "titles" t;

CREATE UNIQUE INDEX "title_search_isbn13_idx" ON "title_search" ("isbn13");
CREATE INDEX "title_search_document_idx" ON "title_search" USING GIN (document);

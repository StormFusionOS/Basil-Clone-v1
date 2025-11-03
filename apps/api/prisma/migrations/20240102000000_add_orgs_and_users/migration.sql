-- Create organization, store, and user tables
CREATE TABLE "organizations" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE TABLE "stores" (
    "id" VARCHAR(64) PRIMARY KEY,
    "org_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE TABLE "users" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL,
    "store_id" VARCHAR(64),
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX "users_email_key" ON "users" ("email");

ALTER TABLE "locations"
  ALTER COLUMN "store_id" TYPE VARCHAR(64) USING "store_id"::VARCHAR(64);

ALTER TABLE "inventory"
  ALTER COLUMN "store_id" TYPE VARCHAR(64) USING "store_id"::VARCHAR(64);

ALTER TABLE "stock_movements"
  ALTER COLUMN "store_id" TYPE VARCHAR(64) USING "store_id"::VARCHAR(64);

ALTER TABLE "orders"
  ALTER COLUMN "store_id" TYPE VARCHAR(64) USING "store_id"::VARCHAR(64);

ALTER TABLE "purchase_orders"
  ALTER COLUMN "store_id" TYPE VARCHAR(64) USING "store_id"::VARCHAR(64);

ALTER TABLE "reorder_rules"
  ALTER COLUMN "store_id" TYPE VARCHAR(64) USING "store_id"::VARCHAR(64);

ALTER TABLE "stores"
  ADD CONSTRAINT "stores_org_id_fkey"
  FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "users"
  ADD CONSTRAINT "users_org_id_fkey"
  FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "users"
  ADD CONSTRAINT "users_store_id_fkey"
  FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "locations"
  ADD CONSTRAINT "locations_store_id_fkey"
  FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "inventory"
  ADD CONSTRAINT "inventory_store_id_fkey"
  FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "stock_movements"
  ADD CONSTRAINT "stock_movements_store_id_fkey"
  FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_store_id_fkey"
  FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "purchase_orders"
  ADD CONSTRAINT "purchase_orders_store_id_fkey"
  FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reorder_rules"
  ADD CONSTRAINT "reorder_rules_store_id_fkey"
  FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

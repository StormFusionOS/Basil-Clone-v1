ALTER TABLE "orders"
  ADD COLUMN "store_credit_applied_cents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "loyalty_points_awarded" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "store_credit_issuances" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "customer_id" UUID NOT NULL,
  "amount_cents" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "issued_by" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "store_credit_issuances_customer_id_fkey" FOREIGN KEY ("customer_id")
    REFERENCES "customers"("id") ON DELETE CASCADE
);

CREATE INDEX "store_credit_issuances_customer_idx" ON "store_credit_issuances" ("customer_id");

CREATE TABLE "store_credit_redemptions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "customer_id" UUID NOT NULL,
  "order_id" UUID NOT NULL,
  "amount_cents" INTEGER NOT NULL,
  "loyalty_points_used" INTEGER NOT NULL DEFAULT 0,
  "redeemed_by" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "store_credit_redemptions_customer_id_fkey" FOREIGN KEY ("customer_id")
    REFERENCES "customers"("id") ON DELETE CASCADE,
  CONSTRAINT "store_credit_redemptions_order_id_fkey" FOREIGN KEY ("order_id")
    REFERENCES "orders"("id") ON DELETE CASCADE
);

CREATE INDEX "store_credit_redemptions_customer_idx" ON "store_credit_redemptions" ("customer_id");
CREATE INDEX "store_credit_redemptions_order_idx" ON "store_credit_redemptions" ("order_id");

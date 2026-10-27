ALTER TABLE "menu_items"
ADD COLUMN "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 8,
ADD COLUMN "surchargeEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "surchargeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE "order_items"
ADD COLUMN "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 8,
ADD COLUMN "surchargeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE "menu_items"
ADD CONSTRAINT "menu_items_taxRate_range" CHECK ("taxRate" >= 0 AND "taxRate" <= 100),
ADD CONSTRAINT "menu_items_surchargeAmount_nonnegative" CHECK ("surchargeAmount" >= 0);

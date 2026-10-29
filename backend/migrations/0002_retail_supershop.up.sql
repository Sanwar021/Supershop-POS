-- NovaMart Super Shop POS - Schema Migration v2.0
-- Converts restaurant data model to multi-branch Retail Super Shop and Grocery Management

-- 1. Enhance menu_items into full retail products
ALTER TABLE menu_items
    ADD COLUMN IF NOT EXISTS brand TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'pcs',
    ADD COLUMN IF NOT EXISTS package_size TEXT DEFAULT '1 pc',
    ADD COLUMN IF NOT EXISTS regular_price_minor BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS cost_price_minor BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_weighted BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_hot_deal BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_popular BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_new_arrival BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS track_stock BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS stock_quantity NUMERIC(14,3) NOT NULL DEFAULT 100,
    ADD COLUMN IF NOT EXISTS reorder_level NUMERIC(14,3) NOT NULL DEFAULT 10,
    ADD COLUMN IF NOT EXISTS barcode TEXT,
    ADD COLUMN IF NOT EXISTS shelf_location TEXT,
    ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'General';

-- Populate regular_price_minor if 0
UPDATE menu_items SET regular_price_minor = base_price_minor WHERE regular_price_minor = 0;

-- Indexes for lightning fast barcode and name search
CREATE INDEX IF NOT EXISTS idx_menu_items_barcode ON menu_items(barcode);
CREATE INDEX IF NOT EXISTS idx_menu_items_brand ON menu_items(brand);
CREATE INDEX IF NOT EXISTS idx_menu_items_department ON menu_items(department);

-- 2. Secondary barcodes table (support multiple barcodes per product)
CREATE TABLE IF NOT EXISTS product_barcodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    barcode TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (restaurant_id, barcode)
);
CREATE INDEX IF NOT EXISTS idx_product_barcodes_lookup ON product_barcodes(barcode);

-- 3. Product Batches and Expiry Tracking
CREATE TABLE IF NOT EXISTS product_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    batch_no TEXT NOT NULL,
    mfg_date DATE,
    exp_date DATE NOT NULL,
    quantity NUMERIC(14,3) NOT NULL DEFAULT 0,
    cost_price_minor BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_product_batches_exp ON product_batches(branch_id, product_id, exp_date);

-- 4. Promotions and Coupons Engine
CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'percentage', -- percentage, fixed, bogo
    discount_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
    discount_minor BIGINT NOT NULL DEFAULT 0,
    min_spend_minor BIGINT NOT NULL DEFAULT 0,
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    usage_limit INT NOT NULL DEFAULT 1000,
    used_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (restaurant_id, code)
);

-- 5. Delivery & Dispatch Fulfilment
CREATE TABLE IF NOT EXISTS retail_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    recipient_name TEXT NOT NULL,
    recipient_phone TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    delivery_zone TEXT,
    delivery_fee_minor BIGINT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ordered', -- ordered, picking, packed, out_for_delivery, delivered, cancelled
    staff_id UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_deliveries_order ON retail_deliveries(order_id);

-- 6. Stock Transfers between Retail Outlets
CREATE TABLE IF NOT EXISTS stock_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    from_branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    to_branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, in_transit, completed, cancelled
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_transfer_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    qty NUMERIC(14,3) NOT NULL,
    received_qty NUMERIC(14,3) NOT NULL DEFAULT 0
);

-- 7. Stock Adjustments (Damaged, Expired, Inventory audit corrections)
CREATE TABLE IF NOT EXISTS stock_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- damage, expiry, recount, shrinkage, return_restock
    qty_change NUMERIC(14,3) NOT NULL,
    reason TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Customer Loyalty Points
ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS loyalty_points INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS customer_group TEXT NOT NULL DEFAULT 'Regular',
    ADD COLUMN IF NOT EXISTS email TEXT;

-- 9. Update existing restaurant branding to NovaMart Super Shop
UPDATE restaurants
SET name = 'NovaMart Super Shop',
    slug = 'novamart',
    address = 'House 14, Road 11, Banani, Dhaka-1213, Bangladesh',
    phone = '+880 1711-234567',
    currency = 'BDT',
    timezone = 'Asia/Dhaka',
    tax_no = 'BIN-0023948571029'
WHERE slug = 'the-royal-feast' OR name = 'The Royal Feast' OR name LIKE '%Restaurant%';

-- Update branches to Super Shop outlets
UPDATE branches
SET name = 'NovaMart - Banani Flagship Outlet',
    address = 'Road 11, Block D, Banani, Dhaka'
WHERE name LIKE '%Dhanmondi%' OR name LIKE '%Main%';

UPDATE branches
SET name = 'NovaMart - Gulshan 2 Outlet',
    address = 'Avenue Road, Gulshan 2, Dhaka'
WHERE name LIKE '%Gulshan%' OR name LIKE '%Branch 2%';

-- Migrate order types
UPDATE orders SET type = 'walk_in' WHERE type = 'dine_in';
UPDATE orders SET type = 'pickup' WHERE type = 'takeaway';


-- RestoFlow POS - PostgreSQL Schema v1.0
-- Money in minor units (BIGINT), Quantities in NUMERIC(14,3), UUID keys

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Platform & Multi-tenancy
CREATE TABLE IF NOT EXISTS restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    phone TEXT,
    email TEXT,
    address TEXT,
    logo_url TEXT,
    currency TEXT NOT NULL DEFAULT 'BDT',
    timezone TEXT NOT NULL DEFAULT 'Asia/Dhaka',
    language TEXT NOT NULL DEFAULT 'en',
    tax_no TEXT,
    status TEXT NOT NULL DEFAULT 'active', -- active, past_due, suspended
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    invoice_prefix TEXT NOT NULL DEFAULT 'INV-',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_branches_restaurant ON branches(restaurant_id);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE, -- NULL for super admin
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    password_hash TEXT NOT NULL,
    pin_hash TEXT,
    role TEXT NOT NULL, -- super_admin, owner, manager, cashier, waiter, kitchen
    discount_limit_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_restaurant ON users(restaurant_id);

CREATE TABLE IF NOT EXISTS user_branches (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, branch_id)
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    device TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);

CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    price_minor BIGINT NOT NULL DEFAULT 0,
    interval TEXT NOT NULL DEFAULT 'monthly',
    max_branches INT NOT NULL DEFAULT 1,
    max_users INT NOT NULL DEFAULT 5,
    features JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id),
    status TEXT NOT NULL DEFAULT 'trial', -- trial, active, past_due, suspended, cancelled
    trial_ends_at TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    grace_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_restaurant ON subscriptions(restaurant_id);

CREATE TABLE IF NOT EXISTS subscription_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    amount_minor BIGINT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    method TEXT,
    reference TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (restaurant_id, key)
);

CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    label TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    requires_reference BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (restaurant_id, code)
);

-- Menu & Floor
CREATE TABLE IF NOT EXISTS stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    printer_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stations_restaurant ON stations(restaurant_id);

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name_en TEXT NOT NULL,
    name_bn TEXT,
    sort INT NOT NULL DEFAULT 0,
    color TEXT DEFAULT '#3b82f6',
    station_id UUID REFERENCES stations(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_categories_restaurant ON categories(restaurant_id);

CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name_en TEXT NOT NULL,
    name_bn TEXT,
    sku TEXT,
    base_price_minor BIGINT NOT NULL DEFAULT 0,
    tax_class TEXT DEFAULT 'standard',
    image_url TEXT,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_menu_items_sku ON menu_items(restaurant_id, sku) WHERE sku IS NOT NULL;

CREATE TABLE IF NOT EXISTS item_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price_minor BIGINT NOT NULL DEFAULT 0,
    sku TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_item_variants_item ON item_variants(item_id);

CREATE TABLE IF NOT EXISTS addon_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    min INT NOT NULL DEFAULT 0,
    max INT NOT NULL DEFAULT 5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES addon_groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price_minor BIGINT NOT NULL DEFAULT 0,
    inventory_item_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS item_addon_groups (
    item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES addon_groups(id) ON DELETE CASCADE,
    PRIMARY KEY (item_id, group_id)
);

CREATE TABLE IF NOT EXISTS branch_item_overrides (
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    price_minor BIGINT,
    is_available BOOLEAN,
    PRIMARY KEY (branch_id, item_id)
);

CREATE TABLE IF NOT EXISTS table_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sort INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    section_id UUID REFERENCES table_sections(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    seats INT NOT NULL DEFAULT 4,
    pos_x INT NOT NULL DEFAULT 0,
    pos_y INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'free', -- free, occupied, bill_requested, cleaning, reserved
    current_order_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tables_restaurant ON tables(restaurant_id, branch_id);

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    notes TEXT,
    credit_limit_minor BIGINT NOT NULL DEFAULT 0,
    balance_minor BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customers_restaurant ON customers(restaurant_id);

-- Shifts & Cash Movements
CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    cashier_id UUID NOT NULL REFERENCES users(id),
    terminal_id TEXT DEFAULT 'default',
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    opening_cash_minor BIGINT NOT NULL DEFAULT 0,
    expected_cash_minor BIGINT NOT NULL DEFAULT 0,
    counted_cash_minor BIGINT NOT NULL DEFAULT 0,
    variance_minor BIGINT NOT NULL DEFAULT 0,
    note TEXT,
    status TEXT NOT NULL DEFAULT 'open'
);
CREATE INDEX IF NOT EXISTS idx_shifts_restaurant ON shifts(restaurant_id, branch_id);

CREATE TABLE IF NOT EXISTS cash_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- in, out
    amount_minor BIGINT NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Gap-free Counters
CREATE TABLE IF NOT EXISTS counters (
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- order_no, token_no, invoice_no
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    value BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (branch_id, name, date)
);

-- Orders, KOT & Billing
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    order_no BIGINT NOT NULL,
    token_no BIGINT,
    type TEXT NOT NULL DEFAULT 'dine_in', -- dine_in, takeaway, delivery
    table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    waiter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'draft', -- draft, placed, in_progress, served, billed, paid, cancelled, refunded
    subtotal_minor BIGINT NOT NULL DEFAULT 0,
    discount_minor BIGINT NOT NULL DEFAULT 0,
    service_charge_minor BIGINT NOT NULL DEFAULT 0,
    tax_minor BIGINT NOT NULL DEFAULT 0,
    delivery_fee_minor BIGINT NOT NULL DEFAULT 0,
    round_off_minor BIGINT NOT NULL DEFAULT 0,
    total_minor BIGINT NOT NULL DEFAULT 0,
    paid_minor BIGINT NOT NULL DEFAULT 0,
    notes TEXT,
    shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    UNIQUE (branch_id, order_no)
);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_branch ON orders(restaurant_id, branch_id, opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status ON orders(restaurant_id, status);

CREATE TABLE IF NOT EXISTS kots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    station_id UUID REFERENCES stations(id) ON DELETE SET NULL,
    batch_no INT NOT NULL DEFAULT 1,
    printed_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kots_order ON kots(order_id);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES item_variants(id) ON DELETE SET NULL,
    name_snapshot TEXT NOT NULL,
    qty NUMERIC(14,3) NOT NULL DEFAULT 1,
    unit_price_minor BIGINT NOT NULL DEFAULT 0,
    discount_minor BIGINT NOT NULL DEFAULT 0,
    tax_minor BIGINT NOT NULL DEFAULT 0,
    cost_minor_snapshot BIGINT NOT NULL DEFAULT 0,
    note TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, preparing, ready, served, cancelled
    kot_id UUID REFERENCES kots(id) ON DELETE SET NULL,
    voided_by UUID REFERENCES users(id) ON DELETE SET NULL,
    void_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

CREATE TABLE IF NOT EXISTS order_item_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    addon_id UUID REFERENCES addons(id) ON DELETE SET NULL,
    name_snapshot TEXT NOT NULL,
    price_minor BIGINT NOT NULL DEFAULT 0,
    qty INT NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_order_item_addons_item ON order_item_addons(order_item_id);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    method_code TEXT NOT NULL,
    amount_minor BIGINT NOT NULL,
    reference TEXT,
    received_by UUID REFERENCES users(id) ON DELETE SET NULL,
    shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
    paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_shift ON payments(shift_id);

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    invoice_no TEXT NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    snapshot JSONB NOT NULL,
    UNIQUE (branch_id, invoice_no)
);
CREATE INDEX IF NOT EXISTS idx_invoices_order ON invoices(order_id);

CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount_minor BIGINT NOT NULL,
    reason TEXT NOT NULL,
    approved_by UUID NOT NULL REFERENCES users(id),
    restock BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inventory, Purchasing & Costing
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    unit TEXT NOT NULL, -- kg, g, l, ml, pcs
    min_level NUMERIC(14,3) NOT NULL DEFAULT 0,
    category TEXT NOT NULL DEFAULT 'raw',
    avg_cost_minor BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inventory_items_restaurant ON inventory_items(restaurant_id);

CREATE TABLE IF NOT EXISTS branch_stock (
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    quantity NUMERIC(14,3) NOT NULL DEFAULT 0,
    PRIMARY KEY (branch_id, inventory_item_id)
);

CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES item_variants(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    qty_per_portion NUMERIC(14,3) NOT NULL DEFAULT 0,
    waste_pct NUMERIC(5,2) NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_recipes_menu_item ON recipes(menu_item_id);

CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- opening, purchase, sale, wastage, adjustment, transfer_in, transfer_out, refund_restock
    qty NUMERIC(14,3) NOT NULL,
    unit_cost_minor BIGINT NOT NULL DEFAULT 0,
    ref_type TEXT,
    ref_id UUID,
    reason TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON stock_movements(branch_id, inventory_item_id, created_at);

CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    balance_minor BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'draft', -- draft, ordered, partially_received, received, cancelled
    total_minor BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_order_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    qty NUMERIC(14,3) NOT NULL,
    unit_cost_minor BIGINT NOT NULL DEFAULT 0,
    received_qty NUMERIC(14,3) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- rent, salary, utilities, maintenance, other
    amount_minor BIGINT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    note TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_expenses_branch_date ON expenses(branch_id, date);

CREATE TABLE IF NOT EXISTS stock_counts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'draft', -- draft, finalized
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_count_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_count_id UUID NOT NULL REFERENCES stock_counts(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    expected_qty NUMERIC(14,3) NOT NULL DEFAULT 0,
    counted_qty NUMERIC(14,3) NOT NULL DEFAULT 0,
    variance_qty NUMERIC(14,3) NOT NULL DEFAULT 0
);

-- Audits, Approvals & Operations
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID,
    user_id UUID,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id UUID,
    before JSONB,
    after JSONB,
    ip TEXT,
    device TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_restaurant ON audit_logs(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(restaurant_id, entity, entity_id);

CREATE TABLE IF NOT EXISTS daily_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    sales_minor BIGINT NOT NULL DEFAULT 0,
    cogs_minor BIGINT NOT NULL DEFAULT 0,
    expenses_minor BIGINT NOT NULL DEFAULT 0,
    orders INT NOT NULL DEFAULT 0,
    data JSONB,
    UNIQUE (branch_id, date)
);

CREATE TABLE IF NOT EXISTS outbox_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    idempotency_key TEXT NOT NULL,
    status TEXT NOT NULL,
    response JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (restaurant_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- void, discount, wastage
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT,
    data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

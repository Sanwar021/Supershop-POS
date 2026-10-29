# RestoFlow POS - Architecture Decision Records (ADRs)

## ADR-001: Integer Minor Units for Monetary Values
- **Status:** Accepted
- **Context:** Floating point arithmetic can introduce rounding inaccuracies (e.g., 0.1 + 0.2 = 0.30000000000000004), which is impermissible in financial and billing software.
- **Decision:** All monetary amounts are stored and calculated as integers representing the smallest currency denomination (minor units): poisha for BDT, fils for SAR/AED/KWD, cents for USD.
- **Consequences:** Eliminates float rounding bugs. Formatting functions handle display division (`/ 100`) strictly at the presentation layer.

## ADR-002: Monotonic Gap-Free Invoice Numbers with Lock
- **Status:** Accepted
- **Context:** Tax compliance in target jurisdictions requires gap-free sequential invoice numbering per branch.
- **Decision:** Utilized database transactional locking with `counters` table and `SELECT value FROM counters WHERE branch_id = $1 AND name = 'invoice_no' AND date = $2 FOR UPDATE`.
- **Consequences:** Ensures strictly sequential invoice numbers without gaps even under concurrent checkout operations.

## ADR-003: Multi-Tenancy Strategy (Shared Database, Tenant Key)
- **Status:** Accepted
- **Context:** SaaS cost-efficiency and operational simplicity across thousands of restaurants.
- **Decision:** Single database with a shared schema. Every tenant-owned table carries a `restaurant_id UUID NOT NULL` foreign key. The backend `tenant` middleware extracts `restaurant_id` exclusively from cryptographically verified JWT claims, never from client input.
- **Consequences:** Maximum resource efficiency. Tenant isolation tests enforce non-leakage across tenants.

## ADR-004: Recipe-Based Automated Stock Ledger Deduction
- **Status:** Accepted
- **Context:** Restaurant inventory must decrement accurately according to ingredient quantities mapped to sold dishes.
- **Decision:** On order finalization (`POST /orders/{id}/pay`), a database transaction iterates through recipe line items for each sold item and inserts append-only records into `stock_movements` with type `sale`, updating `branch_stock`.
- **Consequences:** Transparent audit trail, zero phantom inventory drifts, accurate Cost of Goods Sold (COGS) snapshots.

## ADR-005: Offline-First Client Architecture via Dexie & Idempotent Outbox
- **Status:** Accepted
- **Context:** Unstable network connectivity in retail environments must never halt cashier billing.
- **Decision:** Orders, items, and payments utilize client-generated UUIDv7 keys. Offline mutations are enqueued in IndexedDB (`Dexie.js`) outbox. On reconnection, outbox queue replays against `POST /sync/batch` using idempotency keys stored in `outbox_sync_log`.
- **Consequences:** Cashier can bill, take cash, and print receipts without connectivity. Server guarantees exactly-once application.

## ADR-006: Weighted-Average Costing for Inventory (WAC)
- **Status:** Accepted
- **Context:** Ingredient purchase costs fluctuate over time.
- **Decision:** Implemented WAC formula:
  `new_avg_cost = (old_qty * old_avg_cost + received_qty * unit_cost) / (old_qty + received_qty)`
  calculated immediately on purchase order receipt.
- **Consequences:** True cost accounting without the complexity of managing perishable FIFO inventory queues.

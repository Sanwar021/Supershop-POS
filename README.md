# NovaMart Super Shop POS & Retail Management System 🛒⚡
> **Premium Multi-Branch Supermarket, Grocery Store POS & FMCG Inventory Management Platform**  
> *Tagline: Everyday essentials, intelligently managed*

NovaMart is a high-performance, production-quality Super Shop POS and Retail Management System engineered specifically for supermarkets, grocery stores, convenience chains, and department stores in Bangladesh.

Built with **Go Chi + PostgreSQL 17 + Redis + React 19 + TypeScript + Vite + Tailwind CSS**, it features deterministic integer minor units (poisha), instant laser barcode scanning, 26 grocery departments, decimal scale integration for weighted produce, promotional coupon discounts, 80mm fiscal receipts, and multi-branch inventory valuation.

---

## 🏛️ System Architecture

```text
[ React 19 + Vite Super Shop POS (Cashier / Floor Assistant / Fulfillment / Back Office) ]
        | HTTPS REST (JSON)         | WebSocket (ws://)
        v                           v
[ Nginx Reverse Proxy / TLS ]
        |
[ Go 1.22+ API Monolith ] <---> [ WebSocket Hub (Rooms: store:{id}, branch:{id}) ]
        |                              |
        +---> [ PostgreSQL 17+ ] <-----+
        |
[ Background Sync & Audit Workers ]
```

---

## 🌟 Core Super Shop Features

1. **High-Speed Cashier Checkout Terminal (`/pos`)**:
   - Rapid laser barcode scanning with instant cart insertion.
   - 26 large grocery departments inspired by standard supermarket catalogues (Fresh Produce, Dairy & Eggs, Meat & Fish, Rice, Atta & Grains, Edible Oils, Spices, Beverages, Personal Care, Baby Care, Household, etc.).
   - Quick filters: **Hot Deals**, **Popular Products**, **New Arrivals**, and **Weighted Goods**.
   - Decimal scale modal for weighed produce (e.g. `1.250 kg` Fuji Apples with live price preview).
   - Fast cash denomination buttons (৳50, ৳100, ৳500, ৳1000) with instant change calculation.
   - Digital payments: bKash, Nagad, Visa / Mastercard, and Split Tender.
   - Promotional coupon engine (e.g., `NOVAFIRST` for 10% off, `WEEKEND200` for ৳200 flat discount).
   - Hold & Resume multi-cart transactions for cashiers when shoppers step away.

2. **Order Fulfillment & Picking Station (`/fulfillment`)**:
   - Picking lists with aisle/shelf locations (e.g. `Aisle 3, Rack B`).
   - Order pipeline: New -> Picking -> Packed & Ready -> Dispatched / Delivered.
   - Audible web-audio chime notifications for incoming orders.

3. **Aisle Assistant & Mobile Price Checker (`/assistant`)**:
   - Handheld floor mobile terminal for staff.
   - Scan any barcode to look up retail price, promotional discount, on-hand shelf stock, and aisle coordinates.

4. **Back Office Management Suite (`/admin`)**:
   - **Executive Dashboard**: Daily sales, gross margins, payment mix, 7-day revenue trend, and top-selling SKUs.
   - **Products & Catalogue (`/admin/products`)**: Add/edit retail products, package sizes, brands, regular MRP vs sale prices, margins, and printable shelf barcode labels.
   - **Registers & Counters (`/admin/registers`)**: Manage checkout lanes, counter types (Express, Trolley POS, Self-checkout), and active lane statuses.
   - **Inventory & Stock Valuation (`/admin/inventory`)**: FIFO stock ledger, low-stock reorder warnings, and stock adjustment logging (damage, spoilage/expiry, recount).
   - **Sales & Invoices (`/admin/sales`)**: Full invoice history, 80mm thermal receipt reprints, and returns/refunds with restock.
   - **Customers & Loyalty (`/admin/customers`)**: NovaClub membership tiers (Regular, Silver, Gold, VIP) and points cash redemption.
   - **Suppliers & Purchases (`/admin/suppliers`)**: FMCG vendor records (Meghna Group, City Group, Square, PRAN, Aarong, Unilever) and payment terms.
   - **Financial Reports (`/admin/reports`)**: Automated P&L statements, 5% Super Shop VAT accounting, and cashier exception logs.
   - **Staff & Roles (`/admin/staff`)**: 8 granular role permissions and cashier discount caps.
   - **Register Shifts (`/admin/shifts`)**: Shift opening float, expected cash drawer calculation, and cash variance explanations.

---

## 🚀 Running the Project

### 1. Database
PostgreSQL is configured on port `5433` (database `restoflow`):
```bash
# Verify connection or apply retail migrations if needed:
psql -U postgres -h localhost -p 5433 -d restoflow -f backend/migrations/0002_retail_supershop.up.sql
```

### 2. Run Backend API Server (Port 8080)
```bash
cd backend
go run ./cmd/api
# Or run compiled binary:
# .\api.exe
```

### 3. Run Frontend Web Application (Port 5173)
```bash
cd frontend
npm install
npm run dev
# Open in browser: http://localhost:5173
```

### 4. Run Automated E2E Verification
```powershell
powershell -ExecutionPolicy Bypass -File .\test_e2e.ps1
```

---

## 🔑 Demo Seed Accounts

| Role | Email | Password | Quick PIN | Access Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@novamart.com` | `admin123` | - | Multi-branch SaaS control, tenants, trials |
| **Store Owner** | `owner@novamart.com` | `owner123` | `0000` | Full store control, financial P&L, configuration |
| **Branch Manager** | `manager@novamart.com` | `manager123` | `1111` | Register management, supervisor overrides, returns |
| **Lead Cashier** | `cashier@novamart.com` | `cashier123` | `2222` | Rapid barcode POS checkout, shifts, payments |
| **Inventory Head** | `inventory@novamart.com` | `inventory123` | `5555` | Stock valuation, reorder levels, damage adjustments |
| **Purchase Officer** | `purchase@novamart.com` | `purchase123` | `6666` | FMCG suppliers, purchase orders, vendor payables |
| **Chief Accountant** | `accountant@novamart.com` | `accountant123` | `7777` | VAT statements, financial reporting, cash audits |
| **Delivery Associate** | `delivery@novamart.com` | `delivery123` | `8888` | Fulfillment picking station, dispatch status |

---

## 🧾 Fiscal Bill Calculation Standard

All calculations strictly use integer minor units (1 BDT = 100 poisha) with zero floating-point imprecision:
```
Subtotal = ∑ (Item Base Price × Quantity)
Order Discount = Min(Subtotal, Coupon Discount + Loyalty Redemption)
Net Taxable = Subtotal - Order Discount
VAT (5% Standard Super Shop) = Round(Net Taxable × 0.05)
Total Invoiced = Net Taxable + VAT
Change Due = Cash Tendered - Total Invoiced
```

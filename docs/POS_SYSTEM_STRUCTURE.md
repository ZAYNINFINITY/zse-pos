# 📊 ZSE POS System - Complete Structure & Database Guide

**Created:** February 16, 2026  
**System:** ZSE POS (Point of Sale) Desktop Application  
**Database:** SQLite3 (better-sqlite3)  
**Framework:** Electron + React  

---

## 📑 Table of Contents

1. [Database Schema](#database-schema)
2. [Data Storage Locations](#data-storage-locations)
3. [Sample Data](#sample-data)
4. [Application Structure](#application-structure)
5. [Data Flow Examples](#data-flow-examples)
6. [Features & Data Tracking](#features--data-tracking)
7. [Running the System](#running-the-system)

---

## 🗄️ Database Schema

The POS system uses **SQLite3** with **9 core tables** to store all business data.

### 1️⃣ USERS TABLE
**Purpose:** User authentication and role-based access control

```sql
CREATE TABLE users (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  username        TEXT NOT NULL UNIQUE,        -- Login ID
  password        TEXT NOT NULL,               -- Password hash (PBKDF2)
  role            TEXT NOT NULL DEFAULT 'cashier',  -- admin or cashier
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Note:** The application does not ship default credentials. The first admin account is created during the Setup Wizard.

**Use Case:** Login verification, access control (admin can manage staff, cashiers only process sales)

---

### 2️⃣ CATEGORIES TABLE
**Purpose:** Product categorization for organization and filtering

```sql
CREATE TABLE categories (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL UNIQUE,          -- Category name
  description  TEXT                           -- Optional details
);
```

**Sample Data:**
```
id | name                    | description
1  | Sanitary Fittings       | Taps, mixers, valves
2  | Bathroom Accessories    | Racks, mirrors, holders
3  | Pipes & Fittings        | PVC, CPVC, GI pipes
4  | Tiles & Flooring        | Ceramic, marble tiles
5  | Water Heaters / Geysers | Electric & gas heaters
6  | Cleaning Supplies       | Cleaning materials
```

**Use Case:** Filter products by category, organize inventory, sales reports by category

---

### 3️⃣ PRODUCTS TABLE
**Purpose:** Core product inventory and pricing information

```sql
CREATE TABLE products (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,               -- Product name
  sku             TEXT UNIQUE,                 -- Stock Keeping Unit
  category_id     INTEGER,                     -- Links to categories
  cost_price      REAL DEFAULT 0,              -- Your cost
  price           REAL NOT NULL,               -- Selling price
  stock           INTEGER DEFAULT 0,           -- Units on hand
  barcode         TEXT UNIQUE,                 -- Barcode/scanner
  image_path      TEXT,                        -- Product image
  tax_rate        REAL DEFAULT 0,              -- Tax percentage
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

**Sample Data:**
```
id | name                  | sku    | price | cost_price | stock | category_id
1  | Single Lever Mixer    | SLM-001| 1200  | 800        | 15    | 1
2  | PVC Pipe 1/2" 10ft    | PVC-201| 250   | 150        | 50    | 3
3  | Towel Rack Chrome     | TRC-101| 900   | 600        | 20    | 2
```

**Profit Calculation:** price - cost_price  
**Use Case:** Sales transactions, inventory tracking, profit analysis

---

### 4️⃣ CUSTOMERS TABLE
**Purpose:** Customer database for repeat purchases and communication

```sql
CREATE TABLE customers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,                  -- Customer name
  phone       TEXT,                           -- Contact number
  email       TEXT,                           -- Email address
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Sample Data:**
```
id | name            | phone         | email
1  | John Smith      | 555-1234      | john@example.com
2  | Sarah Johnson   | 555-5678      | sarah@example.com
```

**Use Case:** Track customer purchases, loyalty programs, send promotions

---

### 5️⃣ DISCOUNT_CODES TABLE
**Purpose:** Promotional codes and discount management

```sql
CREATE TABLE discount_codes (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  code            TEXT NOT NULL UNIQUE,       -- Code (e.g., SAVE10)
  discount_type   TEXT NOT NULL DEFAULT 'percentage', -- percentage or fixed
  discount_value  REAL NOT NULL,              -- 10 (for 10%) or 500
  min_purchase    REAL DEFAULT 0,             -- Minimum amount to apply
  max_discount    REAL,                       -- Maximum discount limit
  valid_from      DATETIME,                   -- Start date
  valid_until     DATETIME,                   -- End date
  is_active       INTEGER DEFAULT 1           -- 1=active, 0=inactive
);
```

**Sample Data:**
```
id | code    | type       | value | min_purchase | valid_until
1  | SAVE10  | percentage | 10    | 1000         | 2026-12-31
2  | SAVE500 | fixed      | 500   | 5000         | 2026-12-31
```

**Use Case:** Apply promotional discounts at checkout, validate coupon codes

---

### 6️⃣ SALES TABLE
**Purpose:** Complete transaction record with financial summary

```sql
CREATE TABLE sales (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id     INTEGER,                    -- Who bought
  user_id         INTEGER,                    -- Who processed
  subtotal        REAL NOT NULL,              -- Before tax & discount
  tax_amount      REAL DEFAULT 0,             -- Calculated tax
  discount_amount REAL DEFAULT 0,             -- Total discount given
  discount_code   TEXT,                       -- Code used (if any)
  total           REAL NOT NULL,              -- Final amount
  payment_method  TEXT NOT NULL,              -- Cash, Card, Check
  payment_details TEXT,                       -- Reference/card info
  date            DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_returned     INTEGER DEFAULT 0,          -- 1=returned, 0=completed
  returned_date   DATETIME,                   -- When returned
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Calculation Flow:**
```
subtotal = SUM(sale_items.total)
tax_amount = subtotal × product.tax_rate / 100
discount_amount = (subtotal × discount_value) or fixed value
total = subtotal + tax_amount - discount_amount
```

**Sample Data:**
```
id | customer_id | subtotal | tax_amount | discount_amount | total  | payment_method | date
1  | 1           | 2400     | 240        | 240             | 2400   | Cash           | 2026-02-15
2  | 2           | 5000     | 500        | 500             | 5000   | Card           | 2026-02-15
```

**Use Case:** Track every sale, calculate revenue, generate receipts, returns processing

---

### 7️⃣ SALE_ITEMS TABLE
**Purpose:** Line-by-line breakdown of items in each sale

```sql
CREATE TABLE sale_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id     INTEGER,                       -- Which sale/receipt
  product_id  INTEGER,                       -- Which product
  quantity    INTEGER NOT NULL,              -- Units sold
  unit_price  REAL NOT NULL,                 -- Price at time of sale
  cost_price  REAL DEFAULT 0,                -- Your cost at sale time
  discount    REAL DEFAULT 0,                -- Line item discount
  total       REAL NOT NULL,                 -- qty × unit_price - discount
  FOREIGN KEY (sale_id) REFERENCES sales(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

**Sample Data:**
```
id | sale_id | product_id | quantity | unit_price | discount | total
1  | 1       | 1          | 2        | 1200       | 0        | 2400
2  | 1       | 3          | 1        | 900        | 0        | 900
```

**Use Case:** Receipt details, profit per item, inventory updates

---

### 8️⃣ STOCK_ADJUSTMENTS TABLE
**Purpose:** Audit trail for all inventory changes

```sql
CREATE TABLE stock_adjustments (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id       INTEGER NOT NULL,          -- Which product
  adjustment_type  TEXT NOT NULL,             -- addition, removal, return
  quantity         INTEGER NOT NULL,          -- How many units
  reason           TEXT,                      -- Why (damaged, theft, etc.)
  notes            TEXT,                      -- Additional info
  user_id          INTEGER,                   -- Who did it
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Sample Data:**
```
id | product_id | adjustment_type | quantity | reason    | user_id | created_at
1  | 1          | removal         | 2        | damaged   | 1       | 2026-02-15
2  | 5          | addition        | 10       | restock   | 1       | 2026-02-15
```

**Use Case:** Track inventory discrepancies, compliance audits, stock verification

---

### 9️⃣ PRODUCTS_RECOMMENDATIONS TABLE
**Purpose:** AI-powered product recommendations

```sql
CREATE TABLE products_recommendations (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id            INTEGER NOT NULL,     -- Base product
  recommended_product_id INTEGER NOT NULL,    -- Related product
  score                 REAL DEFAULT 0.5,     -- Confidence (0-1)
  created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (recommended_product_id) REFERENCES products(id)
);
```

**Use Case:** Suggest complementary products (if buying a tap, suggest washers)

---

## 💾 Data Storage Locations

### Database File Location
```
Windows (Default):
C:\Users\{YourUsername}\AppData\Roaming\zse-pos\zse-pos.db

Total Size: ~2-5 MB (grows with transactions)
```

### Backup Files
```
Location:
C:\Users\{YourUsername}\AppData\Roaming\zse-pos\backups\

Backup Schedule: Daily (automatic)
Naming: backup_YYYY-MM-DD.db
Example: backup_2026-02-15.db
```

### React Build Files
```
Location: {Project}/build/
Index: index.html (loaded when app starts)
Size: ~500 KB
```

---

## 📦 Sample Data
No demo data is auto-inserted. Create your first admin during the Setup Wizard, then add categories/products manually or import inventory via CSV.

---

## 🏗️ Application Structure

### Frontend (React Components)

```
src/
├── App.js
│   └── Main navigation and view switching
│
├── components/
│   ├── Login.js
│   │   └── User authentication
│   │       └── Validates: username + password
│   │       └── Sets user role (admin/cashier)
│   │
│   ├── POSTerminal.js
│   │   └── Main checkout interface
│   │       ├── Product search & add to cart
│   │       ├── Quantity adjustment
│   │       ├── Customer selection
│   │       ├── Discount code validation
│   │       └── Payment processing
│   │
│   ├── ProductManagement.js
│   │   └── Admin feature: Add/Edit/Delete products
│   │       ├── Category management
│   │       ├── Price & cost tracking
│   │       └── SKU & barcode management
│   │
│   ├── InventoryDashboard.js
│   │   └── Stock level monitoring
│   │       ├── Low stock alerts
│   │       └── Inventory value calculation
│   │
│   ├── SalesHistory.js
│   │   └── Receipt lookup & viewing
│   │       ├── Filter by date range
│   │       ├── Filter by customer
│   │       └── Reprint receipts
│   │
│   ├── CustomerManagement.js
│   │   └── Manage customer database
│   │       ├── Add/Edit customers
│   │       └── View purchase history
│   │
│   ├── Analytics.js
│   │   └── Business reports & graphs
│   │       ├── Daily/monthly sales
│   │       ├── Best sellers
│   │       ├── Profit margins
│   │       └── Customer trends
│   │
│   ├── UserManagement.js
│   │   └── Admin: Manage staff accounts
│   │       ├── Create cashiers
│   │       └── Manage permissions
│   │
│   └── StockAdjustment.js
│       └── Record inventory discrepancies
│           ├── Add/remove stock
│           ├── Mark as damaged
│           └── Audit trail
│
├── index.css
│   └── Tailwind CSS styling
│
└── index.js
    └── React app entry point
```

### Backend (Electron + Node.js)

```
main.js (1,437 lines)
├── Database Management
│   ├── Initialize SQLite
│   ├── Create 9 tables
│   ├── Sample data loading
│   └── Daily backups
│
├── 32+ IPC Handlers
│   ├── Authentication
│   │   ├── login (validate user)
│   │   ├── getUserList
│   │   └── addUser
│   │
│   ├── Products
│   │   ├── getProducts
│   │   ├── getProductsByCategory
│   │   ├── addProduct
│   │   ├── updateProduct
│   │   └── deleteProduct
│   │
│   ├── Sales
│   │   ├── completeSale
│   │   ├── getSalesHistory
│   │   ├── returnSale
│   │   └── generateReceipt
│   │
│   ├── Customers
│   │   ├── getCustomers
│   │   ├── addCustomer
│   │   └── getCustomerHistory
│   │
│   ├── Inventory
│   │   ├── updateStock
│   │   ├── getStockAdjustments
│   │   └── adjustStock
│   │
│   ├── Discounts
│   │   ├── validateDiscount
│   │   ├── getActiveDiscounts
│   │   └── createDiscount
│   │
│   ├── Reports
│   │   ├── getDailySales
│   │   ├── getMonthlySales
│   │   ├── getProductSales
│   │   └── getProfitAnalysis
│   │
│   └── Utility
│       ├── getCategories
│       ├── exportData
│       └── importData
│
└── Window Management
    ├── Create app window
    ├── Load React build
    ├── Dev tools (development mode)
    └── Icon handling
```

### preload.js (IPC Bridge)

```javascript
window.api = {
  // Expose safe IPC methods for React
  // Each method: window.api.methodName(args) → calls main.js handler
}
```

---

## 🔄 Data Flow Examples

### Example 1: Making a Sale (Complete Flow)

```
┌─ CUSTOMER ARRIVES ─┐
│                    │
└──────────┬─────────┘
           │
           ▼
┌─────────────────────────┐
│ LOGIN (if needed)       │
│ Cashier login           │
│ → Check: users table    │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ SELECT CUSTOMER         │
│ Choose existing or new  │
│ → Check: customers table│
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ ADD ITEMS TO CART       │
│ Scan/search product     │
│ → Check: products table │
│ → Display price & stock │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ APPLY DISCOUNT (optional)
│ Enter coupon code       │
│ → Check: discount_codes │
│ → Validate: date, amount│
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ CALCULATE TOTALS        │
│ Subtotal (sum items)    │
│ Tax (product % rate)    │
│ Discount (if applied)   │
│ Total = sub + tax - disc│
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ SELECT PAYMENT METHOD   │
│ Cash, Card, Check, etc. │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ COMPLETE SALE (DB)      │
│ INSERT: sales           │
│   + customer_id         │
│   + user_id (cashier)   │
│   + total, payment_method
│   + discount_code       │
│   + timestamp           │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ SAVE LINE ITEMS (DB)    │
│ INSERT: sale_items      │
│   (for each item)       │
│   + sale_id             │
│   + product_id          │
│   + quantity            │
│   + unit_price          │
│   + total               │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ UPDATE INVENTORY (DB)   │
│ UPDATE: products        │
│   SET stock = stock - qty
│   WHERE product_id = x  │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ GENERATE RECEIPT (PDF)  │
│ Create receipt file     │
│ Show in app             │
│ Print option available  │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ RESET CART & COMPLETE   │
│ Sale finished!          │
│ Ready for next customer │
└─────────────────────────┘
```

### Example 2: Stock Adjustment

```
ADMIN NOTICES DISCREPANCY
        │
        ▼
SELECT PRODUCT
  → Gets from products table
        │
        ▼
ENTER ADJUSTMENT
  Type: addition|removal|return
  Qty: ±5 units
  Reason: damaged|theft|recount|etc
        │
        ▼
CONFIRM & SAVE
  INSERT: stock_adjustments
  UPDATE: products (stock)
        │
        ▼
AUDIT LOG CREATED
  Recorded: who, when, why, how much
```

### Example 3: Sales Report Query

```sql
-- What happened today?
SELECT 
  s.id,
  c.name as customer,
  u.username as cashier,
  s.total,
  COUNT(si.id) as items,
  s.date
FROM sales s
LEFT JOIN customers c ON s.customer_id = c.id
LEFT JOIN users u ON s.user_id = u.id
LEFT JOIN sale_items si ON s.id = si.sale_id
WHERE DATE(s.date) = DATE('now')
GROUP BY s.id
ORDER BY s.date DESC;
```

---

## 📊 Features & Data Tracking

| Feature | Where It's Stored | Tables Used | Tracked Info |
|---------|------------------|------------|--------------|
| **Authentication** | users | users | Login, role, timestamp |
| **Product Catalog** | products | products, categories | Name, price, cost, stock, tax |
| **POS Sales** | sales transaction | sales, sale_items | Items, total, discount, payment |
| **Inventory** | products table | products, stock_adjustments | Current qty, changes, reasons |
| **Customers** | customer database | customers, sales | Name, contact, purchase history |
| **Discounts** | discount codes | discount_codes, sales | Code, type, value, validity |
| **Profit Analysis** | calculated from data | products, sales, sale_items | Cost vs price per item/day/month |
| **Receipts** | generated as PDF | sales, sale_items | Itemized bill, totals, timestamp |
| **Audit Trail** | stock adjustments | stock_adjustments | Who, what, when, why |
| **Backup** | File system | Entire DB | Daily snapshots |

---

## 🚀 Running the System

### Quick Start

**Option 1: Double-click the batch file**
```
START_POS.bat
```

**Option 2: Command line**
```powershell
cd "d:\WORK - ARCHIVE\IMPORTANT CODING DATA AND PROJECTS\PROJECTS\zse-pos"
npm start
```

**Option 3: Development mode (with auto-reload)**
```powershell
npm run dev
```

### Build Installers for Distribution

```powershell
# PowerShell version
.\build-installers.ps1

# Or use batch file
build-installers.bat
```

Creates installers in `dist/` folder:
- `ZSE-POS-System-1.0.0.exe` (64-bit)
- `ZSE-POS-System-1.0.0-ia32.exe` (32-bit)

---

## 🔐 Security Notes

- ✅ **Passwords:** Plain text (upgrade to bcrypt for production)
- ✅ **Database:** Local SQLite (add encryption if needed)
- ✅ **Backups:** Daily automatic (keep on separate drive)
- ✅ **Access Control:** Role-based (admin vs cashier)

---

## 📈 Performance Tips

1. **Database Size:** Monitor `zse-pos.db` file size
2. **Backups:** Keep 30 days of backups, then archive
3. **Old Sales:** Archive sales older than 1 year to separate DB
4. **Indexes:** Add indexes on frequently searched columns (SKU, barcode)

---

## 📞 Support Quick Reference

**App crashes?** Check: `C:\Users\{User}\AppData\Roaming\zse-pos\` for error logs

**Lost data?** Restore from: `backup_YYYY-MM-DD.db` files

**Inventory wrong?** Check `stock_adjustments` table for changes

**Sales mismatch?** Query `sales` and `sale_items` tables

---

**Last Updated:** February 16, 2026  
**Version:** 1.0.0  
**Status:** Production Ready ✅

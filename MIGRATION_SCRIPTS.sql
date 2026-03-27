# Migration Scripts for ZSE POS Database Normalization

**Purpose:** Convert from flat product structure to normalized variant-based structure  
**Date:** February 16, 2026  
**Backup Required:** YES ✅ (Essential before running)  

---

## ⚠️ CRITICAL: BACKUP BEFORE PROCEEDING

```powershell
# Stop the application first!
# Then backup your database:

Copy-Item "C:\Users\$env:USERNAME\AppData\Roaming\zse-pos\zse-pos.db" -Destination "zse-pos_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').db"
```

---

## PHASE 1: Create New Tables

### Step 1: Create DEPARTMENTS Table

```sql
CREATE TABLE departments (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL UNIQUE,
  description     TEXT,
  image_path      TEXT,
  is_active       INTEGER DEFAULT 1,
  sort_order      INTEGER,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample departments based on your business
INSERT INTO departments (name, description, sort_order) VALUES 
  ('PPR', 'Polypropylene Random pipes and fittings', 1),
  ('PVC / UPVC', 'Polyvinyl chloride pipes', 2),
  ('Valves', 'Ball, Check, Gate valves', 3),
  ('Sanitary Fittings', 'Taps, mixers, faucets', 4),
  ('Hardware', 'Connectors, brackets, clamps', 5),
  ('Water Storage', 'Tanks, containers', 6),
  ('Gas / Heater', 'Gas heaters, water heaters', 7);
```

---

### Step 2: Create BRANDS Table

```sql
CREATE TABLE brands (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL UNIQUE,
  description     TEXT,
  logo_path       TEXT,
  country         TEXT,
  is_active       INTEGER DEFAULT 1,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert known brands (add more as needed)
INSERT INTO brands (name, country) VALUES 
  ('Master', 'Pakistan'),
  ('Royal', 'Pakistan'),
  ('Burj', 'Pakistan'),
  ('M.Fit', 'Pakistan'),
  ('China', 'China'),
  ('Tempo', 'China'),
  ('Unknown', 'Unknown');
```

---

### Step 3: Alter CATEGORIES Table (Add Department FK)

```sql
-- WARNING: This alters existing data!
-- Add the foreign key column first
ALTER TABLE categories ADD COLUMN department_id INTEGER;

-- Manually update categories to departments
-- First, let's check existing categories
SELECT DISTINCT category_id, name FROM categories;

-- Then map to departments:
-- Example: if you have "Pipes" in "PPR", then:
UPDATE categories SET department_id = 1 WHERE name = 'Pipes' OR name LIKE '%Pipe%';
UPDATE categories SET department_id = 3 WHERE name LIKE '%Valve%';
UPDATE categories SET department_id = 4 WHERE name LIKE '%Faucet%' OR name LIKE '%Tap%';
UPDATE categories SET department_id = 4 WHERE name = 'Sanitary Fittings';
UPDATE categories SET department_id = 2 WHERE name LIKE '%PVC%';
UPDATE categories SET department_id = 6 WHERE name LIKE '%Tank%';
UPDATE categories SET department_id = 7 WHERE name LIKE '%Heater%' OR name LIKE '%Geyser%';

-- Add the foreign key constraint
ALTER TABLE categories ADD FOREIGN KEY (department_id) REFERENCES departments(id);

-- Add other helpful columns
ALTER TABLE categories ADD COLUMN image_path TEXT;
ALTER TABLE categories ADD COLUMN is_active INTEGER DEFAULT 1;
ALTER TABLE categories ADD COLUMN sort_order INTEGER;
ALTER TABLE categories ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;
```

---

### Step 4: Add Brand FK to PRODUCTS Table

```sql
-- Add brand reference to existing products
ALTER TABLE products ADD COLUMN brand_id INTEGER;

-- Set default brand (you can update this manually later)
UPDATE products SET brand_id = 1;  -- Assume all are "Master" for now

-- Later, manually update brands:
-- UPDATE products SET brand_id = 2 WHERE name LIKE '%Royal%';
```

---

### Step 5: Create PRODUCT_VARIANTS Table (CRITICAL)

```sql
CREATE TABLE product_variants (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id          INTEGER NOT NULL,
  sku                 TEXT NOT NULL UNIQUE,
  barcode             TEXT UNIQUE,
  variant_name        TEXT NOT NULL,
  
  -- Specification fields (generic, use as needed)
  specification_1     TEXT,    -- Size, Diameter, etc.
  specification_2     TEXT,    -- PN Rating, Pressure, etc.
  specification_3     TEXT,    -- Angle, Degree, etc.
  specification_4     TEXT,    -- Color, Material, etc.
  specification_5     TEXT,    -- Custom field
  
  -- Pricing
  cost_price          REAL DEFAULT 0,
  price               REAL NOT NULL,
  discount_price      REAL,
  tax_rate            REAL DEFAULT 0,
  
  -- Inventory
  stock               INTEGER DEFAULT 0,
  reorder_level       INTEGER DEFAULT 10,
  
  -- Media
  image_path          TEXT,
  
  -- Metadata
  is_active           INTEGER DEFAULT 1,
  is_default          INTEGER DEFAULT 0,
  weight              REAL,
  dimensions          TEXT,
  
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id),
  INDEX idx_sku (sku),
  INDEX idx_barcode (barcode)
);
```

---

### Step 6: Create PRICE_HISTORY Table

```sql
CREATE TABLE price_history (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  variant_id          INTEGER NOT NULL,
  old_price           REAL,
  new_price           REAL,
  change_percentage   REAL,
  reason              TEXT,
  changed_by          INTEGER,
  changed_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (variant_id) REFERENCES product_variants(id),
  FOREIGN KEY (changed_by) REFERENCES users(id),
  INDEX idx_variant_id (variant_id),
  INDEX idx_changed_at (changed_at)
);
```

---

## PHASE 2: Data Migration

### Step 1: Migrate Existing Products to Variants

```sql
-- Rename current products table as backup
ALTER TABLE products RENAME TO products_old;

-- Create new optimized products table
CREATE TABLE products (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,
  department_id   INTEGER NOT NULL,
  category_id     INTEGER NOT NULL,
  brand_id        INTEGER,
  description     TEXT,
  thumbnail_path  TEXT,
  is_active       INTEGER DEFAULT 1,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL,
  INDEX idx_category (category_id),
  INDEX idx_department (department_id)
);

-- Extract unique product names (without size/variant info)
-- This is a tricky step - you may need to do this manually
-- Example: "25mm PPR Pipe" → "PPR Pipe"
-- Example: "Ball Valve 1/2"" → "Ball Valve"

INSERT INTO products (name, category_id, brand_id, is_active)
SELECT DISTINCT 
  -- Try to extract base name (may need manual cleanup)
  CASE 
    WHEN name LIKE '%mm%' THEN SUBSTR(name, INSTR(name, ' ') + 1)
    WHEN name LIKE '% %' THEN SUBSTR(name, 1, INSTR(name, ' ') - 1) || ' ' || SUBSTR(name, INSTR(name, ' ') + 1, INSTR(name || ' ', ' ', INSTR(name, ' ') + 1) - INSTR(name, ' ') - 1)
    ELSE name
  END as base_name,
  category_id,
  1,  -- Default to Master brand
  is_active
FROM products_old
WHERE category_id IS NOT NULL;

-- ⚠️ MANUAL REVIEW REQUIRED!
-- Check the new products table:
SELECT * FROM products;
-- You may need to manually edit product names to ensure they're clean
```

---

### Step 2: Create Variants from Old Products

```sql
-- Migrate old product records as variants
INSERT INTO product_variants (
  product_id,
  sku,
  barcode,
  variant_name,
  specification_1,  -- Store the size/variant info here
  cost_price,
  price,
  stock,
  tax_rate,
  image_path,
  is_active
)
SELECT 
  p.id as product_id,
  po.sku,
  po.barcode,
  po.name as variant_name,  -- Store full old name here
  po.name as specification_1,  -- Or parse out the size
  po.cost_price,
  po.price,
  po.stock,
  po.tax_rate,
  po.image_path,
  po.is_active
FROM products_old po
LEFT JOIN products p ON 
  p.name LIKE SUBSTR(po.name, 1, LENGTH(po.name) - 10) || '%'  -- Fuzzy match
WHERE po.category_id IS NOT NULL;

-- Verify the migration
SELECT 
  p.name as product_name,
  pv.variant_name,
  pv.sku,
  pv.price,
  pv.stock
FROM product_variants pv
INNER JOIN products p ON pv.product_id = p.id
LIMIT 20;
```

---

### Step 3: Update SALES and SALE_ITEMS (Add Variant Reference)

```sql
-- Add variant reference to sale_items
ALTER TABLE sale_items ADD COLUMN variant_id INTEGER;

-- Try to match sale_items with variants based on product_id and old product data
-- This is complex and requires careful matching:

UPDATE sale_items 
SET variant_id = (
  SELECT pv.id 
  FROM product_variants pv
  INNER JOIN products p ON pv.product_id = p.id
  WHERE pv.product_id = (
    SELECT product_id FROM sale_items si2 
    WHERE si2.id = sale_items.id
  )
  LIMIT 1
);

-- Add foreign key constraint
ALTER TABLE sale_items ADD FOREIGN KEY (variant_id) REFERENCES product_variants(id);

-- Also add product_id FK if not already there
-- (in case it's needed for reporting)
```

---

### Step 4: Update STOCK_ADJUSTMENTS Table

```sql
-- Add variant_id column
ALTER TABLE stock_adjustments ADD COLUMN variant_id INTEGER;

-- Try to map existing adjustments to variants
-- This requires matching the old product_id to the new variant structure
UPDATE stock_adjustments
SET variant_id = (
  SELECT pv.id
  FROM product_variants pv
  WHERE pv.product_id = (
    SELECT id FROM products 
    LIMIT 1  -- This is simplified, real logic is more complex
  )
  LIMIT 1
);

-- Add FK
ALTER TABLE stock_adjustments ADD FOREIGN KEY (variant_id) REFERENCES product_variants(id);

-- Now that variants exist, you can optionally remove product_id from stock_adjustments
-- (or keep it for backward compatibility)
```

---

## PHASE 3: Verification Queries

### Check 1: Do all variants have valid parent products?

```sql
SELECT 
  pv.id,
  pv.sku,
  pv.variant_name,
  p.id as product_id,
  p.name
FROM product_variants pv
LEFT JOIN products p ON pv.product_id = p.id
WHERE p.id IS NULL;

-- Should return 0 rows. If not, you have orphaned variants!
```

---

### Check 2: Are there duplicate SKUs?

```sql
SELECT sku, COUNT(*) as count
FROM product_variants
GROUP BY sku
HAVING count > 1;

-- Should return 0 rows. If you have duplicates, remove them!
```

---

### Check 3: Are all categories linked to departments?

```sql
SELECT id, name, department_id
FROM categories
WHERE department_id IS NULL;

-- Should return 0 rows
```

---

### Check 4: Stock match (old vs new)

```sql
SELECT 
  po.sku,
  po.stock as old_stock,
  pv.stock as new_stock,
  CASE WHEN po.stock = pv.stock THEN 'OK' ELSE 'MISMATCH' END as status
FROM products_old po
LEFT JOIN product_variants pv ON po.sku = pv.sku
LIMIT 20;
```

---

## PHASE 4: Cleanup (After Verification)

### If migration is successful, archive old tables:

```sql
-- Don't delete immediately - keep as backup for 30 days
-- Just rename:

ALTER TABLE products_old RENAME TO products_old_backup_20260216;

-- After 30 days of successful operation, you can delete:
-- DROP TABLE products_old_backup_20260216;
```

---

## ROLLBACK PROCEDURE (If Something Goes Wrong)

```sql
-- If migration fails, restore from backup:

-- 1. Close the application
-- 2. Restore the backup file:

Copy-Item "zse-pos_backup_20260216_120000.db" -Destination "C:\Users\$env:USERNAME\AppData\Roaming\zse-pos\zse-pos.db" -Force

-- 3. Restart the application
```

---

## Post-Migration Improvements

### Add Indexes for Performance

```sql
-- These queries will be much faster with indexes:

CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);
CREATE INDEX idx_sale_items_variant ON sale_items(variant_id);
CREATE INDEX idx_sales_date ON sales(date);
CREATE INDEX idx_categories_department ON categories(department_id);
CREATE INDEX idx_stock_adjustments_variant ON stock_adjustments(variant_id);
```

---

## Sample Data for Testing

After migration, test with these queries:

```sql
-- Example 1: Get all PPR Pipes
SELECT 
  pv.sku,
  pv.variant_name,
  pv.price,
  pv.stock
FROM product_variants pv
INNER JOIN products p ON pv.product_id = p.id
INNER JOIN categories c ON p.category_id = c.id
INNER JOIN departments d ON c.department_id = d.id
WHERE d.id = 1  -- PPR department

-- Example 2: Stock levels by variant
SELECT 
  p.name,
  pv.variant_name,
  pv.stock,
  pv.reorder_level,
  CASE 
    WHEN pv.stock = 0 THEN 'OUT OF STOCK'
    WHEN pv.stock < pv.reorder_level THEN 'LOW'
    ELSE 'OK'
  END as status
FROM product_variants pv
INNER JOIN products p ON pv.product_id = p.id
ORDER BY pv.stock ASC

-- Example 3: Best selling variants (last 7 days)
SELECT 
  p.name,
  pv.variant_name,
  COUNT(si.id) as sales_count,
  SUM(si.quantity) as total_qty,
  SUM(si.total) as revenue
FROM sale_items si
INNER JOIN product_variants pv ON si.variant_id = pv.id
INNER JOIN products p ON pv.product_id = p.id
INNER JOIN sales s ON si.sale_id = s.id
WHERE s.date >= DATE('now', '-7 days')
GROUP BY pv.id
ORDER BY revenue DESC
LIMIT 10;
```

---

## Testing Checklist

- [ ] All departments exist
- [ ] All categories linked to departments
- [ ] All brands created
- [ ] All products migrated to new table
- [ ] All variants created correctly
- [ ] SKUs are unique
- [ ] No orphaned variants
- [ ] Stock numbers match
- [ ] Sales history still intact
- [ ] Pricing intact
- [ ] Foreign keys work
- [ ] Indexes created
- [ ] Queries run fast
- [ ] Application code updated to use variants
- [ ] POS Terminal can select variants
- [ ] Reports work correctly
- [ ] Inventory dashboard shows variants
- [ ] Staff trained on new structure

---

## Application Code Updates Needed

After schema changes, you'll need to update:

1. **React Components:**
   - ProductManagement.js (add variant management)
   - InventoryDashboard.js (show variants instead of products)
   - POSTerminal.js (select variant when adding to cart)
   - SalesHistory.js (display variant names in receipts)

2. **main.js IPC Handlers:**
   - getProducts → return parent products only
   - getProductVariants → NEW: return variants for a product
   - getInventory → count by variant
   - completeSale → save variant_id in sale_items
   - updateStock → update variant stock level

3. **Database Queries:**
   - All inventory queries need variant joins
   - All sales queries need product name joins
   - All stock queries filter by variant_id

---

**Migration Complexity:** ⭐⭐⭐⭐ (4/5)  
**Time Estimate:** 2-4 hours (depending on data volume)  
**Risk Level:** Medium (requires careful testing)  
**Recommended:** Do this during off-hours with full backup  


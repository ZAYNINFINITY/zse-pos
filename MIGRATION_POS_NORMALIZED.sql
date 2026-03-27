-- ============================================================================
-- NORMALIZED POS DATABASE MIGRATION SCRIPT
-- Created: 2026-02-16
-- Purpose: Migrate flat product structure to normalized schema with variants
-- ============================================================================

-- ENABLE FOREIGN KEY CONSTRAINTS
PRAGMA foreign_keys = ON;

-- ============================================================================
-- 1. CREATE DEPARTMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS departments (
    department_id INTEGER PRIMARY KEY AUTOINCREMENT,
    department_name TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. CREATE CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS categories (
    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
    department_id INTEGER NOT NULL,
    category_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(department_id),
    UNIQUE(department_id, category_name)
);

-- ============================================================================
-- 3. CREATE BRANDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS brands (
    brand_id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand_name TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. CREATE PRODUCTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS products (
    product_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_name TEXT NOT NULL,
    department_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    brand_id INTEGER NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(department_id),
    FOREIGN KEY (category_id) REFERENCES categories(category_id),
    FOREIGN KEY (brand_id) REFERENCES brands(brand_id),
    UNIQUE(product_name, brand_id, category_id)
);

-- ============================================================================
-- 5. CREATE PRODUCT_VARIANTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS product_variants (
    variant_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    size TEXT,
    variant_detail TEXT,
    price REAL NOT NULL,
    stock INTEGER DEFAULT 0,
    image_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    UNIQUE(product_id, size, variant_detail)
);

-- ============================================================================
-- 6. CREATE PRICE_HISTORY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS price_history (
    price_history_id INTEGER PRIMARY KEY AUTOINCREMENT,
    variant_id INTEGER NOT NULL,
    old_price REAL,
    new_price REAL,
    effective_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id),
    INDEX idx_variant_date (variant_id, effective_date)
);

-- ============================================================================
-- 7. CREATE WAREHOUSE_LOCATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS warehouse_locations (
    location_id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_name TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 8. CREATE USERS TABLE (if not exists - preserve existing)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'cashier')),
    password_hash TEXT NOT NULL,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 9. CREATE SALES TABLE (Updated with variant support)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sales_v2 (
    sale_id INTEGER PRIMARY KEY AUTOINCREMENT,
    variant_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    discount REAL DEFAULT 0,
    total REAL GENERATED ALWAYS AS (price * quantity - discount) STORED,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    cashier_id INTEGER,
    FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id),
    FOREIGN KEY (cashier_id) REFERENCES users(user_id)
);

-- ============================================================================
-- 10. CREATE STOCK_AUDIT TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS stock_audit (
    audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action_type TEXT CHECK(action_type IN ('add', 'edit', 'delete', 'adjust')),
    table_name TEXT,
    record_id INTEGER,
    old_value TEXT,
    new_value TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ============================================================================
-- POPULATE DEPARTMENTS
-- ============================================================================
INSERT OR IGNORE INTO departments (department_name) VALUES ('PPR');

-- ============================================================================
-- POPULATE CATEGORIES
-- ============================================================================
INSERT OR IGNORE INTO categories (department_id, category_name) 
SELECT d.department_id, cat.category_name
FROM (
    SELECT 'Pipes' as category_name
    UNION ALL
    SELECT 'Fittings'
) cat
CROSS JOIN departments d
WHERE d.department_name = 'PPR';

-- ============================================================================
-- POPULATE BRANDS
-- ============================================================================
INSERT OR IGNORE INTO brands (brand_name) VALUES 
('Master'),
('Royal');

-- ============================================================================
-- POPULATE PRODUCTS
-- ============================================================================
-- PPR Pipes
INSERT OR IGNORE INTO products (product_name, department_id, category_id, brand_id, description)
SELECT 'PPR Pipe', d.department_id, c.category_id, b.brand_id, 'Polypropylene Random Copolymer Pipe'
FROM departments d, categories c, brands b
WHERE d.department_name = 'PPR' 
AND c.category_name = 'Pipes' 
AND b.brand_name IN ('Master', 'Royal')
GROUP BY b.brand_id;

-- PPR Elbows
INSERT OR IGNORE INTO products (product_name, department_id, category_id, brand_id, description)
SELECT 'PPR Elbow', d.department_id, c.category_id, b.brand_id, 'PPR Elbow Fitting'
FROM departments d, categories c, brands b
WHERE d.department_name = 'PPR' 
AND c.category_name = 'Fittings' 
AND b.brand_name = 'Master';

-- PPR Tees
INSERT OR IGNORE INTO products (product_name, department_id, category_id, brand_id, description)
SELECT 'PPR Tee', d.department_id, c.category_id, b.brand_id, 'PPR Tee Fitting'
FROM departments d, categories c, brands b
WHERE d.department_name = 'PPR' 
AND c.category_name = 'Fittings' 
AND b.brand_name = 'Master';

-- PPR Mixer
INSERT OR IGNORE INTO products (product_name, department_id, category_id, brand_id, description)
SELECT 'PPR Mixer Elbow', d.department_id, c.category_id, b.brand_id, 'PPR Mixer Elbow Transition'
FROM departments d, categories c, brands b
WHERE d.department_name = 'PPR' 
AND c.category_name = 'Fittings' 
AND b.brand_name = 'Master';

-- ============================================================================
-- POPULATE PRODUCT VARIANTS FROM DATA
-- ============================================================================

-- Master PPR Pipes
INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'PM1625', '25mm', 'PN16', 425, 0
FROM products p, brands b, categories c
WHERE p.product_name = 'PPR Pipe' AND b.brand_id = p.brand_id AND b.brand_name = 'Master' AND c.category_id = p.category_id;

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'PM2025', '25mm', 'PN20', 485, 0
FROM products p, brands b, categories c
WHERE p.product_name = 'PPR Pipe' AND b.brand_id = p.brand_id AND b.brand_name = 'Master' AND c.category_id = p.category_id;

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'PM1632', '32mm', 'PN16', 670, 0
FROM products p, brands b, categories c
WHERE p.product_name = 'PPR Pipe' AND b.brand_id = p.brand_id AND b.brand_name = 'Master' AND c.category_id = p.category_id;

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'PM2032', '32mm', 'PN20', 760, 0
FROM products p, brands b, categories c
WHERE p.product_name = 'PPR Pipe' AND b.brand_id = p.brand_id AND b.brand_name = 'Master' AND c.category_id = p.category_id;

-- Royal PPR Pipes
INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'PR1625', '25mm', 'PN16', 455, 0
FROM products p, brands b, categories c
WHERE p.product_name = 'PPR Pipe' AND b.brand_id = p.brand_id AND b.brand_name = 'Royal' AND c.category_id = p.category_id;

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'PR2025', '25mm', 'PN20', 520, 0
FROM products p, brands b, categories c
WHERE p.product_name = 'PPR Pipe' AND b.brand_id = p.brand_id AND b.brand_name = 'Royal' AND c.category_id = p.category_id;

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'PR1632', '32mm', 'PN16', 718, 0
FROM products p, brands b, categories c
WHERE p.product_name = 'PPR Pipe' AND b.brand_id = p.brand_id AND b.brand_name = 'Royal' AND c.category_id = p.category_id;

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'PR2032', '32mm', 'PN20', 848, 0
FROM products p, brands b, categories c
WHERE p.product_name = 'PPR Pipe' AND b.brand_id = p.brand_id AND b.brand_name = 'Royal' AND c.category_id = p.category_id;

-- Master PPR Elbows
INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'EM25', '25mm', '', 30, 0
FROM products p, brands b
WHERE p.product_name = 'PPR Elbow' AND b.brand_id = p.brand_id AND b.brand_name = 'Master';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'EM32', '32mm', '', 50, 0
FROM products p, brands b
WHERE p.product_name = 'PPR Elbow' AND b.brand_id = p.brand_id AND b.brand_name = 'Master';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'EM2545', '25mm', '45°', 35, 0
FROM products p, brands b
WHERE p.product_name = 'PPR Elbow' AND b.brand_id = p.brand_id AND b.brand_name = 'Master';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'EM252', '25x1/2"', '', 122, 0
FROM products p, brands b
WHERE p.product_name = 'PPR Elbow' AND b.brand_id = p.brand_id AND b.brand_name = 'Master';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'EM322', '32x1/2"', '', 212, 0
FROM products p, brands b
WHERE p.product_name = 'PPR Elbow' AND b.brand_id = p.brand_id AND b.brand_name = 'Master';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'EM254', '25x3/4"', '', 144, 0
FROM products p, brands b
WHERE p.product_name = 'PPR Elbow' AND b.brand_id = p.brand_id AND b.brand_name = 'Master';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'EM324', '32x3/4"', '', 232, 0
FROM products p, brands b
WHERE p.product_name = 'PPR Elbow' AND b.brand_id = p.brand_id AND b.brand_name = 'Master';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'EM2532', '25x32', '', 60, 0
FROM products p, brands b
WHERE p.product_name = 'PPR Elbow' AND b.brand_id = p.brand_id AND b.brand_name = 'Master';

-- Master PPR Mixer Elbow
INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'MEM', '25x1/2"', '', 334, 0
FROM products p, brands b
WHERE p.product_name = 'PPR Mixer Elbow' AND b.brand_id = p.brand_id AND b.brand_name = 'Master';

-- Master PPR Tees
INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'TM25', '25mm', '', 37, 0
FROM products p, brands b
WHERE p.product_name = 'PPR Tee' AND b.brand_id = p.brand_id AND b.brand_name = 'Master';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'TM32', '32mm', '', 60, 0
FROM products p, brands b
WHERE p.product_name = 'PPR Tee' AND b.brand_id = p.brand_id AND b.brand_name = 'Master';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'TM2532', '25x32', '', 55, 0
FROM products p, brands b
WHERE p.product_name = 'PPR Tee' AND b.brand_id = p.brand_id AND b.brand_name = 'Master';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'TM252', '25x1/2"', '', 135, 0
FROM products p, brands b
WHERE p.product_name = 'PPR Tee' AND b.brand_id = p.brand_id AND b.brand_name = 'Master';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'TM324', '32x3/4"', '', 210, 0
FROM products p, brands b
WHERE p.product_name = 'PPR Tee' AND b.brand_id = p.brand_id AND b.brand_name = 'Master';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'TM322', '32x1/2"', '', 200, 0
FROM products p, brands b
WHERE p.product_name = 'PPR Tee' AND b.brand_id = p.brand_id AND b.brand_name = 'Master';

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_products_department ON products(department_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_variants_size ON product_variants(size);
CREATE INDEX IF NOT EXISTS idx_categories_department ON categories(department_id);
CREATE INDEX IF NOT EXISTS idx_sales_variant ON sales_v2(variant_id);
CREATE INDEX IF NOT EXISTS idx_sales_timestamp ON sales_v2(timestamp);
CREATE INDEX IF NOT EXISTS idx_price_history_variant ON price_history(variant_id);

-- ============================================================================
-- INSERT DEFAULT USERS (if not exists)
-- ============================================================================
INSERT OR IGNORE INTO users (username, role, password_hash) VALUES
('admin', 'admin', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86AGR0Ht4A8'),
('cashier', 'cashier', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86AGR0Ht4A8');

-- ============================================================================
-- INSERT DEFAULT WAREHOUSE LOCATION
-- ============================================================================
INSERT OR IGNORE INTO warehouse_locations (location_name) VALUES ('Main Store');

-- ============================================================================
-- DATA MIGRATION COMPLETE
-- ============================================================================
-- Verify the migration
SELECT 'Migration Complete' as status;
SELECT COUNT(*) as departments FROM departments;
SELECT COUNT(*) as categories FROM categories;
SELECT COUNT(*) as brands FROM brands;
SELECT COUNT(*) as products FROM products;
SELECT COUNT(*) as variants FROM product_variants;

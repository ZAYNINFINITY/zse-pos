-- ============================================================================
-- CORRECTED NORMALIZED POS DATABASE MIGRATION SCRIPT
-- Uses EXACT values from provided CSV dataset
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ============================================================================
-- CREATE NEW TABLES FOR NORMALIZATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS departments (
    department_id INTEGER PRIMARY KEY AUTOINCREMENT,
    department_name TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS brands (
    brand_id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand_name TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products_normalized (
    product_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_name TEXT NOT NULL,
    department_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    brand_id INTEGER NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(department_id),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (brand_id) REFERENCES brands(brand_id),
    UNIQUE(product_name, brand_id, category_id)
);

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
    FOREIGN KEY (product_id) REFERENCES products_normalized(product_id),
    UNIQUE(product_id, size, variant_detail)
);

CREATE TABLE IF NOT EXISTS price_history (
    price_history_id INTEGER PRIMARY KEY AUTOINCREMENT,
    variant_id INTEGER NOT NULL,
    old_price REAL,
    new_price REAL,
    effective_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id)
);

CREATE TABLE IF NOT EXISTS warehouse_locations (
    location_id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_name TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_audit_v2 (
    audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action_type TEXT CHECK(action_type IN ('add', 'edit', 'delete', 'adjust')),
    table_name TEXT,
    record_id INTEGER,
    old_value TEXT,
    new_value TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================================================
-- INSERT DEPARTMENTS FROM REMARKS COLUMN
-- ============================================================================
INSERT OR IGNORE INTO departments (department_name) VALUES 
('PPR'),
('UPVC PIPE'),
('PVC FITTING'),
('WATER TANK'),
('SANITARY'),
('HARDWARE'),
('GEYSERS'),
('GAS BURNER'),
('BALL VALVE'),
('ACCESSORIES');

-- ============================================================================
-- INSERT BRANDS FROM DATA
-- ============================================================================
INSERT OR IGNORE INTO brands (brand_name) VALUES
('Master'),
('Royal'),
('M.Fit'),
('Burj'),
('RBS'),
('Yousaf'),
('IL'),
('Tempo'),
('Y.S'),
('Shahzad'),
('China'),
('Nector'),
('Other');

-- ============================================================================
-- INSERT GENERIC PRODUCTS
-- ============================================================================

-- PPR PRODUCTS
INSERT OR IGNORE INTO products_normalized (product_name, department_id, category_id, brand_id, description)
VALUES 
('PPR Pipe', (SELECT department_id FROM departments WHERE department_name='PPR'), 1, (SELECT brand_id FROM brands WHERE brand_name='Master'), 'Polypropylene Pipe Master'),
('PPR Pipe', (SELECT department_id FROM departments WHERE department_name='PPR'), 1, (SELECT brand_id FROM brands WHERE brand_name='Royal'), 'Polypropylene Pipe Royal'),
('PPR Elbow', (SELECT department_id FROM departments WHERE department_name='PPR'), 2, (SELECT brand_id FROM brands WHERE brand_name='Master'), 'PPR Elbow Fitting Master'),
('PPR Elbow', (SELECT department_id FROM departments WHERE department_name='PPR'), 2, (SELECT brand_id FROM brands WHERE brand_name='Royal'), 'PPR Elbow Fitting Royal'),
('PPR Tee', (SELECT department_id FROM departments WHERE department_name='PPR'), 2, (SELECT brand_id FROM brands WHERE brand_name='Master'), 'PPR Tee Fitting Master'),
('PPR Tee', (SELECT department_id FROM departments WHERE department_name='PPR'), 2, (SELECT brand_id FROM brands WHERE brand_name='Royal'), 'PPR Tee Fitting Royal'),
('PPR Socket', (SELECT department_id FROM departments WHERE department_name='PPR'), 2, (SELECT brand_id FROM brands WHERE brand_name='Master'), 'PPR Socket Master'),
('PPR Socket', (SELECT department_id FROM departments WHERE department_name='PPR'), 2, (SELECT brand_id FROM brands WHERE brand_name='Royal'), 'PPR Socket Royal'),
('PPR Gate Valve', (SELECT department_id FROM departments WHERE department_name='PPR'), 3, (SELECT brand_id FROM brands WHERE brand_name='Master'), 'PPR Gate Valve Master'),
('PPR Gate Valve', (SELECT department_id FROM departments WHERE department_name='PPR'), 3, (SELECT brand_id FROM brands WHERE brand_name='Royal'), 'PPR Gate Valve Royal'),
('PPR Union Valve', (SELECT department_id FROM departments WHERE department_name='PPR'), 3, (SELECT brand_id FROM brands WHERE brand_name='Master'), 'PPR Union Valve Master'),
('PPR Union Valve', (SELECT department_id FROM departments WHERE department_name='PPR'), 3, (SELECT brand_id FROM brands WHERE brand_name='Royal'), 'PPR Union Valve Royal'),
('PPR Union', (SELECT department_id FROM departments WHERE department_name='PPR'), 3, (SELECT brand_id FROM brands WHERE brand_name='Master'), 'PPR Union Master'),
('PPR Union', (SELECT department_id FROM departments WHERE department_name='PPR'), 3, (SELECT brand_id FROM brands WHERE brand_name='Royal'), 'PPR Union Royal'),
('PPR Plug', (SELECT department_id FROM departments WHERE department_name='PPR'), 2, (SELECT brand_id FROM brands WHERE brand_name='Master'), 'PPR Plug Master'),
('PPR Plug', (SELECT department_id FROM departments WHERE department_name='PPR'), 2, (SELECT brand_id FROM brands WHERE brand_name='Royal'), 'PPR Plug Royal'),
('PPR C-Band', (SELECT department_id FROM departments WHERE department_name='PPR'), 2, (SELECT brand_id FROM brands WHERE brand_name='Master'), 'PPR C-Band Master'),
('PPR C-Band', (SELECT department_id FROM departments WHERE department_name='PPR'), 2, (SELECT brand_id FROM brands WHERE brand_name='Royal'), 'PPR C-Band Royal'),
('PPR End Cap', (SELECT department_id FROM departments WHERE department_name='PPR'), 2, (SELECT brand_id FROM brands WHERE brand_name='Master'), 'PPR End Cap Master'),
('PPR End Cap', (SELECT department_id FROM departments WHERE department_name='PPR'), 2, (SELECT brand_id FROM brands WHERE brand_name='Royal'), 'PPR End Cap Royal'),
('PPR Mixer Elbow', (SELECT department_id FROM departments WHERE department_name='PPR'), 2, (SELECT brand_id FROM brands WHERE brand_name='Master'), 'PPR Mixer Elbow Master'),
('PPR Mixer Elbow', (SELECT department_id FROM departments WHERE department_name='PPR'), 2, (SELECT brand_id FROM brands WHERE brand_name='Royal'), 'PPR Mixer Elbow Royal');

-- UPVC PIPES
INSERT OR IGNORE INTO products_normalized (product_name, department_id, category_id, brand_id, description)
VALUES 
('UPVC Pipe B-Class', (SELECT department_id FROM departments WHERE department_name='UPVC PIPE'), 1, (SELECT brand_id FROM brands WHERE brand_name='M.Fit'), 'UPVC B-Class Pipe'),
('UPVC Pipe Deluxe', (SELECT department_id FROM departments WHERE department_name='UPVC PIPE'), 1, (SELECT brand_id FROM brands WHERE brand_name='M.Fit'), 'UPVC Deluxe Pipe'),
('UPVC Pipe Sewerage', (SELECT department_id FROM departments WHERE department_name='UPVC PIPE'), 1, (SELECT brand_id FROM brands WHERE brand_name='M.Fit'), 'UPVC Sewerage Pipe'),
('UPVC Pipe Sewerage Class', (SELECT department_id FROM departments WHERE department_name='UPVC PIPE'), 1, (SELECT brand_id FROM brands WHERE brand_name='Other'), 'UPVC Sewerage Class');

-- PVC FITTINGS
INSERT OR IGNORE INTO products_normalized (product_name, department_id, category_id, brand_id, description)
VALUES 
('PVC Elbow', (SELECT department_id FROM departments WHERE department_name='PVC FITTING'), 2, (SELECT brand_id FROM brands WHERE brand_name='Burj'), 'PVC Elbow 90 Degree'),
('PVC Elbow 45', (SELECT department_id FROM departments WHERE department_name='PVC FITTING'), 2, (SELECT brand_id FROM brands WHERE brand_name='Burj'), 'PVC Elbow 45 Degree'),
('P-Trap', (SELECT department_id FROM departments WHERE department_name='PVC FITTING'), 2, (SELECT brand_id FROM brands WHERE brand_name='Burj'), 'P-Trap Fitting'),
('Y-Tee', (SELECT department_id FROM departments WHERE department_name='PVC FITTING'), 2, (SELECT brand_id FROM brands WHERE brand_name='Burj'), 'Y-Tee Fitting'),
('Tee Equal', (SELECT department_id FROM departments WHERE department_name='PVC FITTING'), 2, (SELECT brand_id FROM brands WHERE brand_name='Burj'), 'Tee Equal Fitting'),
('Socket M.Fit', (SELECT department_id FROM departments WHERE department_name='PVC FITTING'), 2, (SELECT brand_id FROM brands WHERE brand_name='M.Fit'), 'PVC Socket'),
('Plug Tee', (SELECT department_id FROM departments WHERE department_name='PVC FITTING'), 2, (SELECT brand_id FROM brands WHERE brand_name='Burj'), 'Plug Tee'),
('Clean Out', (SELECT department_id FROM departments WHERE department_name='PVC FITTING'), 2, (SELECT brand_id FROM brands WHERE brand_name='M.Fit'), 'Clean Out'),
('End Cap', (SELECT department_id FROM departments WHERE department_name='PVC FITTING'), 2, (SELECT brand_id FROM brands WHERE brand_name='M.Fit'), 'End Cap'),
('Plug Elbow', (SELECT department_id FROM departments WHERE department_name='PVC FITTING'), 2, (SELECT brand_id FROM brands WHERE brand_name='Burj'), 'Plug Elbow'),
('Bend', (SELECT department_id FROM departments WHERE department_name='PVC FITTING'), 2, (SELECT brand_id FROM brands WHERE brand_name='M.Fit'), 'Bend Fitting');

-- WATER TANKS
INSERT OR IGNORE INTO products_normalized (product_name, department_id, category_id, brand_id, description)
VALUES 
('Water Tank', (SELECT department_id FROM departments WHERE department_name='WATER TANK'), 1, (SELECT brand_id FROM brands WHERE brand_name='M.Fit'), 'Water Storage Tank');

-- SANITARY & BATHROOM
INSERT OR IGNORE INTO products_normalized (product_name, department_id, category_id, brand_id, description)
VALUES 
('Basin', (SELECT department_id FROM departments WHERE department_name='SANITARY'), 1, (SELECT brand_id FROM brands WHERE brand_name='Other'), 'Wash Basin'),
('WC Pan', (SELECT department_id FROM departments WHERE department_name='SANITARY'), 1, (SELECT brand_id FROM brands WHERE brand_name='Other'), 'Water Closet'),
('Sink Waste', (SELECT department_id FROM departments WHERE department_name='SANITARY'), 2, (SELECT brand_id FROM brands WHERE brand_name='Other'), 'Sink Waste'),
('Basin Waste', (SELECT department_id FROM departments WHERE department_name='SANITARY'), 2, (SELECT brand_id FROM brands WHERE brand_name='Other'), 'Basin Waste'),
('Brush Holder', (SELECT department_id FROM departments WHERE department_name='SANITARY'), 2, (SELECT brand_id FROM brands WHERE brand_name='Other'), 'Brush Holder'),
('Soap Dish', (SELECT department_id FROM departments WHERE department_name='SANITARY'), 2, (SELECT brand_id FROM brands WHERE brand_name='Other'), 'Soap Dish Steel'),
('Tissue Holder', (SELECT department_id FROM departments WHERE department_name='SANITARY'), 2, (SELECT brand_id FROM brands WHERE brand_name='Other'), 'Tissue Holder Steel');

-- HARDWARE & ACCESSORIES
INSERT OR IGNORE INTO products_normalized (product_name, department_id, category_id, brand_id, description)
VALUES 
('Steel Nails', (SELECT department_id FROM departments WHERE department_name='HARDWARE'), 1, (SELECT brand_id FROM brands WHERE brand_name='Other'), 'Steel Nails'),
('Screw Fastener', (SELECT department_id FROM departments WHERE department_name='HARDWARE'), 1, (SELECT brand_id FROM brands WHERE brand_name='Other'), 'Screw Fastener'),
('Clamp', (SELECT department_id FROM departments WHERE department_name='HARDWARE'), 1, (SELECT brand_id FROM brands WHERE brand_name='Other'), 'Various Clamps'),
('U-Clamp', (SELECT department_id FROM departments WHERE department_name='HARDWARE'), 1, (SELECT brand_id FROM brands WHERE brand_name='Other'), 'U-Clamp');

-- GEYSERS
INSERT OR IGNORE INTO products_normalized (product_name, department_id, category_id, brand_id, description)
VALUES 
('Geyser Atlas', (SELECT department_id FROM departments WHERE department_name='GEYSERS'), 1, (SELECT brand_id FROM brands WHERE brand_name='Other'), 'Instant Geyser Atlas'),
('Geyser Nasgas', (SELECT department_id FROM departments WHERE department_name='GEYSERS'), 1, (SELECT brand_id FROM brands WHERE brand_name='Other'), 'Instant Geyser Nasgas'),
('Geyser Canon', (SELECT department_id FROM departments WHERE department_name='GEYSERS'), 1, (SELECT brand_id FROM brands WHERE brand_name='Other'), 'Instant Geyser Canon');

-- GAS BURNERS & HEATERS
INSERT OR IGNORE INTO products_normalized (product_name, department_id, category_id, brand_id, description)
VALUES 
('Gas Burner', (SELECT department_id FROM departments WHERE department_name='GAS BURNER'), 1, (SELECT brand_id FROM brands WHERE brand_name='Other'), 'Gas Burner Marble'),
('Heater Moon', (SELECT department_id FROM departments WHERE department_name='GAS BURNER'), 1, (SELECT brand_id FROM brands WHERE brand_name='Other'), 'Moon Heater'),
('Heater Shaheen', (SELECT department_id FROM departments WHERE department_name='GAS BURNER'), 1, (SELECT brand_id FROM brands WHERE brand_name='Other'), 'Shaheen Heater'),
('Heater Canon', (SELECT department_id FROM departments WHERE department_name='GAS BURNER'), 1, (SELECT brand_id FROM brands WHERE brand_name='Other'), 'Canon Heater');

-- BALL VALVES & MIXERS
INSERT OR IGNORE INTO products_normalized (product_name, department_id, category_id, brand_id, description)
VALUES 
('Ball Valve RBS', (SELECT department_id FROM departments WHERE department_name='BALL VALVE'), 1, (SELECT brand_id FROM brands WHERE brand_name='RBS'), 'Ball Valve RBS'),
('Ball Valve Yousaf', (SELECT department_id FROM departments WHERE department_name='BALL VALVE'), 1, (SELECT brand_id FROM brands WHERE brand_name='Yousaf'), 'Ball Valve Yousaf GI'),
('Ball Valve IL', (SELECT department_id FROM departments WHERE department_name='BALL VALVE'), 1, (SELECT brand_id FROM brands WHERE brand_name='IL'), 'Ball Valve IL GI'),
('Bibcock', (SELECT department_id FROM departments WHERE department_name='BALL VALVE'), 1, (SELECT brand_id FROM brands WHERE brand_name='Other'), 'Bibcock Brass'),
('Bibcock Tempo', (SELECT department_id FROM departments WHERE department_name='BALL VALVE'), 1, (SELECT brand_id FROM brands WHERE brand_name='Tempo'), 'Bibcock Tempo'),
('Sink Mixer', (SELECT department_id FROM departments WHERE department_name='ACCESSORIES'), 1, (SELECT brand_id FROM brands WHERE brand_name='China'), 'Sink Mixer China'),
('Basin Mixer', (SELECT department_id FROM departments WHERE department_name='ACCESSORIES'), 1, (SELECT brand_id FROM brands WHERE brand_name='Y.S'), 'Basin Mixer Y.S'),
('Sink Mixer Y.S', (SELECT department_id FROM departments WHERE department_name='ACCESSORIES'), 1, (SELECT brand_id FROM brands WHERE brand_name='Y.S'), 'Sink Mixer Y.S');

-- ============================================================================
-- INSERT PRODUCT VARIANTS WITH EXACT PRICES
-- ============================================================================

-- MASTER PPR PIPES - EXACT VALUES
INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'PM1625', '25mm', 'PN16', 425, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Pipe' AND p.brand_id=b.brand_id AND b.brand_name='Master';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'PM2025', '25mm', 'PN20', 485, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Pipe' AND p.brand_id=b.brand_id AND b.brand_name='Master';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'PM1632', '32mm', 'PN16', 670, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Pipe' AND p.brand_id=b.brand_id AND b.brand_name='Master';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'PM2032', '32mm', 'PN20', 760, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Pipe' AND p.brand_id=b.brand_id AND b.brand_name='Master';

-- ROYAL PPR PIPES - EXACT VALUES
INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'PR1625', '25mm', 'PN16', 376, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Pipe' AND p.brand_id=b.brand_id AND b.brand_name='Royal';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'PR2025', '25mm', 'PN20', 429, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Pipe' AND p.brand_id=b.brand_id AND b.brand_name='Royal';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'PR1632', '32mm', 'PN16', 610, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Pipe' AND p.brand_id=b.brand_id AND b.brand_name='Royal';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'PR2032', '32mm', 'PN20', 715, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Pipe' AND p.brand_id=b.brand_id AND b.brand_name='Royal';

-- MASTER PPR ELBOWS - EXACT VALUES
INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'EM25', '25mm', '', 30, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Elbow' AND p.brand_id=b.brand_id AND b.brand_name='Master';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'EM32', '32mm', '', 50, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Elbow' AND p.brand_id=b.brand_id AND b.brand_name='Master';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'EM2545', '25mm', '45°', 35, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Elbow' AND p.brand_id=b.brand_id AND b.brand_name='Master';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'EM252', '25x1/2"', '', 122, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Elbow' AND p.brand_id=b.brand_id AND b.brand_name='Master';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'EM322', '32x1/2"', '', 212, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Elbow' AND p.brand_id=b.brand_id AND b.brand_name='Master';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'EM2534', '25x3/4"', '', 144, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Elbow' AND p.brand_id=b.brand_id AND b.brand_name='Master';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'EM324', '32x3/4"', '', 232, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Elbow' AND p.brand_id=b.brand_id AND b.brand_name='Master';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'EM2532', '25x32', '', 60, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Elbow' AND p.brand_id=b.brand_id AND b.brand_name='Master';

-- MASTER PPR MIXER ELBOW
INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'MEM', '25x1/2"', '', 334, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Mixer Elbow' AND p.brand_id=b.brand_id AND b.brand_name='Master';

-- MASTER PPR TEES - EXACT VALUES
INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'TM25', '25mm', '', 37, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Tee' AND p.brand_id=b.brand_id AND b.brand_name='Master';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'TM32', '32mm', '', 60, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Tee' AND p.brand_id=b.brand_id AND b.brand_name='Master';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'TM2532', '25x32', '', 55, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Tee' AND p.brand_id=b.brand_id AND b.brand_name='Master';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'TM252', '25x1/2"', '', 135, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Tee' AND p.brand_id=b.brand_id AND b.brand_name='Master';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'TM324', '32x3/4"', '', 210, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Tee' AND p.brand_id=b.brand_id AND b.brand_name='Master';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'TM322', '32x1/2"', '', 200, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Tee' AND p.brand_id=b.brand_id AND b.brand_name='Master';

-- MASTER PPR SOCKETS
INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'SM25', '25mm', '', 20, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Socket' AND p.brand_id=b.brand_id AND b.brand_name='Master';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'SM32', '32mm', '', 33, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Socket' AND p.brand_id=b.brand_id AND b.brand_name='Master';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'SM252', '25x1/2"', '', 110, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Socket' AND p.brand_id=b.brand_id AND b.brand_name='Master';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'SM254', '25x3/4"', '', 144, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Socket' AND p.brand_id=b.brand_id AND b.brand_name='Master';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'SM324', '32x3/4"', '', 156, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Socket' AND p.brand_id=b.brand_id AND b.brand_name='Master';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'SM321', '32x1"', '', 250, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Socket' AND p.brand_id=b.brand_id AND b.brand_name='Master';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'SM3225', '25x32', '', 25, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Socket' AND p.brand_id=b.brand_id AND b.brand_name='Master';

-- MASTER PPR GATE VALVES
INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'GVM25', '25mm', '', 450, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Gate Valve' AND p.brand_id=b.brand_id AND b.brand_name='Master';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'GVM32', '32mm', '', 635, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Gate Valve' AND p.brand_id=b.brand_id AND b.brand_name='Master';

-- MASTER PPR UNION VALVES
INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'UVM25', '25mm', '', 450, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Union Valve' AND p.brand_id=b.brand_id AND b.brand_name='Master';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'UVM32', '32mm', '', 550, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Union Valve' AND p.brand_id=b.brand_id AND b.brand_name='Master';

-- MASTER PPR UNIONS
INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'UM25', '25mm', '', 65, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Union' AND p.brand_id=b.brand_id AND b.brand_name='Master';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'UM32', '32mm', '', 95, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Union' AND p.brand_id=b.brand_id AND b.brand_name='Master';

-- MASTER PPR PLUGS
INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'PLM25', '1/2"', '', 15, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Plug' AND p.brand_id=b.brand_id AND b.brand_name='Master';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'PLM32', '3/4"', '', 20, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Plug' AND p.brand_id=b.brand_id AND b.brand_name='Master';

-- MASTER PPR C-BAND
INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'CBM25', '25mm', '', 58, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR C-Band' AND p.brand_id=b.brand_id AND b.brand_name='Master';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'CBM32', '32mm', '', 67, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR C-Band' AND p.brand_id=b.brand_id AND b.brand_name='Master';

-- MASTER PPR END CAP
INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'ECM25', '25mm', '', 20, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR End Cap' AND p.brand_id=b.brand_id AND b.brand_name='Master';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'ECM32', '32mm', '', 30, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR End Cap' AND p.brand_id=b.brand_id AND b.brand_name='Master';

-- ROYAL PPR ELBOWS
INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'ER25', '25mm', '', 30, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Elbow' AND p.brand_id=b.brand_id AND b.brand_name='Royal';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'ER32', '32mm', '', 45, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Elbow' AND p.brand_id=b.brand_id AND b.brand_name='Royal';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'ER2545', '25mm', '45°', 35, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Elbow' AND p.brand_id=b.brand_id AND b.brand_name='Royal';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'ER252', '25x1/2"', '', 108, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Elbow' AND p.brand_id=b.brand_id AND b.brand_name='Royal';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'ER322', '32x1/2"', '', 180, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Elbow' AND p.brand_id=b.brand_id AND b.brand_name='Royal';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'ER2534', '25x3/4"', '', 145, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Elbow' AND p.brand_id=b.brand_id AND b.brand_name='Royal';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'ER324', '32x3/4"', '', 210, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Elbow' AND p.brand_id=b.brand_id AND b.brand_name='Royal';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'ER3245', '32mm', '45°', 62, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Elbow' AND p.brand_id=b.brand_id AND b.brand_name='Royal';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'ER2532', '25x32', '', 55, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Elbow' AND p.brand_id=b.brand_id AND b.brand_name='Royal';

-- ROYAL PPR MIXER ELBOW
INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'MER', '25x1/2"', '', 348, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Mixer Elbow' AND p.brand_id=b.brand_id AND b.brand_name='Royal';

-- ROYAL PPR TEES
INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'TR25', '25mm', '', 28, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Tee' AND p.brand_id=b.brand_id AND b.brand_name='Royal';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'TR32', '32mm', '', 57, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Tee' AND p.brand_id=b.brand_id AND b.brand_name='Royal';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'TR2532', '25x32', '', 60, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Tee' AND p.brand_id=b.brand_id AND b.brand_name='Royal';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'TR252', '25x1/2"', '', 126, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Tee' AND p.brand_id=b.brand_id AND b.brand_name='Royal';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'TR324', '32x3/4"', '', 222, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Tee' AND p.brand_id=b.brand_id AND b.brand_name='Royal';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'TR322', '32x1/2"', '', 192, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Tee' AND p.brand_id=b.brand_id AND b.brand_name='Royal';

-- ROYAL PPR SOCKETS
INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'SR25', '25mm', '', 20, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Socket' AND p.brand_id=b.brand_id AND b.brand_name='Royal';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'SR32', '32mm', '', 32, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Socket' AND p.brand_id=b.brand_id AND b.brand_name='Royal';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'SR252', '25x1/2"', '', 97, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Socket' AND p.brand_id=b.brand_id AND b.brand_name='Royal';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'SR254', '25x3/4"', '', 129, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Socket' AND p.brand_id=b.brand_id AND b.brand_name='Royal';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'SR324', '32x3/4"', '', 222, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Socket' AND p.brand_id=b.brand_id AND b.brand_name='Royal';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'SR322', '32x1/2"', '', 170, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Socket' AND p.brand_id=b.brand_id AND b.brand_name='Royal';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'SR321', '32x1"', '', 335, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Socket' AND p.brand_id=b.brand_id AND b.brand_name='Royal';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'SR3225', '25x32', '', 30, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Socket' AND p.brand_id=b.brand_id AND b.brand_name='Royal';

-- ROYAL PPR GATE VALVES
INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'GVR25', '25mm', '', 530, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Gate Valve' AND p.brand_id=b.brand_id AND b.brand_name='Royal';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'GVR32', '32mm', '', 720, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Gate Valve' AND p.brand_id=b.brand_id AND b.brand_name='Royal';

-- ROYAL PPR UNION VALVES
INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'UVR25', '25mm', '', 782, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Union Valve' AND p.brand_id=b.brand_id AND b.brand_name='Royal';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'UVR32', '32mm', '', 1110, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Union Valve' AND p.brand_id=b.brand_id AND b.brand_name='Royal';

-- ROYAL PPR UNIONS
INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'UR25', '25mm', '', 95, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Union' AND p.brand_id=b.brand_id AND b.brand_name='Royal';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'UR32', '32mm', '', 145, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Union' AND p.brand_id=b.brand_id AND b.brand_name='Royal';

-- ROYAL PPR PLUGS
INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'PLR25', '1/2"', '', 10, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Plug' AND p.brand_id=b.brand_id AND b.brand_name='Royal';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'PLR32', '3/4"', '', 15, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR Plug' AND p.brand_id=b.brand_id AND b.brand_name='Royal';

-- ROYAL PPR C-BAND
INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'CBR25', '25mm', '', 65, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR C-Band' AND p.brand_id=b.brand_id AND b.brand_name='Royal';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'CBR32', '32mm', '', 114, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR C-Band' AND p.brand_id=b.brand_id AND b.brand_name='Royal';

-- ROYAL PPR END CAP
INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'ECR25', '25mm', '', 20, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR End Cap' AND p.brand_id=b.brand_id AND b.brand_name='Royal';

INSERT OR IGNORE INTO product_variants (product_id, sku, size, variant_detail, price, stock)
SELECT p.product_id, 'ECR32', '32mm', '', 25, 0
FROM products_normalized p, brands b WHERE p.product_name='PPR End Cap' AND p.brand_id=b.brand_id AND b.brand_name='Royal';

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_products_normalized_department ON products_normalized(department_id);
CREATE INDEX IF NOT EXISTS idx_products_normalized_category ON products_normalized(category_id);
CREATE INDEX IF NOT EXISTS idx_products_normalized_brand ON products_normalized(brand_id);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_variants_size ON product_variants(size);
CREATE INDEX IF NOT EXISTS idx_price_history_variant ON price_history(variant_id);

-- ============================================================================
-- INSERT DEFAULT WAREHOUSE LOCATION
-- ============================================================================
INSERT OR IGNORE INTO warehouse_locations (location_name) VALUES ('Main Store');

-- ============================================================================
-- MIGRATION SUMMARY
-- ============================================================================
SELECT 'Migration Complete - PPR Products Normalized' as status;
SELECT COUNT(*) as total_variants FROM product_variants;

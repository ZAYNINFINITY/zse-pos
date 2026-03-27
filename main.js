let app, BrowserWindow, ipcMain, dialog;

try {
  const electronModule = require("electron");

  if (!electronModule) {
    throw new Error("Electron module not found");
  }

  // When this file is accidentally executed under plain Node (or when the host
  // environment sets ELECTRON_RUN_AS_NODE), `require("electron")` returns the
  // path to the Electron executable instead of the Electron API object.
  // Relaunch under Electron with ELECTRON_RUN_AS_NODE removed.
  if (typeof electronModule === "string") {
    const { spawn } = require("child_process");
    const env = { ...process.env };
    delete env.ELECTRON_RUN_AS_NODE;

    const child = spawn(electronModule, [__dirname, ...process.argv.slice(2)], {
      stdio: "inherit",
      windowsHide: false,
      env,
      detached: true,
    });

    child.unref();

    // Do not continue booting under Node.
    process.exit(0);
  }

  // Destructure from the loaded module
  app = electronModule.app;
  BrowserWindow = electronModule.BrowserWindow;
  ipcMain = electronModule.ipcMain;
  dialog = electronModule.dialog;
} catch (error) {
  console.error("FATAL: Cannot load Electron!");
  console.error("Error:", error.message);
  console.error("\nTo fix this, run:");
  console.error("  npm install");
  console.error("  npm install --save-dev electron");
  process.exit(1);
}

const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const crypto = require("crypto");

// Load environment variables
require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

let Database;
try {
  Database = require("better-sqlite3");
} catch (error) {
  console.error("FATAL: Cannot load database module (better-sqlite3).");
  console.error("Error:", error.message);
  console.error("\nTo fix this, run:");
  console.error("  npm install");
  console.error("  npm install --save better-sqlite3");
  process.exit(1);
}

// Windows 7/8 compatibility flags
if (process.platform === "win32") {
  process.env.NODE_ENV_COMPAT = "true";
}

let mainWindow;
let db;

// Optimize for low-end hardware - disable GPU acceleration
if (app && app.disableHardwareAcceleration) {
  try {
    app.disableHardwareAcceleration();
  } catch (err) {
    console.warn("Could not disable hardware acceleration:", err.message);
  }
}

function isHashedPassword(stored) {
  return typeof stored === "string" && stored.startsWith("pbkdf2$");
}

function hashPassword(plain) {
  if (typeof plain !== "string" || plain.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }
  const iterations = 210000;
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(plain, salt, iterations, 32, "sha256");
  return `pbkdf2$sha256$${iterations}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

function verifyPassword(stored, provided) {
  if (typeof provided !== "string") return false;
  if (!isHashedPassword(stored)) {
    return stored === provided;
  }

  const parts = stored.split("$");
  if (parts.length !== 5) return false;
  const [prefix, algo, iterStr, saltB64, hashB64] = parts;
  if (prefix !== "pbkdf2") return false;
  if (algo !== "sha256") return false;
  const iterations = Number(iterStr);
  if (!Number.isFinite(iterations) || iterations < 10000) return false;

  const salt = Buffer.from(saltB64, "base64");
  const expected = Buffer.from(hashB64, "base64");
  const actual = crypto.pbkdf2Sync(provided, salt, iterations, expected.length, "sha256");
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    icon: fs.existsSync(path.join(__dirname, "assets", "icon.png"))
      ? path.join(__dirname, "assets", "icon.png")
      : undefined,
  });

  mainWindow.loadURL(
    process.env.NODE_ENV === "development"
      ? "http://localhost:5173"
      : `file://${path.join(__dirname, "dist/index.html")}`,
  );

  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }
}

function initializeDatabase() {
  if (!Database) {
    console.error("FATAL: Database module (better-sqlite3) not available");
    process.exit(1);
  }

  const dbPath = path.join(app.getPath("userData"), "zse-pos.db");

  try {
    db = new Database(dbPath);
    db.pragma("foreign_keys = ON");
    db.pragma("journal_mode = WAL");

    // Create tables with enhanced schema
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'cashier',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        sku TEXT UNIQUE,
        category_id INTEGER,
        cost_price REAL DEFAULT 0,
        price REAL NOT NULL,
        stock INTEGER DEFAULT 0,
        barcode TEXT UNIQUE,
        image_path TEXT,
        tax_rate REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      );

      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS discount_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        discount_type TEXT NOT NULL DEFAULT 'percentage',
        discount_value REAL NOT NULL,
        min_purchase REAL DEFAULT 0,
        max_discount REAL,
        valid_from DATETIME,
        valid_until DATETIME,
        is_active INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        user_id INTEGER,
        subtotal REAL NOT NULL,
        tax_amount REAL DEFAULT 0,
        discount_amount REAL DEFAULT 0,
        discount_code TEXT,
        total REAL NOT NULL,
        payment_method TEXT NOT NULL,
        payment_details TEXT,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_returned INTEGER DEFAULT 0,
        returned_date DATETIME,
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER,
        product_id INTEGER,
        variant_id INTEGER,
        sku TEXT,
        size TEXT,
        variant_detail TEXT,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        cost_price REAL DEFAULT 0,
        discount REAL DEFAULT 0,
        total REAL NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sales(id),
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id)
      );

      CREATE TABLE IF NOT EXISTS invoices (
        invoice_id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL UNIQUE,
        customer_phone TEXT,
        invoice_number TEXT UNIQUE,
        invoice_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'pending',
        pdf_path TEXT,
        whatsapp_status TEXT DEFAULT 'not_sent',
        whatsapp_message_id TEXT,
        whatsapp_sent_at DATETIME,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sale_id) REFERENCES sales(id)
      );

      CREATE TABLE IF NOT EXISTS stock_adjustments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        adjustment_type TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        reason TEXT,
        notes TEXT,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS quotations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quotation_number TEXT UNIQUE NOT NULL,
        customer_id INTEGER,
        customer_name TEXT,
        customer_phone TEXT,
        items JSON NOT NULL,
        subtotal REAL NOT NULL,
        tax REAL DEFAULT 0,
        total REAL NOT NULL,
        status TEXT DEFAULT 'ACTIVE',
        notes TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        converted_to_sale_id INTEGER,
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS customer_credits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL UNIQUE,
        credit_limit REAL DEFAULT 0,
        current_balance REAL DEFAULT 0,
        total_purchased REAL DEFAULT 0,
        total_paid REAL DEFAULT 0,
        status TEXT DEFAULT 'ACTIVE',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      );

      CREATE TABLE IF NOT EXISTS credit_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        transaction_type TEXT NOT NULL,
        amount REAL NOT NULL,
        sale_id INTEGER,
        payment_id INTEGER,
        reference TEXT,
        notes TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      );
    `);

    // Migrate existing products to add new columns if they don't exist
    const addColumnIfNotExists = (table, column, definition) => {
      try {
        const columns = db.prepare(`PRAGMA table_info(${table})`).all();
        const columnExists = columns.some((col) => col.name === column);
        if (!columnExists) {
          db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
        }
      } catch (err) {
        if (!err.message.includes("duplicate column")) {
          console.error(`Error adding column ${column} to ${table}:`, err);
        }
      }
    };

    // Add columns safely
    addColumnIfNotExists("products", "sku", "TEXT");
    addColumnIfNotExists("products", "cost_price", "REAL DEFAULT 0");
    addColumnIfNotExists("products", "image_path", "TEXT");
    addColumnIfNotExists("products", "tax_rate", "REAL DEFAULT 0");
    addColumnIfNotExists("sales", "subtotal", "REAL");
    addColumnIfNotExists("sales", "tax_amount", "REAL DEFAULT 0");
    addColumnIfNotExists("sales", "discount_amount", "REAL DEFAULT 0");
    addColumnIfNotExists("sales", "discount_code", "TEXT");
    addColumnIfNotExists("sales", "user_id", "INTEGER");
    addColumnIfNotExists("sales", "payment_details", "TEXT");
    addColumnIfNotExists("sales", "is_returned", "INTEGER DEFAULT 0");
    addColumnIfNotExists("sales", "returned_date", "DATETIME");
    addColumnIfNotExists("sale_items", "unit_price", "REAL");
    addColumnIfNotExists("sale_items", "cost_price", "REAL DEFAULT 0");
    addColumnIfNotExists("sale_items", "discount", "REAL DEFAULT 0");
    addColumnIfNotExists("sale_items", "total", "REAL");

    // Create AI recommendations table
    db.exec(`
      CREATE TABLE IF NOT EXISTS products_recommendations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        recommended_product_id INTEGER NOT NULL,
        score REAL DEFAULT 0.5,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (recommended_product_id) REFERENCES products(id)
      )
    `);

    // No seed data: setup wizard handles first-run configuration.
  } catch (err) {
    console.error("Database initialization error: ", err);
    process.exit(1);
  }

  // Auto-backup function
  setInterval(
    () => {
      const backupPath = path.join(app.getPath("userData"), "backups");
      if (!fs.existsSync(backupPath)) {
        fs.mkdirSync(backupPath, { recursive: true });
      }
      const backupFile = path.join(
        backupPath,
        `backup_${new Date().toISOString().split("T")[0]}.db`,
      );
      try {
        if (fs.existsSync(dbPath)) {
          fs.copyFileSync(dbPath, backupFile);
        }
      } catch (backupErr) {
        console.warn("Backup failed:", backupErr.message);
      }
    },
    24 * 60 * 60 * 1000,
  ); // Daily backup
}

function preloadSampleProducts() {
  // Intentionally disabled: do not ship or auto-insert demo data.
}

// Only initialize if app loaded successfully
if (!app) {
  console.error("FATAL: Electron app not loaded");
  process.exit(1);
}

app.whenReady().then(() => {
  initializeDatabase();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// IPC handlers
// Updated to support both legacy products and new variant schema
ipcMain.handle("get-products", async () => {
  try {
    // Query from product_variants with joins to normalized schema
    // Falls back to legacy products table if variants don't exist
    const variantRows = db
      .prepare(
        `
      SELECT 
        pv.variant_id as id,
        pn.product_name as name,
        pv.sku,
        pv.size,
        pv.variant_detail,
        pv.price,
        pv.stock,
        c.name as category_name,
        d.department_name,
        b.brand_name
      FROM product_variants pv
      JOIN products_normalized pn ON pv.product_id = pn.product_id
      LEFT JOIN categories c ON pn.category_id = c.id
      LEFT JOIN departments d ON pn.department_id = d.department_id
      LEFT JOIN brands b ON pn.brand_id = b.brand_id
      ORDER BY b.brand_name, pn.product_name, pv.size
    `,
      )
      .all();

    // If no variants exist, fall back to legacy products
    if (variantRows.length === 0) {
      return db
        .prepare(
          `
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id
      `,
        )
        .all();
    }

    return variantRows;
  } catch (err) {
    // Fall back to legacy products if variants table doesn't exist
    try {
      return db
        .prepare(
          `
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id
      `,
        )
        .all();
    } catch (e) {
      throw e;
    }
  }
});

ipcMain.handle("add-product", async (event, product) => {
  try {
    const result = db
      .prepare(
        `
      INSERT INTO products (name, sku, category_id, cost_price, price, stock, barcode, image_path, tax_rate) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      )
      .run(
        product.name,
        product.sku || null,
        product.categoryId,
        product.costPrice || 0,
        product.price,
        product.stock || 0,
        product.barcode || null,
        product.imagePath || null,
        product.taxRate || 0,
      );
    return { id: result.lastInsertRowid };
  } catch (err) {
    throw err;
  }
});

// Get variants for a specific product (by product_id or sku)
ipcMain.handle("get-product-variants", async (event, productId) => {
  try {
    const rows = db
      .prepare(
        `
      SELECT 
        pv.variant_id as id,
        pv.product_id,
        pv.sku,
        pv.size,
        pv.variant_detail,
        pv.price,
        pv.stock,
        pn.product_name,
        b.brand_name
      FROM product_variants pv
      JOIN products_normalized pn ON pv.product_id = pn.product_id
      LEFT JOIN brands b ON pn.brand_id = b.brand_id
      WHERE pv.product_id = ?
      ORDER BY pv.size, pv.variant_detail
    `,
      )
      .all(productId);
    return rows || [];
  } catch (err) {
    return [];
  }
});

// Get variant details by SKU (for POS scanning)
ipcMain.handle("get-variant-by-sku", async (event, sku) => {
  try {
    const row = db
      .prepare(
        `
      SELECT 
        pv.variant_id as id,
        pv.product_id,
        pv.sku,
        pv.size,
        pv.variant_detail,
        pv.price,
        pv.stock,
        pn.product_name,
        d.department_name,
        c.name as category_name,
        b.brand_name
      FROM product_variants pv
      JOIN products_normalized pn ON pv.product_id = pn.product_id
      LEFT JOIN departments d ON pn.department_id = d.department_id
      LEFT JOIN categories c ON pn.category_id = c.id
      LEFT JOIN brands b ON pn.brand_id = b.brand_id
      WHERE pv.sku = ?
      LIMIT 1
    `,
      )
      .get(sku);
    return row || null;
  } catch (err) {
    return null;
  }
});

// Update variant stock
ipcMain.handle("update-variant-stock", async (event, variantId, newStock) => {
  try {
    const result = db
      .prepare("UPDATE product_variants SET stock = ? WHERE variant_id = ?")
      .run(newStock, variantId);
    return { changes: result.changes };
  } catch (err) {
    throw err;
  }
});

ipcMain.handle("get-categories", async () => {
  try {
    const rows = db.prepare("SELECT * FROM categories").all();
    return rows;
  } catch (err) {
    throw err;
  }
});

ipcMain.handle("add-category", async (event, name) => {
  try {
    const result = db
      .prepare("INSERT INTO categories (name) VALUES (?)")
      .run(name);
    return { id: result.lastInsertRowid };
  } catch (err) {
    throw err;
  }
});

ipcMain.handle("update-stock", async (event, productId, newStock) => {
  try {
    const result = db
      .prepare("UPDATE products SET stock = ? WHERE id = ?")
      .run(newStock, productId);
    return { changes: result.changes };
  } catch (err) {
    throw err;
  }
});

ipcMain.handle("get-customers", async () => {
  try {
    const rows = db.prepare("SELECT * FROM customers").all();
    return rows;
  } catch (err) {
    throw err;
  }
});

ipcMain.handle("add-customer", async (event, customer) => {
  try {
    const result = db
      .prepare("INSERT INTO customers (name, phone, email) VALUES (?, ?, ?)")
      .run(customer.name, customer.phone, customer.email);
    return { id: result.lastInsertRowid };
  } catch (err) {
    throw err;
  }
});

ipcMain.handle("delete-customer", async (event, customerId) => {
  try {
    // Check if customer has any sales
    const row = db
      .prepare("SELECT COUNT(*) as count FROM sales WHERE customer_id = ?")
      .get(customerId);
    if (row.count > 0) {
      throw new Error("Cannot delete customer with existing sales");
    }
    const result = db
      .prepare("DELETE FROM customers WHERE id = ?")
      .run(customerId);
    return { changes: result.changes };
  } catch (err) {
    throw err;
  }
});

ipcMain.handle("create-sale", async (event, sale) => {
  try {
    const subtotal =
      sale.subtotal ||
      sale.items.reduce(
        (sum, item) => sum + (item.unitPrice || item.price) * item.quantity,
        0,
      );
    const taxAmount = sale.taxAmount || 0;
    const discountAmount = sale.discountAmount || 0;
    const total = sale.total || subtotal + taxAmount - discountAmount;

    // Use transaction for atomic operation
    const createSaleTransaction = db.transaction(() => {
      const saleResult = db
        .prepare(
          `
        INSERT INTO sales (customer_id, user_id, subtotal, tax_amount, discount_amount, 
          discount_code, total, payment_method, payment_details) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        )
        .run(
          sale.customerId || null,
          sale.userId || null,
          subtotal,
          taxAmount,
          discountAmount,
          sale.discountCode || null,
          total,
          sale.paymentMethod,
          sale.paymentDetails || null,
        );

      const saleId = saleResult.lastInsertRowid;

      if (sale.items.length > 0) {
        const insertItem = db.prepare(`
          INSERT INTO sale_items (sale_id, product_id, variant_id, sku, size, variant_detail, 
            quantity, unit_price, cost_price, discount, total) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const updateVariantStock = db.prepare(
          "UPDATE product_variants SET stock = stock - ? WHERE variant_id = ?",
        );

        const updateProductStock = db.prepare(
          "UPDATE products SET stock = stock - ? WHERE id = ?",
        );

        for (const item of sale.items) {
          const unitPrice = item.unitPrice || item.price;
          const costPrice = item.costPrice || 0;
          const discount = item.discount || 0;
          const itemTotal = unitPrice * item.quantity - discount;

          // Support both variant (new) and legacy products
          if (item.variantId) {
            insertItem.run(
              saleId,
              null, // product_id is null for variants
              item.variantId,
              item.skul, // Note: sent as 'skul' from frontend (typo)
              item.size,
              item.variant_detail,
              item.quantity,
              unitPrice,
              costPrice,
              discount,
              itemTotal,
            );
            updateVariantStock.run(item.quantity, item.variantId);
          } else {
            // Legacy product handling
            insertItem.run(
              saleId,
              item.productId,
              null, // variant_id is null for legacy
              null,
              null,
              null,
              item.quantity,
              unitPrice,
              costPrice,
              discount,
              itemTotal,
            );
            updateProductStock.run(item.quantity, item.productId);
          }
        }
      }

      return saleId;
    });

    const saleId = createSaleTransaction();
    return { saleId };
  } catch (err) {
    throw new Error(`Sale processing error: ${err.message}`);
  }
});

// AI Recommendation handler
ipcMain.handle(
  "get-product-recommendations",
  async (event, productId, limit = 5) => {
    try {
      const rows = db
        .prepare(
          `
        SELECT DISTINCT p.*, COUNT(si.id) as purchase_frequency
        FROM products p
        LEFT JOIN sale_items si ON p.id = si.product_id
        WHERE p.category_id = (
          SELECT category_id FROM products WHERE id = ?
        ) AND p.id != ? AND p.stock > 0
        GROUP BY p.id
        ORDER BY purchase_frequency DESC, p.price DESC
        LIMIT ?
      `,
        )
        .all(productId, productId, limit);
      return rows || [];
    } catch (err) {
      console.error("Error getting recommendations:", err);
      return [];
    }
  },
);

// Cross-sell recommendations
ipcMain.handle(
  "get-cross-sell-recommendations",
  async (event, lastPurchasedProductIds = []) => {
    try {
      if (lastPurchasedProductIds.length === 0) {
        // Return best sellers if no history
        const rows = db
          .prepare(
            `
          SELECT p.*, COUNT(si.id) as total_sold
          FROM products p
          LEFT JOIN sale_items si ON p.id = si.product_id
          WHERE p.stock > 0
          GROUP BY p.id
          ORDER BY total_sold DESC
          LIMIT 5
        `,
          )
          .all();
        return rows || [];
      }

      // Get products frequently bought together
      const placeholders = lastPurchasedProductIds.map(() => "?").join(",");
      const rows = db
        .prepare(
          `
        SELECT DISTINCT p.*, COUNT(si.id) as co_purchase_freq
        FROM products p
        INNER JOIN sale_items si ON p.id = si.product_id
        WHERE si.sale_id IN (
          SELECT DISTINCT sale_id FROM sale_items 
          WHERE product_id IN (${placeholders})
        ) AND p.id NOT IN (${placeholders}) AND p.stock > 0
        GROUP BY p.id
        ORDER BY co_purchase_freq DESC
        LIMIT 5
      `,
        )
        .all(...[...lastPurchasedProductIds, ...lastPurchasedProductIds]);
      return rows || [];
    } catch (err) {
      return [];
    }
  },
);

ipcMain.handle("get-sales", async () => {
  try {
    const rows = db
      .prepare(
        `
      SELECT s.*, c.name as customer_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      ORDER BY s.date DESC
    `,
      )
      .all();
    return rows;
  } catch (err) {
    throw err;
  }
});

ipcMain.handle("print-receipt", (event, saleData) => {
  // For now, just log. In real app, use electron print
  console.log("Printing receipt:", saleData);
  mainWindow.webContents.print({ silent: true });
});

// User Management
ipcMain.handle("login", async (event, username, password) => {
  try {
    const normalizedUsername = typeof username === "string" ? username.trim() : "";
    const providedPassword = typeof password === "string" ? password : "";
    if (!normalizedUsername || !providedPassword) return null;

    const row = db
      .prepare("SELECT id, username, role, password FROM users WHERE username = ?")
      .get(normalizedUsername);

    if (!row) return null;
    if (!verifyPassword(row.password, providedPassword)) return null;

    // Upgrade legacy plaintext passwords on successful login.
    if (!isHashedPassword(row.password)) {
      try {
        db.prepare("UPDATE users SET password = ? WHERE id = ?").run(
          hashPassword(providedPassword),
          row.id,
        );
      } catch (upgradeErr) {
        console.warn("Password upgrade failed:", upgradeErr.message);
      }
    }

    return { id: row.id, username: row.username, role: row.role };
  } catch (err) {
    throw err;
  }
});

ipcMain.handle("get-users", async () => {
  try {
    const rows = db
      .prepare("SELECT id, username, role, created_at FROM users")
      .all();
    return rows;
  } catch (err) {
    throw err;
  }
});

ipcMain.handle("add-user", async (event, user) => {
  try {
    const username = typeof user?.username === "string" ? user.username.trim() : "";
    const password = typeof user?.password === "string" ? user.password : "";
    const role = user?.role === "admin" ? "admin" : "cashier";

    if (!username || username.length < 3) {
      throw new Error("Username must be at least 3 characters");
    }
    const passwordHash = hashPassword(password);

    const result = db
      .prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)")
      .run(username, passwordHash, role);
    return { id: result.lastInsertRowid };
  } catch (err) {
    throw err;
  }
});

ipcMain.handle("change-user-password", async (event, data) => {
  try {
    const { userId, username, currentPassword, newPassword } = data;
    const normalizedUsername = typeof username === "string" ? username.trim() : "";

    // Verify current password
    const user = db
      .prepare("SELECT * FROM users WHERE id = ? AND username = ?")
      .get(userId, normalizedUsername);

    if (!user || !verifyPassword(user.password, currentPassword)) {
      return { success: false, message: "Current password is incorrect" };
    }

    // Update to new password
    db.prepare("UPDATE users SET password = ? WHERE id = ?").run(
      hashPassword(newPassword),
      userId,
    );

    return { success: true, message: "Password changed successfully" };
  } catch (err) {
    throw err;
  }
});

ipcMain.handle("request-password-reset", async (event, username, email) => {
  try {
    // Find user by username
    const user = db
      .prepare("SELECT * FROM users WHERE username = ?")
      .get(username);

    if (!user) {
      // For security, don't reveal if user exists - just return generic message
      return {
        success: true,
        message: "If username exists, reset instructions will be sent",
      };
    }

    // Note: In a production system, you would:
    // 1. Send an actual email with a reset link
    // 2. Generate a unique reset token
    // 3. Store the token with expiration time
    // 4. Have user click email link to reset

    // For now, return success message
    // In future implementation, integrate email service here
    return {
      success: true,
      message:
        "Password reset request received. Check your email for instructions.",
    };
  } catch (err) {
    throw err;
  }
});

// Enhanced Product Management
ipcMain.handle("update-product", async (event, product) => {
  try {
    const result = db
      .prepare(
        `
      UPDATE products SET name = ?, sku = ?, category_id = ?, cost_price = ?, 
        price = ?, stock = ?, barcode = ?, image_path = ?, tax_rate = ? WHERE id = ?
    `,
      )
      .run(
        product.name,
        product.sku,
        product.categoryId,
        product.costPrice,
        product.price,
        product.stock,
        product.barcode,
        product.imagePath,
        product.taxRate,
        product.id,
      );
    return { changes: result.changes };
  } catch (err) {
    throw err;
  }
});

ipcMain.handle("delete-product", async (event, productId) => {
  try {
    const result = db
      .prepare("DELETE FROM products WHERE id = ?")
      .run(productId);
    return { changes: result.changes };
  } catch (err) {
    throw err;
  }
});

ipcMain.handle("get-products-by-category", async (event, categoryId) => {
  try {
    const query = categoryId
      ? "SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.category_id = ?"
      : "SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id";
    const rows = categoryId
      ? db.prepare(query).all(categoryId)
      : db.prepare(query).all();
    return rows;
  } catch (err) {
    throw err;
  }
});

// Discount Codes
ipcMain.handle("get-discount-codes", async () => {
  try {
    const rows = db
      .prepare("SELECT * FROM discount_codes WHERE is_active = 1")
      .all();
    return rows;
  } catch (err) {
    throw err;
  }
});

ipcMain.handle("validate-discount-code", async (event, code, amount) => {
  try {
    const row = db
      .prepare(
        `
      SELECT * FROM discount_codes WHERE code = ? AND is_active = 1 
      AND (valid_from IS NULL OR valid_from <= datetime('now'))
      AND (valid_until IS NULL OR valid_until >= datetime('now'))
      AND (min_purchase IS NULL OR min_purchase <= ?)
    `,
      )
      .get(code, amount);
    return row;
  } catch (err) {
    throw err;
  }
});

ipcMain.handle("add-discount-code", async (event, discount) => {
  try {
    const result = db
      .prepare(
        `
      INSERT INTO discount_codes (code, discount_type, discount_value, min_purchase, 
        max_discount, valid_from, valid_until, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      )
      .run(
        discount.code,
        discount.discountType,
        discount.discountValue,
        discount.minPurchase,
        discount.maxDiscount,
        discount.validFrom,
        discount.validUntil,
        discount.isActive ? 1 : 0,
      );
    return { id: result.lastInsertRowid };
  } catch (err) {
    throw err;
  }
});

// Enhanced Sales
ipcMain.handle("create-sale-enhanced", async (event, sale) => {
  try {
    const createEnhancedSaleTransaction = db.transaction(() => {
      const saleResult = db
        .prepare(
          `
        INSERT INTO sales (customer_id, user_id, subtotal, tax_amount, discount_amount, 
          discount_code, total, payment_method, payment_details) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        )
        .run(
          sale.customerId,
          sale.userId,
          sale.subtotal,
          sale.taxAmount,
          sale.discountAmount,
          sale.discountCode,
          sale.total,
          sale.paymentMethod,
          sale.paymentDetails,
        );

      const saleId = saleResult.lastInsertRowid;

      if (sale.items.length > 0) {
        const insertItem = db.prepare(`
          INSERT INTO sale_items (sale_id, product_id, variant_id, sku, size, variant_detail, 
            quantity, unit_price, cost_price, discount, total) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const updateVariantStock = db.prepare(
          "UPDATE product_variants SET stock = stock - ? WHERE variant_id = ?",
        );

        const updateProductStock = db.prepare(
          "UPDATE products SET stock = stock - ? WHERE id = ?",
        );

        for (const item of sale.items) {
          const itemTotal =
            item.unitPrice * item.quantity - (item.discount || 0);

          // Use variant_id if present (new variant-based products)
          if (item.variantId) {
            insertItem.run(
              saleId,
              null, // product_id is null for variants
              item.variantId,
              item.skul, // Note: POSTerminal sends as 'skul' (typo)
              item.size,
              item.variant_detail,
              item.quantity,
              item.unitPrice,
              item.costPrice,
              item.discount || 0,
              itemTotal,
            );
            updateVariantStock.run(item.quantity, item.variantId);
          } else {
            // Fall back to legacy product handling
            insertItem.run(
              saleId,
              item.productId,
              null, // variant_id is null for legacy products
              null,
              null,
              null,
              item.quantity,
              item.unitPrice,
              item.costPrice,
              item.discount || 0,
              itemTotal,
            );
            updateProductStock.run(item.quantity, item.productId);
          }
        }
      }

      return saleId;
    });

    const saleId = createEnhancedSaleTransaction();
    return { saleId };
  } catch (err) {
    throw err;
  }
});

ipcMain.handle("return-sale", async (event, saleId, reason) => {
  try {
    const returnSaleTransaction = db.transaction(() => {
      // Get sale items (including variant information)
      const items = db
        .prepare("SELECT * FROM sale_items WHERE sale_id = ?")
        .all(saleId);

      // Support both variant and legacy product stock restoration
      const updateVariantStock = db.prepare(
        "UPDATE product_variants SET stock = stock + ? WHERE variant_id = ?",
      );

      const updateProductStock = db.prepare(
        "UPDATE products SET stock = stock + ? WHERE id = ?",
      );

      for (const item of items) {
        // Restore variant stock if variant_id exists
        if (item.variant_id) {
          updateVariantStock.run(item.quantity, item.variant_id);
        } else {
          // Restore legacy product stock
          updateProductStock.run(item.quantity, item.product_id);
        }
      }

      // Mark sale as returned
      const result = db
        .prepare(
          `
        UPDATE sales SET is_returned = 1, returned_date = datetime('now') 
        WHERE id = ?
      `,
        )
        .run(saleId);

      return result.changes;
    });

    const changes = returnSaleTransaction();
    return { changes };
  } catch (err) {
    throw err;
  }
});

ipcMain.handle("get-sale-details", async (event, saleId) => {
  try {
    const sale = db
      .prepare(
        `
      SELECT s.*, c.name as customer_name, u.username as user_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `,
      )
      .get(saleId);

    const items = db
      .prepare(
        `
      SELECT si.*, p.name as product_name, p.sku
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = ?
    `,
      )
      .all(saleId);

    return { ...sale, items };
  } catch (err) {
    throw err;
  }
});

// Invoice Management
ipcMain.handle("create-invoice", async (event, { saleId, customerPhone }) => {
  try {
    // Generate invoice number
    const timestamp = Date.now();
    const invoiceNumber = `INV-${saleId}-${timestamp}`;

    // Create invoice record
    const result = db
      .prepare(
        `
      INSERT INTO invoices (sale_id, customer_phone, invoice_number, status) 
      VALUES (?, ?, ?, 'created')
    `,
      )
      .run(saleId, customerPhone, invoiceNumber);

    return {
      invoiceId: result.lastInsertRowid,
      invoiceNumber,
      saleId,
    };
  } catch (err) {
    throw new Error(`Invoice creation error: ${err.message}`);
  }
});

ipcMain.handle("generate-invoice-pdf", async (event, { saleId, invoiceId }) => {
  try {
    // Get sale and items details
    const sale = db
      .prepare(
        `
        SELECT s.*, c.name as customer_name, c.email, c.phone
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        WHERE s.id = ?
      `,
      )
      .get(saleId);

    const items = db
      .prepare(
        `
        SELECT si.*, 
          COALESCE(p.name, pv.product_id) as product_name,
          si.sku as item_sku,
          si.size,
          si.variant_detail
        FROM sale_items si
        LEFT JOIN products p ON si.product_id = p.id
        LEFT JOIN product_variants pv ON si.variant_id = pv.variant_id
        WHERE si.sale_id = ?
      `,
      )
      .all(saleId);

    // Generate PDF path
    const timestamp = Date.now();
    const pdfFileName = `invoice_${saleId}_${timestamp}.pdf`;
    const pdfPath = path.join(app.getPath("userData"), "invoices", pdfFileName);

    // Create invoices directory if it doesn't exist
    const invoicesDir = path.dirname(pdfPath);
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
    }

    // Update invoice record with PDF path
    db.prepare("UPDATE invoices SET pdf_path = ? WHERE invoice_id = ?").run(
      pdfPath,
      invoiceId,
    );

    return {
      pdfPath,
      pdfFileName,
      sale,
      items,
    };
  } catch (err) {
    throw new Error(`PDF generation error: ${err.message}`);
  }
});

ipcMain.handle("get-invoices", async (event, filters = {}) => {
  try {
    let query = `
      SELECT i.*, s.total, s.date, c.name as customer_name, c.phone
      FROM invoices i
      JOIN sales s ON i.sale_id = s.id
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE 1=1
    `;

    const params = [];

    if (filters.status) {
      query += ` AND i.status = ?`;
      params.push(filters.status);
    }

    if (filters.whatsappStatus) {
      query += ` AND i.whatsapp_status = ?`;
      params.push(filters.whatsappStatus);
    }

    if (filters.startDate) {
      query += ` AND i.invoice_date >= ?`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ` AND i.invoice_date <= ?`;
      params.push(filters.endDate);
    }

    query += ` ORDER BY i.invoice_id DESC`;

    const invoices = db.prepare(query).all(...params);
    return invoices;
  } catch (err) {
    throw new Error(`Error fetching invoices: ${err.message}`);
  }
});

ipcMain.handle(
  "update-invoice-status",
  async (event, { invoiceId, status, whatsappStatus, notes }) => {
    try {
      let updateQuery = `
        UPDATE invoices 
        SET status = COALESCE(?, status)
      `;
      const params = [status];

      if (whatsappStatus) {
        updateQuery += `, whatsapp_status = ?, whatsapp_sent_at = datetime('now')`;
        params.push(whatsappStatus);
      }

      if (notes) {
        updateQuery += `, notes = ?`;
        params.push(notes);
      }

      updateQuery += ` WHERE invoice_id = ?`;
      params.push(invoiceId);

      const result = db.prepare(updateQuery).run(...params);

      return { changes: result.changes };
    } catch (err) {
      throw new Error(`Error updating invoice: ${err.message}`);
    }
  },
);

// WhatsApp Integration
ipcMain.handle(
  "send-invoice-whatsapp",
  async (event, { invoiceId, phoneNumber, pdfPath }) => {
    try {
      // Get Twilio credentials from environment (user needs to set these)
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const whatsappNumber =
        process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER;

      // If no credentials, return instruction message
      if (!accountSid || !authToken || !whatsappNumber) {
        throw new Error(
          "WhatsApp credentials not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER environment variables.",
        );
      }

      // Initialize Twilio client
      const twilio = require("twilio");
      const client = twilio(accountSid, authToken);

      // Format phone number (ensure it starts with country code)
      const formattedPhone = phoneNumber.startsWith("+")
        ? phoneNumber
        : `+${phoneNumber}`;

      // Send the message
      const result = await client.messages.create({
        from: `whatsapp:${whatsappNumber}`,
        to: `whatsapp:${formattedPhone}`,
        body: "Thank you for your purchase! Your invoice is attached.",
        mediaUrl: pdfPath ? `file://${pdfPath}` : undefined,
      });

      // Update invoice status in database
      db.prepare(
        `
        UPDATE invoices 
        SET whatsapp_status = 'sent', 
            whatsapp_message_id = ?,
            whatsapp_sent_at = datetime('now'),
            status = 'sent'
        WHERE invoice_id = ?
      `,
      ).run(result.sid, invoiceId);

      return {
        success: true,
        messageSid: result.sid,
        phoneNumber: formattedPhone,
      };
    } catch (err) {
      // Log error to database
      db.prepare(
        `
        UPDATE invoices 
        SET whatsapp_status = 'failed',
            notes = ?
        WHERE invoice_id = ?
      `,
      ).run(err.message, invoiceId);

      throw new Error(`WhatsApp send error: ${err.message}`);
    }
  },
);

// Stock Adjustments
ipcMain.handle("add-stock-adjustment", async (event, adjustment) => {
  try {
    const adjustStockTransaction = db.transaction(() => {
      // Get current stock
      const product = db
        .prepare("SELECT stock FROM products WHERE id = ?")
        .get(adjustment.productId);

      let newStock = product.stock;
      if (adjustment.adjustmentType === "add") {
        newStock += adjustment.quantity;
      } else if (adjustment.adjustmentType === "subtract") {
        newStock -= adjustment.quantity;
      } else if (adjustment.adjustmentType === "set") {
        newStock = adjustment.quantity;
      }

      // Update stock
      db.prepare("UPDATE products SET stock = ? WHERE id = ?").run(
        newStock,
        adjustment.productId,
      );

      // Record adjustment
      const result = db
        .prepare(
          `
        INSERT INTO stock_adjustments (product_id, adjustment_type, quantity, 
          reason, notes, user_id) VALUES (?, ?, ?, ?, ?, ?)
      `,
        )
        .run(
          adjustment.productId,
          adjustment.adjustmentType,
          adjustment.quantity,
          adjustment.reason,
          adjustment.notes,
          adjustment.userId,
        );

      return { id: result.lastInsertRowid, newStock };
    });

    return adjustStockTransaction();
  } catch (err) {
    throw err;
  }
});

ipcMain.handle("get-stock-adjustments", async (event, productId) => {
  try {
    const query = productId
      ? `SELECT sa.*, p.name as product_name, u.username as user_name
         FROM stock_adjustments sa
         JOIN products p ON sa.product_id = p.id
         LEFT JOIN users u ON sa.user_id = u.id
         WHERE sa.product_id = ?
         ORDER BY sa.created_at DESC`
      : `SELECT sa.*, p.name as product_name, u.username as user_name
         FROM stock_adjustments sa
         JOIN products p ON sa.product_id = p.id
         LEFT JOIN users u ON sa.user_id = u.id
         ORDER BY sa.created_at DESC`;
    const rows = productId
      ? db.prepare(query).all(productId)
      : db.prepare(query).all();
    return rows;
  } catch (err) {
    throw err;
  }
});

// Reports
ipcMain.handle("get-sales-report", async (event, startDate, endDate) => {
  try {
    const query =
      startDate && endDate
        ? `SELECT s.*, c.name as customer_name, u.username as user_name
         FROM sales s
         LEFT JOIN customers c ON s.customer_id = c.id
         LEFT JOIN users u ON s.user_id = u.id
         WHERE s.date >= ? AND s.date <= ? AND s.is_returned = 0
         ORDER BY s.date DESC`
        : `SELECT s.*, c.name as customer_name, u.username as user_name
         FROM sales s
         LEFT JOIN customers c ON s.customer_id = c.id
         LEFT JOIN users u ON s.user_id = u.id
         WHERE s.is_returned = 0
         ORDER BY s.date DESC`;
    const rows =
      startDate && endDate
        ? db.prepare(query).all(startDate, endDate)
        : db.prepare(query).all();
    return rows;
  } catch (err) {
    throw err;
  }
});

ipcMain.handle("get-profit-loss-report", async (event, startDate, endDate) => {
  try {
    const query =
      startDate && endDate
        ? `SELECT p.id, p.name, p.sku, SUM(si.quantity) as total_sold, 
                SUM(si.total) as total_revenue, SUM(si.cost_price * si.quantity) as total_cost,
                SUM(si.total) - SUM(si.cost_price * si.quantity) as profit
         FROM sale_items si
         JOIN products p ON si.product_id = p.id
         JOIN sales s ON si.sale_id = s.id
         WHERE s.date >= ? AND s.date <= ? AND s.is_returned = 0
         GROUP BY p.id, p.name, p.sku
         ORDER BY total_sold DESC`
        : `SELECT p.id, p.name, p.sku, SUM(si.quantity) as total_sold, 
                SUM(si.total) as total_revenue, SUM(si.cost_price * si.quantity) as total_cost,
                SUM(si.total) - SUM(si.cost_price * si.quantity) as profit
         FROM sale_items si
         JOIN products p ON si.product_id = p.id
         JOIN sales s ON si.sale_id = s.id
         WHERE s.is_returned = 0
         GROUP BY p.id, p.name, p.sku
         ORDER BY total_sold DESC`;
    const rows =
      startDate && endDate
        ? db.prepare(query).all(startDate, endDate)
        : db.prepare(query).all();
    return rows;
  } catch (err) {
    throw err;
  }
});

ipcMain.handle("get-best-sellers", async (event, limit = 10) => {
  try {
    const rows = db
      .prepare(
        `
      SELECT p.id, p.name, p.sku, SUM(si.quantity) as total_sold, SUM(si.total) as total_revenue
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN sales s ON si.sale_id = s.id
      WHERE s.is_returned = 0
      GROUP BY p.id, p.name, p.sku
      ORDER BY total_sold DESC
      LIMIT ?
    `,
      )
      .all(limit);
    return rows;
  } catch (err) {
    throw err;
  }
});

// CSV/Excel Export
ipcMain.handle("export-inventory-csv", async () => {
  try {
    const rows = db
      .prepare(
        `
      SELECT p.sku, p.name, c.name as category, p.cost_price, p.price, p.stock, p.barcode
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.name
    `,
      )
      .all();

    // Convert to CSV
    const headers = [
      "SKU",
      "Name",
      "Category",
      "Cost Price",
      "Selling Price",
      "Stock",
      "Barcode",
    ];
    const csvRows = [headers.join(",")];
    rows.forEach((row) => {
      csvRows.push(
        [
          row.sku || "",
          `"${row.name}"`,
          row.category || "",
          row.cost_price || 0,
          row.price || 0,
          row.stock || 0,
          row.barcode || "",
        ].join(","),
      );
    });
    return csvRows.join("\n");
  } catch (err) {
    throw err;
  }
});

ipcMain.handle("import-inventory-csv", async (event, csvData) => {
  try {
    const lines = csvData.split("\n").filter((line) => line.trim());
    if (lines.length < 2) {
      throw new Error("Invalid CSV format");
    }
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
    let imported = 0;
    let errors = [];

    const importTransaction = db.transaction(() => {
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i]
          .split(",")
          .map((v) => v.trim().replace(/"/g, ""));
        if (values.length !== headers.length) continue;

        const row = {};
        headers.forEach((h, idx) => {
          row[h.toLowerCase().replace(/\s+/g, "_")] = values[idx];
        });

        try {
          // Get category ID
          const cat = row.category
            ? db
                .prepare("SELECT id FROM categories WHERE name = ?")
                .get(row.category)
            : null;
          const categoryId = cat ? cat.id : null;

          // Check if product exists by SKU
          const existing = row.sku
            ? db.prepare("SELECT id FROM products WHERE sku = ?").get(row.sku)
            : null;

          if (existing) {
            // Update existing
            db.prepare(
              `
              UPDATE products SET name = ?, category_id = ?, cost_price = ?, 
                price = ?, stock = ?, barcode = ? WHERE sku = ?
            `,
            ).run(
              row.name,
              categoryId,
              parseFloat(row.cost_price) || 0,
              parseFloat(row.selling_price) || 0,
              parseInt(row.stock) || 0,
              row.barcode || null,
              row.sku,
            );
            imported++;
          } else {
            // Insert new
            db.prepare(
              `
              INSERT INTO products (sku, name, category_id, cost_price, price, stock, barcode)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
            ).run(
              row.sku,
              row.name,
              categoryId,
              parseFloat(row.cost_price) || 0,
              parseFloat(row.selling_price) || 0,
              parseInt(row.stock) || 0,
              row.barcode || null,
            );
            imported++;
          }
        } catch (err) {
          errors.push(`Row ${i}: ${err.message}`);
        }
      }
    });

    importTransaction();
    return { imported, errors };
  } catch (err) {
    throw err;
  }
});

// File operations
ipcMain.handle("save-file-dialog", async (event, defaultPath, filters) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath,
    filters: filters || [{ name: "All Files", extensions: ["*"] }],
  });
  return result;
});

ipcMain.handle("open-file-dialog", async (event, filters) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    filters: filters || [{ name: "All Files", extensions: ["*"] }],
    properties: ["openFile"],
  });
  return result;
});

ipcMain.handle("write-file", async (event, filePath, data) => {
  try {
    fs.writeFileSync(filePath, data, "utf-8");
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("read-file", async (event, filePath) => {
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
// Smart CSV Column Detection
ipcMain.handle("detect-csv-columns", async (event, csvData) => {
  try {
    const lines = csvData.split("\n").filter((line) => line.trim());
    if (lines.length < 2) {
      return { success: false, message: "CSV is too small (need header + at least 1 row)" };
    }

    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
    const sampleRow = lines[1]
      .split(",")
      .map((v) => v.trim().replace(/"/g, ""));

    // Try to auto-detect column types
    const columnMap = {};
    const commonHeaders = {
      name: [
        "product", "name", "product_name", "productname", "item", "item_name",
        "description", "title",
      ],
      sku: ["sku", "code", "product_code", "item_code", "id"],
      category: [
        "category", "category_name", "type", "group", "classification",
      ],
      price: [
        "price", "selling_price", "sale_price", "sp", "unit_price", "cost",
      ],
      cost_price: [
        "cost", "cost_price", "cp", "wholesale_price", "purchase_price", "cost",
      ],
      stock: [
        "stock", "quantity", "qty", "units", "on_hand", "available",
      ],
      barcode: ["barcode", "ean", "upc", "code"],
    };

    // Auto-detect
    for (const [field, possibleHeaders] of Object.entries(commonHeaders)) {
      const matchedHeader = headers.find((h) =>
        possibleHeaders.includes(h.toLowerCase()),
      );
      if (matchedHeader) {
        columnMap[field] = headers.indexOf(matchedHeader);
      }
    }

    return {
      success: true,
      headers,
      sampleRow,
      detectedMapping: columnMap,
      totalRows: lines.length - 1,
    };
  } catch (err) {
    console.error("Error detecting CSV columns:", err);
    return {
      success: false,
      message: err.message,
    };
  }
});

// Smart CSV Import with Column Mapping
ipcMain.handle("import-csv-with-mapping", async (event, csvData, columnMapping, autoCreateCategories = true) => {
  try {
    const lines = csvData.split("\n").filter((line) => line.trim());
    if (lines.length < 2) {
      throw new Error("Invalid CSV format");
    }

    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
    let imported = 0;
    let skipped = 0;
    let errors = [];

    const importTransaction = db.transaction(() => {
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i]
          .split(",")
          .map((v) => v.trim().replace(/"/g, ""));

        try {
          // Extract values based on column mapping
          const get = (field) => {
            const idx = columnMapping[field];
            return idx !== undefined && idx < values.length ? values[idx] : null;
          };

          const name = get("name");
          const sku = get("sku");
          const categoryName = get("category");
          const price = parseFloat(get("price")) || 0;
          const costPrice = parseFloat(get("cost_price")) || 0;
          const stock = parseInt(get("stock")) || 0;
          const barcode = get("barcode");

          if (!name || !price) {
            errors.push(`Row ${i + 1}: Missing name or price`);
            skipped++;
            continue;
          }

          // Handle category
          let categoryId = null;
          if (categoryName && categoryName.trim()) {
            let category = db
              .prepare("SELECT id FROM categories WHERE name = ?")
              .get(categoryName.trim());

            if (!category && autoCreateCategories) {
              // Auto-create category
              db.prepare("INSERT INTO categories (name) VALUES (?)").run(
                categoryName.trim(),
              );
              category = db
                .prepare("SELECT id FROM categories WHERE name = ?")
                .get(categoryName.trim());
            }

            categoryId = category ? category.id : null;
          }

          // Check if product exists by SKU
          const existing = sku
            ? db.prepare("SELECT id FROM products WHERE sku = ?").get(sku)
            : null;

          if (existing) {
            // Update existing
            db.prepare(
              `UPDATE products 
               SET name = ?, category_id = ?, cost_price = ?, price = ?, stock = ?, barcode = ? 
               WHERE sku = ?`,
            ).run(
              name,
              categoryId,
              costPrice,
              price,
              stock,
              barcode || null,
              sku,
            );
          } else {
            // Insert new
            db.prepare(
              `INSERT INTO products (name, sku, category_id, cost_price, price, stock, barcode)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ).run(
              name,
              sku || null,
              categoryId,
              costPrice,
              price,
              stock,
              barcode || null,
            );
          }

          imported++;
        } catch (rowErr) {
          errors.push(`Row ${i + 1}: ${rowErr.message}`);
          skipped++;
        }
      }
    });

    importTransaction();

    return {
      success: true,
      imported,
      skipped,
      total: lines.length - 1,
      errors: errors.slice(0, 10), // Return first 10 errors
      message: `Imported ${imported} products${skipped > 0 ? `, skipped ${skipped}` : ""}`,
    };
  } catch (err) {
    console.error("Error importing CSV:", err);
    return {
      success: false,
      message: err.message,
    };
  }
});

// Setup Wizard Handler
ipcMain.handle("complete-setup", async (event, setupData) => {
  try {
    const { businessInfo, invoiceSettings, inventoryOption, adminPassword, adminUsername } = setupData;

    const normalizedAdminUsername =
      typeof adminUsername === "string" && adminUsername.trim()
        ? adminUsername.trim()
        : "admin";

    const setupTransaction = db.transaction(() => {
      // Save business info to settings table
      const settingsToSave = {
        businessName: businessInfo.businessName,
        ownerName: businessInfo.ownerName,
        businessPhone: businessInfo.phone,
        businessAddress: businessInfo.address,
        currency: businessInfo.currency,
        invoicePrefix: invoiceSettings.invoicePrefix,
        invoiceStartNumber: invoiceSettings.startingNumber.toString(),
        taxRate: invoiceSettings.taxRate.toString(),
        receiptSize: invoiceSettings.receiptSize,
        enableQuotations: invoiceSettings.enableQuotations ? "1" : "0",
        setupComplete: "1",
        setupDate: new Date().toISOString(),
      };

      // Insert settings
      for (const [key, value] of Object.entries(settingsToSave)) {
        db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`).run(
          key,
          value ?? "",
        );
      }

      // Create or update the initial admin user
      if (adminPassword) {
        const passwordHash = hashPassword(adminPassword);
        const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get()
          .count;

        if (userCount === 0) {
          db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run(
            normalizedAdminUsername,
            passwordHash,
            "admin",
          );
        } else {
          const existing = db
            .prepare("SELECT id FROM users WHERE username = ?")
            .get(normalizedAdminUsername);
          if (existing) {
            db.prepare("UPDATE users SET password = ?, role = 'admin' WHERE id = ?").run(
              passwordHash,
              existing.id,
            );
          } else {
            // Fallback: update first admin if present, otherwise create a new admin.
            const firstAdmin = db
              .prepare("SELECT id FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1")
              .get();
            if (firstAdmin) {
              db.prepare("UPDATE users SET password = ? WHERE id = ?").run(
                passwordHash,
                firstAdmin.id,
              );
            } else {
              db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run(
                normalizedAdminUsername,
                passwordHash,
                "admin",
              );
            }
          }
        }
      }

      // Inventory option is handled in UI (manual add / import); no automatic seed data.
      void inventoryOption;
    });

    setupTransaction();

    return {
      success: true,
      message: 'Setup completed successfully',
    };
  } catch (err) {
    console.error('Setup error:', err);
    return {
      success: false,
      message: err.message,
    };
  }
});

// Get application settings
ipcMain.handle("get-settings", async (event) => {
  try {
    const rows = db.prepare(`SELECT key, value FROM settings`).all();
    const settings = {};
    rows.forEach(row => {
      settings[row.key] = row.value;
    });
    return settings;
  } catch (err) {
    console.error('Error getting settings:', err);
    return {};
  }
});

// Check if setup is complete
ipcMain.handle("is-setup-complete", async (event) => {
  try {
    const result = db.prepare(`SELECT value FROM settings WHERE key = 'setupComplete'`).get();
    return result ? result.value === '1' : false;
  } catch (err) {
    console.error('Error checking setup status:', err);
    return false;
  }
});

// Create quotation
ipcMain.handle("create-quotation", async (event, quotationData) => {
  try {
    const {
      customer_name,
      customer_phone,
      items,
      subtotal,
      tax,
      total,
      notes,
      userId,
    } = quotationData;

    // Get settings for quotation prefix
    const prefixResult = db
      .prepare(`SELECT value FROM settings WHERE key = 'invoicePrefix'`)
      .get();
    const prefix = prefixResult ? prefixResult.value : 'QT';

    // Get last quotation number
    const lastQuote = db
      .prepare(
        `SELECT quotation_number FROM quotations ORDER BY id DESC LIMIT 1`,
      )
      .get();

    let nextNumber = 1001;
    if (lastQuote) {
      const match = String(lastQuote.quotation_number).match(/(\d+)\s*$/);
      if (match) {
        const lastNum = parseInt(match[1], 10);
        if (Number.isFinite(lastNum)) nextNumber = lastNum + 1;
      }
    }

    const quotation_number = `${prefix}-Q-${nextNumber}`;

    const result = db
      .prepare(
        `
        INSERT INTO quotations (
          quotation_number, customer_name, customer_phone, items,
          subtotal, tax, total, status, notes, created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      )
      .run(
        quotation_number,
        customer_name,
        customer_phone,
        JSON.stringify(items),
        subtotal,
        tax,
        total,
        'ACTIVE',
        notes,
        userId,
      );

    return {
      success: true,
      quotation: {
        id: result.lastInsertRowid,
        quotation_number,
      },
    };
  } catch (err) {
    console.error('Error creating quotation:', err);
    return {
      success: false,
      message: err.message,
    };
  }
});

// Get quotations
ipcMain.handle("get-quotations", async (event, filters = {}) => {
  try {
    let query = `SELECT * FROM quotations WHERE 1=1`;
    const params = [];

    if (filters.status) {
      query += ` AND status = ?`;
      params.push(filters.status);
    }

    if (filters.customer_name) {
      query += ` AND customer_name LIKE ?`;
      params.push(`%${filters.customer_name}%`);
    }

    query += ` ORDER BY created_at DESC`;

    const quotations = db.prepare(query).all(...params);

    // Parse JSON items
    quotations.forEach(q => {
      try {
        q.items = JSON.parse(q.items);
      } catch (e) {
        q.items = [];
      }
    });

    return quotations;
  } catch (err) {
    console.error('Error getting quotations:', err);
    return [];
  }
});

// Update quotation status
ipcMain.handle("update-quotation-status", async (event, quotationId, status) => {
  try {
    db.prepare(`UPDATE quotations SET status = ? WHERE id = ?`).run(
      status,
      quotationId,
    );
    return { success: true };
  } catch (err) {
    console.error('Error updating quotation:', err);
    return {
      success: false,
      message: err.message,
    };
  }
});

ipcMain.handle("send-quotation-whatsapp", async (event, data) => {
  try {
    const { quotationId, phone } = data || {};
    if (!quotationId) {
      return { success: false, message: "quotationId is required" };
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

    if (!accountSid || !authToken || !whatsappNumber) {
      return {
        success: false,
        message:
          "WhatsApp credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER in .env.",
      };
    }

    const toRaw = typeof phone === "string" ? phone.trim() : "";
    if (!toRaw) {
      return { success: false, message: "Customer phone is required" };
    }

    const normalizedPhone = toRaw.replace(/[^\d+]/g, "");
    const formattedPhone = normalizedPhone.startsWith("+")
      ? normalizedPhone
      : `+${normalizedPhone}`;

    const row = db
      .prepare("SELECT * FROM quotations WHERE id = ?")
      .get(quotationId);
    if (!row) return { success: false, message: "Quotation not found" };

    let items = [];
    try {
      items = JSON.parse(row.items || "[]");
      if (!Array.isArray(items)) items = [];
    } catch {
      items = [];
    }

    const settingsRows = db.prepare("SELECT key, value FROM settings").all();
    const settings = {};
    settingsRows.forEach((s) => {
      settings[s.key] = s.value;
    });

    const businessName = settings.businessName || "POS System";
    const currency = settings.currency || "Rs";

    const lines = items.slice(0, 20).map((it) => {
      const name = it.product_name || it.name || "Item";
      const qty = it.quantity ?? 1;
      const total = it.total ?? 0;
      return `• ${name} x${qty} = ${currency} ${Number(total).toFixed(2)}`;
    });

    const body = [
      `*${businessName}*`,
      `Quotation: *${row.quotation_number}*`,
      "",
      ...lines,
      "",
      `Subtotal: ${currency} ${Number(row.subtotal || 0).toFixed(2)}`,
      `Tax: ${currency} ${Number(row.tax || 0).toFixed(2)}`,
      `Total: *${currency} ${Number(row.total || 0).toFixed(2)}*`,
      row.notes ? "" : null,
      row.notes ? `Notes: ${row.notes}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const twilio = require("twilio");
    const client = twilio(accountSid, authToken);

    const message = await client.messages.create({
      from: `whatsapp:${whatsappNumber}`,
      to: `whatsapp:${formattedPhone}`,
      body,
    });

    return { success: true, sid: message.sid };
  } catch (err) {
    console.error("Error sending quotation WhatsApp:", err);
    return { success: false, message: err.message };
  }
});

// Add customer credit
ipcMain.handle("add-customer-credit", async (event, customerId, creditLimit) => {
  try {
    db.prepare(
      `
      INSERT INTO customer_credits (customer_id, credit_limit, current_balance)
      VALUES (?, ?, ?)
    `,
    ).run(customerId, creditLimit, 0);

    return { success: true };
  } catch (err) {
    console.error('Error adding customer credit:', err);
    return {
      success: false,
      message: err.message,
    };
  }
});

// Get customer credit info
ipcMain.handle("get-customer-credit", async (event, customerId) => {
  try {
    const credit = db
      .prepare(`SELECT * FROM customer_credits WHERE customer_id = ?`)
      .get(customerId);

    return credit || null;
  } catch (err) {
    console.error('Error getting customer credit:', err);
    return null;
  }
});

// Update customer credit balance
ipcMain.handle(
  "update-credit-balance",
  async (event, customerId, amount, transactionType, saleId = null) => {
    try {
      // Get current balance
      const credit = db
        .prepare(`SELECT current_balance FROM customer_credits WHERE customer_id = ?`)
        .get(customerId);

      if (!credit) {
        return {
          success: false,
          message: 'Customer credit not found',
        };
      }

      const newBalance =
        transactionType === 'debit'
          ? credit.current_balance + amount
          : credit.current_balance - amount;

      // Update balance
      db.prepare(
        `UPDATE customer_credits SET current_balance = ?, updated_at = CURRENT_TIMESTAMP WHERE customer_id = ?`,
      ).run(newBalance, customerId);

      // Log transaction
      db.prepare(
        `
        INSERT INTO credit_transactions (customer_id, transaction_type, amount, sale_id)
        VALUES (?, ?, ?, ?)
      `,
      ).run(customerId, transactionType, amount, saleId);

      return {
        success: true,
        newBalance,
      };
    } catch (err) {
      console.error('Error updating credit balance:', err);
      return {
        success: false,
        message: err.message,
      };
    }
  },
);

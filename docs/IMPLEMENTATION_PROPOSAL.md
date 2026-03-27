# 🎯 PROPOSED SETUP WIZARD & IMPLEMENTATION PLAN

**Date:** February 19, 2026 | **Status:** AWAITING YOUR APPROVAL

---

## 📋 PART 1: SETUP WIZARD - CUSTOMIZATION OPTIONS

When the app launches for the FIRST TIME, the user will see a setup wizard (before login) where they can configure their POS. Here's what we propose:

### **Step 1: Business Information**
```
Your Business Details
┌─────────────────────────────────────┐
│ Business Name: [____________]        │  (e.g., "Ahmed's Hardware")
│ Owner Name: [____________]           │  (e.g., "Ahmed Khan")
│ You can customize this later →       │
│ City/Location: [____________]        │
│ Contact Phone: [____________]        │
│ Email: [____________]                │
│                                     │
│ [ Next ] [ Skip ]                   │
└─────────────────────────────────────┘
```

### **Step 2: Inventory Settings**
```
Inventory Configuration
┌─────────────────────────────────────┐
│ ☑ Enable CSV Import/Export           │
│   (Allows flexible field mapping)    │
│                                     │
│ ☑ Auto Track Stock Warnings          │
│   At level [____] units alert        │
│                                     │
│ ☑ Daily Auto-Backup Database         │
│   Backup location: [Windows LocalData]
│                                     │
│ [ Next ] [ Skip ]                   │
└─────────────────────────────────────┘
```

### **Step 3: Invoice Settings**
```
Invoice & Quotation Setup
┌─────────────────────────────────────┐
│ Invoice Prefix: [ZSE-____]           │
│ Starting Number: [1001]              │
│                                     │
│ Enable Customer Quotations?          │
│ ☑ Yes - Allow pre-purchase quotes   │
│                                     │
│ Invoice Payment Options:             │
│ ☑ Cash                               │
│ ☑ Card/Check                         │
│ ☑ Multiple Installments              │
│ ☑ Advance Payment                    │
│ ☑ Online Transfer                    │
│ (You can customize these labels)    │
│                                     │
│ [ Next ] [ Skip ]                   │
└─────────────────────────────────────┘
```

### **Step 4: User Setup**
```
Admin Account Creation
┌─────────────────────────────────────┐
│ * Change Default Admin Password:     │
│   New Password: [____________]       │
│   Confirm: [____________]            │
│                                     │
│ Note: You'll need this to login     │
│ Username: admin (cannot change)     │
│                                     │
│ [ Next ] [ Skip ]                   │
└─────────────────────────────────────┘
```

### **Step 5: Database Setup** (Optional)
```
Database Initialization
┌─────────────────────────────────────┐
│ Select Default Product Categories:  │
│ ☑ Sanitary Ware                     │
│ ☑ Electronics                        │
│ ☑ Plumbing                           │
│ ☑ Building Materials                 │
│ ☑ Tools & Hardware                   │
│                                     │
│ Or: [ Choose Custom Categories ]    │
│                                     │
│ [ Finish ] [ Skip ]                 │
└─────────────────────────────────────┘
```

---

## 📋 PART 2: PASSWORD RESET/CHANGE - DOCUMENTATION

### **How Password Change Works:**

**Location:** User clicks `User Management` → Select User → Click `Change Password`

**Flow:**
1. User provides: Username, Current Password, New Password
2. System verifies current password
3. If correct → Password updated
4. If incorrect → Shows error "Current password is incorrect"
5. Confirmation message: "Password changed successfully"

**For Forgot Password (Login Screen):**
1. Click "Forgot Password?" link on login
2. Enter: Username + Email
3. System sends password reset link
4. (Currently framework ready - needs email service integration)

---

## 📋 PART 3: TWO-WAY INVOICE SYSTEM

Currently payment methods: `Cash`, `Card`, `Easypaisa`, `Jazzcash`

### **Proposal: Replace with Invoice System**

#### **Way 1: PRE-PURCHASE QUOTATION** (Customer Request)
```
Flow:
  Customer: "Do you have tiles in stock?"
  
  Cashier:
    → Go to "Create Quotation" (new menu item)
    → Select products & quantities
    → System calculates price + tax
    → Enter customer name/phone
    → Generate quotation PDF
    → Share via WhatsApp Bot (real-time)
    
  Output: Quotation expires in 24 hours
```

#### **Way 2: POST-PURCHASE INVOICE** (Cashier Creates)
```
Flow:
  Customer: "Process this order"
  
  Cashier:
    → Go to "POS Terminal"
    → Scan/select products
    → Enter quantity
    → System shows subtotal → tax → total
    → Customer decides payment:
       • Full payment (immediate)
       • Partial payment (advance)
       • Installment (if enabled)
    → Click "Print Invoice"
    → Choose: 
       • Print Receipt
       • Generate Invoice PDF
       • Send via WhatsApp
       
  Output: Invoice stored in database with status:
          - UNPAID
          - PARTIAL
          - PAID
```

### **What We Need to Remove/Replace:**

**Current:**
```javascript
paymentMethod = "cash" | "card" | "easypaisa" | "jazzcash"
```

**New:**
```javascript
paymentStatus = "UNPAID" | "PARTIAL" | "PAID"
paymentType = "CASH" | "CARD" | "BANK_TRANSFER" | "CHEQUE" | "INSTALLMENT"

invoiceType = "QUOTATION" | "INVOICE"
quotationExpiry = 24 hours
```

### **Quotation Table (New):**
```sql
CREATE TABLE quotations (
  id INTEGER PRIMARY KEY,
  quotation_number TEXT UNIQUE,
  customer_id INTEGER,
  items JSON,
  subtotal REAL,
  tax REAL,
  total REAL,
  created_at DATETIME,
  expires_at DATETIME,
  status TEXT, -- PENDING, ACCEPTED, CONVERTED_TO_INVOICE, EXPIRED
  notes TEXT
)
```

### **Invoice Modifications:**
```sql
-- Add to existing invoices table:
quotation_id INTEGER -- Links to quotation if created from one
payment_status TEXT -- UNPAID, PARTIAL, PAID
payment_type TEXT -- Cash, Card, Transfer, etc.
advance_paid REAL -- If partial payment
balance_due REAL -- If not paid fully
```

---

## 📋 PART 4: CRUD OPERATIONS - VERIFICATION PLAN

Currently implemented handlers that need verification:

### **Products CRUD** ✓
- [ ] `add-product` - Works?
- [ ] `update-product` - Works?
- [ ] `delete-product` - Works?
- [ ] `get-products` - Works?

### **Inventory CRUD** ✓
- [ ] `add-stock-adjustment` - Works?
- [ ] `update-stock` - Works?
- [ ] `get-inventory` - Works?

### **Sales CRUD** ✓
- [ ] `create-sale` - Works?
- [ ] `return-sale` - Works?
- [ ] `get-sales` - Works?

### **Quotations CRUD** (NEW) 
- [ ] `create-quotation` - Need to build
- [ ] `get-quotation` - Need to build
- [ ] `list-quotations` - Need to build
- [ ] `convert-quotation-to-invoice` - Need to build
- [ ] `expire-old-quotations` - Need to build

### **Invoices CRUD** (Modify)
- [ ] `create-invoice` - Modify for quotation linking
- [ ] `get-invoice` - Modify for payment status
- [ ] `list-invoices` - Modify filters
- [ ] `update-invoice-payment` - Need to build

### **Customers CRUD** ✓
- [ ] `add-customer` - Works?
- [ ] `get-customers` - Works?
- [ ] `update-customer` - Need to check
- [ ] `delete-customer` - Works?

### **Users CRUD** ✓
- [ ] `login` - Works?
- [ ] `add-user` - Works?
- [ ] `get-users` - Works?
- [ ] `change-user-password` - Fixed ✓
- [ ] `request-password-reset` - Fixed ✓

---

## 📋 PART 5: CSV IMPORT/EXPORT - FLEXIBLE STRUCTURE

**Current Issue:** Database limited to one structure (columns match exactly)

**Solution: Dynamic CSV Mapping**

### **CSV Export (Currently works):**
```
Current columns: product_name, sku, category, cost_price, selling_price, stock, barcode
```

### **CSV Import (Make flexible):**
```
Flow:
  1. User uploads CSV file
  2. System reads first row (headers)
  3. User maps columns:
     
     Your CSV has:        System expects:
     [Product] ---------> [product_name]
     [Item Code] -------> [sku]
     [Type] ------------> [category_id]
     [Cost] ------------> [cost_price]
     [Price] -----------> [selling_price]
     [Qty] ------------> [stock]
     [Bar Code] -------> [barcode]
     
  4. User confirms mapping
  5. System inserts with validation
  6. Report: X imported, Y skipped (with reasons)
```

**Database Flexibility:**
- Allow custom fields (not hardcoded)
- Store field definitions per import batch
- Track which fields were mapped from which CSV

---

## 📋 PART 6: WINDOWS 7 COMPATIBILITY

**Current Status:** ✓ Should work (we used compatible libraries)

**To Verify You'll Test:**
- [ ] Install on Windows 7 SP1
- [ ] Login works
- [ ] Create product
- [ ] Create sale
- [ ] Generate invoice
- [ ] Print invoice
- [ ] Export CSV

**Known Compatibility:**
- ✓ Electron 28 supports Windows 7+
- ✓ React 18 works on Windows 7
- ✓ SQLite works on Windows 7
- ✓ jsPDF works on Windows 7

---

## 📋 PART 7: FUTURE-PROOFING FOR MULTI-OS

To prep for future expansion:

```javascript
// Add config detection
const osType = process.platform; // 'win32', 'darwin', 'linux'
const appDataPath = getAppDataPath(osType); // Different per OS

// Settings stored OS-agnostically
const userSettings = {
  businessName: "",
  invoicePrefix: "",
  categories: [],
  // ... etc
}

// Can later add:
// - Linux support
// - macOS support
// - Mobile app with same backend
```

---

## ✅ IMPLEMENTATION PLAN - IN ORDER

1. **Setup Wizard** (4 hours)
   - Login screen detection (first run vs returning)
   - Wizard UI (5 steps)
   - Settings storage in SQLite

2. **Invoice Refactor** (6 hours)
   - Create quotations table
   - Modify invoices table
   - Replace payment methods with payment_status

3. **Quotation Management** (4 hours)
   - Create quotation module
   - Add quotation to POS terminal
   - Quotation PDF generation

4. **CSV Flexible Import** (3 hours)
   - Column mapping UI
   - Dynamic database insertion
   - Validation & error reporting

5. **Testing & Verification** (2 hours)
   - All CRUD operations
   - Windows 7 compatibility
   - CSV import/export

**Total: ~19 hours of work**

---

## 🎯 QUESTIONS FOR YOU

Before I start coding, please clarify:

### **Setup Wizard:**
- [ ] Do you want it OPTIONAL (can skip) or MANDATORY (cannot skip)?
- [ ] After setup, goes directly to login?
- [ ] Should it be different for regular users vs admin?

### **Invoice System:**
- [ ] For quotations: Can customer request via WhatsApp bot directly?
- [ ] Should quotation auto-expire after 24 hours or custom period?
- [ ] Payment options you want to offer (Cash, Card, Transfer, Cheque, Installment)?

### **CSV Import:**
- [ ] Can import contain NEW categories, or only existing ones?
- [ ] Should it handle price updates for existing products?
- [ ] Validation: Skip invalid rows or stop entire import?

### **Customization:**
- [ ] Should payment options be EDITABLE in settings, or FIXED?
- [ ] Should invoice prefix/number be per user or global?

---

## 🔄 NEXT STEPS

**Once you confirm the above:**

1. I'll create the Setup Wizard
2. Refactor invoice system (quotations + invoices)
3. Build quotation UI in POS Terminal
4. Add flexible CSV import dialog
5. Test everything for Windows 7
6. Verify all CRUD operations work
7. Create user guide for business owners

**Send me your answers and I'll code it properly!**


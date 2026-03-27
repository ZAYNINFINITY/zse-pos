const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Products
  getProducts: () => ipcRenderer.invoke("get-products"),
  getProductsByCategory: (categoryId) =>
    ipcRenderer.invoke("get-products-by-category", categoryId),
  addProduct: (product) => ipcRenderer.invoke("add-product", product),
  updateProduct: (product) => ipcRenderer.invoke("update-product", product),
  deleteProduct: (productId) => ipcRenderer.invoke("delete-product", productId),

  // Categories
  getCategories: () => ipcRenderer.invoke("get-categories"),
  addCategory: (name) => ipcRenderer.invoke("add-category", name),

  // Stock
  updateStock: (productId, newStock) =>
    ipcRenderer.invoke("update-stock", productId, newStock),
  addStockAdjustment: (adjustment) =>
    ipcRenderer.invoke("add-stock-adjustment", adjustment),
  getStockAdjustments: (productId) =>
    ipcRenderer.invoke("get-stock-adjustments", productId),

  // Customers
  getCustomers: () => ipcRenderer.invoke("get-customers"),
  addCustomer: (customer) => ipcRenderer.invoke("add-customer", customer),
  deleteCustomer: (customerId) =>
    ipcRenderer.invoke("delete-customer", customerId),

  // Sales
  createSale: (sale) => ipcRenderer.invoke("create-sale", sale),
  getSales: () => ipcRenderer.invoke("get-sales"),
  getSaleDetails: (saleId) => ipcRenderer.invoke("get-sale-details", saleId),
  returnSale: (saleId, reason) =>
    ipcRenderer.invoke("return-sale", saleId, reason),

  // Invoices
  createInvoice: (data) => ipcRenderer.invoke("create-invoice", data),
  generateInvoicePDF: (data) =>
    ipcRenderer.invoke("generate-invoice-pdf", data),
  getInvoices: (filters) => ipcRenderer.invoke("get-invoices", filters),
  updateInvoiceStatus: (data) =>
    ipcRenderer.invoke("update-invoice-status", data),
  sendInvoiceWhatsApp: (data) =>
    ipcRenderer.invoke("send-invoice-whatsapp", data),

  // Variants
  getProductVariants: (productId) =>
    ipcRenderer.invoke("get-product-variants", productId),
  getVariantBySku: (sku) => ipcRenderer.invoke("get-variant-by-sku", sku),
  updateVariantStock: (variantId, newStock) =>
    ipcRenderer.invoke("update-variant-stock", variantId, newStock),

  // Discount Codes
  getDiscountCodes: () => ipcRenderer.invoke("get-discount-codes"),
  validateDiscountCode: (code, amount) =>
    ipcRenderer.invoke("validate-discount-code", code, amount),
  addDiscountCode: (discount) =>
    ipcRenderer.invoke("add-discount-code", discount),

  // Reports
  getSalesReport: (startDate, endDate) =>
    ipcRenderer.invoke("get-sales-report", startDate, endDate),
  getProfitLossReport: (startDate, endDate) =>
    ipcRenderer.invoke("get-profit-loss-report", startDate, endDate),
  getBestSellers: (limit) => ipcRenderer.invoke("get-best-sellers", limit),

  // Import/Export
  exportInventoryCSV: () => ipcRenderer.invoke("export-inventory-csv"),
  importInventoryCSV: (csvData) =>
    ipcRenderer.invoke("import-inventory-csv", csvData),
  detectCSVColumns: (csvData) =>
    ipcRenderer.invoke("detect-csv-columns", csvData),
  importCSVWithMapping: (csvData, columnMapping, autoCreateCategories) =>
    ipcRenderer.invoke(
      "import-csv-with-mapping",
      csvData,
      columnMapping,
      autoCreateCategories,
    ),

  // File Operations
  saveFileDialog: (defaultPath, filters) =>
    ipcRenderer.invoke("save-file-dialog", defaultPath, filters),
  openFileDialog: (filters) => ipcRenderer.invoke("open-file-dialog", filters),
  writeFile: (filePath, data) =>
    ipcRenderer.invoke("write-file", filePath, data),
  readFile: (filePath) => ipcRenderer.invoke("read-file", filePath),

  // Receipt
  printReceipt: (saleData) => ipcRenderer.invoke("print-receipt", saleData),

  // AI Recommendations
  getProductRecommendations: (productId, limit) =>
    ipcRenderer.invoke("get-product-recommendations", productId, limit),
  getCrossSellRecommendations: (productIds) =>
    ipcRenderer.invoke("get-cross-sell-recommendations", productIds),

  // User Management
  login: (username, password) =>
    ipcRenderer.invoke("login", username, password),
  getUsers: () => ipcRenderer.invoke("get-users"),
  addUser: (user) => ipcRenderer.invoke("add-user", user),
  changeUserPassword: (data) =>
    ipcRenderer.invoke("change-user-password", data),
  requestPasswordReset: (username, email) =>
    ipcRenderer.invoke("request-password-reset", username, email),

  // Setup & Settings
  completeSetup: (setupData) => ipcRenderer.invoke("complete-setup", setupData),
  getSettings: () => ipcRenderer.invoke("get-settings"),
  isSetupComplete: () => ipcRenderer.invoke("is-setup-complete"),

  // Quotations
  createQuotation: (quotationData) =>
    ipcRenderer.invoke("create-quotation", quotationData),
  getQuotations: (filters) =>
    ipcRenderer.invoke("get-quotations", filters),
  updateQuotationStatus: (quotationId, status) =>
    ipcRenderer.invoke("update-quotation-status", quotationId, status),
  sendQuotationWhatsApp: (data) =>
    ipcRenderer.invoke("send-quotation-whatsapp", data),

  // Customer Credit (Udhar System)
  addCustomerCredit: (customerId, creditLimit) =>
    ipcRenderer.invoke("add-customer-credit", customerId, creditLimit),
  getCustomerCredit: (customerId) =>
    ipcRenderer.invoke("get-customer-credit", customerId),
  updateCreditBalance: (customerId, amount, transactionType, saleId) =>
    ipcRenderer.invoke(
      "update-credit-balance",
      customerId,
      amount,
      transactionType,
      saleId,
    ),

  exportSalesReport: (filters) =>
    ipcRenderer.invoke("export-sales-report", filters),
});

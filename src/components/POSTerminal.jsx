import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  Plus,
  Minus,
  Search,
  CreditCard,
  Phone,
  DollarSign,
  Tag,
  X,
  Percent,
  Lightbulb,
} from "lucide-react";
import jsPDF from "jspdf";
import VariantSelector from "./VariantSelector";

function POSTerminal({ currentUser }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [discountCode, setDiscountCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(null);
  const [taxRate, setTaxRate] = useState(0);
  const [recommendations, setRecommendations] = useState([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showVariantSelector, setShowVariantSelector] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productVariants, setProductVariants] = useState([]);

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadCustomers();
  }, []);

  const loadProducts = async () => {
    try {
      const prods = selectedCategory
        ? await window.electronAPI.getProductsByCategory(selectedCategory)
        : await window.electronAPI.getProducts();
      setProducts(prods);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await window.electronAPI.getCategories();
      setCategories(cats);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadCustomers = async () => {
    try {
      const custs = await window.electronAPI.getCustomers();
      setCustomers(custs);
    } catch (error) {
      console.error("Error loading customers:", error);
    }
  };

  // Load AI recommendations based on cart items
  const loadRecommendations = async () => {
    try {
      if (cart.length === 0) {
        // Show best sellers if cart is empty
        const recs = await window.electronAPI.getCrossSellRecommendations([]);
        setRecommendations(recs);
      } else {
        // Get cross-sell recommendations for products in cart
        const productIds = cart.map((item) => item.id);
        const recs =
          await window.electronAPI.getCrossSellRecommendations(productIds);
        setRecommendations(recs);
      }
      setShowRecommendations(true);
    } catch (error) {
      console.error("Error loading recommendations:", error);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [selectedCategory]);

  // Load recommendations when cart changes
  useEffect(() => {
    loadRecommendations();
  }, [cart]);

  const addToCart = async (product) => {
    try {
      // Load variants for this product
      const variants = await window.electronAPI.getProductVariants(product.id);

      if (variants && variants.length > 0) {
        // Show variant selector if product has variants
        setSelectedProduct(product);
        setProductVariants(variants);
        setShowVariantSelector(true);
      } else if (product.stock <= 0) {
        alert("Product out of stock!");
      } else {
        // For legacy products without variants, add directly
        const existing = cart.find((item) => item.id === product.id);
        if (existing) {
          if (existing.quantity >= product.stock) {
            alert("Not enough stock!");
            return;
          }
          setCart(
            cart.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item,
            ),
          );
        } else {
          setCart([
            ...cart,
            {
              ...product,
              quantity: 1,
              unitPrice: product.price,
              costPrice: product.cost_price || 0,
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      // Fallback for legacy products
      if (product.stock <= 0) {
        alert("Product out of stock!");
        return;
      }
      const existing = cart.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert("Not enough stock!");
          return;
        }
        setCart(
          cart.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          ),
        );
      } else {
        setCart([
          ...cart,
          {
            ...product,
            quantity: 1,
            unitPrice: product.price,
            costPrice: product.cost_price || 0,
          },
        ]);
      }
    }
  };

  const handleVariantSelected = (variantWithQuantity) => {
    setShowVariantSelector(false);

    // Check if already in cart
    const existing = cart.find(
      (item) => item.variantId === variantWithQuantity.id,
    );

    if (existing) {
      const newQuantity = existing.quantity + variantWithQuantity.quantity;
      if (newQuantity > variantWithQuantity.stock) {
        alert("Not enough stock!");
        return;
      }
      setCart(
        cart.map((item) =>
          item.variantId === variantWithQuantity.id
            ? { ...item, quantity: newQuantity }
            : item,
        ),
      );
    } else {
      setCart([
        ...cart,
        {
          variantId: variantWithQuantity.id,
          sku: variantWithQuantity.sku,
          name: variantWithQuantity.productName,
          size: variantWithQuantity.size,
          variant_detail: variantWithQuantity.variant_detail,
          brand_name: variantWithQuantity.brand_name,
          quantity: variantWithQuantity.quantity,
          unitPrice: variantWithQuantity.price,
          stock: variantWithQuantity.stock,
        },
      ]);
    }
  };

  const updateQuantity = (itemKey, quantity) => {
    if (quantity <= 0) {
      setCart(
        cart.filter((item) => (item.variantId || item.id) !== itemKey),
      );
      return;
    }
    const item = cart.find((i) => (i.variantId || i.id) === itemKey);
    if (!item) return;
    if (quantity > item.stock) {
      alert("Not enough stock!");
      return;
    }
    setCart(
      cart.map((cartItem) =>
        (cartItem.variantId || cartItem.id) === itemKey
          ? { ...cartItem, quantity }
          : cartItem,
      ),
    );
  };

  const removeFromCart = (itemKey) => {
    setCart(cart.filter((item) => (item.variantId || item.id) !== itemKey));
  };

  const getSubtotal = () => {
    return cart.reduce(
      (sum, item) => sum + (item.unitPrice || item.price) * item.quantity,
      0,
    );
  };

  const getTaxAmount = () => {
    const subtotal = getSubtotal();
    const discountAmount = getDiscountAmount();
    return (subtotal - discountAmount) * (taxRate / 100);
  };

  const getDiscountAmount = () => {
    if (!discountApplied) return 0;
    const subtotal = getSubtotal();
    if (discountApplied.discount_type === "percentage") {
      let discount = (subtotal * discountApplied.discount_value) / 100;
      if (
        discountApplied.max_discount &&
        discount > discountApplied.max_discount
      ) {
        discount = discountApplied.max_discount;
      }
      return discount;
    } else {
      return discountApplied.discount_value;
    }
  };

  const getTotal = () => {
    const subtotal = getSubtotal();
    const discount = getDiscountAmount();
    const tax = getTaxAmount();
    return subtotal - discount + tax;
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;

    try {
      const subtotal = getSubtotal();
      const discount = await window.electronAPI.validateDiscountCode(
        discountCode,
        subtotal,
      );
      if (discount) {
        setDiscountApplied(discount);
        alert("Discount code applied successfully!");
      } else {
        alert("Invalid or expired discount code");
        setDiscountCode("");
      }
    } catch (error) {
      console.error("Error validating discount:", error);
      alert("Error validating discount code");
    }
  };

  const handleRemoveDiscount = () => {
    setDiscountApplied(null);
    setDiscountCode("");
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const subtotal = getSubtotal();
    const discountAmount = getDiscountAmount();
    const taxAmount = getTaxAmount();
    const total = getTotal();

    const sale = {
      customerId: selectedCustomer?.id || null,
      userId: currentUser?.id || null,
      subtotal,
      taxAmount,
      discountAmount,
      discountCode: discountApplied?.code || null,
      total,
      paymentMethod,
      paymentDetails:
        paymentMethod === "cash" ? "Cash Payment" : `${paymentMethod} Payment`,
      items: cart.map((item) => ({
        // Support both variant and legacy product formats
        variantId: item.variantId || null,
        productId: item.id || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice || item.price,
        costPrice: item.costPrice || 0,
        discount: 0,
        skul: item.sku || null, // Legacy name for compatibility
        size: item.size || null,
        variant_detail: item.variant_detail || null,
      })),
    };

    try {
      const result = await window.electronAPI.createSale(sale);

      // Generate PDF receipt
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      let yPos = margin;

      // Header
      doc.setFontSize(20);
      doc.text("ZSE POS SYSTEM", pageWidth / 2, yPos, { align: "center" });
      yPos += 8;
      doc.setFontSize(12);
      doc.text("Sanitary & Electronics Store", pageWidth / 2, yPos, {
        align: "center",
      });
      yPos += 8;
      doc.setFontSize(10);
      doc.text(`Receipt #${result.saleId}`, pageWidth / 2, yPos, {
        align: "center",
      });
      yPos += 10;

      // Line
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      // Sale Info
      doc.setFontSize(10);
      doc.text(`Date: ${new Date().toLocaleString()}`, margin, yPos);
      yPos += 6;
      if (selectedCustomer) {
        doc.text(`Customer: ${selectedCustomer.name}`, margin, yPos);
        yPos += 6;
      }
      yPos += 4;

      // Items
      doc.setFontSize(12);
      doc.text("Items:", margin, yPos);
      yPos += 8;

      doc.setFontSize(10);
      cart.forEach((item) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = margin;
        }
        const itemTotal = (item.unitPrice || item.price) * item.quantity;
        
        // Show product name with variant details if available
        let itemName = item.name;
        if (item.size) itemName += ` - ${item.size}`;
        if (item.variant_detail) itemName += ` (${item.variant_detail})`;
        if (item.brand_name) itemName += ` - ${item.brand_name}`;
        
        doc.text(`${item.quantity}x ${itemName}`, margin, yPos);
        if (item.sku) {
          yPos += 6;
          doc.setFontSize(9);
          doc.text(`SKU: ${item.sku}`, margin + 5, yPos);
          doc.setFontSize(10);
        }
        doc.text(`₨${itemTotal.toFixed(2)}`, pageWidth - margin - 30, yPos, {
          align: "right",
        });
        yPos += 6;
      });

      yPos += 6;
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      // Totals
      doc.setFontSize(10);
      doc.text(`Subtotal:`, pageWidth - margin - 50, yPos);
      doc.text(`₨${subtotal.toFixed(2)}`, pageWidth - margin, yPos, {
        align: "right",
      });
      yPos += 6;

      if (discountAmount > 0) {
        doc.text(`Discount:`, pageWidth - margin - 50, yPos);
        doc.text(`-₨${discountAmount.toFixed(2)}`, pageWidth - margin, yPos, {
          align: "right",
        });
        yPos += 6;
      }

      if (taxAmount > 0) {
        doc.text(`Tax (${taxRate}%):`, pageWidth - margin - 50, yPos);
        doc.text(`₨${taxAmount.toFixed(2)}`, pageWidth - margin, yPos, {
          align: "right",
        });
        yPos += 6;
      }

      yPos += 4;
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text(`Total:`, pageWidth - margin - 50, yPos);
      doc.text(`₨${total.toFixed(2)}`, pageWidth - margin, yPos, {
        align: "right",
      });
      yPos += 10;

      // Payment
      doc.setFont(undefined, "normal");
      doc.setFontSize(10);
      doc.text(`Payment Method: ${paymentMethod.toUpperCase()}`, margin, yPos);
      yPos += 10;

      // Footer
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;
      doc.setFontSize(9);
      doc.text("Thank you for your business!", pageWidth / 2, yPos, {
        align: "center",
      });
      yPos += 5;
      doc.text(
        "Returns accepted within 7 days with receipt",
        pageWidth / 2,
        yPos,
        { align: "center" },
      );

      // Save PDF
      const fileName = `receipt_${result.saleId}_${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);

      setCart([]);
      setSelectedCustomer(null);
      setDiscountCode("");
      setDiscountApplied(null);
      setTaxRate(0);
      alert("Sale completed successfully! Receipt saved.");
      loadProducts(); // Refresh stock
    } catch (error) {
      console.error("Error creating sale:", error);
      alert("Error processing sale");
    }
  };

  const filteredProducts = products.filter((product) => {
    if (searchTerm) {
      return (
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode?.includes(searchTerm)
      );
    }
    return true;
  });

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">POS Terminal</h1>
        <div className="flex items-center space-x-4">
          <select
            value={selectedCustomer?.id || ""}
            onChange={(e) => {
              const customer = customers.find(
                (c) => c.id === parseInt(e.target.value),
              );
              setSelectedCustomer(customer || null);
            }}
            className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select Customer (Optional)</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} - {customer.phone}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          {/* Category Tabs */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === null
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              All Products
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? "bg-primary text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, SKU, or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-lg"
            />
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-4 gap-4 overflow-y-auto max-h-[500px]">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white p-4 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-all border-2 border-transparent hover:border-primary"
                onClick={() => addToCart(product)}
              >
                {product.image_path && (
                  <img
                    src={product.image_path}
                    alt={product.name}
                    className="w-full h-32 object-cover rounded mb-2"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                )}
                <h3 className="font-semibold text-base mb-1 line-clamp-2">
                  {product.name}
                </h3>
                {product.sku && (
                  <p className="text-xs text-gray-500 mb-1">
                    SKU: {product.sku}
                  </p>
                )}
                <p className="text-sm text-gray-600 mb-2">
                  {product.category_name}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-primary">
                    ₨{product.price.toFixed(2)}
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      product.stock > 10
                        ? "bg-green-100 text-green-700"
                        : product.stock > 0
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {product.stock} left
                  </span>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-4 text-center py-8 text-gray-500">
                No products found.{" "}
                {searchTerm && "Try a different search term."}
              </div>
            )}
          </div>
        </div>

        {/* Cart Panel */}
        <div className="bg-white rounded-lg shadow-md p-4 flex flex-col">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <ShoppingCart className="mr-2" size={24} />
            Cart ({cart.length})
          </h2>

          <div className="flex-1 space-y-2 overflow-y-auto mb-4 min-h-[200px]">
            {cart.map((item) => (
              <div
                key={item.variantId || item.id}
                className="flex justify-between items-start p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.name}</p>
                  {item.size && (
                    <p className="text-xs text-gray-500">
                      Size: {item.size} {item.variant_detail && `- ${item.variant_detail}`}
                    </p>
                  )}
                  {item.brand_name && (
                    <p className="text-xs text-gray-500">Brand: {item.brand_name}</p>
                  )}
                  <p className="text-xs text-gray-600">
                    ₨{item.unitPrice || item.price} × {item.quantity}
                  </p>
                  <p className="text-sm font-semibold text-primary mt-1">
                    ₨
                    {((item.unitPrice || item.price) * item.quantity).toFixed(
                      2,
                    )}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateQuantity(item.variantId || item.id, item.quantity - 1)}
                    className="p-1 bg-red-100 hover:bg-red-200 rounded"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center font-medium">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.variantId || item.id, item.quantity + 1)}
                    className="p-1 bg-green-100 hover:bg-green-200 rounded"
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.variantId || item.id)}
                    className="p-1 bg-red-100 hover:bg-red-200 rounded ml-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                Cart is empty
              </div>
            )}
          </div>

          {/* AI Recommendations */}
          {recommendations.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 rounded-lg border-2 border-yellow-200">
              <h3 className="text-sm font-bold mb-2 flex items-center text-yellow-800">
                <Lightbulb size={16} className="mr-1" />
                Recommended Items
              </h3>
              <div className="space-y-1 max-h-[120px] overflow-y-auto">
                {recommendations.slice(0, 3).map((rec) => (
                  <button
                    key={rec.id}
                    onClick={() => addToCart(rec)}
                    className="w-full text-left text-xs p-2 bg-white hover:bg-yellow-100 rounded border border-yellow-100 transition-colors"
                  >
                    <p className="font-medium line-clamp-1">{rec.name}</p>
                    <p className="text-yellow-700 font-semibold">
                      ₨{rec.price}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="border-t pt-4 space-y-3">
            {/* Discount Code */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Discount Code
              </label>
              {discountApplied ? (
                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <div className="flex items-center">
                    <Tag className="text-green-600 mr-2" size={16} />
                    <span className="text-sm font-medium text-green-700">
                      {discountApplied.code}
                    </span>
                  </div>
                  <button
                    onClick={handleRemoveDiscount}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) =>
                      setDiscountCode(e.target.value.toUpperCase())
                    }
                    placeholder="Enter code"
                    className="flex-1 p-2 border rounded text-sm"
                  />
                  <button
                    onClick={handleApplyDiscount}
                    className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>

            {/* Tax Rate */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Tax Rate (%)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  min="0"
                  max="100"
                  step="0.1"
                  className="flex-1 p-2 border rounded text-sm"
                />
                <Percent size={16} className="text-gray-400" />
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₨{getSubtotal().toFixed(2)}</span>
              </div>
              {discountApplied && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-₨{getDiscountAmount().toFixed(2)}</span>
                </div>
              )}
              {taxRate > 0 && (
                <div className="flex justify-between">
                  <span>Tax ({taxRate}%):</span>
                  <span>₨{getTaxAmount().toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span className="text-primary text-xl">
                  ₨{getTotal().toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPaymentMethod("cash")}
                  className={`p-2 rounded-lg flex items-center justify-center transition-colors ${
                    paymentMethod === "cash"
                      ? "bg-primary text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  <DollarSign size={16} className="mr-1" />
                  Cash
                </button>
                <button
                  onClick={() => setPaymentMethod("card")}
                  className={`p-2 rounded-lg flex items-center justify-center transition-colors ${
                    paymentMethod === "card"
                      ? "bg-primary text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  <CreditCard size={16} className="mr-1" />
                  Card
                </button>
                <button
                  onClick={() => setPaymentMethod("easypaisa")}
                  className={`p-2 rounded-lg flex items-center justify-center transition-colors ${
                    paymentMethod === "easypaisa"
                      ? "bg-primary text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  <Phone size={16} className="mr-1" />
                  Easypaisa
                </button>
                <button
                  onClick={() => setPaymentMethod("jazzcash")}
                  className={`p-2 rounded-lg flex items-center justify-center transition-colors ${
                    paymentMethod === "jazzcash"
                      ? "bg-primary text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  <Phone size={16} className="mr-1" />
                  JazzCash
                </button>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              className="w-full bg-primary text-white py-3 rounded-lg hover:bg-secondary transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={cart.length === 0}
            >
              Complete Sale
            </button>
          </div>
        </div>
      </div>

      {/* Variant Selector Modal */}
      {showVariantSelector && selectedProduct && productVariants.length > 0 && (
        <VariantSelector
          product={selectedProduct}
          variants={productVariants}
          onSelect={handleVariantSelected}
          onClose={() => setShowVariantSelector(false)}
        />
      )}
    </div>
  );
}

export default POSTerminal;

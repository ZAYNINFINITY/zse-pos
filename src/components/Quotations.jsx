import React, { useState, useEffect } from 'react';
import { FileText, Plus, Download, X, Copy, Check } from 'lucide-react';

function Quotations({ currentUser }) {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ACTIVE');
  const [successMessage, setSuccessMessage] = useState('');
  const [taxRate, setTaxRate] = useState(0);

  const [newQuotation, setNewQuotation] = useState({
    customer_name: '',
    customer_phone: '',
    items: [],
    notes: '',
  });

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  // Load quotations on mount
  useEffect(() => {
    loadQuotations();
    loadProducts();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await window.electronAPI.getSettings();
      const rate = settings?.taxRate ? parseFloat(settings.taxRate) : 0;
      setTaxRate(Number.isFinite(rate) ? rate : 0);
    } catch (err) {
      console.error('Error loading settings:', err);
      setTaxRate(0);
    }
  };

  const loadQuotations = async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.getQuotations({ status: filterStatus });
      setQuotations(data);
    } catch (err) {
      console.error('Error loading quotations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await window.electronAPI.getProducts();
      setProducts(data);
    } catch (err) {
      console.error('Error loading products:', err);
    }
  };

  useEffect(() => {
    loadQuotations();
  }, [filterStatus]);

  const handleAddItem = () => {
    if (!selectedProduct) {
      alert('Please select a product');
      return;
    }

    const product = products.find(p => p.id === parseInt(selectedProduct));
    if (!product) return;

    const newItem = {
      product_id: product.id,
      product_name: product.name,
      price: product.price,
      quantity: selectedQuantity,
      total: product.price * selectedQuantity,
    };

    setNewQuotation(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));

    setSelectedProduct('');
    setSelectedQuantity(1);
  };

  const handleRemoveItem = (index) => {
    setNewQuotation(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const calculateTotals = () => {
    const subtotal = newQuotation.items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newQuotation.customer_name || !newQuotation.customer_phone) {
      alert('Please enter customer details');
      return;
    }

    if (newQuotation.items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    setLoading(true);
    try {
      const { subtotal, tax, total } = calculateTotals();

      const result = await window.electronAPI.createQuotation({
        customer_name: newQuotation.customer_name,
        customer_phone: newQuotation.customer_phone,
        items: newQuotation.items,
        subtotal,
        tax,
        total,
        notes: newQuotation.notes,
        userId: currentUser.id,
      });

      if (result.success) {
        setSuccessMessage(
          `Quotation ${result.quotation.quotation_number} created successfully!`,
        );
        setShowForm(false);
        setNewQuotation({
          customer_name: '',
          customer_phone: '',
          items: [],
          notes: '',
        });
        setTimeout(() => setSuccessMessage(''), 3000);
        loadQuotations();
      }
    } catch (err) {
      console.error('Error creating quotation:', err);
      alert('Failed to create quotation');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (quotationId, newStatus) => {
    try {
      await window.electronAPI.updateQuotationStatus(quotationId, newStatus);
      loadQuotations();
    } catch (err) {
      console.error('Error updating quotation status:', err);
    }
  };

  const handleSendWhatsApp = async (quotation) => {
    try {
      const result = await window.electronAPI.sendQuotationWhatsApp({
        quotationId: quotation.id,
        phone: quotation.customer_phone,
      });
      if (result?.success) {
        alert('Quotation sent on WhatsApp successfully!');
      } else {
        alert(result?.message || 'Failed to send WhatsApp message');
      }
    } catch (err) {
      console.error('Error sending WhatsApp:', err);
      alert('Failed to send WhatsApp message');
    }
  };

  const { subtotal, tax, total } = calculateTotals();

  const filteredQuotations = quotations.filter(q =>
    searchTerm === ''
      ? true
      : q.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <FileText className="text-primary" size={32} />
          Quotations
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors"
        >
          <Plus size={20} />
          New Quotation
        </button>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          ✅ {successMessage}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4">Create New Quotation</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={newQuotation.customer_name}
                  onChange={e =>
                    setNewQuotation(prev => ({
                      ...prev,
                      customer_name: e.target.value,
                    }))
                  }
                  placeholder="Enter customer name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newQuotation.customer_phone}
                  onChange={e =>
                    setNewQuotation(prev => ({
                      ...prev,
                      customer_phone: e.target.value,
                    }))
                  }
                  placeholder="03001234567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>

            {/* Add Items */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Add Items</h3>
              <div className="grid grid-cols-12 gap-2 mb-3">
                <select
                  value={selectedProduct}
                  onChange={e => setSelectedProduct(e.target.value)}
                  className="col-span-7 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="">Select Product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} - {p.price}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  value={selectedQuantity}
                  onChange={e => setSelectedQuantity(parseInt(e.target.value) || 1)}
                  className="col-span-3 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  placeholder="Qty"
                />

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="col-span-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors text-sm font-medium"
                >
                  Add
                </button>
              </div>

              {/* Items List */}
              {newQuotation.items.length > 0 && (
                <div className="mb-4 bg-gray-50 rounded-lg p-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Product</th>
                        <th className="text-right py-2">Price</th>
                        <th className="text-right py-2">Qty</th>
                        <th className="text-right py-2">Total</th>
                        <th className="text-center py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {newQuotation.items.map((item, idx) => (
                        <tr key={idx} className="border-b hover:bg-white">
                          <td className="py-2">{item.product_name}</td>
                          <td className="text-right">{item.price}</td>
                          <td className="text-right">{item.quantity}</td>
                          <td className="text-right font-semibold">{item.total}</td>
                          <td className="text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals */}
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span className="font-semibold">{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax:</span>
                      <span className="font-semibold">{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-primary">{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={newQuotation.notes}
                onChange={e =>
                  setNewQuotation(prev => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="Add any notes..."
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Creating...' : 'Create Quotation'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search and Filter */}
      <div className="grid grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Search by customer or quotation#"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="ACTIVE">Active</option>
          <option value="CONVERTED">Converted</option>
          <option value="EXPIRED">Expired</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="">All</option>
        </select>
      </div>

      {/* Quotations List */}
      {loading && <p className="text-center text-gray-500">Loading...</p>}

      {!loading && filteredQuotations.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No quotations found
        </div>
      )}

      <div className="grid gap-4">
        {filteredQuotations.map(quotation => (
          <div
            key={quotation.id}
            className="bg-white border border-gray-300 rounded-lg p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-bold">{quotation.quotation_number}</h3>
                <p className="text-sm text-gray-600">{quotation.customer_name}</p>
                <p className="text-xs text-gray-600">📞 {quotation.customer_phone}</p>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  {quotation.total.toFixed(2)}
                </p>
                <select
                  value={quotation.status}
                  onChange={e =>
                    handleStatusChange(quotation.id, e.target.value)
                  }
                  className={`mt-2 px-3 py-1 text-xs rounded font-semibold ${
                    quotation.status === 'ACTIVE'
                      ? 'bg-blue-100 text-blue-800'
                      : quotation.status === 'CONVERTED'
                        ? 'bg-green-100 text-green-800'
                        : quotation.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="CONVERTED">Converted</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            {quotation.items && quotation.items.length > 0 && (
              <div className="bg-gray-50 rounded p-3 mb-3 text-sm">
                <p className="font-semibold mb-2">Items in quota:</p>
                <ul className="space-y-1">
                  {quotation.items.map((item, idx) => (
                    <li key={idx} className="text-gray-700">
                      • {item.product_name} x{item.quantity} = {item.total}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {quotation.notes && (
              <div className="mb-3 text-sm text-gray-600 italic">
                📝 {quotation.notes}
              </div>
            )}

            <div className="flex gap-2">
              <button className="flex items-center gap-1 px-3 py-1 text-sm bg-primary text-white rounded hover:bg-secondary transition-colors">
                <Download size={14} />
                Download PDF
              </button>
              <button
                onClick={() => handleSendWhatsApp(quotation)}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                <Copy size={14} />
                Send WhatsApp
              </button>
              {quotation.status === 'ACTIVE' && (
                <button
                  onClick={() =>
                    handleStatusChange(quotation.id, 'CONVERTED')
                  }
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  <Check size={14} />
                  Convert to Invoice
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Quotations;

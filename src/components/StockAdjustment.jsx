import React, { useState, useEffect } from 'react';
import { Plus, Package, AlertTriangle } from 'lucide-react';

function StockAdjustment({ currentUser }) {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustmentType, setAdjustmentType] = useState('add');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [adjustments, setAdjustments] = useState([]);

  useEffect(() => {
    loadProducts();
    loadAdjustments();
  }, []);

  const loadProducts = async () => {
    try {
      const prods = await window.electronAPI.getProducts();
      setProducts(prods);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadAdjustments = async () => {
    try {
      const adj = await window.electronAPI.getStockAdjustments();
      setAdjustments(adj);
    } catch (error) {
      console.error('Error loading adjustments:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) {
      alert('Please select a product');
      return;
    }

    try {
      const result = await window.electronAPI.addStockAdjustment({
        productId: selectedProduct.id,
        adjustmentType,
        quantity: parseInt(quantity),
        reason,
        notes,
        userId: currentUser?.id || null
      });
      
      alert(`Stock adjusted successfully! New stock: ${result.newStock}`);
      resetForm();
      loadProducts();
      loadAdjustments();
    } catch (error) {
      console.error('Error adjusting stock:', error);
      alert('Error adjusting stock');
    }
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setAdjustmentType('add');
    setQuantity('');
    setReason('');
    setNotes('');
  };

  const getAdjustmentTypeLabel = (type) => {
    switch (type) {
      case 'add': return 'Add Stock';
      case 'subtract': return 'Remove Stock';
      case 'set': return 'Set Stock';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Package className="text-primary mr-3" size={32} />
        <h1 className="text-3xl font-bold text-primary">Stock Adjustments</h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Make Stock Adjustment</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Product *</label>
            <select
              value={selectedProduct?.id || ''}
              onChange={(e) => {
                const product = products.find(p => p.id === parseInt(e.target.value));
                setSelectedProduct(product || null);
              }}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Select Product</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} (Current: {product.stock})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Adjustment Type *</label>
            <select
              value={adjustmentType}
              onChange={(e) => setAdjustmentType(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="add">Add Stock</option>
              <option value="subtract">Remove Stock</option>
              <option value="set">Set Stock (Override)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Quantity *</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              required
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reason *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Select Reason</option>
              <option value="damaged">Damaged Goods</option>
              <option value="returned">Returned Items</option>
              <option value="transferred">Transferred</option>
              <option value="found">Found/Discovered</option>
              <option value="correction">Inventory Correction</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              rows="3"
              placeholder="Additional notes about this adjustment..."
            />
          </div>
          {selectedProduct && (
            <div className="col-span-2 p-3 bg-blue-50 rounded">
              <p className="text-sm">
                <strong>Current Stock:</strong> {selectedProduct.stock}<br />
                <strong>After {getAdjustmentTypeLabel(adjustmentType)}:</strong>{' '}
                {adjustmentType === 'add' && `${selectedProduct.stock + parseInt(quantity || 0)}`}
                {adjustmentType === 'subtract' && `${Math.max(0, selectedProduct.stock - parseInt(quantity || 0))}`}
                {adjustmentType === 'set' && `${quantity || 0}`}
              </p>
            </div>
          )}
          <div className="col-span-2 flex space-x-2">
            <button
              type="submit"
              className="bg-primary text-white px-6 py-2 rounded hover:bg-secondary transition-colors"
            >
              Apply Adjustment
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400 transition-colors"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Recent Adjustments</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {adjustments.slice(0, 20).map(adj => (
                <tr key={adj.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-600">
                    {new Date(adj.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-sm font-medium">{adj.product_name}</td>
                  <td className="px-4 py-2 text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      adj.adjustment_type === 'add' ? 'bg-green-100 text-green-800' :
                      adj.adjustment_type === 'subtract' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {getAdjustmentTypeLabel(adj.adjustment_type)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm font-semibold">{adj.quantity}</td>
                  <td className="px-4 py-2 text-sm text-gray-600 capitalize">{adj.reason}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{adj.user_name || 'System'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {adjustments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No adjustments recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StockAdjustment;









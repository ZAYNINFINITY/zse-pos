import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package, Upload, X, Download, FileUp } from 'lucide-react';

function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [csvData, setCsvData] = useState('');
  const [columnMapping, setColumnMapping] = useState({});
  const [detectedColumns, setDetectedColumns] = useState(null);
  const [importStatus, setImportStatus] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    categoryId: '',
    costPrice: '',
    price: '',
    stock: '',
    barcode: '',
    imagePath: '',
    taxRate: ''
  });

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      const prods = await window.electronAPI.getProducts();
      setProducts(prods);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await window.electronAPI.getCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleImageSelect = async () => {
    try {
      const result = await window.electronAPI.openFileDialog([
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }
      ]);
      if (!result.canceled && result.filePaths.length > 0) {
        setFormData({ ...formData, imagePath: result.filePaths[0] });
      }
    } catch (error) {
      console.error('Error selecting image:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        name: formData.name,
        sku: formData.sku || null,
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
        costPrice: parseFloat(formData.costPrice) || 0,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 0,
        barcode: formData.barcode || null,
        imagePath: formData.imagePath || null,
        taxRate: parseFloat(formData.taxRate) || 0
      };

      if (editingProduct) {
        productData.id = editingProduct.id;
        await window.electronAPI.updateProduct(productData);
        alert('Product updated successfully!');
      } else {
        await window.electronAPI.addProduct(productData);
        alert('Product added successfully!');
      }
      resetForm();
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product. SKU or barcode may already exist.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      categoryId: '',
      costPrice: '',
      price: '',
      stock: '',
      barcode: '',
      imagePath: '',
      taxRate: ''
    });
    setEditingProduct(null);
    setShowAddForm(false);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku || '',
      categoryId: product.category_id || '',
      costPrice: product.cost_price || '',
      price: product.price,
      stock: product.stock || '',
      barcode: product.barcode || '',
      imagePath: product.image_path || '',
      taxRate: product.tax_rate || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        await window.electronAPI.deleteProduct(productId);
        alert('Product deleted successfully!');
        loadProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product. It may be referenced in sales.');
      }
    }
  };

  const handleCSVFileSelect = async () => {
    try {
      const result = await window.electronAPI.openFileDialog([
        { name: 'CSV Files', extensions: ['csv'] }
      ]);
      if (!result.canceled && result.filePaths.length > 0) {
        // Read file content via IPC
        const data = await window.electronAPI.readFile(result.filePaths[0]);
        setCsvData(data);
        
        // Auto-detect columns
        const detected = await window.electronAPI.detectCSVColumns(data);
        if (detected.success) {
          setDetectedColumns(detected);
          setColumnMapping(detected.detectedMapping);
          setImportStatus('');
        } else {
          setImportStatus('Error: ' + detected.message);
        }
      }
    } catch (error) {
      console.error('Error selecting CSV file:', error);
      setImportStatus('Error selecting file: ' + error.message);
    }
  };

  const handleImportCSV = async () => {
    if (!csvData.trim()) {
      setImportStatus('Please select a CSV file first');
      return;
    }
    
    try {
      setImportStatus('Importing...');
      const result = await window.electronAPI.importCSVWithMapping(csvData, columnMapping, true);
      
      if (result.success || result.imported > 0) {
        setImportStatus(`✅ Successfully imported ${result.imported} products!`);
        if (result.errors && result.errors.length > 0) {
          setImportStatus(prev => prev + `\n⚠️ Skipped ${result.errors.length} rows with errors`);
        }
        loadProducts();
        setTimeout(() => {
          setCsvData('');
          setColumnMapping({});
          setDetectedColumns(null);
          setShowCSVImport(false);
          setImportStatus('');
        }, 2000);
      } else {
        setImportStatus('Error: ' + (result.message || 'Import failed'));
      }
    } catch (error) {
      console.error('Error importing CSV:', error);
      setImportStatus('Error: ' + error.message);
    }
  };

  const handleExportCSV = async () => {
    try {
      const csvContent = await window.electronAPI.exportInventoryCSV();
      const timestamp = new Date().toISOString().split('T')[0];
      const result = await window.electronAPI.saveFileDialog(
        `inventory_${timestamp}.csv`,
        [{ name: 'CSV Files', extensions: ['csv'] }]
      );
      
      if (result && result.filePath) {
        await window.electronAPI.writeFile(result.filePath, csvContent);
        alert('✅ Inventory exported successfully!');
      }
    } catch (error) {
      console.error('Error exporting inventory:', error);
      alert('Error exporting inventory: ' + error.message);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary flex items-center">
          <Package className="mr-3" size={32} />
          Product Management
        </h1>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            title="Export all products to CSV"
          >
            <Download className="mr-2" size={20} />
            Export CSV
          </button>
          <button
            onClick={() => setShowCSVImport(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            title="Import products from CSV"
          >
            <FileUp className="mr-2" size={20} />
            Import CSV
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary transition-colors flex items-center"
          >
            <Plus className="mr-2" size={20} />
            Add Product
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Product Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">SKU</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Auto-generated if empty"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cost Price (₨)</label>
              <input
                type="number"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Selling Price (₨) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                required
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stock Quantity</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Barcode</label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tax Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                min="0"
                max="100"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Product Image</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={formData.imagePath}
                  readOnly
                  className="flex-1 p-2 border rounded bg-gray-50"
                  placeholder="No image selected"
                />
                <button
                  type="button"
                  onClick={handleImageSelect}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded flex items-center"
                >
                  <Upload className="mr-2" size={16} />
                  Browse
                </button>
              </div>
              {formData.imagePath && (
                <div className="mt-2 relative inline-block">
                  <img
                    src={formData.imagePath}
                    alt="Preview"
                    className="h-24 w-24 object-cover rounded border"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, imagePath: '' })}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
            <div className="col-span-2 flex space-x-2">
              <button
                type="submit"
                className="bg-primary text-white px-6 py-2 rounded hover:bg-secondary transition-colors"
              >
                {editingProduct ? 'Update Product' : 'Add Product'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {showCSVImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-2xl max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Import Products from CSV</h2>
              <button
                onClick={() => {
                  setShowCSVImport(false);
                  setCsvData('');
                  setColumnMapping({});
                  setDetectedColumns(null);
                  setImportStatus('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            {!detectedColumns ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Select a CSV file with your product data. Required columns: Name, Price. Optional: SKU, Category, Cost Price, Stock, Barcode
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleCSVFileSelect}
                    className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <FileUp className="mr-2" size={20} />
                    Select CSV File
                  </button>
                </div>
                {importStatus && (
                  <div className={`p-3 rounded ${importStatus.startsWith('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {importStatus}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <p className="text-sm font-medium text-blue-900">Auto-detected columns ({Object.keys(detectedColumns.detectedMapping).length}):</p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {Object.entries(columnMapping).map(([field, colIndex]) => (
                      <div key={field} className="text-xs text-blue-800">
                        <strong>{field}:</strong> {detectedColumns.headers[colIndex]}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded border">
                  <p className="text-sm font-medium mb-2">Sample row:</p>
                  <div className="grid gap-1 text-xs text-gray-700">
                    {detectedColumns.sampleRow.slice(0, 5).map((val, i) => (
                      <div key={i}>
                        <strong>{detectedColumns.headers[i]}:</strong> {val}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleImportCSV}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Import {detectedColumns.totalRows} rows
                  </button>
                  <button
                    onClick={() => {
                      setCsvData('');
                      setColumnMapping({});
                      setDetectedColumns(null);
                      setImportStatus('');
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>

                {importStatus && (
                  <div className={`p-3 rounded ${importStatus.startsWith('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {importStatus}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Selling Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map(product => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.image_path ? (
                      <img
                        src={product.image_path}
                        alt={product.name}
                        className="h-12 w-12 object-cover rounded"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
                        <Package className="text-gray-400" size={20} />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      {product.barcode && (
                        <div className="text-sm text-gray-500">Barcode: {product.barcode}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.category_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.sku || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₨{product.cost_price ? product.cost_price.toFixed(2) : '0.00'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary">
                    ₨{product.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.stock > 10
                        ? 'bg-green-100 text-green-800'
                        : product.stock > 0
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-primary hover:text-secondary mr-3"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {products.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No products found. Add your first product to get started.
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductManagement;

import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingDown, Package, RefreshCw, Download, Upload, X } from 'lucide-react';

function InventoryDashboard() {
  const [products, setProducts] = useState([]);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [showColumnMapper, setShowColumnMapper] = useState(false);
  const [csvData, setCsvData] = useState('');
  const [csvInfo, setCsvInfo] = useState(null);
  const [columnMapping, setColumnMapping] = useState({});
  const [autoCreateCategories, setAutoCreateCategories] = useState(true);
  const [importLoading, setImportLoading] = useState(false);
  const [importMessage, setImportMessage] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const prods = await window.electronAPI.getProducts();
      setProducts(prods);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const lowStockProducts = products.filter(product => product.stock <= lowStockThreshold && product.stock > 0);
  const outOfStockProducts = products.filter(product => product.stock === 0);
  const totalValue = products.reduce((sum, product) => sum + (product.price * product.stock), 0);

  const updateStock = async (productId, newStock) => {
    try {
      await window.electronAPI.updateStock(productId, newStock);
      loadProducts();
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Error updating stock');
    }
  };

  const handleExportCSV = async () => {
    try {
      const csvData = await window.electronAPI.exportInventoryCSV();
      const result = await window.electronAPI.saveFileDialog(
        `inventory_export_${new Date().toISOString().split('T')[0]}.csv`,
        [{ name: 'CSV Files', extensions: ['csv'] }]
      );
      
      if (!result.canceled && result.filePath) {
        const writeResult = await window.electronAPI.writeFile(result.filePath, csvData);
        if (writeResult.success) {
          alert('Inventory exported successfully!');
        } else {
          alert('Error writing file: ' + writeResult.error);
        }
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Error exporting inventory');
    }
  };

  const handleImportCSV = async () => {
    try {
      const result = await window.electronAPI.openFileDialog([
        { name: 'CSV Files', extensions: ['csv'] }
      ]);
      
      if (!result.canceled && result.filePaths.length > 0) {
        const readResult = await window.electronAPI.readFile(result.filePaths[0]);
        if (readResult.success) {
          setCsvData(readResult.data);
          
          // Detect columns
          const detection = await window.electronAPI.detectCSVColumns(readResult.data);
          if (detection.success) {
            setCsvInfo(detection);
            setColumnMapping(detection.detectedMapping);
            setShowColumnMapper(true);
          } else {
            alert('Error detecting CSV format: ' + detection.message);
          }
        } else {
          alert('Error reading file: ' + readResult.error);
        }
      }
    } catch (error) {
      console.error('Error importing CSV:', error);
      alert('Error loading CSV file');
    }
  };

  const handleConfirmImport = async () => {
    setImportLoading(true);
    setImportMessage('Importing...');

    try {
      const result = await window.electronAPI.importCSVWithMapping(
        csvData,
        columnMapping,
        autoCreateCategories
      );

      if (result.success) {
        setImportMessage(`✅ ${result.message}`);
        await loadProducts();
        setTimeout(() => {
          setShowColumnMapper(false);
          setImportMessage('');
        }, 2000);
      } else {
        setImportMessage(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportMessage('❌ Import failed');
    } finally {
      setImportLoading(false);
    }
  };

  const handleColumnChange = (field, columnIndex) => {
    setColumnMapping(prev => ({
      ...prev,
      [field]: columnIndex === -1 ? undefined : columnIndex
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary flex items-center">
          <Package className="mr-3" size={32} />
          Inventory Dashboard
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={handleExportCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <Download className="mr-2" size={20} />
            Export CSV
          </button>
          <button
            onClick={handleImportCSV}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Upload className="mr-2" size={20} />
            Import CSV (Smart)
          </button>
          <button
            onClick={loadProducts}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary transition-colors flex items-center"
          >
            <RefreshCw className="mr-2" size={20} />
            Refresh
          </button>
        </div>
      </div>

      {/* Column Mapper Modal */}
      {showColumnMapper && csvInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Map CSV Columns</h2>
                <button
                  onClick={() => setShowColumnMapper(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Found {csvInfo.totalRows} rows with {csvInfo.headers.length} columns. Map your columns to our system.
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Sample Data */}
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm font-semibold mb-2">Sample Row:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {csvInfo.headers.map((header, idx) => (
                    <div key={idx}>
                      <span className="font-semibold">{header}:</span> {csvInfo.sampleRow[idx]}
                    </div>
                  ))}
                </div>
              </div>

              {/* Column Mapping */}
              <div className="space-y-3">
                <p className="font-semibold">Column Mapping:</p>
                {['name', 'sku', 'category', 'price', 'cost_price', 'stock', 'barcode'].map(field => (
                  <div key={field} className="flex items-center gap-4">
                    <label className="w-24 font-medium text-sm capitalize">{field}:</label>
                    <select
                      value={columnMapping[field] !== undefined ? columnMapping[field] : -1}
                      onChange={e => handleColumnChange(field, parseInt(e.target.value))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value={-1}>-- Skip --</option>
                      {csvInfo.headers.map((header, idx) => (
                        <option key={idx} value={idx}>
                          {header} (Sample: {csvInfo.sampleRow[idx]})
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Options */}
              <div className="border-t pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoCreateCategories}
                    onChange={e => setAutoCreateCategories(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Auto-create missing categories</span>
                </label>
              </div>

              {/* Import Message */}
              {importMessage && (
                <div className={`p-3 rounded text-sm ${
                  importMessage.includes('✅')
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}>
                  {importMessage}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <button
                  onClick={() => setShowColumnMapper(false)}
                  disabled={importLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={importLoading || !columnMapping.name || !columnMapping.price}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary disabled:opacity-50"
                >
                  {importLoading ? 'Importing...' : 'Import'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <AlertTriangle className="text-yellow-500 mr-3" size={24} />
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-yellow-600">{lowStockProducts.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <TrendingDown className="text-red-500 mr-3" size={24} />
            <div>
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{outOfStockProducts.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Package className="text-green-500 mr-3" size={24} />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Inventory Value</p>
              <p className="text-2xl font-bold text-green-600">₨{totalValue.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Low Stock Alerts</h2>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Threshold:</label>
            <input
              type="number"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(parseInt(e.target.value))}
              className="w-16 p-1 border rounded text-center"
              min="0"
            />
          </div>
        </div>
        {lowStockProducts.length > 0 ? (
          <div className="space-y-2">
            {lowStockProducts.map(product => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="text-yellow-500 mr-3" size={20} />
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.category_name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">Stock: {product.stock}</span>
                  <input
                    type="number"
                    placeholder="New stock"
                    className="w-20 p-1 border rounded text-center"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const newStock = parseInt(e.target.value);
                        if (newStock >= 0) {
                          updateStock(product.id, newStock);
                          e.target.value = '';
                        }
                      }
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No low stock items</p>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Out of Stock Items</h2>
        {outOfStockProducts.length > 0 ? (
          <div className="space-y-2">
            {outOfStockProducts.map(product => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center">
                  <TrendingDown className="text-red-500 mr-3" size={20} />
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.category_name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-red-600 font-medium">Out of Stock</span>
                  <input
                    type="number"
                    placeholder="Restock qty"
                    className="w-20 p-1 border rounded text-center"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const newStock = parseInt(e.target.value);
                        if (newStock > 0) {
                          updateStock(product.id, newStock);
                          e.target.value = '';
                        }
                      }
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">All items in stock</p>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">All Products Inventory</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map(product => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">{product.name}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{product.category_name}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{product.stock}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">₨{(product.price * product.stock).toFixed(2)}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.stock === 0
                        ? 'bg-red-100 text-red-800'
                        : product.stock <= lowStockThreshold
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {product.stock === 0 ? 'Out of Stock' : product.stock <= lowStockThreshold ? 'Low Stock' : 'In Stock'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default InventoryDashboard;

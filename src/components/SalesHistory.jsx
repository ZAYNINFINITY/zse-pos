import React, { useState, useEffect } from 'react';
import { History, Search, Eye, RotateCcw, FileText, X } from 'lucide-react';
import jsPDF from 'jspdf';

function SalesHistory() {
  const [sales, setSales] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [saleDetails, setSaleDetails] = useState(null);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      const salesData = await window.electronAPI.getSales();
      setSales(salesData);
    } catch (error) {
      console.error('Error loading sales:', error);
    }
  };

  const loadSaleDetails = async (saleId) => {
    try {
      const details = await window.electronAPI.getSaleDetails(saleId);
      setSaleDetails(details);
      setSelectedSale(saleId);
    } catch (error) {
      console.error('Error loading sale details:', error);
      alert('Error loading sale details');
    }
  };

  const handleReturnSale = async (saleId) => {
    if (!window.confirm('Are you sure you want to return this sale? Stock will be restored.')) {
      return;
    }
    
    const reason = prompt('Enter return reason:');
    if (!reason) return;

    try {
      await window.electronAPI.returnSale(saleId, reason);
      alert('Sale returned successfully. Stock has been restored.');
      loadSales();
      if (selectedSale === saleId) {
        setSelectedSale(null);
        setSaleDetails(null);
      }
    } catch (error) {
      console.error('Error returning sale:', error);
      alert('Error returning sale');
    }
  };

  const generatePDFReceipt = (sale) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let yPos = margin;

    // Header
    doc.setFontSize(20);
    doc.text('ZSE POS SYSTEM', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    doc.setFontSize(12);
    doc.text('Sanitary & Electronics Store', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    doc.setFontSize(10);
    doc.text(`Receipt #${sale.id}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // Line
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    // Sale Info
    doc.setFontSize(10);
    doc.text(`Date: ${new Date(sale.date).toLocaleString()}`, margin, yPos);
    yPos += 6;
    if (sale.customer_name) {
      doc.text(`Customer: ${sale.customer_name}`, margin, yPos);
      yPos += 6;
    }
    if (sale.user_name) {
      doc.text(`Cashier: ${sale.user_name}`, margin, yPos);
      yPos += 6;
    }
    yPos += 4;

    // Items
    doc.setFontSize(12);
    doc.text('Items:', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    sale.items.forEach((item, index) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = margin;
      }
      const itemTotal = item.total || (item.unit_price * item.quantity);
      doc.text(`${item.quantity}x ${item.product_name}`, margin, yPos);
      doc.text(`₨${itemTotal.toFixed(2)}`, pageWidth - margin - 30, yPos, { align: 'right' });
      yPos += 6;
    });

    yPos += 6;
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    // Totals
    doc.setFontSize(10);
    doc.text(`Subtotal:`, pageWidth - margin - 50, yPos);
    doc.text(`₨${(sale.subtotal || sale.total).toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 6;

    if (sale.discount_amount > 0) {
      doc.text(`Discount:`, pageWidth - margin - 50, yPos);
      doc.text(`-₨${sale.discount_amount.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 6;
    }

    if (sale.tax_amount > 0) {
      doc.text(`Tax:`, pageWidth - margin - 50, yPos);
      doc.text(`₨${sale.tax_amount.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 6;
    }

    yPos += 4;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Total:`, pageWidth - margin - 50, yPos);
    doc.text(`₨${sale.total.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 10;

    // Payment
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Payment Method: ${sale.payment_method.toUpperCase()}`, margin, yPos);
    yPos += 10;

    // Footer
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
    doc.setFontSize(9);
    doc.text('Thank you for your business!', pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    doc.text('Returns accepted within 7 days with receipt', pageWidth / 2, yPos, { align: 'center' });

    // Save PDF
    const fileName = `receipt_${sale.id}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const handlePrintReceipt = async (sale) => {
    try {
      const details = sale.items ? sale : await window.electronAPI.getSaleDetails(sale.id);
      generatePDFReceipt(details);
    } catch (error) {
      console.error('Error generating receipt:', error);
      alert('Error generating receipt');
    }
  };

  const filteredSales = sales.filter(sale =>
    sale.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.payment_method.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.id.toString().includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary flex items-center">
          <History className="mr-3" size={32} />
          Sales History
        </h1>
        <div className="relative w-64">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by customer, payment, date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className={`col-span-${selectedSale ? '2' : '3'}`}>
          <div className="bg-white rounded-lg shadow-md overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total (₨)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.map(sale => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">#{sale.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(sale.date).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.customer_name || 'Walk-in'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary">
                      ₨{sale.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {sale.payment_method}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {sale.is_returned ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Returned
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Completed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => loadSaleDetails(sale.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handlePrintReceipt(sale)}
                          className="text-green-600 hover:text-green-900"
                          title="Print Receipt"
                        >
                          <FileText size={16} />
                        </button>
                        {!sale.is_returned && (
                          <button
                            onClick={() => handleReturnSale(sale.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Return Sale"
                          >
                            <RotateCcw size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredSales.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-500">
                      No sales found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selectedSale && saleDetails && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Sale Details</h2>
              <button
                onClick={() => {
                  setSelectedSale(null);
                  setSaleDetails(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Sale ID</p>
                <p className="font-semibold">#{saleDetails.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-semibold">{new Date(saleDetails.date).toLocaleString()}</p>
              </div>
              {saleDetails.customer_name && (
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-semibold">{saleDetails.customer_name}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Items:</p>
                <div className="space-y-2">
                  {saleDetails.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.product_name}</span>
                      <span className="font-semibold">₨{item.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>₨{(saleDetails.subtotal || saleDetails.total).toFixed(2)}</span>
                </div>
                {saleDetails.discount_amount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount:</span>
                    <span>-₨{saleDetails.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                {saleDetails.tax_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Tax:</span>
                    <span>₨{saleDetails.tax_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span className="text-primary">₨{saleDetails.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-600">Payment Method</p>
                <p className="font-semibold capitalize">{saleDetails.payment_method}</p>
              </div>

              <div className="flex space-x-2 pt-4">
                <button
                  onClick={() => handlePrintReceipt(saleDetails)}
                  className="flex-1 bg-primary text-white px-4 py-2 rounded hover:bg-secondary transition-colors flex items-center justify-center"
                >
                  <FileText className="mr-2" size={16} />
                  Print Receipt
                </button>
                {!saleDetails.is_returned && (
                  <button
                    onClick={() => handleReturnSale(saleDetails.id)}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors flex items-center justify-center"
                  >
                    <RotateCcw className="mr-2" size={16} />
                    Return Sale
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SalesHistory;

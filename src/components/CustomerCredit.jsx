import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  TrendingDown,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

function CustomerCredit() {
  const [customers, setCustomers] = useState([]);
  const [creditInfo, setCreditInfo] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showAddCredit, setShowAddCredit] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [creditLimit, setCreditLimit] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.getCustomers();
      setCustomers(data);

      // Load credit info for each customer
      const creditMap = {};
      for (const customer of data) {
        try {
          const creditData = await window.electronAPI.getCustomerCredit(
            customer.id,
          );
          creditMap[customer.id] = creditData;
        } catch (err) {
          creditMap[customer.id] = null;
        }
      }
      setCreditInfo(creditMap);
    } catch (err) {
      console.error('Error loading customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCredit = async (customerId) => {
    if (!creditLimit) {
      alert('Please enter credit limit');
      return;
    }

    try {
      await window.electronAPI.addCustomerCredit(
        customerId,
        parseFloat(creditLimit),
      );
      setSuccessMessage('Credit limit set successfully!');
      setShowAddCredit(false);
      setCreditLimit('');
      loadCustomers();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error adding credit:', err);
      alert('Failed to add credit');
    }
  };

  const handlePayment = async (customerId) => {
    if (!paymentAmount) {
      alert('Please enter payment amount');
      return;
    }

    try {
      await window.electronAPI.updateCreditBalance(
        customerId,
        parseFloat(paymentAmount),
        'credit',
        null,
      );
      setSuccessMessage('Payment recorded successfully!');
      setShowPayment(false);
      setPaymentAmount('');
      loadCustomers();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error recording payment:', err);
      alert('Failed to record payment');
    }
  };

  const getStatusColor = (credit) => {
    if (!credit || credit.current_balance <= 0)
      return 'bg-green-100 text-green-800';
    if (credit.current_balance >= credit.credit_limit)
      return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getStatusText = (credit) => {
    if (!credit || credit.current_balance <= 0) return 'No Credit';
    if (credit.current_balance >= credit.credit_limit)
      return 'Credit Maxed Out';
    return `${((credit.current_balance / credit.credit_limit) * 100).toFixed(0)}% Used`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <CreditCard className="text-primary" size={32} />
          Customer Credit (Udhar)
        </h1>
        <button
          onClick={loadCustomers}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors"
        >
          Refresh
        </button>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          ✅ {successMessage}
        </div>
      )}

      {loading && <p className="text-center text-gray-500">Loading customers...</p>}

      {!loading && customers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No customers found. Add customers first to manage their credit.
        </div>
      )}

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map(customer => {
          const credit = creditInfo[customer.id];

          return (
            <div
              key={customer.id}
              className="bg-white border border-gray-300 rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="mb-3 pb-3 border-b">
                <h3 className="text-lg font-bold">{customer.name}</h3>
                <p className="text-xs text-gray-500">📞 {customer.phone || 'No phone'}</p>
              </div>

              {/* Credit Status */}
              {credit ? (
                <div className="space-y-3">
                  {/* Balance */}
                  <div className={`p-3 rounded ${getStatusColor(credit)}`}>
                    <p className="text-xs font-semibold mb-1">
                      {getStatusText(credit)}
                    </p>
                    <p className="text-2xl font-bold">
                      {credit.current_balance.toFixed(2)}
                    </p>
                    <p className="text-xs opacity-80">
                      of {credit.credit_limit.toFixed(2)} limit
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min((credit.current_balance / credit.credit_limit) * 100, 100)}%`,
                        backgroundColor:
                          credit.current_balance >= credit.credit_limit
                            ? '#dc2626'
                            : credit.current_balance > 0
                              ? '#f59e0b'
                              : '#10b981',
                      }}
                    />
                  </div>

                  {/* Info */}
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Total Purchased:</span>
                      <span className="font-semibold">
                        {credit.total_purchased.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Paid:</span>
                      <span className="font-semibold">
                        {credit.total_paid.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Warning if maxed out */}
                  {credit.current_balance >= credit.credit_limit && (
                    <div className="bg-red-50 border border-red-200 px-3 py-2 rounded text-xs text-red-700 flex gap-2">
                      <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                      <span>Customer has maxed out credit limit</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => {
                        setSelectedCustomer(customer.id);
                        setShowPayment(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      <TrendingDown size={14} />
                      Record Payment
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCustomer(customer.id);
                        setShowAddCredit(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      <Plus size={14} />
                      Update Limit
                    </button>
                  </div>
                </div>
              ) : (
                // No credit info - option to add
                <div className="py-6">
                  <p className="text-sm text-gray-600 mb-3 text-center">
                    No credit account set up
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCustomer(customer.id);
                      setShowAddCredit(true);
                    }}
                    className="w-full flex items-center justify-center gap-1 px-3 py-2 text-sm bg-primary text-white rounded hover:bg-secondary transition-colors"
                  >
                    <Plus size={14} />
                    Create Credit Account
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal: Add/Update Credit Limit */}
      {showAddCredit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4">
              Set Credit Limit
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credit Limit Amount
              </label>
              <input
                type="number"
                value={creditLimit}
                onChange={e => setCreditLimit(e.target.value)}
                placeholder="Enter credit limit"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => {
                  setShowAddCredit(false);
                  setCreditLimit('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAddCredit(selectedCustomer)}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Record Payment */}
      {showPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4">
              Record Payment
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Amount
              </label>
              <input
                type="number"
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
                placeholder="Enter payment amount"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">
                💡 This will reduce the customer's credit balance
              </p>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => {
                  setShowPayment(false);
                  setPaymentAmount('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePayment(selectedCustomer)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerCredit;

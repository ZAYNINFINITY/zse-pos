import React, { useState } from 'react';
import {
  Building2,
  FileText,
  Users,
  Package,
  ChevronRight,
  ChevronLeft,
  Check,
} from 'lucide-react';

function SetupWizard({ onSetupComplete }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Business Info
  const [businessInfo, setBusinessInfo] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    address: '',
    currency: 'Rs',
    logo: null,
  });

  // Step 2: Invoice Settings
  const [invoiceSettings, setInvoiceSettings] = useState({
    invoicePrefix: 'INV',
    startingNumber: 1001,
    taxRate: 0,
    receiptSize: 'thermal', // thermal or a4
    enableQuotations: true,
  });

  // Step 3: Admin User
  const [adminUser, setAdminUser] = useState({
    username: 'admin',
    password: '',
    confirmPassword: '',
  });

  // Step 4: Inventory Option
  const [inventoryOption, setInventoryOption] = useState('empty');

  const handleBusinessInfoChange = (field, value) => {
    setBusinessInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleInvoiceSettingsChange = (field, value) => {
    setInvoiceSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleAdminUserChange = (field, value) => {
    setAdminUser(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = () => {
    setError('');

    if (step === 1) {
      if (!businessInfo.businessName.trim()) {
        setError('Business name is required');
        return false;
      }
      if (!businessInfo.phone.trim()) {
        setError('Phone number is required');
        return false;
      }
    }

    if (step === 3) {
      if (!adminUser.username.trim() || adminUser.username.trim().length < 3) {
        setError('Admin username must be at least 3 characters');
        return false;
      }
      if (!adminUser.password || adminUser.password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
      if (!/[A-Z]/.test(adminUser.password) || !/[0-9]/.test(adminUser.password)) {
        setError('Password must include at least 1 uppercase letter and 1 number');
        return false;
      }
      if (adminUser.password !== adminUser.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (step < 4) {
        setStep(step + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleFinish = async () => {
    if (!validateStep()) return;

    setLoading(true);
    try {
      // Save all settings to database via IPC
      const setupData = {
        businessInfo,
        invoiceSettings,
        adminUsername: adminUser.username.trim(),
        adminPassword: adminUser.password,
        inventoryOption,
      };

      const result = await window.electronAPI.completeSetup(setupData);

      if (result.success) {
        onSetupComplete();
      } else {
        setError(result.message || 'Setup failed. Please try again.');
      }
    } catch (err) {
      console.error('Setup error:', err);
      setError('Setup failed. Please check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const stepHeaders = [
    { step: 1, title: 'Business Information', icon: Building2 },
    { step: 2, title: 'Invoice Settings', icon: FileText },
    { step: 3, title: 'Admin Account', icon: Users },
    { step: 4, title: 'Inventory Setup', icon: Package },
  ];

  const currentStepHeader = stepHeaders.find(h => h.step === step);
  const StepIcon = currentStepHeader?.icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-secondary p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="bg-primary text-white p-6 flex items-center gap-4">
          {StepIcon && <StepIcon size={32} />}
          <div>
            <h1 className="text-3xl font-bold">Welcome to Your POS System</h1>
            <p className="text-accent text-sm mt-1">
              Step {step} of 4: {currentStepHeader?.title}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex justify-between items-center">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                    s <= step
                      ? 'bg-primary text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {s < step ? <Check size={20} /> : s}
                </div>
                {s < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-colors ${
                      s < step ? 'bg-primary' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-8 min-h-96">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Step 1: Business Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={businessInfo.businessName}
                  onChange={e =>
                    handleBusinessInfoChange(
                      'businessName',
                      e.target.value,
                    )
                  }
                  placeholder="e.g., Ahmed's Hardware & Sanitary"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will appear on invoices and receipts
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner Name
                </label>
                <input
                  type="text"
                  value={businessInfo.ownerName}
                  onChange={e =>
                    handleBusinessInfoChange('ownerName', e.target.value)
                  }
                  placeholder="Your name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={businessInfo.phone}
                    onChange={e =>
                      handleBusinessInfoChange('phone', e.target.value)
                    }
                    placeholder="03001234567"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={businessInfo.currency}
                    onChange={e =>
                      handleBusinessInfoChange('currency', e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Rs">Pakistani Rupee (Rs)</option>
                    <option value="$">US Dollar ($)</option>
                    <option value="€">Euro (€)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address (Optional)
                </label>
                <textarea
                  value={businessInfo.address}
                  onChange={e =>
                    handleBusinessInfoChange('address', e.target.value)
                  }
                  placeholder="Business address for invoices"
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {/* Step 2: Invoice Settings */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Prefix
                  </label>
                  <input
                    type="text"
                    value={invoiceSettings.invoicePrefix}
                    onChange={e =>
                      handleInvoiceSettingsChange(
                        'invoicePrefix',
                        e.target.value.toUpperCase(),
                      )
                    }
                    placeholder="INV"
                    maxLength="5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Invoice will be: {invoiceSettings.invoicePrefix}-{invoiceSettings.startingNumber}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Starting Invoice Number
                  </label>
                  <input
                    type="number"
                    value={invoiceSettings.startingNumber}
                    onChange={e =>
                      handleInvoiceSettingsChange(
                        'startingNumber',
                        parseInt(e.target.value) || 1001,
                      )
                    }
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    value={invoiceSettings.taxRate}
                    onChange={e =>
                      handleInvoiceSettingsChange(
                        'taxRate',
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    min="0"
                    max="100"
                    step="0.5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    0% for no tax (default)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Receipt Type
                  </label>
                  <select
                    value={invoiceSettings.receiptSize}
                    onChange={e =>
                      handleInvoiceSettingsChange('receiptSize', e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="thermal">
                      Thermal (80mm - Printer)
                    </option>
                    <option value="a4">A4 (Standard Paper)</option>
                  </select>
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={invoiceSettings.enableQuotations}
                    onChange={e =>
                      handleInvoiceSettingsChange(
                        'enableQuotations',
                        e.target.checked,
                      )
                    }
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Enable Quotations (for customers to request quotes)
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-2 ml-7">
                  Customers can request quotations before placing orders
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Admin Password */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Username *
                </label>
                <input
                  type="text"
                  value={adminUser.username}
                  onChange={e =>
                    handleAdminUserChange('username', e.target.value)
                  }
                  placeholder="e.g. admin"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Password *
                </label>
                <input
                  type="password"
                  value={adminUser.password}
                  onChange={e =>
                    handleAdminUserChange('password', e.target.value)
                  }
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-gray-500 mt-1">
                  At least 1 uppercase letter and 1 number
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={adminUser.confirmPassword}
                  onChange={e =>
                    handleAdminUserChange('confirmPassword', e.target.value)
                  }
                  placeholder="Re-enter password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 px-4 py-3 rounded">
                <p className="text-sm text-yellow-700">
                  ⚠️ Save this password in a safe place. You'll need it to manage the system.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Inventory Setup */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-700 mb-4">
                How would you like to manage your inventory?
              </p>

              <label className="block border-2 border-gray-300 rounded-lg p-4 cursor-pointer hover:border-primary transition-colors"
                onClick={() => setInventoryOption('empty')}>
                <input
                  type="radio"
                  name="inventory"
                  value="empty"
                  checked={inventoryOption === 'empty'}
                  onChange={e => setInventoryOption(e.target.value)}
                  className="w-4 h-4 accent-primary"
                />
                <span className="ml-3 font-medium text-gray-700">
                  Start with empty inventory
                </span>
                <p className="text-xs text-gray-500 mt-1 ml-7">
                  Add products manually as needed
                </p>
              </label>

              <label className="block border-2 border-gray-300 rounded-lg p-4 cursor-pointer hover:border-primary transition-colors"
                onClick={() => setInventoryOption('import')}>
                <input
                  type="radio"
                  name="inventory"
                  value="import"
                  checked={inventoryOption === 'import'}
                  onChange={e => setInventoryOption(e.target.value)}
                  className="w-4 h-4 accent-primary"
                />
                <span className="ml-3 font-medium text-gray-700">
                  Import from CSV file
                </span>
                <p className="text-xs text-gray-500 mt-1 ml-7">
                  Upload a CSV with your existing products (can customize columns)
                </p>
              </label>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Note:
                </p>
                <ul className="text-xs text-gray-600 space-y-1 ml-4 list-disc">
                  <li>
                    You can import products later from the Inventory section
                  </li>
                  <li>
                    The system will auto-create categories from your data
                  </li>
                  <li>
                    You can add more products anytime
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between gap-4">
          <button
            onClick={handlePrevious}
            disabled={step === 1 || loading}
            className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={20} />
            Previous
          </button>

          {step < 4 ? (
            <button
              onClick={handleNext}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors ml-auto"
            >
              Next
              <ChevronRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ml-auto"
            >
              <Check size={20} />
              {loading ? 'Setting up...' : 'Complete Setup'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SetupWizard;

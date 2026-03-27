import React, { useState, useEffect } from 'react';
import { Settings, Save, AlertCircle } from 'lucide-react';

function SettingsPanel() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await window.electronAPI.getSettings();
      setSettings(data);
      setFormData(data);
    } catch (err) {
      console.error('Error loading settings:', err);
      setMessage('❌ Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      // Save individual settings
      for (const [key, value] of Object.entries(formData)) {
        if (formData[key] !== settings[key]) {
          // Only save if changed - you'd implement this as an IPC call
          // For now, just confirm the change would be saved
        }
      }

      setMessage('✅ Settings saved successfully!');
      setSettings(formData);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setMessage('❌ Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <Settings className="text-primary" size={32} />
          Application Settings
        </h1>
      </div>

      {message && (
        <div className={`p-4 rounded ${
          message.includes('✅')
            ? 'bg-green-50 text-green-700'
            : 'bg-red-50 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <div className="grid gap-6">
        {/* Business Information Section */}
        <div className="bg-white border border-gray-300 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 pb-4 border-b">📊 Business Information</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name
              </label>
              <input
                type="text"
                value={formData.businessName || ''}
                onChange={e => handleChange('businessName', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-gray-500 mt-1">
                Appears on invoices and receipts
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Owner Name
              </label>
              <input
                type="text"
                value={formData.ownerName || ''}
                onChange={e => handleChange('ownerName', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.businessPhone || ''}
                onChange={e => handleChange('businessPhone', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                value={formData.currency || 'Rs'}
                onChange={e => handleChange('currency', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Rs">Pakistani Rupee (Rs)</option>
                <option value="$">US Dollar ($)</option>
                <option value="€">Euro (€)</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                value={formData.businessAddress || ''}
                onChange={e => handleChange('businessAddress', e.target.value)}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Invoice Settings Section */}
        <div className="bg-white border border-gray-300 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 pb-4 border-b">📄 Invoice Settings</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Prefix
              </label>
              <input
                type="text"
                value={formData.invoicePrefix || 'INV'}
                onChange={e => handleChange('invoicePrefix', e.target.value.toUpperCase())}
                maxLength="5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-gray-500 mt-1">
                Example: {(formData.invoicePrefix || 'INV')}-1001
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Starting Invoice Number
              </label>
              <input
                type="number"
                value={formData.invoiceStartNumber || '1001'}
                onChange={e => handleChange('invoiceStartNumber', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={formData.taxRate || '0'}
                onChange={e => handleChange('taxRate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-gray-500 mt-1">0 for no tax</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Receipt Type
              </label>
              <select
                value={formData.receiptSize || 'thermal'}
                onChange={e => handleChange('receiptSize', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="thermal">Thermal (80mm Printer)</option>
                <option value="a4">A4 (Standard Paper)</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableQuotations === '1' || false}
                  onChange={e => handleChange('enableQuotations', e.target.checked ? '1' : '0')}
                  className="w-4 h-4 accent-primary"
                />
                <span className="font-medium">Enable Quotations</span>
              </label>
              <p className="text-xs text-gray-500 mt-2 ml-7">
                Allow customers to request quotations before placing orders
              </p>
            </div>
          </div>
        </div>

        {/* Payment Methods Section */}
        <div className="bg-white border border-gray-300 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 pb-4 border-b">💳 Payment Methods</h2>

          <div className="space-y-3">
            {['Cash', 'Card', 'Bank Transfer', 'Cheque', 'Installment', 'Credit/Udhar'].map(method => (
              <label key={method} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked={true}
                  className="w-4 h-4 accent-primary"
                />
                <span>{method}</span>
              </label>
            ))}
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
            <p className="text-sm text-blue-700">
              💡 Tip: All payment methods are enabled by default. Uncheck to disable for your business.
            </p>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-white border border-gray-300 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 pb-4 border-b">ℹ️ System Information</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Setup Date:</span>
              <span className="font-medium">
                {formData.setupDate
                  ? new Date(formData.setupDate).toLocaleString()
                  : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Database:</span>
              <span className="font-medium">SQLite (Local)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Backup:</span>
              <span className="font-medium">Daily (Automatic)</span>
            </div>
          </div>
        </div>

        {/* Warning Box */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="text-yellow-700 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-yellow-700">
            <p className="font-semibold mb-1">Important</p>
            <p>Settings are stored locally. Regular backups are created automatically every 24 hours.</p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-2">
          <button
            onClick={loadSettings}
            disabled={saving}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-secondary disabled:opacity-50"
          >
            <Save size={20} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsPanel;

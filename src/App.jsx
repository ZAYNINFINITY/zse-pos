import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import SetupWizard from './components/SetupWizard';
import POSTerminal from './components/POSTerminal';
import ProductManagement from './components/ProductManagement';
import InventoryDashboard from './components/InventoryDashboard';
import SalesHistory from './components/SalesHistory';
import CustomerManagement from './components/CustomerManagement';
import Analytics from './components/Analytics';
import UserManagement from './components/UserManagement';
import StockAdjustment from './components/StockAdjustment';
import Quotations from './components/Quotations';
import CustomerCredit from './components/CustomerCredit';
import SettingsPanel from './components/SettingsPanel';
import { ShoppingCart, Package, BarChart3, History, Users, TrendingUp, LogOut, UserCog, RefreshCw, FileText, CreditCard, Settings } from 'lucide-react';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('pos');
  const [setupComplete, setSetupComplete] = useState(null); // null = loading, true = complete, false = pending
  const [appSettings, setAppSettings] = useState({});

  // Check if setup is complete on mount
  useEffect(() => {
    const checkSetup = async () => {
      try {
        const isComplete = await window.electronAPI.isSetupComplete();
        setSetupComplete(isComplete);
        
        if (isComplete) {
          const settings = await window.electronAPI.getSettings();
          setAppSettings(settings);
        }
      } catch (err) {
        console.error('Error checking setup:', err);
        setSetupComplete(false);
      }
    };

    checkSetup();
  }, []);

  const handleSetupComplete = async () => {
    setSetupComplete(true);
    const settings = await window.electronAPI.getSettings();
    setAppSettings(settings);
  };

  const renderView = () => {
    switch (currentView) {
      case 'pos':
        return <POSTerminal currentUser={currentUser} />;
      case 'products':
        return <ProductManagement />;
      case 'inventory':
        return <InventoryDashboard />;
      case 'sales':
        return <SalesHistory />;
      case 'customers':
        return <CustomerManagement />;
      case 'quotations':
        return <Quotations currentUser={currentUser} />;
      case 'credit':
        return <CustomerCredit />;
      case 'analytics':
        return <Analytics />;
      case 'users':
        return <UserManagement />;
      case 'adjustments':
        return <StockAdjustment currentUser={currentUser} />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return <POSTerminal currentUser={currentUser} />;
    }
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    setCurrentView('pos');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('pos');
  };

  const isAdmin = currentUser?.role === 'admin';

  const menuItems = [
    { id: 'pos', label: 'POS Terminal', icon: ShoppingCart, roles: ['admin', 'cashier'] },
    { id: 'products', label: 'Products', icon: Package, roles: ['admin'] },
    { id: 'inventory', label: 'Inventory', icon: BarChart3, roles: ['admin', 'cashier'] },
    { id: 'adjustments', label: 'Stock Adjustments', icon: RefreshCw, roles: ['admin'] },
    { id: 'sales', label: 'Sales History', icon: History, roles: ['admin', 'cashier'] },
    { id: 'quotations', label: 'Quotations', icon: FileText, roles: ['admin', 'cashier'] },
    { id: 'customers', label: 'Customers', icon: Users, roles: ['admin', 'cashier'] },
    { id: 'credit', label: 'Customer Credit', icon: CreditCard, roles: ['admin', 'cashier'] },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, roles: ['admin'] },
    { id: 'users', label: 'User Management', icon: UserCog, roles: ['admin'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin'] },
  ].filter(item => item.roles.includes(currentUser?.role));

  // Show loading state while checking setup
  if (setupComplete === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-secondary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-accent mx-auto mb-4"></div>
          <p className="text-white text-xl font-semibold">Loading Application...</p>
        </div>
      </div>
    );
  }

  // Show setup wizard if setup not complete
  if (!setupComplete) {
    return <SetupWizard onSetupComplete={handleSetupComplete} />;
  }

  // Show login if no user logged in
  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  // Show main app with navigation
  return (
    <div className="h-screen flex bg-gray-50">
      <nav className="w-64 bg-primary text-white shadow-lg flex flex-col overflow-y-auto">
        <div className="p-6 sticky top-0 bg-primary">
          <h1 className="text-2xl font-bold mb-2">{appSettings.businessName || 'POS System'}</h1>
          <p className="text-sm opacity-80">{appSettings.businessCity || 'Point of Sale'}</p>
        </div>
        <ul className="space-y-2 px-4 flex-1 py-4">
          {menuItems.map(item => (
            <li key={item.id}>
              <button
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                  currentView === item.id
                    ? 'bg-accent text-white'
                    : 'hover:bg-secondary text-white'
                }`}
              >
                <item.icon className="mr-3" size={20} />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
        <div className="p-4 border-t border-accent">
          <div className="mb-3 px-3">
            <p className="text-sm font-medium">{currentUser.username}</p>
            <p className="text-xs opacity-80 capitalize">{currentUser.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center p-3 rounded-lg hover:bg-secondary text-white transition-colors"
          >
            <LogOut className="mr-3" size={20} />
            Logout
          </button>
        </div>
      </nav>
      <main className="flex-1 overflow-hidden">
        <div className="h-full p-6 overflow-y-auto">
          {renderView()}
        </div>
      </main>
    </div>
  );
}

export default App;


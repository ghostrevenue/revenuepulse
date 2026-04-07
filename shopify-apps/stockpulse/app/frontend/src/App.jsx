import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard.jsx';
import Products from './pages/Products.jsx';
import Alerts from './pages/Alerts.jsx';
import Suppliers from './pages/Suppliers.jsx';
import Locations from './pages/Locations.jsx';
import Analytics from './pages/Analytics.jsx';
import Billing from './pages/Billing.jsx';

const App = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [storeId, setStoreId] = useState('demo-store');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'products', label: 'Products', icon: '📦' },
    { id: 'alerts', label: 'Alerts', icon: '🔔' },
    { id: 'suppliers', label: 'Suppliers', icon: '🏭' },
    { id: 'locations', label: 'Locations', icon: '📍' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'billing', label: 'Billing', icon: '💳' },
  ];

  const renderPage = () => {
    const props = { storeId };
    switch (currentPage) {
      case 'dashboard': return <Dashboard {...props} />;
      case 'products': return <Products {...props} />;
      case 'alerts': return <Alerts {...props} />;
      case 'suppliers': return <Suppliers {...props} />;
      case 'locations': return <Locations {...props} />;
      case 'analytics': return <Analytics {...props} />;
      case 'billing': return <Billing {...props} />;
      default: return <Dashboard {...props} />;
    }
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
            </svg>
            StockPulse
          </div>
        </div>
        <nav className="nav">
          {navItems.map(item => (
            <div
              key={item.id}
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => setCurrentPage(item.id)}
            >
              <span>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          StockPulse v1.0.0
        </div>
      </aside>
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
};

export default App;
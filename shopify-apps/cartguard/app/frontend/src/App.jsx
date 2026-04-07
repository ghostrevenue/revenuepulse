// CartGuard React Dashboard App
// Main application component with routing

import React, { useState, useEffect } from 'react';

// API helpers
const API = {
  base: '/api',
  async get(path) {
    const res = await fetch(this.base + path);
    return res.json();
  },
  async post(path, data) {
    const res = await fetch(this.base + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async put(path, data) {
    const res = await fetch(this.base + path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async del(path) {
    const res = await fetch(this.base + path, { method: 'DELETE' });
    return res.json();
  }
};

// Simple icon components
const Icons = {
  Dashboard: () => <span>📊</span>,
  Campaigns: () => <span>📣</span>,
  Visitors: () => <span>👥</span>,
  Analytics: () => <span>📈</span>,
  Settings: () => <span>⚙️</span>,
  Billing: () => <span>💳</span>
};

// Page components
import Dashboard from './pages/Dashboard';
import Campaigns from './pages/Campaigns';
import Visitors from './pages/Visitors';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Billing from './pages/Billing';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [store] = useState({ id: 'demo', shop: 'demo.myshopify.com' });

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.Dashboard },
    { id: 'campaigns', label: 'Campaigns', icon: Icons.Campaigns },
    { id: 'visitors', label: 'Visitors', icon: Icons.Visitors },
    { id: 'analytics', label: 'Analytics', icon: Icons.Analytics },
    { id: 'settings', label: 'Settings', icon: Icons.Settings },
    { id: 'billing', label: 'Billing', icon: Icons.Billing }
  ];

  const renderPage = () => {
    const props = { store };
    switch (activePage) {
      case 'dashboard': return <Dashboard {...props} />;
      case 'campaigns': return <Campaigns {...props} />;
      case 'visitors': return <Visitors {...props} />;
      case 'analytics': return <Analytics {...props} />;
      case 'settings': return <Settings {...props} />;
      case 'billing': return <Billing {...props} />;
      default: return <Dashboard {...props} />;
    }
  };

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">🛡️</div>
            CartGuard
          </div>
        </div>
        <nav className="nav">
          {navItems.map(item => (
            <a
              key={item.id}
              className={`nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => setActivePage(item.id)}
            >
              <span className="nav-icon"><item.icon /></span>
              {item.label}
            </a>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        {renderPage()}
      </main>
    </>
  );
}

import React, { useState, useEffect } from 'react';
import { api } from './api/index.js';
import Dashboard from './pages/Dashboard.jsx';
import Analytics from './pages/Analytics.jsx';
import Billing from './pages/Billing.jsx';

function Sidebar({ activePage, setActivePage, store }) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
          </svg>
          RevenuePulse
        </div>
      </div>
      <nav className="nav">
        <div className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`} onClick={() => setActivePage('dashboard')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
          </svg>
          Dashboard
        </div>
        <div className={`nav-item ${activePage === 'analytics' ? 'active' : ''}`} onClick={() => setActivePage('analytics')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
          </svg>
          Analytics
        </div>
        <div className={`nav-item ${activePage === 'billing' ? 'active' : ''}`} onClick={() => setActivePage('billing')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
          Billing
        </div>
      </nav>
      <div className="sidebar-footer">
        {store ? `${store.shop}` : 'Not connected'}
      </div>
    </div>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appConfig, setAppConfig] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        // Get app bridge config
        const config = await api.getAppBridgeConfig();
        setAppConfig(config);

        // Try to verify session with shop from URL params
        const params = new URLSearchParams(window.location.search);
        const shopFromUrl = params.get('shop');
        const storeIdFromUrl = params.get('store_id');
        const hmacFromUrl = params.get('hmac');
        const hostFromUrl = params.get('host');
        const timestampFromUrl = params.get('timestamp');

        // Partners Dashboard OAuth install flow — redirect to backend OAuth handler
        // which will verify HMAC and redirect to Shopify's authorize URL
        if (hmacFromUrl && shopFromUrl && hostFromUrl) {
          window.location.href = `/api/auth/partners-start?hmac=${encodeURIComponent(hmacFromUrl)}&shop=${encodeURIComponent(shopFromUrl)}&host=${encodeURIComponent(hostFromUrl)}&timestamp=${encodeURIComponent(timestampFromUrl || '')}`;
          return;
        }

        if (shopFromUrl || storeIdFromUrl) {
          // Verify the session
          try {
            const result = await api.verifySession(null);
            setStore(result.store);
          } catch (e) {
            // May not be authenticated yet
            console.log('Session verification:', e.message);
          }
        } else {
          // Try anonymous verify
          try {
            const result = await api.verifySession(null);
            setStore(result.store);
          } catch (e) {
            // Not authenticated — show connect page
          }
        }
      } catch (e) {
        console.error('Init error:', e.message);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  if (loading) {
    return <div className="loading" style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}>Loading RevenuePulse...</div>;
  }

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} setActivePage={setActivePage} store={store} />
      <main className="main-content">
        {activePage === 'dashboard' && <Dashboard store={store} appConfig={appConfig} />}
        {activePage === 'analytics' && <Analytics store={store} appConfig={appConfig} />}
        {activePage === 'billing' && <Billing store={store} appConfig={appConfig} />}
      </main>
    </div>
  );
}

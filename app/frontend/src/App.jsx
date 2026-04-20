import React, { useState, useEffect } from 'react';
import { api } from './api/index.js';
import Dashboard from './pages/Dashboard.jsx';
import Analytics from './pages/Analytics.jsx';
import Billing from './pages/Billing.jsx';
import OffersList from './pages/OffersList.jsx';
import UpsellConfirmation from './pages/UpsellConfirmation.jsx';
import UpsellPreview from './pages/UpsellPreview.jsx';
import Settings from './pages/Settings.jsx';

const ROUTES = {
  '#/dashboard': Dashboard,
  '#/offers': OffersList,
  '#/analytics': Analytics,
  '#/billing': Billing,
  '#/settings': Settings,
  '#/upsell-preview': UpsellPreview,
};

function Sidebar({ activePage, setActivePage, store }) {
  const navItems = [
    { id: '#/dashboard', label: 'Dashboard', icon: 'grid' },
    { id: '#/offers', label: 'Offers', icon: 'tag' },
    { id: '#/analytics', label: 'Analytics', icon: 'chart' },
    { id: '#/billing', label: 'Billing', icon: 'card' },
    { id: '#/settings', label: 'Settings', icon: 'gear' },
  ];

  const icons = {
    grid: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    tag: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
    chart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
    card: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
    gear: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
    store: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
          PostPurchasePro
        </div>
      </div>
      <nav className="nav">
        {navItems.map(item => (
          <div
            key={item.id}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => setActivePage(item.id)}
          >
            {icons[item.icon]}
            {item.label}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="store-info">
          {icons.store}
          <span>{store ? store.shop : 'Not connected'}</span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState('#/dashboard');
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appConfig, setAppConfig] = useState(null);

  // Hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;

      // Handle #/upsell-preview/:offerId route
      if (hash && hash.startsWith('#/upsell-preview')) {
        setActivePage('#/upsell-preview');
        return;
      }

      if (hash && ROUTES[hash]) {
        setActivePage(hash);
      } else if (!hash || hash === '#' || hash === '#/') {
        window.location.hash = '#/dashboard';
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const config = await api.getAppBridgeConfig();
        setAppConfig(config);

        const params = new URLSearchParams(window.location.search);
        const shopFromUrl = params.get('shop');
        const storeIdFromUrl = params.get('store_id');
        const hmacFromUrl = params.get('hmac');
        const hostFromUrl = params.get('host');
        const timestampFromUrl = params.get('timestamp');

        if (hmacFromUrl && shopFromUrl && hostFromUrl && !storeIdFromUrl) {
          window.location.href = `/api/auth/partners-start?hmac=${encodeURIComponent(hmacFromUrl)}&shop=${encodeURIComponent(shopFromUrl)}&host=${encodeURIComponent(hostFromUrl)}&timestamp=${encodeURIComponent(timestampFromUrl || '')}`;
          return;
        }

        if (storeIdFromUrl) {
          try {
            const result = await api.verifySession(storeIdFromUrl);
            setStore(result.store);
            // Persist storeId so it survives page refreshes
            localStorage.setItem('storeId', storeIdFromUrl);
            localStorage.setItem('store', JSON.stringify(result.store));
          } catch (e) {
            console.log('Session verification:', e.message);
          }
        } else if (shopFromUrl) {
          try {
            const result = await api.verifySession(null);
            setStore(result.store);
            // Persist store data for subsequent page loads
            if (result.store?.id) {
              localStorage.setItem('storeId', result.store.id);
              localStorage.setItem('store', JSON.stringify(result.store));
            }
          } catch (e) {
            console.log('Session verification:', e.message);
          }
        } else {
          // Try to restore from localStorage (e.g., after page refresh)
          const savedStoreId = localStorage.getItem('storeId');
          const savedStore = localStorage.getItem('store');
          if (savedStoreId && savedStore) {
            try {
              const result = await api.verifySession(savedStoreId);
              setStore(result.store);
              localStorage.setItem('store', JSON.stringify(result.store));
            } catch (e) {
              // Stored session is invalid — clear it
              localStorage.removeItem('storeId');
              localStorage.removeItem('store');
            }
          } else {
            try {
              const result = await api.verifySession(null);
              setStore(result.store);
              if (result.store?.id) {
                localStorage.setItem('storeId', result.store.id);
                localStorage.setItem('store', JSON.stringify(result.store));
              }
            } catch (e) {}
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
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#0f0f14',color:'#a78bfa',fontFamily:'Inter,sans-serif',fontSize:'16px'}}>
        <div style={{textAlign:'center'}}>
          <div style={{width:'48px',height:'48px',border:'3px solid #2d2d3a',borderTopColor:'#8b5cf6',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 16px'}} />
          Loading PostPurchasePro...
        </div>
      </div>
    );
  }

  const PageComponent = ROUTES[activePage] || Dashboard;

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} setActivePage={(page) => { setActivePage(page); window.location.hash = page; }} store={store} />
      <main className="main-content">
        <PageComponent store={store} appConfig={appConfig} />
      </main>
    </div>
  );
}

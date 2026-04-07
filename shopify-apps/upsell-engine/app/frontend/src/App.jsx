import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import OffersList from './pages/OffersList';
import OfferBuilder from './pages/OfferBuilder';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Billing from './pages/Billing';

const DashboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);

const OffersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
    <path d="M2 17l10 5 10-5"/>
    <path d="M2 12l10 5 10-5"/>
  </svg>
);

const AnalyticsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 20V10"/>
    <path d="M12 20V4"/>
    <path d="M6 20v-6"/>
  </svg>
);

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
  </svg>
);

const BillingIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [builderOfferId, setBuilderOfferId] = useState(null);

  const navigateTo = (page) => {
    if (page === 'offer-builder-new') {
      setBuilderOfferId(null);
      setCurrentPage('offer-builder');
    } else if (page === 'offer-builder-edit') {
      setCurrentPage('offer-builder');
    } else {
      setCurrentPage(page);
    }
  };

  const editOffer = (offerId) => {
    setBuilderOfferId(offerId);
    setCurrentPage('offer-builder');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard navigateTo={navigateTo} editOffer={editOffer} />;
      case 'offers':
        return <OffersList navigateTo={navigateTo} editOffer={editOffer} />;
      case 'offer-builder':
        return <OfferBuilder offerId={builderOfferId} onSave={() => navigateTo('offers')} onCancel={() => navigateTo('offers')} />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      case 'billing':
        return <Billing />;
      default:
        return <Dashboard navigateTo={navigateTo} editOffer={editOffer} />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'offers', label: 'Offers', icon: <OffersIcon /> },
    { id: 'analytics', label: 'Analytics', icon: <AnalyticsIcon /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
    { id: 'billing', label: 'Billing', icon: <BillingIcon /> },
  ];

  return (
    <div className="app-frame">
      <nav className="nav-area">
        <div className="logo">
          <div className="logo-icon">RP</div>
          RevenuePulse
        </div>
        <div className="nav-section">
          <div className="nav-section-title">Main</div>
          {navItems.slice(0, 3).map(item => (
            <div
              key={item.id}
              className={`nav-item ${currentPage === item.id || (currentPage === 'offer-builder' && item.id === 'offers') ? 'active' : ''}`}
              onClick={() => navigateTo(item.id)}
            >
              {item.icon}
              {item.label}
            </div>
          ))}
        </div>
        <div className="nav-section">
          <div className="nav-section-title">Configuration</div>
          {navItems.slice(3).map(item => (
            <div
              key={item.id}
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => navigateTo(item.id)}
            >
              {item.icon}
              {item.label}
            </div>
          ))}
        </div>
        <div className="nav-footer">
          <div className="nav-footer-info">my-shop.myshopify.com</div>
          <div className="nav-footer-plan">⭐ Growth Plan</div>
        </div>
      </nav>
      <main className="main-area">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;

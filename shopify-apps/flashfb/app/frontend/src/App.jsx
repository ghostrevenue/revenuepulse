import React, { useState } from 'react';
import Dashboard from './pages/Dashboard.jsx';
import Pixel from './pages/Pixel.jsx';
import Events from './pages/Events.jsx';
import Audiences from './pages/Audiences.jsx';
import Conversions from './pages/Conversions.jsx';
import Analytics from './pages/Analytics.jsx';
import Billing from './pages/Billing.jsx';

const pages = ['Dashboard', 'Pixel', 'Events', 'Audiences', 'Conversions', 'Analytics', 'Billing'];

function App() {
  const [activePage, setActivePage] = useState('Dashboard');
  const [storeId] = useState('demo-store');

  const renderPage = () => {
    const props = { storeId };
    switch (activePage) {
      case 'Dashboard': return <Dashboard {...props} />;
      case 'Pixel': return <Pixel {...props} />;
      case 'Events': return <Events {...props} />;
      case 'Audiences': return <Audiences {...props} />;
      case 'Conversions': return <Conversions {...props} />;
      case 'Analytics': return <Analytics {...props} />;
      case 'Billing': return <Billing {...props} />;
      default: return <Dashboard {...props} />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav style={{
        width: 240,
        background: '#13131a',
        borderRight: '1px solid #2a2a3a',
        padding: '24px 0',
        position: 'fixed',
        height: '100vh',
        overflowY: 'auto'
      }}>
        <div style={{ padding: '0 24px 32px', borderBottom: '1px solid #2a2a3a', marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>FlashFB</h1>
          <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Facebook & Instagram Pixel</p>
        </div>
        {pages.map(page => (
          <button
            key={page}
            onClick={() => setActivePage(page)}
            style={{
              width: '100%',
              padding: '12px 24px',
              background: activePage === page ? '#1a1a2e' : 'transparent',
              color: activePage === page ? '#6366f1' : '#a0a0a0',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
          >
            {page}
          </button>
        ))}
      </nav>
      <main style={{ flex: 1, marginLeft: 240, padding: 32 }}>
        {renderPage()}
      </main>
    </div>
  );
}

export default App;

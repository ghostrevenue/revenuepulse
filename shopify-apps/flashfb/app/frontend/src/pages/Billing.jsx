import React, { useState, useEffect } from 'react';

const PLANS = {
  starter: { price: 19, name: 'Starter', features: ['1 Pixel', 'Basic Events', '5 Custom Conversions'] },
  growth: { price: 49, name: 'Growth', features: ['5 Pixels', 'Audience Sync', 'CAPI', 'Full Analytics', '50 Custom Conversions'] },
  pro: { price: 99, name: 'Pro', features: ['Unlimited Pixels', 'Lookalike Creation', 'Full ROAS Attribution', 'Priority Support'] }
};

function Billing({ storeId }) {
  const [currentPlan, setCurrentPlan] = useState('starter');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/billing/${storeId}`)
      .then(r => r.json())
      .then(data => setCurrentPlan(data.plan || 'starter'))
      .catch(() => {});
  }, [storeId]);

  const handleActivate = async (plan) => {
    setLoading(true);
    try {
      await fetch(`/api/billing/${storeId}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      });
      setCurrentPlan(plan);
    } catch (e) {}
    setLoading(false);
  };

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Billing & Plans</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
        {Object.entries(PLANS).map(([key, plan]) => (
          <div key={key} style={{ 
            background: '#13131a', 
            borderRadius: 12, 
            padding: 24, 
            border: currentPlan === key ? '2px solid #6366f1' : '1px solid #2a2a3a',
            position: 'relative'
          }}>
            {currentPlan === key && (
              <span style={{ position: 'absolute', top: -12, left: 16, padding: '4px 12px', background: '#6366f1', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>Current</span>
            )}
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{plan.name}</h3>
            <p style={{ fontSize: 32, fontWeight: 700, color: '#6366f1', marginBottom: 16 }}>${plan.price}<span style={{ fontSize: 14', color: '#888' }}>/mo</span></p>
            <ul style={{ listStyle: 'none', marginBottom: 24 }}>
              {plan.features.map((f, i) => (
                <li key={i} style={{ padding: '8px 0', borderBottom: '1px solid #2a2a3a', fontSize: 14 }}>✓ {f}</li>
              ))}
            </ul>
            <button 
              onClick={() => handleActivate(key)} 
              disabled={loading || currentPlan === key}
              style={{ 
                width: '100%', 
                padding: '12px', 
                borderRadius: 8, 
                border: 'none', 
                background: currentPlan === key ? '#2a2a3a' : '#6366f1', 
                color: '#fff', 
                fontWeight: 600, 
                cursor: currentPlan === key ? 'default' : 'pointer',
                opacity: currentPlan === key ? 0.5 : 1
              }}
            >
              {currentPlan === key ? 'Current Plan' : 'Activate'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Billing;

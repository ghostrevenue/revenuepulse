import React, { useState, useEffect } from 'react';

const PLANS = {
  starter: { name: 'Starter', price: 19, products: '100 products', features: ['Email alerts', 'Basic analytics'] },
  growth: { name: 'Growth', price: 49, products: 'Unlimited products', features: ['SMS alerts', 'Predictions', 'Supplier management'] },
  pro: { name: 'Pro', price: 99, products: 'Unlimited products', features: ['Auto-reorder', 'Multi-location', 'Full analytics', 'Priority support'] }
};

const Billing = ({ storeId }) => {
  const [currentPlan, setCurrentPlan] = useState(null);
  const [status, setStatus] = useState('trial');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlan();
  }, [storeId]);

  const loadPlan = async () => {
    try {
      const res = await fetch('/api/billing/plan', { headers: { 'x-store-id': storeId } });
      const data = await res.json();
      setCurrentPlan(data.plan?.name?.toLowerCase() || 'starter');
      setStatus(data.status || 'trial');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan) => {
    await fetch('/api/billing/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-store-id': storeId },
      body: JSON.stringify({ plan })
    });
    loadPlan();
  };

  if (loading) return <div className="loading">Loading billing...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Billing</h1>
        <p className="page-subtitle">Manage your subscription</p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3 className="card-title">Current Plan: {currentPlan ? PLANS[currentPlan].name : 'Starter'}</h3>
          <span className={`badge ${status === 'active' ? 'badge-success' : 'badge-warning'}`}>{status}</span>
        </div>
        <p style={{ color: '#71717a', fontSize: 14 }}>You are currently on the {currentPlan ? PLANS[currentPlan].name : 'Starter'} plan.</p>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {Object.entries(PLANS).map(([key, plan]) => (
          <div key={key} className="card" style={{ border: currentPlan === key ? '2px solid #22c55e' : undefined }}>
            <div style={{ textAlign: 'center', paddingBottom: 20, borderBottom: '1px solid #27272a', marginBottom: 20 }}>
              <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>{plan.name}</h3>
              <div style={{ fontSize: 36, fontWeight: 700, color: '#22c55e' }}>${plan.price}<span style={{ fontSize: 14, color: '#71717a' }}>/mo</span></div>
            </div>
            <ul style={{ listStyle: 'none', marginBottom: 20 }}>
              {plan.features.map((f, i) => (
                <li key={i} style={{ padding: '8px 0', color: '#a1a1aa', fontSize: 14 }}>✓ {f}</li>
              ))}
            </ul>
            <button 
              className={`btn ${currentPlan === key ? 'btn-secondary' : 'btn-primary'}`} 
              style={{ width: '100%' }}
              onClick={() => handleUpgrade(key)}
              disabled={currentPlan === key}
            >
              {currentPlan === key ? 'Current Plan' : key === 'starter' ? 'Downgrade' : 'Upgrade'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Billing;
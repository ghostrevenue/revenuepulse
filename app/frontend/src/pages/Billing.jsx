import React, { useState, useEffect } from 'react';
import { api } from '../api/index.js';

export default function Billing({ store }) {
  const [currentPlan, setCurrentPlan] = useState(null);
  const [plans, setPlans] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!store) { setLoading(false); return; }
    async function load() {
      try {
        const [planData, plansData] = await Promise.all([
          api.getPlan(),
          api.getPlans()
        ]);
        setCurrentPlan(planData);
        setPlans(plansData.plans);
      } catch (e) {
        console.error(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [store]);

  async function handleSubscribe(planKey) {
    if (!store) return;
    setUpdating(true);
    setMessage(null);
    try {
      const result = await api.updatePlan(planKey);
      setMessage({ type: 'success', text: `Subscribed to ${result.plan.name}!` });
      const planData = await api.getPlan();
      setCurrentPlan(planData);
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setUpdating(false);
    }
  }

  if (!store) {
    return (
      <div className="empty-state">
        <h3 style={{fontSize: '18px', fontWeight: 600, marginBottom: 8}}>Connect Your Store</h3>
        <p>Connect your Shopify store to manage your subscription.</p>
      </div>
    );
  }

  if (loading) return <div className="loading">Loading billing...</div>;

  const planKeys = ['starter', 'growth', 'pro'];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Billing</h1>
        <p className="page-subtitle">
          Current plan: <strong>{currentPlan?.plan?.name || 'Starter'}</strong>
          {' · '}
          <span style={{color: '#22c55e'}}>${currentPlan?.plan?.price || 19}/mo</span>
        </p>
      </div>

      {message && (
        <div className={`alert-banner ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="grid-3">
        {planKeys.map(key => {
          const plan = plans?.[key];
          if (!plan) return null;
          const isCurrent = currentPlan?.plan?.planKey === key || currentPlan?.plan?.name?.toLowerCase() === plan.name?.toLowerCase();
          return (
            <div key={key} className={`plan-card ${key === 'growth' ? 'featured' : ''}`}>
              {key === 'growth' && (
                <div style={{fontSize: 12, color: '#22c55e', fontWeight: 600, marginBottom: 8}}>MOST POPULAR</div>
              )}
              <div className="plan-name">{plan.name}</div>
              <div className="plan-price">
                ${plan.price}<span>/mo</span>
              </div>
              <ul className="plan-features">
                {plan.features.map((f, i) => (
                  <li key={i}>✓ {f}</li>
                ))}
              </ul>
              <button
                className={`btn ${isCurrent ? 'btn-secondary' : 'btn-primary'}`}
                style={{width: '100%', justifyContent: 'center'}}
                onClick={() => handleSubscribe(key)}
                disabled={updating || isCurrent}
              >
                {updating ? 'Updating...' : isCurrent ? 'Current Plan' : `Subscribe to ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>

      <div className="card" style={{marginTop: 20}}>
        <div className="card-title">Billing FAQ</div>
        <div style={{marginTop: 16, display: 'grid', gap: 16}}>
          <div>
            <div style={{fontWeight: 600, marginBottom: 4, color: '#fafafa'}}>How does billing work?</div>
            <div style={{color: '#71717a', fontSize: 14}}>RevenuePulse uses Shopify's built-in billing system. You'll be charged monthly through your Shopify account.</div>
          </div>
          <div>
            <div style={{fontWeight: 600, marginBottom: 4, color: '#fafafa'}}>Can I change plans?</div>
            <div style={{color: '#71717a', fontSize: 14}}>Yes, you can upgrade or downgrade at any time. Changes take effect immediately.</div>
          </div>
          <div>
            <div style={{fontWeight: 600, marginBottom: 4, color: '#fafafa'}}>Is there a free trial?</div>
            <div style={{color: '#71717a', fontSize: 14}}>New stores start on the Starter plan. Contact support for a custom trial period.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

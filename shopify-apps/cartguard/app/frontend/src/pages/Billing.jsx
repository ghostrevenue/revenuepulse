// Billing Page
import React, { useState } from 'react';

const PLANS = {
  starter: { name: 'Starter', price: 19, emails: 500, campaigns: 1, features: ['Basic Analytics', 'Email Support'] },
  growth: { name: 'Growth', price: 49, emails: 'Unlimited', campaigns: 5, features: ['A/B Testing', 'Priority Support'] },
  pro: { name: 'Pro', price: 99, emails: 'Unlimited', campaigns: 'Unlimited', features: ['SMS Recovery', 'Priority Support', 'Custom Integrations'] }
};

export default function Billing({ store }) {
  const [currentPlan, setCurrentPlan] = useState('starter');

  const handleSelectPlan = async (plan) => {
    try {
      await fetch('/api/billing/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: store.id, plan })
      });
      setCurrentPlan(plan);
    } catch (err) {
      console.error('Failed to activate plan:', err);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Billing</h1>
      </div>

      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        Choose the plan that fits your store's needs. Upgrade or downgrade at any time.
      </p>

      <div className="plan-cards">
        {Object.entries(PLANS).map(([key, plan]) => (
          <div key={key} className={`plan-card ${key === 'growth' ? 'featured' : ''}`}>
            {key === 'growth' && (
              <div style={{
                position: 'absolute',
                top: -12,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--accent-blue)',
                padding: '4px 12px',
                borderRadius: 12,
                fontSize: 12
              }}>
                Most Popular
              </div>
            )}
            <div className="plan-name">{plan.name}</div>
            <div className="plan-price">${plan.price}<span>/mo</span></div>
            <ul className="plan-features">
              <li>{plan.emails} emails/mo</li>
              <li>{plan.campaigns} campaigns</li>
              {plan.features.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
            <button
              className={`btn ${currentPlan === key ? 'btn-secondary' : 'btn-primary'}`}
              onClick={() => handleSelectPlan(key)}
              disabled={currentPlan === key}
            >
              {currentPlan === key ? 'Current Plan' : 'Select Plan'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

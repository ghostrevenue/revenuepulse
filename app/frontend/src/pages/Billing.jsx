import React, { useState, useEffect } from 'react';
import { api } from '../api/index.js';

export default function Billing({ store, appConfig }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  const CURRENT_PLAN = {
    name: 'Pro',
    price: 20,
    planKey: 'pro',
    features: ['Unlimited upsell funnels', 'A/B testing', 'Real-time analytics', 'Priority support'],
  };

  useEffect(() => {
    if (!store) { setLoading(false); return; }
    async function load() {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        );
        const [planData] = await Promise.race([
          Promise.all([api.getPlan()]),
          timeoutPromise
        ]).catch(e => {
          console.warn('Billing load warning:', e.message);
          return [{ plan: { name: 'Pro', price: 20, planKey: 'pro' } }];
        });
        setPlan(planData);
      } catch (e) {
        console.error(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [store]);

  if (!store) {
    return (
      <div className="empty-state">
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fafafa', marginBottom: '8px' }}>Connect Your Store</h3>
        <p style={{ color: '#71717a' }}>Connect your Shopify store to manage billing.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <span>Loading billing info...</span>
      </div>
    );
  }

  return (
    <div className="settings">
      <div className="page-header">
        <div>
          <h1 className="page-title">Billing</h1>
          <p className="page-subtitle">Manage your subscription and payment</p>
        </div>
      </div>

      {/* Current Plan */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Current Plan</div>
          <span className="current-plan-badge">
            {plan?.plan?.name || 'Pro'} — ${plan?.plan?.price || 20}/mo
          </span>
        </div>
        <div className="single-plan-card">
          <div className="plan-name">{CURRENT_PLAN.name}</div>
          <div className="plan-price">${CURRENT_PLAN.price}<span>/mo</span></div>
          <ul className="plan-features">
            {CURRENT_PLAN.features.map((f, i) => (
              <li key={i}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {f}
              </li>
            ))}
          </ul>
          <div className="plan-current-badge">✓ Your current plan</div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Payment Method</div>
        </div>
        <div className="payment-row">
          <div className="payment-card">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" style={{ color: '#a78bfa', flexShrink: 0 }}>
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#fafafa' }}>•••• •••• •••• 4242</div>
              <div style={{ fontSize: '12px', color: '#71717a', marginTop: '2px' }}>Expires 12/26</div>
            </div>
          </div>
          <button className="btn-secondary-sm">Update</button>
        </div>
        <p style={{ fontSize: '13px', color: '#52525b', marginTop: '12px' }}>
          Billing is managed through the Shopify App Store. Update your payment method from your Shopify admin.
        </p>
      </div>

      {/* Billing History */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Billing History</div>
        </div>
        <div className="billing-history">
          {[
            { date: 'Apr 19, 2026', amount: '$20.00', status: 'Paid', invoice: '#INV-0042' },
            { date: 'Mar 19, 2026', amount: '$20.00', status: 'Paid', invoice: '#INV-0031' },
            { date: 'Feb 19, 2026', amount: '$20.00', status: 'Paid', invoice: '#INV-0020' },
          ].map((item, i) => (
            <div key={i} className="billing-row">
              <div className="billing-info">
                <div className="billing-date">{item.date}</div>
                <div className="billing-invoice">{item.invoice}</div>
              </div>
              <div className="billing-amount">{item.amount}</div>
              <div className="billing-status">{item.status}</div>
              <button className="btn-ghost-xs">Receipt</button>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .settings { max-width: 900px; }
        .page-header { margin-bottom: 32px; }
        .page-title { font-size: 28px; font-weight: 700; color: #fafafa; margin: 0 0 4px; }
        .page-subtitle { color: #71717a; font-size: 14px; margin: 0; }
        .card { background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 24px; margin-bottom: 16px; }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .card-title { font-size: 15px; font-weight: 600; color: #fafafa; }
        .current-plan-badge { font-size: 13px; color: #a78bfa; background: rgba(139,92,246,0.12); padding: 4px 12px; border-radius: 9999px; }

        .single-plan-card { background: #0f0f14; border: 1px solid #8b5cf6; border-radius: 12px; padding: 24px; max-width: 400px; }
        .plan-name { font-size: 18px; font-weight: 700; color: #fafafa; margin-bottom: 6px; }
        .plan-price { font-size: 32px; font-weight: 700; color: #a78bfa; margin-bottom: 16px; }
        .plan-price span { font-size: 16px; color: #71717a; font-weight: 400; }
        .plan-features { list-style: none; margin: 0 0 16px; padding: 0; }
        .plan-features li { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #a1a1aa; padding: 5px 0; }
        .plan-features li svg { color: #22c55e; flex-shrink: 0; }
        .plan-current-badge { display: inline-block; background: rgba(34,197,94,0.12); color: #22c55e; font-size: 13px; font-weight: 600; padding: 6px 14px; border-radius: 6px; }

        .payment-row { display: flex; align-items: center; gap: 16px; }
        .payment-card { display: flex; align-items: center; gap: 12px; background: #0f0f14; border: 1px solid #27272a; border-radius: 8px; padding: 14px; flex: 1; }
        .btn-secondary-sm { background: #27272a; border: 1px solid #3f3f46; color: #a1a1aa; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; }
        .btn-secondary-sm:hover { background: #3f3f46; color: #fafafa; }

        .billing-history { display: flex; flex-direction: column; }
        .billing-row { display: flex; align-items: center; gap: 16px; padding: 12px 0; border-bottom: 1px solid #27272a; }
        .billing-row:last-child { border-bottom: none; }
        .billing-info { flex: 1; }
        .billing-date { font-size: 14px; font-weight: 500; color: #e5e5e5; }
        .billing-invoice { font-size: 12px; color: #71717a; margin-top: 2px; }
        .billing-amount { font-size: 14px; font-weight: 600; color: #fafafa; }
        .billing-status { font-size: 12px; color: #22c55e; font-weight: 600; }
        .btn-ghost-xs { background: none; border: none; color: #a78bfa; font-size: 12px; cursor: pointer; padding: 4px 8px; border-radius: 4px; }
        .btn-ghost-xs:hover { background: #1f1f2e; }

        .loading-state { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 60px; color: #71717a; }
        .spinner { width: 20px; height: 20px; border: 2px solid #27272a; border-top-color: #8b5cf6; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 700px) {
          .info-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

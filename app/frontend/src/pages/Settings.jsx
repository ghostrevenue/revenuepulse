import React, { useState, useEffect } from 'react';
import { api } from '../api/index.js';

export default function Settings({ store, appConfig }) {
  const [plan, setPlan] = useState(null);
  const [plans, setPlans] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState(null);

  // Notification preferences (localStorage — no backend needed yet)
  const [notifications, setNotifications] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rp_notifications') || '{}'); }
    catch { return {}; }
  });
  const [notifSaved, setNotifSaved] = useState(false);

  function toggleNotification(key) {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    localStorage.setItem('rp_notifications', JSON.stringify(updated));
    api.saveNotificationPrefs(updated).catch(e => console.warn('Notif save failed:', e.message));
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 2000);
  }

  // Danger zone
  const [showUninstallConfirm, setShowUninstallConfirm] = useState(false);
  const [uninstalling, setUninstalling] = useState(false);
  const [uninstallMsg, setUninstallMsg] = useState(null);

  async function handleUninstall() {
    setUninstalling(true);
    setUninstallMsg(null);
    try {
      await api.uninstallApp();
      setUninstallMsg({ type: 'success', text: 'App uninstalled. Redirecting...' });
      setTimeout(() => { window.location.href = '/'; }, 2000);
    } catch (e) {
      setUninstallMsg({ type: 'error', text: e.message || 'Uninstall failed. Try again.' });
      setUninstalling(false);
    }
  }

  useEffect(() => {
    if (!store) { setLoading(false); return; }
    async function load() {
      try {
        // Add timeout to prevent indefinite hang on slow/unresponsive API
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        );
        const [planData, plansData] = await Promise.race([
          Promise.all([
            api.getPlan(),
            api.getPlans()
          ]),
          timeoutPromise
        ]).catch(e => {
          console.warn('Settings load warning:', e.message);
          // Return null data so UI can still render partially
          return [{ plan: { name: 'Starter', planKey: 'starter' } }, { plans: PLANS }];
        });
        setPlan(planData);
        setPlans(plansData.plans);
      } catch (e) {
        console.error(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [store]);

  // Fallback plans for when API fails (object keyed by planKey matching API response)
  const PLANS = {
    starter: { name: 'Starter', price: 19, planKey: 'starter', features: ['5 active offers', 'Basic analytics', 'Email support'] },
    growth: { name: 'Growth', price: 49, planKey: 'growth', features: ['Unlimited offers', 'A/B testing', 'Priority support', 'Custom branding'] },
    pro: { name: 'Pro', price: 99, planKey: 'pro', features: ['Everything in Growth', 'Dedicated account manager', 'Custom integrations', 'SLA guarantee'] },
  };

  async function handleSubscribe(planKey) {
    if (!store) return;
    setUpdating(true);
    setMessage(null);
    try {
      const result = await api.updatePlan(planKey);
      setMessage({ type: 'success', text: `Subscribed to ${result.plan.name}!` });
      const planData = await api.getPlan();
      setPlan(planData);
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setUpdating(false);
    }
  }

  if (!store) {
    return (
      <div className="empty-state">
        <h3 style={{fontSize:'18px',fontWeight:600,color:'#fafafa',marginBottom:'8px'}}>Connect Your Store</h3>
        <p style={{color:'#71717a'}}>Connect your Shopify store to manage settings.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <span>Loading settings...</span>
      </div>
    );
  }

  const planKeys = ['starter', 'growth', 'pro'];
  const featuresByPlan = {
    starter: ['5 active offers', 'Basic analytics', 'Email support'],
    growth: ['Unlimited offers', 'A/B testing', 'Priority support', 'Custom branding'],
    pro: ['Everything in Growth', 'Dedicated account manager', 'Custom integrations', 'SLA guarantee'],
  };

  return (
    <div className="settings">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your plan and preferences</p>
        </div>
      </div>

      {/* Plan */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Subscription Plan</div>
          <span className="current-plan-badge">
            Current: {plan?.plan?.name || 'Starter'}
          </span>
        </div>

        {message && (
          <div className={`alert-banner ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="plans-grid">
          {planKeys.map(key => {
            const planData = plans?.[key];
            if (!planData) return null;
            const isCurrent = plan?.plan?.planKey === key || plan?.plan?.name?.toLowerCase() === planData.name?.toLowerCase();
            return (
              <div key={key} className={`plan-card ${key === 'growth' ? 'featured' : ''} ${isCurrent ? 'current' : ''}`}>
                {key === 'growth' && <div className="plan-badge">Most Popular</div>}
                <div className="plan-name">{planData.name}</div>
                <div className="plan-price">${planData.price}<span>/mo</span></div>
                <ul className="plan-features">
                  {(featuresByPlan[key] || planData.features || []).map((f, i) => (
                    <li key={i}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  className={`btn-plan ${isCurrent ? 'btn-current' : 'btn-upgrade'}`}
                  onClick={() => handleSubscribe(key)}
                  disabled={updating || isCurrent}
                >
                  {updating ? 'Updating...' : isCurrent ? 'Current Plan' : `Upgrade to ${planData.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Store Info */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Store Information</div>
        </div>
        <div className="info-grid">
          <div className="info-item">
            <div className="info-label">Store</div>
            <div className="info-value">{store?.shop}</div>
          </div>
          <div className="info-item">
            <div className="info-label">Status</div>
            <div className="info-value status-active">
              <span className="status-dot" /> Connected
            </div>
          </div>
          <div className="info-item">
            <div className="info-label">App Version</div>
            <div className="info-value">v1.0.0</div>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Notification Preferences</div>
        </div>
        <div className="notif-list">
          {[
            { key: 'email_upsells', label: 'New upsell accepted', desc: 'Get notified when a customer accepts an upsell offer' },
            { key: 'email_milestones', label: 'Revenue milestones', desc: 'Get notified when you hit revenue milestones' },
            { key: 'email_errors', label: 'App errors', desc: 'Get notified when the app encounters an error' },
            { key: 'email_weekly', label: 'Weekly summary', desc: 'Receive a weekly email summarizing your upsell performance' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="notif-row">
              <div className="notif-info">
                <div className="notif-label">{label}</div>
                <div className="notif-desc">{desc}</div>
              </div>
              <button
                className={`toggle ${notifications[key] !== false ? 'on' : 'off'}`}
                onClick={() => toggleNotification(key)}
                aria-label={`Toggle ${label}`}
              >
                <span className="toggle-knob" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card danger-card">
        <div className="card-header">
          <div className="card-title danger-title">Danger Zone</div>
        </div>
        <div className="danger-row">
          <div className="danger-info">
            <div className="danger-label">Uninstall RevenuePulse</div>
            <div className="danger-desc">This will remove all upsell funnels and disconnect the app from your Shopify store. This action cannot be undone.</div>
          </div>
          {!showUninstallConfirm ? (
            <button className="btn-danger-outline" onClick={() => setShowUninstallConfirm(true)}>
              Uninstall App
            </button>
          ) : (
            <div className="uninstall-confirm">
              <p className="confirm-text">Are you sure? This will delete all your data.</p>
              <div className="confirm-actions">
                <button className="btn-danger" onClick={handleUninstall} disabled={uninstalling}>
                  {uninstalling ? 'Uninstalling...' : 'Yes, Uninstall'}
                </button>
                <button className="btn-cancel" onClick={() => { setShowUninstallConfirm(false); setUninstallMsg(null); }} disabled={uninstalling}>
                  Cancel
                </button>
              </div>
              {uninstallMsg && <div className={`alert-banner ${uninstallMsg.type}`}>{uninstallMsg.text}</div>}
            </div>
          )}
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

        .alert-banner { border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; font-size: 14px; }
        .alert-banner.success { background: rgba(34,197,94,0.12); color: #22c55e; border: 1px solid rgba(34,197,94,0.2); }
        .alert-banner.error { background: rgba(239,68,68,0.12); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }

        .plans-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .plan-card { background: #0f0f14; border: 1px solid #27272a; border-radius: 12px; padding: 20px; position: relative; }
        .plan-card.featured { border-color: #8b5cf6; }
        .plan-card.current { border-color: #22c55e; }
        .plan-badge { position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: #8b5cf6; color: #fff; font-size: 11px; font-weight: 700; padding: 3px 12px; border-radius: 9999px; white-space: nowrap; }
        .plan-name { font-size: 16px; font-weight: 700; color: #fafafa; margin-bottom: 4px; }
        .plan-price { font-size: 28px; font-weight: 700; color: #a78bfa; margin-bottom: 16px; }
        .plan-price span { font-size: 14px; color: #71717a; font-weight: 400; }
        .plan-features { list-style: none; margin: 0 0 20px; padding: 0; }
        .plan-features li { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #a1a1aa; padding: 4px 0; }
        .plan-features li svg { color: #22c55e; flex-shrink: 0; }
        .btn-plan { width: 100%; padding: 10px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
        .btn-upgrade { background: #8b5cf6; color: #fff; border: none; }
        .btn-upgrade:hover { background: #7c3aed; }
        .btn-upgrade:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-current { background: #27272a; color: #71717a; border: 1px solid #3f3f46; cursor: default; }

        .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .info-item { }
        .info-label { font-size: 12px; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; font-weight: 500; }
        .info-value { font-size: 14px; font-weight: 500; color: #e5e5e5; }
        .status-active { display: flex; align-items: center; gap: 6px; color: #22c55e; }
        .status-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 6px rgba(34,197,94,0.5); }

        .loading-state { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 60px; color: #71717a; }
        .spinner { width: 20px; height: 20px; border: 2px solid #27272a; border-top-color: #8b5cf6; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 700px) {
          .plans-grid { grid-template-columns: 1fr; }
          .info-grid { grid-template-columns: 1fr; }
        }

        /* Notification preferences */
        .notif-list { display: flex; flex-direction: column; gap: 0; }
        .notif-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid #27272a; }
        .notif-row:last-child { border-bottom: none; padding-bottom: 0; }
        .notif-row:first-child { padding-top: 0; }
        .notif-info { flex: 1; }
        .notif-label { font-size: 14px; font-weight: 500; color: #e5e5e5; }
        .notif-desc { font-size: 13px; color: #71717a; margin-top: 2px; }

        /* Toggle switch */
        .toggle { width: 42px; height: 24px; border-radius: 12px; border: none; cursor: pointer; position: relative; transition: background 0.2s; flex-shrink: 0; }
        .toggle.on { background: #8b5cf6; }
        .toggle.off { background: #3f3f46; }
        .toggle-knob { position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: left 0.2s; }
        .toggle.on .toggle-knob { left: 21px; }

        /* Danger zone */
        .danger-card { border-color: rgba(239,68,68,0.25); }
        .danger-title { color: #ef4444 !important; }
        .danger-row { display: flex; align-items: flex-start; gap: 24px; }
        .danger-info { flex: 1; }
        .danger-label { font-size: 14px; font-weight: 600; color: #fafafa; }
        .danger-desc { font-size: 13px; color: #71717a; margin-top: 4px; line-height: 1.5; }
        .btn-danger-outline { padding: 8px 18px; border: 1px solid rgba(239,68,68,0.4); color: #ef4444; background: transparent; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
        .btn-danger-outline:hover { background: rgba(239,68,68,0.1); }
        .uninstall-confirm { display: flex; flex-direction: column; gap: 10px; }
        .confirm-text { font-size: 13px; color: #fafafa; margin: 0; }
        .confirm-actions { display: flex; gap: 8px; }
        .btn-danger { padding: 8px 18px; background: #ef4444; color: #fff; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
        .btn-danger:hover { background: #dc2626; }
        .btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-cancel { padding: 8px 18px; background: #27272a; color: #a1a1aa; border: 1px solid #3f3f46; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
        .btn-cancel:hover { background: #3f3f46; color: #fafafa; }
        .btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
}

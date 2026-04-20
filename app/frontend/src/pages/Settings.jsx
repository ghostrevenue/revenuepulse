import React, { useState, useEffect } from 'react';
import { api } from '../api/index.js';

export default function Settings({ store, appConfig }) {
  const [loading, setLoading] = useState(true);

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
    setLoading(false);
  }, [store]);

  if (!store) {
    return (
      <div className="empty-state">
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fafafa', marginBottom: '8px' }}>Connect Your Store</h3>
        <p style={{ color: '#71717a' }}>Connect your Shopify store to manage settings.</p>
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

  return (
    <div className="settings">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Configure your app experience</p>
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
          {notifSaved && <span style={{ fontSize: '12px', color: '#22c55e' }}>✓ Saved</span>}
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
            <div className="danger-label">Uninstall PostPurchasePro</div>
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
        .alert-banner { border-radius: 8px; padding: 12px 16px; font-size: 14px; }
        .alert-banner.success { background: rgba(34,197,94,0.12); color: #22c55e; border: 1px solid rgba(34,197,94,0.2); }
        .alert-banner.error { background: rgba(239,68,68,0.12); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }
      `}</style>
    </div>
  );
}

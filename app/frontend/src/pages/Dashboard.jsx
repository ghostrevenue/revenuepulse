import React, { useState, useEffect } from 'react';
import { api } from '../api/index.js';

export default function Dashboard({ store, appConfig }) {
  const [stats, setStats] = useState(null);
  const [offers, setOffers] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!store) {
      setLoading(false);
      return;
    }
    loadData();
  }, [store]);

  async function loadData() {
    try {
      const [statsRes, offersRes, recentRes] = await Promise.all([
        api.getDashboardStats(),
        api.getUpsellOffers(),
        api.getDashboardRecent(),
      ]);
      setStats(statsRes.stats || {
        total_accepts: 0,
        total_declines: 0,
        acceptance_rate: 0,
        revenue_lifted: 0,
        total_triggered: 0,
      });
      setOffers(offersRes.offers || []);
      setRecent(recentRes.responses || []);
    } catch (e) {
      console.error('Dashboard load error:', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleOffer(offer) {
    try {
      await api.updateUpsellOffer(offer.id, { active: !offer.active });
      loadData();
    } catch (e) {
      console.error('Error toggling offer:', e.message);
    }
  }

  if (!store) {
    return (
      <div className="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{width:'56px',height:'56px',margin:'0 auto 16px',display:'block',opacity:0.4}}>
          <path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        <h3 style={{fontSize:'18px',fontWeight:600,color:'#fafafa',marginBottom:'8px'}}>Connect Your Store</h3>
        <p style={{color:'#71717a',marginBottom:'16px'}}>Install RevenuePulse in your Shopify store to start boosting revenue with post-purchase upsells.</p>
        <p style={{fontSize:'12px',color:'#52525b'}}>
          API Key: {appConfig?.apiKey ? '✓ ' + appConfig.apiKey.substring(0,8)+'...' : '✗ Not set'}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <span>Loading dashboard...</span>
      </div>
    );
  }

  const { total_accepts = 0, total_declines = 0, acceptance_rate = 0, revenue_lifted = 0, total_triggered = 0 } = stats || {};

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">{store?.shop} — Post-purchase upsell performance</p>
        </div>
        <button className="btn-primary" onClick={() => window.location.hash = '#/offers'}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Create New Offer
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card accent-green">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div className="stat-label">Total Accepts</div>
          <div className="stat-value">{Number(total_accepts).toLocaleString()}</div>
        </div>
        <div className="stat-card accent-red">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </div>
          <div className="stat-label">Total Declines</div>
          <div className="stat-value">{Number(total_declines).toLocaleString()}</div>
        </div>
        <div className="stat-card accent-purple">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div className="stat-label">Acceptance Rate</div>
          <div className="stat-value">{Number(acceptance_rate).toFixed(1)}%</div>
        </div>
        <div className="stat-card accent-violet">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
          </div>
          <div className="stat-label">Revenue Lifted</div>
          <div className="stat-value">${Number(revenue_lifted || 0).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})}</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card recent-activity">
          <div className="card-header">
            <div className="card-title">Recent Activity</div>
            <span className="badge-purple">{recent.length} responses</span>
          </div>
          {recent.length === 0 ? (
            <div className="empty-card">
              <p>No upsell responses yet. Create an offer to get started!</p>
            </div>
          ) : (
            <div className="activity-list">
              {recent.slice(0, 5).map((item, i) => (
                <div key={i} className="activity-item">
                  <div className={`activity-dot ${item.response === 'accepted' ? 'dot-green' : 'dot-red'}`} />
                  <div className="activity-info">
                    <div className="activity-title">
                      Order #{item.order_id || '—'} — {item.response}
                    </div>
                    <div className="activity-meta">
                      {item.offer_name || 'Offer'} · {item.created_at ? new Date(item.created_at).toLocaleDateString() : new Date().toLocaleDateString()}
                    </div>
                  </div>
                  <div className={`activity-badge ${item.response}`}>{item.response}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card active-offers">
          <div className="card-header">
            <div className="card-title">Active Offers</div>
            <button className="btn-ghost-sm" onClick={() => window.location.hash = '#/offers'}>View All</button>
          </div>
          {offers.length === 0 ? (
            <div className="empty-card">
              <p>No offers yet. <button className="link-btn" onClick={() => window.location.hash = '#/offers'}>Create your first offer</button></p>
            </div>
          ) : (
            <div className="offers-list">
              {offers.slice(0, 5).map(offer => (
                <div key={offer.id} className="offer-item">
                  <div className="offer-info">
                    <div className="offer-name">{offer.name || offer.headline || `Offer #${offer.id}`}</div>
                    <div className="offer-meta">
                      {offer.offer_type === 'add_product' ? 'Add to Order' : 'Discount Code'} · Min ${offer.trigger_threshold || 0}
                    </div>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={!!offer.active}
                      onChange={() => toggleOffer(offer)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card quick-preview">
        <div className="card-header">
          <div className="card-title">Customer Preview</div>
          <button className="btn-ghost-sm" onClick={() => window.location.hash = '#/upsell-preview'}>
            Open Full Preview
          </button>
        </div>
        <p style={{color:'#71717a',fontSize:'14px',marginBottom:'16px'}}>This is how your upsell offer appears to customers after checkout:</p>
        <div className="preview-thumb" onClick={() => window.location.hash = '#/upsell-preview'}>
          <div className="preview-mock">
            <div className="mock-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span>Thanks for your order!</span>
            </div>
            <div className="mock-card">
              <div className="mock-product-img" />
              <div className="mock-product-info">
                <div className="mock-title">Special Offer Just For You</div>
                <div className="mock-price">+$12.99</div>
                <div className="mock-btn">Add to Order</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .dashboard { max-width: 1200px; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
        .page-title { font-size: 28px; font-weight: 700; color: #fafafa; margin: 0 0 4px; }
        .page-subtitle { color: #71717a; font-size: 14px; margin: 0; }
        .btn-primary { display: inline-flex; align-items: center; gap: 6px; background: #8b5cf6; color: #fff; border: none; padding: 10px 18px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
        .btn-primary:hover { background: #7c3aed; transform: translateY(-1px); }
        .btn-ghost-sm { background: none; border: none; color: #a78bfa; font-size: 13px; cursor: pointer; padding: 4px 8px; border-radius: 4px; }
        .btn-ghost-sm:hover { background: #1f1f2e; }
        .link-btn { background: none; border: none; color: #a78bfa; cursor: pointer; font-size: 14px; text-decoration: underline; }

        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        .stat-card { background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 20px; position: relative; overflow: hidden; }
        .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: 12px 12px 0 0; }
        .stat-card.accent-green::before { background: linear-gradient(90deg, #22c55e, #16a34a); }
        .stat-card.accent-red::before { background: linear-gradient(90deg, #ef4444, #dc2626); }
        .stat-card.accent-purple::before { background: linear-gradient(90deg, #8b5cf6, #7c3aed); }
        .stat-card.accent-violet::before { background: linear-gradient(90deg, #a78bfa, #8b5cf6); }
        .stat-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
        .accent-green .stat-icon { background: rgba(34,197,94,0.12); color: #22c55e; }
        .accent-red .stat-icon { background: rgba(239,68,68,0.12); color: #ef4444; }
        .accent-purple .stat-icon { background: rgba(139,92,246,0.12); color: #a78bfa; }
        .accent-violet .stat-icon { background: rgba(167,139,250,0.12); color: #a78bfa; }
        .stat-icon svg { width: 18px; height: 18px; }
        .stat-label { font-size: 12px; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; font-weight: 500; }
        .stat-value { font-size: 28px; font-weight: 700; color: #fafafa; }

        .dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .card { background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 20px; }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .card-title { font-size: 15px; font-weight: 600; color: #fafafa; }
        .badge-purple { background: rgba(139,92,246,0.15); color: #a78bfa; padding: 3px 10px; border-radius: 9999px; font-size: 12px; font-weight: 500; }

        .empty-card { text-align: center; padding: 24px; color: #52525b; font-size: 14px; }
        .empty-card p { margin: 0; }

        .activity-list { display: flex; flex-direction: column; gap: 0; }
        .activity-item { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #27272a; }
        .activity-item:last-child { border-bottom: none; }
        .activity-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .dot-green { background: #22c55e; box-shadow: 0 0 6px rgba(34,197,94,0.5); }
        .dot-red { background: #ef4444; }
        .activity-info { flex: 1; min-width: 0; }
        .activity-title { font-size: 13px; font-weight: 500; color: #e5e5e5; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .activity-meta { font-size: 12px; color: #52525b; margin-top: 2px; }
        .activity-badge { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; text-transform: capitalize; }
        .activity-badge.accepted { background: rgba(34,197,94,0.12); color: #22c55e; }
        .activity-badge.declined { background: rgba(239,68,68,0.12); color: #ef4444; }

        .offers-list { display: flex; flex-direction: column; gap: 0; }
        .offer-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #27272a; }
        .offer-item:last-child { border-bottom: none; }
        .offer-name { font-size: 13px; font-weight: 500; color: #e5e5e5; }
        .offer-meta { font-size: 12px; color: #52525b; margin-top: 2px; }
        .toggle { position: relative; display: inline-block; width: 38px; height: 22px; flex-shrink: 0; }
        .toggle input { opacity: 0; width: 0; height: 0; }
        .toggle-slider { position: absolute; cursor: pointer; inset: 0; background: #3f3f46; border-radius: 22px; transition: 0.2s; }
        .toggle-slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: 0.2s; }
        .toggle input:checked + .toggle-slider { background: #8b5cf6; }
        .toggle input:checked + .toggle-slider:before { transform: translateX(16px); }

        .quick-preview .card-header { margin-bottom: 8px; }
        .preview-thumb { border-radius: 8px; overflow: hidden; cursor: pointer; transition: all 0.15s; }
        .preview-thumb:hover { transform: scale(1.01); box-shadow: 0 0 0 2px #8b5cf6; }
        .preview-mock { background: #f5f5f5; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .mock-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; color: #333; font-size: 15px; font-weight: 600; }
        .mock-card { background: #fff; border-radius: 8px; padding: 16px; display: flex; gap: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .mock-product-img { width: 60px; height: 60px; background: linear-gradient(135deg, #ddd, #eee); border-radius: 6px; flex-shrink: 0; }
        .mock-product-info { flex: 1; }
        .mock-title { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 4px; }
        .mock-price { font-size: 18px; font-weight: 700; color: #8b5cf6; margin-bottom: 8px; }
        .mock-btn { background: #8b5cf6; color: #fff; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; text-align: center; width: fit-content; }

        .loading-state { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 60px; color: #71717a; font-size: 14px; }
        .spinner { width: 20px; height: 20px; border: 2px solid #27272a; border-top-color: #8b5cf6; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 900px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .dashboard-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

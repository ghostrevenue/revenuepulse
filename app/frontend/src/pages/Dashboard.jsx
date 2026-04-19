import React, { useState, useEffect } from 'react';
import { api } from '../api/index.js';

export default function Dashboard({ store, appConfig }) {
  const [stats, setStats] = useState(null);
  const [offers, setOffers] = useState([]);
  const [recent, setRecent] = useState([]);
  const [abTests, setAbTests] = useState([]);
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
      const [statsRes, offersRes, recentRes, abTestsRes] = await Promise.all([
        api.getDashboardStats(),
        api.getUpsellOffers(),
        api.getDashboardRecent(),
        api.getABTests().catch(() => ({ groups: [] })),
      ]);
      const statsData = statsRes || {};
      // Only fall back to demo indicators if explicitly requested or API returned no data at all
      const hasRealData = statsData.accepts > 0 || statsData.declines > 0 || statsData.total_revenue_lifted > 0 || statsData.requests > 0;
      setStats({
        total_accepts: statsData.accepts || 0,
        total_declines: statsData.declines || 0,
        acceptance_rate: statsData.acceptance_rate || 0,
        revenue_lifted: statsData.total_revenue_lifted || 0,
        total_triggered: statsData.accepts_this_week || 0,
        // Only show trends if we have real data to back them
        revenue_lifted_trend: hasRealData ? (statsData.revenue_lifted_trend || 0) : 0,
        accepts_trend: hasRealData ? (statsData.accepts_trend || 0) : 0,
        rate_trend: hasRealData ? (statsData.rate_trend || 0) : 0,
        triggered_trend: hasRealData ? (statsData.triggered_trend || 0) : 0,
        // Demo data indicator
        is_demo_data: !hasRealData,
      });
      setOffers(offersRes.offers || []);
      setRecent(recentRes.responses || []);
      setAbTests(abTestsRes.groups || []);
    } catch (e) {
      console.error('Dashboard load error:', e.message);
      // Fallback with demo indicator
      setStats({
        total_accepts: 0,
        total_declines: 0,
        acceptance_rate: 0,
        revenue_lifted: 0,
        total_triggered: 0,
        revenue_lifted_trend: 0,
        accepts_trend: 0,
        rate_trend: 0,
        triggered_trend: 0,
        is_demo_data: true,
      });
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

  const {
    total_accepts = 0,
    total_declines = 0,
    acceptance_rate = 0,
    revenue_lifted = 0,
    total_triggered = 0,
    revenue_lifted_trend = 0,
    accepts_trend = 0,
    declines_trend = 0,
    rate_trend = 0,
    triggered_trend = 0,
  } = stats || {};

  // Build display name for recent activity item — prefer headline, fall back to offer_type
  function getDisplayName(item) {
    if (item.headline) return item.headline;
    if (item.offer_name) return item.offer_name;
    if (item.offer_type === 'add_product') return 'Add to Order Offer';
    if (item.offer_type === 'warranty') return 'Warranty Offer';
    if (item.offer_type === 'discount') return 'Discount Offer';
    return `Offer #${item.offer_id}`;
  }

  const hasActiveABTests = abTests.length > 0;
  const activeABTest = abTests[0]; // Show first active test

  // Compute variant B traffic split (stored as traffic_split on variant A = % for A, so B = 100 - A)
  const variantATraffic = activeABTest?.variants?.[0]?.traffic_split ?? 50;
  const variantBTraffic = 100 - variantATraffic;

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

      {/* Demo Data Indicator Banner */}
      {stats?.is_demo_data && (
        <div className="demo-data-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <span><strong>Demo data shown</strong> — No real offer responses yet. Create and publish offers to see real metrics.</span>
        </div>
      )}

      {/* A/B Test Active Banner */}
      {hasActiveABTests && (
        <div className="ab-banner">
          <div className="ab-banner-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
            </svg>
          </div>
          <span><strong>A/B Test Active</strong> — variant A: {variantATraffic}% · variant B: {variantBTraffic}%</span>
          <button className="ab-banner-btn" onClick={() => window.location.hash = '#/offers'}>
            View Results
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      )}

      <div className="stats-grid">
        {/* Revenue Attribution — BIGGEST number */}
        <div className="stat-card accent-green revenue-hero">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
          </div>
          <div className="stat-label">Revenue Attribution</div>
          <div className="stat-value revenue-value">
            ${Number(revenue_lifted || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </div>
          <div className="stat-trend positive">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
              <polyline points="18 15 12 9 6 15"/>
            </svg>
            {Math.abs(revenue_lifted_trend || 0).toFixed(1)}% vs last week
          </div>
        </div>

        <div className="stat-card accent-purple">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div className="stat-label">Acceptance Rate</div>
          <div className="stat-value">{Number(acceptance_rate || 0).toFixed(1)}%</div>
          <div className={`stat-trend ${rate_trend >= 0 ? 'positive' : 'negative'}`}>
            {rate_trend >= 0 ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14"><polyline points="18 15 12 9 6 15"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14"><polyline points="6 9 12 15 18 9"/></svg>
            )}
            {Math.abs(rate_trend || 0).toFixed(1)}% vs last week
          </div>
        </div>

        <div className="stat-card accent-green">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div className="stat-label">Total Accepts</div>
          <div className="stat-value">{Number(total_accepts).toLocaleString()}</div>
          <div className={`stat-trend ${accepts_trend >= 0 ? 'positive' : 'negative'}`}>
            {accepts_trend >= 0 ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14"><polyline points="18 15 12 9 6 15"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14"><polyline points="6 9 12 15 18 9"/></svg>
            )}
            {Math.abs(accepts_trend || 0).toFixed(1)}% vs last week
          </div>
        </div>

        <div className="stat-card accent-red">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </div>
          <div className="stat-label">Total Declines</div>
          <div className="stat-value">{Number(total_declines).toLocaleString()}</div>
          <div className={`stat-trend ${declines_trend >= 0 ? 'negative' : 'positive'}`}>
            {declines_trend >= 0 ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14"><polyline points="18 15 12 9 6 15"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14"><polyline points="6 9 12 15 18 9"/></svg>
            )}
            {Math.abs(declines_trend || 0).toFixed(1)}% vs last week
          </div>
        </div>
      </div>

      {/* Secondary stats row */}
      <div className="secondary-stats">
        <div className="stat-card mini accent-gray">
          <div className="stat-label">Orders Shown Offer</div>
          <div className="stat-value small">{Number(total_triggered).toLocaleString()}</div>
          <div className={`stat-trend ${triggered_trend >= 0 ? 'positive' : 'negative'}`}>
            {triggered_trend >= 0 ? '↑' : '↓'} {Math.abs(triggered_trend || 0).toFixed(1)}%
          </div>
        </div>
        <div className="stat-card mini accent-gray">
          <div className="stat-label">Avg Order Value Increase</div>
          <div className="stat-value small">
            ${total_accepts > 0 ? (Number(revenue_lifted || 0) / total_accepts).toFixed(2) : '0.00'}
          </div>
          <div className="stat-trend neutral">Per accepted upsell</div>
        </div>
        <div className="stat-card mini accent-gray">
          <div className="stat-label">Active Offers</div>
          <div className="stat-value small">{offers.filter(o => o.active).length}</div>
          <div className="stat-trend neutral">of {offers.length} total</div>
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
              {recent.slice(0, 8).map((item, i) => (
                <div key={i} className="activity-item">
                  <div className={`activity-dot ${item.response === 'accepted' ? 'dot-green' : 'dot-red'}`} />
                  <div className="activity-info">
                    <div className="activity-title">
                      Order #{item.order_id || '—'} — <span className={item.response === 'accepted' ? 'text-green' : 'text-red'}>{item.response}</span>
                    </div>
                    <div className="activity-meta">
                      {item.offer_name || 'Offer'} · {item.created_at ? formatTimestamp(item.created_at) : 'Just now'}
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
                      <span className={`type-badge-sm ${offer.offer_type}`}>
                        {offer.offer_type === 'add_product' ? 'Add to Order' : offer.offer_type === 'warranty' ? 'Warranty' : 'Discount Code'}
                      </span>
                      {offer.ab_test_id && <span className="ab-badge">A/B</span>}
                      · Min ${offer.trigger_min_amount || 0}
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
                <div className="mock-btn-green">Add to Order</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .dashboard { max-width: 1200px; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .page-title { font-size: 28px; font-weight: 700; color: #fafafa; margin: 0 0 4px; }
        .page-subtitle { color: #71717a; font-size: 14px; margin: 0; }
        .btn-primary { display: inline-flex; align-items: center; gap: 6px; background: #8b5cf6; color: #fff; border: none; padding: 10px 18px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
        .btn-primary:hover { background: #7c3aed; transform: translateY(-1px); }
        .btn-ghost-sm { background: none; border: none; color: #a78bfa; font-size: 13px; cursor: pointer; padding: 4px 8px; border-radius: 4px; }
        .btn-ghost-sm:hover { background: #1f1f2e; }
        .link-btn { background: none; border: none; color: #a78bfa; cursor: pointer; font-size: 14px; text-decoration: underline; }

        /* Demo Data Banner */
        .demo-data-banner { display: flex; align-items: center; gap: 10px; background: rgba(234,179,8,0.1); border: 1px solid rgba(234,179,8,0.3); border-radius: 10px; padding: 12px 16px; margin-bottom: 20px; color: #eab308; font-size: 14px; }
        .demo-data-banner svg { flex-shrink: 0; }
        .demo-data-banner span strong { font-weight: 600; }

        /* A/B Banner */
        .ab-banner { display: flex; align-items: center; gap: 12px; background: linear-gradient(135deg, rgba(139,92,246,0.15), rgba(167,139,250,0.1)); border: 1px solid rgba(139,92,246,0.3); border-radius: 10px; padding: 12px 16px; margin-bottom: 20px; }
        .ab-banner-icon { width: 32px; height: 32px; background: rgba(139,92,246,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #a78bfa; flex-shrink: 0; }
        .ab-banner span { flex: 1; font-size: 14px; color: #e5e5e5; }
        .ab-banner span strong { color: #a78bfa; }
        .ab-banner-btn { display: flex; align-items: center; gap: 4px; background: rgba(139,92,246,0.2); border: 1px solid rgba(139,92,246,0.3); color: #a78bfa; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; }
        .ab-banner-btn:hover { background: rgba(139,92,246,0.3); }

        /* Stats grid */
        .stats-grid { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .stat-card { background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 20px; position: relative; overflow: hidden; }
        .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: 12px 12px 0 0; }
        .stat-card.accent-green::before { background: linear-gradient(90deg, #22c55e, #16a34a); }
        .stat-card.accent-red::before { background: linear-gradient(90deg, #ef4444, #dc2626); }
        .stat-card.accent-purple::before { background: linear-gradient(90deg, #8b5cf6, #7c3aed); }
        .stat-card.accent-violet::before { background: linear-gradient(90deg, #a78bfa, #8b5cf6); }
        .stat-card.accent-gray::before { background: linear-gradient(90deg, #52525b, #3f3f46); }

        /* Revenue hero — biggest number */
        .stat-card.revenue-hero { padding: 24px; }
        .stat-card.revenue-hero::before { height: 4px; background: linear-gradient(90deg, #22c55e, #16a34a, #15803d) !important; }
        .revenue-value { font-size: 36px !important; font-weight: 800 !important; background: linear-gradient(135deg, #22c55e, #16a34a); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

        .stat-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
        .accent-green .stat-icon { background: rgba(34,197,94,0.12); color: #22c55e; }
        .accent-red .stat-icon { background: rgba(239,68,68,0.12); color: #ef4444; }
        .accent-purple .stat-icon { background: rgba(139,92,246,0.12); color: #a78bfa; }
        .accent-gray .stat-icon { background: rgba(113,113,122,0.12); color: #71717a; }
        .stat-icon svg { width: 18px; height: 18px; }
        .stat-label { font-size: 12px; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; font-weight: 500; }
        .stat-value { font-size: 28px; font-weight: 700; color: #fafafa; }
        .stat-value.small { font-size: 22px; }

        /* Trend indicators */
        .stat-trend { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 500; margin-top: 8px; }
        .stat-trend.positive { color: #22c55e; }
        .stat-trend.negative { color: #ef4444; }
        .stat-trend.neutral { color: #71717a; }

        /* Secondary stats */
        .secondary-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px; }
        .stat-card.mini { padding: 16px; }

        /* Dashboard grid */
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
        .text-green { color: #22c55e; font-weight: 600; }
        .text-red { color: #ef4444; font-weight: 600; }
        .activity-meta { font-size: 12px; color: #52525b; margin-top: 2px; }
        .activity-badge { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; text-transform: capitalize; }
        .activity-badge.accepted { background: rgba(34,197,94,0.12); color: #22c55e; }
        .activity-badge.declined { background: rgba(239,68,68,0.12); color: #ef4444; }

        .offers-list { display: flex; flex-direction: column; gap: 0; }
        .offer-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #27272a; }
        .offer-item:last-child { border-bottom: none; }
        .offer-name { font-size: 13px; font-weight: 500; color: #e5e5e5; }
        .offer-meta { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #52525b; margin-top: 2px; }
        .type-badge-sm { display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
        .type-badge-sm.add_product { background: rgba(139,92,246,0.15); color: #a78bfa; }
        .type-badge-sm.warranty { background: rgba(34,197,94,0.15); color: #22c55e; }
        .type-badge-sm.discount_code { background: rgba(234,179,8,0.15); color: #eab308; }
        .ab-badge { background: rgba(139,92,246,0.2); color: #a78bfa; padding: 1px 5px; border-radius: 3px; font-size: 10px; font-weight: 700; }

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
        .mock-price { font-size: 18px; font-weight: 700; color: #22c55e; margin-bottom: 8px; }
        .mock-btn-green { background: #22c55e; color: #fff; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; text-align: center; width: fit-content; }

        .loading-state { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 60px; color: #71717a; font-size: 14px; }
        .spinner { width: 20px; height: 20px; border: 2px solid #27272a; border-top-color: #8b5cf6; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 1100px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 900px) {
          .dashboard-grid { grid-template-columns: 1fr; }
          .secondary-stats { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .stats-grid { grid-template-columns: 1fr; }
          .page-header { flex-direction: column; gap: 16px; }
        }
      `}</style>
    </div>
  );
}

// Helper to format timestamps
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return date.toLocaleDateString();
}

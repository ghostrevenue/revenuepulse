import React, { useState, useEffect } from 'react';
import { api } from '../api/index.js';

export default function Analytics({ store, appConfig }) {
  const [stats, setStats] = useState(null);
  const [offers, setOffers] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    if (!store) { setLoading(false); return; }
    loadData();
  }, [store, period]);

  async function loadData() {
    try {
      const [statsRes, offersRes, recentRes] = await Promise.all([
        api.getDashboardStats(),
        api.getUpsellOffers(),
        api.getDashboardRecent(),
      ]);
      setStats(statsRes.stats || {
        total_accepts: 0, total_declines: 0, acceptance_rate: 0,
        revenue_lifted: 0, total_triggered: 0,
      });
      setOffers(offersRes.offers || []);
      setRecent(recentRes.responses || []);
    } catch (e) {
      console.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Build bar chart data from recent responses
  function buildChartData() {
    if (!recent || recent.length === 0) return [];
    const days = {};
    recent.forEach(r => {
      const date = new Date(r.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!days[date]) days[date] = { accepted: 0, declined: 0 };
      if (r.response === 'accepted') days[date].accepted++;
      else days[date].declined++;
    });
    return Object.entries(days).slice(-14).map(([date, vals]) => ({
      date,
      accepted: vals.accepted,
      declined: vals.declined,
      rate: vals.accepted + vals.declined > 0
        ? ((vals.accepted / (vals.accepted + vals.declined)) * 100).toFixed(0)
        : 0,
    }));
  }

  // Top performing offers
  function getTopOffers() {
    return [...offers]
      .filter(o => o.total_triggered > 0)
      .map(o => ({
        ...o,
        rate: ((o.total_accepted / o.total_triggered) * 100).toFixed(1),
        revenue: o.revenue_lifted || 0,
      }))
      .sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate))
      .slice(0, 5);
  }

  if (!store) {
    return (
      <div className="empty-state">
        <h3 style={{fontSize:'18px',fontWeight:600,color:'#fafafa',marginBottom:'8px'}}>Connect Your Store</h3>
        <p style={{color:'#71717a'}}>Connect your Shopify store to view analytics.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <span>Loading stats...</span>
      </div>
    );
  }

  const chartData = buildChartData();
  const topOffers = getTopOffers();
  const maxBar = Math.max(...chartData.map(d => d.accepted + d.declined), 1);

  return (
    <div className="analytics">
      <div className="page-header">
        <div>
          <h1 className="page-title">Stats</h1>
          <p className="page-subtitle">{store?.shop} — Upsell performance metrics</p>
        </div>
        <select className="period-select" value={period} onChange={e => setPeriod(parseInt(e.target.value))}>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={60}>Last 60 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      <div className="stats-grid">
        <div className="stat-card accent-purple">
          <div className="stat-label">Acceptance Rate</div>
          <div className="stat-value">{Number(stats?.acceptance_rate || 0).toFixed(1)}%</div>
          <div className="stat-bar">
            <div className="stat-bar-fill" style={{width: `${stats?.acceptance_rate || 0}%`}} />
          </div>
        </div>
        <div className="stat-card accent-green">
          <div className="stat-label">Revenue Lifted</div>
          <div className="stat-value">${Number(stats?.revenue_lifted || 0).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})}</div>
          <div className="stat-sub">Total from accepted upsells</div>
        </div>
        <div className="stat-card accent-violet">
          <div className="stat-label">Total Accepts</div>
          <div className="stat-value">{Number(stats?.total_accepts || 0).toLocaleString()}</div>
          <div className="stat-sub">{Number(stats?.total_triggered || 0).toLocaleString()} offers shown</div>
        </div>
        <div className="stat-card accent-red">
          <div className="stat-label">Total Declines</div>
          <div className="stat-value">{Number(stats?.total_declines || 0).toLocaleString()}</div>
          <div className="stat-sub">Opportunity missed</div>
        </div>
      </div>

      <div className="analytics-grid">
        {/* Bar Chart */}
        <div className="card chart-card">
          <div className="card-header">
            <div className="card-title">Acceptance Rate Over Time</div>
          </div>
          {chartData.length === 0 ? (
            <div className="empty-chart">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40" style={{opacity:0.3,margin:'0 auto 12px',display:'block'}}>
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
              </svg>
              <p>No response data yet. Responses will appear here as customers interact with your offers.</p>
            </div>
          ) : (
            <div className="bar-chart">
              <div className="chart-legend">
                <div className="legend-item"><span className="dot green" />Accepted</div>
                <div className="legend-item"><span className="dot red" />Declined</div>
              </div>
              <div className="bars-container">
                {chartData.map((d, i) => (
                  <div key={i} className="bar-group">
                    <div className="bar-wrapper">
                      <div
                        className="bar green-bar"
                        style={{height: `${(d.accepted / maxBar) * 100}%`}}
                        title={`Accepted: ${d.accepted}`}
                      />
                      <div
                        className="bar red-bar"
                        style={{height: `${(d.declined / maxBar) * 100}%`}}
                        title={`Declined: ${d.declined}`}
                      />
                    </div>
                    <div className="bar-label">{d.date}</div>
                    <div className="bar-rate">{d.rate}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top Performing Offers */}
        <div className="card top-offers-card">
          <div className="card-header">
            <div className="card-title">Top Performing Offers</div>
          </div>
          {topOffers.length === 0 ? (
            <div className="empty-chart">
              <p>No offer performance data yet.</p>
            </div>
          ) : (
            <table className="top-table">
              <thead>
                <tr>
                  <th>Offer</th>
                  <th>Acceptance</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topOffers.map((offer, i) => (
                  <tr key={offer.id}>
                    <td>
                      <div className="top-offer-name">
                        <span className="rank">#{i + 1}</span>
                        {offer.name || offer.headline || `Offer #${offer.id}`}
                      </div>
                    </td>
                    <td>
                      <div className="rate-bar-cell">
                        <span className="rate-num">{offer.rate}%</span>
                        <div className="mini-bar">
                          <div className="mini-bar-fill" style={{width: `${offer.rate}%`}} />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="revenue-num">${Number(offer.revenue || 0).toLocaleString('en-US', {minimumFractionDigits:2})}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Revenue Attribution */}
      <div className="card revenue-attribution">
        <div className="card-header">
          <div className="card-title">Revenue Attribution</div>
        </div>
        <div className="attr-grid">
          <div className="attr-item">
            <div className="attr-label">Total Revenue Lifted</div>
            <div className="attr-value">${Number(stats?.revenue_lifted || 0).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})}</div>
            <div className="attr-desc">Additional revenue from accepted upsells</div>
          </div>
          <div className="attr-item">
            <div className="attr-label">Avg. Upsell Value</div>
            <div className="attr-value">
              ${stats?.total_accepts > 0
                ? (stats.revenue_lifted / stats.total_accepts).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})
                : '0.00'}
            </div>
            <div className="attr-desc">Per accepted upsell</div>
          </div>
          <div className="attr-item">
            <div className="attr-label">Potential Revenue</div>
            <div className="attr-value missed">
              ${((stats?.total_declines || 0) * (stats?.total_accepts > 0 ? stats.revenue_lifted / stats.total_accepts : 0)).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})}
            </div>
            <div className="attr-desc">Revenue from declined offers</div>
          </div>
          <div className="attr-item">
            <div className="attr-label">Accept Rate</div>
            <div className="attr-value">{Number(stats?.acceptance_rate || 0).toFixed(1)}%</div>
            <div className="attr-desc">Of shown offers accepted</div>
          </div>
        </div>
      </div>

      <style>{`
        .analytics { max-width: 1200px; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
        .page-title { font-size: 28px; font-weight: 700; color: #fafafa; margin: 0 0 4px; }
        .page-subtitle { color: #71717a; font-size: 14px; margin: 0; }
        .period-select { background: #18181b; border: 1px solid #27272a; border-radius: 8px; color: #e5e5e5; padding: 8px 14px; font-size: 14px; cursor: pointer; }
        .period-select:focus { outline: none; border-color: #8b5cf6; }

        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
        .stat-card { background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 20px; }
        .stat-card.accent-purple::before { content: ''; display: block; height: 3px; background: linear-gradient(90deg, #8b5cf6, #a78bfa); border-radius: 12px 12px 0 0; margin: -20px -20px 16px; }
        .stat-card.accent-green::before { content: ''; display: block; height: 3px; background: linear-gradient(90deg, #22c55e, #16a34a); border-radius: 12px 12px 0 0; margin: -20px -20px 16px; }
        .stat-card.accent-violet::before { content: ''; display: block; height: 3px; background: linear-gradient(90deg, #a78bfa, #8b5cf6); border-radius: 12px 12px 0 0; margin: -20px -20px 16px; }
        .stat-card.accent-red::before { content: ''; display: block; height: 3px; background: linear-gradient(90deg, #ef4444, #dc2626); border-radius: 12px 12px 0 0; margin: -20px -20px 16px; }
        .stat-label { font-size: 12px; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500; margin-bottom: 8px; }
        .stat-value { font-size: 28px; font-weight: 700; color: #fafafa; }
        .stat-sub { font-size: 12px; color: #52525b; margin-top: 4px; }
        .stat-bar { height: 4px; background: #27272a; border-radius: 2px; margin-top: 10px; overflow: hidden; }
        .stat-bar-fill { height: 100%; background: linear-gradient(90deg, #8b5cf6, #a78bfa); border-radius: 2px; transition: width 0.3s; }

        .analytics-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 16px; margin-bottom: 16px; }
        .card { background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 20px; }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .card-title { font-size: 15px; font-weight: 600; color: #fafafa; }

        .empty-chart { text-align: center; padding: 40px 20px; color: #52525b; font-size: 14px; }
        .empty-chart p { max-width: 280px; margin: 0 auto; line-height: 1.5; }

        .chart-legend { display: flex; gap: 16px; margin-bottom: 16px; }
        .legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #71717a; }
        .dot { width: 8px; height: 8px; border-radius: 50%; }
        .dot.green { background: #22c55e; }
        .dot.red { background: #ef4444; }

        .bars-container { display: flex; align-items: flex-end; gap: 6px; height: 160px; }
        .bar-group { display: flex; flex-direction: column; align-items: center; flex: 1; height: 100%; justify-content: flex-end; }
        .bar-wrapper { display: flex; align-items: flex-end; gap: 2px; flex: 1; width: 100%; max-width: 30px; }
        .bar { width: 12px; border-radius: 3px 3px 0 0; transition: height 0.3s; }
        .green-bar { background: #22c55e; }
        .red-bar { background: #ef4444; }
        .bar-label { font-size: 10px; color: #52525b; margin-top: 4px; text-align: center; }
        .bar-rate { font-size: 10px; color: #71717a; margin-top: 2px; }

        .top-table { width: 100%; border-collapse: collapse; }
        .top-table th { text-align: left; padding: 10px 12px; font-size: 11px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #27272a; }
        .top-table td { padding: 12px; font-size: 13px; border-bottom: 1px solid #27272a; }
        .top-table tr:last-child td { border-bottom: none; }
        .top-offer-name { display: flex; align-items: center; gap: 8px; font-weight: 500; color: #e5e5e5; }
        .rank { color: #a78bfa; font-weight: 700; font-size: 12px; }
        .rate-bar-cell { display: flex; align-items: center; gap: 8px; }
        .rate-num { font-weight: 600; color: #a78bfa; font-size: 13px; min-width: 40px; }
        .mini-bar { width: 60px; height: 4px; background: #27272a; border-radius: 2px; overflow: hidden; }
        .mini-bar-fill { height: 100%; background: linear-gradient(90deg, #8b5cf6, #a78bfa); border-radius: 2px; }
        .revenue-num { font-weight: 600; color: #22c55e; }

        .attr-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .attr-item { text-align: center; padding: 12px; }
        .attr-label { font-size: 12px; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
        .attr-value { font-size: 24px; font-weight: 700; color: #fafafa; }
        .attr-value.missed { color: #ef4444; }
        .attr-desc { font-size: 12px; color: #52525b; margin-top: 4px; }

        .loading-state { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 60px; color: #71717a; }
        .spinner { width: 20px; height: 20px; border: 2px solid #27272a; border-top-color: #8b5cf6; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .analytics-grid { grid-template-columns: 1fr; }
          .attr-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
}

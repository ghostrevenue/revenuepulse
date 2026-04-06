import React, { useState, useEffect } from 'react';
import { api } from '../api/index.js';

export default function Analytics({ store }) {
  const [daily, setDaily] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    if (!store) { setLoading(false); return; }
    async function load() {
      try {
        const data = await api.getDaily(period);
        setDaily(data.daily || []);
      } catch (e) {
        console.error(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [store, period]);

  if (!store) {
    return (
      <div className="empty-state">
        <h3 style={{fontSize: '18px', fontWeight: 600, marginBottom: 8}}>Connect Your Store</h3>
        <p>Connect your Shopify store to view revenue analytics.</p>
      </div>
    );
  }

  if (loading) return <div className="loading">Loading analytics...</div>;

  // Compute trends
  const reversed = [...daily].reverse();
  const halfPoint = Math.floor(reversed.length / 2);
  const firstHalf = reversed.slice(0, halfPoint);
  const secondHalf = reversed.slice(halfPoint);

  const avgFirst = firstHalf.length > 0 ? firstHalf.reduce((s, r) => s + Number(r.revenue), 0) / firstHalf.length : 0;
  const avgSecond = secondHalf.length > 0 ? secondHalf.reduce((s, r) => s + Number(r.revenue), 0) / secondHalf.length : 0;
  const trendPct = avgFirst > 0 ? ((avgSecond - avgFirst) / avgFirst * 100).toFixed(1) : 0;

  return (
    <div>
      <div className="page-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Revenue trends for {store.shop}</p>
        </div>
        <select className="form-select" style={{width: 180}} value={period} onChange={e => setPeriod(parseInt(e.target.value))}>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={60}>Last 60 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Avg Daily Revenue</div>
          <div className="stat-value">${(avgSecond).toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
          <div className={`stat-change ${trendPct >= 0 ? 'up' : 'down'}`}>
            {trendPct >= 0 ? '↑' : '↓'} {Math.abs(trendPct)}% vs prior period
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Best Day Revenue</div>
          <div className="stat-value" style={{color: '#22c55e'}}>
            ${reversed.length > 0 ? Math.max(...reversed.map(r => Number(r.revenue))).toLocaleString('en-US', {minimumFractionDigits: 2}) : '0.00'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value">
            ${reversed.reduce((s, r) => s + Number(r.revenue), 0).toLocaleString('en-US', {minimumFractionDigits: 2})}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Orders</div>
          <div className="stat-value">
            {reversed.reduce((s, r) => s + Number(r.orders), 0).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Revenue Trend</div>
        </div>
        {daily.length === 0 ? (
          <div className="empty-state">No data available for this period.</div>
        ) : (
          <div style={{maxHeight: 400, overflowY: 'auto'}}>
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Revenue</th>
                  <th>Orders</th>
                  <th>Avg Order Value</th>
                  <th>Trend</th>
                </tr>
              </thead>
              <tbody>
                {reversed.map((row, i) => {
                  const prev = reversed[i + 1];
                  const change = prev ? ((Number(row.revenue) - Number(prev.revenue)) / Number(prev.revenue) * 100).toFixed(1) : null;
                  return (
                    <tr key={row.date}>
                      <td>{row.date}</td>
                      <td>${Number(row.revenue).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                      <td>{row.orders}</td>
                      <td>${Number(row.average_order_value).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                      <td>
                        {change !== null && (
                          <span className={change >= 0 ? 'badge-success' : 'badge-danger'} style={{fontSize: 12}}>
                            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

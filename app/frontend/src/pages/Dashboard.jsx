import React, { useState, useEffect } from 'react';
import { api } from '../api/index.js';

export default function Dashboard({ store, appConfig }) {
  const [summary, setSummary] = useState(null);
  const [daily, setDaily] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const headers = {};
  if (store) {
    headers['x-store-id'] = store.id;
  }

  useEffect(() => {
    async function load() {
      if (!store) {
        setLoading(false);
        return;
      }
      try {
        const [sumData, dailyData] = await Promise.all([
          api.getSummary(30),
          api.getDaily(30)
        ]);
        setSummary(sumData.summary);
        setDaily(dailyData.daily || []);
      } catch (e) {
        console.error('Dashboard load error:', e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [store]);

  async function handleSeed() {
    if (!store) return;
    setSeeding(true);
    try {
      await fetch(`${window.location.origin}/api/revenue/seed`, {
        method: 'POST',
        headers: { 'x-store-id': store.id }
      });
      // Reload data
      const [sumData, dailyData] = await Promise.all([
        api.getSummary(30),
        api.getDaily(30)
      ]);
      setSummary(sumData.summary);
      setDaily(dailyData.daily || []);
    } catch (e) {
      console.error('Seed error:', e.message);
    } finally {
      setSeeding(false);
    }
  }

  if (!store) {
    return (
      <div className="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <h3 style={{fontSize: '18px', fontWeight: 600, marginBottom: 8}}>Connect Your Store</h3>
        <p>Install RevenuePulse in your Shopify store to see revenue analytics.</p>
        <p style={{marginTop: 8, fontSize: 13}}>
          API Key configured: {appConfig?.apiKey ? '✓ ' + appConfig.apiKey.substring(0, 8) + '...' : '✗ Not set'}
        </p>
      </div>
    );
  }

  if (loading) return <div className="loading">Loading dashboard...</div>;

  const totalRevenue = summary?.total_revenue || 0;
  const totalOrders = summary?.total_orders || 0;
  const avgOrderValue = summary?.avg_order_value || 0;
  const daysTracked = summary?.days_tracked || 0;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Revenue Dashboard</h1>
        <p className="page-subtitle">{store?.shop} · Last {daysTracked} days tracked</p>
      </div>

      {daysTracked === 0 && (
        <div className="alert-banner">
          No revenue data yet.{' '}
          <button className="btn btn-primary" style={{marginLeft: 12, padding: '4px 12px', fontSize: 13}} onClick={handleSeed} disabled={seeding}>
            {seeding ? 'Generating...' : 'Generate Demo Data'}
          </button>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Revenue (30d)</div>
          <div className="stat-value">${totalRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Orders (30d)</div>
          <div className="stat-value">{totalOrders.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Order Value</div>
          <div className="stat-value">${avgOrderValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Days Tracked</div>
          <div className="stat-value">{daysTracked}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Daily Revenue (Last 30 Days)</div>
          <button className="btn btn-secondary" onClick={handleSeed} disabled={seeding}>
            {seeding ? 'Generating...' : 'Regenerate Demo Data'}
          </button>
        </div>
        {daily.length === 0 ? (
          <div className="empty-state" style={{padding: '30px'}}>
            No daily data available yet.
          </div>
        ) : (
          <div style={{maxHeight: 300, overflowY: 'auto'}}>
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Revenue</th>
                  <th>Orders</th>
                  <th>Avg Order Value</th>
                </tr>
              </thead>
              <tbody>
                {daily.slice().reverse().map(row => (
                  <tr key={row.date}>
                    <td>{row.date}</td>
                    <td>${Number(row.revenue).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                    <td>{row.orders}</td>
                    <td>${Number(row.average_order_value).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Dashboard Page
import React, { useState, useEffect } from 'react';

export default function Dashboard({ store }) {
  const [stats, setStats] = useState({
    visitors: { total: 0, abandoned: 0, recovered: 0, converted: 0, emails_captured: 0 },
    revenue: { recovered: 0 },
    campaigns: { total: 0, active: 0, impressions: 0, conversions: 0 },
    rates: { abandonment: 0, recovery: 0 }
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await fetch(`/api/analytics/dashboard?store_id=${store.id}`);
      const data = await res.json();
      if (data) setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Abandonment Rate</div>
          <div className="stat-value" style={{ color: 'var(--accent-amber)' }}>{stats.rates.abandonment}%</div>
          <div className="stat-change">of visitors abandon</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Recovery Rate</div>
          <div className="stat-value" style={{ color: 'var(--accent-emerald)' }}>{stats.rates.recovery}%</div>
          <div className="stat-change positive">of abandoned carts recovered</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Revenue Recovered</div>
          <div className="stat-value">${stats.revenue.recovered.toFixed(0)}</div>
          <div className="stat-change positive">from abandoned carts</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Emails Captured</div>
          <div className="stat-value">{stats.visitors.emails_captured}</div>
          <div className="stat-change">visitors opted in</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Visitors</div>
          <div className="stat-value">{stats.visitors.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Abandoned Carts</div>
          <div className="stat-value" style={{ color: 'var(--accent-red)' }}>{stats.visitors.abandoned}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Recovered</div>
          <div className="stat-value" style={{ color: 'var(--accent-emerald)' }}>{stats.visitors.recovered}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Campaigns</div>
          <div className="stat-value">{stats.campaigns.active}</div>
        </div>
      </div>
    </div>
  );
}

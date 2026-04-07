import React, { useState, useEffect } from 'react';
import { getOverview } from '../api/analytics.js';

function Dashboard({ storeId }) {
  const [stats, setStats] = useState({ today_events: 0, today_value: 0, total_events: 0, by_event_type: [] });

  useEffect(() => {
    getOverview(storeId).then(setStats).catch(() => {});
  }, [storeId]);

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Dashboard</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
        <StatCard title="Today's Events" value={stats.today_events} />
        <StatCard title="Today's Value" value={`$${(stats.today_value || 0).toFixed(2)}`} />
        <StatCard title="Total Events" value={stats.total_events} />
      </div>
      <div style={{ marginTop: 32 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Events Today</h3>
        {stats.by_event_type.length > 0 ? (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {stats.by_event_type.map(e => (
              <span key={e.event_name} style={{ padding: '8px 16px', background: '#1a1a2e', borderRadius: 8, fontSize: 14 }}>
                {e.event_name}: {e.count}
              </span>
            ))}
          </div>
        ) : (
          <p style={{ color: '#888' }}>No events tracked yet</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div style={{ background: '#13131a', borderRadius: 12, padding: 24, border: '1px solid #2a2a3a' }}>
      <p style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>{title}</p>
      <p style={{ fontSize: 32, fontWeight: 700, color: '#fff' }}>{value}</p>
    </div>
  );
}

export default Dashboard;

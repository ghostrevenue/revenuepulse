import React, { useState, useEffect } from 'react';
import { getOverview, getROAS, getTimeline } from '../api/analytics.js';

function Analytics({ storeId }) {
  const [overview, setOverview] = useState({});
  const [roas, setRoas] = useState({});
  const [timeline, setTimeline] = useState([]);

  useEffect(() => {
    getOverview(storeId).then(setOverview).catch(() => {});
    getROAS(storeId).then(setRoas).catch(() => {});
    getTimeline(storeId, 7).then(data => setTimeline(data.timeline || [])).catch(() => {});
  }, [storeId]);

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Analytics & ROAS</h2>
      
      <div style={{ background: '#13131a', borderRadius: 12, padding: 24, marginBottom: 24, border: '1px solid #2a2a3a' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>ROAS by Campaign</h3>
        {roas.roas_by_campaign && roas.roas_by_campaign.length > 0 ? (
          <div style={{ display: 'grid', gap: 12 }}>
            {roas.roas_by_campaign.map((c, i) => (
              <div key={i} style={{ background: '#0a0a0f', borderRadius: 8, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600 }}>{c.campaign}</span>
                  <span style={{ color: '#6366f1' }}>ROAS: {c.roas}x</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: 14, color: '#888' }}>
                  <span>Purchases: {c.purchases}</span>
                  <span>Value: ${c.value?.toFixed(2) || 0}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#888' }}>Connect Facebook Ad account to see ROAS data</p>
        )}
      </div>

      <div style={{ background: '#13131a', borderRadius: 12, padding: 24, border: '1px solid #2a2a3a' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Event Timeline (7 days)</h3>
        {timeline.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2a2a3a' }}>
                  <th style={{ padding: 12, textAlign: 'left', color: '#888', fontSize: 12 }}>Date</th>
                  <th style={{ padding: 12, textAlign: 'left', color: '#888', fontSize: 12 }}>Event</th>
                  <th style={{ padding: 12, textAlign: 'right', color: '#888', fontSize: 12 }}>Count</th>
                  <th style={{ padding: 12, textAlign: 'right', color: '#888', fontSize: 12 }}>Value</th>
                </tr>
              </thead>
              <tbody>
                {timeline.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #2a2a3a' }}>
                    <td style={{ padding: 12, fontSize: 14 }}>{row.date}</td>
                    <td style={{ padding: 12, fontSize: 14 }}>{row.event_name}</td>
                    <td style={{ padding: 12, fontSize: 14, textAlign: 'right' }}>{row.count}</td>
                    <td style={{ padding: 12, fontSize: 14, textAlign: 'right' }}>${row.value?.toFixed(2) || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#888' }}>No timeline data available</p>
        )}
      </div>
    </div>
  );
}

export default Analytics;

// Analytics Page
import React, { useState, useEffect } from 'react';

export default function Analytics({ store }) {
  const [funnel, setFunnel] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const res = await fetch(`/api/analytics/funnel?store_id=${store.id}`);
      const data = await res.json();
      setFunnel(data.funnel);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  };

  if (!funnel) return <div>Loading...</div>;

  const maxVal = Math.max(...Object.values(funnel));

  const labels = {
    visited: 'Site Visitors',
    added_to_cart: 'Added to Cart',
    abandoned: 'Abandoned',
    recovered: 'Recovered',
    converted: 'Converted'
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 24 }}>Recovery Funnel</h3>
        <div className="funnel">
          {Object.entries(funnel).map(([stage, value]) => {
            const width = maxVal > 0 ? (value / maxVal) * 100 : 0;
            return (
              <div key={stage} className="funnel-stage">
                <div className="funnel-label">{labels[stage] || stage}</div>
                <div className="funnel-bar" style={{ width: `${Math.max(width, 5)}%` }}>
                  {value}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

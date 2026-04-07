// Visitors Page
import React, { useState, useEffect } from 'react';

export default function Visitors({ store }) {
  const [visitors, setVisitors] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadVisitors();
  }, []);

  const loadVisitors = async () => {
    try {
      const res = await fetch(`/api/visitors?store_id=${store.id}&limit=100`);
      const data = await res.json();
      setVisitors(data.visitors || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to load visitors:', err);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      browsing: 'badge-draft',
      abandoned: 'badge-draft',
      recovered: 'badge-active',
      converted: 'badge-active'
    };
    return colors[status] || 'badge-draft';
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Visitors</h1>
        <span style={{ color: 'var(--text-secondary)' }}>{total} total visitors</span>
      </div>

      <div className="card">
        {visitors.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <h3>No visitors tracked yet</h3>
            <p>Install the storefront widget to start tracking visitors.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Cart Value</th>
                <th>Status</th>
                <th>Captured</th>
              </tr>
            </thead>
            <tbody>
              {visitors.map(v => (
                <tr key={v.id}>
                  <td>{v.email || 'Anonymous'}</td>
                  <td>${v.cart_value?.toFixed(2) || '0.00'}</td>
                  <td><span className={`badge ${getStatusBadge(v.status)}`}>{v.status}</span></td>
                  <td>{new Date(v.captured_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../api/analytics.js';

const Analytics = ({ storeId }) => {
  const [velocity, setVelocity] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('velocity');

  useEffect(() => {
    loadData();
  }, [storeId]);

  const loadData = async () => {
    try {
      const [velData, predData] = await Promise.all([
        analyticsApi.getVelocity(storeId),
        analyticsApi.getPredictions(storeId)
      ]);
      setVelocity(velData.velocity || []);
      setPredictions(predData.predictions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading analytics...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Sales velocity and stock predictions</p>
      </div>

      <div className="tabs">
        <div className={`tab ${activeTab === 'velocity' ? 'active' : ''}`} onClick={() => setActiveTab('velocity')}>Sales Velocity</div>
        <div className={`tab ${activeTab === 'predictions' ? 'active' : ''}`} onClick={() => setActiveTab('predictions')}>Restock Predictions</div>
      </div>

      {activeTab === 'velocity' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Units Sold Per Week</h3>
          </div>
          {velocity.length === 0 ? (
            <div className="empty-state">No velocity data available</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Product ID</th>
                  <th>Weekly Velocity</th>
                  <th>Days Until Stockout</th>
                </tr>
              </thead>
              <tbody>
                {velocity.map(v => (
                  <tr key={v.productId}>
                    <td>{v.productId}</td>
                    <td>{v.weeklyVelocity} units/week</td>
                    <td>{v.daysUntilStockout > 0 ? `${v.daysUntilStockout} days` : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'predictions' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Stockout Predictions</h3>
          </div>
          {predictions.length === 0 ? (
            <div className="empty-state">No predictions available</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Product ID</th>
                  <th>Current Stock</th>
                  <th>Weekly Sales</th>
                  <th>Days Until Out</th>
                  <th>Suggested Reorder</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map(p => (
                  <tr key={p.productId}>
                    <td>{p.productId}</td>
                    <td>{p.currentStock}</td>
                    <td>{p.weeklySales} units</td>
                    <td>
                      <span className={`badge ${p.daysUntilOutOfStock <= 7 ? 'badge-danger' : p.daysUntilOutOfStock <= 14 ? 'badge-warning' : 'badge-success'}`}>
                        {p.daysUntilOutOfStock === 0 ? 'NOW' : `${p.daysUntilOutOfStock} days`}
                      </span>
                    </td>
                    <td>{p.suggestedReorderDate !== 'now' ? new Date(p.suggestedReorderDate).toLocaleDateString() : 'Reorder Now'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default Analytics;
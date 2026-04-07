import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../api/analytics.js';
import { productsApi } from '../api/products.js';

const Dashboard = ({ storeId }) => {
  const [summary, setSummary] = useState({ totalProducts: 0, lowStockCount: 0, outOfStockCount: 0, totalUnits: 0 });
  const [lowStock, setLowStock] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [storeId]);

  const loadData = async () => {
    try {
      const [summaryData, lowStockData, predData] = await Promise.all([
        analyticsApi.getSummary(storeId),
        productsApi.getLowStock(storeId),
        analyticsApi.getPredictions(storeId)
      ]);
      setSummary(summaryData.summary || summaryData);
      setLowStock(lowStockData.products || []);
      setPredictions(predData.predictions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;

  const urgentRestock = predictions.filter(p => p.daysUntilOutOfStock <= 7 && p.daysUntilOutOfStock > 0);
  const outOfStock = predictions.filter(p => p.daysUntilOutOfStock === 0);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Inventory overview and alerts</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Products</div>
          <div className="stat-value">{summary.totalProducts}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Low Stock</div>
          <div className="stat-value warning">{summary.lowStockCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Out of Stock</div>
          <div className="stat-value danger">{summary.outOfStockCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Units</div>
          <div className="stat-value">{summary.totalUnits}</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">⚠️ Low Stock Alerts</h3>
          </div>
          {lowStock.length === 0 ? (
            <div className="empty-state">No low stock products</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Stock</th>
                  <th>Reorder Point</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.slice(0, 5).map(p => (
                  <tr key={p.id}>
                    <td>{p.product_id}</td>
                    <td><span className="badge badge-warning">{p.quantity}</span></td>
                    <td>{p.reorder_point}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📈 Restock Predictions</h3>
          </div>
          {urgentRestock.length === 0 && outOfStock.length === 0 ? (
            <div className="empty-state">No urgent predictions</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Days Left</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {[...outOfStock.slice(0, 3), ...urgentRestock.slice(0, 5)].map((p, i) => (
                  <tr key={i}>
                    <td>{p.productId}</td>
                    <td>{p.daysUntilOutOfStock === 0 ? 'NOW' : `${p.daysUntilOutOfStock}d`}</td>
                    <td>
                      <span className={`badge ${p.daysUntilOutOfStock === 0 ? 'badge-danger' : 'badge-warning'}`}>
                        {p.daysUntilOutOfStock === 0 ? 'Out of Stock' : 'Urgent'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
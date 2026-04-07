import React, { useState, useEffect } from 'react';
import { alertsApi } from '../api/alerts.js';

const Alerts = ({ storeId }) => {
  const [configs, setConfigs] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newConfig, setNewConfig] = useState({ threshold: 10, alertType: 'low_stock', email: '', sms: false });

  useEffect(() => {
    loadData();
  }, [storeId]);

  const loadData = async () => {
    try {
      const [configsData, historyData] = await Promise.all([
        alertsApi.getConfigs(storeId),
        alertsApi.getHistory(storeId)
      ]);
      setConfigs(configsData.configs || []);
      setHistory(historyData.alerts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConfig = async () => {
    await alertsApi.createConfig(storeId, newConfig);
    setShowModal(false);
    loadData();
  };

  const handleAcknowledge = async (id) => {
    await alertsApi.acknowledge(id);
    loadData();
  };

  const handleTestAlert = async () => {
    await alertsApi.testAlert(storeId, 'demo-product');
    alert('Test alert sent!');
  };

  if (loading) return <div className="loading">Loading alerts...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Alerts</h1>
        <p className="page-subtitle">Configure notifications and view alert history</p>
      </div>

      <div className="flex justify-between items-center gap-2" style={{ marginBottom: 24 }}>
        <button className="btn btn-secondary" onClick={handleTestAlert}>Send Test Alert</button>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Alert Config</button>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Alert Configurations</h3>
          </div>
          {configs.length === 0 ? (
            <div className="empty-state">No alert configs set up</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Threshold</th>
                  <th>Email</th>
                  <th>SMS</th>
                </tr>
              </thead>
              <tbody>
                {configs.map(c => (
                  <tr key={c.id}>
                    <td>{c.alert_type}</td>
                    <td>{c.threshold}</td>
                    <td>{c.email || '-'}</td>
                    <td>{c.sms ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Alert History</h3>
          </div>
          {history.length === 0 ? (
            <div className="empty-state">No alerts sent yet</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 10).map(a => (
                  <tr key={a.id}>
                    <td>{a.product_id || 'Global'}</td>
                    <td>{a.alert_type}</td>
                    <td>
                      <span className={`badge ${a.acknowledged ? 'badge-success' : 'badge-warning'}`}>
                        {a.acknowledged ? 'Acknowledged' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      {!a.acknowledged && (
                        <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => handleAcknowledge(a.id)}>Ack</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">New Alert Config</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label className="form-label">Alert Type</label>
              <select className="form-select" value={newConfig.alertType} onChange={e => setNewConfig({ ...newConfig, alertType: e.target.value })}>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="restock">Restock</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Threshold</label>
              <input type="number" className="form-input" value={newConfig.threshold} onChange={e => setNewConfig({ ...newConfig, threshold: parseInt(e.target.value) })} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={newConfig.email} onChange={e => setNewConfig({ ...newConfig, email: e.target.value })} placeholder="alerts@yourstore.com" />
            </div>
            <div className="form-group">
              <label className="form-label">
                <input type="checkbox" checked={newConfig.sms} onChange={e => setNewConfig({ ...newConfig, sms: e.target.checked })} /> Enable SMS
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateConfig}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alerts;
// Campaigns Page
import React, { useState, useEffect } from 'react';

export default function Campaigns({ store }) {
  const [campaigns, setCampaigns] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const res = await fetch(`/api/campaigns?store_id=${store.id}`);
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    }
  };

  const handleSave = async (campaign) => {
    try {
      if (editing) {
        await fetch(`/api/campaigns/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(campaign)
        });
      } else {
        await fetch('/api/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...campaign, store_id: store.id })
        });
      }
      setShowModal(false);
      setEditing(null);
      loadCampaigns();
    } catch (err) {
      console.error('Failed to save campaign:', err);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this campaign?')) {
      await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
      loadCampaigns();
    }
  };

  const handleStatusToggle = async (campaign) => {
    const newStatus = campaign.status === 'active' ? 'paused' : 'active';
    await fetch(`/api/campaigns/${campaign.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    loadCampaigns();
  };

  const getTypeBadge = (type) => {
    const badges = {
      'exit-intent': 'badge-exit',
      'abandoned-cart': 'badge-cart',
      'price-threshold': 'badge-threshold'
    };
    return badges[type] || 'badge-draft';
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Campaigns</h1>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
          + New Campaign
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📣</div>
          <h3>No campaigns yet</h3>
          <p>Create your first campaign to start recovering abandoned carts.</p>
        </div>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Impressions</th>
                <th>Conversions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map(c => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td><span className={`badge ${getTypeBadge(c.type)}`}>{c.type}</span></td>
                  <td><span className={`badge badge-${c.status}`}>{c.status}</span></td>
                  <td>{c.stats?.impressions || 0}</td>
                  <td>{c.stats?.conversions || 0}</td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: '6px 12px', marginRight: 8 }}
                      onClick={() => handleStatusToggle(c)}>
                      {c.status === 'active' ? 'Pause' : 'Activate'}
                    </button>
                    <button className="btn btn-danger" style={{ padding: '6px 12px' }}
                      onClick={() => handleDelete(c.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <CampaignModal
          campaign={editing}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

function CampaignModal({ campaign, onSave, onClose }) {
  const [form, setForm] = useState({
    name: campaign?.name || '',
    type: campaign?.type || 'exit-intent',
    status: campaign?.status || 'draft',
    offer_config: campaign?.offer_config || { type: 'percentage', value: 10 },
    display_config: campaign?.display_config || { headline: 'Wait!', button_text: 'Stay & Save' }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">{campaign ? 'Edit Campaign' : 'New Campaign'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Campaign Name</label>
            <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="exit-intent">Exit Intent</option>
              <option value="abandoned-cart">Abandoned Cart</option>
              <option value="price-threshold">Price Threshold</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Offer Value</label>
            <input type="number" className="form-input" value={form.offer_config.value}
              onChange={e => setForm({ ...form, offer_config: { ...form.offer_config, value: parseFloat(e.target.value) } })} />
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

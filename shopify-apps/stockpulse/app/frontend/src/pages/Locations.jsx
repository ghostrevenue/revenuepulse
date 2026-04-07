import React, { useState, useEffect } from 'react';

const Locations = ({ storeId }) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', address: '' });

  useEffect(() => {
    loadLocations();
  }, [storeId]);

  const loadLocations = async () => {
    try {
      const res = await fetch('/api/locations', { headers: { 'x-store-id': storeId } });
      const data = await res.json();
      setLocations(data.locations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    await fetch('/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-store-id': storeId },
      body: JSON.stringify(form)
    });
    setShowModal(false);
    setForm({ name: '', address: '' });
    loadLocations();
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this location?')) {
      await fetch(`/api/locations/${id}`, { method: 'DELETE', headers: { 'x-store-id': storeId } });
      loadLocations();
    }
  };

  if (loading) return <div className="loading">Loading locations...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Locations</h1>
        <p className="page-subtitle">Manage warehouses and inventory locations</p>
      </div>

      <button className="btn btn-primary" style={{ marginBottom: 20 }} onClick={() => setShowModal(true)}>+ Add Location</button>

      <div className="card">
        {locations.length === 0 ? (
          <div className="empty-state">No locations added yet</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {locations.map(l => (
                <tr key={l.id}>
                  <td>{l.name}</td>
                  <td>{l.address || '-'}</td>
                  <td>
                    <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => handleDelete(l.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Location</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input type="text" className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input type="text" className="form-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Locations;
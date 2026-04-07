import React, { useState, useEffect } from 'react';

const Suppliers = ({ storeId }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', leadTimeDays: 7, minimumOrder: 0 });

  useEffect(() => {
    loadSuppliers();
  }, [storeId]);

  const loadSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers', { headers: { 'x-store-id': storeId } });
      const data = await res.json();
      setSuppliers(data.suppliers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const method = editingSupplier ? 'PUT' : 'POST';
    const url = editingSupplier ? `/api/suppliers/${editingSupplier}` : '/api/suppliers';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'x-store-id': storeId },
      body: JSON.stringify(form)
    });
    setShowModal(false);
    setEditingSupplier(null);
    setForm({ name: '', email: '', phone: '', leadTimeDays: 7, minimumOrder: 0 });
    loadSuppliers();
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this supplier?')) {
      await fetch(`/api/suppliers/${id}`, { method: 'DELETE', headers: { 'x-store-id': storeId } });
      loadSuppliers();
    }
  };

  const openEdit = (supplier) => {
    setEditingSupplier(supplier.id);
    setForm({ name: supplier.name, email: supplier.email, phone: supplier.phone, leadTimeDays: supplier.lead_time_days, minimumOrder: supplier.minimum_order });
    setShowModal(true);
  };

  if (loading) return <div className="loading">Loading suppliers...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Suppliers</h1>
        <p className="page-subtitle">Manage suppliers and lead times</p>
      </div>

      <button className="btn btn-primary" style={{ marginBottom: 20 }} onClick={() => { setEditingSupplier(null); setForm({ name: '', email: '', phone: '', leadTimeDays: 7, minimumOrder: 0 }); setShowModal(true); }}>+ Add Supplier</button>

      <div className="card">
        {suppliers.length === 0 ? (
          <div className="empty-state">No suppliers added yet</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Lead Time</th>
                <th>Min Order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(s => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.email || '-'}</td>
                  <td>{s.phone || '-'}</td>
                  <td>{s.lead_time_days} days</td>
                  <td>${s.minimum_order}</td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12, marginRight: 8 }} onClick={() => openEdit(s)}>Edit</button>
                    <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => handleDelete(s.id)}>Delete</button>
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
              <h3 className="modal-title">{editingSupplier ? 'Edit Supplier' : 'Add Supplier'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input type="text" className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input type="tel" className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Lead Time (days)</label>
              <input type="number" className="form-input" value={form.leadTimeDays} onChange={e => setForm({ ...form, leadTimeDays: parseInt(e.target.value) })} />
            </div>
            <div className="form-group">
              <label className="form-label">Minimum Order ($)</label>
              <input type="number" className="form-input" value={form.minimumOrder} onChange={e => setForm({ ...form, minimumOrder: parseFloat(e.target.value) })} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit}>{editingSupplier ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
import React, { useState, useEffect } from 'react';
import { api } from '../api/index.js';
import ProductPicker from '../components/ProductPicker.jsx';

const INITIAL_FORM = {
  name: '',
  offer_type: 'add_product',
  trigger_min_amount: '50',
  upsell_product_id: '',
  target_tags: '',
  upsell_discount_code: '',
  upsell_discount_value: '',
  message: '',
  status: 'active'
};

export default function Upsells({ store, appConfig }) {
  const [offers, setOffers] = useState([]);
  const [responses, setResponses] = useState([]);
  const [totals, setTotals] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [formErrors, setFormErrors] = useState({});
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [selectedProductName, setSelectedProductName] = useState('');

  useEffect(() => {
    loadData();
  }, [store]);

  async function loadData() {
    if (!store) return;
    try {
      const [offersRes, responsesRes] = await Promise.all([
        api.getUpsellOffers(),
        api.getUpsellResponses()
      ]);
      setOffers(offersRes.offers || []);
      setResponses(responsesRes.responses || []);
      setTotals(responsesRes.totals || {});
    } catch (e) {
      console.error('Failed to load upsell data:', e.message);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({ ...INITIAL_FORM });
    setFormErrors({});
    setSelectedProductName('');
  }

  function handleProductSelect({ product, variant }) {
    setForm({ ...form, upsell_product_id: product.id });
    setSelectedProductName(product.title);
    setShowProductPicker(false);
    setFormErrors({ ...formErrors, upsell_product_id: null });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = {};

    // Validate: if offer_type is 'add_product' and upsell_product_id is empty
    if (form.offer_type === 'add_product' && !form.upsell_product_id) {
      errors.upsell_product_id = 'Please select a product';
    }

    // Validate: if offer_type is 'discount' and upsell_discount_value is empty or 0
    if ((form.offer_type === 'discount' || form.offer_type === 'discount_code') && (!form.upsell_discount_value || parseFloat(form.upsell_discount_value) === 0)) {
      errors.upsell_discount_value = 'Please set a discount value';
    }

    // Set default message if empty
    const messageToSend = form.message.trim() || 'Wait! Add this to your order';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const payload = {
        name: form.name || null,
        offer_type: form.offer_type,
        trigger_min_amount: parseFloat(form.trigger_min_amount) || 0,
        upsell_product_id: form.upsell_product_id || null,
        target_tags: form.target_tags || null,
        upsell_discount_code: form.upsell_discount_code || null,
        upsell_discount_value: form.upsell_discount_value ? parseFloat(form.upsell_discount_value) : null,
        message: messageToSend,
        status: form.status
      };

      if (editing) {
        await api.updateUpsellOffer(editing.id, payload);
      } else {
        await api.createUpsellOffer(payload);
      }
      setShowForm(false);
      setEditing(null);
      resetForm();
      loadData();
    } catch (e) {
      alert('Error saving offer: ' + e.message);
    }
  }

  function startEdit(offer) {
    setEditing(offer);
    setForm({
      name: offer.name || '',
      // Normalize discount_code → discount (legacy data from before the fix)
      offer_type: offer.offer_type === 'discount_code' ? 'discount' : (offer.offer_type || 'add_product'),
      trigger_min_amount: String(offer.trigger_min_amount || '0'),
      upsell_product_id: offer.upsell_product_id || '',
      target_tags: offer.target_tags || '',
      upsell_discount_code: offer.upsell_discount_code || '',
      upsell_discount_value: offer.upsell_discount_value ? String(offer.upsell_discount_value) : '',
      message: offer.message || '',
      status: offer.status || 'active'
    });
    // If offer has a product_id, try to show a name (we store the id only in this form)
    setSelectedProductName(offer.upsell_product_id ? `Product ID: ${offer.upsell_product_id}` : '');
    setFormErrors({});
    setShowForm(true);
  }

  async function toggleActive(offer) {
    try {
      const newStatus = offer.status === 'active' ? 'draft' : 'active';
      await api.updateUpsellOffer(offer.id, { status: newStatus });
      loadData();
    } catch (e) {
      alert('Error updating offer: ' + e.message);
    }
  }

  async function deleteOffer(id) {
    if (!confirm('Delete this offer?')) return;
    try {
      await api.deleteUpsellOffer(id);
      loadData();
    } catch (e) {
      alert('Error deleting offer: ' + e.message);
    }
  }

  const accepted = totals.accepted || 0;
  const declined = totals.declined || 0;
  const triggered = totals.triggered || 0;
  const conversionRate = triggered > 0 ? ((accepted / triggered) * 100).toFixed(1) : '0.0';

  if (loading) return <div className="loading">Loading upsells...</div>;
  if (!store) return <div className="empty-state">Connect your store to manage upsells.</div>;

  return (
    <div className="page upsells-page">
      <div className="page-header">
        <div>
          <h1>Post-Purchase Upsells</h1>
          <p className="subtitle">Create compelling one-click upsell offers after checkout</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
          + Create Offer
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{triggered}</div>
          <div className="stat-label">Offers Shown</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{accepted}</div>
          <div className="stat-label">Accepted</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{declined}</div>
          <div className="stat-label">Declined</div>
        </div>
        <div className="stat-card highlight">
          <div className="stat-value">{conversionRate}%</div>
          <div className="stat-label">Conversion Rate</div>
        </div>
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editing ? 'Edit Offer' : 'Create Upsell Offer'}</h2>
            <form onSubmit={handleSubmit} className="upsell-form">
              <div className="form-group">
                <label>Offer Type</label>
                <select value={form.offer_type} onChange={e => setForm({ ...form, offer_type: e.target.value })}>
                  <option value="add_product">One-Click Add to Order</option>
                  <option value="discount">Discount Code</option>
                </select>
              </div>

              <div className="form-group">
                <label>Minimum Order Value ($)</label>
                <input type="number" step="0.01" value={form.trigger_min_amount} onChange={e => setForm({ ...form, trigger_min_amount: e.target.value })} placeholder="50.00" />
                <small>Offer triggers for orders at or above this value</small>
              </div>

              {form.offer_type === 'add_product' && (
                <div className="form-group">
                  <label>Target Product</label>
                  <button type="button" className="btn-secondary" onClick={() => setShowProductPicker(true)}>
                    {selectedProductName ? 'Change Product' : 'Select Product'}
                  </button>
                  {selectedProductName && (
                    <div className="selected-product-row">
                      <span className="selected-product-name">{selectedProductName}</span>
                    </div>
                  )}
                  {formErrors.upsell_product_id && <span className="inline-error">{formErrors.upsell_product_id}</span>}
                  <small>Select the product to offer as an upsell</small>
                </div>
              )}

              <div className="form-group">
                <label>Target Tags (comma-separated)</label>
                <input type="text" value={form.target_tags} onChange={e => setForm({ ...form, target_tags: e.target.value })} placeholder="featured,bestseller" />
                <small>Trigger only for orders with products having these tags</small>
              </div>

              {(form.offer_type === 'discount' || form.offer_type === 'discount_code') && (
                <>
                  <div className="form-group">
                    <label>Discount Code</label>
                    <input type="text" value={form.upsell_discount_code} onChange={e => setForm({ ...form, upsell_discount_code: e.target.value })} placeholder="SAVE10" />
                  </div>
                  <div className="form-group">
                    <label>Discount Percent (%)</label>
                    <input type="number" value={form.upsell_discount_value} onChange={e => setForm({ ...form, upsell_discount_value: e.target.value })} placeholder="10" />
                    {formErrors.upsell_discount_value && <span className="inline-error">{formErrors.upsell_discount_value}</span>}
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Custom Message</label>
                <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Add this to your order for just $X extra!" rows={3} />
                <small>Leave blank for default message</small>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input type="checkbox" checked={form.status === 'active'} onChange={e => setForm({ ...form, status: e.target.checked ? 'active' : 'draft' })} />
                  Active (offer will show to customers)
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary">{editing ? 'Update Offer' : 'Create Offer'}</button>
              </div>
            </form>
            <ProductPicker
              isOpen={showProductPicker}
              onClose={() => setShowProductPicker(false)}
              onSelect={handleProductSelect}
            />
          </div>
        </div>
      )}

      {/* Offers List */}
      <div className="section">
        <h2>Your Offers ({offers.length})</h2>
        {offers.length === 0 ? (
          <div className="empty-state">
            <p>No upsell offers yet. Create your first offer to start boosting revenue!</p>
            <button className="btn-primary" onClick={() => setShowForm(true)}>Create Offer</button>
          </div>
        ) : (
          <div className="offers-list">
            {offers.map(offer => (
              <div key={offer.id} className={`offer-card ${offer.status !== 'active' ? 'inactive' : ''}`}>
                <div className="offer-header">
                  <span className={`offer-type-badge ${offer.offer_type}`}>
                    {offer.offer_type === 'add_product' ? 'Add to Order' : 'Discount Code'}
                  </span>
                  <label className="toggle">
                    <input type="checkbox" checked={offer.status === 'active'} onChange={() => toggleActive(offer)} />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="offer-body">
                  <p className="offer-message">{offer.message || <em>Default message</em>}</p>
                  <div className="offer-meta">
                    <span>Min order: <strong>${offer.trigger_min_amount || 0}</strong></span>
                    {offer.upsell_product_id && <span>Product IDs: <strong>{offer.upsell_product_id}</strong></span>}
                    {offer.target_tags && <span>Tags: <strong>{offer.target_tags}</strong></span>}
                    {offer.upsell_discount_code && <span>Code: <strong>{offer.upsell_discount_code}</strong></span>}
                    {offer.upsell_discount_value && <span>Discount: <strong>{offer.upsell_discount_value}%</strong></span>}
                  </div>
                </div>
                <div className="offer-actions">
                  <button className="btn-sm" onClick={() => startEdit(offer)}>Edit</button>
                  <button className="btn-sm btn-danger" onClick={() => deleteOffer(offer.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Response History */}
      {responses.length > 0 && (
        <div className="section">
          <h2>Recent Responses</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Response</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {responses.map((r, i) => (
                <tr key={i}>
                  <td>{r.date}</td>
                  <td><span className={`response-badge ${r.response}`}>{r.response}</span></td>
                  <td>{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .upsells-page { max-width: 900px; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .page-header h1 { margin: 0 0 4px; }
        .subtitle { color: #666; margin: 0; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
        .stat-card { background: white; border: 1px solid #e1e1e1; border-radius: 8px; padding: 20px; text-align: center; }
        .stat-card.highlight { background: #0a8754; color: white; }
        .stat-card.highlight .stat-label { color: rgba(255,255,255,0.8); }
        .stat-value { font-size: 32px; font-weight: 700; }
        .stat-label { font-size: 13px; color: #666; margin-top: 4px; }
        .section { margin-bottom: 32px; }
        .section h2 { margin-bottom: 16px; }
        .offers-list { display: flex; flex-direction: column; gap: 12px; }
        .offer-card { background: white; border: 1px solid #e1e1e1; border-radius: 8px; padding: 16px; }
        .offer-card.inactive { opacity: 0.6; }
        .offer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .offer-type-badge { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
        .offer-type-badge.add_to_order { background: #e8f5e9; color: #0a8754; }
        .offer-type-badge.discount_code { background: #e3f2fd; color: #1565c0; }
        .toggle { position: relative; display: inline-block; width: 40px; height: 22px; }
        .toggle input { opacity: 0; width: 0; height: 0; }
        .toggle-slider { position: absolute; cursor: pointer; inset: 0; background: #ccc; border-radius: 22px; transition: 0.2s; }
        .toggle-slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.2s; }
        .toggle input:checked + .toggle-slider { background: #0a8754; }
        .toggle input:checked + .toggle-slider:before { transform: translateX(18px); }
        .offer-body { margin-bottom: 12px; }
        .offer-message { margin: 0 0 8px; }
        .offer-meta { display: flex; flex-wrap: wrap; gap: 16px; font-size: 13px; color: #666; }
        .offer-meta strong { color: #333; }
        .offer-actions { display: flex; gap: 8px; }
        .btn-sm { padding: 6px 12px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer; font-size: 13px; }
        .btn-sm:hover { background: #f5f5f5; }
        .btn-danger { color: #c00; border-color: #c00; }
        .btn-danger:hover { background: #fff0f0; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal { background: white; border-radius: 12px; padding: 32px; width: 500px; max-width: 95vw; max-height: 90vh; overflow-y: auto; }
        .modal h2 { margin: 0 0 24px; }
        .upsell-form .form-group { margin-bottom: 16px; }
        .upsell-form label { display: block; font-weight: 600; margin-bottom: 6px; font-size: 14px; }
        .upsell-form input[type="text"],
        .upsell-form input[type="number"],
        .upsell-form textarea,
        .upsell-form select { width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; box-sizing: border-box; }
        .upsell-form textarea { resize: vertical; }
        .upsell-form small { display: block; margin-top: 4px; color: #888; font-size: 12px; }
        .checkbox-group label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
        .form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
        .btn-primary { background: #0a8754; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; }
        .btn-primary:hover { background: #0d9668; }
        .btn-secondary { background: white; color: #333; border: 1px solid #ddd; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; }
        .btn-secondary:hover { background: #f5f5f5; }
        .response-badge { padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
        .response-badge.accepted { background: #e8f5e9; color: #0a8754; }
        .response-badge.declined { background: #ffebee; color: #c00; }
        .response-badge.triggered { background: #e3f2fd; color: #1565c0; }
        .data-table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #e1e1e1; }
        .data-table th, .data-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #eee; }
        .data-table th { background: #f8f8f8; font-weight: 600; font-size: 13px; }
        .data-table tr:last-child td { border-bottom: none; }
        .empty-state { text-align: center; padding: 40px; color: #666; }
        .loading { display: flex; align-items: center; justify-content: center; height: 200px; color: #666; }
        .inline-error { display: block; color: #c00; font-size: 13px; margin-top: 6px; font-weight: 500; }
        .selected-product-row { display: flex; align-items: center; gap: 8px; margin-top: 10px; padding: 10px 12px; background: #e8f5e9; border-radius: 6px; border: 1px solid #c8e6c9; }
        .selected-product-name { font-size: 14px; font-weight: 600; color: #0a8754; }
      `}</style>
    </div>
  );
}

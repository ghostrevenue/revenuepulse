import React, { useState, useEffect } from 'react';
import { api } from '../api/index.js';

export default function OfferBuilder({ store, appConfig }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    // Step 1 — Trigger
    trigger_threshold: '50',
    target_product_ids: '',
    target_tags: '',
    // Step 2 — Type
    offer_type: 'add_product',
    // Step 3 — Content
    headline: 'Wait! Add this to your order',
    message: 'Get it delivered with your current order — just one click away.',
    upsell_product_id: '',
    upsell_product_title: '',
    upsell_product_price: '',
    upsell_product_image: '',
    discount_code: '',
    discount_percent: '',
    active: true,
  });

  useEffect(() => {
    if (!store) { setLoading(false); return; }
    loadOffers();
  }, [store]);

  async function loadOffers() {
    try {
      const res = await api.getUpsellOffers();
      setOffers(res.offers || []);
    } catch (e) {
      console.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(offer) {
    setEditing(offer);
    setForm({
      name: offer.name || '',
      trigger_threshold: String(offer.trigger_threshold || '50'),
      target_product_ids: offer.target_product_ids || '',
      target_tags: offer.target_tags || '',
      offer_type: offer.offer_type || 'add_product',
      headline: offer.headline || 'Wait! Add this to your order',
      message: offer.message || 'Get it delivered with your current order — just one click away.',
      upsell_product_id: offer.upsell_product_id || '',
      upsell_product_title: offer.upsell_product_title || '',
      upsell_product_price: offer.upsell_product_price || '',
      upsell_product_image: offer.upsell_product_image || '',
      discount_code: offer.discount_code || '',
      discount_percent: offer.discount_percent ? String(offer.discount_percent) : '',
      active: !!offer.active,
    });
    setStep(1);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setStep(1);
    setForm({
      name: '', trigger_threshold: '50', target_product_ids: '', target_tags: '',
      offer_type: 'add_product', headline: 'Wait! Add this to your order',
      message: 'Get it delivered with your current order — just one click away.',
      upsell_product_id: '', upsell_product_title: '', upsell_product_price: '', upsell_product_image: '',
      discount_code: '', discount_percent: '', active: true,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!store) return;

    const payload = {
      name: form.name || null,
      offer_type: form.offer_type,
      trigger_threshold: parseFloat(form.trigger_threshold) || 0,
      target_product_ids: form.target_product_ids || null,
      target_tags: form.target_tags || null,
      headline: form.headline || null,
      message: form.message || null,
      upsell_product_id: form.upsell_product_id || null,
      upsell_product_title: form.upsell_product_title || null,
      upsell_product_price: form.upsell_product_price ? parseFloat(form.upsell_product_price) : null,
      upsell_product_image: form.upsell_product_image || null,
      discount_code: form.discount_code || null,
      discount_percent: form.discount_percent ? parseFloat(form.discount_percent) : null,
      active: form.active,
    };

    try {
      if (editing) {
        await api.updateUpsellOffer(editing.id, payload);
      } else {
        await api.createUpsellOffer(payload);
      }
      closeForm();
      loadOffers();
    } catch (err) {
      alert('Error saving offer: ' + err.message);
    }
  }

  async function toggleActive(offer) {
    try {
      await api.updateUpsellOffer(offer.id, { active: !offer.active });
      loadOffers();
    } catch (e) {
      alert('Error updating offer: ' + e.message);
    }
  }

  async function deleteOffer(id) {
    if (!confirm('Delete this offer?')) return;
    try {
      await api.deleteUpsellOffer(id);
      loadOffers();
    } catch (e) {
      alert('Error deleting offer: ' + e.message);
    }
  }

  const previewPrice = form.offer_type === 'add_product'
    ? (form.upsell_product_price || '$24.99')
    : (form.discount_percent ? `${form.discount_percent}% OFF` : '10% OFF');

  const previewHeadline = form.headline || 'Wait! Add this to your order';
  const previewMessage = form.message || 'Get it delivered with your current order — just one click away.';

  if (!store) {
    return (
      <div className="empty-state">
        <h3 style={{fontSize:'18px',fontWeight:600,color:'#fafafa',marginBottom:'8px'}}>Connect Your Store</h3>
        <p style={{color:'#71717a'}}>Connect your Shopify store to create upsell offers.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <span>Loading offers...</span>
      </div>
    );
  }

  return (
    <div className="offer-builder">
      <div className="page-header">
        <div>
          <h1 className="page-title">Offers</h1>
          <p className="page-subtitle">Create and manage your post-purchase upsell offers</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Create New Offer
        </button>
      </div>

      {offers.length === 0 ? (
        <div className="card empty-offers">
          <div className="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
              <line x1="7" y1="7" x2="7.01" y2="7"/>
            </svg>
          </div>
          <h3>No offers yet</h3>
          <p>Create your first post-purchase upsell offer to start boosting revenue.</p>
          <button className="btn-primary" onClick={() => setShowForm(true)}>Create Your First Offer</button>
        </div>
      ) : (
        <div className="offers-table-wrap">
          <table className="offers-table">
            <thead>
              <tr>
                <th>Offer</th>
                <th>Type</th>
                <th>Trigger</th>
                <th>Acceptance Rate</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {offers.map(offer => {
                const rate = offer.total_triggered > 0 ? ((offer.total_accepted / offer.total_triggered) * 100).toFixed(1) : '—';
                return (
                  <tr key={offer.id} className={!offer.active ? 'inactive-row' : ''}>
                    <td>
                      <div className="offer-name-cell">
                        <span className="offer-name">{offer.name || offer.headline || `Offer #${offer.id}`}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`type-badge ${offer.offer_type}`}>
                        {offer.offer_type === 'add_product' ? 'Add to Order' : 'Discount Code'}
                      </span>
                    </td>
                    <td>
                      <span className="trigger-cell">
                        Min ${offer.trigger_threshold || 0}
                        {offer.target_product_ids && <span className="trigger-tag">Product</span>}
                        {offer.target_tags && <span className="trigger-tag">Tag</span>}
                      </span>
                    </td>
                    <td>
                      <span className="rate-cell">{rate !== '—' ? `${rate}%` : '—'}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${offer.active ? 'active' : 'paused'}`}>
                        {offer.active ? 'Active' : 'Paused'}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-action" onClick={() => startEdit(offer)}>Edit</button>
                        <button className="btn-action danger" onClick={() => deleteOffer(offer.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Offer Builder Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal builder-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Offer' : 'Create New Offer'}</h2>
              <button className="modal-close" onClick={closeForm}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="steps-nav">
              <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>
                <span>1</span>Trigger
              </div>
              <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>
                <span>2</span>Upsell Type
              </div>
              <div className={`step-dot ${step >= 3 ? 'active' : ''}`}>
                <span>3</span>Content
              </div>
            </div>

            <form onSubmit={handleSubmit} className="builder-form">
              {step === 1 && (
                <div className="step-content">
                  <h3 className="step-title">Set Offer Triggers</h3>
                  <p className="step-desc">Define when this offer should appear to customers.</p>

                  <div className="form-group">
                    <label className="form-label">Offer Name <span className="optional">(optional)</span></label>
                    <input
                      className="form-input"
                      type="text"
                      value={form.name}
                      onChange={e => setForm({...form, name: e.target.value})}
                      placeholder="e.g. Summer Flash Sale"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Minimum Order Amount ($)</label>
                    <input
                      className="form-input"
                      type="number"
                      step="0.01"
                      value={form.trigger_threshold}
                      onChange={e => setForm({...form, trigger_threshold: e.target.value})}
                      placeholder="50.00"
                    />
                    <span className="form-hint">Offer appears for orders at or above this value</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Target Product IDs <span className="optional">(optional)</span></label>
                    <input
                      className="form-input"
                      type="text"
                      value={form.target_product_ids}
                      onChange={e => setForm({...form, target_product_ids: e.target.value})}
                      placeholder="123,456,789"
                    />
                    <span className="form-hint">Leave blank to show on all orders above the minimum</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Target Tags <span className="optional">(optional)</span></label>
                    <input
                      className="form-input"
                      type="text"
                      value={form.target_tags}
                      onChange={e => setForm({...form, target_tags: e.target.value})}
                      placeholder="featured,bestseller"
                    />
                    <span className="form-hint">Comma-separated product tags</span>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="step-content">
                  <h3 className="step-title">Choose Upsell Type</h3>
                  <p className="step-desc">Select how you want to upsell your customer.</p>

                  <div className="type-selector">
                    <div
                      className={`type-option ${form.offer_type === 'add_product' ? 'selected' : ''}`}
                      onClick={() => setForm({...form, offer_type: 'add_product'})}
                    >
                      <div className="type-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                          <line x1="3" y1="6" x2="21" y2="6"/>
                          <path d="M16 10a4 4 0 01-8 0"/>
                        </svg>
                      </div>
                      <div className="type-info">
                        <div className="type-name">Add Product to Order</div>
                        <div className="type-desc">Offer a specific product with one-click add</div>
                      </div>
                      <div className="type-radio">
                        {form.offer_type === 'add_product' && <div className="radio-dot" />}
                      </div>
                    </div>

                    <div
                      className={`type-option ${form.offer_type === 'discount_code' ? 'selected' : ''}`}
                      onClick={() => setForm({...form, offer_type: 'discount_code'})}
                    >
                      <div className="type-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                          <line x1="12" y1="1" x2="12" y2="23"/>
                          <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                        </svg>
                      </div>
                      <div className="type-info">
                        <div className="type-name">Discount Code</div>
                        <div className="type-desc">Offer a percentage discount on their next purchase</div>
                      </div>
                      <div className="type-radio">
                        {form.offer_type === 'discount_code' && <div className="radio-dot" />}
                      </div>
                    </div>
                  </div>

                  {form.offer_type === 'add_product' && (
                    <div className="form-group" style={{marginTop: '20px'}}>
                      <label className="form-label">Upsell Product ID</label>
                      <input
                        className="form-input"
                        type="text"
                        value={form.upsell_product_id}
                        onChange={e => setForm({...form, upsell_product_id: e.target.value})}
                        placeholder="Shopify product ID"
                      />
                    </div>
                  )}

                  {form.offer_type === 'discount_code' && (
                    <>
                      <div className="form-group" style={{marginTop: '20px'}}>
                        <label className="form-label">Discount Code</label>
                        <input
                          className="form-input"
                          type="text"
                          value={form.discount_code}
                          onChange={e => setForm({...form, discount_code: e.target.value})}
                          placeholder="SAVE20"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Discount Percent (%)</label>
                        <input
                          className="form-input"
                          type="number"
                          value={form.discount_percent}
                          onChange={e => setForm({...form, discount_percent: e.target.value})}
                          placeholder="20"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="step-content">
                  <h3 className="step-title">Offer Content</h3>
                  <p className="step-desc">Write the message your customers will see.</p>

                  <div className="form-group">
                    <label className="form-label">Headline</label>
                    <input
                      className="form-input"
                      type="text"
                      value={form.headline}
                      onChange={e => setForm({...form, headline: e.target.value})}
                      placeholder="Wait! Add this to your order"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Message</label>
                    <textarea
                      className="form-input"
                      rows={3}
                      value={form.message}
                      onChange={e => setForm({...form, message: e.target.value})}
                      placeholder="Get it delivered with your current order — just one click away."
                    />
                  </div>

                  {form.offer_type === 'add_product' && (
                    <>
                      <div className="form-group">
                        <label className="form-label">Product Title</label>
                        <input
                          className="form-input"
                          type="text"
                          value={form.upsell_product_title}
                          onChange={e => setForm({...form, upsell_product_title: e.target.value})}
                          placeholder="Product display name"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Product Price ($)</label>
                        <input
                          className="form-input"
                          type="number"
                          step="0.01"
                          value={form.upsell_product_price}
                          onChange={e => setForm({...form, upsell_product_price: e.target.value})}
                          placeholder="24.99"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Product Image URL <span className="optional">(optional)</span></label>
                        <input
                          className="form-input"
                          type="text"
                          value={form.upsell_product_image}
                          onChange={e => setForm({...form, upsell_product_image: e.target.value})}
                          placeholder="https://cdn.shopify.com/..."
                        />
                      </div>
                    </>
                  )}

                  <div className="form-group">
                    <label className="toggle-label">
                      <span>Active (offer will show to customers)</span>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={form.active}
                          onChange={e => setForm({...form, active: e.target.checked})}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </label>
                  </div>

                  {/* Live Preview */}
                  <div className="live-preview-section">
                    <div className="preview-label">Live Preview</div>
                    <div className="live-preview">
                      <div className="preview-store-header">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                        Your Store
                      </div>
                      <div className="preview-body">
                        <div className="preview-thanks">Thanks for your order!</div>
                        <div className="preview-offer-card">
                          <div className="preview-product-img" />
                          <div className="preview-product-info">
                            <div className="preview-headline">{previewHeadline}</div>
                            <div className="preview-message">{previewMessage}</div>
                            <div className="preview-price">{previewPrice}</div>
                            <div className="preview-btn">Add to Order</div>
                            <div className="preview-skip">No thanks</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-actions">
                {step > 1 && (
                  <button type="button" className="btn-secondary" onClick={() => setStep(s => s - 1)}>
                    Back
                  </button>
                )}
                {step < 3 ? (
                  <button type="button" className="btn-primary" onClick={() => setStep(s => s + 1)}>
                    Continue
                  </button>
                ) : (
                  <button type="submit" className="btn-primary">
                    {editing ? 'Update Offer' : 'Create Offer'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .offer-builder { max-width: 1100px; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
        .page-title { font-size: 28px; font-weight: 700; color: #fafafa; margin: 0 0 4px; }
        .page-subtitle { color: #71717a; font-size: 14px; margin: 0; }
        .btn-primary { display: inline-flex; align-items: center; gap: 6px; background: #8b5cf6; color: #fff; border: none; padding: 10px 18px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
        .btn-primary:hover { background: #7c3aed; }
        .btn-secondary { background: #27272a; color: #e5e5e5; border: 1px solid #3f3f46; padding: 10px 18px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; }
        .btn-secondary:hover { background: #3f3f46; }

        .empty-offers { text-align: center; padding: 60px 40px; }
        .empty-icon { margin-bottom: 16px; color: #3f3f46; }
        .empty-offers h3 { font-size: 18px; font-weight: 600; color: #fafafa; margin-bottom: 8px; }
        .empty-offers p { color: #71717a; margin-bottom: 24px; font-size: 14px; }

        .offers-table-wrap { background: #18181b; border: 1px solid #27272a; border-radius: 12px; overflow: hidden; }
        .offers-table { width: 100%; border-collapse: collapse; }
        .offers-table th { text-align: left; padding: 14px 16px; font-size: 12px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #27272a; background: #1f1f28; }
        .offers-table td { padding: 14px 16px; font-size: 14px; border-bottom: 1px solid #27272a; vertical-align: middle; }
        .offers-table tr:last-child td { border-bottom: none; }
        .offers-table tr:hover td { background: #1f1f28; }
        .inactive-row td { opacity: 0.5; }
        .offer-name-cell { display: flex; align-items: center; gap: 8px; }
        .offer-name { font-weight: 500; color: #e5e5e5; }
        .type-badge { display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 12px; font-weight: 500; }
        .type-badge.add_product { background: rgba(139,92,246,0.15); color: #a78bfa; }
        .type-badge.discount_code { background: rgba(34,197,94,0.12); color: #22c55e; }
        .trigger-cell { display: flex; align-items: center; gap: 6px; }
        .trigger-tag { background: #27272a; color: #71717a; padding: 1px 6px; border-radius: 4px; font-size: 11px; }
        .rate-cell { font-weight: 600; color: #a78bfa; }
        .status-badge { display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 12px; font-weight: 500; }
        .status-badge.active { background: rgba(34,197,94,0.12); color: #22c55e; }
        .status-badge.paused { background: rgba(239,68,68,0.12); color: #ef4444; }
        .action-btns { display: flex; gap: 8px; }
        .btn-action { background: none; border: 1px solid #3f3f46; color: #a1a1aa; padding: 5px 10px; border-radius: 6px; font-size: 12px; cursor: pointer; transition: all 0.15s; }
        .btn-action:hover { background: #27272a; color: #e5e5e5; }
        .btn-action.danger { color: #ef4444; border-color: rgba(239,68,68,0.3); }
        .btn-action.danger:hover { background: rgba(239,68,68,0.1); }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; backdrop-filter: blur(4px); }
        .modal { background: #18181b; border: 1px solid #27272a; border-radius: 16px; width: 720px; max-width: 95vw; max-height: 90vh; overflow-y: auto; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #27272a; }
        .modal-header h2 { font-size: 18px; font-weight: 600; color: #fafafa; margin: 0; }
        .modal-close { background: none; border: none; color: #71717a; cursor: pointer; padding: 4px; border-radius: 6px; }
        .modal-close:hover { background: #27272a; color: #fafafa; }

        .steps-nav { display: flex; gap: 0; padding: 16px 24px; border-bottom: 1px solid #27272a; background: #1f1f28; }
        .step-dot { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; color: #52525b; flex: 1; }
        .step-dot span { width: 24px; height: 24px; border-radius: 50%; background: #27272a; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; }
        .step-dot.active { color: #a78bfa; }
        .step-dot.active span { background: #8b5cf6; color: #fff; }

        .builder-form { padding: 24px; }
        .step-content { min-height: 300px; }
        .step-title { font-size: 18px; font-weight: 600; color: #fafafa; margin: 0 0 4px; }
        .step-desc { color: #71717a; font-size: 14px; margin: 0 0 24px; }

        .form-group { margin-bottom: 20px; }
        .form-label { display: block; font-size: 13px; font-weight: 500; color: #a1a1aa; margin-bottom: 8px; }
        .optional { color: #52525b; font-weight: 400; }
        .form-input { width: 100%; padding: 10px 14px; background: #0f0f14; border: 1px solid #27272a; border-radius: 8px; color: #fafafa; font-size: 14px; transition: border-color 0.15s; }
        .form-input:focus { outline: none; border-color: #8b5cf6; }
        .form-input::placeholder { color: #3f3f46; }
        textarea.form-input { resize: vertical; min-height: 80px; }
        .form-hint { display: block; margin-top: 6px; font-size: 12px; color: #52525b; }

        .type-selector { display: flex; flex-direction: column; gap: 12px; }
        .type-option { display: flex; align-items: center; gap: 16px; padding: 16px; background: #0f0f14; border: 2px solid #27272a; border-radius: 10px; cursor: pointer; transition: all 0.15s; }
        .type-option:hover { border-color: #3f3f46; }
        .type-option.selected { border-color: #8b5cf6; background: rgba(139,92,246,0.08); }
        .type-icon { width: 44px; height: 44px; border-radius: 10px; background: #27272a; display: flex; align-items: center; justify-content: center; color: #a78bfa; flex-shrink: 0; }
        .type-option.selected .type-icon { background: rgba(139,92,246,0.2); }
        .type-info { flex: 1; }
        .type-name { font-size: 14px; font-weight: 600; color: #fafafa; margin-bottom: 2px; }
        .type-desc { font-size: 13px; color: #71717a; }
        .type-radio { width: 20px; height: 20px; border-radius: 50%; border: 2px solid #3f3f46; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .type-option.selected .type-radio { border-color: #8b5cf6; }
        .radio-dot { width: 10px; height: 10px; border-radius: 50%; background: #8b5cf6; }

        .toggle-label { display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
        .toggle-label span { font-size: 14px; color: #a1a1aa; }
        .toggle { position: relative; display: inline-block; width: 40px; height: 22px; }
        .toggle input { opacity: 0; width: 0; height: 0; }
        .toggle-slider { position: absolute; cursor: pointer; inset: 0; background: #3f3f46; border-radius: 22px; transition: 0.2s; }
        .toggle-slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.2s; }
        .toggle input:checked + .toggle-slider { background: #8b5cf6; }
        .toggle input:checked + .toggle-slider:before { transform: translateX(18px); }

        .live-preview-section { margin-top: 24px; padding-top: 24px; border-top: 1px solid #27272a; }
        .preview-label { font-size: 12px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
        .live-preview { background: #f5f5f5; border-radius: 10px; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .preview-store-header { background: #fff; padding: 10px 16px; display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #333; border-bottom: 1px solid #eee; }
        .preview-body { padding: 20px; background: #f8f8f8; }
        .preview-thanks { font-size: 16px; font-weight: 700; color: #333; margin-bottom: 12px; }
        .preview-offer-card { background: #fff; border-radius: 8px; padding: 16px; display: flex; gap: 14px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
        .preview-product-img { width: 64px; height: 64px; background: linear-gradient(135deg, #ddd, #eee); border-radius: 6px; flex-shrink: 0; }
        .preview-product-info { flex: 1; }
        .preview-headline { font-size: 15px; font-weight: 700; color: #333; margin-bottom: 4px; }
        .preview-message { font-size: 13px; color: #666; margin-bottom: 8px; line-height: 1.4; }
        .preview-price { font-size: 20px; font-weight: 700; color: #8b5cf6; margin-bottom: 10px; }
        .preview-btn { background: #8b5cf6; color: #fff; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: 600; text-align: center; margin-bottom: 6px; cursor: pointer; }
        .preview-skip { font-size: 12px; color: #999; text-align: center; cursor: pointer; }

        .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #27272a; }
        .loading-state { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 60px; color: #71717a; }
        .spinner { width: 20px; height: 20px; border: 2px solid #27272a; border-top-color: #8b5cf6; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

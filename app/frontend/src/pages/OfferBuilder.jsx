import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/index.js';

export default function OfferBuilder({ store, appConfig }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [step, setStep] = useState(1);
  const [copied, setCopied] = useState(false);
  const [showABModal, setShowABModal] = useState(false);
  const [abVariantA, setAbVariantA] = useState(null);
  const [abSplit, setAbSplit] = useState(50);
  const stepContentRef = useRef(null);
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
    // Warranty fields
    warranty_price: '',
    warranty_description: '',
    warranty_covered: '',
    // Fallback
    fallback_offer_id: '',
  });

  useEffect(() => {
    if (!store) { setLoading(false); return; }
    loadOffers();
  }, [store]);

  // Scroll step content into view when step changes
  useEffect(() => {
    if (stepContentRef.current) {
      stepContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [step]);

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
      warranty_price: offer.warranty_price || '',
      warranty_description: offer.warranty_description || '',
      warranty_covered: offer.warranty_covered || '',
      fallback_offer_id: offer.fallback_offer_id || '',
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
      warranty_price: '', warranty_description: '', warranty_covered: '', fallback_offer_id: '',
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
      warranty_price: form.warranty_price ? parseFloat(form.warranty_price) : null,
      warranty_description: form.warranty_description || null,
      warranty_covered: form.warranty_covered || null,
      fallback_offer_id: form.fallback_offer_id || null,
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

  // Create A/B Test — clones current offer as variant B
  function openABTestModal(offer) {
    setAbVariantA(offer);
    setAbSplit(50);
    setShowABModal(true);
  }

  async function createABTest() {
    try {
      const variantB = await api.cloneOfferForABTest(abVariantA.id, {
        traffic_split_b: abSplit,
        name: `${abVariantA.name || abVariantA.headline} — Variant B`,
      });
      closeForm();
      loadOffers();
    } catch (err) {
      alert('Error creating A/B test: ' + err.message);
    }
    setShowABModal(false);
  }

  // Copy preview link
  async function copyPreviewLink(offerId) {
    const previewUrl = `${window.location.origin}${window.location.pathname}#/upsell-preview/${offerId}`;
    try {
      await navigator.clipboard.writeText(previewUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = previewUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const previewPrice = form.offer_type === 'add_product'
    ? (form.upsell_product_price ? `+$${parseFloat(form.upsell_product_price).toFixed(2)}` : '+$24.99')
    : form.offer_type === 'warranty'
    ? (form.warranty_price ? `+$${parseFloat(form.warranty_price).toFixed(2)}/order` : '+$9.99/order')
    : (form.discount_percent ? `${form.discount_percent}% OFF` : '10% OFF');

  const previewHeadline = form.headline || 'Wait! Add this to your order';
  const previewMessage = form.message || 'Get it delivered with your current order — just one click away.';

  // Live preview type badge
  const previewTypeLabel = {
    'add_product': 'Add to Order',
    'discount_code': 'Discount Code',
    'warranty': 'Warranty/Protection',
  }[form.offer_type] || 'Add to Order';

  // Get offers for fallback dropdown (exclude current editing offer)
  const fallbackOptions = offers.filter(o => o.id !== editing?.id);

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
                        {offer.ab_test_id && <span className="ab-indicator">A/B</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`type-badge ${offer.offer_type}`}>
                        {offer.offer_type === 'add_product' ? 'Add to Order' : offer.offer_type === 'warranty' ? 'Warranty' : 'Discount Code'}
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
                        <button className="btn-action" onClick={() => copyPreviewLink(offer.id)} title="Copy preview link">
                          {copied ? '✓ Copied' : '🔗'}
                        </button>
                        {!offer.ab_test_id && (
                          <button className="btn-action ab-btn" onClick={() => openABTestModal(offer)} title="Create A/B test">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
                            </svg>
                          </button>
                        )}
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

      {/* A/B Test Creation Modal */}
      {showABModal && abVariantA && (
        <div className="modal-overlay" onClick={() => setShowABModal(false)}>
          <div className="modal ab-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create A/B Test</h2>
              <button className="modal-close" onClick={() => setShowABModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="modal-body">
              <p className="ab-desc">Clone "<strong>{abVariantA.name || abVariantA.headline}</strong>" as Variant B and split your traffic to test performance.</p>
              
              <div className="ab-preview-cards">
                <div className="ab-card variant-a">
                  <div className="ab-card-label">Variant A</div>
                  <div className="ab-card-name">{abVariantA.name || abVariantA.headline || 'Current Offer'}</div>
                  <div className="ab-card-percent">{100 - abSplit}%</div>
                  <div className="ab-card-traffic">of traffic</div>
                </div>
                <div className="ab-arrow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
                <div className="ab-card variant-b">
                  <div className="ab-card-label">Variant B</div>
                  <div className="ab-card-name">{abVariantA.name || abVariantA.headline || 'Offer'} — Copy</div>
                  <div className="ab-card-percent">{abSplit}%</div>
                  <div className="ab-card-traffic">of traffic</div>
                </div>
              </div>

              <div className="ab-slider-section">
                <label className="form-label">Traffic Split</label>
                <div className="ab-slider-row">
                  <span className="ab-split-label">A: {100 - abSplit}%</span>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    step="5"
                    value={abSplit}
                    onChange={e => setAbSplit(parseInt(e.target.value))}
                    className="ab-slider"
                  />
                  <span className="ab-split-label">B: {abSplit}%</span>
                </div>
                <div className="ab-slider-presets">
                  <button className={`preset-btn ${abSplit === 50 ? 'active' : ''}`} onClick={() => setAbSplit(50)}>50/50</button>
                  <button className={`preset-btn ${abSplit === 60 ? 'active' : ''}`} onClick={() => setAbSplit(60)}>60/40</button>
                  <button className={`preset-btn ${abSplit === 70 ? 'active' : ''}`} onClick={() => setAbSplit(70)}>70/30</button>
                  <button className={`preset-btn ${abSplit === 80 ? 'active' : ''}`} onClick={() => setAbSplit(80)}>80/20</button>
                </div>
              </div>

              <div className="ab-info">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <span>Variant B will be a copy of Variant A. You can edit it after creation to change the offer content.</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowABModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={createABTest}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
                </svg>
                Start A/B Test
              </button>
            </div>
          </div>
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
                <div className="step-content" ref={stepContentRef}>
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

                  {/* Fallback offer toggle */}
                  <div className="form-group fallback-group">
                    <label className="form-label">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                      If declined, show this offer <span className="optional">(optional)</span>
                    </label>
                    <select
                      className="form-input"
                      value={form.fallback_offer_id}
                      onChange={e => setForm({...form, fallback_offer_id: e.target.value})}
                    >
                      <option value="">No fallback (show discount code)</option>
                      {fallbackOptions.map(o => (
                        <option key={o.id} value={o.id}>{o.name || o.headline || `Offer #${o.id}`}</option>
                      ))}
                    </select>
                    <span className="form-hint">When customer declines, show a different offer instead of discount code</span>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="step-content" ref={stepContentRef}>
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
                        <div className="type-desc">One-click add — highest conversion (10-18%)</div>
                      </div>
                      <div className="type-radio">
                        {form.offer_type === 'add_product' && <div className="radio-dot" />}
                      </div>
                    </div>

                    <div
                      className={`type-option ${form.offer_type === 'warranty' ? 'selected' : ''}`}
                      onClick={() => setForm({...form, offer_type: 'warranty'})}
                    >
                      <div className="type-icon warranty-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                      </div>
                      <div className="type-info">
                        <div className="type-name">Warranty / Protection</div>
                        <div className="type-desc">Hidden gem — 15-25% acceptance, high margin</div>
                      </div>
                      <div className="type-radio">
                        {form.offer_type === 'warranty' && <div className="radio-dot" />}
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
                        <div className="type-desc">For next purchase — 5-10% conversion</div>
                      </div>
                      <div className="type-radio">
                        {form.offer_type === 'discount_code' && <div className="radio-dot" />}
                      </div>
                    </div>
                  </div>

                  {/* Product fields for add_product type */}
                  {form.offer_type === 'add_product' && (
                    <div className="type-specific-fields">
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
                    </div>
                  )}

                  {/* Warranty fields */}
                  {form.offer_type === 'warranty' && (
                    <div className="type-specific-fields warranty-fields">
                      <div className="form-group" style={{marginTop: '20px'}}>
                        <label className="form-label">Warranty Price ($)</label>
                        <input
                          className="form-input"
                          type="number"
                          step="0.01"
                          value={form.warranty_price}
                          onChange={e => setForm({...form, warranty_price: e.target.value})}
                          placeholder="9.99"
                        />
                        <span className="form-hint">Per-order charge for warranty coverage</span>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Warranty Description</label>
                        <input
                          className="form-input"
                          type="text"
                          value={form.warranty_description}
                          onChange={e => setForm({...form, warranty_description: e.target.value})}
                          placeholder="Extended protection for your purchase"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">What's Covered</label>
                        <textarea
                          className="form-input"
                          rows={2}
                          value={form.warranty_covered}
                          onChange={e => setForm({...form, warranty_covered: e.target.value})}
                          placeholder="Manufacturing defects, malfunctions, accidental damage"
                        />
                      </div>
                    </div>
                  )}

                  {/* Discount code fields */}
                  {form.offer_type === 'discount_code' && (
                    <div className="type-specific-fields">
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
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="step-content" ref={stepContentRef}>
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

                  {/* Preview link */}
                  {editing && (
                    <div className="form-group preview-link-group">
                      <label className="form-label">Preview Link</label>
                      <div className="preview-link-row">
                        <input
                          className="form-input preview-link-input"
                          type="text"
                          readOnly
                          value={`${window.location.origin}${window.location.pathname}#/upsell-preview/${editing.id}`}
                        />
                        <button
                          type="button"
                          className="btn-copy"
                          onClick={() => copyPreviewLink(editing.id)}
                        >
                          {copied ? '✓ Copied' : 'Copy Link'}
                        </button>
                      </div>
                      <span className="form-hint">Share this link to preview how the offer looks to customers</span>
                    </div>
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
                        <span className="preview-offer-type-badge">{previewTypeLabel}</span>
                      </div>
                      <div className="preview-body">
                        <div className="preview-offer-badges">
                          <span className="preview-badge one-time">One-time offer</span>
                          <span className="preview-badge social">127 people added this week</span>
                        </div>
                        <div className="preview-thanks">Thanks for your order!</div>
                        <div className="preview-offer-card">
                          {form.offer_type === 'warranty' ? (
                            <div className="preview-warranty">
                              <div className="preview-warranty-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
                                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                </svg>
                              </div>
                              <div className="preview-product-info">
                                <div className="preview-headline">{previewHeadline}</div>
                                <div className="preview-message">{previewMessage}</div>
                                <div className="preview-price">{previewPrice}</div>
                              </div>
                            </div>
                          ) : form.offer_type === 'discount_code' ? (
                            <div className="preview-discount">
                              <div className="preview-discount-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
                                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                                </svg>
                              </div>
                              <div className="preview-product-info">
                                <div className="preview-headline">{previewHeadline}</div>
                                <div className="preview-message">{previewMessage}</div>
                                <div className="preview-discount-code">{form.discount_code || 'SAVE15'} — {form.discount_percent || 15}% OFF</div>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="preview-product-img" />
                              <div className="preview-product-info">
                                <div className="preview-headline">{previewHeadline}</div>
                                <div className="preview-message">{previewMessage}</div>
                                <div className="preview-price">{previewPrice}</div>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="preview-btn-green">Add to Order</div>
                        <div className="preview-skip">No thanks, maybe later</div>
                        <div className="preview-trust">
                          <span>Secure checkout</span> • <span>Powered by Shopify</span> • <span>No extra shipping</span>
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
        .ab-indicator { background: rgba(139,92,246,0.2); color: #a78bfa; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; }
        .type-badge { display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 12px; font-weight: 500; }
        .type-badge.add_product { background: rgba(139,92,246,0.15); color: #a78bfa; }
        .type-badge.warranty { background: rgba(34,197,94,0.15); color: #22c55e; }
        .type-badge.discount_code { background: rgba(234,179,8,0.15); color: #eab308; }
        .trigger-cell { display: flex; align-items: center; gap: 6px; }
        .trigger-tag { background: #27272a; color: #71717a; padding: 1px 6px; border-radius: 4px; font-size: 11px; }
        .rate-cell { font-weight: 600; color: #a78bfa; }
        .status-badge { display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 12px; font-weight: 500; }
        .status-badge.active { background: rgba(34,197,94,0.12); color: #22c55e; }
        .status-badge.paused { background: rgba(239,68,68,0.12); color: #ef4444; }
        .action-btns { display: flex; gap: 8px; }
        .btn-action { background: none; border: 1px solid #3f3f46; color: #a1a1aa; padding: 5px 10px; border-radius: 6px; font-size: 12px; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; gap: 4px; }
        .btn-action:hover { background: #27272a; color: #e5e5e5; }
        .btn-action.danger { color: #ef4444; border-color: rgba(239,68,68,0.3); }
        .btn-action.danger:hover { background: rgba(239,68,68,0.1); }
        .btn-action.ab-btn { color: #a78bfa; border-color: rgba(139,92,246,0.3); }
        .btn-action.ab-btn:hover { background: rgba(139,92,246,0.1); }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; backdrop-filter: blur(4px); }
        .modal { background: #18181b; border: 1px solid #27272a; border-radius: 16px; width: 720px; max-width: 95vw; max-height: 90vh; overflow-y: auto; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #27272a; }
        .modal-header h2 { font-size: 18px; font-weight: 600; color: #fafafa; margin: 0; }
        .modal-close { background: none; border: none; color: #71717a; cursor: pointer; padding: 4px; border-radius: 6px; }
        .modal-close:hover { background: #27272a; color: #fafafa; }
        .modal-body { padding: 24px; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 20px 24px; border-top: 1px solid #27272a; }

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
        .form-label { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; color: #a1a1aa; margin-bottom: 8px; }
        .optional { color: #52525b; font-weight: 400; }
        .form-input { width: 100%; padding: 10px 14px; background: #0f0f14; border: 1px solid #27272a; border-radius: 8px; color: #fafafa; font-size: 14px; transition: border-color 0.15s; }
        .form-input:focus { outline: none; border-color: #8b5cf6; }
        .form-input::placeholder { color: #3f3f46; }
        textarea.form-input { resize: vertical; min-height: 80px; }
        .form-hint { display: block; margin-top: 6px; font-size: 12px; color: #52525b; }

        .fallback-group { background: rgba(139,92,246,0.05); border: 1px solid rgba(139,92,246,0.15); border-radius: 8px; padding: 16px; margin-bottom: 20px; }

        .type-selector { display: flex; flex-direction: column; gap: 12px; }
        .type-option { display: flex; align-items: center; gap: 16px; padding: 16px; background: #0f0f14; border: 2px solid #27272a; border-radius: 10px; cursor: pointer; transition: all 0.15s; }
        .type-option:hover { border-color: #3f3f46; }
        .type-option.selected { border-color: #8b5cf6; background: rgba(139,92,246,0.08); }
        .type-icon { width: 44px; height: 44px; border-radius: 10px; background: #27272a; display: flex; align-items: center; justify-content: center; color: #a78bfa; flex-shrink: 0; }
        .type-icon.warranty-icon { background: rgba(34,197,94,0.12); color: #22c55e; }
        .type-option.selected .type-icon { background: rgba(139,92,246,0.2); }
        .type-info { flex: 1; }
        .type-name { font-size: 14px; font-weight: 600; color: #fafafa; margin-bottom: 2px; }
        .type-desc { font-size: 13px; color: #71717a; }
        .type-radio { width: 20px; height: 20px; border-radius: 50%; border: 2px solid #3f3f46; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .type-option.selected .type-radio { border-color: #8b5cf6; }
        .radio-dot { width: 10px; height: 10px; border-radius: 50%; background: #8b5cf6; }

        .type-specific-fields { background: #0f0f14; border: 1px solid #27272a; border-radius: 8px; padding: 16px; }
        .warranty-fields { border-color: rgba(34,197,94,0.2); background: rgba(34,197,94,0.03); }

        .toggle-label { display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
        .toggle-label span { font-size: 14px; color: #a1a1aa; }
        .toggle { position: relative; display: inline-block; width: 40px; height: 22px; }
        .toggle input { opacity: 0; width: 0; height: 0; }
        .toggle-slider { position: absolute; cursor: pointer; inset: 0; background: #3f3f46; border-radius: 22px; transition: 0.2s; }
        .toggle-slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.2s; }
        .toggle input:checked + .toggle-slider { background: #8b5cf6; }
        .toggle input:checked + .toggle-slider:before { transform: translateX(18px); }

        /* Preview link */
        .preview-link-group { background: rgba(139,92,246,0.05); border: 1px solid rgba(139,92,246,0.15); border-radius: 8px; padding: 16px; }
        .preview-link-row { display: flex; gap: 8px; }
        .preview-link-input { flex: 1; font-size: 12px; color: #71717a; }
        .btn-copy { background: #27272a; border: 1px solid #3f3f46; color: #e5e5e5; padding: 8px 14px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; white-space: nowrap; }
        .btn-copy:hover { background: #3f3f46; }

        /* Live Preview */
        .live-preview-section { margin-top: 24px; padding-top: 24px; border-top: 1px solid #27272a; }
        .preview-label { font-size: 12px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
        .live-preview { background: #f5f5f5; border-radius: 10px; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .preview-store-header { background: #fff; padding: 10px 16px; display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #333; border-bottom: 1px solid #eee; }
        .preview-offer-type-badge { margin-left: auto; background: #f3f4f6; color: #666; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; }
        .preview-body { padding: 16px; background: #f8f8f8; }
        .preview-offer-badges { display: flex; gap: 6px; margin-bottom: 12px; }
        .preview-badge { font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; }
        .preview-badge.one-time { background: #fef3c7; color: #92400e; }
        .preview-badge.social { background: #f0fdf4; color: #166534; }
        .preview-thanks { font-size: 15px; font-weight: 700; color: #333; margin-bottom: 12px; }
        .preview-offer-card { background: #fff; border-radius: 8px; padding: 14px; display: flex; gap: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); margin-bottom: 12px; }
        .preview-product-img { width: 60px; height: 60px; background: linear-gradient(135deg, #e8d5ff, #d0b8ff); border-radius: 6px; flex-shrink: 0; }
        .preview-product-info { flex: 1; }
        .preview-headline { font-size: 14px; font-weight: 700; color: #333; margin-bottom: 4px; }
        .preview-message { font-size: 12px; color: #666; margin-bottom: 6px; line-height: 1.4; }
        .preview-price { font-size: 18px; font-weight: 700; color: #22c55e; }
        .preview-warranty { display: flex; gap: 12px; }
        .preview-warranty-icon { width: 48px; height: 48px; background: #dcfce7; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #22c55e; flex-shrink: 0; }
        .preview-discount { display: flex; gap: 12px; }
        .preview-discount-icon { width: 48px; height: 48px; background: rgba(139,92,246,0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #8b5cf6; flex-shrink: 0; }
        .preview-discount-code { font-size: 13px; font-weight: 700; color: #8b5cf6; background: #f5f3ff; padding: 4px 10px; border-radius: 4px; display: inline-block; margin-top: 4px; }
        .preview-btn-green { background: #22c55e; color: #fff; padding: 10px 20px; border-radius: 6px; font-size: 13px; font-weight: 600; text-align: center; margin-bottom: 8px; }
        .preview-skip { font-size: 12px; color: #999; text-align: center; margin-bottom: 10px; }
        .preview-trust { display: flex; justify-content: center; gap: 6px; font-size: 10px; color: #9ca3af; }

        .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #27272a; }
        .loading-state { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 60px; color: #71717a; }
        .spinner { width: 20px; height: 20px; border: 2px solid #27272a; border-top-color: #8b5cf6; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* A/B Test Modal */
        .ab-modal { width: 560px; }
        .ab-desc { color: #a1a1aa; font-size: 14px; margin: 0 0 24px; line-height: 1.5; }
        .ab-desc strong { color: #e5e5e5; }
        .ab-preview-cards { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 24px; }
        .ab-card { background: #0f0f14; border: 2px solid #27272a; border-radius: 10px; padding: 16px; text-align: center; width: 140px; }
        .ab-card.variant-a { border-color: rgba(139,92,246,0.4); }
        .ab-card.variant-b { border-color: rgba(34,197,94,0.4); }
        .ab-card-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #71717a; margin-bottom: 4px; }
        .ab-card.variant-a .ab-card-label { color: #a78bfa; }
        .ab-card.variant-b .ab-card-label { color: #22c55e; }
        .ab-card-name { font-size: 12px; font-weight: 500; color: #e5e5e5; margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ab-card-percent { font-size: 28px; font-weight: 700; color: #fafafa; }
        .ab-card-traffic { font-size: 11px; color: #71717a; }
        .ab-arrow { color: #52525b; }
        .ab-slider-section { margin-bottom: 20px; }
        .ab-slider-row { display: flex; align-items: center; gap: 12px; margin-top: 8px; }
        .ab-split-label { font-size: 13px; font-weight: 600; color: #a1a1aa; width: 40px; text-align: center; }
        .ab-slider { flex: 1; height: 6px; -webkit-appearance: none; appearance: none; background: #27272a; border-radius: 3px; cursor: pointer; }
        .ab-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; background: #8b5cf6; border-radius: 50%; cursor: pointer; }
        .ab-slider-presets { display: flex; gap: 8px; margin-top: 12px; }
        .preset-btn { background: #27272a; border: 1px solid #3f3f46; color: #a1a1aa; padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.15s; }
        .preset-btn:hover { background: #3f3f46; }
        .preset-btn.active { background: rgba(139,92,246,0.2); border-color: #8b5cf6; color: #a78bfa; }
        .ab-info { display: flex; gap: 8px; align-items: flex-start; background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.2); border-radius: 8px; padding: 12px; font-size: 13px; color: #71717a; }
        .ab-info svg { flex-shrink: 0; margin-top: 2px; color: #a78bfa; }
      `}</style>
    </div>
  );
}

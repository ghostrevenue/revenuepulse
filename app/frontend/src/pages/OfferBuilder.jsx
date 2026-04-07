import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/index.js';
import TargetingSelector from '../components/TargetingSelector.jsx';
import VisualPreview from '../components/VisualPreview.jsx';

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

  // Active tab: 'active' | 'archived'
  const [activeTab, setActiveTab] = useState('active');

  // Offer status filter
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const [form, setForm] = useState({
    name: '',
    status: 'draft',
    // Step 1 — Trigger
    trigger_threshold: '50',
    trigger_threshold_max: '',
    target_products_include: [],
    target_collections_include: [],
    target_tags_include: [],
    target_products_exclude: [],
    target_collections_exclude: [],
    target_tags_exclude: [],
    first_time_customers_only: false,
    // Step 3 — Content (no separate type step)
    offer_type: 'add_product',
    headline: 'Wait! Add this to your order',
    message: 'Get it delivered with your current order — just one click away.',
    // Product upsell
    upsell_product_id: '',
    upsell_product_title: '',
    upsell_product_price: '',
    upsell_product_image: '',
    // Discount code
    discount_code: '',
    discount_amount: '',
    discount_percent: '',
    // Warranty
    warranty_price: '',
    warranty_description: '',
    warranty_covered: '',
    // Urgency
    one_time_offer: true,
    confirmation_only: true,
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
      status: offer.status || (offer.active ? 'published' : 'draft'),
      trigger_threshold: String(offer.trigger_threshold || '50'),
      trigger_threshold_max: String(offer.trigger_threshold_max || ''),
      target_products_include: offer.target_products_include || [],
      target_collections_include: offer.target_collections_include || [],
      target_tags_include: offer.target_tags_include || [],
      target_products_exclude: offer.target_products_exclude || [],
      target_collections_exclude: offer.target_collections_exclude || [],
      target_tags_exclude: offer.target_tags_exclude || [],
      first_time_customers_only: !!offer.first_time_customers_only,
      offer_type: offer.offer_type || 'add_product',
      headline: offer.headline || 'Wait! Add this to your order',
      message: offer.message || 'Get it delivered with your current order — just one click away.',
      upsell_product_id: offer.upsell_product_id || '',
      upsell_product_title: offer.upsell_product_title || '',
      upsell_product_price: offer.upsell_product_price || '',
      upsell_product_image: offer.upsell_product_image || '',
      discount_code: offer.discount_code || '',
      discount_amount: offer.discount_amount || '',
      discount_percent: offer.discount_percent ? String(offer.discount_percent) : '',
      warranty_price: offer.warranty_price || '',
      warranty_description: offer.warranty_description || '',
      warranty_covered: offer.warranty_covered || '',
      one_time_offer: offer.one_time_offer !== false,
      confirmation_only: offer.confirmation_only !== false,
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
      name: '', status: 'draft', trigger_threshold: '50', trigger_threshold_max: '',
      target_products_include: [], target_collections_include: [], target_tags_include: [],
      target_products_exclude: [], target_collections_exclude: [], target_tags_exclude: [],
      first_time_customers_only: false,
      offer_type: 'add_product', headline: 'Wait! Add this to your order',
      message: 'Get it delivered with your current order — just one click away.',
      upsell_product_id: '', upsell_product_title: '', upsell_product_price: '', upsell_product_image: '',
      discount_code: '', discount_amount: '', discount_percent: '',
      warranty_price: '', warranty_description: '', warranty_covered: '',
      one_time_offer: true, confirmation_only: true, fallback_offer_id: '',
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!store) return;

    const payload = {
      name: form.name || null,
      status: form.status,
      offer_type: form.offer_type,
      trigger_threshold: parseFloat(form.trigger_threshold) || 0,
      trigger_threshold_max: form.trigger_threshold_max ? parseFloat(form.trigger_threshold_max) : null,
      target_products_include: form.target_products_include.length ? form.target_products_include.map(p => p.id) : null,
      target_collections_include: form.target_collections_include.length ? form.target_collections_include.map(c => c.id) : null,
      target_tags_include: form.target_tags_include.length ? form.target_tags_include : null,
      target_products_exclude: form.target_products_exclude.length ? form.target_products_exclude.map(p => p.id) : null,
      target_collections_exclude: form.target_collections_exclude.length ? form.target_collections_exclude.map(c => c.id) : null,
      target_tags_exclude: form.target_tags_exclude.length ? form.target_tags_exclude : null,
      first_time_customers_only: form.first_time_customers_only,
      headline: form.headline || null,
      message: form.message || null,
      upsell_product_id: form.upsell_product_id || null,
      upsell_product_title: form.upsell_product_title || null,
      upsell_product_price: form.upsell_product_price ? parseFloat(form.upsell_product_price) : null,
      upsell_product_image: form.upsell_product_image || null,
      discount_code: form.discount_code || null,
      discount_amount: form.discount_amount ? parseFloat(form.discount_amount) : null,
      discount_percent: form.discount_percent ? parseFloat(form.discount_percent) : null,
      warranty_price: form.warranty_price ? parseFloat(form.warranty_price) : null,
      warranty_description: form.warranty_description || null,
      warranty_covered: form.warranty_covered || null,
      one_time_offer: form.one_time_offer,
      confirmation_only: form.confirmation_only,
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

  async function togglePublish(offer) {
    try {
      const newStatus = offer.status === 'published' ? 'draft' : 'published';
      await api.updateUpsellOffer(offer.id, { status: newStatus });
      loadOffers();
    } catch (e) {
      alert('Error updating offer: ' + e.message);
    }
  }

  async function archiveOffer(id) {
    try {
      await api.updateUpsellOffer(id, { status: 'archived' });
      loadOffers();
    } catch (e) {
      alert('Error archiving offer: ' + e.message);
    }
  }

  async function hardDeleteOffer(id) {
    if (!confirm('Permanently delete this offer? This cannot be undone.')) return;
    try {
      await api.hardDeleteUpsellOffer(id);
      loadOffers();
    } catch (e) {
      alert('Error deleting offer: ' + e.message);
    }
  }

  function openABTestModal(offer) {
    setAbVariantA(offer);
    setAbSplit(50);
    setShowABModal(true);
  }

  async function createABTest() {
    try {
      await api.cloneOfferForABTest(abVariantA.id, {
        traffic_split_b: abSplit,
        name: `${abVariantA.name || abVariantA.headline} — Variant B`,
      });
      setShowABModal(false);
      loadOffers();
    } catch (err) {
      alert('Error creating A/B test: ' + err.message);
    }
  }

  async function copyPreviewLink(offerId) {
    const previewUrl = `${window.location.origin}${window.location.pathname}#/upsell-preview/${offerId}`;
    try {
      await navigator.clipboard.writeText(previewUrl);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = previewUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Filter offers by tab
  const visibleOffers = offers.filter(o => {
    if (activeTab === 'archived') return o.status === 'archived';
    return o.status !== 'archived';
  }).filter(o => {
    if (statusFilter !== 'all') return o.status === statusFilter;
    return true;
  }).filter(o => {
    if (typeFilter !== 'all') return o.offer_type === typeFilter;
    return true;
  });

  // Fallback options
  const fallbackOptions = offers.filter(o => o.id !== editing?.id && o.status !== 'archived');

  function getStatusBadge(status) {
    const map = {
      draft: { label: 'Draft', class: 'draft' },
      published: { label: 'Published', class: 'published' },
      archived: { label: 'Archived', class: 'archived' },
    };
    const s = map[status] || map.draft;
    return <span className={`status-badge ${s.class}`}>{s.label}</span>;
  }

  function getTypeLabel(type) {
    return { add_product: 'Add to Order', discount_code: 'Discount', warranty: 'Warranty' }[type] || type;
  }

  function getTriggerSummary(offer) {
    const parts = [];
    if (offer.trigger_threshold) parts.push(`$${offer.trigger_threshold}+`);
    if (offer.target_products_include?.length) parts.push(`${offer.target_products_include.length} products`);
    if (offer.target_collections_include?.length) parts.push(`${offer.target_collections_include.length} collections`);
    if (offer.target_tags_include?.length) parts.push(`${offer.target_tags_include.length} tags`);
    if (offer.first_time_customers_only) parts.push('First-time');
    return parts.length ? parts.join(', ') : 'All orders';
  }

  const previewForm = form;

  if (!store) {
    return (
      <div className="empty-state">
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fafafa', marginBottom: '8px' }}>Connect Your Store</h3>
        <p style={{ color: '#71717a' }}>Connect your Shopify store to create upsell offers.</p>
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Create New Offer
        </button>
      </div>

      {/* Tabs */}
      <div className="offers-tabs">
        <button className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>
          Active Offers
        </button>
        <button className={`tab-btn ${activeTab === 'archived' ? 'active' : ''}`} onClick={() => setActiveTab('archived')}>
          Archived
        </button>
      </div>

      {visibleOffers.length === 0 ? (
        <div className="card empty-offers">
          <div className="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
          </div>
          <h3>{activeTab === 'archived' ? 'No archived offers' : 'No offers yet'}</h3>
          <p>{activeTab === 'archived' ? 'Archived offers will appear here.' : 'Create your first post-purchase upsell offer to start boosting revenue.'}</p>
          {activeTab !== 'archived' && (
            <button className="btn-primary" onClick={() => setShowForm(true)}>Create Your First Offer</button>
          )}
        </div>
      ) : (
        <div className="offers-grid">
          {visibleOffers.map(offer => {
            const rate = offer.total_triggered > 0 ? ((offer.total_accepted / offer.total_triggered) * 100).toFixed(1) : '0.0';
            const revenue = offer.revenue_lifted || 0;
            return (
              <div key={offer.id} className="offer-card">
                <div className="offer-card-header">
                  <div className="offer-card-name">{offer.name || offer.headline || `Offer #${offer.id}`}</div>
                  {getStatusBadge(offer.status)}
                </div>

                <div className="offer-card-meta">
                  <span className={`type-badge ${offer.offer_type}`}>{getTypeLabel(offer.offer_type)}</span>
                  <span className="trigger-summary">{getTriggerSummary(offer)}</span>
                </div>

                <div className="offer-card-stats">
                  <div className="offer-stat">
                    <div className="offer-stat-label">Accept Rate</div>
                    <div className="offer-stat-value">{rate}%</div>
                    <div className="offer-progress-bar">
                      <div className="offer-progress-fill" style={{ width: `${rate}%` }} />
                    </div>
                  </div>
                  <div className="offer-stat">
                    <div className="offer-stat-label">Revenue</div>
                    <div className="offer-stat-value revenue">${revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                </div>

                <div className="offer-card-actions">
                  <button className="btn-icon" title="Edit" onClick={() => startEdit(offer)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button className="btn-icon" title={offer.status === 'published' ? 'Unpublish' : 'Publish'}
                    onClick={() => togglePublish(offer)}>
                    {offer.status === 'published' ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                  {offer.status !== 'archived' ? (
                    <button className="btn-icon" title="Archive" onClick={() => archiveOffer(offer.id)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" />
                      </svg>
                    </button>
                  ) : (
                    <button className="btn-icon danger" title="Delete permanently" onClick={() => hardDeleteOffer(offer.id)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                  <button className="btn-icon" title="Copy preview link" onClick={() => copyPreviewLink(offer.id)}>
                    {copied ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" width="14" height="14">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                      </svg>
                    )}
                  </button>
                  {!offer.ab_test_id && (
                    <button className="btn-icon ab-btn" title="A/B Test" onClick={() => openABTestModal(offer)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* A/B Test Modal */}
      {showABModal && abVariantA && (
        <div className="modal-overlay" onClick={() => setShowABModal(false)}>
          <div className="modal ab-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create A/B Test</h2>
              <button className="modal-close" onClick={() => setShowABModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
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
                <div className="ab-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><polyline points="9 18 15 12 9 6" /></svg></div>
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
                  <input type="range" min="10" max="90" step="5" value={abSplit}
                    onChange={e => setAbSplit(parseInt(e.target.value))} className="ab-slider" />
                  <span className="ab-split-label">B: {abSplit}%</span>
                </div>
                <div className="ab-slider-presets">
                  {[50, 60, 70, 80].map(v => (
                    <button key={v} className={`preset-btn ${abSplit === v ? 'active' : ''}`} onClick={() => setAbSplit(v)}>{v / 100 === 0.5 ? '50/50' : `${v}/${100 - v}`}</button>
                  ))}
                </div>
              </div>
              <div className="ab-info">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span>Variant B will be a copy of Variant A. You can edit it after creation to change the offer content.</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowABModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={createABTest}>Start A/B Test</button>
            </div>
          </div>
        </div>
      )}

      {/* Offer Builder Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal builder-modal wide-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Offer' : 'Create New Offer'}</h2>
              <div className="modal-header-actions">
                {editing && editing.status === 'draft' && (
                  <button className="btn-publish" onClick={() => { setForm(f => ({ ...f, status: 'published' })); }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                    Publish
                  </button>
                )}
                {editing && editing.status === 'published' && (
                  <button className="btn-unpublish" onClick={() => { setForm(f => ({ ...f, status: 'draft' })); }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                    Unpublish
                  </button>
                )}
                <button className="modal-close" onClick={closeForm}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
            </div>

            {/* Step nav — now 2 steps: Trigger+Targeting and Content */}
            <div className="steps-nav">
              <div className={`step-dot ${step >= 1 ? 'active' : ''}`}><span>1</span>Trigger & Targeting</div>
              <div className={`step-dot ${step >= 2 ? 'active' : ''}`}><span>2</span>Content</div>
            </div>

            <form onSubmit={handleSubmit} className="builder-form">
              {step === 1 && (
                <div className="step-content" ref={stepContentRef}>
                  <h3 className="step-title">Set Offer Triggers & Targeting</h3>
                  <p className="step-desc">Define when this offer appears and which customers see it.</p>

                  <div className="form-group">
                    <label className="form-label">Offer Name <span className="optional">(optional)</span></label>
                    <input className="form-input" type="text" value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Summer Flash Sale" />
                  </div>

                  {/* Order amount */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Minimum Order Amount ($)</label>
                      <input className="form-input" type="number" step="0.01" value={form.trigger_threshold}
                        onChange={e => setForm({ ...form, trigger_threshold: e.target.value })} placeholder="50.00" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Maximum Order Amount ($) <span className="optional">(optional)</span></label>
                      <input className="form-input" type="number" step="0.01" value={form.trigger_threshold_max}
                        onChange={e => setForm({ ...form, trigger_threshold_max: e.target.value })} placeholder="No max" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="toggle-label">
                      <span>First-time customers only</span>
                      <label className="toggle">
                        <input type="checkbox" checked={form.first_time_customers_only}
                          onChange={e => setForm({ ...form, first_time_customers_only: e.target.checked })} />
                        <span className="toggle-slider" />
                      </label>
                    </label>
                  </div>

                  {/* Targeting — Include */}
                  <div className="targeting-section">
                    <div className="targeting-section-header">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" width="14" height="14">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 8 12 12 14 14" />
                      </svg>
                      <span style={{ color: '#8b5cf6', fontSize: '13px', fontWeight: 600 }}>Include Targeting</span>
                    </div>
                    <TargetingSelector mode="include" field="products" label="Target Products"
                      values={form.target_products_include}
                      onChange={vals => setForm({ ...form, target_products_include: vals })} />
                    <TargetingSelector mode="include" field="collections" label="Target Collections"
                      values={form.target_collections_include}
                      onChange={vals => setForm({ ...form, target_collections_include: vals })} />
                    <TargetingSelector mode="include" field="tags" label="Target Tags"
                      values={form.target_tags_include}
                      onChange={vals => setForm({ ...form, target_tags_include: vals })} />
                  </div>

                  {/* Targeting — Exclude */}
                  <div className="targeting-section" style={{ marginTop: '8px' }}>
                    <div className="targeting-section-header">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" width="14" height="14">
                        <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                      </svg>
                      <span style={{ color: '#ef4444', fontSize: '13px', fontWeight: 600 }}>Exclude Targeting</span>
                    </div>
                    <TargetingSelector mode="exclude" field="products" label="Exclude Products"
                      values={form.target_products_exclude}
                      onChange={vals => setForm({ ...form, target_products_exclude: vals })} />
                    <TargetingSelector mode="exclude" field="collections" label="Exclude Collections"
                      values={form.target_collections_exclude}
                      onChange={vals => setForm({ ...form, target_collections_exclude: vals })} />
                    <TargetingSelector mode="exclude" field="tags" label="Exclude Tags"
                      values={form.target_tags_exclude}
                      onChange={vals => setForm({ ...form, target_tags_exclude: vals })} />
                  </div>

                  {/* Fallback */}
                  <div className="form-group fallback-group">
                    <label className="form-label">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                      If declined, show this offer <span className="optional">(optional)</span>
                    </label>
                    <select className="form-input" value={form.fallback_offer_id}
                      onChange={e => setForm({ ...form, fallback_offer_id: e.target.value })}>
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
                  <div className="content-editor">
                    {/* Left — Form fields */}
                    <div className="content-editor-left">
                      <h3 className="step-title">Offer Content</h3>
                      <p className="step-desc">Write the message and configure the upsell type.</p>

                      {/* Upsell type compact selector */}
                      <div className="upsell-type-selector">
                        {['add_product', 'discount_code', 'warranty'].map(type => (
                          <div key={type}
                            className={`upsell-type-btn ${form.offer_type === type ? 'active' : ''}`}
                            onClick={() => setForm({ ...form, offer_type: type })}>
                            {type === 'add_product' && (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
                              </svg>
                            )}
                            {type === 'warranty' && (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                              </svg>
                            )}
                            {type === 'discount_code' && (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                              </svg>
                            )}
                            <span>{type === 'add_product' ? 'Add to Order' : type === 'warranty' ? 'Warranty' : 'Discount Code'}</span>
                          </div>
                        ))}
                      </div>

                      {/* Headline & Message */}
                      <div className="form-group">
                        <label className="form-label">Headline</label>
                        <input className="form-input" type="text" value={form.headline}
                          onChange={e => setForm({ ...form, headline: e.target.value })}
                          placeholder="Wait! Add this to your order" />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Message / Description</label>
                        <textarea className="form-input" rows={3} value={form.message}
                          onChange={e => setForm({ ...form, message: e.target.value })}
                          placeholder="Get it delivered with your current order — just one click away." />
                      </div>

                      {/* Type-specific fields */}
                      {form.offer_type === 'add_product' && (
                        <div className="type-fields">
                          <div className="form-group">
                            <label className="form-label">Product Search</label>
                            <input className="form-input" type="text" value={form.upsell_product_title}
                              onChange={e => setForm({ ...form, upsell_product_title: e.target.value })}
                              placeholder="Search Shopify products..." />
                          </div>
                          <div className="form-row">
                            <div className="form-group">
                              <label className="form-label">Price ($)</label>
                              <input className="form-input" type="number" step="0.01" value={form.upsell_product_price}
                                onChange={e => setForm({ ...form, upsell_product_price: e.target.value })} placeholder="24.99" />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Product Image URL <span className="optional">(optional)</span></label>
                              <input className="form-input" type="text" value={form.upsell_product_image}
                                onChange={e => setForm({ ...form, upsell_product_image: e.target.value })}
                                placeholder="https://cdn.shopify.com/..." />
                            </div>
                          </div>
                        </div>
                      )}

                      {form.offer_type === 'discount_code' && (
                        <div className="type-fields">
                          <div className="form-row">
                            <div className="form-group">
                              <label className="form-label">Discount Code</label>
                              <input className="form-input" type="text" value={form.discount_code}
                                onChange={e => setForm({ ...form, discount_code: e.target.value })}
                                placeholder="SAVE20" />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Discount Value</label>
                              <input className="form-input" type="number" value={form.discount_percent}
                                onChange={e => setForm({ ...form, discount_percent: e.target.value })}
                                placeholder="20" />
                              <span className="form-hint">Enter % or $ amount</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {form.offer_type === 'warranty' && (
                        <div className="type-fields warranty-fields">
                          <div className="form-row">
                            <div className="form-group">
                              <label className="form-label">Warranty Price ($)</label>
                              <input className="form-input" type="number" step="0.01" value={form.warranty_price}
                                onChange={e => setForm({ ...form, warranty_price: e.target.value })} placeholder="9.99" />
                            </div>
                          </div>
                          <div className="form-group">
                            <label className="form-label">Description</label>
                            <input className="form-input" type="text" value={form.warranty_description}
                              onChange={e => setForm({ ...form, warranty_description: e.target.value })}
                              placeholder="Extended protection plan" />
                          </div>
                          <div className="form-group">
                            <label className="form-label">What's Covered</label>
                            <textarea className="form-input" rows={2} value={form.warranty_covered}
                              onChange={e => setForm({ ...form, warranty_covered: e.target.value })}
                              placeholder="Manufacturing defects, malfunctions, accidental damage" />
                          </div>
                        </div>
                      )}

                      {/* Urgency options */}
                      <div className="urgency-options">
                        <div className="urgency-title">Urgency Options</div>
                        <label className="toggle-label">
                          <span>One-time offer badge</span>
                          <label className="toggle">
                            <input type="checkbox" checked={form.one_time_offer}
                              onChange={e => setForm({ ...form, one_time_offer: e.target.checked })} />
                            <span className="toggle-slider" />
                          </label>
                        </label>
                        <label className="toggle-label">
                          <span>Show on confirmation page only</span>
                          <label className="toggle">
                            <input type="checkbox" checked={form.confirmation_only}
                              onChange={e => setForm({ ...form, confirmation_only: e.target.checked })} />
                            <span className="toggle-slider" />
                          </label>
                        </label>
                      </div>

                      {/* Preview link */}
                      {editing && (
                        <div className="form-group preview-link-group">
                          <label className="form-label">Preview Link</label>
                          <div className="preview-link-row">
                            <input className="form-input preview-link-input" type="text" readOnly
                              value={`${window.location.origin}${window.location.pathname}#/upsell-preview/${editing.id}`} />
                            <button type="button" className="btn-copy" onClick={() => copyPreviewLink(editing.id)}>
                              {copied ? '✓ Copied' : 'Copy Link'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right — Live Visual Preview */}
                    <div className="content-editor-right">
                      <VisualPreview form={previewForm} />
                    </div>
                  </div>
                </div>
              )}

              <div className="form-actions">
                {step > 1 && (
                  <button type="button" className="btn-secondary" onClick={() => setStep(s => s - 1)}>Back</button>
                )}
                {step < 2 ? (
                  <button type="button" className="btn-primary" onClick={() => setStep(s => s + 1)}>Continue</button>
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
        .btn-publish { display: inline-flex; align-items: center; gap: 6px; background: #22c55e; color: #fff; border: none; padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
        .btn-unpublish { display: inline-flex; align-items: center; gap: 6px; background: #27272a; color: #e5e5e5; border: 1px solid #3f3f46; padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; }

        .offers-tabs { display: flex; gap: 4px; margin-bottom: 24px; border-bottom: 1px solid #27272a; padding-bottom: 0; }
        .tab-btn { background: none; border: none; color: #71717a; padding: 10px 16px; font-size: 14px; font-weight: 500; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all 0.15s; }
        .tab-btn:hover { color: #e5e5e5; }
        .tab-btn.active { color: #a78bfa; border-bottom-color: #8b5cf6; }

        .offers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
        .offer-card { background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 20px; transition: border-color 0.15s; }
        .offer-card:hover { border-color: #3f3f46; }
        .offer-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; gap: 8px; }
        .offer-card-name { font-size: 15px; font-weight: 600; color: #fafafa; line-height: 1.3; }
        .status-badge { display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; flex-shrink: 0; }
        .status-badge.draft { background: rgba(107,114,128,0.2); color: #9ca3af; }
        .status-badge.published { background: rgba(34,197,94,0.15); color: #22c55e; }
        .status-badge.archived { background: rgba(239,68,68,0.15); color: #ef4444; }
        .offer-card-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
        .trigger-summary { font-size: 12px; color: #71717a; }
        .type-badge { display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 500; }
        .type-badge.add_product { background: rgba(139,92,246,0.15); color: #a78bfa; }
        .type-badge.warranty { background: rgba(34,197,94,0.15); color: #22c55e; }
        .type-badge.discount_code { background: rgba(234,179,8,0.15); color: #eab308; }
        .offer-card-stats { display: flex; gap: 20px; margin-bottom: 14px; }
        .offer-stat { flex: 1; }
        .offer-stat-label { font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .offer-stat-value { font-size: 18px; font-weight: 700; color: #fafafa; }
        .offer-stat-value.revenue { color: #22c55e; }
        .offer-progress-bar { height: 3px; background: #27272a; border-radius: 2px; margin-top: 6px; overflow: hidden; }
        .offer-progress-fill { height: 100%; background: linear-gradient(90deg, #8b5cf6, #a78bfa); border-radius: 2px; transition: width 0.3s; }
        .offer-card-actions { display: flex; gap: 6px; padding-top: 12px; border-top: 1px solid #27272a; }
        .btn-icon { background: none; border: 1px solid #3f3f46; color: #71717a; width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; }
        .btn-icon:hover { background: #27272a; color: #e5e5e5; }
        .btn-icon.danger:hover { background: rgba(239,68,68,0.1); color: #ef4444; border-color: rgba(239,68,68,0.3); }
        .btn-icon.ab-btn { color: #a78bfa; border-color: rgba(139,92,246,0.3); }
        .btn-icon.ab-btn:hover { background: rgba(139,92,246,0.1); }

        .empty-offers { text-align: center; padding: 60px 40px; }
        .empty-icon { margin-bottom: 16px; color: #3f3f46; }
        .empty-offers h3 { font-size: 18px; font-weight: 600; color: #fafafa; margin-bottom: 8px; }
        .empty-offers p { color: #71717a; margin-bottom: 24px; font-size: 14px; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; backdrop-filter: blur(4px); }
        .modal { background: #18181b; border: 1px solid #27272a; border-radius: 16px; max-height: 90vh; overflow-y: auto; }
        .wide-modal { width: 900px; max-width: 95vw; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #27272a; }
        .modal-header h2 { font-size: 18px; font-weight: 600; color: #fafafa; margin: 0; }
        .modal-header-actions { display: flex; align-items: center; gap: 10px; }
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
        .step-content { min-height: 400px; }
        .step-title { font-size: 18px; font-weight: 600; color: #fafafa; margin: 0 0 4px; }
        .step-desc { color: #71717a; font-size: 14px; margin: 0 0 24px; }

        .form-group { margin-bottom: 20px; }
        .form-row { display: flex; gap: 16px; }
        .form-row .form-group { flex: 1; }
        .form-label { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; color: #a1a1aa; margin-bottom: 8px; }
        .optional { color: #52525b; font-weight: 400; }
        .form-input { width: 100%; padding: 10px 14px; background: #0f0f14; border: 1px solid #27272a; border-radius: 8px; color: #fafafa; font-size: 14px; transition: border-color 0.15s; }
        .form-input:focus { outline: none; border-color: #8b5cf6; }
        .form-input::placeholder { color: #3f3f46; }
        textarea.form-input { resize: vertical; min-height: 80px; }
        .form-hint { display: block; margin-top: 6px; font-size: 12px; color: #52525b; }

        .targeting-section { background: rgba(255,255,255,0.02); border: 1px solid #27272a; border-radius: 10px; padding: 16px; margin-bottom: 16px; }
        .targeting-section-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }

        .fallback-group { background: rgba(139,92,246,0.05); border: 1px solid rgba(139,92,246,0.15); border-radius: 8px; padding: 16px; }

        .toggle-label { display: flex; justify-content: space-between; align-items: center; cursor: pointer; padding: 4px 0; }
        .toggle-label span { font-size: 14px; color: #a1a1aa; }
        .toggle { position: relative; display: inline-block; width: 40px; height: 22px; }
        .toggle input { opacity: 0; width: 0; height: 0; }
        .toggle-slider { position: absolute; cursor: pointer; inset: 0; background: #3f3f46; border-radius: 22px; transition: 0.2s; }
        .toggle-slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.2s; }
        .toggle input:checked + .toggle-slider { background: #8b5cf6; }
        .toggle input:checked + .toggle-slider:before { transform: translateX(18px); }

        /* Content editor layout */
        .content-editor { display: flex; gap: 24px; }
        .content-editor-left { flex: 1; min-width: 0; }
        .content-editor-right { width: 300px; flex-shrink: 0; }

        .upsell-type-selector { display: flex; gap: 8px; margin-bottom: 24px; }
        .upsell-type-btn { display: flex; align-items: center; gap: 6px; background: #0f0f14; border: 2px solid #27272a; padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 500; color: #71717a; cursor: pointer; transition: all 0.15s; }
        .upsell-type-btn:hover { border-color: #3f3f46; color: #e5e5e5; }
        .upsell-type-btn.active { border-color: #8b5cf6; background: rgba(139,92,246,0.1); color: #a78bfa; }

        .type-fields { background: #0f0f14; border: 1px solid #27272a; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
        .warranty-fields { border-color: rgba(34,197,94,0.2); background: rgba(34,197,94,0.03); }

        .urgency-options { background: rgba(139,92,246,0.05); border: 1px solid rgba(139,92,246,0.15); border-radius: 8px; padding: 16px; margin-bottom: 20px; }
        .urgency-title { font-size: 12px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }

        .preview-link-group { background: rgba(139,92,246,0.05); border: 1px solid rgba(139,92,246,0.15); border-radius: 8px; padding: 16px; }
        .preview-link-row { display: flex; gap: 8px; }
        .preview-link-input { flex: 1; font-size: 12px; color: #71717a; }
        .btn-copy { background: #27272a; border: 1px solid #3f3f46; color: #e5e5e5; padding: 8px 14px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; white-space: nowrap; }
        .btn-copy:hover { background: #3f3f46; }

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
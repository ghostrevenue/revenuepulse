import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api/index.js';
import TargetingSelector from '../components/TargetingSelector.jsx';
import OfferEditor from '../components/OfferEditor.jsx';

const MAX_ITEMS = 6;

function generateId() {
  return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function makeItem(overrides = {}) {
  return {
    id: generateId(),
    offer_type: 'add_product',
    headline: 'Wait! Add this to your order',
    message: 'Get it delivered with your current order — just one click away.',
    product_id: '',
    product_title: '',
    product_price: '',
    product_image: '',
    variant_id: '',
    discount_code: '',
    discount_percent: '',
    warranty_price: '',
    warranty_description: '',
    warranty_covered: '',
    badge_text: 'One-time offer',
    badge_color: '#8b5cf6',
    show_badge: true,
    show_timer: false,
    timer_minutes: 15,
    button_text: '',
    ...overrides,
  };
}

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
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Editor state
  const [editingItem, setEditingItem] = useState(null); // { item, pathType, isMainContent }
  const [editingMainContent, setEditingMainContent] = useState(false); // editing headline/message/timer

  // Stable refs for callbacks (prevents stale closure / immediate re-render issues)
  const editingItemRef = useRef(editingItem);
  const formRef = useRef(null); // initialized to null; updated after form state is declared

  useEffect(() => {
    editingItemRef.current = editingItem;
  }, [editingItem]);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  // Form state — 4-step structure
  const [form, setForm] = useState(getDefaultForm());

  function getDefaultForm() {
    return {
      name: '',
      status: 'draft',
      // Step 1 — Trigger & Targeting
      trigger_threshold: '',
      trigger_threshold_max: '',
      target_products_include: [],
      target_collections_include: [],
      target_tags_include: [],
      target_products_exclude: [],
      target_collections_exclude: [],
      target_tags_exclude: [],
      first_time_customers_only: false,
      // Step 2 — Accept Path (upsells)
      accept_path_items: [],
      // Step 3 — Decline Path (downsells)
      decline_path_items: [],
      // Legacy / single offer (backwards compat)
      offer_type: 'add_product',
      headline: 'Wait! Add this to your order',
      message: 'Get it delivered with your current order — just one click away.',
      upsell_product_id: '',
      upsell_product_title: '',
      upsell_product_price: '',
      upsell_product_image: '',
      discount_code: '',
      discount_amount: '',
      discount_percent: '',
      warranty_price: '',
      warranty_description: '',
      warranty_covered: '',
      one_time_offer: true,
      confirmation_only: true,
      fallback_offer_id: '',
    };
  }

  useEffect(() => {
    if (!store) { setLoading(false); return; }
    loadOffers();
  }, [store]);

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

    // Parse accept/decline path items
    let acceptItems = [];
    let declineItems = [];
    try {
      if (offer.accept_path_items) {
        const parsed = typeof offer.accept_path_items === 'string'
          ? JSON.parse(offer.accept_path_items)
          : offer.accept_path_items;
        acceptItems = Array.isArray(parsed) ? parsed : [];
      }
      if (offer.decline_path_items) {
        const parsed = typeof offer.decline_path_items === 'string'
          ? JSON.parse(offer.decline_path_items)
          : offer.decline_path_items;
        declineItems = Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {}

    setForm({
      name: offer.name || '',
      status: offer.status || (offer.active ? 'published' : 'draft'),
      trigger_threshold: String(offer.trigger_min_amount || offer.trigger_threshold || '50'),
      trigger_threshold_max: String(offer.trigger_max_amount || ''),
      target_products_include: parseIdArray(offer.include_product_ids),
      target_collections_include: parseIdArray(offer.include_collection_ids),
      target_tags_include: parseTagArray(offer.include_tags),
      target_products_exclude: parseIdArray(offer.exclude_product_ids),
      target_collections_exclude: parseIdArray(offer.exclude_collection_ids),
      target_tags_exclude: parseTagArray(offer.exclude_tags),
      first_time_customers_only: !!offer.first_time_customer || !!offer.target_first_time_customer,
      // New multi-item paths
      accept_path_items: acceptItems,
      decline_path_items: declineItems,
      // Legacy
      offer_type: offer.offer_type || 'add_product',
      headline: offer.headline || 'Wait! Add this to your order',
      message: offer.message || 'Get it delivered with your current order — just one click away.',
      upsell_product_id: offer.upsell_product_id || '',
      upsell_product_title: offer.product_title || offer.upsell_product_title || '',
      upsell_product_price: offer.upsell_product_price || '',
      upsell_product_image: offer.upsell_product_image || '',
      discount_code: offer.discount_code || offer.upsell_discount_code || '',
      discount_amount: offer.discount_amount || '',
      discount_percent: offer.discount_percent ? String(offer.discount_percent) : '',
      warranty_price: offer.warranty_price || '',
      warranty_description: offer.warranty_description || '',
      warranty_covered: offer.warranty_covered || '',
      one_time_offer: offer.one_time_offer !== false,
      confirmation_only: offer.confirmation_only !== false,
      fallback_offer_id: offer.fallback_for_offer_id || '',
    });
    setStep(1);
    setShowForm(true);
  }

  function parseIdArray(field) {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    try {
      const parsed = JSON.parse(field);
      return Array.isArray(parsed) ? parsed.map(id => ({ id: String(id) })) : [];
    } catch {
      return [];
    }
  }

  function parseTagArray(field) {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    try {
      const parsed = JSON.parse(field);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setStep(1);
    setForm(getDefaultForm());
    setEditingItem(null);
    setEditingMainContent(false);
  }

  // ── Accept Path item management ────────────────────────────────────────────
  function addAcceptItem() {
    if (form.accept_path_items.length >= MAX_ITEMS) return;
    setForm(f => ({
      ...f,
      accept_path_items: [...f.accept_path_items, makeItem({ offer_type: 'add_product' })],
    }));
  }

  function updateAcceptItem(id, updated) {
    setForm(f => ({
      ...f,
      accept_path_items: f.accept_path_items.map(item => item.id === id ? { ...item, ...updated } : item),
    }));
  }

  function removeAcceptItem(id) {
    setForm(f => ({
      ...f,
      accept_path_items: f.accept_path_items.filter(item => item.id !== id),
    }));
  }

  const openEditAcceptItem = useCallback((itemId) => {
    const item = formRef.current.accept_path_items.find(i => i.id === itemId);
    if (item) setEditingItem({ item, pathType: 'upsell', isMainContent: false });
  }, []); // No deps — uses formRef

  const openEditMainContent = useCallback(() => {
    // Create a content item from main form fields that OfferEditor can edit
    const contentItem = {
      id: '__main_content__',
      headline: formRef.current.headline,
      message: formRef.current.message,
      badge_text: formRef.current.badge_text,
      badge_color: formRef.current.badge_color,
      show_badge: formRef.current.show_badge,
      show_timer: formRef.current.show_timer,
      timer_minutes: formRef.current.timer_minutes,
      button_text: formRef.current.button_text || '',
      offer_type: 'content', // Mark as content type
    };
    setEditingItem({ item: contentItem, pathType: 'content', isMainContent: true });
  }, []);

  // ── Decline Path item management ────────────────────────────────────────────
  function addDeclineItem() {
    if (form.decline_path_items.length >= MAX_ITEMS) return;
    setForm(f => ({
      ...f,
      decline_path_items: [...f.decline_path_items, makeItem({ offer_type: 'add_product' })],
    }));
  }

  function updateDeclineItem(id, updated) {
    setForm(f => ({
      ...f,
      decline_path_items: f.decline_path_items.map(item => item.id === id ? { ...item, ...updated } : item),
    }));
  }

  function removeDeclineItem(id) {
    setForm(f => ({
      ...f,
      decline_path_items: f.decline_path_items.filter(item => item.id !== id),
    }));
  }

  const openEditDeclineItem = useCallback((itemId) => {
    const item = formRef.current.decline_path_items.find(i => i.id === itemId);
    if (item) setEditingItem({ item, pathType: 'downsell', isMainContent: false });
  }, []); // No deps — uses formRef

  const handleEditorSave = useCallback((updatedItem) => {
    const current = editingItemRef.current;
    if (!current) return;
    if (current.isMainContent) {
      // Saving main offer content (headline, message, badge, timer, etc.)
      setForm(f => ({ ...f, ...updatedItem }));
      setEditingMainContent(false);
    } else if (current.pathType === 'upsell') {
      updateAcceptItem(current.item.id, updatedItem);
    } else {
      updateDeclineItem(current.item.id, updatedItem);
    }
    setEditingItem(null);
  }, []); // No deps — uses refs

  async function handleSubmit(e) {
    e.preventDefault();
    if (!store) return;

    // Determine offer type from first accept item or legacy
    const primaryType = form.accept_path_items.length > 0
      ? form.accept_path_items[0].offer_type
      : form.offer_type;

    const payload = {
      name: form.name || null,
      status: form.status,
      offer_type: primaryType,
      trigger_min_amount: parseFloat(form.trigger_threshold) || 0,
      trigger_max_amount: form.trigger_threshold_max ? parseFloat(form.trigger_threshold_max) : null,
      target_products_include: form.target_products_include.length ? form.target_products_include.map(p => p.id || p) : null,
      target_collections_include: form.target_collections_include.length ? form.target_collections_include.map(c => c.id || c) : null,
      target_tags_include: form.target_tags_include.length ? form.target_tags_include : null,
      target_products_exclude: form.target_products_exclude.length ? form.target_products_exclude.map(p => p.id || p) : null,
      target_collections_exclude: form.target_collections_exclude.length ? form.target_collections_exclude.map(c => c.id || c) : null,
      target_tags_exclude: form.target_tags_exclude.length ? form.target_tags_exclude : null,
      target_first_time_customer: form.first_time_customers_only,
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
      fallback_for_offer_id: form.fallback_offer_id || null,
      // New multi-item flow paths
      accept_path_items: form.accept_path_items.length ? form.accept_path_items : null,
      decline_path_items: form.decline_path_items.length ? form.decline_path_items : null,
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
    return { add_product: 'Add to Order', discount_code: 'Discount', discount: 'Discount', warranty: 'Warranty' }[type] || type;
  }

  function getTriggerSummary(offer) {
    const parts = [];
    if (offer.trigger_min_amount || offer.trigger_threshold) parts.push(`$${offer.trigger_min_amount || offer.trigger_threshold}+`);
    if (offer.include_product_ids) {
      try { const arr = JSON.parse(offer.include_product_ids); if (arr.length) parts.push(`${arr.length} products`); } catch {}
    }
    if (offer.include_collection_ids) {
      try { const arr = JSON.parse(offer.include_collection_ids); if (arr.length) parts.push(`${arr.length} collections`); } catch {}
    }
    if (offer.include_tags) {
      try { const arr = JSON.parse(offer.include_tags); if (arr.length) parts.push(`${arr.length} tags`); } catch {}
    }
    if (offer.target_first_time_customer) parts.push('First-time');
    return parts.length ? parts.join(', ') : 'All orders';
  }

  function getPathCount(offer) {
    let acceptCount = 0, declineCount = 0;
    try {
      if (offer.accept_path_items) {
        const arr = typeof offer.accept_path_items === 'string' ? JSON.parse(offer.accept_path_items) : offer.accept_path_items;
        acceptCount = Array.isArray(arr) ? arr.length : 0;
      }
      if (offer.decline_path_items) {
        const arr = typeof offer.decline_path_items === 'string' ? JSON.parse(offer.decline_path_items) : offer.decline_path_items;
        declineCount = Array.isArray(arr) ? arr.length : 0;
      }
    } catch {}
    return { acceptCount, declineCount };
  }

  // ── Step labels ─────────────────────────────────────────────────────────────
  const STEP_LABELS = [
    { n: 1, label: 'Trigger & Targeting' },
    { n: 2, label: 'Accept Path' },
    { n: 3, label: 'Decline Path' },
    { n: 4, label: 'Review' },
  ];

  // ── Render helpers ───────────────────────────────────────────────────────────
  function renderItemCard(item, pathType, onEdit, onRemove) {
    const isUpsell = pathType === 'upsell';
    const color = isUpsell ? '#8b5cf6' : '#ef4444';
    const bg = isUpsell ? 'rgba(139,92,246,0.08)' : 'rgba(239,68,68,0.08)';
    const typeLabel = { add_product: 'Add to Order', discount: 'Discount', warranty: 'Warranty' }[item.offer_type] || item.offer_type;
    const price = item.offer_type === 'add_product'
      ? (item.product_price ? `+$${parseFloat(item.product_price).toFixed(2)}` : '')
      : item.offer_type === 'warranty'
      ? (item.warranty_price ? `+$${parseFloat(item.warranty_price)}` : '')
      : item.discount_percent ? `${item.discount_percent}% OFF` : '';

    return (
      <div key={item.id} className="flow-item-card" style={{ borderColor: color + '40', background: bg }}>
        <div className="flow-item-card-header">
          <span className="flow-item-type" style={{ color }}>{typeLabel}</span>
          <div className="flow-item-actions">
            <button className="btn-icon" title="Edit" onClick={() => onEdit(item.id)}
              style={{ borderColor: color + '40', color }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button className="btn-icon danger" title="Remove" onClick={() => onRemove(item.id)}
              style={{ color: '#ef4444' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="flow-item-card-body">
          {item.product_image && (
            <img src={item.product_image} alt="" className="flow-item-img" />
          )}
          <div className="flow-item-info">
            <div className="flow-item-headline">{item.headline || 'No headline'}</div>
            <div className="flow-item-message">{item.message || ''}</div>
            {price && <div className="flow-item-price" style={{ color }}>{price}</div>}
          </div>
        </div>
        {item.show_timer && (
          <div className="flow-item-timer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            {item.timer_minutes}:00
          </div>
        )}
      </div>
    );
  }

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
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Offers</h1>
          <p className="page-subtitle">Create and manage your post-purchase upsell offers</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditing(null); setForm(getDefaultForm()); setShowForm(true); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Create New Offer
        </button>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div className="offers-tabs">
        <button className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>Active Offers</button>
        <button className={`tab-btn ${activeTab === 'archived' ? 'active' : ''}`} onClick={() => setActiveTab('archived')}>Archived</button>
      </div>

      {/* ── Offer Grid ───────────────────────────────────────────────── */}
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
            const { acceptCount, declineCount } = getPathCount(offer);
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
                {(acceptCount > 0 || declineCount > 0) && (
                  <div className="offer-card-paths">
                    {acceptCount > 0 && <span className="path-count upsell">{acceptCount} upsell{acceptCount !== 1 ? 's' : ''}</span>}
                    {declineCount > 0 && <span className="path-count downsell">{declineCount} downsell{declineCount !== 1 ? 's' : ''}</span>}
                  </div>
                )}
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
                  <button className="btn-icon" title={offer.status === 'published' ? 'Unpublish' : 'Publish'} onClick={() => togglePublish(offer)}>
                    {offer.status === 'published' ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
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
                      <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" width="14" height="14"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                      </svg>
                    )}
                  </button>
                  {!offer.ab_variant_group_id && (
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

      {/* ── A/B Test Modal ───────────────────────────────────────────── */}
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

      {/* ── Offer Builder Modal (n8n-style Flow Builder) ── */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal builder-modal super-wide-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Offer' : 'Create New Offer'}</h2>
              <div className="modal-header-actions">
                {editing && editing.status === 'draft' && (
                  <button className="btn-publish" onClick={() => setForm(f => ({ ...f, status: 'published' }))}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                    Publish
                  </button>
                )}
                {editing && editing.status === 'published' && (
                  <button className="btn-unpublish" onClick={() => setForm(f => ({ ...f, status: 'draft' }))}>
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

            {/* SVG marker definitions for arrowheads */}
            <svg style={{ position: 'absolute', width: 0, height: 0 }}>
              <defs>
                <marker id="flowArrowPurple" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L9,3 z" fill="#8b5cf6" />
                </marker>
                <marker id="flowArrowGreen" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L9,3 z" fill="#22c55e" />
                </marker>
                <marker id="flowArrowRed" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L9,3 z" fill="#ef4444" />
                </marker>
                <marker id="flowArrowGray" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L9,3 z" fill="#71717a" />
                </marker>
              </defs>
            </svg>

            {/* Flow Builder Canvas */}
            <div className="flow-builder-canvas">
              {/* ── Trigger Node ── */}
              <div className="flow-builder-section">
                <div className="flow-builder-row">
                  <div className="flow-node-wrapper trigger-node-wrapper">
                    <div className="flow-node-card-full trigger-node-card" onClick={() => {}}>
                      <div className="flow-node-accent trigger-accent"></div>
                      <div className="flow-node-content">
                        <div className="flow-node-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                          </svg>
                        </div>
                        <div className="flow-node-info">
                          <div className="flow-node-title">Trigger</div>
                          <div className="flow-node-subtitle">
                            {form.trigger_threshold ? `$${form.trigger_threshold}+ order` : 'All orders'}
                            {form.first_time_customers_only && ' · First-time customers'}
                          </div>
                          <div className="flow-node-meta">
                            {(form.target_products_include.length > 0 || form.target_collections_include.length > 0 || form.target_tags_include.length > 0) && (
                              <span className="flow-meta-tag">
                                {form.target_products_include.length > 0 && `${form.target_products_include.length} products`}
                                {form.target_collections_include.length > 0 && ` · ${form.target_collections_include.length} collections`}
                                {form.target_tags_include.length > 0 && ` · ${form.target_tags_include.length} tags`}
                              </span>
                            )}
                            {form.target_products_exclude.length > 0 && (
                              <span className="flow-meta-tag exclude">Excludes some products</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Connector from Trigger to Content */}
                <div className="flow-connector flow-connector-center">
                  <svg height="32" width="20">
                    <path d="M10 0 L10 32" stroke="#8b5cf6" strokeWidth="2" markerEnd="url(#flowArrowPurple)" fill="none" />
                  </svg>
                </div>
              </div>

              {/* ── Content/Offer Node ── */}
              <div className="flow-builder-section">
                <div className="flow-builder-row">
                  <div className="flow-node-wrapper content-node-wrapper">
                    <div className="flow-node-card-full content-node-card" onClick={openEditMainContent}>
                      <div className="flow-node-accent content-accent"></div>
                      <div className="flow-node-content">
                        <div className="flow-node-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                            <line x1="7" y1="7" x2="7.01" y2="7" />
                          </svg>
                        </div>
                        <div className="flow-node-info">
                          <div className="flow-node-title">{form.name || 'Offer Content'}</div>
                          <div className="flow-node-subtitle">
                            {form.headline || 'No headline set'}
                          </div>
                          <div className="flow-node-meta">
                            {form.show_badge && form.badge_text && (
                              <span className="flow-badge-tag" style={{ background: form.badge_color + '30', color: form.badge_color, borderColor: form.badge_color + '50' }}>
                                {form.badge_text}
                              </span>
                            )}
                            {form.show_timer && (
                              <span className="flow-meta-tag timer">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10">
                                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                                </svg>
                                {form.timer_minutes}:00
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flow-node-edit-hint">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Connector from Content to split */}
                <div className="flow-connector flow-connector-center">
                  <svg height="32" width="20">
                    <path d="M10 0 L10 32" stroke="#8b5cf6" strokeWidth="2" markerEnd="url(#flowArrowPurple)" fill="none" />
                  </svg>
                </div>
              </div>

              {/* ── Split into Accept/Decline branches ── */}
              <div className="flow-builder-section">
                <div className="flow-split-indicator">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
                  </svg>
                  Split
                </div>
              </div>

              {/* ── Accept & Decline Branches side by side ── */}
              <div className="flow-branches-row">
                {/* Accept Branch */}
                <div className="flow-branch-column accept-column">
                  <div className="flow-branch-header accept-branch-header">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" width="12" height="12">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Accept Path
                    <span className="flow-branch-count">{form.accept_path_items.length}/{MAX_ITEMS}</span>
                  </div>

                  <div className="flow-branch-content">
                    {/* Empty state */}
                    {form.accept_path_items.length === 0 && (
                      <div className="flow-empty-hint">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <p>No upsells</p>
                        <p className="flow-empty-sub">Customer accepts offer</p>
                      </div>
                    )}

                    {/* Upsell nodes */}
                    {form.accept_path_items.map((item, idx) => (
                      <div key={item.id} className="flow-item-node-wrapper">
                        {idx === 0 && (
                          <div className="flow-connector">
                            <svg height="24" width="20">
                              <path d="M10 0 L10 24" stroke="#22c55e" strokeWidth="2" markerEnd="url(#flowArrowGreen)" fill="none" />
                            </svg>
                          </div>
                        )}
                        {idx > 0 && (
                          <div className="flow-connector">
                            <svg height="24" width="20">
                              <path d="M10 0 L10 24" stroke="#22c55e" strokeWidth="2" markerEnd="url(#flowArrowGreen)" fill="none" />
                            </svg>
                          </div>
                        )}
                        <div className="flow-node-card-full upsell-node-card" onClick={() => openEditAcceptItem(item.id)}>
                          <div className="flow-node-accent upsell-accent"></div>
                          <div className="flow-node-content">
                            <div className="flow-node-thumb">
                              {item.product_image ? (
                                <img src={item.product_image} alt="" />
                              ) : (
                                <div className="flow-node-thumb-placeholder">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="flow-node-info">
                              <div className="flow-node-title">Upsell {idx + 1}</div>
                              <div className="flow-node-subtitle">{item.headline || 'No headline'}</div>
                              <div className="flow-node-meta">
                                {item.product_price && (
                                  <span className="flow-price">+${parseFloat(item.product_price).toFixed(2)}</span>
                                )}
                                {item.discount_percent && (
                                  <span className="flow-discount">{item.discount_percent}% OFF</span>
                                )}
                                {item.show_timer && (
                                  <span className="flow-meta-tag timer">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10">
                                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                                    </svg>
                                    {item.timer_minutes}:00
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flow-node-remove" onClick={(e) => { e.stopPropagation(); removeAcceptItem(item.id); }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Thank You / End node */}
                    {form.accept_path_items.length > 0 && (
                      <div className="flow-item-node-wrapper">
                        <div className="flow-connector">
                          <svg height="24" width="20">
                            <path d="M10 0 L10 24" stroke="#22c55e" strokeWidth="2" markerEnd="url(#flowArrowGreen)" fill="none" />
                          </svg>
                        </div>
                        <div className="flow-node-card-full end-node-card">
                          <div className="flow-node-accent end-accent"></div>
                          <div className="flow-node-content">
                            <div className="flow-node-icon">
                              <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" width="16" height="16">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                            <div className="flow-node-info">
                              <div className="flow-node-title" style={{ color: '#22c55e' }}>Thank You</div>
                              <div className="flow-node-subtitle">Order confirmed</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Add Upsell Button */}
                    {form.accept_path_items.length < MAX_ITEMS && (
                      <div className="flow-add-node-wrapper">
                        {form.accept_path_items.length > 0 && (
                          <div className="flow-connector">
                            <svg height="24" width="20">
                              <path d="M10 0 L10 24" stroke="#22c55e" strokeWidth="2" markerEnd="url(#flowArrowGreen)" fill="none" />
                            </svg>
                          </div>
                        )}
                        <button type="button" className="flow-add-node-btn accept-add-btn" onClick={addAcceptItem}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                          Add Upsell
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div className="flow-branches-divider">
                  <div className="flow-divider-line"></div>
                  <div className="flow-divider-label">or</div>
                  <div className="flow-divider-line"></div>
                </div>

                {/* Decline Branch */}
                <div className="flow-branch-column decline-column">
                  <div className="flow-branch-header decline-branch-header">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" width="12" height="12">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    Decline Path
                    <span className="flow-branch-count">{form.decline_path_items.length}/{MAX_ITEMS}</span>
                  </div>

                  <div className="flow-branch-content">
                    {/* Empty state */}
                    {form.decline_path_items.length === 0 && (
                      <div className="flow-empty-hint decline-empty">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        <p>No downsells</p>
                        <p className="flow-empty-sub">Customer declines offer</p>
                      </div>
                    )}

                    {/* Downsell nodes */}
                    {form.decline_path_items.map((item, idx) => (
                      <div key={item.id} className="flow-item-node-wrapper">
                        {idx === 0 && (
                          <div className="flow-connector">
                            <svg height="24" width="20">
                              <path d="M10 0 L10 24" stroke="#ef4444" strokeWidth="2" markerEnd="url(#flowArrowRed)" fill="none" />
                            </svg>
                          </div>
                        )}
                        {idx > 0 && (
                          <div className="flow-connector">
                            <svg height="24" width="20">
                              <path d="M10 0 L10 24" stroke="#ef4444" strokeWidth="2" markerEnd="url(#flowArrowRed)" fill="none" />
                            </svg>
                          </div>
                        )}
                        <div className="flow-node-card-full downsell-node-card" onClick={() => openEditDeclineItem(item.id)}>
                          <div className="flow-node-accent downsell-accent"></div>
                          <div className="flow-node-content">
                            <div className="flow-node-thumb">
                              {item.product_image ? (
                                <img src={item.product_image} alt="" />
                              ) : (
                                <div className="flow-node-thumb-placeholder">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="flow-node-info">
                              <div className="flow-node-title">Downsell {idx + 1}</div>
                              <div className="flow-node-subtitle">{item.headline || 'No headline'}</div>
                              <div className="flow-node-meta">
                                {item.product_price && (
                                  <span className="flow-price">+${parseFloat(item.product_price).toFixed(2)}</span>
                                )}
                                {item.discount_percent && (
                                  <span className="flow-discount">{item.discount_percent}% OFF</span>
                                )}
                                {item.show_timer && (
                                  <span className="flow-meta-tag timer">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10">
                                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                                    </svg>
                                    {item.timer_minutes}:00
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flow-node-remove" onClick={(e) => { e.stopPropagation(); removeDeclineItem(item.id); }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* End node */}
                    {form.decline_path_items.length > 0 && (
                      <div className="flow-item-node-wrapper">
                        <div className="flow-connector">
                          <svg height="24" width="20">
                            <path d="M10 0 L10 24" stroke="#ef4444" strokeWidth="2" markerEnd="url(#flowArrowRed)" fill="none" />
                          </svg>
                        </div>
                        <div className="flow-node-card-full end-node-card decline-end-card">
                          <div className="flow-node-accent end-accent-red"></div>
                          <div className="flow-node-content">
                            <div className="flow-node-icon">
                              <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" width="16" height="16">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                              </svg>
                            </div>
                            <div className="flow-node-info">
                              <div className="flow-node-title" style={{ color: '#ef4444' }}>End</div>
                              <div className="flow-node-subtitle">Path complete</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Add Downsell Button */}
                    {form.decline_path_items.length < MAX_ITEMS && (
                      <div className="flow-add-node-wrapper">
                        {form.decline_path_items.length > 0 && (
                          <div className="flow-connector">
                            <svg height="24" width="20">
                              <path d="M10 0 L10 24" stroke="#ef4444" strokeWidth="2" markerEnd="url(#flowArrowRed)" fill="none" />
                            </svg>
                          </div>
                        )}
                        <button type="button" className="flow-add-node-btn decline-add-btn" onClick={addDeclineItem}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                          Add Downsell
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Targeting Summary Bar ── */}
              <div className="flow-targeting-bar">
                <div className="flow-targeting-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                  <span>Min. ${form.trigger_threshold || 0}{form.trigger_threshold_max ? ` – $${form.trigger_threshold_max}` : '+'}</span>
                </div>
                {form.target_products_include.length > 0 && (
                  <div className="flow-targeting-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span>{form.target_products_include.length} products</span>
                  </div>
                )}
                {form.target_collections_include.length > 0 && (
                  <div className="flow-targeting-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                    </svg>
                    <span>{form.target_collections_include.length} collections</span>
                  </div>
                )}
                {form.first_time_customers_only && (
                  <div className="flow-targeting-item highlight">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>First-time only</span>
                  </div>
                )}
              </div>

              {/* ── Form Actions ── */}
              <form onSubmit={handleSubmit} className="flow-builder-form-actions">
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={closeForm}>Cancel</button>
                  <button type="submit" className="btn-primary">
                    {editing ? 'Update Offer' : 'Create Offer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Offer Editor Slide-in Panel ── */}
      {editingItem && (
        <OfferEditor
          key={editingItem.item.id}
          item={editingItem.item}
          pathType={editingItem.pathType}
          onSave={handleEditorSave}
          onClose={() => setEditingItem(null)}
        />
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
        .offer-card-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
        .trigger-summary { font-size: 12px; color: #71717a; }
        .type-badge { display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 500; }
        .type-badge.add_product { background: rgba(139,92,246,0.15); color: #a78bfa; }
        .type-badge.warranty { background: rgba(34,197,94,0.15); color: #22c55e; }
        .type-badge.discount, .type-badge.discount_code { background: rgba(234,179,8,0.15); color: #eab308; }
        .offer-card-paths { display: flex; gap: 6px; margin-bottom: 10px; flex-wrap: wrap; }
        .path-count { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; }
        .path-count.upsell { background: rgba(34,197,94,0.1); color: #22c55e; }
        .path-count.downsell { background: rgba(239,68,68,0.1); color: #ef4444; }
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
        .super-wide-modal { width: 980px; max-width: 95vw; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #27272a; }
        .modal-header h2 { font-size: 18px; font-weight: 600; color: #fafafa; margin: 0; }
        .modal-header-actions { display: flex; align-items: center; gap: 10px; }
        .modal-close { background: none; border: none; color: #71717a; cursor: pointer; padding: 4px; border-radius: 6px; }
        .modal-close:hover { background: #27272a; color: #fafafa; }
        .modal-body { padding: 24px; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 20px 24px; border-top: 1px solid #27272a; }
        .steps-nav { display: flex; align-items: center; gap: 0; padding: 14px 24px; border-bottom: 1px solid #27272a; background: #1f1f28; overflow-x: auto; }
        .step-item { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 500; color: #52525b; white-space: nowrap; position: relative; }
        .step-item.pending { color: #52525b; }
        .step-item.active { color: #a78bfa; }
        .step-item.completed { color: #22c55e; }
        .step-circle { width: 24px; height: 24px; border-radius: 50%; background: #27272a; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; border: 2px solid #3f3f46; transition: all 0.2s; }
        .step-item.active .step-circle { background: #8b5cf6; border-color: #8b5cf6; color: #fff; }
        .step-item.completed .step-circle { background: #22c55e; border-color: #22c55e; color: #fff; }
        .step-item.pending .step-circle { color: #52525b; }
        .step-label { transition: color 0.2s; }
        .step-connector { position: absolute; right: -20px; width: 40px; height: 2px; background: #27272a; z-index: 0; }
        .step-connector.filled { background: #22c55e; }
        .flow-diagram { display: flex; align-items: center; gap: 16px; padding: 12px 24px; background: #0f0f14; border-bottom: 1px solid #27272a; flex-wrap: wrap; }
        .flow-trigger { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: #a1a1aa; background: #27272a; padding: 4px 10px; border-radius: 6px; }
        .flow-branch-arrow { color: #52525b; }
        .flow-branches { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .flow-branch { padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
        .flow-branch.accept-branch { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.3); }
        .flow-branch.decline-branch { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); }
        .flow-branch-label { display: flex; align-items: center; gap: 6px; }
        .flow-branch-or { font-size: 11px; color: #52525b; font-weight: 600; }
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
        .toggle-label { display: flex; justify-content: space-between; align-items: center; cursor: pointer; padding: 4px 0; }
        .toggle-label span { font-size: 14px; color: #a1a1aa; }
        .toggle { position: relative; display: inline-block; width: 40px; height: 22px; }
        .toggle input { opacity: 0; width: 0; height: 0; }
        .toggle-slider { position: absolute; cursor: pointer; inset: 0; background: #3f3f46; border-radius: 22px; transition: 0.2s; }
        .toggle-slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.2s; }
        .toggle input:checked + .toggle-slider { background: #8b5cf6; }
        .toggle input:checked + .toggle-slider:before { transform: translateX(18px); }
        .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #27272a; }
        .loading-state { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 60px; color: #71717a; }
        .spinner { width: 20px; height: 20px; border: 2px solid #27272a; border-top-color: #8b5cf6; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Flow builder styles */
        .flow-path-section { }
        .flow-path-header { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; margin-bottom: 16px; padding: 10px 14px; border-radius: 8px; }
        .flow-path-header.accept-path { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); color: #22c55e; }
        .flow-path-header.decline-path { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); color: #ef4444; }
        .flow-path-count { margin-left: auto; font-size: 11px; opacity: 0.7; }
        .flow-items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
        .flow-item-card { border: 1px solid; border-radius: 10px; padding: 12px; transition: all 0.15s; cursor: pointer; }
        .flow-item-card:hover { filter: brightness(1.1); }
        .flow-item-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .flow-item-type { font-size: 11px; font-weight: 700; text-transform: uppercase; }
        .flow-item-actions { display: flex; gap: 4px; }
        .flow-item-card-body { display: flex; gap: 8px; align-items: flex-start; }
        .flow-item-img { width: 36px; height: 36px; border-radius: 5px; object-fit: cover; flex-shrink: 0; }
        .flow-item-info { flex: 1; min-width: 0; }
        .flow-item-headline { font-size: 12px; font-weight: 600; color: #e5e5e5; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .flow-item-message { font-size: 11px; color: #71717a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
        .flow-item-price { font-size: 13px; font-weight: 700; margin-top: 4px; }
        .flow-item-timer { display: flex; align-items: center; gap: 4px; font-size: 10px; color: #ef4444; font-weight: 600; margin-top: 6px; }
        .flow-add-card { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; border: 2px dashed; border-radius: 10px; padding: 24px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; min-height: 100px; }
        .flow-add-card:hover { filter: brightness(1.15); }
        .flow-empty-hint { text-align: center; padding: 32px; color: #52525b; }
        .flow-empty-hint svg { margin-bottom: 8px; }
        .flow-empty-hint p { font-size: 13px; margin: 4px 0; }
        .flow-empty-sub { font-size: 12px; color: #3f3f46; }

        /* Flow Builder tree styles */
        .flow-tree-section { display: flex; flex-direction: column; gap: 8px; }
        .flow-tree-row { }
        .flow-tree-node { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid #1f1f28; }
        .flow-tree-node:last-child { border-bottom: none; }
        .flow-node-label { display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; text-transform: uppercase; min-width: 80px; flex-shrink: 0; }
        .flow-node-label svg { flex-shrink: 0; }
        .upsell-node .flow-node-label { color: #22c55e; }
        .downsell-node .flow-node-label { color: #ef4444; }
        .flow-node-card { flex: 1; min-width: 0; }
        .flow-node-card .flow-item-card { margin: 0; }
        .flow-add-downsell-btn { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); color: #ef4444; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; white-space: nowrap; flex-shrink: 0; }
        .flow-add-downsell-btn:hover:not(:disabled) { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.4); }
        .flow-add-downsell-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .flow-add-upsell-btn { display: flex; align-items: center; justify-content: center; gap: 8px; background: rgba(139,92,246,0.08); border: 2px dashed rgba(139,92,246,0.3); color: #8b5cf6; padding: 14px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; margin-top: 8px; }
        .flow-add-upsell-btn:hover { background: rgba(139,92,246,0.15); border-color: rgba(139,92,246,0.5); }
        .total-branch { background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.3); }

        /* NEW: Flowchart visual styles */
        .flow-canvas { display: flex; flex-direction: column; gap: 0; padding: 8px 0 16px; position: relative; }

        /* Trigger node */
        .flow-trigger-node { display: flex; align-items: center; justify-content: center; gap: 8px; background: #8b5cf6; color: #fff; padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 600; width: fit-content; margin: 0 auto; box-shadow: 0 4px 12px rgba(139,92,246,0.3); }
        .flow-trigger-connector { display: flex; justify-content: center; height: 32px; margin-left: 0; }

        /* Vertical connectors */
        .flow-vertical-connector { display: flex; justify-content: center; height: 28px; }
        .flow-upsell-connector-row { display: flex; flex-direction: column; align-items: center; gap: 4px; margin-top: 8px; }
        .flow-upsell-connector-line { display: flex; justify-content: center; }

        /* Node rows */
        .flow-node-row { display: flex; align-items: flex-start; gap: 0; position: relative; min-height: 120px; }

        /* Upsell column */
        .upsell-col { flex: 0 0 300px; position: relative; }
        .flow-node { display: flex; flex-direction: column; gap: 0; }
        .flow-node-header { padding: 8px 0 6px; }
        .flow-node.upsell-node .flow-node-header { }
        .flow-node.downsell-node .flow-node-header { }

        /* Branch column (right of upsells) */
        .flow-branch-col { flex: 1; display: flex; align-items: center; min-height: 120px; position: relative; padding: 0 8px; }

        /* Horizontal branch line */
        .branch-line-h { flex: 1; position: relative; height: 20px; margin-right: 8px; }

        /* Downsell column */
        .downsell-col { flex: 0 0 300px; }

        /* Add Downsell branch button */
        .add-downsell-branch-btn { display: flex; align-items: center; gap: 6px; background: rgba(239,68,68,0.08); border: 2px dashed rgba(239,68,68,0.4); color: #ef4444; padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
        .add-downsell-branch-btn:hover:not(:disabled) { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.6); }
        .add-downsell-branch-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Add Upsell button in flow */
        .flow-add-upsell-btn.flow-add-first { width: fit-content; margin: 8px auto 0; }
        .flow-add-upsell-btn { display: flex; align-items: center; justify-content: center; gap: 8px; background: rgba(139,92,246,0.08); border: 2px dashed rgba(139,92,246,0.3); color: #8b5cf6; padding: 10px 18px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
        .flow-add-upsell-btn:hover { background: rgba(139,92,246,0.15); border-color: rgba(139,92,246,0.5); }

        /* Empty state in flowchart */
        .flow-empty-state { display: flex; flex-direction: column; align-items: center; gap: 0; padding: 16px 0; }
        .flow-empty-hint-node { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 24px 32px; background: rgba(139,92,246,0.05); border: 2px dashed rgba(139,92,246,0.2); border-radius: 12px; color: #52525b; text-align: center; }
        .flow-empty-hint-node svg { color: #3f3f46; margin-bottom: 4px; }
        .flow-empty-hint-node p { font-size: 13px; margin: 0; color: #71717a; }
        .flow-empty-sub { font-size: 12px !important; color: #52525b !important; }

        /* Flow end node */
        .flow-end-node { display: flex; align-items: center; justify-content: center; gap: 6px; color: #52525b; font-size: 12px; font-weight: 500; padding: 12px 0; margin-top: 8px; }
        .flow-end-node svg { color: #3f3f46; }

        /* Review step */
        .review-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 24px; }
        .review-card { background: #0f0f14; border: 1px solid #27272a; border-radius: 10px; padding: 16px; }
        .review-card-title { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: #a78bfa; margin-bottom: 12px; }
        .review-row { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #1f1f28; font-size: 12px; }
        .review-row:last-child { border-bottom: none; }
        .review-label { color: #71717a; }
        .review-value { color: #e5e5e5; font-weight: 500; }
        .review-empty { font-size: 12px; color: #52525b; text-align: center; padding: 12px; }
        .review-item { display: flex; gap: 8px; padding: 6px 0; border-bottom: 1px solid #1f1f28; }
        .review-item:last-child { border-bottom: none; }
        .review-item-num { width: 18px; height: 18px; border-radius: 50%; background: #27272a; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #71717a; flex-shrink: 0; margin-top: 1px; }
        .review-item-info { flex: 1; min-width: 0; }
        .review-item-headline { font-size: 12px; font-weight: 600; color: #e5e5e5; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .review-item-meta { font-size: 11px; color: #71717a; margin-top: 2px; }
        .review-warning { display: flex; align-items: center; gap: 8px; background: rgba(234,179,8,0.1); border: 1px solid rgba(234,179,8,0.3); border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #eab308; margin-bottom: 20px; }
        .preview-link-group { background: rgba(139,92,246,0.05); border: 1px solid rgba(139,92,246,0.15); border-radius: 8px; padding: 16px; }
        .preview-link-row { display: flex; gap: 8px; }
        .preview-link-input { flex: 1; font-size: 12px; color: #71717a; }
        .btn-copy { background: #27272a; border: 1px solid #3f3f46; color: #e5e5e5; padding: 8px 14px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; white-space: nowrap; }
        .btn-copy:hover { background: #3f3f46; }

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

        /* Shared form elements */
        .upsell-type-selector { display: flex; gap: 8px; margin-bottom: 24px; }
        .upsell-type-btn { display: flex; align-items: center; gap: 6px; background: #0f0f14; border: 2px solid #27272a; padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 500; color: #71717a; cursor: pointer; transition: all 0.15s; }
        .upsell-type-btn:hover { border-color: #3f3f46; color: #e5e5e5; }
        .upsell-type-btn.active { border-color: #8b5cf6; background: rgba(139,92,246,0.1); color: #a78bfa; }
        .type-fields { background: #0f0f14; border: 1px solid #27272a; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
        .warranty-fields { border-color: rgba(34,197,94,0.2); background: rgba(34,197,94,0.03); }
        .urgency-options { background: rgba(139,92,246,0.05); border: 1px solid rgba(139,92,246,0.15); border-radius: 8px; padding: 16px; margin-bottom: 20px; }
        .urgency-title { font-size: 12px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }

        /* NEW: Flow Overview Mini-Diagram */
        .flow-overview-mini { background: #0f0f14; border: 1px solid #27272a; border-radius: 10px; padding: 14px 16px; margin-bottom: 20px; }
        .flow-overview-title { font-size: 11px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
        .flow-overview-diagram { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 12px; }
        .flow-overview-node { display: flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 6px; font-weight: 600; white-space: nowrap; }
        .flow-overview-node.checkout-node { background: rgba(139,92,246,0.15); border: 1px solid rgba(139,92,246,0.3); color: #a78bfa; }
        .flow-overview-node.offer-node { background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.25); color: #c4b5fd; }
        .flow-overview-node.accept-node { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.3); color: #22c55e; }
        .flow-overview-node.end-node { background: rgba(34,197,94,0.05); border: 1px solid rgba(34,197,94,0.2); color: #71717a; }
        .flow-overview-node.decline-node { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; }
        .flow-overview-node.end-node.decline-end { background: rgba(239,68,68,0.05); border: 1px solid rgba(239,68,68,0.2); color: #71717a; }
        .flow-overview-arrow { color: #52525b; font-size: 14px; }
        .flow-overview-arrow.flow-overview-branch-arrow { color: #ef4444; }
        .flow-overview-arrow.decline-arrow { color: #ef4444; }
        .flow-overview-decline-path { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
        .flow-overview-decline-path .flow-overview-arrow { color: #ef4444; }

        /* NEW: Decline Step Title */
        .decline-step-title { color: #ef4444 !important; }
        .decline-step-desc { color: #71717a !important; }

        /* NEW: Decline Flow Canvas */
        .decline-flow-canvas { }
        .decline-trigger-node { background: #ef4444 !important; box-shadow: 0 4px 12px rgba(239,68,68,0.3) !important; }
        .decline-end-node { color: #ef4444 !important; }
        .decline-end-node svg { color: #ef4444 !important; }

        /* NEW: Linear Flow Container */
        .flow-linear-container { display: flex; flex-direction: column; gap: 0; padding: 8px 0 16px; }
        .flow-linear-row { display: flex; flex-direction: column; align-items: center; gap: 0; }

        /* NEW: Red themed Add Downsell button */
        .flow-add-downsell-btn { display: flex; align-items: center; justify-content: center; gap: 8px; background: rgba(239,68,68,0.08); border: 2px dashed rgba(239,68,68,0.3); color: #ef4444; padding: 10px 18px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
        .flow-add-downsell-btn:hover { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.5); }
        .flow-add-downsell-btn.flow-add-first { width: fit-content; margin: 8px auto 0; }

        /* ══════════════════════════════════════════════════════════════════
           NEW: n8n-style Flow Builder CSS
           ══════════════════════════════════════════════════════════════════ */

        /* Flow Builder Canvas - main container */
        .flow-builder-canvas {
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 0;
          max-height: calc(90vh - 120px);
          overflow-y: auto;
        }

        /* Builder section (groups nodes + connectors) */
        .flow-builder-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
        }

        /* Row of nodes (centered) */
        .flow-builder-row {
          display: flex;
          justify-content: center;
          width: 100%;
        }

        /* Node wrapper (centers the card) */
        .flow-node-wrapper {
          display: flex;
          justify-content: center;
        }

        /* Full node card (n8n style - wide card ~140-160px) */
        .flow-node-card-full {
          display: flex;
          align-items: stretch;
          background: #0f0f14;
          border: 1px solid #27272a;
          border-radius: 10px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.15s;
          width: 100%;
          max-width: 340px;
          min-width: 280px;
        }

        .flow-node-card-full:hover {
          border-color: #3f3f46;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        /* Left accent bar */
        .flow-node-accent {
          width: 4px;
          flex-shrink: 0;
        }
        .trigger-accent { background: #8b5cf6; }
        .content-accent { background: #8b5cf6; }
        .upsell-accent { background: #22c55e; }
        .downsell-accent { background: #ef4444; }
        .end-accent { background: #22c55e; }
        .end-accent-red { background: #ef4444; }

        /* Node content (icon + info) */
        .flow-node-content {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          flex: 1;
          min-width: 0;
        }

        /* Node icon */
        .flow-node-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #1f1f28;
          flex-shrink: 0;
          color: #a1a1aa;
        }

        /* Node info */
        .flow-node-info {
          flex: 1;
          min-width: 0;
        }

        .flow-node-title {
          font-size: 13px;
          font-weight: 600;
          color: #e5e5e5;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .flow-node-subtitle {
          font-size: 12px;
          color: #71717a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-top: 2px;
        }

        .flow-node-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 4px;
          flex-wrap: wrap;
        }

        /* Flow metadata tags */
        .flow-meta-tag {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(139,92,246,0.1);
          color: #a78bfa;
          border: 1px solid rgba(139,92,246,0.2);
        }
        .flow-meta-tag.exclude {
          background: rgba(239,68,68,0.1);
          color: #f87171;
          border-color: rgba(239,68,68,0.2);
        }
        .flow-meta-tag.timer {
          background: rgba(234,179,8,0.1);
          color: #fbbf24;
          border-color: rgba(234,179,8,0.2);
        }

        /* Flow price/discount */
        .flow-price {
          font-size: 12px;
          font-weight: 700;
          color: #22c55e;
        }
        .flow-discount {
          font-size: 11px;
          font-weight: 700;
          color: #f59e0b;
          background: rgba(245,158,11,0.1);
          padding: 1px 5px;
          border-radius: 4px;
        }

        /* Badge tag in node */
        .flow-badge-tag {
          display: inline-flex;
          align-items: center;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid;
        }

        /* Edit hint icon */
        .flow-node-edit-hint {
          color: #52525b;
          flex-shrink: 0;
          transition: color 0.15s;
        }
        .flow-node-card-full:hover .flow-node-edit-hint {
          color: #8b5cf6;
        }

        /* Flow connector (SVG arrow) */
        .flow-connector {
          display: flex;
          justify-content: center;
        }
        .flow-connector-center {
          margin-left: 0;
        }

        /* Split indicator */
        .flow-split-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #71717a;
          padding: 8px 0;
        }

        /* Two-column branches row */
        .flow-branches-row {
          display: flex;
          gap: 16px;
          width: 100%;
          align-items: flex-start;
        }

        /* Branch column */
        .flow-branch-column {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0;
          min-width: 0;
        }

        /* Branch header */
        .flow-branch-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
          padding: 8px 12px;
          border-radius: 8px;
          margin-bottom: 12px;
        }
        .accept-branch-header {
          background: rgba(34,197,94,0.08);
          border: 1px solid rgba(34,197,94,0.2);
          color: #22c55e;
        }
        .decline-branch-header {
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          color: #ef4444;
        }
        .flow-branch-count {
          margin-left: auto;
          font-size: 11px;
          opacity: 0.7;
          font-weight: 500;
        }

        /* Branch content area */
        .flow-branch-content {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        /* Branches divider */
        .flow-branches-divider {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 40px 12px 0;
          flex-shrink: 0;
        }
        .flow-divider-line {
          width: 1px;
          flex: 1;
          background: #27272a;
          min-height: 20px;
        }
        .flow-divider-label {
          font-size: 11px;
          font-weight: 700;
          color: #52525b;
          text-transform: uppercase;
        }

        /* Empty hint within branch */
        .flow-empty-hint {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 24px 16px;
          color: #3f3f46;
          text-align: center;
          border: 2px dashed rgba(34,197,94,0.2);
          border-radius: 10px;
          margin-bottom: 12px;
        }
        .flow-empty-hint.decline-empty {
          border-color: rgba(239,68,68,0.2);
        }
        .flow-empty-hint svg { color: #3f3f46; }
        .flow-empty-hint p { font-size: 13px; margin: 0; color: #71717a; }
        .flow-empty-hint .flow-empty-sub { font-size: 11px; color: #52525b; }

        /* Individual item node wrapper */
        .flow-item-node-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
        }

        /* Add node button wrapper */
        .flow-add-node-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
        }

        /* Add node button */
        .flow-add-node-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          border: 2px dashed;
        }
        .accept-add-btn {
          background: rgba(34,197,94,0.05);
          border-color: rgba(34,197,94,0.3);
          color: #22c55e;
        }
        .accept-add-btn:hover {
          background: rgba(34,197,94,0.1);
          border-color: rgba(34,197,94,0.5);
        }
        .decline-add-btn {
          background: rgba(239,68,68,0.05);
          border-color: rgba(239,68,68,0.3);
          color: #ef4444;
        }
        .decline-add-btn:hover {
          background: rgba(239,68,68,0.1);
          border-color: rgba(239,68,68,0.5);
        }

        /* Thumbanil in node */
        .flow-node-thumb {
          width: 36px;
          height: 36px;
          border-radius: 6px;
          overflow: hidden;
          flex-shrink: 0;
          background: #1f1f28;
        }
        .flow-node-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .flow-node-thumb-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #3f3f46;
        }

        /* Remove button on node */
        .flow-node-remove {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 4px;
          color: #52525b;
          cursor: pointer;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .flow-node-remove:hover {
          background: rgba(239,68,68,0.15);
          color: #ef4444;
        }

        /* Targeting bar */
        .flow-targeting-bar {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 16px;
          background: #0f0f14;
          border: 1px solid #27272a;
          border-radius: 10px;
          margin-top: 16px;
          flex-wrap: wrap;
        }
        .flow-targeting-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 500;
          color: #71717a;
        }
        .flow-targeting-item.highlight {
          color: #a78bfa;
        }

        /* Form actions wrapper */
        .flow-builder-form-actions {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #27272a;
        }
      `}</style>
    </div>
  );
}

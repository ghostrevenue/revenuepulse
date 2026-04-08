import React, { useState, useEffect } from 'react';
import VisualPreview from './VisualPreview.jsx';

/**
 * OfferEditor — slide-in panel for editing a single offer item (upsell or downsell).
 * Shows a live visual preview on the right that updates in real-time.
 *
 * Props:
 *   item       — the offer item object being edited
 *   pathType   — 'upsell' | 'downsell'
 *   onSave     — (updatedItem) => void
 *   onClose    — () => void
 */
export default function OfferEditor({ item, pathType, onSave, onClose }) {
  const isUpsell = pathType === 'upsell';
  const pathColor = isUpsell ? '#8b5cf6' : '#ef4444';
  const pathBg = isUpsell ? 'rgba(139,92,246,0.08)' : 'rgba(239,68,68,0.08)';
  const pathBorder = isUpsell ? 'rgba(139,92,246,0.2)' : 'rgba(239,68,68,0.2)';

  // Local form state — initialized via useEffect to avoid calling generateId() at render time
  const [form, setForm] = useState(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!item) return;
    setForm({
      id: item.id || generateId(),
      offer_type: item.offer_type || 'add_product',
      headline: item.headline || 'Wait! Add this to your order',
      message: item.message || 'Get it delivered with your current order — just one click away.',
      // Product
      product_id: item.product_id || '',
      product_title: item.product_title || '',
      product_price: item.product_price || '',
      product_image: item.product_image || '',
      variant_id: item.variant_id || '',
      // Discount
      discount_code: item.discount_code || '',
      discount_percent: item.discount_percent || '',
      // Warranty
      warranty_price: item.warranty_price || '',
      warranty_description: item.warranty_description || '',
      warranty_covered: item.warranty_covered || '',
      // Badge
      badge_text: item.badge_text || '',
      badge_color: item.badge_color || '#8b5cf6',
      show_badge: item.show_badge !== undefined ? item.show_badge : true,
      // Timer
      show_timer: item.show_timer || false,
      timer_minutes: item.timer_minutes || 15,
      // Button
      button_text: item.button_text || '',
    });
    setInitialized(true);
  }, [item?.id]); // Only re-run when the actual item ID changes

  // Guard: don't render until initialized
  if (!initialized || !form) {
    return (
      <div className="offer-editor-overlay" onClick={onClose}>
        <div className="offer-editor-panel" onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: '#71717a' }}>Loading...</div>
        </div>
      </div>
    );
  }

  function updateField(key, value) {
    setForm(f => ({ ...f, [key]: value }));
  }

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);

  // Search Shopify products
  useEffect(() => {
    if (form.offer_type !== 'add_product' && form.offer_type !== 'warranty') return;
    if (!showProductSearch || !searchQuery) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { api } = await import('../api/index.js');
        const res = await api.searchShopifyProducts(searchQuery, 20);
        setSearchResults(res.products || res || []);
      } catch (e) {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, form.offer_type, showProductSearch]);

  function handleProductSelect(product) {
    const variant = product.variants && product.variants[0];
    setForm(f => ({
      ...f,
      product_id: String(product.id),
      product_title: product.title,
      product_price: variant?.price || '',
      product_image: product.images && product.images[0] ? product.images[0].src : '',
      variant_id: variant ? String(variant.id) : '',
    }));
    setSearchQuery('');
    setSearchResults([]);
    setShowProductSearch(false);
  }

  function handleSave() {
    onSave({ ...form });
  }

  // Build preview form from editor form
  const previewForm = {
    offer_type: form.offer_type,
    headline: form.headline,
    message: form.message,
    upsell_product_title: form.product_title,
    upsell_product_price: form.product_price,
    upsell_product_image: form.product_image,
    discount_code: form.discount_code,
    discount_percent: form.discount_percent,
    warranty_price: form.warranty_price,
    warranty_description: form.warranty_description,
    one_time_offer: form.show_badge && form.badge_text.toLowerCase().includes('one-time'),
    confirmation_only: true,
    badge_text: form.show_badge ? form.badge_text : '',
    badge_color: form.badge_color,
    show_timer: form.show_timer,
    timer_minutes: form.timer_minutes,
    button_text: form.button_text,
  };

  return (
    <div className="offer-editor-overlay" onClick={onClose}>
      <div className="offer-editor-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="offer-editor-header">
          <div className="offer-editor-title-row">
            <span
              className="path-type-badge"
              style={{ background: pathBg, color: pathColor, borderColor: pathBorder }}
            >
              {isUpsell ? '✓ Accept Path — Upsell' : '✗ Decline Path — Downsell'}
            </span>
            <h2 className="offer-editor-title">Edit Offer</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body — two-column: form + preview */}
        <div className="offer-editor-body">
          {/* Left: Edit Form */}
          <div className="offer-editor-form-col">
            {/* Offer Type */}
            <div className="form-group">
              <label className="form-label">Offer Type</label>
              <div className="upsell-type-selector">
                {['add_product', 'discount', 'warranty'].map(type => (
                  <div key={type}
                    className={`upsell-type-btn ${form.offer_type === type ? 'active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, offer_type: type }))}>
                    {type === 'add_product' && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
                      </svg>
                    )}
                    {type === 'warranty' && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    )}
                    {type === 'discount' && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                      </svg>
                    )}
                    <span>{type === 'add_product' ? 'Add to Order' : type === 'warranty' ? 'Warranty' : 'Discount'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Headline */}
            <div className="form-group">
              <label className="form-label">Headline</label>
              <input className="form-input" type="text" value={form.headline}
                onChange={e => updateField('headline', e.target.value)}
                placeholder="Wait! Add this to your order" />
            </div>

            {/* Message */}
            <div className="form-group">
              <label className="form-label">Message</label>
              <textarea className="form-input" rows={2} value={form.message}
                onChange={e => updateField('message', e.target.value)}
                placeholder="Get it delivered with your current order — just one click away." />
            </div>

            {/* Product Search (for add_product / warranty) */}
            {(form.offer_type === 'add_product' || form.offer_type === 'warranty') && (
              <div className="type-fields">
                <div className="form-group">
                  <label className="form-label">Product</label>
                  <div className="product-search-wrapper">
                    {form.product_image && (
                      <img src={form.product_image} alt="" className="product-search-thumb" />
                    )}
                    <div className="product-search-input-wrap">
                      <input
                        className="form-input"
                        type="text"
                        value={form.product_title}
                        readOnly
                        placeholder="Click to search products..."
                        onClick={() => setShowProductSearch(s => !s)}
                      />
                      {form.product_title && (
                        <button type="button" className="product-clear-btn"
                          onClick={() => setForm(f => ({ ...f, product_id: '', product_title: '', product_price: '', product_image: '', variant_id: '' }))}>
                          ×
                        </button>
                      )}
                    </div>
                  </div>

                  {showProductSearch && (
                    <div className="product-search-dropdown">
                      <input
                        className="form-input search-input"
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        autoFocus
                      />
                      <div className="target-list">
                        {searching && <div className="target-loading">Searching...</div>}
                        {!searching && searchResults.length === 0 && searchQuery && (
                          <div className="target-empty">No products found</div>
                        )}
                        {!searching && searchResults.length === 0 && !searchQuery && (
                          <div className="target-empty">Type to search products</div>
                        )}
                        {searchResults.map(product => (
                          <div key={product.id} className="target-item"
                            onClick={() => handleProductSelect(product)}>
                            {product.images && product.images[0] && (
                              <img src={product.images[0].src} alt="" className="target-thumb" />
                            )}
                            <div className="target-info">
                              <div className="target-name">{product.title}</div>
                              {product.variants && product.variants[0] && (
                                <div className="target-price">${parseFloat(product.variants[0].price || 0).toFixed(2)}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Price ($)</label>
                    <input className="form-input" type="number" step="0.01"
                      value={form.product_price}
                      onChange={e => updateField('product_price', e.target.value)}
                      placeholder="24.99" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Button Text <span className="optional">(optional)</span></label>
                    <input className="form-input" type="text"
                      value={form.button_text}
                      onChange={e => updateField('button_text', e.target.value)}
                      placeholder="Add to Order" />
                  </div>
                </div>
              </div>
            )}

            {/* Discount fields */}
            {form.offer_type === 'discount' && (
              <div className="type-fields">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Discount Code</label>
                    <input className="form-input" type="text"
                      value={form.discount_code}
                      onChange={e => updateField('discount_code', e.target.value)}
                      placeholder="SAVE20" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Discount Value (%)</label>
                    <input className="form-input" type="number"
                      value={form.discount_percent}
                      onChange={e => updateField('discount_percent', e.target.value)}
                      placeholder="20" />
                  </div>
                </div>
              </div>
            )}

            {/* Warranty fields */}
            {form.offer_type === 'warranty' && (
              <div className="type-fields warranty-fields">
                <div className="form-group">
                  <label className="form-label">Warranty Price ($)</label>
                  <input className="form-input" type="number" step="0.01"
                    value={form.warranty_price}
                    onChange={e => updateField('warranty_price', e.target.value)}
                    placeholder="9.99" />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input className="form-input" type="text"
                    value={form.warranty_description}
                    onChange={e => updateField('warranty_description', e.target.value)}
                    placeholder="Extended protection plan" />
                </div>
              </div>
            )}

            {/* Badges */}
            <div className="urgency-options">
              <div className="urgency-title">Offer Badge</div>
              <label className="toggle-label">
                <span>Show badge</span>
                <label className="toggle">
                  <input type="checkbox" checked={form.show_badge}
                    onChange={e => updateField('show_badge', e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </label>
              {form.show_badge && (
                <div className="form-row" style={{ marginTop: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Badge Text</label>
                    <input className="form-input" type="text"
                      value={form.badge_text}
                      onChange={e => updateField('badge_text', e.target.value)}
                      placeholder="One-time offer" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Badge Color</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input type="color" value={form.badge_color}
                        onChange={e => updateField('badge_color', e.target.value)}
                        style={{ width: '40px', height: '36px', borderRadius: '6px', border: '1px solid #27272a', cursor: 'pointer' }} />
                      <input className="form-input" type="text"
                        value={form.badge_color}
                        onChange={e => updateField('badge_color', e.target.value)}
                        placeholder="#8b5cf6" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Timer */}
            <div className="urgency-options">
              <div className="urgency-title">Countdown Timer</div>
              <label className="toggle-label">
                <span>Show countdown timer</span>
                <label className="toggle">
                  <input type="checkbox" checked={form.show_timer}
                    onChange={e => updateField('show_timer', e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </label>
              {form.show_timer && (
                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label className="form-label">Timer Duration (minutes)</label>
                  <input className="form-input" type="number"
                    value={form.timer_minutes}
                    onChange={e => updateField('timer_minutes', parseInt(e.target.value) || 15)}
                    min="1" max="120" />
                </div>
              )}
            </div>
          </div>

          {/* Right: Live Visual Preview */}
          <div className="offer-editor-preview-col">
            <div className="preview-label">Live Preview</div>
            <VisualPreview form={previewForm} />
          </div>
        </div>

        {/* Footer */}
        <div className="offer-editor-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-primary" onClick={handleSave}>Save Offer</button>
        </div>
      </div>

      <style>{`
        .offer-editor-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.7);
          display: flex; align-items: stretch; justify-content: flex-end;
          z-index: 2000; backdrop-filter: blur(4px);
        }
        .offer-editor-panel {
          width: 900px; max-width: 95vw;
          background: #18181b; border-left: 1px solid #27272a;
          display: flex; flex-direction: column;
          overflow: hidden;
        }
        .offer-editor-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          padding: 20px 24px; border-bottom: 1px solid #27272a; flex-shrink: 0;
        }
        .offer-editor-title-row { display: flex; flex-direction: column; gap: 8px; }
        .offer-editor-title { font-size: 18px; font-weight: 600; color: #fafafa; margin: 0; }
        .path-type-badge {
          display: inline-block; padding: 3px 10px; border-radius: 9999px;
          font-size: 11px; font-weight: 600; border: 1px solid; width: fit-content;
        }
        .offer-editor-body {
          display: flex; flex: 1; overflow: hidden;
        }
        .offer-editor-form-col {
          flex: 1; overflow-y: auto; padding: 24px;
        }
        .offer-editor-preview-col {
          width: 320px; flex-shrink: 0; overflow-y: auto;
          padding: 24px; background: #0f0f14; border-left: 1px solid #27272a;
        }
        .offer-editor-footer {
          display: flex; justify-content: flex-end; gap: 12px;
          padding: 16px 24px; border-top: 1px solid #27272a; flex-shrink: 0;
        }
        .preview-label {
          font-size: 12px; font-weight: 600; color: #71717a;
          text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;
        }
        .product-search-wrapper { display: flex; gap: 8px; align-items: center; }
        .product-search-thumb { width: 40px; height: 40px; border-radius: 6px; object-fit: cover; flex-shrink: 0; }
        .product-search-input-wrap { flex: 1; position: relative; }
        .product-clear-btn {
          position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
          background: none; border: none; color: #71717a; cursor: pointer; font-size: 18px;
        }
        .product-search-dropdown {
          margin-top: 8px; background: #0f0f14; border: 1px solid #27272a;
          border-radius: 8px; overflow: hidden;
        }
        .product-search-dropdown .search-input { border-radius: 0; border: none; border-bottom: 1px solid #27272a; }
        .product-search-dropdown .target-list { max-height: 200px; }
      `}</style>
    </div>
  );
}

function generateId() {
  return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

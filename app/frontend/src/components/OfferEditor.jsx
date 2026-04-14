import React, { useState, useEffect, useCallback } from 'react';
import VisualPreview from './VisualPreview.jsx';

/**
 * OfferEditor — slide-in panel for editing a single offer item (upsell or downsell).
 * Shopify Customizer-style live preview editor with all offer fields exposed.
 *
 * Props:
 *   item       — the offer item object being edited
 *   pathType   — 'upsell' | 'downsell'
 *   onSave     — (updatedItem) => void
 *   onClose    — () => void
 */
export default function OfferEditor({ item, pathType, onSave, onClose, shop }) {
  const isUpsell = pathType === 'upsell';
  const pathColor = isUpsell ? '#8b5cf6' : '#ef4444';
  const pathBg = isUpsell ? 'rgba(139,92,246,0.08)' : 'rgba(239,68,68,0.08)';
  const pathBorder = isUpsell ? 'rgba(139,92,246,0.2)' : 'rgba(239,68,68,0.2)';

  // Initialize form synchronously from item — no async, no early return guard.
  // This ensures all hooks run in the same order on every render (React 19 requirement).
  const [form, setForm] = useState(() => item ? {
    id: item.id || generateId(),
    offer_type: item.offer_type || 'add_product',
    headline: item.headline || 'Wait! Add this to your order',
    message: item.message || 'Get it delivered with your current order — just one click away.',
    product_id: item.product_id || '',
    product_title: item.product_title || '',
    product_price: item.product_price || '',
    product_image: item.product_image || '',
    variant_id: item.variant_id || '',
    variant_options: item.variant_options || [],
    variant_title: item.variant_title || '',
    discount_code: item.discount_code || '',
    discount_percent: item.discount_percent || '',
    warranty_price: item.warranty_price || '',
    warranty_description: item.warranty_description || '',
    warranty_covered: item.warranty_covered || '',
    badge_text: item.badge_text || 'One-time offer',
    badge_color: item.badge_color || '#8b5cf6',
    show_badge: item.show_badge !== undefined ? item.show_badge : true,
    show_timer: item.show_timer || false,
    timer_minutes: item.timer_minutes || 15,
    button_text: item.button_text || '',
  } : null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [previewOnly, setPreviewOnly] = useState(false);
  const [fullScreenPreview, setFullScreenPreview] = useState(false);
  const [openSections, setOpenSections] = useState({
    product: true,
    discount: true,
    appearance: true,
    timer: true,
  });

  // Guard against null item — render empty state, all hooks still run
  if (!item) {
    return (
      <div className="offer-editor-overlay" onClick={onClose}>
        <div className="offer-editor-panel" onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: '#71717a' }}>No item selected</div>
        </div>
      </div>
    );
  }

  function updateField(key, value) {
    setForm(f => f ? ({ ...f, [key]: value }) : null);
  }

  function toggleSection(key) {
    setOpenSections(s => ({ ...s, [key]: !s[key] }));
  }

  function SectionHeader({ title, isOpen, onToggle, badge }) {
    return (
      <div className="section-header" onClick={onToggle}>
        <span className="section-title">{title}</span>
        {badge && <span className="section-badge">{badge}</span>}
        <svg className={`section-chevron ${isOpen ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    );
  }

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
    const variants = product.variants || [];
    const defaultVariant = variants[0] || {};
    const productImg = product.images && product.images[0] ? product.images[0].src : '';

    // Build variant options for the selector
    const variantOptions = variants.map(v => ({
      id: String(v.id),
      title: v.title !== 'Default Title' ? v.title : product.title,
      price: v.price,
      image: v.image ? v.image.src : productImg,
    }));

    setForm(f => ({
      ...f,
      product_id: String(product.id),
      product_title: product.title,
      product_price: defaultVariant.price || '',
      product_image: productImg,
      variant_id: String(defaultVariant.id),
      variant_title: defaultVariant.title !== 'Default Title' ? defaultVariant.title : '',
      variant_options: variantOptions,
    }));
    setSearchQuery('');
    setSearchResults([]);
    setShowProductSearch(false);
  }

  function handleVariantSelect(variantId) {
    const variant = form.variant_options.find(v => v.id === variantId);
    if (!variant) return;
    setForm(f => ({
      ...f,
      variant_id: variantId,
      variant_title: variant.title,
      product_price: variant.price || f.product_price,
      product_image: variant.image || f.product_image,
    }));
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
    variant_title: form.variant_title,
    discount_code: form.discount_code,
    discount_percent: form.discount_percent,
    warranty_price: form.warranty_price,
    warranty_description: form.warranty_description,
    warranty_covered: form.warranty_covered,
    one_time_offer: form.show_badge && form.badge_text.toLowerCase().includes('one-time'),
    confirmation_only: true,
    badge_text: form.show_badge ? form.badge_text : '',
    badge_color: form.badge_color,
    show_badge: form.show_badge,
    show_timer: form.show_timer,
    timer_minutes: form.timer_minutes,
    button_text: form.button_text,
  };

  const sectionSummary = {
    product: form.product_title ? form.product_title : 'No product selected',
    discount: form.offer_type === 'discount' || form.offer_type === 'discount_code'
      ? (form.discount_code ? `${form.discount_code} (${form.discount_percent}%)` : 'No discount set')
      : form.offer_type === 'warranty'
      ? (form.warranty_price ? `$${parseFloat(form.warranty_price).toFixed(2)}` : 'No price set')
      : (form.product_price ? `$${parseFloat(form.product_price).toFixed(2)}` : 'No price set'),
    appearance: form.show_badge ? form.badge_text || 'Badge on' : 'Badge off',
    timer: form.show_timer ? `${form.timer_minutes} min` : 'Timer off',
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
            <h2 className="offer-editor-title">Customize Offer</h2>
          </div>
          <div className="header-controls">
            <button
              className="fullscreen-preview-btn"
              onClick={() => setFullScreenPreview(true)}
              title="Full screen preview"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
              </svg>
              Full Screen
            </button>
            <button
              className={`preview-mode-btn ${previewOnly ? 'active' : ''}`}
              onClick={() => setPreviewOnly(p => !p)}
              title="Toggle preview mode"
            >
              {previewOnly ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  Preview
                </>
              )}
            </button>
            <button className="modal-close" onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        {previewOnly ? (
          /* Preview Only Mode — full size */
          <div className="offer-editor-preview-only">
            <VisualPreview form={previewForm} fullSize shop={shop} />
          </div>
        ) : (
          /* Edit Mode — two-column: form + preview */
          <div className="offer-editor-body">
            {/* Left: Edit Form */}
            <div className="offer-editor-form-col">

              {/* Sticky Offer Type Selector */}
              <div className="sticky-offer-type">
                <label className="form-label">Offer Type</label>
                <div className="upsell-type-selector">
                  {[
                    { type: 'add_product', label: 'Add to Order', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg> },
                    { type: 'warranty', label: 'Warranty', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg> },
                    { type: 'discount', label: 'Discount', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg> },
                  ].map(({ type, label, icon }) => (
                    <div key={type}
                      className={`upsell-type-btn ${form.offer_type === type ? 'active' : ''}`}
                      onClick={() => setForm(f => ({ ...f, offer_type: type }))}>
                      {icon}
                      <span>{label}</span>
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

              {/* ==================== PRODUCT SECTION ==================== */}
              {(form.offer_type === 'add_product' || form.offer_type === 'warranty') && (
                <div className="collapsible-section">
                  <SectionHeader
                    title="Product"
                    isOpen={openSections.product}
                    onToggle={() => toggleSection('product')}
                    badge={sectionSummary.product}
                  />
                  {openSections.product && (
                    <div className="section-body">
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
                                onClick={() => setForm(f => ({ ...f, product_id: '', product_title: '', product_price: '', product_image: '', variant_id: '', variant_options: [], variant_title: '' }))}>
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
                                    {product.variants && product.variants.length > 1 && (
                                      <div className="target-variants-count">{product.variants.length} variants</div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Variant Selector */}
                      {form.variant_options && form.variant_options.length > 1 && (
                        <div className="form-group">
                          <label className="form-label">Variant</label>
                          <select
                            className="form-input"
                            value={form.variant_id}
                            onChange={e => handleVariantSelect(e.target.value)}
                          >
                            {form.variant_options.map(v => (
                              <option key={v.id} value={v.id}>
                                {v.title} — ${parseFloat(v.price || 0).toFixed(2)}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Selected variant info */}
                      {form.variant_id && form.variant_title && (
                        <div className="variant-info-row">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>Variant: <strong>{form.variant_title}</strong></span>
                        </div>
                      )}

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
                            placeholder={form.offer_type === 'warranty' ? 'Add Protection' : 'Add to Order'} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ==================== DISCOUNT/OFFER SECTION ==================== */}
              <div className="collapsible-section">
                <SectionHeader
                  title={form.offer_type === 'warranty' ? 'Warranty Details' : 'Discount / Offer'}
                  isOpen={openSections.discount}
                  onToggle={() => toggleSection('discount')}
                  badge={sectionSummary.discount}
                />
                {openSections.discount && (
                  <div className="section-body">
                    {form.offer_type === 'discount' && (
                      <>
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
                        <div className="form-group">
                          <label className="form-label">Button Text <span className="optional">(optional)</span></label>
                          <input className="form-input" type="text"
                            value={form.button_text}
                            onChange={e => updateField('button_text', e.target.value)}
                            placeholder="Get Discount Code" />
                        </div>
                      </>
                    )}

                    {form.offer_type === 'warranty' && (
                      <>
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
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* ==================== APPEARANCE (BADGE) SECTION ==================== */}
              <div className="collapsible-section">
                <SectionHeader
                  title="Appearance"
                  isOpen={openSections.appearance}
                  onToggle={() => toggleSection('appearance')}
                  badge={sectionSummary.appearance}
                />
                {openSections.appearance && (
                  <div className="section-body">
                    <div className="urgency-options">
                      <label className="toggle-label">
                        <span>Show offer badge</span>
                        <label className="toggle">
                          <input type="checkbox" checked={form.show_badge}
                            onChange={e => updateField('show_badge', e.target.checked)} />
                          <span className="toggle-slider" />
                        </label>
                      </label>
                      {form.show_badge && (
                        <>
                          <div className="form-group" style={{ marginTop: '12px' }}>
                            <label className="form-label">Badge Text</label>
                            <input className="form-input" type="text"
                              value={form.badge_text}
                              onChange={e => updateField('badge_text', e.target.value)}
                              placeholder="One-time offer" />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Badge Color</label>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input
                                type="color"
                                value={form.badge_color || '#8b5cf6'}
                                onChange={e => updateField('badge_color', e.target.value)}
                                style={{ width: '40px', height: '36px', borderRadius: '6px', border: '1px solid #27272a', cursor: 'pointer', padding: '2px' }}
                              />
                              <input className="form-input" type="text"
                                value={form.badge_color}
                                onChange={e => updateField('badge_color', e.target.value)}
                                placeholder="#8b5cf6" />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ==================== TIMER SECTION ==================== */}
              <div className="collapsible-section">
                <SectionHeader
                  title="Countdown Timer"
                  isOpen={openSections.timer}
                  onToggle={() => toggleSection('timer')}
                  badge={sectionSummary.timer}
                />
                {openSections.timer && (
                  <div className="section-body">
                    <div className="urgency-options">
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
                )}
              </div>

            </div>

            {/* Right: Live Visual Preview */}
            <div className="offer-editor-preview-col">
              <div className="preview-label">Live Preview</div>
              <VisualPreview form={previewForm} shop={shop} />
            </div>
          </div>
        )}

        {/* Footer */}
        {!previewOnly && (
          <div className="offer-editor-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn-primary" onClick={handleSave}>Save Offer</button>
          </div>
        )}
        {previewOnly && (
          <div className="offer-editor-footer">
            <button type="button" className="btn-secondary" onClick={() => setPreviewOnly(false)}>
              ← Back to Editor
            </button>
            <button type="button" className="btn-primary" onClick={handleSave}>Save Offer</button>
          </div>
        )}

        {/* Full Screen Preview Modal */}
        {fullScreenPreview && (
          <div className="fullscreen-preview-overlay" onClick={() => setFullScreenPreview(false)}>
            <div className="fullscreen-preview-modal" onClick={e => e.stopPropagation()}>
              <div className="fullscreen-preview-header">
                <span className="fullscreen-preview-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                    <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
                  </svg>
                  Full Screen Preview
                </span>
                <button className="fullscreen-preview-close" onClick={() => setFullScreenPreview(false)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div className="fullscreen-preview-content">
                <VisualPreview form={previewForm} fullSize shop={shop} />
              </div>
            </div>
          </div>
        )}

      <style>{`
        .offer-editor-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.7);
          display: flex; align-items: stretch; justify-content: flex-end;
          z-index: 2000; backdrop-filter: blur(4px);
        }
        .offer-editor-panel {
          width: 1000px; max-width: 98vw;
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
        .header-controls { display: flex; align-items: center; gap: 12px; }
        .preview-mode-btn {
          display: flex; align-items: center; gap: 6px;
          background: #27272a; border: 1px solid #3f3f46; color: #a1a1aa;
          padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500;
          transition: all 0.15s;
        }
        .preview-mode-btn:hover { background: #3f3f46; color: #fafafa; }
        .preview-mode-btn.active { background: #8b5cf6; border-color: #8b5cf6; color: #fff; }
        .offer-editor-body {
          display: flex; flex: 1; overflow: hidden;
        }
        .offer-editor-form-col {
          flex: 1.2; overflow-y: auto; padding: 20px 24px;
          display: flex; flex-direction: column; gap: 0;
        }
        .offer-editor-preview-col {
          width: 380px; flex-shrink: 0; overflow-y: auto;
          padding: 24px; background: #0f0f14; border-left: 1px solid #27272a;
        }
        .offer-editor-preview-only {
          flex: 1; overflow-y: auto; padding: 32px;
          background: #0f0f14; display: flex; align-items: flex-start; justify-content: center;
        }
        .offer-editor-footer {
          display: flex; justify-content: flex-end; gap: 12px;
          padding: 16px 24px; border-top: 1px solid #27272a; flex-shrink: 0;
        }
        .preview-label {
          font-size: 12px; font-weight: 600; color: #71717a;
          text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;
        }
        .sticky-offer-type {
          position: sticky; top: 0; z-index: 10;
          background: #18181b; padding: 12px 0 16px;
          border-bottom: 1px solid #27272a; margin-bottom: 16px;
        }

        /* Form base styles */
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-label { font-size: 12px; font-weight: 600; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.4px; }
        .form-input {
          background: #27272a; border: 1px solid #3f3f46; color: #fafafa;
          padding: 8px 12px; border-radius: 6px; font-size: 14px; width: 100%;
          box-sizing: border-box; transition: border-color 0.15s;
        }
        .form-input:focus { outline: none; border-color: #8b5cf6; }
        .form-input::placeholder { color: #52525b; }
        textarea.form-input { resize: vertical; min-height: 60px; }
        .form-row { display: flex; gap: 12px; }
        .form-row .form-group { flex: 1; }
        .optional { font-weight: 400; color: #71717a; text-transform: none; }
        select.form-input { cursor: pointer; }

        /* Upsell type selector */
        .upsell-type-selector { display: flex; gap: 8px; margin-top: 8px; }
        .upsell-type-btn {
          display: flex; align-items: center; gap: 6px;
          background: #27272a; border: 1px solid #3f3f46; color: #a1a1aa;
          padding: 7px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500;
          transition: all 0.15s; flex: 1; justify-content: center;
        }
        .upsell-type-btn:hover { border-color: #8b5cf6; color: #fafafa; }
        .upsell-type-btn.active { background: #8b5cf6; border-color: #8b5cf6; color: #fff; }

        /* Collapsible sections */
        .collapsible-section {
          border: 1px solid #27272a; border-radius: 8px; margin-bottom: 12px; overflow: hidden;
        }
        .section-header {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 14px; cursor: pointer;
          background: #1c1c1f; user-select: none;
          transition: background 0.15s;
        }
        .section-header:hover { background: #27272a; }
        .section-title { font-size: 13px; font-weight: 600; color: #fafafa; flex: 1; }
        .section-badge { font-size: 11px; color: #71717a; background: #27272a; padding: 2px 8px; border-radius: 4px; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .section-chevron { color: #71717a; transition: transform 0.2s; flex-shrink: 0; }
        .section-chevron.open { transform: rotate(180deg); }
        .section-body { padding: 14px; display: flex; flex-direction: column; gap: 12px; background: #18181b; }

        /* Product search */
        .product-search-wrapper { display: flex; gap: 8px; align-items: center; }
        .product-search-thumb { width: 44px; height: 44px; border-radius: 6px; object-fit: cover; flex-shrink: 0; border: 1px solid #27272a; }
        .product-search-input-wrap { flex: 1; position: relative; }
        .product-clear-btn {
          position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
          background: none; border: none; color: #71717a; cursor: pointer; font-size: 18px;
          line-height: 1;
        }
        .product-search-dropdown {
          margin-top: 8px; background: #0f0f14; border: 1px solid #27272a;
          border-radius: 8px; overflow: hidden;
        }
        .product-search-dropdown .search-input { border-radius: 0; border: none; border-bottom: 1px solid #27272a; }
        .product-search-dropdown .target-list { max-height: 220px; overflow-y: auto; }
        .product-search-dropdown .target-item {
          display: flex; gap: 10px; padding: 10px 12px; cursor: pointer; align-items: center;
          transition: background 0.1s;
        }
        .product-search-dropdown .target-item:hover { background: #1c1c1f; }
        .product-search-dropdown .target-thumb { width: 36px; height: 36px; border-radius: 4px; object-fit: cover; flex-shrink: 0; }
        .product-search-dropdown .target-info { flex: 1; }
        .product-search-dropdown .target-name { font-size: 13px; color: #fafafa; font-weight: 500; }
        .product-search-dropdown .target-price { font-size: 12px; color: #22c55e; font-weight: 600; }
        .product-search-dropdown .target-variants-count { font-size: 11px; color: #71717a; }

        .variant-info-row {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; color: #22c55e; background: rgba(34,197,94,0.08);
          padding: 6px 10px; border-radius: 6px; width: fit-content;
        }

        /* Urgency (badge/timer) */
        .urgency-options {
          background: #1c1c1f; border-radius: 6px; padding: 12px;
        }
        .urgency-title { font-size: 13px; font-weight: 600; color: #fafafa; margin-bottom: 10px; }

        /* Toggle */
        .toggle-label {
          display: flex; justify-content: space-between; align-items: center;
          font-size: 13px; color: #fafafa; cursor: pointer;
        }
        .toggle {
          position: relative; width: 36px; height: 20px;
        }
        .toggle input { opacity: 0; width: 0; height: 0; }
        .toggle-slider {
          position: absolute; inset: 0; background: #3f3f46; border-radius: 10px;
          transition: 0.2s; cursor: pointer;
        }
        .toggle-slider::before {
          content: ''; position: absolute; width: 14px; height: 14px;
          left: 3px; bottom: 3px; background: #fff; border-radius: 50%;
          transition: 0.2s;
        }
        .toggle input:checked + .toggle-slider { background: #8b5cf6; }
        .toggle input:checked + .toggle-slider::before { transform: translateX(16px); }

        /* Target loading/empty states */
        .target-loading, .target-empty { padding: 16px; text-align: center; font-size: 13px; color: #71717a; }

        /* Button base */
        .btn-primary {
          background: #8b5cf6; color: #fff; border: none;
          padding: 10px 20px; border-radius: 6px; cursor: pointer;
          font-size: 14px; font-weight: 600; transition: background 0.15s;
        }
        .btn-primary:hover { background: #7c3aed; }
        .btn-secondary {
          background: #27272a; color: #a1a1aa; border: 1px solid #3f3f46;
          padding: 10px 20px; border-radius: 6px; cursor: pointer;
          font-size: 14px; font-weight: 500; transition: all 0.15s;
        }
        .btn-secondary:hover { background: #3f3f46; color: #fafafa; }
        .modal-close {
          background: none; border: none; color: #71717a; cursor: pointer;
          padding: 4px; border-radius: 4px; transition: color 0.15s;
        }
        .modal-close:hover { color: #fafafa; }

        /* Fullscreen preview button */
        .fullscreen-preview-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #27272a;
          border: 1px solid #3f3f46;
          color: #a1a1aa;
          padding: 6px 14px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.15s;
        }
        .fullscreen-preview-btn:hover {
          background: #3f3f46;
          color: #fafafa;
        }

        /* Full screen preview overlay/modal */
        .fullscreen-preview-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.85);
          z-index: 3000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          backdrop-filter: blur(6px);
        }
        .fullscreen-preview-modal {
          background: #18181b;
          border-radius: 16px;
          width: 100%;
          max-width: 520px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06);
        }
        .fullscreen-preview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid #27272a;
          flex-shrink: 0;
        }
        .fullscreen-preview-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #fafafa;
        }
        .fullscreen-preview-close {
          background: #27272a;
          border: 1px solid #3f3f46;
          color: #a1a1aa;
          padding: 6px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: all 0.15s;
        }
        .fullscreen-preview-close:hover {
          background: #3f3f46;
          color: #fafafa;
        }
        .fullscreen-preview-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          justify-content: center;
          background: #0f0f14;
        }
      `}</style>
      </div>
    </div>
  );
}

function generateId() {
  return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

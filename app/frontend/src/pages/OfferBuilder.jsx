import React, { useState, useCallback } from 'react';
import { api } from '../api/index.js';
import ProductPicker from '../components/ProductPicker.jsx';
import CollectionPicker from '../components/CollectionPicker.jsx';
import DiscountCodePicker from '../components/DiscountCodePicker.jsx';
import OfferPageRenderer from '../components/shared/OfferPageRenderer.jsx';

// ── ConditionRow (Step 1) ─────────────────────────────────────────────────────

const CONDITION_TYPES = [
  { value: 'order_total', label: 'Order total', operators: ['greater_than', 'less_than', 'equals'] },
  { value: 'item_count', label: 'Item count', operators: ['greater_than', 'less_than', 'equals'] },
  { value: 'discount_code', label: 'Discount code', operators: ['equals', 'contains'] },
  { value: 'customer_tag', label: 'Customer tag', operators: ['equals', 'contains'] },
  { value: 'customer_order_count', label: 'Customer order count', operators: ['equals', 'greater_than', 'less_than'] },
  { value: 'shipping_country', label: 'Shipping country', operators: ['equals'] },
];

function ConditionRow({ condition, onChange, onRemove, onOpenDiscountPicker }) {
  const typeDef = CONDITION_TYPES.find(t => t.value === condition.type) || CONDITION_TYPES[0];

  return (
    <div className="cond-row">
      <select value={condition.type} onChange={e => onChange({ ...condition, type: e.target.value, operator: typeDef.operators[0] })}>
        {CONDITION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>
      <select value={condition.operator} onChange={e => onChange({ ...condition, operator: e.target.value })}>
        {typeDef.operators.map(op => <option key={op} value={op}>{op.replace('_', ' ')}</option>)}
      </select>
      {condition.type === 'discount_code' ? (
        <button className="picker-btn-sm" onClick={onOpenDiscountPicker}>Pick codes</button>
      ) : condition.type === 'customer_tag' ? (
        <input type="text" placeholder="tag1, tag2" value={condition.value || ''}
          onChange={e => onChange({ ...condition, value: e.target.value })} />
      ) : condition.type === 'shipping_country' ? (
        <input type="text" placeholder="US, CA, GB" value={condition.value || ''}
          onChange={e => onChange({ ...condition, value: e.target.value })} />
      ) : (
        <input type="number" placeholder="0" value={condition.value || ''}
          onChange={e => onChange({ ...condition, value: parseFloat(e.target.value) || 0 })} />
      )}
      <button className="cond-remove" onClick={onRemove}>×</button>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function OfferBuilder({ funnel, onSave, onClose }) {
  // ── State ────────────────────────────────────────────────────────────────
  const [selectedNodeId, setSelectedNodeId] = useState(funnel.nodes[0]?.id || null);
  const [activeStep, setActiveStep] = useState(1);
  const [device, setDevice] = useState('desktop');
  const [nodeStyle, setNodeStyle] = useState({});

  // Save status tracking
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [saveError, setSaveError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Trigger state (derived from funnel trigger + node conditions)
  const [triggerType, setTriggerType] = useState('any');
  const [selectedTriggerProducts, setSelectedTriggerProducts] = useState([]);
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [andConditions, setAndConditions] = useState([]);
  const [upsellType, setUpsellType] = useState('post_purchase');

  // Picker modals
  const [showProductPicker, setShowProductPicker] = useState(null);
  const [showCollectionPicker, setShowCollectionPicker] = useState(false);
  const [showDiscountPicker, setShowDiscountPicker] = useState(false);

  // ── Derived ──────────────────────────────────────────────────────────────
  const selectedNode = funnel.nodes.find(n => n.id === selectedNodeId) || null;

  // Sync funnel trigger state into local state when node changes
  // (we keep local state for the wizard; funnel is the source of truth for the tree)
  // Actually, the funnel.nodes hold all node data — we use local UI state for
  // the wizard steppers and sync back via updateNode / onSave.

  // ── Helpers ──────────────────────────────────────────────────────────────

  // Persist funnel to backend via App.jsx onSave (which calls funnel API)
  async function handleSave(data) {
    // Prevent duplicate saves
    if (saveStatus === 'saving') return;

    setSaveStatus('saving');
    setSaveError(null);

    try {
      // onSave in App.jsx calls the funnel API (create or update)
      await onSave(data);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (e) {
      console.error('Failed to save funnel:', e);
      setSaveError(e.message || 'Failed to save');
      setSaveStatus('error');
    }
  }

  function updateNode(nodeId, updates) {
    const updated = funnel.nodes.map(n => n.id === nodeId ? { ...n, ...updates } : n);
    handleSave({ ...funnel, nodes: updated });
  }

  function updateStyle(updates) {
    setNodeStyle(prev => ({ ...prev, ...updates }));
  }

  function addNode() {
    if (funnel.nodes.length >= 6) return;
    const idx = funnel.nodes.length + 1;
    const newNode = {
      id: 'node_' + Date.now(),
      type: 'single_product',
      product: null,
      discount: { type: 'percentage', value: 0 },
      quantity: 1,
      headline: 'Add another item to your order',
      message: '',
      accept_button_text: 'Add to order',
      decline_button_text: 'No thanks',
      countdown_timer: { enabled: false, duration_seconds: 900, message: '' },
      on_accept_node_id: null,
      on_decline_node_id: null,
      position: { x: 0, y: 0 },
    };
    const updatedFunnel = { ...funnel, nodes: [...funnel.nodes, newNode] };
    handleSave(updatedFunnel);
    setSelectedNodeId(newNode.id);
    setActiveStep(1);
    setNodeStyle({});
    // Auto-fetch first Shopify product and pre-populate the node
    api.getShopifyProducts('', null, 1).then(data => {
      if (data.products?.length > 0) {
        const p = data.products[0];
        const firstVariant = p.variants?.find(v => v.inventory_quantity > 0) || p.variants?.[0];
        if (firstVariant) {
          updateNode(newNode.id, {
            product: {
              product_id: String(p.id),
              variant_id: String(firstVariant.id),
              title: p.title,
              variant_title: firstVariant.title,
              original_price: firstVariant.price,
              compare_at_price: firstVariant.compare_at_price || null,
              image_url: firstVariant.image || p.image,
              images: p.images,
              description: p.description || '',
            }
          });
        }
      }
    }).catch(() => { /* silently ignore — user can still pick manually */ });
  }

  function removeNode(nodeId) {
    if (funnel.nodes.length <= 1) return;
    const newNodes = funnel.nodes.filter(n => n.id !== nodeId);
    handleSave({ ...funnel, nodes: newNodes });
    setSelectedNodeId(newNodes[0]?.id || null);
  }

  function addAndCondition() {
    setAndConditions(prev => [...prev, { type: 'order_total', operator: 'greater_than', value: 50 }]);
  }

  function updateAndCondition(index, updated) {
    setAndConditions(prev => prev.map((c, i) => i === index ? updated : c));
  }

  function removeAndCondition(index) {
    setAndConditions(prev => prev.filter((_, i) => i !== index));
  }

  // ── Picker handlers ───────────────────────────────────────────────────────

  function handleProductSelect({ product, variant }) {
    if (showProductPicker === 'trigger') {
      setSelectedTriggerProducts(prev => {
        const exists = prev.find(p => p.id === product.id);
        return exists ? prev.filter(p => p.id !== product.id) : [...prev, product];
      });
      setShowProductPicker(null);
      return;
    }
    if (showProductPicker === 'offer') {
      updateNode(selectedNodeId, {
        product: {
          product_id: String(product.id),
          variant_id: String(variant.id),
          title: product.title,
          variant_title: variant.title,
          original_price: variant.price,
          compare_at_price: variant.compare_at_price || null,
          image_url: variant.image || product.image,
          images: product.images,
          description: product.description || '',
        }
      });
      setShowProductPicker(null);
      return;
    }
    setShowProductPicker(null);
  }

  function handleCollectionSelect(collections) {
    setSelectedCollections(collections);
    setShowCollectionPicker(false);
  }

  function handleDiscountSelect(codes) {
    setAndConditions(prev => {
      const filtered = prev.filter(c => c.type !== 'discount_code');
      return [...filtered, ...codes.map(code => ({ type: 'discount_code', operator: 'contains', value: code.title }))];
    });
    setShowDiscountPicker(false);
  }

  function removeTriggerProduct(id) {
    setSelectedTriggerProducts(prev => prev.filter(p => p.id !== id));
  }

  function removeCollection(id) {
    setSelectedCollections(prev => prev.filter(c => c.id !== id));
  }

  // ── Step labels ───────────────────────────────────────────────────────────

  const STEP_LABELS = ['Triggers', 'Offer', 'Style'];

  // ── Render Step 1 ─────────────────────────────────────────────────────────

  function renderStep1() {
    if (!selectedNode) return null;
    return (
      <div className="wizard-step-content">
        {/* Offer name */}
        <div className="field-group">
          <label>Offer name (internal)</label>
          <input type="text" placeholder="Offer #1" value={selectedNode.headline}
            onChange={e => updateNode(selectedNodeId, { headline: e.target.value })} />
        </div>

        {/* Upsell type */}
        <div className="field-group">
          <label>Upsell Type</label>
          <div className="radio-group">
            <label className="radio-option">
              <input type="radio" name="upsellType" value="post_purchase"
                checked={upsellType === 'post_purchase'}
                onChange={() => setUpsellType('post_purchase')} />
              <span>Post Purchase Upsell</span>
            </label>
            <label className="radio-option disabled">
              <input type="radio" name="upsellType" value="thank_you" disabled />
              <span>Thank You Page Upsell</span>
              <span className="coming-soon">Coming soon</span>
            </label>
          </div>
        </div>

        {/* Show upsell when */}
        <div className="field-group">
          <label>Show upsell when customer orders</label>
          <div className="radio-group">
            <label className="radio-option">
              <input type="radio" name="triggerType" value="any"
                checked={triggerType === 'any'}
                onChange={() => setTriggerType('any')} />
              <span>Any product</span>
            </label>
            <label className="radio-option">
              <input type="radio" name="triggerType" value="any_except"
                checked={triggerType === 'any_except'}
                onChange={() => setTriggerType('any_except')} />
              <span>Any product except selected</span>
            </label>
            <label className="radio-option">
              <input type="radio" name="triggerType" value="specific"
                checked={triggerType === 'specific'}
                onChange={() => setTriggerType('specific')} />
              <span>Specific selected products</span>
            </label>
            <label className="radio-option">
              <input type="radio" name="triggerType" value="collection"
                checked={triggerType === 'collection'}
                onChange={() => setTriggerType('collection')} />
              <span>Products in selected collections</span>
            </label>
          </div>

          {/* Product multi-select */}
          {(triggerType === 'any_except' || triggerType === 'specific') && (
            <div className="inline-picker">
              <button className="picker-btn" onClick={() => setShowProductPicker('trigger')}>
                {selectedTriggerProducts.length === 0 ? '+ Select products' : `${selectedTriggerProducts.length} product(s) selected`}
              </button>
              {selectedTriggerProducts.length > 0 && (
                <div className="selected-tags">
                  {selectedTriggerProducts.map(p => (
                    <span key={p.id} className="tag">
                      {p.title}
                      <button onClick={() => removeTriggerProduct(p.id)}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Collection multi-select */}
          {triggerType === 'collection' && (
            <div className="inline-picker">
              <button className="picker-btn" onClick={() => setShowCollectionPicker(true)}>
                {selectedCollections.length === 0 ? '+ Select collections' : `${selectedCollections.length} collection(s) selected`}
              </button>
              {selectedCollections.length > 0 && (
                <div className="selected-tags">
                  {selectedCollections.map(c => (
                    <span key={c.id} className="tag">
                      {c.title}
                      <button onClick={() => removeCollection(c.id)}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* AND conditions */}
        <div className="field-group">
          <div className="condition-card">
            <div className="condition-card-header">
              <span className="condition-card-title">AND</span>
              <span className="condition-card-hint">Additional conditions when this deal will be triggered (e.g. order total is higher than $50)</span>
            </div>
            {andConditions.map((c, i) => (
              <ConditionRow
                key={i}
                condition={c}
                onChange={updated => updateAndCondition(i, updated)}
                onRemove={() => removeAndCondition(i)}
                onOpenDiscountPicker={() => setShowDiscountPicker(true)}
              />
            ))}
            <button className="add-condition-btn" onClick={addAndCondition}>+ Add condition</button>
          </div>
        </div>

        {/* Flow Control */}
        <div className="field-group">
          <div className="condition-card">
            <div className="condition-card-header">
              <span className="condition-card-title">Flow Control</span>
              <span className="condition-card-hint">Define what happens after this offer — chain upsells and downsells together</span>
            </div>

            {/* On Accept */}
            <div className="flow-row">
              <div className="flow-label">
                <span className="flow-icon accept">✓</span>
                <span>If accepted</span>
              </div>
              <select
                value={selectedNode.on_accept_node_id || ''}
                onChange={e => updateNode(selectedNodeId, { on_accept_node_id: e.target.value || null })}
                className="flow-select"
              >
                <option value="">End of funnel</option>
                {funnel.nodes.filter(n => n.id !== selectedNodeId).map(n => (
                  <option key={n.id} value={n.id}>
                    {n.headline || 'Untitled'} ({n.id.startsWith('node_') ? 'Upsell' : 'Downsell'})
                  </option>
                ))}
              </select>
            </div>

            {/* On Decline */}
            <div className="flow-row">
              <div className="flow-label">
                <span className="flow-icon decline">✗</span>
                <span>If declined</span>
              </div>
              <select
                value={selectedNode.on_decline_node_id || ''}
                onChange={e => updateNode(selectedNodeId, { on_decline_node_id: e.target.value || null })}
                className="flow-select"
              >
                <option value="">End of funnel</option>
                {funnel.nodes.filter(n => n.id !== selectedNodeId).map(n => (
                  <option key={n.id} value={n.id}>
                    {n.headline || 'Untitled'} ({n.id.startsWith('node_') ? 'Upsell' : 'Downsell'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Render Step 2 ─────────────────────────────────────────────────────────

  function renderStep2() {
    if (!selectedNode) return null;
    const node = selectedNode;

    return (
      <div className="wizard-step-content">
        {/* Product */}
        <div className="field-group">
          <label>Product to offer *</label>
          {node.product?.product_id ? (
            <div className="selected-product-row">
              <img
                src={node.product.image_url || node.product.images?.[0]?.url || ''}
                className="sp-thumb"
                alt=""
              />
              <div className="sp-info">
                <div className="sp-title">{node.product.title}</div>
                <div className="sp-variant">{node.product.variant_title || 'Default variant'}</div>
              </div>
              <button className="sp-change" onClick={() => setShowProductPicker('offer')}>Change</button>
            </div>
          ) : (
            <button className="select-product-btn" onClick={() => setShowProductPicker('offer')}>
              + Select product
            </button>
          )}
        </div>

        {/* Variant */}
        {node.product?.product_id && (
          <div className="field-group">
            <label>Variant *</label>
            <div className="variant-grid">
              {(node.product.variants || []).map(v => (
                <button
                  key={v.id}
                  className={`variant-btn ${String(node.product.variant_id) === String(v.id) ? 'selected' : ''}`}
                  onClick={() => updateNode(node.id, {
                    product: {
                      ...node.product,
                      variant_id: String(v.id),
                      variant_title: v.title,
                      original_price: v.price,
                      image_url: v.image || node.product.image_url,
                    }
                  })}
                >
                  <div className="vb-title">{v.title}</div>
                  <div className="vb-price">${parseFloat(v.price || 0).toFixed(2)}</div>
                  {v.inventory_quantity === 0 && <span className="vb-oos">Out of stock</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantity */}
        <div className="field-group">
          <label>Quantity</label>
          <div className="qty-control">
            <button onClick={() => updateNode(node.id, { quantity: Math.max(1, node.quantity - 1) })}>−</button>
            <input type="number" min="1" max="10"
              value={node.quantity}
              onChange={e => updateNode(node.id, { quantity: Math.min(10, parseInt(e.target.value) || 1) })} />
            <button onClick={() => updateNode(node.id, { quantity: Math.min(10, node.quantity + 1) })}>+</button>
          </div>
        </div>

        {/* Discount */}
        <div className="field-group">
          <label>Discount</label>
          <div className="discount-type-row">
            {['percentage', 'fixed_amount', 'fixed_price'].map(t => (
              <button
                key={t}
                className={`discount-type-btn ${node.discount?.type === t ? 'active' : ''}`}
                onClick={() => updateNode(node.id, { discount: { ...node.discount, type: t } })}
              >
                {t === 'percentage' ? '% Off' : t === 'fixed_amount' ? '$ Off' : 'Fixed Price'}
              </button>
            ))}
          </div>
          <div className="discount-value-row">
            <span className="discount-prefix">
              {node.discount?.type === 'percentage' ? '%' : '$'}
            </span>
            <input type="number" min="0"
              value={node.discount?.value || 0}
              onChange={e => updateNode(node.id, { discount: { ...node.discount, value: parseFloat(e.target.value) || 0 } })} />
          </div>
          {node.discount?.value > 0 && node.product?.original_price && (
            <div className="discount-preview">
              {(() => {
                // Use compare_at_price as original if checkbox is checked (Bug 4 fix)
                const compareAtPrice = node.product.compare_at_price;
                const useCompareAt = node.discount?.use_compare_at_price && compareAtPrice;
                const orig = parseFloat(useCompareAt ? compareAtPrice : node.product.original_price);
                const disc = node.discount.type === 'percentage'
                  ? orig * (1 - node.discount.value / 100)
                  : node.discount.type === 'fixed_amount'
                  ? orig - node.discount.value
                  : node.discount.value;
                return <>Customer pays <strong>${disc.toFixed(2)}</strong> (was ${orig.toFixed(2)})</>;
              })()}
            </div>
          )}
          {/* Compare-at price checkbox (Bug 4 fix) */}
          {node.product?.compare_at_price && (
            <label className="toggle-label" style={{ marginTop: '8px', fontSize: '13px', color: '#a1a1aa' }}>
              <input
                type="checkbox"
                checked={node.discount?.use_compare_at_price || false}
                onChange={e => updateNode(node.id, {
                  discount: { ...node.discount, use_compare_at_price: e.target.checked }
                })}
              />
              Use compare-at price as original ({node.product.compare_at_price})
            </label>
          )}
        </div>

        {/* Copy */}
        <div className="field-group">
          <label>Headline</label>
          <input type="text" value={node.headline || ''}
            onChange={e => updateNode(node.id, { headline: e.target.value })}
            placeholder="Add another item to your order" />
        </div>
        <div className="field-group">
          <label>Description (optional)</label>
          <textarea value={node.message || ''}
            onChange={e => updateNode(node.id, { message: e.target.value })}
            placeholder="Get it delivered with your current order — just one click away." />
        </div>
        <div className="field-group">
          <label>Accept button text</label>
          <input type="text" value={node.accept_button_text || ''}
            onChange={e => updateNode(node.id, { accept_button_text: e.target.value })}
            placeholder="Add to order" />
        </div>
        <div className="field-group">
          <label>Decline link text</label>
          <input type="text" value={node.decline_button_text || ''}
            onChange={e => updateNode(node.id, { decline_button_text: e.target.value })}
            placeholder="No thanks" />
        </div>

        {/* Countdown timer */}
        <div className="field-group">
          <label className="toggle-label">
            <input type="checkbox"
              checked={!!node.countdown_timer?.enabled}
              onChange={e => updateNode(node.id, {
                countdown_timer: {
                  ...(node.countdown_timer || {}),
                  enabled: e.target.checked,
                  duration_seconds: node.countdown_timer?.duration_seconds || 900,
                  message: node.countdown_timer?.message || '',
                }
              })} />
            Show countdown timer
          </label>
          {node.countdown_timer?.enabled && (
            <>
              <div className="sub-field">
                <label>Duration (minutes)</label>
                <input type="number" min="1" max="60"
                  value={(node.countdown_timer.duration_seconds || 900) / 60}
                  onChange={e => updateNode(node.id, {
                    countdown_timer: {
                      ...node.countdown_timer,
                      duration_seconds: (parseInt(e.target.value) || 15) * 60,
                    }
                  })} />
              </div>
              <div className="sub-field">
                <label>Banner message</label>
                <input type="text" value={node.countdown_timer.message || ''}
                  onChange={e => updateNode(node.id, {
                    countdown_timer: { ...node.countdown_timer, message: e.target.value }
                  })} />
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Render Step 3 ─────────────────────────────────────────────────────────

  function renderStep3() {
    return (
      <div className="wizard-step-content">
        <div className="field-group">
          <label>Background color</label>
          <div className="color-row">
            <input type="color" value={nodeStyle.background_color || '#ffffff'}
              onChange={e => updateStyle({ background_color: e.target.value })} />
            <input type="text" value={nodeStyle.background_color || '#ffffff'}
              onChange={e => updateStyle({ background_color: e.target.value })} />
          </div>
        </div>
        <div className="field-group">
          <label>Primary button color</label>
          <div className="color-row">
            <input type="color" value={nodeStyle.primary_color || '#8b5cf6'}
              onChange={e => updateStyle({ primary_color: e.target.value })} />
            <input type="text" value={nodeStyle.primary_color || '#8b5cf6'}
              onChange={e => updateStyle({ primary_color: e.target.value })} />
          </div>
        </div>
        <div className="field-group">
          <label>Text color</label>
          <div className="color-row">
            <input type="color" value={nodeStyle.text_color || '#1a1a1a'}
              onChange={e => updateStyle({ text_color: e.target.value })} />
            <input type="text" value={nodeStyle.text_color || '#1a1a1a'}
              onChange={e => updateStyle({ text_color: e.target.value })} />
          </div>
        </div>
        <div className="field-group">
          <label>Discount badge color</label>
          <div className="color-row">
            <input type="color" value={nodeStyle.badge_color || '#22c55e'}
              onChange={e => updateStyle({ badge_color: e.target.value })} />
            <input type="text" value={nodeStyle.badge_color || '#22c55e'}
              onChange={e => updateStyle({ badge_color: e.target.value })} />
          </div>
        </div>
        <div className="field-group">
          <label>Font family</label>
          <select value={nodeStyle.font_family || '-apple-system, sans-serif'}
            onChange={e => updateStyle({ font_family: e.target.value })}>
            <option value="-apple-system, BlinkMacSystemFont, sans-serif">System</option>
            <option value="Inter, sans-serif">Inter</option>
            <option value="Helvetica Neue, Helvetica, Arial, sans-serif">Helvetica</option>
            <option value="Georgia, serif">Georgia</option>
          </select>
        </div>
        <div className="field-group">
          <label>Border radius: {nodeStyle.border_radius || 10}px</label>
          <input type="range" min="0" max="24" value={nodeStyle.border_radius || 10}
            onChange={e => updateStyle({ border_radius: parseInt(e.target.value) })}
            className="range-input" />
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (!funnel.nodes || funnel.nodes.length === 0) {
    return (
      <div className="ob-wizard">
        <div className="ob-empty-state">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#3f3f46" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <h2>Create your first offer</h2>
          <p>Add upsell and downsell nodes to build your funnel.</p>
          <button className="ob-next" onClick={addNode}>+ Add Offer</button>
        </div>
        <style>{OB_CSS}</style>
      </div>
    );
  }

  return (
    <div className="ob-wizard">
      {/* Top tabs */}
      <div className="ob-tabs">
        {funnel.nodes.map((node, idx) => (
          <button
            key={node.id}
            className={`ob-tab ${selectedNodeId === node.id ? 'active' : ''}`}
            onClick={() => { setSelectedNodeId(node.id); setActiveStep(1); }}
          >
            <span className="ob-tab-num">{idx + 1}</span>
            <span className="ob-tab-label">{node.headline || 'Untitled'}</span>
            <span className="ob-tab-badge">{node.type === 'downsell' ? 'Downsell' : 'Upsell'}</span>
            {funnel.nodes.length > 1 && (
              <button className="ob-tab-close" onClick={e => { e.stopPropagation(); removeNode(node.id); }}>×</button>
            )}
          </button>
        ))}
        {funnel.nodes.length < 6 && (
          <button className="ob-tab-add" onClick={addNode}>+</button>
        )}
      </div>

      {/* Body */}
      <div className="ob-body">
        {/* Left config panel */}
        <div className="ob-config">
          {/* Step nav */}
          <div className="ob-step-nav">
            {STEP_LABELS.map((label, idx) => {
              const stepNum = idx + 1;
              const isDone = activeStep > stepNum;
              const isActive = activeStep === stepNum;
              return (
                <React.Fragment key={stepNum}>
                  {idx > 0 && <div className={`ob-step-line ${isDone ? 'done' : ''}`} />}
                  <div
                    className={`ob-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
                    onClick={() => setActiveStep(stepNum)}
                  >
                    <div className="ob-step-num">
                      {isDone ? '✓' : stepNum}
                    </div>
                    <span>{label}</span>
                  </div>
                </React.Fragment>
              );
            })}
            {/* Save button in step nav area (Bug 3 fix) */}
            <button
              className="ob-save-sm"
              onClick={() => handleSave(funnel)}
              disabled={saveStatus === 'saving'}
            >
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'error' ? '⚠ Error' : 'Save'}
            </button>
          </div>
          {/* Step content */}
          <div className="ob-scroll-area">
            {activeStep === 1 && renderStep1()}
            {activeStep === 2 && renderStep2()}
            {activeStep === 3 && renderStep3()}
          </div>

          {/* Navigation */}
          <div className="ob-nav">
            {activeStep > 1 && (
              <button className="ob-back" onClick={() => setActiveStep(s => s - 1)}>← Back</button>
            )}
            <div style={{ flex: 1 }} />
            {activeStep < 3 ? (
              <button className="ob-next" onClick={() => setActiveStep(s => s + 1)}>Next Step →</button>
            ) : (
              <button className="ob-next" onClick={() => { if (onClose) onClose(); }}>Done</button>
            )}
          </div>
        </div>

        {/* Right preview panel */}
        <div className="preview-panel">
          <div className="preview-toolbar">
            <span className="preview-label">Live Preview</span>
            <div className="device-toggle">
              <button className={device === 'desktop' ? 'active' : ''} onClick={() => setDevice('desktop')}>Desktop</button>
              <button className={device === 'mobile' ? 'active' : ''} onClick={() => setDevice('mobile')}>Mobile</button>
              <button className={device === 'full' ? 'active' : ''} onClick={() => setDevice('full')}>Full</button>
            </div>
          </div>
          <div className="preview-area">
            <div style={{
              width: device === 'mobile' ? '375px' : device === 'full' ? '100%' : '600px',
              transition: 'width 0.2s',
              maxHeight: '800px',
              overflowY: 'auto',
            }}>
              <OfferPageRenderer
                node={selectedNode}
                style={nodeStyle}
                fullWidth={device === 'full'}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Picker modals */}
      {showProductPicker && (
        <ProductPicker
          isOpen={true}
          onClose={() => setShowProductPicker(null)}
          onSelect={handleProductSelect}
          multiSelect={showProductPicker === 'trigger'}
        />
      )}

      {showCollectionPicker && (
        <CollectionPicker
          isOpen={true}
          onClose={() => setShowCollectionPicker(false)}
          onSelect={handleCollectionSelect}
          selectedIds={selectedCollections.map(c => c.id)}
        />
      )}

      {showDiscountPicker && (
        <DiscountCodePicker
          isOpen={true}
          onClose={() => setShowDiscountPicker(false)}
          onSelect={handleDiscountSelect}
          selectedIds={[]}
        />
      )}

      <style>{OB_CSS}</style>
    </div>
  );
}

// ── CSS ──────────────────────────────────────────────────────────────────────

const OB_CSS = `
.ob-wizard { display: flex; flex-direction: column; height: 100%; background: #0f0f14; color: #fafafa; min-height: 0; }

/* Empty state */
.ob-empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; gap: 12px; color: #71717a; text-align: center; padding: 40px; }
.ob-empty-state h2 { color: #fafafa; margin: 0; font-size: 20px; }
.ob-empty-state p { margin: 0; font-size: 14px; }

/* Top tabs */
.ob-tabs { display: flex; gap: 4px; padding: 12px 20px 0; border-bottom: 1px solid #27272a; background: #18181b; overflow-x: auto; }
.ob-tab { display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: transparent; border: 1px solid transparent; border-bottom: none; border-radius: 10px 10px 0 0; color: #71717a; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
.ob-tab:hover { color: #fafafa; background: #27272a; }
.ob-tab.active { background: #0f0f14; color: #fafafa; border-color: #27272a; }
.ob-tab-num { width: 18px; height: 18px; border-radius: 50%; background: #27272a; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; }
.ob-tab.active .ob-tab-num { background: #8b5cf6; }
.ob-tab-label { max-width: 120px; overflow: hidden; text-overflow: ellipsis; }
.ob-tab-badge { font-size: 10px; background: #27272a; color: #a1a1aa; padding: 1px 6px; border-radius: 4px; font-weight: 600; }
.ob-tab.active .ob-tab-badge { background: rgba(139,92,246,0.2); color: #a78bfa; }
.ob-tab-close { background: none; border: none; color: #52525b; cursor: pointer; font-size: 16px; line-height: 1; padding: 0 2px; margin-left: 2px; }
.ob-tab-close:hover { color: #ef4444; }
.ob-tab-add { padding: 10px 14px; color: #8b5cf6; background: none; border: none; cursor: pointer; font-size: 18px; font-weight: 600; }

/* Body */
.ob-body { display: flex; flex: 1; min-height: 0; overflow: hidden; }

/* Left panel */
.ob-config { width: 380px; flex-shrink: 0; background: #18181b; border-right: 1px solid #27272a; display: flex; flex-direction: column; overflow-y: auto; }
.ob-scroll-area { flex: 1; overflow-y: auto; }

/* Step nav */
.ob-step-nav { display: flex; align-items: center; padding: 16px 20px; border-bottom: 1px solid #27272a; gap: 0; flex-shrink: 0; justify-content: space-between; }
.ob-step { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #52525b; cursor: pointer; transition: color 0.15s; }
.ob-step.active { color: #8b5cf6; font-weight: 700; }
.ob-step.done { color: #22c55e; }
.ob-step-num { width: 20px; height: 20px; border-radius: 50%; border: 2px solid currentColor; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; }
.ob-step.done .ob-step-num { background: #22c55e; border-color: #22c55e; color: white; }
.ob-step.active .ob-step-num { background: #8b5cf6; border-color: #8b5cf6; color: white; }
.ob-step-line { flex: 1; height: 2px; background: #27272a; margin: 0 8px; align-self: center; }
.ob-step.done .ob-step-line { background: #22c55e; }
.ob-save-sm { background: #27272a; border: 1px solid #3f3f46; color: #a1a1aa; padding: 5px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; transition: all 0.15s; white-space: nowrap; margin-left: 12px; }
.ob-save-sm:hover { background: #3f3f46; color: #fafafa; border-color: #52525b; }
.ob-save-sm:disabled { opacity: 0.6; cursor: not-allowed; }

/* Step content */
.wizard-step-content { padding: 20px; display: flex; flex-direction: column; gap: 16px; }

/* Field groups */
.field-group { display: flex; flex-direction: column; gap: 6px; }
.field-group > label { font-size: 11px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; }
.field-group input[type=text],
.field-group input[type=number],
.field-group textarea,
.field-group select { background: #0f0f14; border: 1px solid #27272a; color: #fafafa; padding: 9px 12px; border-radius: 8px; font-size: 14px; width: 100%; box-sizing: border-box; }
.field-group input:focus,
.field-group textarea:focus,
.field-group select:focus { outline: none; border-color: #8b5cf6; }
.field-group textarea { resize: vertical; min-height: 64px; }

/* Radio groups */
.radio-group { display: flex; flex-direction: column; gap: 6px; }
.radio-option { display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: #0f0f14; border: 1px solid #27272a; border-radius: 8px; cursor: pointer; font-size: 13px; color: #a1a1aa; transition: all 0.1s; }
.radio-option:hover { border-color: #3f3f46; color: #fafafa; }
.radio-option input { accent-color: #8b5cf6; width: 16px; height: 16px; }
.radio-option.disabled { opacity: 0.5; cursor: not-allowed; }
.coming-soon { font-size: 10px; background: #f59e0b; color: #000; padding: 1px 6px; border-radius: 4px; font-weight: 700; margin-left: auto; }

/* Toggle/checkbox labels */
.toggle-label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; }
.toggle-label input[type=checkbox] { accent-color: #8b5cf6; width: 16px; height: 16px; }

/* Inline picker */
.inline-picker { margin-top: 8px; }
.picker-btn { background: rgba(139,92,246,0.1); border: 2px dashed rgba(139,92,246,0.3); color: #a78bfa; padding: 8px 14px; border-radius: 8px; width: 100%; font-size: 13px; font-weight: 600; cursor: pointer; text-align: left; transition: all 0.15s; }
.picker-btn:hover { border-color: #8b5cf6; background: rgba(139,92,246,0.2); }
.picker-btn-sm { background: #27272a; border: 1px solid #3f3f46; color: #a1a1aa; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; }
.selected-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.tag { display: inline-flex; align-items: center; gap: 4px; background: #27272a; border: 1px solid #3f3f46; color: #a1a1aa; padding: 3px 8px; border-radius: 6px; font-size: 12px; }
.tag button { background: none; border: none; color: #71717a; cursor: pointer; font-size: 14px; padding: 0; line-height: 1; }
.tag button:hover { color: #ef4444; }

/* Condition card */
.condition-card { background: #0f0f14; border: 1px solid #27272a; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
.condition-card-header { display: flex; flex-direction: column; gap: 2px; }
.condition-card-title { font-size: 11px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; }
.condition-card-hint { font-size: 11px; color: #52525b; line-height: 1.4; }
.cond-row { display: flex; gap: 6px; align-items: center; }
.cond-row select { flex: 1; background: #18181b; border: 1px solid #27272a; color: #fafafa; padding: 7px 10px; border-radius: 6px; font-size: 13px; }
.cond-row input { flex: 1; background: #18181b; border: 1px solid #27272a; color: #fafafa; padding: 7px 10px; border-radius: 6px; font-size: 13px; }
.cond-row input:focus, .cond-row select:focus { outline: none; border-color: #8b5cf6; }
.cond-remove { background: none; border: none; color: #52525b; cursor: pointer; font-size: 16px; padding: 0 4px; }
.cond-remove:hover { color: #ef4444; }
.add-condition-btn { border: 2px dashed #27272a; color: #71717a; padding: 8px; border-radius: 8px; width: 100%; font-size: 12px; font-weight: 600; cursor: pointer; background: none; transition: all 0.15s; }
.add-condition-btn:hover { border-color: #8b5cf6; color: #a78bfa; }

/* Navigation buttons */
.ob-nav { display: flex; justify-content: space-between; padding: 16px 20px; border-top: 1px solid #27272a; flex-shrink: 0; }
.ob-back { background: none; border: 1px solid #27272a; color: #a1a1aa; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
.ob-save { background: #0a8754; border: none; color: white; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; }
.ob-save:hover { background: #0d9668; }
.ob-next { background: #8b5cf6; border: none; color: white; padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; }
.ob-next:hover { background: #7c3aed; }

/* Selected product row */
.selected-product-row { display: flex; gap: 10px; align-items: center; background: #0f0f14; border: 1px solid #27272a; border-radius: 8px; padding: 10px; }
.sp-thumb { width: 48px; height: 48px; object-fit: cover; border-radius: 6px; flex-shrink: 0; }
.sp-info { flex: 1; min-width: 0; }
.sp-title { font-size: 13px; font-weight: 600; color: #fafafa; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sp-variant { font-size: 11px; color: #71717a; margin-top: 2px; }
.sp-change { background: none; border: 1px solid #27272a; color: #a78bfa; padding: 5px 10px; border-radius: 6px; font-size: 12px; cursor: pointer; white-space: nowrap; }
.select-product-btn { background: rgba(139,92,246,0.1); border: 2px dashed rgba(139,92,246,0.4); color: #a78bfa; padding: 14px; border-radius: 10px; width: 100%; font-weight: 600; cursor: pointer; font-size: 14px; }

/* Variant grid */
.variant-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.variant-btn { background: #0f0f14; border: 2px solid #27272a; border-radius: 8px; padding: 10px; text-align: left; cursor: pointer; transition: all 0.15s; position: relative; }
.variant-btn:hover { border-color: #3f3f46; }
.variant-btn.selected { border-color: #8b5cf6; background: rgba(139,92,246,0.08); }
.vb-title { font-size: 13px; font-weight: 500; color: #fafafa; margin-bottom: 2px; }
.vb-price { font-size: 13px; font-weight: 700; color: #a1a1aa; }
.vb-oos { position: absolute; top: 6px; right: 6px; font-size: 10px; background: rgba(239,68,68,0.15); color: #ef4444; padding: 1px 6px; border-radius: 4px; font-weight: 600; }

/* Qty control */
.qty-control { display: flex; align-items: center; gap: 0; width: fit-content; }
.qty-control button { width: 36px; height: 36px; background: #27272a; border: 1px solid #3f3f46; color: #fafafa; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.1s; }
.qty-control button:first-child { border-radius: 8px 0 0 8px; }
.qty-control button:last-child { border-radius: 0 8px 8px 0; }
.qty-control button:hover { background: #8b5cf6; border-color: #8b5cf6; }
.qty-control input { width: 60px; height: 36px; background: #0f0f14; border: 1px solid #3f3f46; border-left: none; border-right: none; color: #fafafa; text-align: center; font-size: 14px; font-weight: 700; }

/* Discount type row */
.discount-type-row { display: flex; gap: 6px; margin-bottom: 8px; }
.discount-type-btn { flex: 1; background: #27272a; border: 1px solid #3f3f46; color: #a1a1aa; padding: 7px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; text-align: center; }
.discount-type-btn.active { background: #8b5cf6; border-color: #8b5cf6; color: white; }
.discount-value-row { display: flex; align-items: center; gap: 8px; }
.discount-prefix { font-size: 18px; font-weight: 700; color: #71717a; width: 20px; }
.discount-value-row input { background: #0f0f14; border: 1px solid #27272a; color: #fafafa; padding: 9px 12px; border-radius: 8px; font-size: 14px; width: 100px; }
.discount-preview { font-size: 13px; color: #22c55e; background: rgba(34,197,94,0.08); padding: 6px 10px; border-radius: 6px; }

/* Toggle */
.toggle-label { display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 14px; color: #a1a1aa; font-weight: 500; }
.toggle-label input { accent-color: #8b5cf6; width: 16px; height: 16px; }
.sub-field { display: flex; flex-direction: column; gap: 4px; margin-top: 8px; }
.sub-field label { font-size: 11px; color: #71717a; font-weight: 600; }

/* Color row */
.color-row { display: flex; gap: 8px; align-items: center; }
.color-row input[type=color] { width: 40px; height: 36px; padding: 2px; border: 1px solid #27272a; border-radius: 6px; background: #0f0f14; cursor: pointer; }
.color-row input[type=text] { flex: 1; background: #0f0f14; border: 1px solid #27272a; color: #fafafa; padding: 8px 10px; border-radius: 8px; font-size: 13px; font-family: monospace; }
.range-input { width: 100%; accent-color: #8b5cf6; }

/* Preview panel */
.preview-panel { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.preview-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; background: #18181b; border-bottom: 1px solid #27272a; flex-shrink: 0; }
.preview-label { font-size: 11px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; }
.device-toggle { display: flex; gap: 4px; }
.device-toggle button { padding: 4px 12px; border-radius: 6px; border: 1px solid #27272a; background: transparent; color: #71717a; font-size: 12px; cursor: pointer; transition: all 0.15s; }
.device-toggle button.active { background: #8b5cf6; border-color: #8b5cf6; color: white; }
.preview-area { flex: 1; min-height: 0; overflow-y: auto; background: #0f0f14; padding: 24px; display: flex; justify-content: center; }

/* Flow Control */
.flow-row { display: flex; align-items: center; gap: 12px; padding: 4px 0; }
.flow-label { display: flex; align-items: center; gap: 6px; width: 100px; font-size: 13px; color: #a1a1aa; flex-shrink: 0; }
.flow-icon { font-size: 14px; font-weight: 700; width: 20px; text-align: center; }
.flow-icon.accept { color: #22c55e; }
.flow-icon.decline { color: #ef4444; }
.flow-select { flex: 1; background: #18181b; border: 1px solid #27272a; color: #fafafa; padding: 7px 10px; border-radius: 6px; font-size: 13px; }
.flow-select:focus { outline: none; border-color: #8b5cf6; }
`;

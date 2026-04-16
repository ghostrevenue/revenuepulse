import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api/index.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateId() {
  return 'node_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function makeNode(overrides = {}) {
  return {
    id: generateId(),
    type: 'single_product',
    product: null,
    discount: { type: 'percentage', value: 0 },
    quantity: 1,
    headline: 'Wait! Add this to your order',
    message: 'Get it delivered with your current order — just one click away.',
    accept_button_text: 'Yes, add to my order',
    decline_button_text: 'No thanks',
    countdown_timer: { enabled: false, duration_seconds: 900 },
    on_accept_node_id: null,
    on_decline_node_id: null,
    position: { x: 100, y: 100 },
    ...overrides,
  };
}

const TYPE_LABELS = {
  single_product: 'Single Product',
  bundle: 'Bundle',
  quantity_upgrade: 'Quantity Upgrade',
  subscription_upgrade: 'Subscription',
};

function getDiscountLabel(discount) {
  if (!discount || discount.value <= 0) return null;
  if (discount.type === 'percentage') return `${discount.value}% off`;
  if (discount.type === 'fixed_amount') return `$${discount.value} off`;
  if (discount.type === 'fixed_price') return `$${discount.value}`;
  return null;
}

// ── EdgeLine ─────────────────────────────────────────────────────────────────

function EdgeLine({ edge, nodes }) {
  const fromNode = edge.from;
  const toNode = nodes.find(n => n.id === edge.toId);
  if (!fromNode || !toNode) return null;

  const sx = fromNode.position.x + (edge.type === 'accept' ? 186 : 14);
  const sy = fromNode.position.y + 110;
  const tx = toNode.position.x + 100;
  const ty = toNode.position.y;

  const color = edge.type === 'accept' ? '#22c55e' : '#ef4444';
  const midY = (sy + ty) / 2;
  const path = `M ${sx} ${sy} C ${sx} ${midY}, ${tx} ${midY}, ${tx} ${ty}`;

  return (
    <g>
      <path d={path} stroke={color} strokeWidth="2" fill="none" strokeDasharray={edge.inProgress ? '6 4' : 'none'} />
      <circle cx={tx} cy={ty} r="4" fill={color} />
    </g>
  );
}

// ── ConditionRow ──────────────────────────────────────────────────────────────

const CONDITION_TYPES = [
  { value: 'cart_value_above', label: 'Cart value above $', fields: 'amount' },
  { value: 'cart_value_below', label: 'Cart value below $', fields: 'amount' },
  { value: 'cart_contains_product', label: 'Cart contains product(s)', fields: 'product_ids' },
  { value: 'cart_contains_collection', label: 'Cart contains collection(s)', fields: 'collection_ids' },
  { value: 'discount_code_applied', label: 'Discount code applied', fields: 'codes' },
  { value: 'customer_tag', label: 'Customer has tag(s)', fields: 'tags' },
  { value: 'customer_order_count', label: 'Customer order count', fields: 'operator+value' },
  { value: 'shipping_country', label: 'Shipping country is', fields: 'countries' },
];

function ConditionRow({ condition, onChange, onRemove }) {
  const typeDef = CONDITION_TYPES.find(t => t.value === condition.type) || CONDITION_TYPES[0];

  return (
    <div className="condition-row">
      <select value={condition.type} onChange={e => onChange({ ...condition, type: e.target.value })}>
        {CONDITION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>
      {typeDef.fields === 'amount' && (
        <input type="number" placeholder="$" value={condition.amount ?? ''}
          onChange={e => onChange({ ...condition, amount: parseFloat(e.target.value) || 0 })} />
      )}
      {typeDef.fields === 'codes' && (
        <input type="text" placeholder="e.g. SAVE10, FREESHIP" value={condition.codes?.join(', ') || ''}
          onChange={e => onChange({ ...condition, codes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
      )}
      {typeDef.fields === 'tags' && (
        <input type="text" placeholder="e.g. VIP, wholesale" value={condition.tags?.join(', ') || ''}
          onChange={e => onChange({ ...condition, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
      )}
      {typeDef.fields === 'operator+value' && (
        <>
          <select value={condition.operator || 'gt'} onChange={e => onChange({ ...condition, operator: e.target.value })}>
            <option value="eq">=</option>
            <option value="gt">&gt;</option>
            <option value="lt">&lt;</option>
          </select>
          <input type="number" value={condition.value ?? ''} placeholder="# orders"
            onChange={e => onChange({ ...condition, value: parseInt(e.target.value) || 0 })} />
        </>
      )}
      {typeDef.fields === 'product_ids' && (
        <span className="condition-hint">{condition.product_ids?.length || 0} product(s) selected</span>
      )}
      {typeDef.fields === 'collection_ids' && (
        <span className="condition-hint">{condition.collection_ids?.length || 0} collection(s) selected</span>
      )}
      {typeDef.fields === 'countries' && (
        <span className="condition-hint">{condition.countries?.length || 0} country(ies) selected</span>
      )}
      <button className="condition-remove" onClick={onRemove}>×</button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function OfferBuilder({ store, appConfig }) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [funnel, setFunnel] = useState({
    id: null,
    name: 'Untitled Funnel',
    status: 'draft',
    trigger: { conditions: [], match: 'all' },
    nodes: [],
  });
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [wiringMode, setWiringMode] = useState(null); // { nodeId, edgeType }
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  // Dragging
  const draggingRef = useRef(null); // { nodeId, startMouseX, startMouseY, startNodeX, startNodeY }

  // Product picker
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [ppSearch, setPpSearch] = useState('');
  const [ppResults, setPpResults] = useState([]);
  const [ppLoading, setPpLoading] = useState(false);
  const ppSearchRef = useRef(null);

  // Preview
  const [showPreview, setShowPreview] = useState(false);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const selectedNode = funnel.nodes.find(n => n.id === selectedNodeId) || null;

  const edges = [];
  funnel.nodes.forEach(node => {
    if (node.on_accept_node_id) {
      edges.push({ id: `${node.id}-accept`, from: node, toId: node.on_accept_node_id, type: 'accept' });
    }
    if (node.on_decline_node_id) {
      edges.push({ id: `${node.id}-decline`, from: node, toId: node.on_decline_node_id, type: 'decline' });
    }
  });

  // Wiring preview edge
  let wiringPreview = null;
  if (wiringMode) {
    const fromNode = funnel.nodes.find(n => n.id === wiringMode.nodeId);
    if (fromNode) {
      wiringPreview = {
        id: 'wiring-preview',
        from: fromNode,
        edgeType: wiringMode.edgeType,
      };
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function addNode() {
    const newNode = makeNode({
      position: {
        x: 100 + funnel.nodes.length * 30,
        y: 100 + funnel.nodes.length * 20,
      },
    });
    setFunnel(f => ({ ...f, nodes: [...f.nodes, newNode] }));
    setSelectedNodeId(newNode.id);
  }

  function updateNode(nodeId, updates) {
    setFunnel(f => ({
      ...f,
      nodes: f.nodes.map(n => n.id === nodeId ? { ...n, ...updates } : n),
    }));
  }

  function updateNodePosition(nodeId, pos) {
    updateNode(nodeId, { position: pos });
  }

  function removeNode(nodeId) {
    setFunnel(f => ({
      ...f,
      nodes: f.nodes.filter(n => n.id !== nodeId),
    }));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  }

  function handleWire(fromNodeId, edgeType, toNodeId) {
    const key = edgeType === 'accept' ? 'on_accept_node_id' : 'on_decline_node_id';
    updateNode(fromNodeId, { [key]: toNodeId });
    setWiringMode(null);
  }

  function updateTrigger(updater) {
    setFunnel(f => ({
      ...f,
      trigger: typeof updater === 'function' ? updater(f.trigger) : updater,
    }));
  }

  function addCondition() {
    updateTrigger(t => ({
      ...t,
      conditions: [...t.conditions, { type: 'cart_value_above', amount: 0 }],
    }));
  }

  function updateCondition(index, updated) {
    updateTrigger(t => ({
      ...t,
      conditions: t.conditions.map((c, i) => i === index ? updated : c),
    }));
  }

  function removeCondition(index) {
    updateTrigger(t => ({
      ...t,
      conditions: t.conditions.filter((_, i) => i !== index),
    }));
  }

  // ── Dragging ────────────────────────────────────────────────────────────────

  function startDrag(e, nodeId) {
    e.stopPropagation();
    const node = funnel.nodes.find(n => n.id === nodeId);
    if (!node) return;
    draggingRef.current = {
      nodeId,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startNodeX: node.position.x,
      startNodeY: node.position.y,
    };
  }

  function handleCanvasMouseMove(e) {
    // Update cursor position for wiring preview
    const rect = e.currentTarget.getBoundingClientRect();
    setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    if (!draggingRef.current) return;
    const { nodeId, startMouseX, startMouseY, startNodeX, startNodeY } = draggingRef.current;
    const dx = e.clientX - startMouseX;
    const dy = e.clientY - startMouseY;
    updateNodePosition(nodeId, {
      x: Math.max(0, startNodeX + dx),
      y: Math.max(0, startNodeY + dy),
    });
  }

  function handleCanvasMouseUp() {
    draggingRef.current = null;
  }

  // ── Node wiring click ───────────────────────────────────────────────────────

  function handleNodeClick(nodeId) {
    if (wiringMode) {
      // Complete the wiring
      if (wiringMode.nodeId !== nodeId) {
        handleWire(wiringMode.nodeId, wiringMode.edgeType, nodeId);
      } else {
        setWiringMode(null);
      }
    } else {
      setSelectedNodeId(nodeId);
    }
  }

  // ── Product picker ──────────────────────────────────────────────────────────

  function searchProducts(query) {
    clearTimeout(ppSearchRef.current);
    if (!query) { setPpResults([]); return; }
    setPpLoading(true);
    ppSearchRef.current = setTimeout(async () => {
      try {
        const res = await api.searchShopifyProducts(query, 20);
        setPpResults(res.products || res || []);
      } catch (e) {
        setPpResults([]);
      }
      setPpLoading(false);
    }, 300);
  }

  function handleSelectProduct(product) {
    const variant = product.variants?.[0];
    const variantId = variant?.id;
    const variantTitle = variant?.title !== 'Default Title' ? variant?.title : '';
    updateNode(selectedNodeId, {
      product: {
        product_id: String(product.id),
        variant_id: String(variantId || ''),
        title: product.title,
        image_url: product.image || product.images?.[0]?.src || '',
        original_price: variant?.price || '',
        variant_title: variantTitle || '',
      },
    });
    setShowProductPicker(false);
    setPpSearch('');
    setPpResults([]);
  }

  // ── Save ─────────────────────────────────────────────────────────────────────

  async function saveFunnel() {
    try {
      const payload = { name: funnel.name, trigger: funnel.trigger, nodes: funnel.nodes };
      if (funnel.id) {
        await api.put(`/api/funnels/${funnel.id}`, payload);
      } else {
        const res = await api.post('/api/funnels', payload);
        setFunnel(f => ({ ...f, id: res.funnel?.id }));
      }
    } catch (e) {
      console.warn('Backend API not yet connected — funnel saved locally only');
    }
  }

  function openPreview() {
    setShowPreview(true);
  }

  // ── Render wiring preview line ──────────────────────────────────────────────

  function getWiringLine() {
    if (!wiringMode || !wiringPreview) return null;
    const fromNode = wiringPreview.from;
    const sx = fromNode.position.x + (wiringMode.edgeType === 'accept' ? 186 : 14);
    const sy = fromNode.position.y + 110;
    const tx = cursorPos.x;
    const ty = cursorPos.y;
    return { sx, sy, tx, ty };
  }

  const wiringLine = getWiringLine();

  // ── Preview Modal ───────────────────────────────────────────────────────────

  function renderPreview() {
    if (!showPreview || !selectedNode) return null;
    const node = selectedNode;
    let discountedPrice = null;
    if (node.product?.original_price && node.discount?.value > 0) {
      const orig = parseFloat(node.product.original_price);
      if (node.discount.type === 'percentage') {
        discountedPrice = orig * (1 - node.discount.value / 100);
      } else if (node.discount.type === 'fixed_amount') {
        discountedPrice = orig - node.discount.value;
      } else if (node.discount.type === 'fixed_price') {
        discountedPrice = node.discount.value;
      }
    }

    return (
      <div className="preview-modal-overlay" onClick={() => setShowPreview(false)}>
        <div className="preview-modal" onClick={e => e.stopPropagation()}>
          <div className="preview-header">
            <span className="preview-badge">ONE-TIME OFFER</span>
            <button className="preview-close" onClick={() => setShowPreview(false)}>×</button>
          </div>
          {node.product?.image_url && (
            <img src={node.product.image_url} className="preview-product-image" alt="" />
          )}
          <div className="preview-body">
            <h2 className="preview-headline">{node.headline}</h2>
            <p className="preview-message">{node.message}</p>
            {node.product?.variant_title && (
              <p className="preview-variant">{node.product.variant_title}</p>
            )}
            <div className="preview-price-block">
              {node.product?.original_price && (
                <>
                  <span className="preview-original-price">${node.product.original_price}</span>
                  {discountedPrice !== null && (
                    <>
                      <span className="preview-discounted-price">${discountedPrice.toFixed(2)}</span>
                      {node.discount.type === 'percentage' && (
                        <span className="preview-savings">You save {node.discount.value}%</span>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
            <button className="preview-accept-btn">
              {node.accept_button_text || 'Yes, add to my order'}
              {discountedPrice !== null && ` — $${discountedPrice.toFixed(2)}`}
            </button>
            <button className="preview-decline-btn">{node.decline_button_text || 'No thanks'}</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="offer-builder-root">
      {/* Top bar */}
      <div className="funnel-topbar">
        <input
          className="funnel-name-input"
          value={funnel.name}
          onChange={e => setFunnel(f => ({ ...f, name: e.target.value }))}
        />
        <span className={`status-badge ${funnel.status}`}>{funnel.status}</span>
        <span className="node-count">{funnel.nodes.length} node{funnel.nodes.length !== 1 ? 's' : ''}</span>
        <button className="btn-secondary" onClick={saveFunnel}>Save</button>
        <button className="btn-primary" onClick={openPreview} disabled={!selectedNode}>Preview</button>
      </div>

      {/* Two-pane layout */}
      <div className="funnel-body">
        {/* Left pane */}
        <div className="left-pane">
          {/* Trigger editor */}
          <div className="trigger-editor">
            <div className="trigger-header">
              <span className="trigger-title">Trigger</span>
              <span className="trigger-sub">When does this funnel activate?</span>
            </div>
            <div className="match-toggle">
              <span className="match-label">Match:</span>
              <button
                className={funnel.trigger.match === 'all' ? 'active' : ''}
                onClick={() => updateTrigger(t => ({ ...t, match: 'all' }))}
              >ALL</button>
              <button
                className={funnel.trigger.match === 'any' ? 'active' : ''}
                onClick={() => updateTrigger(t => ({ ...t, match: 'any' }))}
              >ANY</button>
            </div>
            {funnel.trigger.conditions.map((c, i) => (
              <ConditionRow
                key={i}
                condition={c}
                onChange={c2 => updateCondition(i, c2)}
                onRemove={() => removeCondition(i)}
              />
            ))}
            <button className="add-condition-btn" onClick={addCondition}>+ Add Condition</button>
          </div>

          {/* Node graph canvas */}
          <div
            className="node-graph-canvas"
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onClick={e => {
              if (e.target === e.currentTarget) {
                setSelectedNodeId(null);
                setWiringMode(null);
              }
            }}
          >
            {/* SVG edges */}
            <svg className="edges-svg">
              {edges.map(edge => (
                <EdgeLine key={edge.id} edge={edge} nodes={funnel.nodes} />
              ))}
              {/* Wiring preview */}
              {wiringLine && (
                <line
                  x1={wiringLine.sx}
                  y1={wiringLine.sy}
                  x2={wiringLine.tx}
                  y2={wiringLine.ty}
                  stroke="#a78bfa"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                />
              )}
            </svg>

            {/* Thank You terminal */}
            <div className="thank-you-node">
              <div className="thank-you-card">
                <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" width="20" height="20">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Thank You</span>
              </div>
            </div>

            {/* Node cards */}
            {funnel.nodes.map(node => (
              <div
                key={node.id}
                className={`funnel-node-card ${selectedNodeId === node.id ? 'selected' : ''} ${wiringMode?.nodeId === node.id ? 'wiring-source' : ''}`}
                style={{ position: 'absolute', left: node.position.x, top: node.position.y }}
                onMouseDown={e => startDrag(e, node.id)}
                onClick={e => { e.stopPropagation(); handleNodeClick(node.id); }}
              >
                <div className="node-type-badge">{TYPE_LABELS[node.type] || node.type}</div>
                {node.product?.image_url && (
                  <img src={node.product.image_url} className="node-thumb" alt="" />
                )}
                <div className="node-headline">{node.headline}</div>
                {node.discount?.value > 0 && (
                  <span className="discount-badge">{getDiscountLabel(node.discount)}</span>
                )}
                <div className="node-ports">
                  <button
                    className="port port-accept"
                    onClick={e => { e.stopPropagation(); setWiringMode({ nodeId: node.id, edgeType: 'accept' }); }}
                    title="Accept →"
                  >✓</button>
                  <button
                    className="port port-decline"
                    onClick={e => { e.stopPropagation(); setWiringMode({ nodeId: node.id, edgeType: 'decline' }); }}
                    title="Decline →"
                  >✗</button>
                  <button
                    className="port port-delete"
                    onClick={e => { e.stopPropagation(); removeNode(node.id); }}
                    title="Delete node"
                  >🗑</button>
                </div>
              </div>
            ))}

            {/* Empty state */}
            {funnel.nodes.length === 0 && (
              <div className="canvas-empty-state">
                <p>Add your first offer node to get started</p>
              </div>
            )}

            {/* Add node button */}
            <button className="add-node-btn" onClick={addNode}>+ Add Offer</button>
          </div>
        </div>

        {/* Right pane */}
        <div className="offer-editor-panel">
          {selectedNode ? (
            <>
              <div className="editor-header">
                <span>Edit Offer</span>
                <button onClick={() => setSelectedNodeId(null)}>×</button>
              </div>
              <div className="editor-sections">
                {/* Type selector */}
                <div className="editor-section">
                  <div className="section-label">Offer Type</div>
                  <div className="type-selector">
                    {Object.entries(TYPE_LABELS).map(([t, label]) => (
                      <button
                        key={t}
                        className={selectedNode.type === t ? 'active' : ''}
                        onClick={() => updateNode(selectedNodeId, { type: t })}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Product */}
                <div className="editor-section">
                  <div className="section-label">Product</div>
                  {selectedNode.product ? (
                    <div className="selected-product">
                      <img src={selectedNode.product.image_url} alt="" />
                      <div className="selected-product-info">
                        <div className="selected-product-title">{selectedNode.product.title}</div>
                        {selectedNode.product.variant_title && (
                          <div className="selected-product-variant">{selectedNode.product.variant_title}</div>
                        )}
                        <div className="selected-product-price">${selectedNode.product.original_price}</div>
                      </div>
                      <button onClick={() => updateNode(selectedNodeId, { product: null })}>×</button>
                    </div>
                  ) : (
                    <button className="select-product-btn" onClick={() => setShowProductPicker(true)}>
                      + Select Product
                    </button>
                  )}
                </div>

                {/* Quantity */}
                <div className="editor-section">
                  <div className="section-label">Quantity</div>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={selectedNode.quantity}
                    onChange={e => updateNode(selectedNodeId, { quantity: parseInt(e.target.value) || 1 })}
                  />
                </div>

                {/* Discount */}
                <div className="editor-section">
                  <div className="section-label">Discount</div>
                  <div className="discount-type-btns">
                    {[
                      { t: 'percentage', label: '% Off' },
                      { t: 'fixed_amount', label: '$ Off' },
                      { t: 'fixed_price', label: 'Fixed Price' },
                    ].map(({ t, label }) => (
                      <button
                        key={t}
                        className={selectedNode.discount.type === t ? 'active' : ''}
                        onClick={() => updateNode(selectedNodeId, { discount: { ...selectedNode.discount, type: t } })}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={selectedNode.discount.value}
                    onChange={e => updateNode(selectedNodeId, { discount: { ...selectedNode.discount, value: parseFloat(e.target.value) || 0 } })}
                  />
                </div>

                {/* Copy */}
                <div className="editor-section">
                  <div className="section-label">Copy</div>
                  <label>Headline</label>
                  <input
                    type="text"
                    value={selectedNode.headline}
                    onChange={e => updateNode(selectedNodeId, { headline: e.target.value })}
                    maxLength={80}
                  />
                  <label>Message</label>
                  <textarea
                    value={selectedNode.message}
                    onChange={e => updateNode(selectedNodeId, { message: e.target.value })}
                    maxLength={200}
                  />
                  <label>Accept button</label>
                  <input
                    type="text"
                    value={selectedNode.accept_button_text}
                    onChange={e => updateNode(selectedNodeId, { accept_button_text: e.target.value })}
                  />
                  <label>Decline button</label>
                  <input
                    type="text"
                    value={selectedNode.decline_button_text}
                    onChange={e => updateNode(selectedNodeId, { decline_button_text: e.target.value })}
                  />
                </div>

                {/* Urgency */}
                <div className="editor-section">
                  <div className="section-label">Urgency</div>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedNode.countdown_timer?.enabled || false}
                      onChange={e => updateNode(selectedNodeId, {
                        countdown_timer: { ...selectedNode.countdown_timer, enabled: e.target.checked }
                      })}
                    />
                    Show countdown timer
                  </label>
                  {selectedNode.countdown_timer?.enabled && (
                    <div>
                      <label>Duration (seconds)</label>
                      <input
                        type="number"
                        value={selectedNode.countdown_timer.duration_seconds}
                        onChange={e => updateNode(selectedNodeId, {
                          countdown_timer: { ...selectedNode.countdown_timer, duration_seconds: parseInt(e.target.value) || 900 }
                        })}
                      />
                    </div>
                  )}
                </div>

                {/* Wiring routing */}
                <div className="editor-section">
                  <div className="section-label">Routing</div>
                  <div className="wire-row">
                    <span className="wire-label accept">Accept →</span>
                    <select
                      value={selectedNode.on_accept_node_id || ''}
                      onChange={e => updateNode(selectedNodeId, { on_accept_node_id: e.target.value || null })}
                    >
                      <option value="">Thank You</option>
                      {funnel.nodes.filter(n => n.id !== selectedNodeId).map(n => (
                        <option key={n.id} value={n.id}>{n.headline || 'Offer'}</option>
                      ))}
                    </select>
                  </div>
                  <div className="wire-row">
                    <span className="wire-label decline">Decline →</span>
                    <select
                      value={selectedNode.on_decline_node_id || ''}
                      onChange={e => updateNode(selectedNodeId, { on_decline_node_id: e.target.value || null })}
                    >
                      <option value="">Thank You</option>
                      {funnel.nodes.filter(n => n.id !== selectedNodeId).map(n => (
                        <option key={n.id} value={n.id}>{n.headline || 'Offer'}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Delete node */}
                <div className="editor-section">
                  <button className="delete-node-btn" onClick={() => removeNode(selectedNodeId)}>
                    Delete Node
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="editor-empty">
              <p>Select a node to edit</p>
            </div>
          )}
        </div>
      </div>

      {/* Product picker modal */}
      {showProductPicker && (
        <div className="product-picker-modal" onClick={() => setShowProductPicker(false)}>
          <div className="product-picker-content" onClick={e => e.stopPropagation()}>
            <div className="pp-header">
              <span>Select Product</span>
              <button onClick={() => setShowProductPicker(false)}>×</button>
            </div>
            <input
              className="pp-search"
              placeholder="Search products..."
              value={ppSearch}
              onChange={e => { setPpSearch(e.target.value); searchProducts(e.target.value); }}
              autoFocus
            />
            {ppLoading && <div className="pp-loading">Searching...</div>}
            <div className="pp-results">
              {ppResults.map(p => (
                <div key={p.id} className="pp-product" onClick={() => handleSelectProduct(p)}>
                  <img
                    src={p.image || p.images?.[0]?.src}
                    className="pp-thumb"
                    alt=""
                  />
                  <div className="pp-info">
                    <div className="pp-name">{p.title}</div>
                    <div className="pp-price">
                      {p.variants?.[0]?.price ? `$${p.variants[0].price}` : '—'}
                    </div>
                  </div>
                </div>
              ))}
              {!ppLoading && ppResults.length === 0 && ppSearch && (
                <div className="pp-empty">No products found for "{ppSearch}"</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preview modal */}
      {renderPreview()}

      <style>{`
        /* ── Reset / base ─────────────────────────────────────────────────── */
        .offer-builder-root {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #0f0f14;
          color: #fafafa;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow: hidden;
        }

        /* ── Top bar ──────────────────────────────────────────────────────── */
        .funnel-topbar {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          border-bottom: 1px solid #27272a;
          background: #0f0f14;
          flex-shrink: 0;
        }
        .funnel-name-input {
          background: transparent;
          border: none;
          color: #fafafa;
          font-size: 18px;
          font-weight: 700;
          flex: 1;
          outline: none;
          padding: 4px 8px;
          border-radius: 6px;
        }
        .funnel-name-input:hover,
        .funnel-name-input:focus {
          background: #18181b;
        }
        .status-badge {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          padding: 3px 10px;
          border-radius: 20px;
          letter-spacing: 0.5px;
        }
        .status-badge.draft { background: #3f3f46; color: #a1a1aa; }
        .status-badge.active { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid #22c55e; }
        .status-badge.archived { background: #27272a; color: #71717a; }
        .node-count { color: #71717a; font-size: 13px; margin-left: auto; }
        .btn-secondary {
          background: #27272a;
          border: 1px solid #3f3f46;
          color: #a1a1aa;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-secondary:hover { background: #3f3f46; color: #fafafa; }
        .btn-primary {
          background: #8b5cf6;
          border: none;
          color: #fff;
          padding: 8px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-primary:hover { background: #7c3aed; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── Body ─────────────────────────────────────────────────────────── */
        .funnel-body {
          display: flex;
          flex: 1;
          overflow: hidden;
        }
        .left-pane {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          padding: 16px;
          gap: 16px;
          min-width: 0;
        }

        /* ── Trigger editor ────────────────────────────────────────────────── */
        .trigger-editor {
          background: #18181b;
          border: 1px solid #27272a;
          border-radius: 10px;
          padding: 16px;
          flex-shrink: 0;
        }
        .trigger-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .trigger-title { font-size: 14px; font-weight: 700; color: #fafafa; }
        .trigger-sub { font-size: 12px; color: #71717a; }
        .match-toggle {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }
        .match-label { font-size: 12px; color: #71717a; }
        .match-toggle button {
          background: #27272a;
          border: 1px solid #3f3f46;
          color: #a1a1aa;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
        }
        .match-toggle button.active { background: #8b5cf6; border-color: #8b5cf6; color: #fff; }
        .condition-row {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 8px;
          padding: 8px;
          background: #0f0f14;
          border-radius: 6px;
          margin-bottom: 8px;
        }
        .condition-row select {
          background: #27272a;
          border: 1px solid #3f3f46;
          color: #fafafa;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 13px;
          flex-shrink: 0;
        }
        .condition-row input {
          background: #27272a;
          border: 1px solid #3f3f46;
          color: #fafafa;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 13px;
          width: 100px;
        }
        .condition-row input[type=text] { width: 160px; }
        .condition-hint { font-size: 12px; color: #71717a; }
        .condition-remove {
          background: none;
          border: none;
          color: #71717a;
          cursor: pointer;
          font-size: 16px;
          padding: 0 4px;
          margin-left: auto;
        }
        .condition-remove:hover { color: #ef4444; }
        .add-condition-btn {
          border: 2px dashed #27272a;
          background: none;
          color: #71717a;
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
          width: 100%;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.15s;
        }
        .add-condition-btn:hover { border-color: #8b5cf6; color: #a78bfa; }

        /* ── Node graph canvas ────────────────────────────────────────────── */
        .node-graph-canvas {
          flex: 1;
          position: relative;
          overflow: auto;
          background: #0f0f14;
          border-radius: 10px;
          border: 1px solid #27272a;
          min-height: 500px;
        }
        .edges-svg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: visible;
        }
        .canvas-empty-state {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #71717a;
          font-size: 15px;
          pointer-events: none;
        }

        /* ── Node card ────────────────────────────────────────────────────── */
        .funnel-node-card {
          background: #18181b;
          border: 2px solid #27272a;
          border-radius: 12px;
          padding: 16px;
          width: 200px;
          cursor: pointer;
          transition: border-color 0.15s, box-shadow 0.15s;
          user-select: none;
        }
        .funnel-node-card:hover { border-color: #3f3f46; }
        .funnel-node-card.selected { border-color: #8b5cf6; box-shadow: 0 0 0 3px rgba(139,92,246,0.2); }
        .funnel-node-card.wiring-source { border-color: #a78bfa; }
        .node-type-badge {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          color: #71717a;
          margin-bottom: 8px;
          letter-spacing: 0.5px;
        }
        .node-thumb {
          width: 100%;
          height: 80px;
          object-fit: cover;
          border-radius: 6px;
          margin-bottom: 8px;
          display: block;
        }
        .node-headline {
          font-size: 13px;
          font-weight: 600;
          color: #fafafa;
          margin-bottom: 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .discount-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          color: #22c55e;
          background: rgba(34,197,94,0.1);
          padding: 2px 8px;
          border-radius: 4px;
          margin-bottom: 4px;
        }
        .node-ports {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }
        .port {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid;
          background: none;
          cursor: pointer;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .port-accept { border-color: #22c55e; color: #22c55e; }
        .port-accept:hover { background: #22c55e; color: #fff; }
        .port-decline { border-color: #ef4444; color: #ef4444; }
        .port-decline:hover { background: #ef4444; color: #fff; }
        .port-delete { border-color: #3f3f46; color: #71717a; font-size: 10px; }
        .port-delete:hover { background: #3f3f46; color: #fafafa; }

        /* ── Thank you node ────────────────────────────────────────────────── */
        .thank-you-node {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          pointer-events: none;
        }
        .thank-you-card {
          background: rgba(34,197,94,0.1);
          border: 2px solid #22c55e;
          border-radius: 12px;
          padding: 12px 24px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #22c55e;
          font-weight: 700;
          font-size: 14px;
        }

        /* ── Add node button ───────────────────────────────────────────────── */
        .add-node-btn {
          position: absolute;
          bottom: 20px;
          right: 20px;
          background: #8b5cf6;
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 12px 24px;
          font-weight: 700;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.15s;
          box-shadow: 0 4px 14px rgba(139,92,246,0.35);
        }
        .add-node-btn:hover { background: #7c3aed; }

        /* ── Offer editor panel ────────────────────────────────────────────── */
        .offer-editor-panel {
          width: 420px;
          flex-shrink: 0;
          background: #18181b;
          border-left: 1px solid #27272a;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }
        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #27272a;
          font-weight: 700;
          color: #fafafa;
          font-size: 15px;
          flex-shrink: 0;
          position: sticky;
          top: 0;
          background: #18181b;
          z-index: 1;
        }
        .editor-header button {
          background: none;
          border: none;
          color: #71717a;
          cursor: pointer;
          font-size: 20px;
          padding: 0;
          line-height: 1;
        }
        .editor-header button:hover { color: #fafafa; }
        .editor-sections {
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .editor-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .section-label {
          font-size: 11px;
          font-weight: 700;
          color: #71717a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .type-selector {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .type-selector button {
          background: #27272a;
          border: 1px solid #3f3f46;
          color: #a1a1aa;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s;
          font-weight: 600;
        }
        .type-selector button:hover { background: #3f3f46; color: #fafafa; }
        .type-selector button.active { background: #8b5cf6; border-color: #8b5cf6; color: #fff; }
        .select-product-btn {
          background: rgba(139,92,246,0.1);
          border: 2px dashed rgba(139,92,246,0.4);
          color: #a78bfa;
          padding: 16px;
          border-radius: 10px;
          width: 100%;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.15s;
        }
        .select-product-btn:hover { background: rgba(139,92,246,0.2); border-color: #8b5cf6; }
        .selected-product {
          display: flex;
          gap: 10px;
          align-items: center;
          background: #0f0f14;
          border: 1px solid #27272a;
          border-radius: 8px;
          padding: 10px;
        }
        .selected-product img {
          width: 48px;
          height: 48px;
          object-fit: cover;
          border-radius: 6px;
          flex-shrink: 0;
        }
        .selected-product-info { flex: 1; min-width: 0; }
        .selected-product-title {
          font-size: 13px;
          font-weight: 600;
          color: #fafafa;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .selected-product-variant { font-size: 11px; color: #71717a; margin-top: 2px; }
        .selected-product-price { font-size: 13px; color: #22c55e; font-weight: 700; margin-top: 2px; }
        .selected-product button {
          background: none;
          border: none;
          color: #71717a;
          cursor: pointer;
          font-size: 16px;
          padding: 4px;
          margin-left: auto;
          flex-shrink: 0;
        }
        .selected-product button:hover { color: #ef4444; }
        .discount-type-btns {
          display: flex;
          gap: 6px;
        }
        .discount-type-btns button {
          background: #27272a;
          border: 1px solid #3f3f46;
          color: #a1a1aa;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s;
          font-weight: 600;
        }
        .discount-type-btns button:hover { background: #3f3f46; color: #fafafa; }
        .discount-type-btns button.active { background: #8b5cf6; border-color: #8b5cf6; color: #fff; }
        input[type=number],
        input[type=text] {
          background: #27272a;
          border: 1px solid #3f3f46;
          color: #fafafa;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 14px;
          width: 100%;
          box-sizing: border-box;
        }
        input[type=number]:focus,
        input[type=text]:focus {
          outline: none;
          border-color: #8b5cf6;
        }
        textarea {
          background: #27272a;
          border: 1px solid #3f3f46;
          color: #fafafa;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 14px;
          width: 100%;
          box-sizing: border-box;
          resize: vertical;
          min-height: 60px;
          font-family: inherit;
        }
        textarea:focus { outline: none; border-color: #8b5cf6; }
        label {
          font-size: 12px;
          color: #a1a1aa;
          font-weight: 500;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }
        .checkbox-label input[type=checkbox] {
          width: 16px;
          height: 16px;
          accent-color: #8b5cf6;
        }
        .wire-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .wire-label {
          font-size: 12px;
          font-weight: 700;
          width: 70px;
          flex-shrink: 0;
        }
        .wire-label.accept { color: #22c55e; }
        .wire-label.decline { color: #ef4444; }
        .wire-row select {
          flex: 1;
          background: #27272a;
          border: 1px solid #3f3f46;
          color: #fafafa;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 13px;
        }
        .wire-row select:focus { outline: none; border-color: #8b5cf6; }
        .delete-node-btn {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          color: #ef4444;
          padding: 8px;
          border-radius: 8px;
          width: 100%;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .delete-node-btn:hover { background: rgba(239,68,68,0.2); border-color: #ef4444; }
        .editor-empty {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #71717a;
          font-size: 14px;
        }

        /* ── Product picker modal ──────────────────────────────────────────── */
        .product-picker-modal {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        .product-picker-content {
          background: #18181b;
          border: 1px solid #27272a;
          border-radius: 14px;
          width: 580px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .pp-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #27272a;
          font-weight: 700;
          font-size: 15px;
          color: #fafafa;
        }
        .pp-header button {
          background: none;
          border: none;
          color: #71717a;
          cursor: pointer;
          font-size: 20px;
        }
        .pp-header button:hover { color: #fafafa; }
        .pp-search {
          background: #0f0f14;
          border: none;
          border-bottom: 1px solid #27272a;
          color: #fafafa;
          padding: 14px 20px;
          font-size: 15px;
          outline: none;
        }
        .pp-search::placeholder { color: #71717a; }
        .pp-loading {
          padding: 16px;
          text-align: center;
          color: #71717a;
          font-size: 13px;
        }
        .pp-results {
          overflow-y: auto;
          padding: 8px;
        }
        .pp-product {
          display: flex;
          gap: 12px;
          align-items: center;
          padding: 10px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .pp-product:hover { background: #27272a; }
        .pp-thumb {
          width: 56px;
          height: 56px;
          object-fit: cover;
          border-radius: 6px;
          flex-shrink: 0;
        }
        .pp-info { flex: 1; min-width: 0; }
        .pp-name {
          font-size: 14px;
          font-weight: 600;
          color: #fafafa;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pp-price { font-size: 13px; color: #22c55e; font-weight: 700; margin-top: 3px; }
        .pp-empty { padding: 24px; text-align: center; color: #71717a; font-size: 13px; }

        /* ── Preview modal ────────────────────────────────────────────────── */
        .preview-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          backdrop-filter: blur(4px);
        }
        .preview-modal {
          background: #fff;
          border-radius: 16px;
          width: 100%;
          max-width: 560px;
          overflow: hidden;
          color: #1a1a1a;
          max-height: 90vh;
          overflow-y: auto;
        }
        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #f5f5f5;
        }
        .preview-badge {
          background: #8b5cf6;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 4px 10px;
          border-radius: 20px;
        }
        .preview-close {
          background: none;
          border: none;
          font-size: 24px;
          color: #71717a;
          cursor: pointer;
          line-height: 1;
        }
        .preview-product-image {
          width: 100%;
          max-height: 280px;
          object-fit: cover;
          display: block;
        }
        .preview-body { padding: 20px; }
        .preview-headline {
          font-size: 22px;
          font-weight: 800;
          color: #1a1a1a;
          margin: 0 0 8px;
        }
        .preview-message {
          font-size: 15px;
          color: #525252;
          margin: 0 0 12px;
          line-height: 1.5;
        }
        .preview-variant { font-size: 13px; color: #71717a; margin: 0 0 12px; }
        .preview-price-block {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .preview-original-price {
          font-size: 18px;
          color: #ef4444;
          text-decoration: line-through;
        }
        .preview-discounted-price {
          font-size: 24px;
          font-weight: 800;
          color: #22c55e;
        }
        .preview-savings {
          background: rgba(34,197,94,0.1);
          color: #22c55e;
          font-size: 12px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
        }
        .preview-accept-btn {
          width: 100%;
          background: #8b5cf6;
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 16px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          margin-bottom: 10px;
          transition: background 0.15s;
        }
        .preview-accept-btn:hover { background: #7c3aed; }
        .preview-decline-btn {
          width: 100%;
          background: none;
          border: none;
          color: #71717a;
          font-size: 14px;
          cursor: pointer;
          padding: 8px;
          text-decoration: underline;
        }
        .preview-decline-btn:hover { color: #525252; }
      `}</style>
    </div>
  );
}

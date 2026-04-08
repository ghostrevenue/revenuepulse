import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/index.js';

/**
 * TargetingSelector — reusable component for include/exclude targeting fields.
 * Each instance can be configured as "include" or "exclude" mode.
 *
 * Supports three field types:
 * - products: searchable multi-select with image thumbnails
 * - collections: dropdown select
 * - tags: tag/chip input
 *
 * Usage: <TargetingSelector mode="include" field="products" values={[]} onChange={} />
 */
export default function TargetingSelector({ mode = 'include', field, values = [], onChange, label }) {
  const [expanded, setExpanded] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allItems, setAllItems] = useState([]);
  const [apiError, setApiError] = useState(null);

  // Track if we got a 401 (not connected) vs other error
  const [notConnected, setNotConnected] = useState(false);

  // Checkbox selection state for collections and tags
  const [selectedCollections, setSelectedCollections] = useState({});
  const [selectedTags, setSelectedTags] = useState({});

  const modeColor = mode === 'include' ? '#8b5cf6' : '#ef4444';
  const modeBg = mode === 'include' ? 'rgba(139,92,246,0.08)' : 'rgba(239,68,68,0.08)';
  const modeBorder = mode === 'include' ? 'rgba(139,92,246,0.2)' : 'rgba(239,68,68,0.2)';

  // Debounced search for products
  useEffect(() => {
    if (field !== 'products' || !modalOpen) return;
    setApiError(null);
    setNotConnected(false);
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.searchShopifyProducts(searchQuery, 50);
        setSearchResults(res.products || res || []);
      } catch (e) {
        console.error(e);
        if (e.message && e.message.includes('401')) {
          setNotConnected(true);
          setApiError('not_connected');
        } else {
          setApiError('Failed to load products');
        }
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, field, modalOpen]);

  // Fetch collections and tags once when modal opens
  useEffect(() => {
    if (!modalOpen) return;
    setApiError(null);
    setNotConnected(false);
    setSelectedCollections({});
    setSelectedTags({});
    if (field === 'collections') {
      api.getShopifyCollections()
        .then(res => setAllItems(res.collections || res || []))
        .catch(e => {
          setAllItems([]);
          if (e.message && e.message.includes('401')) {
            setNotConnected(true);
            setApiError('not_connected');
          } else {
            setApiError('Failed to load collections');
          }
        });
    } else if (field === 'tags') {
      api.getShopifyProductTags()
        .then(res => setAllItems(res.tags || res || []))
        .catch(e => {
          setAllItems([]);
          if (e.message && e.message.includes('401')) {
            setNotConnected(true);
            setApiError('not_connected');
          } else {
            setApiError('Failed to load tags');
          }
        });
    }
  }, [field, modalOpen]);

  // Manual ID entry state
  const [manualIdInput, setManualIdInput] = useState('');
  const [manualIdError, setManualIdError] = useState('');

  function handleManualAdd() {
    const raw = manualIdInput.trim();
    if (!raw) {
      setManualIdError('Enter a product ID');
      return;
    }
    // Accept numeric ID or URL
    let id = raw;
    // Extract ID from URL if it looks like a Shopify product URL
    const urlMatch = raw.match(/products\/(\d+)/);
    if (urlMatch) id = urlMatch[1];
    if (!/^\d+$/.test(id)) {
      setManualIdError('Invalid product ID format');
      return;
    }
    const newItem = { id: String(id), title: `Product ${id}`, image: '' };
    if (!values.find(v => v.id === newItem.id)) {
      onChange([...values, newItem]);
    }
    setManualIdInput('');
    setManualIdError('');
  }

  function handleManualIdKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleManualAdd();
    }
  }

  function renderManualEntry(placeholder, example) {
    return (
      <div className="manual-entry-section">
        <div className="manual-entry-label">Add by ID or URL</div>
        <div className="manual-entry-row">
          <input
            className="form-input"
            type="text"
            placeholder={placeholder}
            value={manualIdInput}
            onChange={e => { setManualIdInput(e.target.value); setManualIdError(''); }}
            onKeyDown={handleManualIdKeyDown}
          />
          <button type="button" className="btn-primary" style={{ padding: '6px 14px', fontSize: '12px' }} onClick={handleManualAdd}>Add</button>
        </div>
        {manualIdError && <div className="manual-id-error">{manualIdError}</div>}
        <div className="manual-entry-hint">{example}</div>
      </div>
    );
  }

  function handleAdd(item) {
    if (!values.find(v => v.id === item.id || v === item)) {
      onChange([...values, item]);
    }
    setSearchQuery('');
  }

  // Add multiple items at once (for checkbox multi-select)
  function handleAddMultiple(items) {
    const existingIds = new Set(values.map(v => v.id || v));
    const newItems = items.filter(item => !existingIds.has(item.id || item));
    if (newItems.length > 0) {
      onChange([...values, ...newItems]);
    }
  }

  // Collection checkbox handlers
  function toggleCollection(item) {
    setSelectedCollections(prev => {
      if (prev[item.id]) {
        const next = { ...prev };
        delete next[item.id];
        return next;
      }
      return { ...prev, [item.id]: item };
    });
  }

  function selectAllCollections() {
    const selectable = allItems.filter(item => !values.find(v => v.id === item.id));
    const allSelectable = selectable.reduce((acc, item) => ({ ...acc, [item.id]: item }), {});
    setSelectedCollections(prev => ({ ...prev, ...allSelectable }));
  }

  function clearSelectedCollections() {
    // Only clear items that are NOT already in values
    const idsToRemove = Object.keys(selectedCollections).filter(id => !values.find(v => v.id === id));
    setSelectedCollections(prev => {
      const next = { ...prev };
      idsToRemove.forEach(id => delete next[id]);
      return next;
    });
  }

  function handleAddCollections() {
    const items = Object.values(selectedCollections);
    if (items.length > 0) {
      handleAddMultiple(items);
      setSelectedCollections({});
    }
  }

  // Tag checkbox handlers
  function toggleTag(tag) {
    setSelectedTags(prev => {
      if (prev[tag]) {
        const next = { ...prev };
        delete next[tag];
        return next;
      }
      return { ...prev, [tag]: tag };
    });
  }

  function selectAllTags() {
    const selectable = allItems.filter(t => !values.includes(t));
    const allSelectable = selectable.reduce((acc, tag) => ({ ...acc, [tag]: tag }), {});
    setSelectedTags(prev => ({ ...prev, ...allSelectable }));
  }

  function clearSelectedTags() {
    const tagsToRemove = Object.keys(selectedTags).filter(tag => !values.includes(tag));
    setSelectedTags(prev => {
      const next = { ...prev };
      tagsToRemove.forEach(tag => delete next[tag]);
      return next;
    });
  }

  function handleAddTags() {
    const items = Object.values(selectedTags);
    if (items.length > 0) {
      handleAddMultiple(items);
      setSelectedTags({});
    }
  }

  function handleRemove(item) {
    onChange(values.filter(v => v.id !== item.id && v !== item));
  }

  function renderValue(item) {
    if (field === 'products') {
      return (
        <span className="target-chip">
          {item.image && <img src={item.image} alt="" className="chip-thumb" />}
          <span>{item.title || item.name}</span>
          <button type="button" className="chip-remove" onClick={() => handleRemove(item)}>×</button>
        </span>
      );
    }
    if (field === 'collections') {
      return (
        <span className="target-chip">
          <span>{item.title || item.name}</span>
          <button type="button" className="chip-remove" onClick={() => handleRemove(item)}>×</button>
        </span>
      );
    }
    // tags — item is a string
    return (
      <span className="target-chip tag-chip">
        <span>{item}</span>
        <button type="button" className="chip-remove" onClick={() => handleRemove(item)}>×</button>
      </span>
    );
  }

  return (
    <div className="targeting-selector" style={{ borderColor: modeBorder, background: modeBg }}>
      <div className="targeting-header" onClick={() => setExpanded(!expanded)}>
        <div className="targeting-header-left">
          <svg viewBox="0 0 24 24" fill="none" stroke={modeColor} strokeWidth="2" width="14" height="14"
            style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0)', transition: '0.2s' }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="targeting-label" style={{ color: modeColor }}>{fieldLabel}</span>
          {values.length > 0 && (
            <span className="targeting-count" style={{ background: modeColor }}>{values.length}</span>
          )}
        </div>
        <span className="targeting-expand-hint">{expanded ? 'Collapse' : 'Expand'}</span>
      </div>

      {expanded && (
        <div className="targeting-body">
          {values.length > 0 && (
            <div className="targeting-chips">
              {values.map((item, i) => (
                <React.Fragment key={item.id || item}>{renderValue(item)}</React.Fragment>
              ))}
            </div>
          )}

          <button
            type="button"
            className="btn-add-target"
            style={{ color: modeColor, borderColor: modeBorder }}
            onClick={() => setModalOpen(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add
          </button>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal target-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{fieldLabel}</h2>
              <button className="modal-close" onClick={() => setModalOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              {field === 'products' && (
                <>
                  <input
                    className="form-input search-input"
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  <div className="target-list">
                    {apiError === 'not_connected' ? (
                      <>
                        <div className="target-not-connected">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28" style={{ color: '#ef4444', marginBottom: '8px' }}>
                            <path d="M1 1l22 22M9 9a3 3 0 014.24 4.24M15.24 15.24A3 3 0 0011.17 11.17M12 12a3 3 0 014.24 4.24" />
                            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                          </svg>
                          <div className="not-connected-title">Not connected to Shopify</div>
                          <div className="not-connected-sub">Connect your store to search products. Or add by ID below.</div>
                        </div>
                        {renderManualEntry('Product ID (e.g. 12345678)', 'Paste product ID or admin URL: /admin/products/12345678')}
                      </>
                    ) : (
                      <>
                        {apiError && <div className="target-error">{apiError}</div>}
                        {!apiError && loading && <div className="target-loading">Searching{searchQuery ? ` "${searchQuery}"...` : '...'}</div>}
                        {!apiError && !loading && searchResults.length === 0 && searchQuery && (
                          <div className="target-empty">No products found for "{searchQuery}"</div>
                        )}
                        {!apiError && !loading && searchResults.length === 0 && !searchQuery && (
                          <div className="target-empty">Start typing to search products</div>
                        )}
                        {searchResults.map(item => {
                          const alreadyAdded = values.find(v => v.id === item.id);
                          return (
                            <div key={item.id} className={`target-item ${alreadyAdded ? 'added' : ''}`}
                              onClick={() => !alreadyAdded && handleAdd(item)}>
                              {item.image && <img src={item.image} alt="" className="target-thumb" />}
                              <div className="target-info">
                                <div className="target-name">{item.title}</div>
                                {item.variants && item.variants[0] && (
                                  <div className="target-price">${parseFloat(item.variants[0].price || 0).toFixed(2)}</div>
                                )}
                              </div>
                              {alreadyAdded && <span className="target-added-check">✓</span>}
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                </>
              )}

              {field === 'collections' && (
                <div className="target-list">
                  {apiError === 'not_connected' ? (
                    <>
                      <div className="target-not-connected">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28" style={{ color: '#ef4444', marginBottom: '8px' }}>
                          <path d="M1 1l22 22M9 9a3 3 0 014.24 4.24M15.24 15.24A3 3 0 0011.17 11.17M12 12a3 3 0 014.24 4.24" />
                          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                        </svg>
                        <div className="not-connected-title">Not connected to Shopify</div>
                        <div className="not-connected-sub">Connect your store to browse collections. Or add by ID below.</div>
                      </div>
                      {renderManualEntry('Collection ID (e.g. 12345678)', 'Paste collection ID or admin URL: /admin/collections/12345678')}
                    </>
                  ) : (
                    <>
                      {apiError && <div className="target-error">{apiError}</div>}
                      {!apiError && (
                        <div className="modal-checkbox-header">
                          <span className="modal-checkbox-actions">
                            <button type="button" className="modal-checkbox-action" onClick={selectAllCollections}>Select All</button>
                            <span className="modal-checkbox-sep">|</span>
                            <button type="button" className="modal-checkbox-action" onClick={clearSelectedCollections}>Clear</button>
                          </span>
                          {Object.keys(selectedCollections).length > 0 && (
                            <span className="modal-checkbox-count">{Object.keys(selectedCollections).length} selected</span>
                          )}
                        </div>
                      )}
                      {!apiError && allItems.length === 0 && <div className="target-empty">No collections found</div>}
                      {allItems.map(item => {
                        const alreadyAdded = !!values.find(v => v.id === item.id);
                        const isChecked = alreadyAdded || !!selectedCollections[item.id];
                        return (
                          <div key={item.id} className={`target-item checkbox-item ${alreadyAdded ? 'added' : ''}`}
                            onClick={() => !alreadyAdded && toggleCollection(item)}>
                            <input
                              type="checkbox"
                              className="modal-checkbox"
                              checked={isChecked}
                              onChange={() => !alreadyAdded && toggleCollection(item)}
                              disabled={alreadyAdded}
                              id={`collection-${item.id}`}
                            />
                            <div className="target-info">
                              <div className="target-name">{item.title}</div>
                            </div>
                            {isChecked && <span className="target-added-check">✓</span>}
                          </div>
                        );
                      })}
                      {!apiError && Object.keys(selectedCollections).length > 0 && (
                        <div className="modal-checkbox-footer">
                          <button type="button" className="btn-primary" style={{ width: '100%' }} onClick={handleAddCollections}>
                            Add Selected ({Object.keys(selectedCollections).length})
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {field === 'tags' && (
                <div className="target-list">
                  {apiError === 'not_connected' ? (
                    <>
                      <div className="target-not-connected">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28" style={{ color: '#ef4444', marginBottom: '8px' }}>
                          <path d="M1 1l22 22M9 9a3 3 0 014.24 4.24M15.24 15.24A3 3 0 0011.17 11.17M12 12a3 3 0 014.24 4.24" />
                          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                        </svg>
                        <div className="not-connected-title">Not connected to Shopify</div>
                        <div className="not-connected-sub">Connect your store to browse tags. Or add by typing below.</div>
                      </div>
                      <div className="manual-entry-section">
                        <div className="manual-entry-label">Add tag</div>
                        <div className="manual-entry-row">
                          <input
                            className="form-input"
                            type="text"
                            placeholder="Tag name (e.g. sale)"
                            value={manualIdInput}
                            onChange={e => { setManualIdInput(e.target.value); setManualIdError(''); }}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const raw = manualIdInput.trim(); if (raw && !values.includes(raw)) onChange([...values, raw]); setManualIdInput(''); } }}
                          />
                          <button type="button" className="btn-primary" style={{ padding: '6px 14px', fontSize: '12px' }} onClick={() => { const raw = manualIdInput.trim(); if (raw && !values.includes(raw)) onChange([...values, raw]); setManualIdInput(''); }}>Add</button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {apiError && <div className="target-error">{apiError}</div>}
                      {!apiError && (
                        <div className="modal-checkbox-header">
                          <span className="modal-checkbox-actions">
                            <button type="button" className="modal-checkbox-action" onClick={selectAllTags}>Select All</button>
                            <span className="modal-checkbox-sep">|</span>
                            <button type="button" className="modal-checkbox-action" onClick={clearSelectedTags}>Clear</button>
                          </span>
                          {Object.keys(selectedTags).length > 0 && (
                            <span className="modal-checkbox-count">{Object.keys(selectedTags).length} selected</span>
                          )}
                        </div>
                      )}
                      {!apiError && allItems.length === 0 && <div className="target-empty">No tags found</div>}
                      {allItems.map(tag => {
                        const alreadyAdded = values.includes(tag);
                        const isChecked = alreadyAdded || !!selectedTags[tag];
                        return (
                          <div key={tag} className={`target-item checkbox-item ${alreadyAdded ? 'added' : ''}`}
                            onClick={() => !alreadyAdded && toggleTag(tag)}>
                            <input
                              type="checkbox"
                              className="modal-checkbox"
                              checked={isChecked}
                              onChange={() => !alreadyAdded && toggleTag(tag)}
                              disabled={alreadyAdded}
                              id={`tag-${tag}`}
                            />
                            <div className="target-info"><div className="target-name">{tag}</div></div>
                            {isChecked && <span className="target-added-check">✓</span>}
                          </div>
                        );
                      })}
                      {!apiError && Object.keys(selectedTags).length > 0 && (
                        <div className="modal-checkbox-footer">
                          <button type="button" className="btn-primary" style={{ width: '100%' }} onClick={handleAddTags}>
                            Add Selected ({Object.keys(selectedTags).length})
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .targeting-selector { border: 1px solid; border-radius: 10px; overflow: hidden; margin-bottom: 16px; }
        .targeting-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; cursor: pointer; }
        .targeting-header-left { display: flex; align-items: center; gap: 8px; }
        .targeting-label { font-size: 13px; font-weight: 600; }
        .targeting-count { color: #fff; font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 10px; }
        .targeting-expand-hint { font-size: 11px; color: #52525b; }
        .targeting-body { padding: 0 16px 12px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
        .targeting-chips { display: flex; flex-wrap: wrap; gap: 6px; width: 100%; }

        .target-chip { display: inline-flex; align-items: center; gap: 6px; background: #27272a; border: 1px solid #3f3f46; padding: 3px 8px; border-radius: 6px; font-size: 12px; color: #e5e5e5; }
        .target-chip.tag-chip { background: rgba(139,92,246,0.15); border-color: rgba(139,92,246,0.3); color: #a78bfa; }
        .chip-thumb { width: 18px; height: 18px; border-radius: 3px; object-fit: cover; }
        .chip-remove { background: none; border: none; color: #71717a; cursor: pointer; font-size: 14px; line-height: 1; padding: 0 2px; }
        .chip-remove:hover { color: #ef4444; }

        .btn-add-target { display: inline-flex; align-items: center; gap: 4px; background: none; border: 1px dashed; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.15s; }
        .btn-add-target:hover { background: rgba(255,255,255,0.05); }

        .target-modal { width: 520px; max-height: 70vh; }
        .search-input { margin-bottom: 12px; }
        .target-list { max-height: 400px; overflow-y: auto; }
        .target-loading, .target-empty { text-align: center; padding: 24px; color: #52525b; font-size: 13px; }
        .target-error { color: #ef4444; padding: 12px; font-size: 13px; text-align: center; }
        .target-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; cursor: pointer; border-radius: 8px; transition: background 0.15s; }
        .target-item:hover { background: #27272a; }
        .target-item.added { opacity: 0.5; cursor: default; }
        .target-item.checkbox-item { padding: 8px 12px; }
        .target-thumb { width: 36px; height: 36px; border-radius: 6px; object-fit: cover; flex-shrink: 0; }
        .target-info { flex: 1; }
        .target-name { font-size: 13px; font-weight: 500; color: #e5e5e5; }
        .target-price { font-size: 12px; color: #71717a; margin-top: 2px; }
        .target-added-check { color: #22c55e; font-size: 16px; }
        .target-not-connected { display: flex; flex-direction: column; align-items: center; padding: 24px 16px; text-align: center; }
        .not-connected-title { font-size: 14px; font-weight: 600; color: #e5e5e5; margin-bottom: 4px; }
        .not-connected-sub { font-size: 12px; color: #71717a; }
        .manual-entry-section { width: 100%; padding: 12px 0 4px; border-top: 1px solid #3f3f46; margin-top: 8px; }
        .manual-entry-label { font-size: 11px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
        .manual-entry-row { display: flex; gap: 8px; }
        .manual-entry-row .form-input { flex: 1; font-size: 13px; }
        .manual-id-error { color: #ef4444; font-size: 11px; margin-top: 4px; }
        .manual-entry-hint { font-size: 11px; color: #52525b; margin-top: 4px; }
        .modal-checkbox-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 4px; border-bottom: 1px solid #3f3f46; margin-bottom: 4px; }
        .modal-checkbox-actions { display: flex; align-items: center; gap: 6px; }
        .modal-checkbox-action { background: none; border: none; color: #8b5cf6; font-size: 12px; cursor: pointer; padding: 0; }
        .modal-checkbox-action:hover { text-decoration: underline; }
        .modal-checkbox-sep { color: #52525b; font-size: 12px; }
        .modal-checkbox-count { font-size: 12px; color: #71717a; font-weight: 500; }
        .modal-checkbox { width: 16px; height: 16px; cursor: pointer; accent-color: #8b5cf6; flex-shrink: 0; }
        .modal-checkbox:disabled { cursor: default; opacity: 0.6; }
        .modal-checkbox-footer { padding: 12px 4px 4px; border-top: 1px solid #3f3f46; margin-top: 8px; }
        .modal-checkbox-footer .btn-primary { background: #8b5cf6; color: #fff; border: none; padding: 10px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; }
        .modal-checkbox-footer .btn-primary:hover { background: #7c3aed; }
      `}</style>
    </div>
  );
}

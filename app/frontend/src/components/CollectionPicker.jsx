import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/index.js';

const SAMPLE_COLLECTIONS = [
  { id: 'gid://shopify/Collection/1', title: 'Accessories', handle: 'accessories' },
  { id: 'gid://shopify/Collection/2', title: 'Electronics', handle: 'electronics' },
  { id: 'gid://shopify/Collection/3', title: 'Apparel', handle: 'apparel' },
];

export default function CollectionPicker({ isOpen, onClose, onSelect, selectedIds = [] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [collections, setCollections] = useState([]);
  const [useSample, setUseSample] = useState(false);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState(new Set());

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setCollections([]);
      setUseSample(false);
      setSelectedCollectionIds(new Set(selectedIds.map(c => c.id || c)));
    }
  }, [isOpen, selectedIds]);

  async function loadCollections() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getShopifyCollections();
      if (data.error) {
        if (data.needs_auth) {
          setError('Shopify not connected. Showing sample collections.');
          setUseSample(true);
          setCollections(SAMPLE_COLLECTIONS);
        } else {
          setError(data.error);
        }
        return;
      }
      setCollections(data.collections || data || []);
    } catch (e) {
      setError('Failed to load collections: ' + e.message);
      setUseSample(true);
      setCollections(SAMPLE_COLLECTIONS);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (isOpen) {
      loadCollections();
    }
  }, [isOpen]);

  function toggleCollection(collection) {
    setSelectedCollectionIds(prev => {
      const next = new Set(prev);
      if (next.has(collection.id)) {
        next.delete(collection.id);
      } else {
        next.add(collection.id);
      }
      return next;
    });
  }

  function handleConfirm() {
    const selected = (useSample ? SAMPLE_COLLECTIONS : collections).filter(c => selectedCollectionIds.has(c.id));
    onSelect(selected);
    onClose();
  }

  if (!isOpen) return null;

  const displayCollections = useSample ? SAMPLE_COLLECTIONS : collections;

  return (
    <>
      <style>{`
        .pp-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 9999; display: flex; align-items: center; justify-content: center; }
        .pp-modal { background: #18181b; border: 1px solid #27272a; border-radius: 16px; width: 520px; max-width: 95vw; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; }
        .pp-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #27272a; }
        .pp-title { display: flex; align-items: center; gap: 10px; font-weight: 700; color: #fafafa; font-size: 15px; }
        .pp-sample-badge { font-size: 10px; font-weight: 700; background: #f59e0b; color: #000; padding: 2px 8px; border-radius: 9999px; text-transform: uppercase; }
        .pp-close { background: none; border: none; color: #71717a; cursor: pointer; font-size: 20px; line-height: 1; }
        .pp-error { margin: 12px 20px; padding: 10px 14px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; color: #ef4444; font-size: 13px; display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; }
        .pp-sample-btn { background: #8b5cf6; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; white-space: nowrap; }
        .pp-loading { padding: 32px; text-align: center; color: #71717a; font-size: 14px; }
        .pp-list { overflow-y: auto; flex: 1; padding: 8px 0; }
        .pp-list-item { display: flex; align-items: center; gap: 12px; padding: 12px 20px; cursor: pointer; transition: background 0.1s; }
        .pp-list-item:hover { background: #0f0f14; }
        .pp-list-item.selected { background: rgba(139,92,246,0.1); }
        .pp-checkbox { width: 18px; height: 18px; border: 2px solid #3f3f46; border-radius: 4px; background: #0f0f14; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.15s; }
        .pp-list-item.selected .pp-checkbox { background: #8b5cf6; border-color: #8b5cf6; }
        .pp-check-icon { color: white; font-size: 12px; font-weight: 700; }
        .pp-item-info { flex: 1; }
        .pp-item-title { font-size: 14px; font-weight: 500; color: #fafafa; }
        .pp-item-handle { font-size: 11px; color: #52525b; margin-top: 2px; }
        .pp-empty { text-align: center; padding: 48px; color: #52525b; font-size: 14px; }
        .pp-multi-confirm { padding: 14px 20px; border-top: 1px solid #27272a; display: flex; justify-content: space-between; align-items: center; background: #18181b; position: sticky; bottom: 0; }
        .pp-confirm-btn { background: #8b5cf6; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
      `}</style>
      <div className="pp-overlay" onClick={onClose}>
        <div className="pp-modal" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="pp-header">
            <div className="pp-title">
              <span>Select Collections</span>
              {useSample && <span className="pp-sample-badge">Sample Data</span>}
            </div>
            <button className="pp-close" onClick={onClose}>×</button>
          </div>

          {/* Error */}
          {error && (
            <div className="pp-error">
              <span>{error}</span>
              {!useSample && (
                <button className="pp-sample-btn" onClick={() => { setUseSample(true); setCollections(SAMPLE_COLLECTIONS); setError(null); }}>
                  Load sample collections
                </button>
              )}
            </div>
          )}

          {/* Loading */}
          {loading && <div className="pp-loading">Loading collections...</div>}

          {/* Collection list */}
          {!loading && (
            <div className="pp-list">
              {displayCollections.map(collection => (
                <div
                  key={collection.id}
                  className={`pp-list-item ${selectedCollectionIds.has(collection.id) ? 'selected' : ''}`}
                  onClick={() => toggleCollection(collection)}
                >
                  <div className="pp-checkbox">
                    {selectedCollectionIds.has(collection.id) && <span className="pp-check-icon">✓</span>}
                  </div>
                  <div className="pp-item-info">
                    <div className="pp-item-title">{collection.title}</div>
                    <div className="pp-item-handle">{collection.handle}</div>
                  </div>
                </div>
              ))}
              {displayCollections.length === 0 && !error && (
                <div className="pp-empty">No collections found</div>
              )}
            </div>
          )}

          {/* Multi-select confirm */}
          {selectedCollectionIds.size > 0 && (
            <div className="pp-multi-confirm">
              <span>{selectedCollectionIds.size} collection{selectedCollectionIds.size > 1 ? 's' : ''} selected</span>
              <button className="pp-confirm-btn" onClick={handleConfirm}>
                Add {selectedCollectionIds.size} Collection{selectedCollectionIds.size > 1 ? 's' : ''}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

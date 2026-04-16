import React, { useState, useEffect } from 'react';
import { api } from '../api/index.js';

const SAMPLE_PRICE_RULES = [
  { id: 1, title: 'SAVE10', value: '10.0', value_type: 'percentage', target_type: 'line_item' },
  { id: 2, title: 'FREESHIP', value: '0.0', value_type: 'free_shipping', target_type: 'shipping_line' },
  { id: 3, title: 'FLAT20', value: '20.0', value_type: 'fixed_amount', target_type: 'line_item' },
];

export default function DiscountCodePicker({ isOpen, onClose, onSelect, selectedIds = [] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [priceRules, setPriceRules] = useState([]);
  const [useSample, setUseSample] = useState(false);
  const [selectedRuleIds, setSelectedRuleIds] = useState(new Set());

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setPriceRules([]);
      setUseSample(false);
      setSelectedRuleIds(new Set(selectedIds.map(r => r.id || r)));
    }
  }, [isOpen, selectedIds]);

  async function loadPriceRules() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getShopifyPriceRules();
      if (data.error) {
        if (data.needs_auth) {
          setError('Shopify not connected. Showing sample discount codes.');
          setUseSample(true);
          setPriceRules(SAMPLE_PRICE_RULES);
        } else {
          setError(data.error);
        }
        return;
      }
      setPriceRules(data.price_rules || data || []);
    } catch (e) {
      setError('Failed to load discount codes: ' + e.message);
      setUseSample(true);
      setPriceRules(SAMPLE_PRICE_RULES);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (isOpen) {
      loadPriceRules();
    }
  }, [isOpen]);

  function toggleRule(rule) {
    setSelectedRuleIds(prev => {
      const next = new Set(prev);
      if (next.has(rule.id)) {
        next.delete(rule.id);
      } else {
        next.add(rule.id);
      }
      return next;
    });
  }

  function handleConfirm() {
    const selected = (useSample ? SAMPLE_PRICE_RULES : priceRules).filter(r => selectedRuleIds.has(r.id));
    onSelect(selected);
    onClose();
  }

  function formatValue(rule) {
    if (rule.value_type === 'percentage') {
      return `${parseFloat(rule.value)}% off`;
    } else if (rule.value_type === 'free_shipping') {
      return 'Free shipping';
    } else if (rule.value_type === 'fixed_amount') {
      return `$${parseFloat(rule.value)} off`;
    }
    return rule.value;
  }

  function getValueTypeLabel(valueType) {
    switch (valueType) {
      case 'percentage': return 'Percentage';
      case 'fixed_amount': return 'Fixed amount';
      case 'free_shipping': return 'Free shipping';
      default: return valueType;
    }
  }

  if (!isOpen) return null;

  const displayRules = useSample ? SAMPLE_PRICE_RULES : priceRules;

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
        .pp-item-meta { display: flex; gap: 8px; margin-top: 4px; }
        .pp-item-badge { font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }
        .pp-badge-percentage { background: rgba(139,92,246,0.2); color: #a78bfa; }
        .pp-badge-fixed { background: rgba(34,197,94,0.2); color: #22c55e; }
        .pp-badge-shipping { background: rgba(59,130,246,0.2); color: #3b82f6; }
        .pp-empty { text-align: center; padding: 48px; color: #52525b; font-size: 14px; }
        .pp-multi-confirm { padding: 14px 20px; border-top: 1px solid #27272a; display: flex; justify-content: space-between; align-items: center; background: #18181b; position: sticky; bottom: 0; }
        .pp-confirm-btn { background: #8b5cf6; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
      `}</style>
      <div className="pp-overlay" onClick={onClose}>
        <div className="pp-modal" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="pp-header">
            <div className="pp-title">
              <span>Select Discount Codes</span>
              {useSample && <span className="pp-sample-badge">Sample Data</span>}
            </div>
            <button className="pp-close" onClick={onClose}>×</button>
          </div>

          {/* Error */}
          {error && (
            <div className="pp-error">
              <span>{error}</span>
              {!useSample && (
                <button className="pp-sample-btn" onClick={() => { setUseSample(true); setPriceRules(SAMPLE_PRICE_RULES); setError(null); }}>
                  Load sample codes
                </button>
              )}
            </div>
          )}

          {/* Loading */}
          {loading && <div className="pp-loading">Loading discount codes...</div>}

          {/* Price rule list */}
          {!loading && (
            <div className="pp-list">
              {displayRules.map(rule => (
                <div
                  key={rule.id}
                  className={`pp-list-item ${selectedRuleIds.has(rule.id) ? 'selected' : ''}`}
                  onClick={() => toggleRule(rule)}
                >
                  <div className="pp-checkbox">
                    {selectedRuleIds.has(rule.id) && <span className="pp-check-icon">✓</span>}
                  </div>
                  <div className="pp-item-info">
                    <div className="pp-item-title">{rule.title}</div>
                    <div className="pp-item-meta">
                      <span className={`pp-item-badge ${
                        rule.value_type === 'percentage' ? 'pp-badge-percentage' :
                        rule.value_type === 'free_shipping' ? 'pp-badge-shipping' :
                        'pp-badge-fixed'
                      }`}>
                        {getValueTypeLabel(rule.value_type)}
                      </span>
                      <span style={{ fontSize: '11px', color: '#71717a' }}>
                        {formatValue(rule)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {displayRules.length === 0 && !error && (
                <div className="pp-empty">No discount codes found</div>
              )}
            </div>
          )}

          {/* Multi-select confirm */}
          {selectedRuleIds.size > 0 && (
            <div className="pp-multi-confirm">
              <span>{selectedRuleIds.size} code{selectedRuleIds.size > 1 ? 's' : ''} selected</span>
              <button className="pp-confirm-btn" onClick={handleConfirm}>
                Add {selectedRuleIds.size} Code{selectedRuleIds.size > 1 ? 's' : ''}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

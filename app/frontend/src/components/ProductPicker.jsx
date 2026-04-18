import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/index.js';

const SAMPLE_PRODUCTS = [
  {
    id: 'gid://shopify/Product/1',
    title: 'Premium Leather Wallet',
    vendor: 'StyleCo',
    image: 'https://picsum.photos/seed/wallet/200/200',
    images: [{ url: 'https://picsum.photos/seed/wallet/400/400', altText: 'Wallet' }],
    variants: [
      { id: 'gid://shopify/ProductVariant/1', title: 'Black', price: '49.99', compare_at_price: '79.99', inventory_quantity: 142, sku: 'WL-BLK-001' },
      { id: 'gid://shopify/ProductVariant/2', title: 'Brown', price: '49.99', compare_at_price: '79.99', inventory_quantity: 87, sku: 'WL-BRN-001' },
      { id: 'gid://shopify/ProductVariant/3', title: 'Navy', price: '49.99', compare_at_price: null, inventory_quantity: 0, sku: 'WL-NVY-001' },
    ],
  },
  {
    id: 'gid://shopify/Product/2',
    title: 'Wireless Bluetooth Earbuds',
    vendor: 'SoundWave',
    image: 'https://picsum.photos/seed/earbuds/200/200',
    images: [{ url: 'https://picsum.photos/seed/earbuds/400/400', altText: 'Earbuds' }],
    variants: [
      { id: 'gid://shopify/ProductVariant/4', title: 'White', price: '89.99', compare_at_price: '129.99', inventory_quantity: 230, sku: 'EB-WHT-001' },
      { id: 'gid://shopify/ProductVariant/5', title: 'Black', price: '89.99', compare_at_price: '129.99', inventory_quantity: 195, sku: 'EB-BLK-001' },
    ],
  },
  {
    id: 'gid://shopify/Product/3',
    title: 'Organic Cotton T-Shirt',
    vendor: 'EcoWear',
    image: 'https://picsum.photos/seed/tshirt/200/200',
    images: [{ url: 'https://picsum.photos/seed/tshirt/400/400', altText: 'T-Shirt' }],
    variants: [
      { id: 'gid://shopify/ProductVariant/6', title: 'Small / Blue', price: '34.99', compare_at_price: null, inventory_quantity: 500, sku: 'TS-SM-BLU' },
      { id: 'gid://shopify/ProductVariant/7', title: 'Medium / Blue', price: '34.99', compare_at_price: null, inventory_quantity: 412, sku: 'TS-MD-BLU' },
      { id: 'gid://shopify/ProductVariant/8', title: 'Large / Blue', price: '34.99', compare_at_price: null, inventory_quantity: 0, sku: 'TS-LG-BLU' },
    ],
  },
];

export default function ProductPicker({ isOpen, onClose, onSelect, selectedVariantId = null, multiSelect = false }) {
  const [step, setStep] = useState('products');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [pageInfo, setPageInfo] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedProductIds, setSelectedProductIds] = useState(new Set());
  const [useSample, setUseSample] = useState(false);
  const [sampleSearchResults, setSampleSearchResults] = useState(SAMPLE_PRODUCTS);

  const searchTimeout = useRef(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('products');
      setSearch('');
      setError(null);
      setProducts([]);
      setPageInfo(null);
      setSelectedProduct(null);
      setSelectedVariant(null);
      setSelectedProductIds(new Set());
      setUseSample(false);
      setSampleSearchResults(SAMPLE_PRODUCTS);
    }
  }, [isOpen]);

  async function loadProducts(query, cursor = null) {
    setLoading(true);
    setError(null);
    try {
      if (useSample) {
        const q = query.toLowerCase();
        const results = SAMPLE_PRODUCTS.filter(p =>
          p.title.toLowerCase().includes(q) || p.vendor?.toLowerCase().includes(q)
        );
        setSampleSearchResults(results);
        setProducts([]);
        setPageInfo(null);
        return;
      }
      const data = await api.getShopifyProducts(query, cursor, 25);
      if (data.error) {
        if (data.needs_auth) {
          setError('Shopify not connected. Showing sample products.');
          setUseSample(true);
          setSampleSearchResults(SAMPLE_PRODUCTS);
        } else {
          setError(data.error);
        }
        return;
      }
      setProducts(data.products || []);
      setPageInfo(data.pageInfo || null);
    } catch (e) {
      setError('Failed to load products: ' + e.message);
      setUseSample(true);
      setSampleSearchResults(SAMPLE_PRODUCTS);
    }
    setLoading(false);
  }

  function handleSearchChange(value) {
    setSearch(value);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => loadProducts(value), 300);
  }

  function handleProductClick(p) {
    if (multiSelect) {
      setSelectedProductIds(prev => {
        const next = new Set(prev);
        if (next.has(p.id)) {
          next.delete(p.id);
        } else {
          next.add(p.id);
        }
        return next;
      });
    } else {
      setSelectedProduct(p);
      setStep('variants');
    }
  }

  function handleVariantSelect(v) {
    setSelectedVariant(v);
    onSelect({ product: selectedProduct, variant: v });
    onClose();
  }

  function handleMultiConfirm() {
    const selectedProducts = (useSample ? sampleSearchResults : products).filter(p => selectedProductIds.has(p.id));
    onSelect(selectedProducts.map(p => ({ product: p, variant: p.variants?.[0] })));
    onClose();
  }

  if (!isOpen) return null;

  const displayProducts = useSample ? sampleSearchResults : products;

  return (
    <>
      <style>{`
        .pp-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 9999; display: flex; align-items: center; justify-content: center; }
        .pp-modal { background: #18181b; border: 1px solid #27272a; border-radius: 16px; width: 680px; max-width: 95vw; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; }
        .pp-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #27272a; }
        .pp-title { display: flex; align-items: center; gap: 10px; font-weight: 700; color: #fafafa; font-size: 15px; }
        .pp-sample-badge { font-size: 10px; font-weight: 700; background: #f59e0b; color: #000; padding: 2px 8px; border-radius: 9999px; text-transform: uppercase; }
        .pp-back { background: none; border: none; color: #a78bfa; cursor: pointer; font-size: 14px; font-weight: 600; padding: 0; }
        .pp-close { background: none; border: none; color: #71717a; cursor: pointer; font-size: 20px; line-height: 1; }
        .pp-search-wrap { padding: 12px 20px; border-bottom: 1px solid #27272a; }
        .pp-search { width: 100%; background: #0f0f14; border: 1px solid #27272a; color: #fafafa; padding: 10px 14px; border-radius: 8px; font-size: 14px; box-sizing: border-box; }
        .pp-search:focus { outline: none; border-color: #8b5cf6; }
        .pp-error { margin: 12px 20px; padding: 10px 14px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; color: #ef4444; font-size: 13px; display: flex; justify-content: space-between; align-items: center; gap: 8px; }
        .pp-sample-btn { background: #8b5cf6; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; white-space: nowrap; }
        .pp-loading { padding: 32px; text-align: center; color: #71717a; font-size: 14px; }
        .pp-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding: 16px 20px; overflow-y: auto; flex: 1; }
        .pp-card { background: #0f0f14; border: 2px solid #27272a; border-radius: 10px; overflow: hidden; cursor: pointer; transition: border-color 0.15s; position: relative; }
        .pp-card:hover { border-color: #3f3f46; }
        .pp-card.selected { border-color: #8b5cf6; }
        .pp-card-img { width: 100%; height: 120px; object-fit: cover; display: block; }
        .pp-card-body { padding: 10px 12px; }
        .pp-card-title { font-size: 13px; font-weight: 600; color: #fafafa; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pp-card-vendor { font-size: 11px; color: #71717a; margin-bottom: 4px; }
        .pp-card-price { font-size: 13px; font-weight: 700; color: #a1a1aa; margin-bottom: 2px; }
        .pp-card-meta { font-size: 11px; color: #52525b; }
        .pp-check { position: absolute; top: 8px; right: 8px; background: #8b5cf6; color: white; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }
        .pp-empty { grid-column: 1/-1; text-align: center; padding: 48px; color: #52525b; font-size: 14px; }
        .pp-multi-confirm { padding: 14px 20px; border-top: 1px solid #27272a; display: flex; justify-content: space-between; align-items: center; background: #18181b; position: sticky; bottom: 0; }
        .pp-confirm-btn { background: #8b5cf6; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
        .pp-load-more { padding: 12px 20px; text-align: center; }
        .pp-load-more button { background: #27272a; color: #a1a1aa; border: 1px solid #3f3f46; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; }
        .pp-product-header { display: flex; gap: 14px; padding: 16px 20px; border-bottom: 1px solid #27272a; }
        .pp-photo { width: 64px; height: 64px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }
        .pp-ph-title { font-size: 15px; font-weight: 600; color: #fafafa; margin-bottom: 4px; }
        .pp-ph-vendor { font-size: 12px; color: #71717a; }
        .pp-variant-list { overflow-y: auto; flex: 1; padding: 8px 0; }
        .pp-variant { display: flex; align-items: center; gap: 16px; padding: 12px 20px; cursor: pointer; transition: background 0.1s; }
        .pp-variant:hover { background: #0f0f14; }
        .pp-variant.out-of-stock { opacity: 0.4; cursor: not-allowed; }
        .pp-variant.selected { background: #1a1a2e; border: 2px solid #8b5cf6; border-radius: 8px; }
        .pp-var-info { flex: 1; }
        .pp-var-title { font-size: 14px; font-weight: 500; color: #fafafa; }
        .pp-var-sku { font-size: 11px; color: #52525b; margin-top: 2px; }
        .pp-var-pricing { display: flex; gap: 8px; align-items: center; }
        .pp-var-price { font-size: 14px; font-weight: 700; color: #fafafa; }
        .pp-var-compare { font-size: 12px; color: #71717a; text-decoration: line-through; }
        .pp-stock-ok { font-size: 12px; color: #22c55e; font-weight: 600; }
        .pp-stock-low { font-size: 12px; color: #f59e0b; font-weight: 600; }
        .pp-stock-out { font-size: 12px; color: #ef4444; font-weight: 600; }
      `}</style>
      <div className="pp-overlay" onClick={onClose}>
        <div className="pp-modal" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="pp-header">
            <div className="pp-title">
              {step === 'variants' && (
                <button className="pp-back" onClick={() => setStep('products')}>← Back</button>
              )}
              <span>{step === 'products' ? 'Select Product' : 'Select Variant'}</span>
              {useSample && <span className="pp-sample-badge">Sample Data</span>}
            </div>
            <button className="pp-close" onClick={onClose}>×</button>
          </div>

          {/* Search */}
          {step === 'products' && (
            <div className="pp-search-wrap">
              <input
                className="pp-search"
                placeholder="Search products..."
                value={search}
                onChange={e => handleSearchChange(e.target.value)}
                autoFocus
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="pp-error">
              <span>{error}</span>
              {!useSample && (
                <button className="pp-sample-btn" onClick={() => { setUseSample(true); setSampleSearchResults(SAMPLE_PRODUCTS); setError(null); }}>
                  Load sample products
                </button>
              )}
            </div>
          )}

          {/* Loading */}
          {loading && <div className="pp-loading">Loading...</div>}

          {/* Product grid */}
          {!loading && step === 'products' && (
            <>
              <div className="pp-grid">
                {displayProducts.map(p => (
                  <div
                    key={p.id}
                    className={`pp-card ${selectedProductIds.has(p.id) ? 'selected' : ''} ${selectedProduct?.id === p.id ? 'selected' : ''}`}
                    onClick={() => handleProductClick(p)}
                  >
                    <img src={p.image || 'https://picsum.photos/seed/placeholder/200/200'} className="pp-card-img" alt="" />
                    <div className="pp-card-body">
                      <div className="pp-card-title">{p.title}</div>
                      <div className="pp-card-vendor">{p.vendor}</div>
                      <div className="pp-card-price">
                        {p.variants?.length > 0
                          ? `$${Math.min(...p.variants.map(v => parseFloat(v.price || 0)).filter(Boolean))} – $${Math.max(...p.variants.map(v => parseFloat(v.price || 0)).filter(Boolean))}`
                          : '—'}
                      </div>
                      <div className="pp-card-meta">{p.variants?.length || 0} variants</div>
                    </div>
                    {selectedProductIds.has(p.id) && <div className="pp-check">✓</div>}
                  </div>
                ))}
                {displayProducts.length === 0 && !error && (
                  <div className="pp-empty">No products match{search ? ` "${search}"` : ''}</div>
                )}
              </div>

              {/* Multi-select confirm */}
              {multiSelect && selectedProductIds.size > 0 && (
                <div className="pp-multi-confirm">
                  <span>{selectedProductIds.size} product{selectedProductIds.size > 1 ? 's' : ''} selected</span>
                  <button className="pp-confirm-btn" onClick={handleMultiConfirm}>
                    Add {selectedProductIds.size} Product{selectedProductIds.size > 1 ? 's' : ''}
                  </button>
                </div>
              )}

              {/* Load more */}
              {pageInfo?.hasNextPage && (
                <div className="pp-load-more">
                  <button onClick={() => loadProducts(search, pageInfo.endCursor)} disabled={loading}>{loading ? 'Loading...' : 'Load more'}</button>
                </div>
              )}
            </>
          )}

          {/* Variant grid */}
          {!loading && step === 'variants' && selectedProduct && (
            <div className="pp-variants">
              <div className="pp-product-header">
                <img src={selectedProduct.image || selectedProduct.images?.[0]?.url || ''} className="pp-photo" alt="" />
                <div>
                  <div className="pp-ph-title">{selectedProduct.title}</div>
                  <div className="pp-ph-vendor">{selectedProduct.vendor}</div>
                </div>
              </div>
              <div className="pp-variant-list">
                {(selectedProduct.variants || []).map(v => (
                  <div
                    key={v.id}
                    className={`pp-variant ${v.inventory_quantity === 0 ? 'out-of-stock' : ''} ${v.id === selectedVariantId ? 'selected' : ''}`}
                    onClick={() => v.inventory_quantity !== 0 && handleVariantSelect(v)}
                  >
                    <div className="pp-var-info">
                      <div className="pp-var-title">{v.title}</div>
                      <div className="pp-var-sku">{v.sku}</div>
                    </div>
                    <div className="pp-var-pricing">
                      <span className="pp-var-price">${parseFloat(v.price || 0).toFixed(2)}</span>
                      {v.compare_at_price && parseFloat(v.compare_at_price) > parseFloat(v.price) && (
                        <span className="pp-var-compare">${parseFloat(v.compare_at_price).toFixed(2)}</span>
                      )}
                    </div>
                    <div className="pp-var-stock">
                      {v.inventory_quantity === null || v.inventory_quantity > 10 ? (
                        <span className="pp-stock-ok">In stock</span>
                      ) : v.inventory_quantity > 0 ? (
                        <span className="pp-stock-low">Low ({v.inventory_quantity})</span>
                      ) : (
                        <span className="pp-stock-out">Out of stock</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ProductPicker Component
// Search and select a single product with preview

import React, { useState, useEffect, useCallback } from 'react';
import { targetingApi } from '../api/targeting';

const ProductPicker = ({ 
  selectedProduct, 
  onChange, 
  placeholder = 'Search for a product...',
  label = 'Product'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = React.useRef(null);

  const fetchProducts = useCallback(async (query) => {
    setIsLoading(true);
    try {
      const products = await targetingApi.searchProducts(query);
      setResults(products);
    } catch (error) {
      console.error('Error searching products:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && results.length === 0) {
      fetchProducts('');
    }
  }, [isOpen, fetchProducts, results.length]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.length >= 2) {
      fetchProducts(value);
    } else if (value.length === 0) {
      fetchProducts('');
    }
  };

  const handleSelect = (product) => {
    onChange(product);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    onChange(null);
  };

  return (
    <div className="product-picker" ref={dropdownRef}>
      <label className="form-label">{label}</label>
      
      {selectedProduct ? (
        <div className="product-picker-selected">
          <img 
            src={selectedProduct.image || 'https://picsum.photos/seed/product/100/100'} 
            alt={selectedProduct.name}
            className="product-picker-image"
          />
          <div className="product-picker-info">
            <div className="product-picker-name">{selectedProduct.name}</div>
            <div className="product-picker-price">
              ${(selectedProduct.price || 0).toFixed(2)}
              {selectedProduct.compareAtPrice && (
                <span className="product-picker-compare">
                  ${selectedProduct.compareAtPrice.toFixed(2)}
                </span>
              )}
            </div>
          </div>
          <button 
            type="button" 
            className="btn-icon product-picker-clear"
            onClick={handleClear}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      ) : (
        <div className="product-picker-trigger" onClick={() => setIsOpen(!isOpen)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <span>{placeholder}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      )}

      {isOpen && (
        <div className="product-picker-dropdown">
          <div className="product-picker-search">
            <input
              type="text"
              className="form-input"
              placeholder="Search products..."
              value={searchTerm}
              onChange={handleSearch}
              autoFocus
            />
          </div>
          
          <div className="product-picker-results">
            {isLoading ? (
              <div className="product-picker-loading">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
                Searching...
              </div>
            ) : results.length === 0 ? (
              <div className="product-picker-empty">
                {searchTerm ? 'No products found' : 'Start typing to search'}
              </div>
            ) : (
              results.map(product => (
                <div
                  key={product.id}
                  className={`product-picker-item ${selectedProduct?.id === product.id ? 'selected' : ''}`}
                  onClick={() => handleSelect(product)}
                >
                  <img 
                    src={product.image || 'https://picsum.photos/seed/product/100/100'} 
                    alt={product.name}
                    className="product-picker-item-image"
                  />
                  <div className="product-picker-item-info">
                    <div className="product-picker-item-name">{product.name}</div>
                    <div className="product-picker-item-price">
                      ${(product.price || 0).toFixed(2)}
                    </div>
                  </div>
                  {selectedProduct?.id === product.id && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#008060" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        .product-picker {
          position: relative;
        }
        .product-picker-trigger {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: #FAFAFA;
          border: 1px dashed #E4E4E7;
          border-radius: 8px;
          cursor: pointer;
          color: #6D7175;
          transition: all 0.15s;
        }
        .product-picker-trigger:hover {
          border-color: #5C6AC4;
          background: rgba(92, 106, 196, 0.02);
        }
        .product-picker-trigger span {
          flex: 1;
        }
        .product-picker-selected {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          background: white;
          border: 1px solid #E4E4E7;
          border-radius: 8px;
        }
        .product-picker-image {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          object-fit: cover;
          background: #F6F6F7;
        }
        .product-picker-info {
          flex: 1;
        }
        .product-picker-name {
          font-size: 14px;
          font-weight: 500;
          color: #202223;
        }
        .product-picker-price {
          font-size: 13px;
          color: #008060;
          font-weight: 500;
        }
        .product-picker-compare {
          color: #6D7175;
          text-decoration: line-through;
          margin-left: 6px;
          font-weight: 400;
        }
        .product-picker-clear {
          color: #6D7175;
        }
        .product-picker-clear:hover {
          color: #DC4545;
          background: rgba(220, 69, 69, 0.05);
        }
        .product-picker-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          margin-top: 4px;
          background: white;
          border: 1px solid #E4E4E7;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          z-index: 1000;
          overflow: hidden;
        }
        .product-picker-search {
          padding: 12px;
          border-bottom: 1px solid #E4E4E7;
        }
        .product-picker-results {
          max-height: 300px;
          overflow-y: auto;
        }
        .product-picker-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          cursor: pointer;
          transition: background 0.1s;
        }
        .product-picker-item:hover {
          background: #F6F6F7;
        }
        .product-picker-item.selected {
          background: rgba(92, 106, 196, 0.05);
        }
        .product-picker-item-image {
          width: 40px;
          height: 40px;
          border-radius: 6px;
          object-fit: cover;
          background: #F6F6F7;
        }
        .product-picker-item-info {
          flex: 1;
        }
        .product-picker-item-name {
          font-size: 14px;
          font-weight: 500;
          color: #202223;
        }
        .product-picker-item-price {
          font-size: 13px;
          color: #6D7175;
        }
        .product-picker-loading,
        .product-picker-empty {
          padding: 30px;
          text-align: center;
          color: #6D7175;
        }
        .product-picker-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ProductPicker;

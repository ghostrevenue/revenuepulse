import React, { useState } from 'react';

const ProductSelector = ({ products, selectedProducts = [], onSelect, onRemove, placeholder = 'Search products...', single = false }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (product) => {
    if (single) {
      onSelect(product);
    } else {
      onSelect(product);
    }
  };

  const isSelected = (productId) => {
    if (single) {
      return selectedProducts.some(p => p.id === productId);
    }
    return selectedProducts.some(p => p.id === productId);
  };

  return (
    <div className="product-selector">
      <div className="product-selector-search">
        <input
          type="text"
          className="form-input"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={() => setSearchTerm('')}
          >
            Clear
          </button>
        )}
      </div>

      {selectedProducts.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: '#6D7175', marginBottom: '8px' }}>
            {single ? 'Selected Product' : 'Selected Products'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {selectedProducts.map(product => (
              <div
                key={product.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  background: 'white',
                  borderRadius: '8px',
                  border: '1px solid #E4E4E7',
                }}
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="product-thumb"
                  style={{ width: '36px', height: '36px', borderRadius: '6px' }}
                />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: '#202223' }}>
                    {product.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6D7175' }}>
                    ${product.price.toFixed(2)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(product.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6D7175',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="product-results">
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#6D7175' }}>
            No products found
          </div>
        ) : (
          filteredProducts.map(product => (
            <div
              key={product.id}
              className={`product-result-item ${isSelected(product.id) ? 'selected' : ''}`}
              onClick={() => !isSelected(product.id) && handleSelect(product)}
              style={{
                opacity: isSelected(product.id) ? 0.5 : 1,
                cursor: isSelected(product.id) ? 'not-allowed' : 'pointer',
              }}
            >
              <img
                src={product.image}
                alt={product.name}
                className="product-thumb"
              />
              <div className="product-info">
                <div className="product-name">{product.name}</div>
                <div className="product-price">${product.price.toFixed(2)}</div>
              </div>
              {isSelected(product.id) && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#008060" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductSelector;

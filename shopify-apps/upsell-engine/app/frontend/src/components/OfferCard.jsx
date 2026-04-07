// OfferCard Component
// Display card for offers in Accepted/Declined lists with inline editing

import React, { useState } from 'react';
import ProductPicker from './ProductPicker';

const DragHandleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="5" r="1" fill="currentColor"/>
    <circle cx="9" cy="12" r="1" fill="currentColor"/>
    <circle cx="9" cy="19" r="1" fill="currentColor"/>
    <circle cx="15" cy="5" r="1" fill="currentColor"/>
    <circle cx="15" cy="12" r="1" fill="currentColor"/>
    <circle cx="15" cy="19" r="1" fill="currentColor"/>
  </svg>
);

const OfferCard = ({
  offer,
  index,
  totalCount,
  type, // 'accepted' | 'declined'
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleChange = (field, value) => {
    onChange({ ...offer, [field]: value });
  };

  const handleProductChange = (product) => {
    onChange({ 
      ...offer, 
      productId: product?.id || '',
      productName: product?.name || '',
      productImage: product?.image || '',
      productPrice: product?.price || 0,
    });
  };

  const pricingTypes = [
    { value: 'percentage', label: '% Off' },
    { value: 'fixed', label: '$ Off' },
    { value: 'bundle', label: 'Bundle Price' },
  ];

  return (
    <div className={`offer-card ${offer.enabled === false ? 'disabled' : ''}`}>
      <div className="offer-card-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="offer-card-drag">
          <DragHandleIcon />
        </div>
        
        <div className="offer-card-position">
          {type === 'accepted' ? 'Upsell' : 'Downsell'} {index + 1}
          {totalCount > 1 && (
            <span className="offer-card-position-hint">
              of {totalCount}
            </span>
          )}
        </div>

        <div className="offer-card-preview">
          {offer.productName && (
            <>
              <img 
                src={offer.productImage || 'https://picsum.photos/seed/product/100/100'} 
                alt=""
                className="offer-card-preview-image"
              />
              <span className="offer-card-preview-name">{offer.productName}</span>
            </>
          )}
          {!offer.productName && (
            <span className="offer-card-preview-empty">No product selected</span>
          )}
        </div>

        <div className="offer-card-toggle">
          <label className="toggle-container">
            <input
              type="checkbox"
              checked={offer.enabled !== false}
              onChange={(e) => handleChange('enabled', e.target.checked)}
              onClick={(e) => e.stopPropagation()}
            />
            <div className={`toggle ${offer.enabled !== false ? 'active' : ''}`}>
              <div className="toggle-knob" />
            </div>
          </label>
        </div>

        <div className="offer-card-actions">
          <button
            type="button"
            className="btn-icon"
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
            disabled={index === 0}
            title="Move up"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="18 15 12 9 6 15"/>
            </svg>
          </button>
          <button
            type="button"
            className="btn-icon"
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
            disabled={index === totalCount - 1}
            title="Move down"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <button
            type="button"
            className="btn-icon btn-danger-icon"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            title="Remove offer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>

        <div className="offer-card-chevron">
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>

      {isExpanded && (
        <div className="offer-card-body">
          <div className="offer-card-grid">
            {/* Product Selection */}
            <div className="offer-card-field full-width">
              <ProductPicker
                label="Product"
                selectedProduct={offer.productId ? {
                  id: offer.productId,
                  name: offer.productName,
                  image: offer.productImage,
                  price: offer.productPrice,
                } : null}
                onChange={handleProductChange}
                placeholder="Search for a product..."
              />
            </div>

            {/* Pricing */}
            <div className="offer-card-field">
              <label className="form-label">Pricing Type</label>
              <select
                className="form-input"
                value={offer.pricingType || 'percentage'}
                onChange={(e) => handleChange('pricingType', e.target.value)}
              >
                {pricingTypes.map(pt => (
                  <option key={pt.value} value={pt.value}>{pt.label}</option>
                ))}
              </select>
            </div>

            <div className="offer-card-field">
              <label className="form-label">
                {offer.pricingType === 'percentage' ? 'Discount %' : 
                 offer.pricingType === 'fixed' ? 'Discount $' : 'Bundle Price $'}
              </label>
              <input
                type="number"
                className="form-input"
                value={offer.pricingValue || 0}
                onChange={(e) => handleChange('pricingValue', parseFloat(e.target.value) || 0)}
                min="0"
                step={offer.pricingType === 'percentage' ? '1' : '0.01'}
              />
            </div>

            {/* CTA */}
            <div className="offer-card-field">
              <label className="form-label">CTA Button Text</label>
              <input
                type="text"
                className="form-input"
                value={offer.ctaText || 'Add to Cart'}
                onChange={(e) => handleChange('ctaText', e.target.value)}
                placeholder="Add to Cart"
              />
            </div>

            <div className="offer-card-field">
              <label className="form-label">Decline Text</label>
              <input
                type="text"
                className="form-input"
                value={offer.declineText || 'No thanks'}
                onChange={(e) => handleChange('declineText', e.target.value)}
                placeholder="No thanks"
              />
            </div>
          </div>

          {/* Mini Preview */}
          <div className="offer-card-preview-section">
            <div className="offer-card-preview-label">Preview</div>
            <div className={`offer-popup-preview ${offer.backgroundStyle || 'light'}`}>
              <div className="offer-popup-badge" style={{ backgroundColor: offer.badgeColor || '#5C6AC4' }}>
                {offer.badgeText || 'OFFER'}
              </div>
              <img 
                src={offer.productImage || 'https://picsum.photos/seed/product/100/100'} 
                alt=""
                className="offer-popup-image"
              />
              <div className="offer-popup-title">{offer.headline || 'Special Offer'}</div>
              <div className="offer-popup-price">
                {offer.pricingType === 'percentage' && `-${offer.pricingValue || 0}%`}
                {offer.pricingType === 'fixed' && `-$${(offer.pricingValue || 0).toFixed(2)}`}
                {offer.pricingType === 'bundle' && `$${(offer.pricingValue || 0).toFixed(2)}`}
              </div>
              <button className="offer-popup-cta">{offer.ctaText || 'Add to Cart'}</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .offer-card {
          background: white;
          border: 1px solid #E4E4E7;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.2s;
        }
        .offer-card:hover {
          border-color: #5C6AC4;
        }
        .offer-card.disabled {
          opacity: 0.6;
        }
        .offer-card.disabled .offer-card-header {
          background: #F6F6F7;
        }
        .offer-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          cursor: pointer;
          transition: background 0.1s;
        }
        .offer-card-header:hover {
          background: #FAFAFA;
        }
        .offer-card-drag {
          color: #C1C1C1;
          cursor: grab;
        }
        .offer-card-drag:active {
          cursor: grabbing;
        }
        .offer-card-position {
          font-size: 13px;
          font-weight: 600;
          color: #202223;
          min-width: 70px;
        }
        .offer-card-position-hint {
          font-weight: 400;
          color: #6D7175;
          margin-left: 4px;
        }
        .offer-card-preview {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        .offer-card-preview-image {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          object-fit: cover;
          background: #F6F6F7;
        }
        .offer-card-preview-name {
          font-size: 13px;
          color: #202223;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .offer-card-preview-empty {
          font-size: 13px;
          color: #C1C1C1;
          font-style: italic;
        }
        .offer-card-toggle {
          display: flex;
          align-items: center;
        }
        .offer-card-toggle input {
          display: none;
        }
        .offer-card-actions {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .offer-card-actions .btn-icon {
          padding: 6px;
          border-radius: 6px;
        }
        .offer-card-actions .btn-icon:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .btn-danger-icon:hover {
          color: #DC4545;
          background: rgba(220, 69, 69, 0.1);
        }
        .offer-card-chevron {
          color: #6D7175;
        }
        .offer-card-body {
          padding: 16px;
          border-top: 1px solid #E4E4E7;
          background: #FAFAFA;
        }
        .offer-card-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }
        .offer-card-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .offer-card-field.full-width {
          grid-column: 1 / -1;
        }
        .offer-card-field select,
        .offer-card-field input {
          padding: 8px 12px;
          font-size: 13px;
        }
        .offer-card-preview-section {
          border-top: 1px solid #E4E4E7;
          padding-top: 16px;
        }
        .offer-card-preview-label {
          font-size: 12px;
          font-weight: 500;
          color: #6D7175;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .offer-popup-preview {
          max-width: 240px;
          margin: 0 auto;
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          background: white;
          border: 1px solid #E4E4E7;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .offer-popup-preview.dark {
          background: #1A1A2E;
          color: white;
        }
        .offer-popup-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          color: white;
          margin-bottom: 12px;
        }
        .offer-popup-image {
          width: 80px;
          height: 80px;
          border-radius: 8px;
          object-fit: cover;
          margin-bottom: 12px;
          background: #F6F6F7;
        }
        .offer-popup-title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 8px;
          color: inherit;
        }
        .offer-popup-price {
          font-size: 18px;
          font-weight: 700;
          color: #008060;
          margin-bottom: 12px;
        }
        .offer-popup-preview.dark .offer-popup-price {
          color: #4ADE80;
        }
        .offer-popup-cta {
          width: 100%;
          padding: 10px 16px;
          background: #5C6AC4;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .offer-popup-preview.dark .offer-popup-cta {
          background: #8A94C7;
        }
      `}</style>
    </div>
  );
};

export default OfferCard;

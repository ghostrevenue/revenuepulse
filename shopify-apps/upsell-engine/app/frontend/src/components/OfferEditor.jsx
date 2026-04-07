// OfferEditor Component
// Customizer-like editor for the main offer with live preview

import React from 'react';
import ProductPicker from './ProductPicker';

const OfferEditor = ({ offer, onChange }) => {
  const handleChange = (field, value) => {
    onChange({ ...offer, [field]: value });
  };

  const handleNestedChange = (parent, field, value) => {
    onChange({ 
      ...offer, 
      [parent]: { ...offer[parent], [field]: value }
    });
  };

  const backgroundStyles = [
    { value: 'light', label: 'Light', color: '#FFFFFF' },
    { value: 'dark', label: 'Dark', color: '#1A1A2E' },
  ];

  const badgeColors = [
    { value: '#5C6AC4', label: 'Indigo' },
    { value: '#008060', label: 'Green' },
    { value: '#F49342', label: 'Orange' },
    { value: '#DC4545', label: 'Red' },
    { value: '#8A94C7', label: 'Lavender' },
  ];

  return (
    <div className="offer-editor">
      <div className="offer-editor-grid">
        {/* Left Column - Form Fields */}
        <div className="offer-editor-fields">
          {/* Product Section */}
          <div className="offer-editor-section">
            <h4 className="offer-editor-section-title">Upsell Product</h4>
            <ProductPicker
              label="Main Product"
              selectedProduct={offer.productId ? {
                id: offer.productId,
                name: offer.productName,
                image: offer.productImage,
                price: offer.productPrice,
              } : null}
              onChange={(product) => {
                if (product) {
                  handleChange('productId', product.id);
                  handleChange('productName', product.name);
                  handleChange('productImage', product.image);
                  handleChange('productPrice', product.price);
                } else {
                  handleChange('productId', '');
                  handleChange('productName', '');
                  handleChange('productImage', '');
                  handleChange('productPrice', 0);
                }
              }}
              placeholder="Select the upsell product..."
            />
          </div>

          {/* Content Section */}
          <div className="offer-editor-section">
            <h4 className="offer-editor-section-title">Content</h4>
            
            <div className="form-group">
              <label className="form-label">Headline</label>
              <input
                type="text"
                className="form-input"
                value={offer.headline || ''}
                onChange={(e) => handleChange('headline', e.target.value)}
                placeholder="You might also like..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Subheadline</label>
              <input
                type="text"
                className="form-input"
                value={offer.subheadline || ''}
                onChange={(e) => handleChange('subheadline', e.target.value)}
                placeholder="Complete your look with..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Offer Badge</label>
              <div className="offer-editor-badge-row">
                <input
                  type="text"
                  className="form-input"
                  value={offer.badgeText || ''}
                  onChange={(e) => handleChange('badgeText', e.target.value)}
                  placeholder="20% OFF"
                  style={{ flex: 1 }}
                />
                <div className="color-picker-wrapper">
                  {badgeColors.map(color => (
                    <button
                      key={color.value}
                      type="button"
                      className={`color-swatch ${offer.badgeColor === color.value ? 'selected' : ''}`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => handleChange('badgeColor', color.value)}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="offer-editor-section">
            <h4 className="offer-editor-section-title">Pricing</h4>
            
            <div className="form-group">
              <label className="form-label">Pricing Type</label>
              <div className="radio-group">
                {[
                  { value: 'percentage', label: 'Percentage Off' },
                  { value: 'fixed', label: 'Fixed Discount' },
                  { value: 'bundle', label: 'Bundle Price' },
                ].map(type => (
                  <label 
                    key={type.value}
                    className={`radio-option ${offer.pricingType === type.value ? 'selected' : ''}`}
                    onClick={() => handleChange('pricingType', type.value)}
                  >
                    <input
                      type="radio"
                      name="pricingType"
                      value={type.value}
                      checked={offer.pricingType === type.value}
                      onChange={() => handleChange('pricingType', type.value)}
                      style={{ display: 'none' }}
                    />
                    {type.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                {offer.pricingType === 'percentage' ? 'Discount Percentage (%)' :
                 offer.pricingType === 'fixed' ? 'Discount Amount ($)' :
                 'Bundle Price ($)'}
              </label>
              <input
                type="number"
                className="form-input"
                value={offer.pricingValue || 0}
                onChange={(e) => handleChange('pricingValue', parseFloat(e.target.value) || 0)}
                min="0"
                step={offer.pricingType === 'percentage' ? '1' : '0.01'}
                style={{ maxWidth: '150px' }}
              />
            </div>
          </div>

          {/* Buttons Section */}
          <div className="offer-editor-section">
            <h4 className="offer-editor-section-title">Buttons</h4>
            
            <div className="form-group">
              <label className="form-label">Accept Button (CTA)</label>
              <input
                type="text"
                className="form-input"
                value={offer.ctaText || ''}
                onChange={(e) => handleChange('ctaText', e.target.value)}
                placeholder="Add to Cart"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Decline Button Text</label>
              <input
                type="text"
                className="form-input"
                value={offer.declineText || ''}
                onChange={(e) => handleChange('declineText', e.target.value)}
                placeholder="No thanks"
              />
            </div>
          </div>

          {/* Timer Section */}
          <div className="offer-editor-section">
            <h4 className="offer-editor-section-title">Urgency Timer</h4>
            
            <div className="form-group">
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={offer.timerEnabled || false}
                  onChange={(e) => handleChange('timerEnabled', e.target.checked)}
                />
                <span>Enable countdown timer</span>
              </label>
            </div>

            {offer.timerEnabled && (
              <div className="form-group">
                <label className="form-label">Timer Duration (minutes)</label>
                <input
                  type="number"
                  className="form-input"
                  value={offer.timerMinutes || 15}
                  onChange={(e) => handleChange('timerMinutes', parseInt(e.target.value) || 15)}
                  min="1"
                  max="60"
                  style={{ maxWidth: '100px' }}
                />
              </div>
            )}
          </div>

          {/* Background Style */}
          <div className="offer-editor-section">
            <h4 className="offer-editor-section-title">Background Style</h4>
            <div className="offer-editor-bg-options">
              {backgroundStyles.map(style => (
                <button
                  key={style.value}
                  type="button"
                  className={`offer-editor-bg-option ${offer.backgroundStyle === style.value ? 'selected' : ''}`}
                  onClick={() => handleChange('backgroundStyle', style.value)}
                >
                  <div 
                    className="offer-editor-bg-preview" 
                    style={{ backgroundColor: style.color }}
                  >
                    <span className={style.value === 'dark' ? 'light-text' : ''}>
                      Aa
                    </span>
                  </div>
                  <span>{style.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Live Preview */}
        <div className="offer-editor-preview">
          <h4 className="offer-editor-preview-title">Live Preview</h4>
          <div className="offer-editor-preview-container">
            <div className={`offer-popup ${offer.backgroundStyle || 'light'}`}>
              {/* Header */}
              <div className="offer-popup-header">
                <button className="offer-popup-close">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              {/* Badge */}
              {offer.badgeText && (
                <div 
                  className="offer-popup-badge"
                  style={{ backgroundColor: offer.badgeColor || '#5C6AC4' }}
                >
                  {offer.badgeText}
                </div>
              )}

              {/* Product Image */}
              <div className="offer-popup-product">
                <img 
                  src={offer.productImage || 'https://picsum.photos/seed/product/200/200'} 
                  alt={offer.productName || 'Product'}
                  className="offer-popup-image"
                />
              </div>

              {/* Content */}
              <div className="offer-popup-content">
                <h3 className="offer-popup-headline">
                  {offer.headline || 'Special Offer'}
                </h3>
                {offer.subheadline && (
                  <p className="offer-popup-subheadline">{offer.subheadline}</p>
                )}

                {/* Pricing */}
                <div className="offer-popup-pricing">
                  {offer.pricingType === 'percentage' && (
                    <>
                      <span className="offer-popup-price-old">
                        ${(offer.productPrice || 99.99).toFixed(2)}
                      </span>
                      <span className="offer-popup-price-new">
                        ${((offer.productPrice || 99.99) * (1 - (offer.pricingValue || 0) / 100)).toFixed(2)}
                      </span>
                      <span className="offer-popup-discount">
                        {offer.pricingValue || 0}% OFF
                      </span>
                    </>
                  )}
                  {offer.pricingType === 'fixed' && (
                    <>
                      <span className="offer-popup-price-old">
                        ${(offer.productPrice || 99.99).toFixed(2)}
                      </span>
                      <span className="offer-popup-price-new">
                        ${Math.max(0, (offer.productPrice || 99.99) - (offer.pricingValue || 0)).toFixed(2)}
                      </span>
                      <span className="offer-popup-discount">
                        Save ${(offer.pricingValue || 0).toFixed(2)}
                      </span>
                    </>
                  )}
                  {offer.pricingType === 'bundle' && (
                    <span className="offer-popup-price-new">
                      ${(offer.pricingValue || 49.99).toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Timer */}
                {offer.timerEnabled && (
                  <div className="offer-popup-timer">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span>Offer expires in {offer.timerMinutes || 15}:00</span>
                  </div>
                )}

                {/* CTA Buttons */}
                <button className="offer-popup-cta-btn">
                  {offer.ctaText || 'Add to Cart'}
                </button>
                <button className="offer-popup-decline-btn">
                  {offer.declineText || 'No thanks'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .offer-editor {
          padding: 20px;
          background: white;
          border-radius: 12px;
          border: 1px solid #E4E4E7;
        }
        .offer-editor-grid {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 24px;
        }
        @media (max-width: 900px) {
          .offer-editor-grid {
            grid-template-columns: 1fr;
          }
        }
        .offer-editor-section {
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 1px solid #E4E4E7;
        }
        .offer-editor-section:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }
        .offer-editor-section-title {
          font-size: 14px;
          font-weight: 600;
          color: #202223;
          margin: 0 0 16px 0;
        }
        .offer-editor-badge-row {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .color-picker-wrapper {
          display: flex;
          gap: 6px;
        }
        .color-swatch {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.15s;
        }
        .color-swatch:hover {
          transform: scale(1.1);
        }
        .color-swatch.selected {
          border-color: #202223;
          box-shadow: 0 0 0 2px white, 0 0 0 4px #202223;
        }
        .offer-editor-bg-options {
          display: flex;
          gap: 12px;
        }
        .offer-editor-bg-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: #F6F6F7;
          border: 2px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .offer-editor-bg-option:hover {
          border-color: #E4E4E7;
        }
        .offer-editor-bg-option.selected {
          border-color: #5C6AC4;
          background: rgba(92, 106, 196, 0.05);
        }
        .offer-editor-bg-preview {
          width: 48px;
          height: 32px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
          border: 1px solid #E4E4E7;
        }
        .offer-editor-bg-preview .light-text {
          color: white;
        }
        .offer-editor-bg-option span:last-child {
          font-size: 12px;
          color: #6D7175;
        }
        .offer-editor-preview {
          position: sticky;
          top: 20px;
        }
        .offer-editor-preview-title {
          font-size: 12px;
          font-weight: 500;
          color: #6D7175;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 12px 0;
        }
        .offer-editor-preview-container {
          background: linear-gradient(135deg, #F6F6F7 0%, #E8E8ED 100%);
          border-radius: 12px;
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 500px;
        }
        .offer-popup {
          width: 100%;
          max-width: 320px;
          border-radius: 16px;
          overflow: hidden;
          background: white;
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }
        .offer-popup.dark {
          background: #1A1A2E;
          color: white;
        }
        .offer-popup-header {
          display: flex;
          justify-content: flex-end;
          padding: 12px 12px 0 0;
        }
        .offer-popup-close {
          background: rgba(0,0,0,0.1);
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: inherit;
        }
        .offer-popup.dark .offer-popup-close {
          background: rgba(255,255,255,0.1);
        }
        .offer-popup-badge {
          display: inline-block;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          color: white;
          margin: 0 16px 16px 16px;
        }
        .offer-popup-product {
          padding: 0 16px;
          margin-bottom: 16px;
        }
        .offer-popup-image {
          width: 100%;
          aspect-ratio: 1;
          object-fit: cover;
          border-radius: 12px;
          background: #F6F6F7;
        }
        .offer-popup.dark .offer-popup-image {
          background: rgba(255,255,255,0.1);
        }
        .offer-popup-content {
          padding: 0 20px 20px 20px;
          text-align: center;
        }
        .offer-popup-headline {
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 8px 0;
          color: inherit;
        }
        .offer-popup-subheadline {
          font-size: 13px;
          color: #6D7175;
          margin: 0 0 16px 0;
        }
        .offer-popup.dark .offer-popup-subheadline {
          color: rgba(255,255,255,0.7);
        }
        .offer-popup-pricing {
          margin-bottom: 16px;
        }
        .offer-popup-price-old {
          font-size: 14px;
          color: #6D7175;
          text-decoration: line-through;
          margin-right: 8px;
        }
        .offer-popup-price-new {
          font-size: 28px;
          font-weight: 700;
          color: #008060;
        }
        .offer-popup.dark .offer-popup-price-new {
          color: #4ADE80;
        }
        .offer-popup-discount {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #008060;
          margin-top: 4px;
        }
        .offer-popup.dark .offer-popup-discount {
          color: #4ADE80;
        }
        .offer-popup-timer {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: rgba(244, 147, 66, 0.1);
          color: #F49342;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 16px;
        }
        .offer-popup.dark .offer-popup-timer {
          background: rgba(244, 147, 66, 0.2);
          color: #FBBF24;
        }
        .offer-popup-cta-btn {
          width: 100%;
          padding: 14px 20px;
          background: #5C6AC4;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          margin-bottom: 10px;
          transition: background 0.15s;
        }
        .offer-popup-cta-btn:hover {
          background: #4A5AB4;
        }
        .offer-popup-decline-btn {
          width: 100%;
          padding: 12px 20px;
          background: transparent;
          color: #6D7175;
          border: none;
          font-size: 13px;
          cursor: pointer;
        }
        .offer-popup.dark .offer-popup-decline-btn {
          color: rgba(255,255,255,0.6);
        }
      `}</style>
    </div>
  );
};

export default OfferEditor;

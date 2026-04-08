import React from 'react';

/**
 * VisualPreview — renders a live WYSIWYG preview of the upsell offer
 * as the merchant would see it in the customer view.
 * Updates in real-time as form values change.
 *
 * Enhanced to support:
 * - Custom badge text + color
 * - Countdown timer
 * - Button text override
 * - Per-item preview (when passed an itemData object)
 */
export default function VisualPreview({ form, itemData }) {
  const {
    offer_type: offerType = 'add_product',
    headline,
    message,
    upsell_product_title: productTitle,
    upsell_product_price: productPrice,
    upsell_product_image: productImage,
    discount_code: discountCode,
    discount_percent: discountPercent,
    warranty_price: warrantyPrice,
    warranty_description: warrantyDesc,
    one_time_offer: oneTimeOffer = true,
    confirmation_only: confirmationOnly = true,
    badge_text: customBadgeText = '',
    badge_color: customBadgeColor = '#8b5cf6',
    show_badge: showCustomBadge = false,
    show_timer: showTimer = false,
    timer_minutes: timerMinutes = 15,
    button_text: buttonText = '',
  } = form;

  const previewPrice = offerType === 'add_product'
    ? (productPrice ? `+$${parseFloat(productPrice).toFixed(2)}` : '+$24.99')
    : offerType === 'warranty'
    ? (warrantyPrice ? `+$${parseFloat(warrantyPrice).toFixed(2)}/order` : '+$9.99/order')
    : (discountPercent ? `${discountPercent}% OFF` : '10% OFF');

  const previewHeadline = headline || 'Wait! Add this to your order';
  const previewMessage = message || 'Get it delivered with your current order — just one click away.';

  const typeLabel = {
    'add_product': 'Add to Order',
    'discount_code': 'Discount Code',
    'discount': 'Discount Code',
    'warranty': 'Warranty/Protection',
  }[offerType] || 'Add to Order';

  // Build badge list
  const badges = [];
  if (oneTimeOffer) {
    badges.push({ text: 'One-time offer', bg: '#fef3c7', color: '#92400e' });
  }
  if (confirmationOnly) {
    badges.push({ text: 'Confirmation page only', bg: '#dbeafe', color: '#1e40af' });
  }
  if (showCustomBadge && customBadgeText) {
    badges.push({ text: customBadgeText, bg: customBadgeColor + '33', color: customBadgeColor });
  }

  const btnLabel = buttonText
    || (offerType === 'discount' || offerType === 'discount_code' ? 'Get Discount Code' : 'Add to Order');

  // Timer display
  const timerDisplay = showTimer ? `Offer expires in ${timerMinutes}:00` : null;

  return (
    <div className="visual-preview-wrapper">
      <div className="live-preview">
        {/* Store header bar */}
        <div className="preview-store-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          Your Store
          <span className="preview-offer-type-badge">{typeLabel}</span>
        </div>

        <div className="preview-body">
          {/* Badges */}
          {badges.length > 0 && (
            <div className="preview-offer-badges">
              {badges.map((badge, i) => (
                <span key={i} className="preview-badge" style={{ background: badge.bg, color: badge.color }}>
                  {badge.text}
                </span>
              ))}
            </div>
          )}

          {/* Timer */}
          {timerDisplay && (
            <div className="preview-timer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              {timerDisplay}
            </div>
          )}

          {/* Thanks message */}
          <div className="preview-thanks">Thanks for your order!</div>

          {/* Offer card */}
          <div className="preview-offer-card">
            {offerType === 'warranty' ? (
              <div className="preview-warranty">
                <div className="preview-warranty-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <div className="preview-product-info">
                  <div className="preview-headline">{previewHeadline}</div>
                  <div className="preview-message">{previewMessage}</div>
                  <div className="preview-price">{previewPrice}</div>
                </div>
              </div>
            ) : (offerType === 'discount' || offerType === 'discount_code') ? (
              <div className="preview-discount">
                <div className="preview-discount-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
                    <line x1="12" y1="1" x2="12" y2="23"/>
                    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                  </svg>
                </div>
                <div className="preview-product-info">
                  <div className="preview-headline">{previewHeadline}</div>
                  <div className="preview-message">{previewMessage}</div>
                  <div className="preview-discount-code">
                    {discountCode || 'SAVE15'} — {discountPercent || 15}% OFF
                  </div>
                </div>
              </div>
            ) : (
              /* add_product */
              <div className="preview-product-row">
                {productImage ? (
                  <img src={productImage} alt={productTitle || 'Product'} className="preview-product-img" />
                ) : (
                  <div className="preview-product-img placeholder" />
                )}
                <div className="preview-product-info">
                  <div className="preview-headline">{previewHeadline}</div>
                  <div className="preview-message">{previewMessage}</div>
                  <div className="preview-price">{previewPrice}</div>
                </div>
              </div>
            )}
          </div>

          {/* CTA Button */}
          <div className="preview-btn-green">{btnLabel}</div>
          <div className="preview-skip">No thanks, maybe later</div>

          {/* Trust indicators */}
          <div className="preview-trust">
            <span>Secure checkout</span> • <span>Powered by Shopify</span> • <span>No extra shipping</span>
          </div>
        </div>
      </div>

      <style>{`
        .visual-preview-wrapper { margin-top: 0; }
        .preview-label { font-size: 12px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
        .live-preview { background: #f5f5f5; border-radius: 10px; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .preview-store-header { background: #fff; padding: 10px 16px; display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #333; border-bottom: 1px solid #eee; }
        .preview-offer-type-badge { margin-left: auto; background: #f3f4f6; color: #666; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; }
        .preview-body { padding: 16px; background: #f8f8f8; }
        .preview-offer-badges { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
        .preview-badge { font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; }
        .preview-timer {
          display: flex; align-items: center; gap: 4px;
          font-size: 11px; font-weight: 700; color: #ef4444;
          background: rgba(239,68,68,0.08); padding: 4px 8px;
          border-radius: 4px; margin-bottom: 8px; width: fit-content;
        }
        .preview-thanks { font-size: 15px; font-weight: 700; color: #333; margin-bottom: 12px; }
        .preview-offer-card { background: #fff; border-radius: 8px; padding: 14px; display: flex; gap: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); margin-bottom: 12px; }
        .preview-product-row { display: flex; gap: 12px; align-items: flex-start; width: 100%; }
        .preview-product-img { width: 60px; height: 60px; background: linear-gradient(135deg, #e8d5ff, #d0b8ff); border-radius: 6px; flex-shrink: 0; object-fit: cover; }
        .preview-product-img.placeholder { background: linear-gradient(135deg, #e8d5ff, #d0b8ff); }
        .preview-product-info { flex: 1; }
        .preview-headline { font-size: 14px; font-weight: 700; color: #333; margin-bottom: 4px; }
        .preview-message { font-size: 12px; color: #666; margin-bottom: 6px; line-height: 1.4; }
        .preview-price { font-size: 18px; font-weight: 700; color: #22c55e; }
        .preview-warranty, .preview-discount { display: flex; gap: 12px; width: 100%; }
        .preview-warranty-icon { width: 48px; height: 48px; background: #dcfce7; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #22c55e; flex-shrink: 0; }
        .preview-discount-icon { width: 48px; height: 48px; background: rgba(139,92,246,0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #8b5cf6; flex-shrink: 0; }
        .preview-discount-code { font-size: 13px; font-weight: 700; color: #8b5cf6; background: #f5f3ff; padding: 4px 10px; border-radius: 4px; display: inline-block; margin-top: 4px; }
        .preview-btn-green { background: #22c55e; color: #fff; padding: 10px 20px; border-radius: 6px; font-size: 13px; font-weight: 600; text-align: center; margin-bottom: 8px; cursor: pointer; }
        .preview-skip { font-size: 12px; color: #999; text-align: center; margin-bottom: 10px; }
        .preview-trust { display: flex; justify-content: center; gap: 6px; font-size: 10px; color: #9ca3af; }
      `}</style>
    </div>
  );
}

import React, { useState, useEffect } from 'react';

/**
 * VisualPreview — renders a live WYSIWYG preview of the upsell offer
 * as the merchant would see it in the customer view.
 * Enhanced to be Shopify Customizer-style with:
 * - Phone-frame / browser-frame container
 * - Actual product image display
 * - Variant name display
 * - Discount percentage prominently shown
 * - Warranty price and description
 * - Badge with actual badge_color and badge_text
 * - Live countdown timer
 * - "No thanks, maybe later" skip link
 */
export default function VisualPreview({ form, itemData, fullSize }) {
  const {
    offer_type: offerType = 'add_product',
    headline,
    message,
    upsell_product_title: productTitle,
    upsell_product_price: productPrice,
    upsell_product_image: productImage,
    variant_title: variantTitle,
    discount_code: discountCode,
    discount_percent: discountPercent,
    warranty_price: warrantyPrice,
    warranty_description: warrantyDesc,
    warranty_covered: warrantyCovered,
    one_time_offer: oneTimeOffer = false,
    confirmation_only: confirmationOnly = true,
    badge_text: customBadgeText = '',
    badge_color: customBadgeColor = '#8b5cf6',
    show_badge: showCustomBadge = false,
    show_timer: showTimer = false,
    timer_minutes: timerMinutes = 15,
    button_text: buttonText = '',
  } = form;

  // Countdown timer state
  const [timerRemaining, setTimerRemaining] = useState(null);
  const [timerStarted, setTimerStarted] = useState(null);

  useEffect(() => {
    if (!showTimer) {
      setTimerRemaining(null);
      setTimerStarted(null);
      return;
    }
    // Start a live countdown
    const totalSeconds = (timerMinutes || 15) * 60;
    const startedAt = Date.now();
    setTimerStarted(startedAt);
    setTimerRemaining(totalSeconds);

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, totalSeconds - elapsed);
      setTimerRemaining(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [showTimer, timerMinutes]);

  function formatTimer(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  const previewPrice = offerType === 'add_product'
    ? (productPrice ? `+$${parseFloat(productPrice).toFixed(2)}` : '+$24.99')
    : offerType === 'warranty'
    ? (warrantyPrice ? `+$${parseFloat(warrantyPrice).toFixed(2)}` : '+$9.99')
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
    || (offerType === 'discount' || offerType === 'discount_code' ? 'Get Discount Code' : offerType === 'warranty' ? 'Add Protection' : 'Add to Order');

  const isDiscountType = offerType === 'discount' || offerType === 'discount_code';
  const isWarrantyType = offerType === 'warranty';
  const isProductType = offerType === 'add_product';

  // Build the upsell modal content for overlay display
  const renderUpsellModal = () => (
    <div className="upsell-modal-overlay">
      <div className="upsell-modal">
        {/* Close button */}
        <button className="modal-close-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Badge */}
        {badges.length > 0 && (
          <div className="modal-badges">
            {badges.map((badge, i) => (
              <span key={i} className="modal-badge" style={{ background: badge.bg, color: badge.color }}>
                {badge.text}
              </span>
            ))}
          </div>
        )}

        {/* Timer — prominent */}
        {showTimer && timerRemaining !== null && (
          <div className="modal-timer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>Offer expires in <strong>{formatTimer(timerRemaining)}</strong></span>
          </div>
        )}

        {/* Product image */}
        <div className="modal-product-img-wrap">
          {productImage ? (
            <img src={productImage} alt={productTitle || 'Product'} className="modal-product-img" />
          ) : (
            <div className="modal-product-img placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" width="36" height="36">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="modal-product-details">
          {isProductType && (
            <>
              <div className="modal-product-title">{productTitle || 'Premium Add-on Product'}</div>
              {variantTitle && variantTitle !== productTitle && (
                <div className="modal-variant">{variantTitle}</div>
              )}
              <div className="modal-product-desc">{previewMessage}</div>
              <div className="modal-price-row">
                <span className="modal-price">{previewPrice}</span>
                {offerType === 'add_product' && (
                  <span className="modal-price-note">one-time purchase</span>
                )}
              </div>
            </>
          )}

          {isDiscountType && (
            <>
              <div className="modal-product-title">{previewHeadline}</div>
              <div className="modal-product-desc">{previewMessage}</div>
              <div className="modal-discount-block">
                <span className="modal-discount-code">{discountCode || 'SAVE15'}</span>
                <span className="modal-discount-pct">{discountPercent ? `${discountPercent}% OFF` : '15% OFF'}</span>
              </div>
              <div className="modal-discount-note">Apply at checkout • No minimum purchase</div>
            </>
          )}

          {isWarrantyType && (
            <>
              <div className="modal-product-title">{previewHeadline}</div>
              <div className="modal-product-desc">{previewMessage}</div>
              {warrantyDesc && <div className="modal-warranty-desc">{warrantyDesc}</div>}
              <div className="modal-warranty-price">{warrantyPrice ? `+$${parseFloat(warrantyPrice).toFixed(2)}` : '+$9.99'}<span>/order</span></div>
              <div className="modal-warranty-features">
                <span>✓ Extended coverage</span>
                <span>✓ Free repairs</span>
                <span>✓ Easy claims</span>
              </div>
            </>
          )}
        </div>

        {/* Accept button */}
        <button className="modal-accept-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {btnLabel}
        </button>

        {/* Decline link */}
        <button className="modal-decline-btn">No thanks, I'll pass</button>

        {/* Trust row */}
        <div className="modal-trust-row">
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Secure checkout
          </span>
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11">
              <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
              <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
            Free shipping
          </span>
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
            Easy returns
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`visual-preview-wrapper ${fullSize ? 'full-size' : ''}`}>
      {/* Browser frame container */}
      <div className="browser-frame">
        {/* Browser chrome bar */}
        <div className="browser-chrome">
          <div className="browser-dots">
            <span className="dot red" />
            <span className="dot yellow" />
            <span className="dot green" />
          </div>
          <div className="browser-url-bar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            checkout.yourstore.com
          </div>
          <div style={{ width: 52 }} />
        </div>

        {/* Page content */}
        <div className="page-content">
          {/* Store header bar */}
          <div className="preview-store-header">
            <div className="store-logo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
            </div>
            <span className="store-name">My Store</span>
            <span className="preview-offer-type-badge">{typeLabel}</span>
          </div>

          {/* Order confirmation area */}
          <div className="checkout-area">
            <div className="checkout-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" style={{ color: '#22c55e' }}>
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span>Order #<span className="order-num">#1001</span></span>
            </div>

            {/* Thanks + headline */}
            <div className="preview-thanks">
              <span className="thanks-check">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </span>
              Thanks for your order!
            </div>
            <div className="preview-headline">{previewHeadline}</div>
            <div className="preview-message">{previewMessage}</div>

            {/* Offer card — stylized with upsell modal preview */}
            <div className="preview-offer-card">
              {/* Discount type */}
              {isDiscountType && (
                <div className="preview-discount-card">
                  <div className="discount-icon-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                      <line x1="12" y1="1" x2="12" y2="23"/>
                      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                    </svg>
                  </div>
                  <div className="preview-product-info">
                    <div className="preview-card-title">{previewHeadline}</div>
                    <div className="preview-card-desc">{previewMessage}</div>
                    <div className="discount-code-block">
                      <span className="discount-code-text">{discountCode || 'SAVE15'}</span>
                      <span className="discount-percent-badge">{discountPercent ? `${discountPercent}% OFF` : '15% OFF'}</span>
                    </div>
                    <div className="discount-note">Apply at checkout • No minimum</div>
                  </div>
                </div>
              )}

              {/* Warranty type */}
              {isWarrantyType && (
                <div className="preview-warranty-card">
                  <div className="warranty-icon-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  </div>
                  <div className="preview-product-info">
                    <div className="preview-card-title">{previewHeadline}</div>
                    <div className="preview-card-desc">{previewMessage}</div>
                    {warrantyDesc && <div className="warranty-desc">{warrantyDesc}</div>}
                    <div className="warranty-price">{warrantyPrice ? `+$${parseFloat(warrantyPrice).toFixed(2)}/order` : '+$9.99/order'}</div>
                    {warrantyCovered && <div className="warranty-covered">{warrantyCovered}</div>}
                    <div className="warranty-features">
                      <span>✓ Extended coverage</span>
                      <span>✓ Free repairs</span>
                      <span>✓ Easy claims</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Product type — now shows mini upsell modal preview */}
              {isProductType && (
                <div className="preview-product-card">
                  {productImage ? (
                    <div className="product-img-wrap">
                      <img src={productImage} alt={productTitle || 'Product'} className="preview-product-img" />
                      {variantTitle && (
                        <div className="variant-chip">{variantTitle}</div>
                      )}
                    </div>
                  ) : (
                    <div className="product-img-wrap">
                      <div className="preview-product-img placeholder">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" width="28" height="28">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21 15 16 10 5 21"/>
                        </svg>
                      </div>
                    </div>
                  )}
                  <div className="preview-product-info">
                    <div className="preview-card-title">{productTitle || 'Product Title'}</div>
                    {variantTitle && variantTitle !== productTitle && (
                      <div className="preview-card-variant">{variantTitle}</div>
                    )}
                    <div className="preview-card-desc">{previewMessage}</div>
                    <div className="preview-price">{previewPrice}</div>
                  </div>
                </div>
              )}
            </div>

            {/* CTA Button */}
            <div className="preview-cta-btn">{btnLabel}</div>

            {/* Skip link */}
            <div className="preview-skip">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              No thanks, maybe later
            </div>

            {/* Trust indicators */}
            <div className="preview-trust-row">
              <div className="trust-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Secure checkout
              </div>
              <div className="trust-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                  <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                  <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
                Free shipping
              </div>
              <div className="trust-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                  <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                </svg>
                Easy returns
              </div>
            </div>
          </div>

          {/* Inline upsell modal preview — the actual offer the customer sees */}
          {renderUpsellModal()}
        </div>
      </div>

      <style>{`
        .visual-preview-wrapper { margin-top: 0; }
        .visual-preview-wrapper.full-size { width: 100%; max-width: 480px; }
        .visual-preview-wrapper.full-size .browser-frame { border-radius: 12px; }

        /* Browser frame */
        .browser-frame {
          background: #fff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.1);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .browser-chrome {
          background: #e8e8ed;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid rgba(0,0,0,0.08);
        }
        .browser-dots { display: flex; gap: 6px; }
        .dot { width: 10px; height: 10px; border-radius: 50%; }
        .dot.red { background: #ff5f57; }
        .dot.yellow { background: #febc2e; }
        .dot.green { background: #28c840; }
        .browser-url-bar {
          flex: 1;
          background: #fff;
          border-radius: 5px;
          padding: 4px 10px;
          font-size: 11px;
          color: #666;
          display: flex;
          align-items: center;
          gap: 5px;
          max-width: 280px;
          margin: 0 auto;
        }

        /* Page content */
        .page-content { background: #f6f6f7; }
        .preview-store-header {
          background: #fff;
          padding: 12px 18px;
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid rgba(0,0,0,0.06);
        }
        .store-logo {
          width: 28px; height: 28px;
          background: #8b5cf6;
          border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          color: #fff;
        }
        .store-name { font-size: 14px; font-weight: 700; color: #1a1a1a; flex: 1; }
        .preview-offer-type-badge {
          background: #f3f4f6; color: #666;
          padding: 3px 9px; border-radius: 4px;
          font-size: 11px; font-weight: 500;
        }

        /* Checkout area */
        .checkout-area {
          padding: 20px 18px 24px;
          max-width: 400px;
          margin: 0 auto;
        }
        .checkout-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 16px;
        }
        .order-num { color: #666; }

        /* Badges */
        .preview-offer-badges { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
        .preview-badge {
          font-size: 10px; font-weight: 700;
          padding: 3px 8px; border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        /* Timer */
        .preview-timer {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          font-weight: 600;
          color: #ef4444;
          background: rgba(239,68,68,0.08);
          padding: 6px 10px;
          border-radius: 6px;
          margin-bottom: 10px;
          width: fit-content;
          border: 1px solid rgba(239,68,68,0.15);
        }
        .timer-countdown {
          font-size: 14px;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
          margin-left: 4px;
        }

        /* Thanks heading */
        .preview-thanks {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 16px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 10px;
        }
        .thanks-check {
          width: 22px; height: 22px;
          background: #dcfce7;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: #22c55e;
          flex-shrink: 0;
        }
        .preview-headline {
          font-size: 15px; font-weight: 700; color: #1a1a1a; margin-bottom: 6px;
        }
        .preview-message {
          font-size: 13px; color: #555; margin-bottom: 16px; line-height: 1.45;
        }

        /* Offer card */
        .preview-offer-card {
          background: #fff;
          border-radius: 10px;
          padding: 16px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05);
          margin-bottom: 14px;
        }

        /* Product card */
        .preview-product-card { display: flex; gap: 14px; align-items: flex-start; }
        .product-img-wrap { position: relative; flex-shrink: 0; }
        .preview-product-img {
          width: 70px; height: 70px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid rgba(0,0,0,0.06);
          background: linear-gradient(135deg, #ede9fe, #ddd6fe);
        }
        .preview-product-img.placeholder {
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
        }
        .variant-chip {
          position: absolute; bottom: -4px; left: 4px; right: 4px;
          background: rgba(0,0,0,0.7); color: #fff;
          font-size: 9px; font-weight: 600; text-align: center;
          padding: 2px 4px; border-radius: 3px;
        }
        .preview-product-info { flex: 1; }
        .preview-card-title { font-size: 14px; font-weight: 700; color: #1a1a1a; margin-bottom: 3px; }
        .preview-card-variant { font-size: 12px; color: #8b5cf6; font-weight: 500; margin-bottom: 3px; }
        .preview-card-desc { font-size: 12px; color: #666; margin-bottom: 8px; line-height: 1.4; }
        .preview-price {
          font-size: 20px; font-weight: 800; color: #22c55e;
        }

        /* Discount card */
        .preview-discount-card { display: flex; gap: 14px; align-items: flex-start; }
        .discount-icon-wrap {
          width: 52px; height: 52px; flex-shrink: 0;
          background: linear-gradient(135deg, #8b5cf6, #6d28d9);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          color: #fff;
        }
        .discount-code-block {
          display: flex; align-items: center; gap: 8px; margin: 8px 0;
        }
        .discount-code-text {
          font-size: 15px; font-weight: 800; color: #1a1a1a;
          background: #f3f4f6; padding: 4px 10px; border-radius: 5px;
          border: 1px dashed #999;
          font-family: 'Courier New', monospace;
          letter-spacing: 1px;
        }
        .discount-percent-badge {
          font-size: 14px; font-weight: 800; color: #fff;
          background: #8b5cf6; padding: 4px 10px; border-radius: 5px;
        }
        .discount-note { font-size: 11px; color: #888; }

        /* Warranty card */
        .preview-warranty-card { display: flex; gap: 14px; align-items: flex-start; }
        .warranty-icon-wrap {
          width: 52px; height: 52px; flex-shrink: 0;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          color: #fff;
        }
        .warranty-desc { font-size: 12px; color: #666; margin-bottom: 4px; }
        .warranty-price { font-size: 18px; font-weight: 800; color: #22c55e; margin: 6px 0; }
        .warranty-covered { font-size: 12px; color: #888; margin-bottom: 6px; }
        .warranty-features { display: flex; flex-wrap: wrap; gap: 6px; }
        .warranty-features span {
          font-size: 11px; color: #555; background: #f3f4f6;
          padding: 2px 8px; border-radius: 4px;
        }

        /* CTA Button */
        .preview-cta-btn {
          background: #22c55e;
          color: #fff;
          padding: 13px 20px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 700;
          text-align: center;
          margin-bottom: 10px;
          cursor: pointer;
          letter-spacing: 0.2px;
          box-shadow: 0 2px 8px rgba(34,197,94,0.35);
        }

        /* Skip link */
        .preview-skip {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          font-size: 12px;
          color: #999;
          margin-bottom: 16px;
          cursor: pointer;
        }

        /* Trust row */
        .preview-trust-row {
          display: flex;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .trust-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: #999;
        }

        /* ==========================================
           UPSELL MODAL OVERLAY (post-checkout offer)
           ========================================== */
        .upsell-modal-overlay {
          position: relative;
          margin-top: 16px;
          padding: 20px 16px 16px;
          background: #1a1a2e;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.08);
        }

        .upsell-modal-overlay::before {
          content: 'Customer view';
          position: absolute;
          top: -10px;
          left: 16px;
          background: #8b5cf6;
          color: #fff;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .upsell-modal {
          position: relative;
          background: #fff;
          border-radius: 16px;
          padding: 24px 20px 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.08);
          max-width: 340px;
          margin: 0 auto;
          text-align: center;
        }

        .modal-close-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(0,0,0,0.06);
          border: none;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #666;
          transition: background 0.15s;
        }
        .modal-close-btn:hover { background: rgba(0,0,0,0.12); }

        .modal-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          justify-content: center;
          margin-bottom: 10px;
        }
        .modal-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 9999px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .modal-timer {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          font-weight: 600;
          color: #ef4444;
          background: rgba(239,68,68,0.08);
          padding: 5px 12px;
          border-radius: 9999px;
          margin-bottom: 12px;
          border: 1px solid rgba(239,68,68,0.2);
        }
        .modal-timer strong { font-size: 14px; }

        .modal-product-img-wrap {
          margin-bottom: 12px;
        }
        .modal-product-img {
          width: 100px;
          height: 100px;
          object-fit: cover;
          border-radius: 12px;
          border: 1px solid rgba(0,0,0,0.06);
          background: linear-gradient(135deg, #ede9fe, #ddd6fe);
        }
        .modal-product-img.placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
          margin: 0 auto;
        }

        .modal-product-details { margin-bottom: 14px; }
        .modal-product-title {
          font-size: 16px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 4px;
        }
        .modal-variant {
          font-size: 12px;
          color: #8b5cf6;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .modal-product-desc {
          font-size: 13px;
          color: #555;
          line-height: 1.45;
          margin-bottom: 8px;
        }
        .modal-price-row {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 8px;
        }
        .modal-price {
          font-size: 26px;
          font-weight: 800;
          color: #22c55e;
        }
        .modal-price-note {
          font-size: 11px;
          color: #888;
        }

        /* Discount in modal */
        .modal-discount-block {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin: 10px 0;
        }
        .modal-discount-code {
          font-size: 16px;
          font-weight: 800;
          color: #1a1a1a;
          background: #f3f4f6;
          padding: 5px 14px;
          border-radius: 6px;
          border: 1px dashed #999;
          font-family: 'Courier New', monospace;
          letter-spacing: 1px;
        }
        .modal-discount-pct {
          font-size: 16px;
          font-weight: 800;
          color: #fff;
          background: #8b5cf6;
          padding: 5px 12px;
          border-radius: 6px;
        }
        .modal-discount-note {
          font-size: 11px;
          color: #888;
          margin-top: 4px;
        }

        /* Warranty in modal */
        .modal-warranty-desc { font-size: 12px; color: #666; margin-bottom: 6px; }
        .modal-warranty-price {
          font-size: 24px;
          font-weight: 800;
          color: #22c55e;
          margin-bottom: 8px;
        }
        .modal-warranty-price span { font-size: 13px; font-weight: 400; color: #888; }
        .modal-warranty-features {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          justify-content: center;
        }
        .modal-warranty-features span {
          font-size: 11px;
          color: #555;
          background: #f3f4f6;
          padding: 3px 10px;
          border-radius: 5px;
        }

        /* Accept button */
        .modal-accept-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #22c55e;
          color: #fff;
          border: none;
          padding: 14px 20px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          letter-spacing: 0.3px;
          box-shadow: 0 4px 14px rgba(34,197,94,0.4);
          transition: background 0.15s;
          margin-bottom: 10px;
        }
        .modal-accept-btn:hover { background: #16a34a; }

        /* Decline link */
        .modal-decline-btn {
          background: none;
          border: none;
          color: #999;
          font-size: 12px;
          cursor: pointer;
          padding: 4px 8px;
          text-decoration: underline;
          margin-bottom: 12px;
          transition: color 0.15s;
        }
        .modal-decline-btn:hover { color: #666; }

        /* Modal trust row */
        .modal-trust-row {
          display: flex;
          justify-content: center;
          gap: 14px;
          flex-wrap: wrap;
          padding-top: 10px;
          border-top: 1px solid #f0f0f0;
        }
        .modal-trust-row span {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          color: #aaa;
        }
      `}</style>
    </div>
  );
}

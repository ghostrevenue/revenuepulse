import React, { useState, useEffect } from 'react';

function computeDiscountedPrice(originalPrice, discount) {
  if (!originalPrice) return 0;
  const p = parseFloat(originalPrice);
  if (!discount) return p;
  if (discount.type === 'percentage') return p * (1 - discount.value / 100);
  if (discount.type === 'fixed_amount') return Math.max(0, p - discount.value);
  if (discount.type === 'fixed_price') return discount.value;
  return p;
}

function computeSavings(original, discounted) {
  return original - discounted;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function OfferPageRenderer({ node, style, fullWidth = false }) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [qty, setQty] = useState(node?.quantity || 1);
  const [timeLeft, setTimeLeft] = useState(0);

  // Sync when node changes
  useEffect(() => {
    setQty(node?.quantity || 1);
    setActiveImageIndex(0);
  }, [node?.id, node?.product?.product_id]);

  // Countdown timer
  useEffect(() => {
    if (!node?.countdown_timer?.enabled) { setTimeLeft(0); return; }
    const total = node.countdown_timer.duration_seconds || 900;
    setTimeLeft(total);
    const iv = setInterval(() => {
      setTimeLeft(t => { if (t <= 0) { clearInterval(iv); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(iv);
  }, [node?.countdown_timer?.enabled, node?.countdown_timer?.duration_seconds]);

  // Apply style defaults
  const s = {
    background_color: '#ffffff',
    primary_color: '#8b5cf6',
    text_color: '#1a1a1a',
    badge_color: '#22c55e',
    font_family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    border_radius: 10,
    ...style,
  };

  const hasProduct = !!(node?.product?.product_id);

  // Compute pricing
  const originalPrice = node?.product?.original_price || '0';
  const discountedPrice = computeDiscountedPrice(originalPrice, node?.discount);
  const savings = computeSavings(parseFloat(originalPrice), discountedPrice);
  const savingsPct = originalPrice > 0 ? Math.round((savings / parseFloat(originalPrice)) * 100) : 0;

  // Subtotal / tax / total
  const subtotal = discountedPrice * qty;
  const taxes = subtotal * 0.1;
  const total = subtotal + taxes;

  // Images
  const images = node?.product?.images?.length > 0
    ? node.product.images
    : node?.product?.image_url
    ? [{ url: node.product.image_url, altText: node.product.title }]
    : [];

  if (!hasProduct) {
    return (
      <div style={{ background: '#fff', minHeight: '100%', fontFamily: s.font_family, color: s.text_color }}>
        <div className="opr-empty" style={{ background: '#f9fafb' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d4d4d8" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          <div style={{ fontWeight: 600, color: '#71717a' }}>No product selected</div>
          <div style={{ color: '#a1a1aa' }}>Select a product in the editor</div>
        </div>
      </div>
    );
  }

  const containerStyle = {
    fontFamily: s.font_family,
    color: s.text_color,
    background: s.background_color,
    borderRadius: s.border_radius + 'px',
    overflow: 'hidden',
    width: '100%',
    maxWidth: fullWidth ? 'none' : 'none',
  };

  return (
    <div style={containerStyle}>
      {/* Timer */}
      {node?.countdown_timer?.enabled && (
        <div className="opr-timer">
          <span className="opr-timer-msg">
            {node.countdown_timer.message || "This offer is only available on this page. Once you leave, it's gone."}
          </span>
          <span className="opr-timer-clock">⏱ {formatTime(timeLeft)}</span>
        </div>
      )}

      {/* Headline */}
      <div className="opr-headline">
        {node?.headline || "Add another item to your order"}
      </div>

      {/* Two-column layout */}
      <div className="opr-layout">
        {/* Left: Image gallery */}
        <div className="opr-gallery">
          {images.length > 0 ? (
            <>
              <img
                src={images[activeImageIndex]?.url}
                alt={images[activeImageIndex]?.altText || node.product.title}
                className="opr-main-img"
              />
              {images.length > 1 && (
                <div className="opr-thumb-row">
                  {images.map((img, i) => (
                    <img
                      key={i}
                      src={img.url}
                      alt={img.altText || ''}
                      className={`opr-thumb ${i === activeImageIndex ? 'active' : ''}`}
                      onClick={() => setActiveImageIndex(i)}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="opr-no-img">No image</div>
          )}
        </div>

        {/* Right: Product info */}
        <div className="opr-info">
          <div className="opr-title">{node.product.title}</div>
          {node.product.variant_title && (
            <div className="opr-variant">{node.product.variant_title}</div>
          )}

          {/* Pricing */}
          <div className="opr-pricing">
            <span className="opr-orig-price">${parseFloat(originalPrice).toFixed(2)}</span>
            <span className="opr-sale-price">${discountedPrice.toFixed(2)}</span>
            {savings > 0 && (
              <span className="opr-badge">
                SAVE {node?.discount?.type === 'percentage' ? `${savingsPct}%` : `$${savings.toFixed(2)}`}
              </span>
            )}
          </div>

          {/* Description */}
          {(node?.message || node?.product?.description) && (
            <div className="opr-desc">
              {node?.message || node?.product?.description}
            </div>
          )}

          {/* Quantity */}
          <div className="opr-qty-row">
            <span className="opr-qty-label">Qty:</span>
            <button className={`opr-qty-btn ${qty <= 1 ? 'disabled' : ''}`}
              onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
            <span className="opr-qty-val">{qty}</span>
            <button className={`opr-qty-btn ${qty >= 10 ? 'disabled' : ''}`}
              onClick={() => setQty(q => Math.min(10, q + 1))}>+</button>
          </div>

          {/* Order summary */}
          <div className="opr-summary">
            <div className="opr-summary-row">
              <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="opr-summary-row">
              <span>Shipping</span><span className="free">FREE</span>
            </div>
            <div className="opr-summary-row">
              <span>Taxes</span><span>${taxes.toFixed(2)}</span>
            </div>
            <div className="opr-summary-row total">
              <span>Total</span><span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Accept button */}
          <button
            className="opr-accept-btn"
            style={{ background: s.primary_color }}
            onClick={() => {}}
          >
            {node?.accept_button_text || 'Add to order'} — ${total.toFixed(2)}
          </button>

          {/* OR divider + decline */}
          <div className="opr-or-divider">OR</div>
          <a className="opr-decline" href="#" onClick={e => e.preventDefault()}>
            {node?.decline_button_text || 'No thanks'}
          </a>
        </div>
      </div>

      {/* Inline styles */}
      <style>{`
        /* Timer banner */
        .opr-timer { background: #1a1a1a; color: white; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-weight: 500; }
        .opr-timer-msg { opacity: 0.9; }
        .opr-timer-clock { font-weight: 700; font-variant-numeric: tabular-nums; }

        /* Headline */
        .opr-headline { text-align: center; font-size: 28px; font-weight: 800; color: #111; margin: 28px 0 20px; line-height: 1.2; padding: 0 24px; }

        /* Two-column */
        .opr-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; padding: 0 32px 40px; align-items: start; }
        @media (max-width: 640px) { .opr-layout { grid-template-columns: 1fr; } }

        /* Gallery */
        .opr-gallery {}
        .opr-main-img { width: 100%; height: 320px; object-fit: cover; border-radius: 8px; display: block; margin-bottom: 10px; background: #f4f4f5; }
        .opr-thumb-row { display: flex; gap: 8px; }
        .opr-thumb { width: 72px; height: 72px; object-fit: cover; border-radius: 6px; cursor: pointer; border: 2px solid transparent; transition: border-color 0.15s; flex-shrink: 0; }
        .opr-thumb:hover { border-color: #d4d4d8; }
        .opr-thumb.active { border-color: #8b5cf6; }
        .opr-no-img { width: 100%; height: 320px; background: #f4f4f5; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #a1a1aa; font-size: 14px; }

        /* Product info */
        .opr-info {}
        .opr-title { font-size: 22px; font-weight: 800; color: #111; margin-bottom: 4px; line-height: 1.3; }
        .opr-variant { font-size: 14px; color: #71717a; margin-bottom: 16px; }
        .opr-pricing { display: flex; align-items: baseline; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
        .opr-orig-price { font-size: 18px; color: #a1a1aa; text-decoration: line-through; }
        .opr-sale-price { font-size: 28px; font-weight: 800; color: #22c55e; }
        .opr-badge { display: inline-block; background: rgba(34,197,94,0.12); color: #22c55e; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 6px; margin-bottom: 16px; }
        .opr-desc { font-size: 14px; color: #555; line-height: 1.6; margin-bottom: 20px; }

        /* Order summary */
        .opr-summary { border-top: 1px solid #e4e4e7; padding-top: 16px; margin-bottom: 20px; }
        .opr-summary-row { display: flex; justify-content: space-between; font-size: 14px; color: #555; padding: 4px 0; }
        .opr-summary-row.total { font-weight: 800; color: #111; font-size: 16px; border-top: 1px solid #e4e4e7; padding-top: 8px; margin-top: 4px; }
        .opr-summary-row .free { color: #22c55e; font-weight: 600; }

        /* Qty */
        .opr-qty-row { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
        .opr-qty-label { font-size: 14px; color: #555; font-weight: 500; }
        .opr-qty-btn { width: 32px; height: 32px; border: 1px solid #d4d4d8; border-radius: 6px; background: white; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; transition: all 0.1s; }
        .opr-qty-btn:hover { border-color: #8b5cf6; color: #8b5cf6; }
        .opr-qty-val { font-size: 16px; font-weight: 700; color: #111; min-width: 28px; text-align: center; }

        /* Accept button */
        .opr-accept-btn { width: 100%; color: white; font-size: 16px; font-weight: 700; padding: 16px; border: none; border-radius: 10px; cursor: pointer; transition: opacity 0.15s; margin-bottom: 12px; }
        .opr-accept-btn:hover { opacity: 0.9; }

        /* Decline */
        .opr-or-divider { display: flex; align-items: center; gap: 12px; margin: 16px 0; color: #a1a1aa; font-size: 13px; }
        .opr-or-divider::before, .opr-or-divider::after { content: ''; flex: 1; height: 1px; background: #e4e4e7; }
        .opr-decline { display: block; text-align: center; color: #888; font-size: 13px; cursor: pointer; text-decoration: none; padding: 4px; }
        .opr-decline:hover { color: #555; }

        /* Quantity disabled state */
        .opr-qty-btn.disabled { opacity: 0.4; cursor: not-allowed; }

        /* Empty state */
        .opr-empty { min-height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #a1a1aa; gap: 8px; font-size: 14px; }
      `}</style>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * VisualPreview — renders a live WYSIWYG preview of the post-purchase offer
 * as the customer actually sees it (light/white full-screen interstitial).
 *
 * The merchant UI wraps this in a dark frame with device toggle.
 * When fullSize=true, renders full-screen without the merchant wrapper.
 */

function computeDiscountedPrice(originalPrice, discount) {
  if (!originalPrice) return 0;
  const p = parseFloat(originalPrice);
  if (!discount) return p;
  if (discount.type === 'percentage') return p * (1 - discount.value / 100);
  if (discount.type === 'fixed_amount') return Math.max(0, p - discount.value);
  if (discount.type === 'fixed_price') return discount.value;
  return p;
}

function computeSavings(originalPrice, discountedPrice) {
  return parseFloat(originalPrice || 0) - discountedPrice;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function VisualPreview({ node, shop, fullSize }) {
  const [device, setDevice] = useState('desktop'); // 'desktop' | 'mobile'
  const [qty, setQty] = useState(node?.quantity || 1);
  const [timeLeft, setTimeLeft] = useState(0);

  // Sync quantity when node changes
  useEffect(() => {
    setQty(node?.quantity || 1);
  }, [node?.quantity]);

  // Countdown timer
  useEffect(() => {
    if (!node?.countdown_timer?.enabled) {
      setTimeLeft(0);
      return;
    }
    const total = node.countdown_timer.duration_seconds || 900;
    setTimeLeft(total);
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 0) { clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [node?.countdown_timer?.enabled, node?.countdown_timer?.duration_seconds]);

  const hasProduct = node?.product != null;
  const originalPrice = node?.product?.original_price || '49.99';
  const discountedPrice = computeDiscountedPrice(originalPrice, node?.discount);
  const savings = computeSavings(originalPrice, discountedPrice);
  const savingsPct = originalPrice > 0 ? Math.round((savings / parseFloat(originalPrice)) * 100) : 0;
  const acceptBtnText = node?.accept_button_text || 'Yes, add to my order';
  const declineBtnText = node?.decline_button_text || 'No thanks';

  const previewWidth = device === 'desktop' ? '600px' : '375px';

  // Empty state
  if (!hasProduct) {
    const emptyContent = (
      <div className="vp-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '500px', background: '#fff' }}>
        <div className="vp-empty">
          <svg className="vp-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#3f3f46' }}>No product selected</div>
          <div style={{ fontSize: '13px', color: '#71717a' }}>Select a product in the editor</div>
        </div>
      </div>
    );

    if (fullSize) {
      return (
        <div style={{ background: '#fff', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif' }}>
          {emptyContent}
        </div>
      );
    }

    return (
      <div className="vp-container">
        <div className="vp-toolbar">
          <span className="vp-preview-label">Preview</span>
          <div className="vp-device-toggle">
            <button className={`vp-device-btn ${device === 'desktop' ? 'active' : ''}`} onClick={() => setDevice('desktop')}>Desktop</button>
            <button className={`vp-device-btn ${device === 'mobile' ? 'active' : ''}`} onClick={() => setDevice('mobile')}>Mobile</button>
          </div>
        </div>
        <div className="vp-preview-area">{emptyContent}</div>
      </div>
    );
  }

  const productImage = node.product.image_url;
  const productTitle = node.product.title || 'Premium Add-on Product';
  const variantTitle = node.product.variant_title;
  const headline = node.headline || "Wait! Add this to your order";
  const message = node.message || "Get it delivered with your current order — just one click away.";

  const offerCard = (
    <div className={`vp-card ${device === 'mobile' ? 'mobile' : ''}`}>
      {/* Countdown timer bar */}
      {node?.countdown_timer?.enabled && (
        <div className="vp-timer-bar">
          ⏱ Offer expires in {formatTime(timeLeft)}
        </div>
      )}

      {/* One-time offer badge */}
      <div className="vp-badge-row">
        <span className="vp-badge">One-time offer</span>
      </div>

      {/* Product image */}
      {productImage ? (
        <img src={productImage} alt={productTitle} className="vp-image" />
      ) : (
        <div className="vp-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f3e8ff, #e9d5ff)', maxHeight: '280px' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" width="48" height="48">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </div>
      )}

      {/* Content */}
      <div className="vp-content">
        <div className="vp-headline">{headline}</div>
        <div className="vp-message">{message}</div>

        {/* Variant */}
        {variantTitle && (
          <div className="vp-variant">Variant: {variantTitle}</div>
        )}

        {/* Quantity stepper */}
        <div className="vp-qty-row">
          <span className="vp-qty-label">Qty:</span>
          <button
            className="vp-qty-btn"
            onClick={() => setQty(q => Math.max(1, q - 1))}
            disabled={qty <= 1}
          >
            −
          </button>
          <span className="vp-qty-val">{qty}</span>
          <button
            className="vp-qty-btn"
            onClick={() => setQty(q => Math.min(10, q + 1))}
            disabled={qty >= 10}
          >
            +
          </button>
        </div>

        {/* Price block */}
        <div className="vp-price-block">
          <span className="vp-original-price">${parseFloat(originalPrice).toFixed(2)}</span>
          <span className="vp-arrow">→</span>
          <span className="vp-discounted-price">${discountedPrice.toFixed(2)}</span>
        </div>
        <div style={{ textAlign: 'center', marginBottom: '4px' }}>
          <span className="vp-savings">You save ${savings.toFixed(2)} ({savingsPct}%)</span>
        </div>

        {/* Accept button */}
        <button className="vp-accept-btn">
          {acceptBtnText} — ${(discountedPrice * qty).toFixed(2)}
        </button>

        {/* Decline link */}
        <span className="vp-decline-link">{declineBtnText}</span>
      </div>
    </div>
  );

  if (fullSize) {
    return (
      <div style={{ background: '#fff', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          {offerCard}
        </div>
      </div>
    );
  }

  return (
    <div className="vp-container">
      <div className="vp-toolbar">
        <span className="vp-preview-label">Preview</span>
        <div className="vp-device-toggle">
          <button
            className={`vp-device-btn ${device === 'desktop' ? 'active' : ''}`}
            onClick={() => setDevice('desktop')}
          >
            Desktop
          </button>
          <button
            className={`vp-device-btn ${device === 'mobile' ? 'active' : ''}`}
            onClick={() => setDevice('mobile')}
          >
            Mobile
          </button>
        </div>
      </div>
      <div className="vp-preview-area">
        <div style={{ width: previewWidth, transition: 'width 0.2s' }}>
          {offerCard}
        </div>
      </div>

      <style>{`
        .vp-container {
          background: #0f0f14;
          border: 1px solid #27272a;
          border-radius: 12px;
          overflow: hidden;
        }
        .vp-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          background: #18181b;
          border-bottom: 1px solid #27272a;
        }
        .vp-preview-label {
          font-size: 12px;
          font-weight: 600;
          color: #71717a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .vp-device-toggle {
          display: flex;
          gap: 4px;
        }
        .vp-device-btn {
          padding: 4px 12px;
          border-radius: 6px;
          border: 1px solid #27272a;
          background: transparent;
          color: #71717a;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .vp-device-btn.active {
          background: #8b5cf6;
          border-color: #8b5cf6;
          color: white;
        }
        .vp-preview-area {
          background: #1a1a1a;
          padding: 24px;
          display: flex;
          justify-content: center;
          min-height: 500px;
        }
        .vp-card {
          background: white;
          width: 600px;
          max-width: 100%;
          min-height: 100%;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: #1a1a1a;
          position: relative;
          overflow: hidden;
        }
        .vp-card.mobile { width: 375px; }
        .vp-timer-bar {
          background: #1a1a1a;
          color: white;
          text-align: center;
          padding: 10px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .vp-badge {
          display: inline-block;
          background: #8b5cf6;
          color: white;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 4px 12px;
          border-radius: 9999px;
          margin-bottom: 16px;
        }
        .vp-badge-row { text-align: center; padding-top: 24px; }
        .vp-image { width: 100%; max-height: 280px; object-fit: cover; display: block; }
        .vp-content { padding: 20px 24px 24px; }
        .vp-headline { font-size: 24px; font-weight: 700; color: #111; text-align: center; margin-bottom: 8px; line-height: 1.2; }
        .vp-message { font-size: 15px; color: #555; text-align: center; line-height: 1.5; margin-bottom: 16px; }
        .vp-variant { font-size: 13px; color: #888; text-align: center; margin-bottom: 12px; }
        .vp-qty-row { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 20px; }
        .vp-qty-label { font-size: 14px; color: #333; font-weight: 500; }
        .vp-qty-btn { width: 32px; height: 32px; border: 1px solid #ddd; border-radius: 6px; background: white; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; transition: all 0.1s; }
        .vp-qty-btn:hover { border-color: #8b5cf6; color: #8b5cf6; }
        .vp-qty-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .vp-qty-val { font-size: 16px; font-weight: 700; color: #111; min-width: 32px; text-align: center; }
        .vp-price-block { text-align: center; margin-bottom: 4px; }
        .vp-original-price { font-size: 18px; color: #999; text-decoration: line-through; }
        .vp-arrow { color: #999; margin: 0 8px; }
        .vp-discounted-price { font-size: 28px; font-weight: 800; color: #22c55e; }
        .vp-savings { display: inline-block; background: rgba(34,197,94,0.12); color: #22c55e; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 6px; margin-top: 6px; }
        .vp-accept-btn { width: 100%; background: #8b5cf6; color: white; font-size: 16px; font-weight: 700; padding: 16px 24px; border: none; border-radius: 10px; cursor: pointer; margin-top: 20px; transition: background 0.15s; }
        .vp-accept-btn:hover { background: #7c3aed; }
        .vp-decline-link { display: block; text-align: center; color: #888; font-size: 13px; margin-top: 12px; cursor: pointer; text-decoration: none; }
        .vp-decline-link:hover { color: #555; }
        .vp-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; color: #52525b; text-align: center; gap: 8px; }
        .vp-empty-icon { color: #3f3f46; margin-bottom: 8px; }
      `}</style>
    </div>
  );
}

VisualPreview.propTypes = {
  node: PropTypes.shape({
    type: PropTypes.string,
    product: PropTypes.object,
    discount: PropTypes.object,
    quantity: PropTypes.number,
    headline: PropTypes.string,
    message: PropTypes.string,
    accept_button_text: PropTypes.string,
    decline_button_text: PropTypes.string,
    countdown_timer: PropTypes.object,
  }),
  shop: PropTypes.string,
  fullSize: PropTypes.bool,
};

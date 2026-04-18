import React, { useState, useEffect } from 'react';
import { api } from '../api/index.js';

export default function UpsellConfirmation({ store, appConfig, offerId }) {
  // In a real scenario, these come from the order confirmation page context
  // For preview, we use mock data
  const [offer, setOffer] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | accepting | accepted | declining | declined
  const [loading, setLoading] = useState(true);
  const [orderId] = useState('PREVIEW-ORDER');
  const [countdown, setCountdown] = useState(300); // 5 minutes in seconds

  // Deterministic social-proof count — derived from order ID so it never changes
  // on re-renders. In production this comes from the API; for preview, use a
  // plausible range seeded by the order string.
  function hashOrderToCount(order) {
    let hash = 0;
    for (let i = 0; i < order.length; i++) {
      hash = ((hash << 5) - hash) + order.charCodeAt(i);
      hash |= 0;
    }
    return (Math.abs(hash) % 150) + 89; // 89–238 range
  }
  const socialProofCount = hashOrderToCount(orderId);

  // Format seconds as MM:SS
  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  useEffect(() => {
    loadPreviewOffer();
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (status !== 'idle' || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [status, countdown]);

  async function loadPreviewOffer() {
    try {
      // Try to load specific offer if offerId provided, otherwise load first active
      let activeOffer;
      if (offerId) {
        activeOffer = await api.getUpsellOffer(offerId);
        activeOffer = activeOffer.offer;
      }
      if (!activeOffer) {
        const offersRes = await api.getUpsellOffers();
        const offers = offersRes.offers || [];
        activeOffer = offers.find(o => o.active) || offers[0];
      }
      if (activeOffer) {
        setOffer({
          ...activeOffer,
          product_title: activeOffer.upsell_product_title || 'Wireless Bluetooth Earbuds',
          product_price: activeOffer.upsell_product_price || 29.99,
          product_image: activeOffer.upsell_product_image || '',
          headline: activeOffer.headline || 'Wait! Add this to your order',
          message: activeOffer.message || 'Get it delivered with your current order — just one click away.',
          discount_code: activeOffer.discount_code || 'SAVE15',
          discount_percent: activeOffer.discount_percent || 15,
          // Warranty fields
          warranty_price: activeOffer.warranty_price || null,
          warranty_description: activeOffer.warranty_description || '',
          warranty_covered: activeOffer.warranty_covered || '',
        });
      }
    } catch (e) {
      // Use fallback preview offer
      setOffer({
        id: 'preview',
        offer_type: 'add_product',
        headline: 'Wait! Add this to your order',
        message: 'Get it delivered with your current order — just one click away.',
        product_title: 'Wireless Bluetooth Earbuds',
        product_price: 29.99,
        product_image: '',
        discount_code: 'SAVE15',
        discount_percent: 15,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept() {
    setStatus('accepting');
    try {
      await api.acceptUpsellOffer({ offer_id: offer.id, order_id: orderId });
      await new Promise(r => setTimeout(r, 800)); // Simulate network
      setStatus('accepted');
    } catch (e) {
      // Still show success for preview
      await new Promise(r => setTimeout(r, 800));
      setStatus('accepted');
    }
  }

  async function handleDecline() {
    setStatus('declining');
    try {
      await api.declineUpsellOffer({ offer_id: offer.id, order_id: orderId });
      await new Promise(r => setTimeout(r, 500)); // Simulate network
      setStatus('declined');
    } catch (e) {
      await new Promise(r => setTimeout(r, 500));
      setStatus('declined');
    }
  }

  if (loading) {
    return (
      <div className="upsell-loading">
        <div className="loading-spinner" />
        <style>{`
          .upsell-loading { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f5f5f5; }
          .loading-spinner { width: 32px; height: 32px; border: 3px solid #e5e5e5; border-top-color: #22c55e; border-radius: 50%; animation: spin 0.7s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // Offer accepted state — green confirmation with checkmark
  if (status === 'accepted') {
    return (
      <div className="upsell-page accepted-page">
        <div className="upsell-container">
          <div className="upsell-header">
            <div className="success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="40" height="40">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <h1>Added! Your order is updated.</h1>
            <p>The additional item will be delivered with your current order — no extra shipping needed.</p>
          </div>
          <div className="accepted-card">
            <div className="accepted-product">
              {offer?.product_image ? (
                <img src={offer.product_image} alt={offer.product_title} className="accepted-img" />
              ) : (
                <div className="accepted-img accepted-img-placeholder" />
              )}
              <div className="accepted-info">
                <div className="accepted-title">{offer?.product_title}</div>
                <div className="accepted-price">+${Number(offer?.product_price || 0).toFixed(2)}</div>
              </div>
            </div>
            <div className="accepted-confirm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              Added to your order
            </div>
          </div>
          <div className="accepted-footer">
            <p>Thank you for shopping with us!</p>
          </div>
        </div>

        <style>{`
          .upsell-page { min-height: 100vh; background: linear-gradient(180deg, #f8fdf9 0%, #f0fdf4 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          .upsell-container { max-width: 480px; margin: 0 auto; padding: 48px 20px; }
          .upsell-header { text-align: center; margin-bottom: 28px; }
          .success-icon { width: 72px; height: 72px; background: linear-gradient(135deg, #22c55e, #16a34a); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; box-shadow: 0 8px 24px rgba(34,197,94,0.35); }
          .success-icon svg { color: #fff; }
          .upsell-header h1 { font-size: 28px; font-weight: 700; color: #1a1a1a; margin: 0 0 12px; }
          .upsell-header p { font-size: 15px; color: #666; line-height: 1.5; margin: 0; }
          .accepted-card { background: #fff; border-radius: 16px; padding: 20px; box-shadow: 0 4px 16px rgba(0,0,0,0.08); margin-bottom: 24px; border: 1px solid #e8f5e8; }
          .accepted-product { display: flex; gap: 16px; align-items: center; }
          .accepted-img { width: 72px; height: 72px; border-radius: 10px; object-fit: cover; flex-shrink: 0; }
          .accepted-img-placeholder { background: linear-gradient(135deg, #dcfce7, #bbf7d0); }
          .accepted-info { flex: 1; }
          .accepted-title { font-size: 17px; font-weight: 600; color: #1a1a1a; margin-bottom: 4px; }
          .accepted-price { font-size: 20px; font-weight: 700; color: #22c55e; }
          .accepted-confirm { display: flex; align-items: center; gap: 8px; justify-content: center; margin-top: 16px; padding-top: 16px; border-top: 1px solid #eee; color: #22c55e; font-size: 14px; font-weight: 600; }
          .accepted-footer { text-align: center; color: #999; font-size: 13px; }
          .upsell-loading { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f5f5f5; }
          .loading-spinner { width: 32px; height: 32px; border: 3px solid #e5e5e5; border-top-color: #22c55e; border-radius: 50%; animation: spin 0.7s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // Offer declined — show fallback discount code alternative
  if (status === 'declined') {
    return (
      <div className="upsell-page declined-page">
        <div className="upsell-container">
          <div className="upsell-header">
            <div className="discount-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
                <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
              </svg>
            </div>
            <h1>No worries!</h1>
            <p>As a thank you, here's a special discount on your next order:</p>
          </div>
          <div className="discount-card">
            <div className="discount-percent">{offer?.discount_percent || 15}%</div>
            <div className="discount-label">OFF your next order</div>
            <div className="discount-code">{offer?.discount_code || 'SAVE15'}</div>
            <div className="discount-applied">Applied automatically at checkout</div>
          </div>
          <div className="declined-footer">
            <p>Use code <strong>{offer?.discount_code || 'SAVE15'}</strong> at checkout</p>
          </div>
        </div>

        <style>{`
          .upsell-page { min-height: 100vh; background: linear-gradient(180deg, #f5f5f5 0%, #ebebeb 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          .upsell-container { max-width: 480px; margin: 0 auto; padding: 48px 20px; }
          .upsell-header { text-align: center; margin-bottom: 24px; }
          .discount-icon { width: 56px; height: 56px; background: rgba(139,92,246,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; color: #8b5cf6; }
          .upsell-header h1 { font-size: 26px; font-weight: 700; color: #1a1a1a; margin: 0 0 12px; }
          .upsell-header p { font-size: 15px; color: #666; line-height: 1.5; margin: 0; }
          .discount-card { background: #fff; border-radius: 16px; padding: 32px; text-align: center; box-shadow: 0 4px 16px rgba(0,0,0,0.08); margin-bottom: 24px; border: 2px dashed #ddd; }
          .discount-percent { font-size: 48px; font-weight: 800; color: #8b5cf6; line-height: 1; margin-bottom: 4px; }
          .discount-label { font-size: 14px; color: #999; font-weight: 500; margin-bottom: 16px; }
          .discount-code { display: inline-block; font-size: 28px; font-weight: 700; color: #1a1a1a; background: #f5f3ff; border: 2px solid #8b5cf6; border-radius: 8px; padding: 10px 24px; margin-bottom: 12px; letter-spacing: 2px; }
          .discount-applied { font-size: 13px; color: #999; }
          .declined-footer { text-align: center; color: #666; font-size: 14px; }
          .declined-footer strong { color: #8b5cf6; }
        `}</style>
      </div>
    );
  }

  // Main offer state — conversion optimized
  return (
    <div className="upsell-page">
      <div className="upsell-container">
        {/* One-time offer badge */}
        <div className="offer-badge-row">
          <div className="offer-badge one-time">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            One-time offer
          </div>
          <div className="offer-badge only-once">Only shown once</div>
        </div>

        {/* Social proof */}
        <div className="social-proof">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
          </svg>
          <span><strong>{socialProofCount}</strong> people added this to their order this week</span>
        </div>

        {/* Main upsell card */}
        <div className="upsell-card">
          {offer?.offer_type === 'warranty' ? (
            // Warranty offer type
            <div className="warranty-offer">
              <div className="warranty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div className="warranty-content">
                <div className="product-headline">{offer?.headline || 'Protect Your Purchase'}</div>
                <div className="product-message">{offer?.warranty_description || 'Add peace of mind with our extended protection plan.'}</div>
                <div className="warranty-covered">
                  <strong>What's covered:</strong> {offer?.warranty_covered || 'Manufacturing defects, malfunctions, accidental damage'}
                </div>
                <div className="product-price warranty-price">
                  +${Number(offer?.warranty_price || 9.99).toFixed(2)}<span className="price-period">/order</span>
                </div>
              </div>
            </div>
          ) : offer?.offer_type === 'add_product' ? (
            // Add product offer type
            <div className="upsell-product">
              {offer?.product_image ? (
                <img src={offer.product_image} alt={offer.product_title} className="product-img" />
              ) : (
                <div className="product-img product-img-placeholder" />
              )}
              <div className="product-info">
                <div className="product-headline">{offer?.headline || 'Wait! Add this to your order'}</div>
                <div className="product-message">{offer?.message || 'Get it delivered with your current order — just one click away.'}</div>
                <div className="product-price">+${Number(offer?.product_price || 0).toFixed(2)}</div>
              </div>
            </div>
          ) : (
            // Discount code offer type
            <div className="discount-offer">
              <div className="discount-offer-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                </svg>
              </div>
              <div className="discount-offer-content">
                <div className="product-headline">{offer?.headline || 'Special discount just for you!'}</div>
                <div className="product-message">{offer?.message || `Get ${offer?.discount_percent || 15}% off your next order.`}</div>
                <div className="discount-code-display">{offer?.discount_code || 'SAVE15'} — {offer?.discount_percent || 15}% OFF</div>
              </div>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="upsell-actions">
            <button
              className="btn-accept"
              onClick={handleAccept}
              disabled={status === 'accepting'}
            >
              {status === 'accepting' ? (
                <span className="btn-loading"><span className="btn-spinner" />Adding...</span>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                  Add to Order
                </>
              )}
            </button>
            <button
              className="btn-decline"
              onClick={handleDecline}
              disabled={status === 'declining'}
            >
              {status === 'declining' ? 'Declining...' : 'No thanks, maybe later'}
            </button>
          </div>

          {/* Trust indicators */}
          <div className="upsell-trust">
            <div className="trust-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              Secure checkout
            </div>
            <span className="trust-dot">•</span>
            <div className="trust-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <path d="M5 12.55a11 11 0 0114.08 0"/><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/><circle cx="12" cy="20" r="1"/>
              </svg>
              Powered by Shopify
            </div>
            <span className="trust-dot">•</span>
            <div className="trust-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              No extra shipping
            </div>
          </div>
        </div>

        {/* Scarcity message */}
        <div className="scarcity-msg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          {countdown > 0 ? `Offer expires in ${formatTime(countdown)}` : 'Offer expired'}
        </div>

        {/* Trust footer */}
        <div className="upsell-footer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          Secure checkout • Powered by Shopify
        </div>
      </div>

      <style>{`
        .upsell-page { min-height: 100vh; background: linear-gradient(180deg, #ffffff 0%, #f8f8f8 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .upsell-container { max-width: 480px; margin: 0 auto; padding: 32px 20px 40px; }

        /* Offer badges */
        .offer-badge-row { display: flex; gap: 8px; justify-content: center; margin-bottom: 16px; }
        .offer-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; padding: 5px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px; }
        .offer-badge.one-time { background: linear-gradient(135deg, #fef3c7, #fde68a); color: #92400e; }
        .offer-badge.only-once { background: #f3f4f6; color: #6b7280; }

        /* Social proof */
        .social-proof { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 20px; padding: 10px 16px; background: #f0fdf4; border-radius: 8px; font-size: 13px; color: #166534; }
        .social-proof strong { color: #15803d; }
        .social-proof svg { color: #22c55e; }

        /* Main card */
        .upsell-card { background: #fff; border-radius: 20px; padding: 24px; box-shadow: 0 4px 24px rgba(0,0,0,0.1); border: 1px solid rgba(0,0,0,0.04); margin-bottom: 16px; }

        /* Product layout */
        .upsell-product { display: flex; gap: 16px; margin-bottom: 20px; }
        .product-img { width: 88px; height: 88px; border-radius: 12px; object-fit: cover; flex-shrink: 0; background: #f0f0f0; }
        .product-img-placeholder { background: linear-gradient(135deg, #e8d5ff 0%, #d0b8ff 100%); }
        .product-info { flex: 1; }
        .product-headline { font-size: 18px; font-weight: 700; color: #1a1a1a; margin-bottom: 6px; line-height: 1.3; }
        .product-message { font-size: 14px; color: #666; line-height: 1.45; margin-bottom: 10px; }
        .product-price { font-size: 26px; font-weight: 800; color: #22c55e; }
        .price-period { font-size: 14px; font-weight: 500; color: #999; }

        /* Warranty type */
        .warranty-offer { display: flex; gap: 16px; margin-bottom: 20px; }
        .warranty-icon { width: 64px; height: 64px; background: linear-gradient(135deg, #dcfce7, #bbf7d0); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #22c55e; }
        .warranty-content { flex: 1; }
        .warranty-covered { font-size: 12px; color: #666; margin-top: 8px; padding: 8px; background: #f9fafb; border-radius: 6px; }
        .warranty-price { color: #22c55e; }

        /* Discount offer type */
        .discount-offer { display: flex; gap: 16px; margin-bottom: 20px; }
        .discount-offer-icon { width: 64px; height: 64px; background: rgba(139,92,246,0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #8b5cf6; }
        .discount-offer-content { flex: 1; }
        .discount-code-display { display: inline-block; margin-top: 8px; font-size: 15px; font-weight: 700; color: #8b5cf6; background: #f5f3ff; padding: 6px 14px; border-radius: 6px; }

        /* CTA Buttons */
        .upsell-actions { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
        .btn-accept { display: flex; align-items: center; justify-content: center; gap: 10px; background: linear-gradient(135deg, #22c55e, #16a34a); color: #fff; border: none; padding: 16px 24px; border-radius: 12px; font-size: 17px; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 14px rgba(34,197,94,0.4); min-height: 54px; }
        .btn-accept:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(34,197,94,0.5); }
        .btn-accept:active { transform: translateY(0); }
        .btn-accept:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
        .btn-loading { display: flex; align-items: center; gap: 10px; }
        .btn-spinner { width: 18px; height: 18px; border: 2.5px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .btn-decline { background: none; border: none; color: #374151; font-size: 14px; cursor: pointer; padding: 12px; text-align: center; transition: color 0.15s; min-height: 44px; }
        .btn-decline:hover { color: #1f2937; }
        .btn-decline:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Trust indicators */
        .upsell-trust { display: flex; align-items: center; justify-content: center; gap: 10px; flex-wrap: wrap; padding-top: 12px; border-top: 1px solid #f3f4f6; }
        .trust-item { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #9ca3af; }
        .trust-dot { color: #d1d5db; }

        /* Scarcity */
        .scarcity-msg { display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 12px; color: #ef4444; font-weight: 500; margin-bottom: 16px; }

        /* Footer */
        .upsell-footer { display: flex; align-items: center; justify-content: center; gap: 6px; color: #9ca3af; font-size: 12px; }

        /* Mobile-first adjustments */
        @media (max-width: 480px) {
          .upsell-container { padding: 24px 16px 32px; }
          .upsell-card { padding: 20px; border-radius: 16px; }
          .product-img { width: 80px; height: 80px; }
          .product-headline { font-size: 17px; }
          .product-price { font-size: 24px; }
          .btn-accept { padding: 14px 20px; font-size: 16px; min-height: 50px; }
          .offer-badge { font-size: 10px; padding: 4px 10px; }
        }
      `}</style>
    </div>
  );
}

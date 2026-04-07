import React, { useState, useEffect } from 'react';
import { api } from '../api/index.js';

export default function UpsellConfirmation({ store, appConfig }) {
  // In a real scenario, these come from the order confirmation page context
  // For preview, we use mock data
  const [offer, setOffer] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | accepted | declined
  const [loading, setLoading] = useState(true);
  const [orderId] = useState('PREVIEW-ORDER');

  useEffect(() => {
    // In preview mode, load mock offer
    loadPreviewOffer();
  }, []);

  async function loadPreviewOffer() {
    try {
      const offersRes = await api.getUpsellOffers();
      const offers = offersRes.offers || [];
      const activeOffer = offers.find(o => o.active) || offers[0];
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
      await new Promise(r => setTimeout(r, 800)); // Simulate network
      setStatus('accepted');
    } catch (e) {
      setStatus('idle');
    }
  }

  async function handleDecline() {
    setStatus('declining');
    try {
      await new Promise(r => setTimeout(r, 500)); // Simulate network
      setStatus('declined');
    } catch (e) {
      setStatus('idle');
    }
  }

  if (loading) {
    return (
      <div className="upsell-loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  // Offer accepted state
  if (status === 'accepted') {
    return (
      <div className="upsell-page accepted-page">
        <div className="upsell-container">
          <div className="upsell-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            <h1>Added to your order!</h1>
            <p>Your order has been updated. The additional item will be delivered with your current order — no extra shipping needed.</p>
          </div>
          <div className="accepted-card">
            <div className="accepted-product">
              <div className="accepted-img" />
              <div className="accepted-info">
                <div className="accepted-title">{offer?.product_title}</div>
                <div className="accepted-price">+${Number(offer?.product_price || 0).toFixed(2)}</div>
              </div>
            </div>
            <div className="accepted-confirm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              Order updated
            </div>
          </div>
          <div className="accepted-footer">
            <p>Thank you for shopping with us!</p>
          </div>
        </div>

        <style>{`
          .upsell-page { min-height: 100vh; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          .upsell-container { max-width: 480px; margin: 0 auto; padding: 40px 20px; }
          .upsell-header { text-align: center; margin-bottom: 24px; }
          .upsell-header svg { color: #22c55e; margin-bottom: 16px; }
          .upsell-header h1 { font-size: 26px; font-weight: 700; color: #1a1a1a; margin: 0 0 12px; }
          .upsell-header p { font-size: 15px; color: #666; line-height: 1.5; margin: 0; }
          .accepted-card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); margin-bottom: 24px; }
          .accepted-product { display: flex; gap: 14px; align-items: center; }
          .accepted-img { width: 64px; height: 64px; background: linear-gradient(135deg, #e8d5ff, #d0b8ff); border-radius: 8px; flex-shrink: 0; }
          .accepted-info { flex: 1; }
          .accepted-title { font-size: 16px; font-weight: 600; color: #1a1a1a; margin-bottom: 4px; }
          .accepted-price { font-size: 18px; font-weight: 700; color: #8b5cf6; }
          .accepted-confirm { display: flex; align-items: center; gap: 8px; justify-content: center; margin-top: 16px; padding-top: 16px; border-top: 1px solid #eee; color: #22c55e; font-size: 14px; font-weight: 600; }
          .accepted-footer { text-align: center; color: #999; font-size: 13px; }
          .upsell-loading { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f5f5f5; }
          .loading-spinner { width: 32px; height: 32px; border: 3px solid #e5e5e5; border-top-color: #8b5cf6; border-radius: 50%; animation: spin 0.7s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // Offer declined — show alternative discount
  if (status === 'declined') {
    return (
      <div className="upsell-page declined-page">
        <div className="upsell-container">
          <div className="upsell-header">
            <h1>No worries!</h1>
            <p>As a thank you, here's a special discount on your next order:</p>
          </div>
          <div className="discount-card">
            <div className="discount-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
                <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
              </svg>
            </div>
            <div className="discount-code">{offer?.discount_code || 'SAVE15'}</div>
            <div className="discount-desc">{offer?.discount_percent || 15}% off your next order</div>
            <div className="discount-applied">Applied automatically at checkout</div>
          </div>
          <div className="declined-footer">
            <p>Use code <strong>{offer?.discount_code || 'SAVE15'}</strong> at checkout</p>
          </div>
        </div>

        <style>{`
          .upsell-page { min-height: 100vh; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          .upsell-container { max-width: 480px; margin: 0 auto; padding: 40px 20px; }
          .upsell-header { text-align: center; margin-bottom: 24px; }
          .upsell-header h1 { font-size: 26px; font-weight: 700; color: #1a1a1a; margin: 0 0 12px; }
          .upsell-header p { font-size: 15px; color: #666; line-height: 1.5; margin: 0; }
          .discount-card { background: #fff; border-radius: 12px; padding: 32px; text-align: center; box-shadow: 0 1px 4px rgba(0,0,0,0.08); margin-bottom: 24px; border: 2px dashed #ddd; }
          .discount-icon { width: 56px; height: 56px; background: rgba(139,92,246,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; color: #8b5cf6; }
          .discount-code { font-size: 32px; font-weight: 700; color: #8b5cf6; margin-bottom: 8px; letter-spacing: 2px; }
          .discount-desc { font-size: 16px; color: #333; font-weight: 600; margin-bottom: 8px; }
          .discount-applied { font-size: 13px; color: #999; }
          .declined-footer { text-align: center; color: #666; font-size: 14px; }
          .declined-footer strong { color: #8b5cf6; }
        `}</style>
      </div>
    );
  }

  // Main offer state
  return (
    <div className="upsell-page">
      <div className="upsell-container">
        <div className="upsell-header">
          <div className="store-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {store?.shop || 'Your Store'}
          </div>
          <h1>Thanks for your order! 🎉</h1>
          <p>Order #{orderId}</p>
        </div>

        <div className="upsell-card">
          <div className="upsell-badge">Special offer just for you</div>
          <div className="upsell-product">
            {offer?.product_image ? (
              <img src={offer.product_image} alt={offer.product_title} className="product-img" />
            ) : (
              <div className="product-img-placeholder" />
            )}
            <div className="product-info">
              <div className="product-headline">{offer?.headline || 'Wait! Add this to your order'}</div>
              <div className="product-message">{offer?.message || 'Get it delivered with your current order — just one click away.'}</div>
              <div className="product-price">
                {offer?.offer_type === 'add_product'
                  ? `+$${Number(offer?.product_price || 0).toFixed(2)}`
                  : `${offer?.discount_percent || 15}% OFF`}
              </div>
            </div>
          </div>
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
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
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
              {status === 'declining' ? 'Declining...' : 'No thanks'}
            </button>
          </div>
          <div className="upsell-guarantee">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            No extra shipping · Easy one-click checkout
          </div>
        </div>

        <div className="upsell-footer">
          <p>Secure checkout powered by Shopify</p>
        </div>
      </div>

      <style>{`
        .upsell-page { min-height: 100vh; background: linear-gradient(180deg, #f5f5f5 0%, #ebebeb 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .upsell-container { max-width: 480px; margin: 0 auto; padding: 40px 20px; }
        .upsell-header { text-align: center; margin-bottom: 28px; }
        .store-badge { display: inline-flex; align-items: center; gap: 6px; background: #fff; border: 1px solid #e5e5e5; border-radius: 9999px; padding: 5px 12px; font-size: 12px; font-weight: 600; color: #333; margin-bottom: 16px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .upsell-header h1 { font-size: 28px; font-weight: 700; color: #1a1a1a; margin: 0 0 6px; }
        .upsell-header p { font-size: 14px; color: #999; margin: 0; }

        .upsell-card { background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.08); border: 1px solid rgba(0,0,0,0.04); margin-bottom: 20px; }
        .upsell-badge { display: inline-block; background: linear-gradient(135deg, #8b5cf6, #a78bfa); color: #fff; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
        .upsell-product { display: flex; gap: 16px; margin-bottom: 20px; }
        .product-img { width: 80px; height: 80px; border-radius: 10px; object-fit: cover; flex-shrink: 0; background: #f0f0f0; }
        .product-img-placeholder { width: 80px; height: 80px; border-radius: 10px; background: linear-gradient(135deg, #e8d5ff 0%, #d0b8ff 100%); flex-shrink: 0; }
        .product-info { flex: 1; }
        .product-headline { font-size: 17px; font-weight: 700; color: #1a1a1a; margin-bottom: 6px; line-height: 1.3; }
        .product-message { font-size: 14px; color: #666; line-height: 1.4; margin-bottom: 10px; }
        .product-price { font-size: 24px; font-weight: 800; color: #8b5cf6; }
        .upsell-actions { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
        .btn-accept { display: flex; align-items: center; justify-content: center; gap: 8px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: #fff; border: none; padding: 14px 24px; border-radius: 10px; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(139,92,246,0.35); }
        .btn-accept:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(139,92,246,0.45); }
        .btn-accept:active { transform: translateY(0); }
        .btn-accept:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
        .btn-loading { display: flex; align-items: center; gap: 8px; }
        .btn-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .btn-decline { background: none; border: none; color: #999; font-size: 13px; cursor: pointer; padding: 8px; text-align: center; transition: color 0.15s; }
        .btn-decline:hover { color: #666; }
        .btn-decline:disabled { opacity: 0.5; cursor: not-allowed; }
        .upsell-guarantee { display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 12px; color: #999; }
        .upsell-footer { text-align: center; color: #bbb; font-size: 12px; }

        /* Merchant preview banner */
        .preview-notice { background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; text-align: center; }
        .preview-notice strong { color: #92400e; font-size: 13px; }
        .preview-notice p { color: #b45309; font-size: 12px; margin: 4px 0 0; }
      `}</style>
    </div>
  );
}

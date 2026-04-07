import React, { useState, useEffect } from 'react';
import { api } from '../api/index.js';
import UpsellConfirmation from './UpsellConfirmation.jsx';

export default function UpsellPreview({ store, appConfig }) {
  const [offerId, setOfferId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Extract offerId from hash — format: #/upsell-preview/:offerId
    const hash = window.location.hash;
    const match = hash.match(/#\/upsell-preview\/([^\/]+)/);
    if (match) {
      setOfferId(match[1]);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="preview-loading">
        <div className="spinner" />
        <style>{`
          .preview-loading { display: flex; align-items: center; justify-content: center; height: 100vh; background: #0f0f14; }
          .spinner { width: 32px; height: 32px; border: 3px solid #27272a; border-top-color: #8b5cf6; border-radius: 50%; animation: spin 0.7s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="upsell-preview-page">
      {/* Merchant preview banner */}
      <div className="preview-banner">
        <div className="preview-banner-content">
          <div className="preview-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            Preview Mode
          </div>
          <p>This is how your customer sees this offer</p>
        </div>
        <button className="exit-preview-btn" onClick={() => window.location.hash = '#/dashboard'}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          Exit Preview
        </button>
      </div>

      {/* The actual customer-facing upsell page */}
      <UpsellConfirmation store={store} appConfig={appConfig} offerId={offerId} />

      <style>{`
        .upsell-preview-page { position: relative; min-height: 100vh; }
        
        .preview-banner { position: fixed; top: 0; left: 0; right: 0; z-index: 9999; background: linear-gradient(135deg, #1f1f28, #27272a); border-bottom: 1px solid rgba(139,92,246,0.3); padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; gap: 16px; }
        
        .preview-banner-content { display: flex; align-items: center; gap: 16px; }
        
        .preview-badge { display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, rgba(139,92,246,0.2), rgba(167,139,250,0.15)); border: 1px solid rgba(139,92,246,0.4); color: #a78bfa; padding: 6px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; }
        
        .preview-banner p { color: #71717a; font-size: 14px; margin: 0; }
        
        .exit-preview-btn { display: flex; align-items: center; gap: 8px; background: #27272a; border: 1px solid #3f3f46; color: #e5e5e5; padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.15s; }
        .exit-preview-btn:hover { background: #3f3f46; border-color: #52525b; }
        
        @media (max-width: 600px) {
          .preview-banner { flex-direction: column; gap: 12px; padding: 12px 16px; }
          .preview-banner-content { flex-direction: column; gap: 8px; text-align: center; }
          .preview-banner p { font-size: 13px; }
        }
      `}</style>
    </div>
  );
}

// Exit Intent Modal Component
// React component for the exit intent popup

import React, { useState } from 'react';

export default function ExitIntentModal({ 
  isOpen, 
  onClose, 
  campaign,
  onEmailCapture,
  onApplyDiscount 
}) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const offer = campaign?.offer_config || {};
  const display = campaign?.display_config || {};
  const couponCode = offer.coupon_code || `SAVE${offer.value || 10}`;

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (email) {
      onEmailCapture(email);
      setSubmitted(true);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(couponCode);
    alert('Coupon code copied!');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999999
    }}>
      <div style={{
        background: '#1e293b',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '480px',
        width: '90%',
        textAlign: 'center',
        position: 'relative'
      }}>
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: '24px',
            cursor: 'pointer'
          }}
        >
          ×
        </button>

        <h2 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#f8fafc',
          marginBottom: '16px'
        }}>
          {display.headline || "Wait! Don't Leave!"}
        </h2>

        <p style={{
          color: '#94a3b8',
          fontSize: '16px',
          marginBottom: '24px'
        }}>
          {display.subtext || 'We have a special offer just for you!'}
        </p>

        {!submitted ? (
          <form onSubmit={handleEmailSubmit} style={{ marginBottom: '20px' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #334155',
                background: '#0f172a',
                color: '#f8fafc',
                fontSize: '14px',
                marginBottom: '12px',
                boxSizing: 'border-box'
              }}
            />
            <button 
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: '#3b82f6',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {display.button_text || 'Get My Discount'}
            </button>
          </form>
        ) : (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid #10b981',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <div style={{ color: '#10b981', fontWeight: '600' }}>Your Code:</div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#f8fafc',
              letterSpacing: '2px',
              marginTop: '8px'
            }}>
              {couponCode}
            </div>
          </div>
        )}

        <button
          onClick={submitted ? onApplyDiscount : handleCopyCode}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: submitted ? 'none' : '1px solid #334155',
            background: submitted ? '#10b981' : 'transparent',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: '12px'
          }}
        >
          {submitted ? (display.button_text || 'Apply Discount') : 'Copy Code'}
        </button>

        <p style={{
          color: '#64748b',
          fontSize: '12px'
        }}>
          No thanks, I'll pay full price
        </p>
      </div>
    </div>
  );
}

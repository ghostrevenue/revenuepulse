// Cart Alert Component
// Shows alerts when cart value reaches threshold

import React from 'react';

export default function CartAlert({ 
  cartValue, 
  threshold, 
  couponCode, 
  onApply,
  onDismiss 
}) {
  if (cartValue < threshold) return null;

  const savings = Math.round((cartValue * 0.1) * 100) / 100; // 10% example

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'linear-gradient(135deg, #1e293b, #0f172a)',
      border: '1px solid #10b981',
      borderRadius: '12px',
      padding: '20px',
      maxWidth: '320px',
      zIndex: 999998,
      boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
    }}>
      <button 
        onClick={onDismiss}
        style={{
          position: 'absolute',
          top: '8px',
          right: '12px',
          background: 'none',
          border: 'none',
          color: '#64748b',
          cursor: 'pointer',
          fontSize: '18px'
        }}
      >
        ×
      </button>

      <div style={{
        background: 'rgba(16, 185, 129, 0.1)',
        color: '#10b981',
        fontSize: '12px',
        fontWeight: '600',
        padding: '4px 8px',
        borderRadius: '4px',
        display: 'inline-block',
        marginBottom: '8px'
      }}>
        🎉 You Qualify!
      </div>

      <h4 style={{
        color: '#f8fafc',
        fontSize: '16px',
        fontWeight: '600',
        marginBottom: '8px'
      }}>
        Free Shipping + 10% Off!
      </h4>

      <p style={{
        color: '#94a3b8',
        fontSize: '13px',
        marginBottom: '12px'
      }}>
        Your cart qualifies for a special offer. Use code <strong>{couponCode}</strong> at checkout!
      </p>

      <div style={{
        display: 'flex',
        gap: '8px'
      }}>
        <button
          onClick={onApply}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '6px',
            border: 'none',
            background: '#10b981',
            color: 'white',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Apply Now
        </button>
        <button
          onClick={onDismiss}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #334155',
            background: 'transparent',
            color: '#94a3b8',
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          No Thanks
        </button>
      </div>
    </div>
  );
}

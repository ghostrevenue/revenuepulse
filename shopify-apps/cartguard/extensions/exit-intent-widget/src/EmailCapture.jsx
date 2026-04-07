// Email Capture Component
// Captures email from visitors before they leave

import React, { useState } from 'react';

export default function EmailCapture({ 
  isVisible, 
  onCapture, 
  onSkip,
  cartValue,
  cartItems 
}) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isVisible) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setSubmitting(true);
    try {
      await onCapture(email, { cartValue, cartItems });
      setSuccess(true);
      setTimeout(() => {
        onSkip();
      }, 2000);
    } catch (err) {
      console.error('Email capture error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999997
    }}>
      <div style={{
        background: '#1e293b',
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '400px',
        width: '90%',
        textAlign: 'center'
      }}>
        {success ? (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <h3 style={{ color: '#10b981', fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
              You're all set!
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>
              We'll send your exclusive offer to {email}
            </p>
          </>
        ) : (
          <>
            <h3 style={{ color: '#f8fafc', fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
              Wait! Don't lose your cart!
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
              Enter your email to save your cart and get a special discount.
            </p>

            <form onSubmit={handleSubmit}>
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
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#3b82f6',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1
                }}
              >
                {submitting ? 'Saving...' : 'Save My Cart'}
              </button>
            </form>

            <button
              onClick={onSkip}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '13px',
                cursor: 'pointer',
                marginTop: '16px'
              }}
            >
              No thanks, I'll checkout later
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * RevenuePulse - Upsell Modal Component
 * Customer-facing upsell UI rendered in checkout post-purchase extension
 * 
 * Features:
 * - Beautiful slide-up modal
 * - Product display with image, price, savings
 * - One-click add to order
 * - Smooth animations
 * - Mobile-first responsive design
 */

import React, { useState, useEffect } from 'react';

/**
 * UpsellModal Component
 * 
 * @param {Object} props
 * @param {Object} props.offer - The offer data including product
 * @param {Function} props.onAccept - Callback when offer is accepted
 * @param {Function} props.onDismiss - Callback when offer is dismissed
 * @param {Object} props.state - Current component state
 */
function UpsellModal({ offer, onAccept, onDismiss, state }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState(false);

  // Handle accepted/error states
  useEffect(() => {
    if (state?.accepted) {
      setAccepted(true);
    }
    if (state?.error) {
      setError(true);
    }
  }, [state]);

  // Animate in on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!offer || !offer.product) {
    return null;
  }

  const { product, displayConfig } = offer;
  const savingsPercent = product.savingsPercentage || Math.round((product.savings / product.originalPrice) * 100);

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      await onAccept();
    } catch (err) {
      setError(true);
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <div style={styles.overlay}>
      <div style={{
        ...styles.modal,
        transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
        opacity: isVisible ? 1 : 0
      }}>
        {/* Success State */}
        {accepted && (
          <div style={styles.successContainer}>
            <div style={styles.successIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="12" fill="#008060"/>
                <path d="M8 12l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 style={styles.successTitle}>Added to Order!</h3>
            <p style={styles.successText}>{product.title} has been added to your order.</p>
            <p style={styles.successPrice}>+${product.upsellPrice.toFixed(2)}</p>
            <button onClick={handleDismiss} style={styles.closeButton}>
              Continue to Confirmation
            </button>
          </div>
        )}

        {/* Error State */}
        {error && !accepted && (
          <div style={styles.errorContainer}>
            <div style={styles.errorIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="12" fill="#E53935"/>
                <path d="M15 9l-6 6M9 9l6 6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 style={styles.errorTitle}>Something went wrong</h3>
            <p style={styles.errorText}>We couldn't add this item to your order. Please try again.</p>
            <div style={styles.errorActions}>
              <button onClick={() => setError(false)} style={styles.retryButton}>
                Try Again
              </button>
              <button onClick={handleDismiss} style={styles.dismissLink}>
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Main Offer UI */}
        {!accepted && !error && (
          <>
            {/* Header */}
            <div style={styles.header}>
              <div style={styles.badge}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: 4 }}>
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#F49342"/>
                </svg>
                Exclusive Offer
              </div>
              <button onClick={handleDismiss} style={styles.dismissButton} aria-label="Dismiss">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Product Content */}
            <div style={styles.content}>
              {/* Product Image */}
              <div style={styles.imageContainer}>
                {product.image ? (
                  <img 
                    src={product.image} 
                    alt={product.title}
                    style={styles.productImage}
                  />
                ) : (
                  <div style={styles.imagePlaceholder}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C4C4C4" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <path d="M21 15l-5-5L5 21"/>
                    </svg>
                  </div>
                )}
                
                {/* Savings Badge */}
                {product.savings > 0 && (
                  <div style={styles.savingsBadge}>
                    Save {savingsPercent}%
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div style={styles.details}>
                <h3 style={styles.productTitle}>{product.title}</h3>
                
                {displayConfig?.subheadline && (
                  <p style={styles.subheadline}>{displayConfig.subheadline}</p>
                )}

                {/* Pricing */}
                <div style={styles.pricing}>
                  <span style={styles.upsellPrice}>${product.upsellPrice.toFixed(2)}</span>
                  {product.savings > 0 && (
                    <span style={styles.originalPrice}>${product.originalPrice.toFixed(2)}</span>
                  )}
                </div>

                {/* Savings Text */}
                {product.savings > 0 && (
                  <p style={styles.savingsText}>
                    You save ${product.savings.toFixed(2)} with this exclusive offer!
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={styles.actions}>
              <button 
                onClick={handleAccept}
                disabled={isLoading}
                style={{
                  ...styles.acceptButton,
                  opacity: isLoading ? 0.7 : 1,
                  cursor: isLoading ? 'wait' : 'pointer'
                }}
              >
                {isLoading ? (
                  <span style={styles.loadingSpinner}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="20"/>
                    </svg>
                  </span>
                ) : (
                  displayConfig?.ctaText || 'Add to Order'
                )}
              </button>

              <button onClick={handleDismiss} style={styles.dismissLink}>
                {displayConfig?.dismissText || 'No thanks'}
              </button>
            </div>

            {/* Trust Signals */}
            <div style={styles.trustSignals}>
              <span style={styles.trustItem}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#008060" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Secure checkout
              </span>
              <span style={styles.trustItem}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#008060" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
                Easy returns
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Styles - Clean, high-conversion design
const styles = {
  overlay: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 999999,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px 20px 0 0',
    width: '100%',
    maxWidth: '480px',
    maxHeight: '90vh',
    overflowY: 'auto',
    transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
    boxShadow: '0 -4px 30px rgba(0, 0, 0, 0.15)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #F0F0F0'
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    color: '#F49342',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  dismissButton: {
    background: 'none',
    border: 'none',
    padding: '8px',
    cursor: 'pointer',
    color: '#8C8C8C',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  content: {
    padding: '24px 20px',
    display: 'flex',
    gap: '20px',
    alignItems: 'flex-start'
  },
  imageContainer: {
    position: 'relative',
    flexShrink: 0
  },
  productImage: {
    width: '120px',
    height: '120px',
    objectFit: 'cover',
    borderRadius: '12px',
    backgroundColor: '#F8F8F8',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },
  imagePlaceholder: {
    width: '120px',
    height: '120px',
    borderRadius: '12px',
    backgroundColor: '#F8F8F8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  savingsBadge: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    backgroundColor: '#008060',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: '700'
  },
  details: {
    flex: 1,
    minWidth: 0
  },
  productTitle: {
    margin: '0 0 8px 0',
    fontSize: '18px',
    fontWeight: '600',
    color: '#1A1A2E',
    lineHeight: 1.3
  },
  subheadline: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    color: '#6B6B6B',
    lineHeight: 1.4
  },
  pricing: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '10px',
    marginBottom: '8px'
  },
  upsellPrice: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1A1A2E'
  },
  originalPrice: {
    fontSize: '16px',
    color: '#8C8C8C',
    textDecoration: 'line-through'
  },
  savingsText: {
    margin: 0,
    fontSize: '13px',
    color: '#008060',
    fontWeight: '500'
  },
  actions: {
    padding: '0 20px 20px 20px'
  },
  acceptButton: {
    width: '100%',
    padding: '16px 24px',
    backgroundColor: '#008060',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'background-color 0.2s, transform 0.1s'
  },
  loadingSpinner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'spin 1s linear infinite'
  },
  dismissLink: {
    display: 'block',
    width: '100%',
    marginTop: '12px',
    padding: '12px',
    background: 'none',
    border: 'none',
    color: '#8C8C8C',
    fontSize: '14px',
    cursor: 'pointer',
    textAlign: 'center'
  },
  trustSignals: {
    display: 'flex',
    justifyContent: 'center',
    gap: '24px',
    padding: '12px 20px 20px 20px',
    borderTop: '1px solid #F0F0F0'
  },
  trustItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#6B6B6B'
  },
  // Success state styles
  successContainer: {
    padding: '40px 20px',
    textAlign: 'center'
  },
  successIcon: {
    marginBottom: '16px'
  },
  successTitle: {
    margin: '0 0 8px 0',
    fontSize: '24px',
    fontWeight: '700',
    color: '#1A1A2E'
  },
  successText: {
    margin: '0 0 16px 0',
    fontSize: '14px',
    color: '#6B6B6B'
  },
  successPrice: {
    margin: '0 0 24px 0',
    fontSize: '20px',
    fontWeight: '600',
    color: '#008060'
  },
  closeButton: {
    width: '100%',
    padding: '16px 24px',
    backgroundColor: '#008060',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  // Error state styles
  errorContainer: {
    padding: '40px 20px',
    textAlign: 'center'
  },
  errorIcon: {
    marginBottom: '16px'
  },
  errorTitle: {
    margin: '0 0 8px 0',
    fontSize: '20px',
    fontWeight: '600',
    color: '#1A1A2E'
  },
  errorText: {
    margin: '0 0 24px 0',
    fontSize: '14px',
    color: '#6B6B6B'
  },
  errorActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  retryButton: {
    width: '100%',
    padding: '16px 24px',
    backgroundColor: '#5C6AC4',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer'
  }
};

// Add spin animation for loading spinner
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default UpsellModal;

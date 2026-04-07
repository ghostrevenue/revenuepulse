/**
 * RevenuePulse - Checkout Post-Purchase Extension
 * Entry point for Shopify checkout UI extension
 * 
 * This extension renders an upsell modal on the order confirmation page.
 * It fetches offer data from the app backend and displays a seamless
 * upsell experience without any page redirects.
 */

import React from 'react';
import { render } from 'react-dom';
import UpsellModal from './UpsellModal.jsx';

// Extension configuration
const EXTENSION_ID = 'checkout-post-purchase';

class RevenuePulseExtension {
  constructor() {
    this.container = null;
    this.modalRoot = null;
    this.orderData = null;
    this.offerData = null;
    this.isShown = false;
  }

  /**
   * Initialize the extension
   * Called by Shopify when the extension point is reached
   */
  async initialize() {
    console.log('[RevenuePulse] Initializing checkout extension');

    // Create container for our UI
    this.createContainer();

    // Get order data from extension props
    this.orderData = this.getOrderData();

    if (!this.orderData) {
      console.error('[RevenuePulse] No order data available');
      return;
    }

    // Evaluate if we should show an upsell
    await this.evaluateUpsell();

    // Render the UI
    this.render();
  }

  /**
   * Create the DOM container for our extension
   */
  createContainer() {
    // The extension container is provided by Shopify
    // We just need to create our inner content container
    this.container = document.createElement('div');
    this.container.id = 'revenuepulse-upsell-container';
    this.container.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 999999;
      pointer-events: none;
    `;

    // Append to body
    document.body.appendChild(this.container);

    // Create React root
    this.modalRoot = React.createRoot(this.container);
  }

  /**
   * Extract order data from extension props
   * In Shopify checkout extensions, order data is passed via different mechanisms
   */
  getOrderData() {
    // Try to get order data from window (set by our webhook processing)
    const orderId = window.Shopify?.checkout?.order_id;
    const shopDomain = window.Shopify?.shop;

    if (!orderId || !shopDomain) {
      // Fallback: try to extract from page content
      const orderElement = document.querySelector('[data-order-id]');
      if (orderElement) {
        return {
          orderId: orderElement.dataset.orderId,
          shopDomain: window.location.hostname
        };
      }
      return null;
    }

    return {
      orderId: orderId.toString(),
      shopDomain
    };
  }

  /**
   * Evaluate whether to show an upsell for this order
   */
  async evaluateUpsell() {
    try {
      const response = await fetch('/api/upsell/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: this.orderData.orderId,
          shopDomain: this.orderData.shopDomain
        })
      });

      if (!response.ok) {
        throw new Error(`Evaluation request failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.show) {
        this.offerData = data;
        this.trackImpression();
      } else {
        console.log('[RevenuePulse] No upsell to display:', data.reason);
      }
    } catch (error) {
      console.error('[RevenuePulse] Failed to evaluate upsell:', error);
    }
  }

  /**
   * Track that the offer was shown
   */
  async trackImpression() {
    if (!this.offerData) return;

    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          offerId: this.offerData.offerId,
          orderId: this.orderData.orderId,
          shopDomain: this.orderData.shopDomain,
          eventType: 'shown'
        })
      });
    } catch (error) {
      console.error('[RevenuePulse] Failed to track impression:', error);
    }
  }

  /**
   * Track that the offer was clicked
   */
  async trackClick() {
    if (!this.offerData) return;

    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          offerId: this.offerData.offerId,
          orderId: this.orderData.orderId,
          shopDomain: this.orderData.shopDomain,
          eventType: 'clicked'
        })
      });
    } catch (error) {
      console.error('[RevenuePulse] Failed to track click:', error);
    }
  }

  /**
   * Track that the offer was accepted (converted)
   */
  async trackConversion(revenue = 0) {
    if (!this.offerData) return;

    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          offerId: this.offerData.offerId,
          orderId: this.orderData.orderId,
          shopDomain: this.orderData.shopDomain,
          eventType: 'converted',
          revenue
        })
      });
    } catch (error) {
      console.error('[RevenuePulse] Failed to track conversion:', error);
    }
  }

  /**
   * Handle offer acceptance
   */
  async handleAccept() {
    this.trackClick();

    if (!this.offerData?.product) return;

    try {
      const response = await fetch('/api/upsell/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: this.orderData.orderId,
          offerId: this.offerData.offerId,
          productId: this.offerData.product.id,
          variantId: this.offerData.product.variant_id,
          shopDomain: this.orderData.shopDomain
        })
      });

      if (response.ok) {
        const data = await response.json();
        this.trackConversion(this.offerData.product.upsellPrice);
        
        // Show success state
        this.setState({ accepted: true });
      } else {
        throw new Error('Failed to add to order');
      }
    } catch (error) {
      console.error('[RevenuePulse] Failed to accept upsell:', error);
      this.setState({ error: true });
    }
  }

  /**
   * Handle offer dismissal
   */
  handleDismiss() {
    this.trackClick();

    // Hide the modal with animation
    this.setState({ dismissed: true });

    // Optionally call dismiss API
    fetch('/api/upsell/dismiss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: this.orderData.orderId,
        offerId: this.offerData?.offerId,
        shopDomain: this.orderData.shopDomain
      })
    }).catch(console.error);
  }

  /**
   * Render the React UI
   */
  render() {
    if (!this.offerData) return;

    const handleAccept = () => this.handleAccept();
    const handleDismiss = () => this.handleDismiss();

    this.modalRoot.render(
      React.createElement(UpsellModal, {
        offer: this.offerData,
        onAccept: handleAccept,
        onDismiss: handleDismiss,
        state: this.state || {}
      })
    );
  }

  /**
   * Update component state
   */
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.render();
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new RevenuePulseExtension().initialize());
} else {
  new RevenuePulseExtension().initialize();
}

// Export for potential module usage
export default RevenuePulseExtension;

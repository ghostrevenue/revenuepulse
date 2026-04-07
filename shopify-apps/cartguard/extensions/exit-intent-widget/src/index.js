// CartGuard Exit Intent Widget
// Entry point for Shopify storefront extension

(function() {
  'use strict';

  // Configuration (would be injected by the app)
  const CONFIG = {
    storeId: '{{STORE_ID}}',
    apiUrl: '{{API_URL}}',
    campaignId: null,
    exitIntentDelay: 5000,
    sessionFrequency: 'once'
  };

  // State
  let state = {
    sessionShown: false,
    pageLoadTime: Date.now(),
    hasEmail: false,
    cartValue: 0,
    cartItems: []
  };

  // Initialize tracking
  function init() {
    // Detect exit intent on desktop
    document.addEventListener('mouseleave', handleExitIntent);
    
    // Detect scroll-up on mobile
    let lastScroll = 0;
    window.addEventListener('scroll', function() {
      const currentScroll = window.pageYOffset;
      if (currentScroll < lastScroll && lastScroll > 100 && state.sessionShown === false) {
        handleExitIntent({ type: 'scroll-up' });
      }
      lastScroll = currentScroll;
    });

    // Track cart state
    observeCart();

    // Check if email already captured
    checkEmailStatus();

    // Wait for configured delay before enabling exit intent
    setTimeout(() => {
      state.ready = true;
    }, CONFIG.exitIntentDelay);
  }

  function handleExitIntent(event) {
    if (!state.ready || state.sessionShown) return;
    if (CONFIG.sessionFrequency === 'once' && sessionStorage.getItem('cartguard_shown')) return;

    state.sessionShown = true;
    sessionStorage.setItem('cartguard_shown', 'true');

    // Fetch active campaign
    fetch(`${CONFIG.apiUrl}/campaigns?store_id=${CONFIG.storeId}&status=active`)
      .then(r => r.json())
      .then(data => {
        const campaign = data.campaigns?.find(c => c.type === 'exit-intent');
        if (campaign) {
          showExitIntentModal(campaign);
        }
      })
      .catch(console.error);
  }

  function showExitIntentModal(campaign) {
    const offer = campaign.offer_config || {};
    const display = campaign.display_config || {};

    const modal = document.createElement('div');
    modal.id = 'cartguard-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: #1e293b;
      border-radius: 16px;
      padding: 40px;
      max-width: 480px;
      width: 90%;
      text-align: center;
      position: relative;
      transform: translateY(20px);
      transition: transform 0.3s ease;
    `;

    const headline = offer.coupon_code 
      ? (display.headline || "Wait! Don't Leave!")
      : (display.headline || "Get {value}% Off!");

    content.innerHTML = `
      <button id="cartguard-close" style="
        position: absolute;
        top: 16px;
        right: 16px;
        background: none;
        border: none;
        color: #94a3b8;
        font-size: 24px;
        cursor: pointer;
      ">×</button>

      <h2 style="
        font-size: 28px;
        font-weight: 700;
        color: #f8fafc;
        margin-bottom: 16px;
        font-family: Inter, system-ui, sans-serif;
      ">${headline}</h2>

      <p style="
        color: #94a3b8;
        font-size: 16px;
        margin-bottom: 24px;
        font-family: Inter, system-ui, sans-serif;
      ">${display.subtext || 'We have a special offer just for you!'}</p>

      ${!state.hasEmail ? `
        <form id="cartguard-email-form" style="margin-bottom: 20px;">
          <input type="email" id="cartguard-email" placeholder="Enter your email" required style="
            width: 100%;
            padding: 12px 16px;
            border-radius: 8px;
            border: 1px solid #334155;
            background: #0f172a;
            color: #f8fafc;
            font-size: 14px;
            margin-bottom: 12px;
            box-sizing: border-box;
          ">
          <button type="submit" style="
            width: 100%;
            padding: 12px;
            border-radius: 8px;
            border: none;
            background: #3b82f6;
            color: white;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
          ">${display.button_text || 'Get My Discount'}</button>
        </form>
      ` : `
        <div style="
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid #10b981;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
        ">
          <div style="color: #10b981; font-weight: 600;">Your Code:</div>
          <div style="font-size: 24px; font-weight: 700; color: #f8fafc; letter-spacing: 2px; margin-top: 8px;">
            ${offer.coupon_code || 'SAVE' + (offer.value || 10)}
          </div>
        </div>
        <button id="cartguard-apply" style="
          width: 100%;
          padding: 12px;
          border-radius: 8px;
          border: none;
          background: #10b981;
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        ">${display.button_text || 'Apply Discount'}</button>
      `}

      <p style="color: #64748b; font-size: 12px; margin-top: 16px; font-family: Inter, system-ui, sans-serif;">
        No thanks, I'll pay full price
      </p>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Animate in
    requestAnimationFrame(() => {
      modal.style.opacity = '1';
      content.style.transform = 'translateY(0)';
    });

    // Event handlers
    document.getElementById('cartguard-close').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    const emailForm = document.getElementById('cartguard-email-form');
    if (emailForm) {
      emailForm.addEventListener('submit', handleEmailCapture);
    }

    const applyBtn = document.getElementById('cartguard-apply');
    if (applyBtn) {
      applyBtn.addEventListener('click', handleApplyDiscount);
    }

    function closeModal() {
      modal.style.opacity = '0';
      content.style.transform = 'translateY(20px)';
      setTimeout(() => modal.remove(), 300);
    }

    function handleEmailCapture(e) {
      e.preventDefault();
      const email = document.getElementById('cartguard-email').value;
      
      fetch(`${CONFIG.apiUrl}/visitors/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: CONFIG.storeId,
          email,
          cart_value: state.cartValue,
          cart_contents: state.cartItems
        })
      }).then(() => {
        state.hasEmail = true;
        document.getElementById('cartguard-email-form').innerHTML = `
          <div style="color: #10b981; font-weight: 600;">Thanks! Your code: ${offer.coupon_code || 'SAVE' + (offer.value || 10)}</div>
        `;
      }).catch(console.error);
    }

    function handleApplyDiscount() {
      if (offer.coupon_code) {
        // Copy to clipboard
        navigator.clipboard.writeText(offer.coupon_code);
        alert('Coupon code copied to clipboard!');
      }
      closeModal();
    }
  }

  function observeCart() {
    // Observe Shopify cart for changes
    const observer = new MutationObserver(() => {
      const cart = document.querySelector('[data-cart]') || {};
      // Extract cart data (Shopify specific)
      const cartDrawer = document.querySelector('.cart-drawer') || document.querySelector('.CartDrawer');
      if (cartDrawer) {
        updateCartState();
      }
    });

    document.body && observer.observe(document.body, { childList: true, subtree: true });
    
    // Also check periodically
    setInterval(updateCartState, 5000);
  }

  function updateCartState() {
    // In production, this would extract actual cart data from Shopify
    // For now, we'll track via localStorage as a fallback
    const cartData = JSON.parse(localStorage.getItem('cartguard_cart') || '{}');
    state.cartValue = cartData.total || 0;
    state.cartItems = cartData.items || [];
  }

  function checkEmailStatus() {
    // Check if email exists in checkout or was previously captured
    const emailInput = document.querySelector('[name="email"], [name="Email"]');
    if (emailInput && emailInput.value) {
      state.hasEmail = true;
    }
    const savedEmail = sessionStorage.getItem('cartguard_email');
    if (savedEmail) {
      state.hasEmail = true;
    }
  }

  // Expose for external use
  window.CartGuard = {
    config: CONFIG,
    state,
    showModal: showExitIntentModal,
    trackEvent: function(type, data) {
      fetch(`${CONFIG.apiUrl}/analytics/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: CONFIG.storeId,
          event_type: type,
          event_data: data
        })
      }).catch(console.error);
    }
  };

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

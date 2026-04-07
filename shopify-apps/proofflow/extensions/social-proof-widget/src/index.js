/**
 * ProofFlow - Social Proof Widget
 * Storefront extension entry point
 */

(function() {
  'use strict';

  const CONFIG = {
    appUrl: window.PROOFFLOW_APP_URL || 'https://localhost:3001',
    shop: window.PROOFFLOW_SHOP || '',
    sessionId: sessionStorage.getItem('proofflow_session') || generateSessionId()
  };

  function generateSessionId() {
    const id = 'pf_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('proofflow_session', id);
    return id;
  }

  function init() {
    if (!CONFIG.shop) {
      console.warn('[ProofFlow] Shop domain not configured');
      return;
    }

    injectStyles();
    observeProductPages();
    setupLiveCounter();
    checkForPurchaseNotification();
  }

  function injectStyles() {
    const styles = document.createElement('style');
    styles.textContent = `
      .proofflow-rating {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .proofflow-stars {
        color: #F49342;
      }
      .proofflow-rating-text {
        color: #202223;
        font-size: 14px;
        font-weight: 500;
      }
      .proofflow-review-count {
        color: #6D7175;
        font-size: 14px;
        margin-left: 4px;
      }
      .proofflow-notification {
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: white;
        border-radius: 12px;
        padding: 16px 20px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        animation: proofflow-slide-in 0.3s ease-out;
        max-width: 320px;
      }
      .proofflow-notification.close {
        animation: proofflow-slide-out 0.3s ease-in forwards;
      }
      @keyframes proofflow-slide-in {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes proofflow-slide-out {
        from { transform: translateY(0); opacity: 1; }
        to { transform: translateY(100%); opacity: 0; }
      }
      .proofflow-notification-icon {
        width: 40px;
        height: 40px;
        background: #008060;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 12px;
      }
      .proofflow-notification-icon svg {
        width: 20px;
        height: 20px;
        color: white;
      }
      .proofflow-notification-title {
        font-size: 14px;
        font-weight: 600;
        color: #202223;
        margin-bottom: 4px;
      }
      .proofflow-notification-text {
        font-size: 13px;
        color: #6D7175;
        line-height: 1.4;
      }
      .proofflow-live-counter {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: rgba(0, 128, 96, 0.1);
        border-radius: 20px;
        font-size: 12px;
        color: #008060;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .proofflow-live-dot {
        width: 6px;
        height: 6px;
        background: #008060;
        border-radius: 50%;
        animation: proofflow-pulse 1.5s infinite;
      }
      @keyframes proofflow-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
    `;
    document.head.appendChild(styles);
  }

  function observeProductPages() {
    if (!window.MutationObserver) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            injectRatingWidget(node);
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function injectRatingWidget(container = document) {
    const productTitle = container.querySelector('h1, .product-title, [data-product-title]');
    if (!productTitle) return;

    const existingWidget = productTitle.parentElement.querySelector('.proofflow-rating');
    if (existingWidget) return;

    const ratingWidget = document.createElement('div');
    ratingWidget.className = 'proofflow-rating';
    ratingWidget.innerHTML = `
      <div class="proofflow-stars">★★★★★</div>
      <span class="proofflow-rating-text">4.8</span>
      <span class="proofflow-review-count">(127 reviews)</span>
    `;

    productTitle.parentElement.insertBefore(ratingWidget, productTitle.nextSibling);
  }

  function setupLiveCounter() {
    const counters = JSON.parse(localStorage.getItem('proofflow_counters') || '{}');
    const baseCount = Math.floor(Math.random() * 20) + 10;
    
    setInterval(() => {
      const variation = Math.floor(Math.random() * 5) - 2;
      const newCount = baseCount + variation;
      
      const counterEls = document.querySelectorAll('.proofflow-live-counter');
      counterEls.forEach(el => {
        const countSpan = el.querySelector('.proofflow-count');
        if (countSpan) {
          countSpan.textContent = newCount;
        }
      });
    }, 10000);

    renderLiveCounter(baseCount);
  }

  function renderLiveCounter(count) {
    const counter = document.createElement('div');
    counter.className = 'proofflow-live-counter';
    counter.innerHTML = `
      <div class="proofflow-live-dot"></div>
      <span><span class="proofflow-count">${count}</span> people viewing this</span>
    `;

    const productInfo = document.querySelector('.product-info, [data-product-info]');
    if (productInfo) {
      productInfo.appendChild(counter);
    }
  }

  function checkForPurchaseNotification() {
    const lastNotified = sessionStorage.getItem('proofflow_last_notification');
    const now = Date.now();
    
    if (lastNotified && now - parseInt(lastNotified) < 300000) {
      return;
    }

    const currentProduct = getCurrentProductId();
    if (!currentProduct) return;

    fetch(`${CONFIG.appUrl}/api/notifications/active?product_id=${currentProduct}&session_id=${CONFIG.sessionId}`)
      .then(r => r.json())
      .then(data => {
        if (data.notification) {
          showPurchaseNotification(data.notification);
          sessionStorage.setItem('proofflow_last_notification', now.toString());
          markNotificationShown(data.notification.id);
        }
      })
      .catch(() => {});
  }

  function getCurrentProductId() {
    const metaTag = document.querySelector('meta[property="product:id"]');
    if (metaTag) return metaTag.content;
    
    const urlMatch = window.location.pathname.match(/\/products\/([^\/]+)/);
    return urlMatch ? urlMatch[1] : null;
  }

  function showPurchaseNotification(notification) {
    const popup = document.createElement('div');
    popup.className = 'proofflow-notification';
    popup.innerHTML = `
      <div class="proofflow-notification-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>
      <div class="proofflow-notification-title">Someone just purchased this!</div>
      <div class="proofflow-notification-text">${notification.city || 'Someone'} recently bought this item</div>
    `;

    document.body.appendChild(popup);

    setTimeout(() => {
      popup.classList.add('close');
      setTimeout(() => popup.remove(), 300);
    }, 5000);

    popup.addEventListener('click', () => {
      popup.classList.add('close');
      setTimeout(() => popup.remove(), 300);
    });
  }

  function markNotificationShown(id) {
    fetch(`${CONFIG.appUrl}/api/notifications/${id}/shown`, { method: 'PUT' }).catch(() => {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

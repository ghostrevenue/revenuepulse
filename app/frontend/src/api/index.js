const API_BASE = window.location.origin;

function getShopHeader() {
  const params = new URLSearchParams(window.location.search);
  const shop = params.get('shop');
  return shop ? { 'X-Shopify-Shop-Domain': shop } : {};
}

function getOAuthParams() {
  const params = new URLSearchParams(window.location.search);
  const hmac = params.get('hmac');
  const host = params.get('host');
  const shop = params.get('shop');
  const timestamp = params.get('timestamp');
  if (hmac && shop) {
    return { hmac, host, shop, timestamp };
  }
  return null;
}

async function apiFetch(path, options = {}) {
  const shopHeader = getShopHeader();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      ...shopHeader,
    },
    ...options
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    const error = new Error(err.error || `Request failed with status ${res.status}`);
    if (err.needs_reauth) {
      error.needs_reauth = true;
      error.reconnect_url = err.reconnect_url || '/api/auth/reconnect';
    }
    throw error;
  }
  return res.json();
}

export const api = {
  // Auth
  verifySession: (storeId = null) => {
    const oAuthParams = getOAuthParams();
    let body;
    if (oAuthParams) {
      body = JSON.stringify(oAuthParams);
    } else if (storeId) {
      // Don't include X-Shopify-Shop-Domain header when storeId is present —
      // the backend reads storeId from body, and the shop header would take
      // precedence over storeId lookup (causing "Store not found" on fresh installs).
      body = JSON.stringify({ storeId });
      return fetch('/api/auth/session/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      }).then(async res => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          throw new Error(err.error || `Request failed with status ${res.status}`);
        }
        return res.json();
      });
    } else {
      body = JSON.stringify({ sessionToken: null });
    }
    return apiFetch('/api/auth/session/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });
  },

  // App Bridge Config
  getAppBridgeConfig: () => apiFetch('/api/app-bridge-config'),

  // --- UPSELL OFFERS ---
  // GET /api/upsell/offers — list all offers
  getUpsellOffers: () => apiFetch('/api/upsell/offers'),

  // GET /api/upsell/responses — recent offer responses
  getUpsellResponses: () => apiFetch('/api/upsell/responses'),

  // POST /api/upsell/offers — create offer
  createUpsellOffer: (data) => apiFetch('/api/upsell/offers', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // GET /api/upsell/offers/:id — get single offer
  getUpsellOffer: (id) => apiFetch(`/api/upsell/offers/${id}`),

  // PUT /api/upsell/offers/:id — update offer
  updateUpsellOffer: (id, data) => apiFetch(`/api/upsell/offers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  // DELETE /api/upsell/offers/:id — soft-delete (archive) offer
  deleteUpsellOffer: (id) => apiFetch(`/api/upsell/offers/${id}`, { method: 'DELETE' }),

  // DELETE /api/upsell/offers/:id?hard=1 — hard-delete offer permanently
  hardDeleteUpsellOffer: (id) => apiFetch(`/api/upsell/offers/${id}?hard=1`, { method: 'DELETE' }),

  // PUT /api/upsell/offers/:id — toggle publish/unpublish
  togglePublishOffer: (id, publish) => apiFetch(`/api/upsell/offers/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status: publish ? 'published' : 'draft' })
  }),

  // --- UPSELL PREVIEW ---
  // GET /api/upsell/preview/:id — preview a specific offer (merchant view)
  getUpsellPreview: (offerId) => apiFetch(`/api/upsell/preview/${offerId}`),

  // --- A/B TESTING ---
  // POST /api/upsell/ab/create — create A/B test (clone offer as variant B)
  cloneOfferForABTest: (offerId, data) => apiFetch('/api/upsell/ab/create', {
    method: 'POST',
    body: JSON.stringify({ offerId, ...data })
  }),

  // GET /api/dashboard/ab-groups — list all active A/B test groups
  getABTests: () => apiFetch('/api/dashboard/ab-groups'),

  // PUT /api/upsell/ab/:groupId — update A/B test (traffic split, pause, etc.)
  updateABTest: (testId, data) => apiFetch(`/api/upsell/ab/${testId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  // DELETE /api/upsell/ab/:groupId — delete/stop A/B test
  deleteABTest: (testId) => apiFetch(`/api/upsell/ab/${testId}`, { method: 'DELETE' }),

  // GET /api/upsell/ab/:groupId — get A/B test results
  getABTestResults: (testId) => apiFetch(`/api/upsell/ab/${testId}`),

  // --- UPSELL STOREFRONT ---
  // GET /api/upsell/check/:order_id — check if order qualifies for upsell
  checkUpsellOffer: (orderId) => apiFetch(`/api/upsell/check/${orderId}`),

  // POST /api/upsell/accept — accept upsell
  acceptUpsellOffer: (data) => apiFetch('/api/upsell/accept', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // POST /api/upsell/decline — decline upsell
  declineUpsellOffer: (data) => apiFetch('/api/upsell/decline', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // --- DASHBOARD ---
  // GET /api/dashboard/stats — conversion stats
  getDashboardStats: () => apiFetch('/api/dashboard/stats'),

  // GET /api/dashboard/recent — recent responses (last 5)
  getDashboardRecent: () => apiFetch('/api/dashboard/recent'),

  // GET /api/dashboard/analytics/chart — accept/decline counts and revenue by day for period
  getAnalyticsChart: (days = 30) => apiFetch(`/api/dashboard/analytics/chart?days=${days}`),

  // GET /api/dashboard/analytics/offers — per-offer performance stats for period
  getAnalyticsOffers: (days = 30) => apiFetch(`/api/dashboard/analytics/offers?days=${days}`),

  // --- BILLING ---
  getPlans: () => apiFetch('/api/billing/plans'),
  getPlan: () => apiFetch('/api/billing/plan'),
  updatePlan: (plan) => apiFetch('/api/billing/plan', {
    method: 'POST',
    body: JSON.stringify({ plan })
  }),

  // --- SHOPIFY STORE DATA (for targeting selectors) ---
  // GET /api/shopify/products/search?query=search&limit=50
  searchShopifyProducts: (query = '', limit = 50) =>
    apiFetch(`/api/shopify/products/search?query=${encodeURIComponent(query)}&limit=${limit}`),

  // GET /api/shopify/collections
  getShopifyCollections: () => apiFetch('/api/shopify/collections'),

  // GET /api/shopify/product-tags
  getShopifyProductTags: () => apiFetch('/api/shopify/product-tags'),

  // GET /api/shopify/products — paginated rich product search
  getShopifyProducts: (query = '', cursor = null, limit = 25) => {
    let url = `/api/shopify/products?query=${encodeURIComponent(query)}&limit=${limit}`;
    if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;
    return apiFetch(url);
  },

  // GET /api/shopify/price-rules — discount codes
  getShopifyPriceRules: () => apiFetch('/api/shopify/price-rules'),
};

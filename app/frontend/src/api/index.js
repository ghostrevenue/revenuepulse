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
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
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
      body = JSON.stringify({ storeId });
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

  // DELETE /api/upsell/offers/:id — delete offer
  deleteUpsellOffer: (id) => apiFetch(`/api/upsell/offers/${id}`, { method: 'DELETE' }),

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

  // --- BILLING ---
  getPlans: () => apiFetch('/api/billing/plans'),
  getPlan: () => apiFetch('/api/billing/plan'),
  updatePlan: (plan) => apiFetch('/api/billing/plan', {
    method: 'POST',
    body: JSON.stringify({ plan })
  }),
};

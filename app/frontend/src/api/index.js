const API_BASE = window.location.origin;

function getShopHeader() {
  const params = new URLSearchParams(window.location.search);
  const shop = params.get('shop');
  return shop ? { 'X-Shopify-Shop-Domain': shop } : {};
}

// Extract OAuth params from URL when merchant installs via Partners Dashboard
// Shopify sends: ?hmac=...&host=...&shop=...&timestamp=...
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
  // For Partners Dashboard install flow: pass OAuth params from URL so backend
  // can verify HMAC and complete OAuth token exchange. For session token flow
  // (embedded), pass sessionToken in body.
  // verifySession: looks up the authenticated store.
  // For Partners Dashboard install flow with OAuth params in URL, pass no args
  //   and the backend verifies HMAC and provisions the store.
  // For post-OAuth callback (store already installed), pass storeId to look up
  //   by ID without needing OAuth params.
  // For embedded/session-token flow, pass null.
  verifySession: (storeId = null) => {
    const oAuthParams = getOAuthParams();
    let body;
    if (oAuthParams) {
      body = JSON.stringify(oAuthParams); // Partners Dashboard install
    } else if (storeId) {
      body = JSON.stringify({ storeId }); // Post-OAuth callback
    } else {
      body = JSON.stringify({ sessionToken: null }); // Embedded/session token
    }
    return apiFetch('/api/auth/session/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });
  },

  // Revenue
  getSummary: (days = 30) => apiFetch(`/api/revenue/summary?days=${days}`),
  getDaily: (days = 30) => apiFetch(`/api/revenue/daily?days=${days}`),
  getLatest: () => apiFetch('/api/revenue/latest'),
  seedData: () => apiFetch('/api/revenue/seed', { method: 'POST' }),

  // Billing
  getPlans: () => apiFetch('/api/billing/plans'),
  getPlan: () => apiFetch('/api/billing/plan'),
  updatePlan: (plan) => apiFetch('/api/billing/plan', {
    method: 'POST',
    body: JSON.stringify({ plan })
  }),

  // App Bridge Config
  getAppBridgeConfig: () => apiFetch('/api/app-bridge-config'),

  // Upsell offers
  getUpsellOffers: () => apiFetch('/api/upsell/offers'),
  createUpsellOffer: (data) => apiFetch('/api/upsell/offers', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateUpsellOffer: (id, data) => apiFetch(`/api/upsell/offer/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteUpsellOffer: (id) => apiFetch(`/api/upsell/offer/${id}`, { method: 'DELETE' }),
  getUpsellResponses: () => apiFetch('/api/upsell/responses'),

  // Upsell config
  getUpsellConfig: () => apiFetch('/api/upsell/config'),
  saveUpsellConfig: (upsell_config) => apiFetch('/api/upsell/config', {
    method: 'POST',
    body: JSON.stringify({ upsell_config })
  }),

  // Upsell offer check (for storefront)
  checkUpsellOffer: (orderId, shop) => apiFetch(`/api/upsell?order_id=${orderId}&shop=${encodeURIComponent(shop)}`),
  acceptUpsellOffer: (data) => apiFetch('/api/upsell/accept', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  declineUpsellOffer: (data) => apiFetch('/api/upsell/decline', {
    method: 'POST',
    body: JSON.stringify(data)
  })
};

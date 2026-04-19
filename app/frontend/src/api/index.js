const API_BASE = window.location.origin;
const DEFAULT_TIMEOUT = 12000; // 12s — long enough for Shopify API calls

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
  if (hmac && shop) return { hmac, host, shop, timestamp };
  return null;
}

async function apiFetch(path, options = {}) {
  const shopHeader = getShopHeader();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        ...shopHeader,
      },
      ...options,
    });
    clearTimeout(timeoutId);

    // Try to parse response as JSON; fall back to plain text for non-JSON errors
    let errData;
    const contentType = res.headers.get('content-type') || '';
    try {
      errData = contentType.includes('application/json')
        ? await res.json()
        : { error: await res.text() };
    } catch {
      errData = { error: `HTTP ${res.status}` };
    }

    if (!res.ok) {
      const error = new Error(errData.error || `Request failed with status ${res.status}`);
      if (errData.needs_reauth) {
        error.needs_reauth = true;
        error.reconnect_url = errData.reconnect_url || '/api/auth/reconnect';
      }
      throw error;
    }
    return errData;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      const timeoutError = new Error(`Request timed out after ${DEFAULT_TIMEOUT / 1000}s`);
      timeoutError.isTimeout = true;
      throw timeoutError;
    }
    throw err;
  }
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
        body,
      }).then(async res => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          throw new Error(errData.error || `Request failed with status ${res.status}`);
        }
        return res.json();
      });
    } else {
      body = JSON.stringify({ sessionToken: null });
    }
    return apiFetch('/api/auth/session/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
  },

  // App Bridge Config
  getAppBridgeConfig: () => apiFetch('/api/app-bridge-config'),

  // --- UPSELL OFFERS ---
  getUpsellOffers: () => apiFetch('/api/upsell/offers'),
  getUpsellResponses: () => apiFetch('/api/upsell/responses'),
  createUpsellOffer: (data) => apiFetch('/api/upsell/offers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getUpsellOffer: (id) => apiFetch(`/api/upsell/offers/${id}`),
  updateUpsellOffer: (id, data) => apiFetch(`/api/upsell/offers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteUpsellOffer: (id) => apiFetch(`/api/upsell/offers/${id}`, { method: 'DELETE' }),
  hardDeleteUpsellOffer: (id) => apiFetch(`/api/upsell/offers/${id}?hard=1`, { method: 'DELETE' }),
  togglePublishOffer: (id, publish) => apiFetch(`/api/upsell/offers/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status: publish ? 'published' : 'draft' }),
  }),

  // --- UPSELL PREVIEW ---
  getUpsellPreview: (offerId) => apiFetch(`/api/upsell/preview/${offerId}`),

  // --- A/B TESTING ---
  cloneOfferForABTest: (offerId, data) => apiFetch('/api/upsell/ab/create', {
    method: 'POST',
    body: JSON.stringify({ offerId, ...data }),
  }),
  getABTests: () => apiFetch('/api/dashboard/ab-groups'),
  updateABTest: (testId, data) => apiFetch(`/api/upsell/ab/${testId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteABTest: (testId) => apiFetch(`/api/upsell/ab/${testId}`, { method: 'DELETE' }),
  getABTestResults: (testId) => apiFetch(`/api/upsell/ab/${testId}`),

  // --- UPSELL STOREFRONT ---
  checkUpsellOffer: (orderId) => apiFetch(`/api/upsell/check/${orderId}`),
  acceptUpsellOffer: (data) => apiFetch('/api/upsell/accept', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  declineUpsellOffer: (data) => apiFetch('/api/upsell/decline', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // --- DASHBOARD ---
  getDashboardStats: () => apiFetch('/api/dashboard/stats'),
  getDashboardRecent: () => apiFetch('/api/dashboard/recent'),
  getAnalyticsChart: (days = 30) => apiFetch(`/api/dashboard/analytics/chart?days=${days}`),
  getAnalyticsOffers: (days = 30) => apiFetch(`/api/dashboard/analytics/offers?days=${days}`),

  // --- BILLING ---
  getPlans: () => apiFetch('/api/billing/plans'),
  getPlan: () => apiFetch('/api/billing/plan'),
  updatePlan: (plan) => apiFetch('/api/billing/plan', {
    method: 'POST',
    body: JSON.stringify({ plan }),
  }),
  uninstallApp: () => apiFetch('/api/billing/uninstall', { method: 'DELETE' }),
  saveNotificationPrefs: (prefs) => apiFetch('/api/billing/notification-prefs', {
    method: 'POST',
    body: JSON.stringify(prefs),
  }),

  // --- FUNNELS ---
  getFunnels: () => apiFetch('/api/funnels'),
  getFunnel: (id) => apiFetch(`/api/funnels/${id}`),
  createFunnel: (data) => apiFetch('/api/funnels', {
    method: 'POST',
    body: JSON.stringify({ name: data.name, trigger: data.trigger, nodes: data.nodes }),
  }),
  updateFunnel: (id, data) => apiFetch(`/api/funnels/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name: data.name, status: data.status, trigger: data.trigger, nodes: data.nodes }),
  }),
  deleteFunnel: (id) => apiFetch(`/api/funnels/${id}`, { method: 'DELETE' }),

  // --- SHOPIFY STORE DATA ---
  searchShopifyProducts: (query = '', limit = 50) =>
    apiFetch(`/api/shopify/products/search?query=${encodeURIComponent(query)}&limit=${limit}`),
  getShopifyCollections: () => apiFetch('/api/shopify/collections'),
  getShopifyProductTags: () => apiFetch('/api/shopify/product-tags'),
  getShopifyProducts: (query = '', cursor = null, limit = 25) => {
    let url = `/api/shopify/products?query=${encodeURIComponent(query)}&limit=${limit}`;
    if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;
    return apiFetch(url);
  },
  getShopifyPriceRules: () => apiFetch('/api/shopify/price-rules'),
};

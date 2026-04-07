const API_BASE = window.location.origin;

function getShopHeader() {
  const params = new URLSearchParams(window.location.search);
  const shop = params.get('shop');
  return shop ? { 'X-Shopify-Shop-Domain': shop } : {};
}

async function apiFetch(path, options = {}) {
  const shopHeader = getShopHeader();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...shopHeader,
      ...options.headers
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
  verifySession: () => apiFetch('/api/auth/session/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionToken: null })
  }),

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
  getAppBridgeConfig: () => apiFetch('/api/app-bridge-config')
};

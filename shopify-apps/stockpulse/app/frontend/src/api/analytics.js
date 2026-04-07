const API_BASE = '/api';

export const analyticsApi = {
  async getVelocity(storeId) {
    const res = await fetch(`${API_BASE}/analytics/velocity`, { headers: { 'x-store-id': storeId } });
    return res.json();
  },
  async getPredictions(storeId) {
    const res = await fetch(`${API_BASE}/analytics/predictions`, { headers: { 'x-store-id': storeId } });
    return res.json();
  },
  async getSummary(storeId) {
    const res = await fetch(`${API_BASE}/analytics/summary`, { headers: { 'x-store-id': storeId } });
    return res.json();
  },
  async getHistory(storeId, productId, days) {
    const params = new URLSearchParams({ productId, days });
    const res = await fetch(`${API_BASE}/analytics/history?${params}`, { headers: { 'x-store-id': storeId } });
    return res.json();
  }
};
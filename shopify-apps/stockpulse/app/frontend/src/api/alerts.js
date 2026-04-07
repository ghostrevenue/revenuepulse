const API_BASE = '/api';

export const alertsApi = {
  async getConfigs(storeId) {
    const res = await fetch(`${API_BASE}/alerts/configs`, { headers: { 'x-store-id': storeId } });
    return res.json();
  },
  async createConfig(storeId, data) {
    const res = await fetch(`${API_BASE}/alerts/configs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-store-id': storeId },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async getHistory(storeId) {
    const res = await fetch(`${API_BASE}/alerts/history`, { headers: { 'x-store-id': storeId } });
    return res.json();
  },
  async getPending(storeId) {
    const res = await fetch(`${API_BASE}/alerts/pending`, { headers: { 'x-store-id': storeId } });
    return res.json();
  },
  async acknowledge(id) {
    const res = await fetch(`${API_BASE}/alerts/${id}/acknowledge`, { method: 'POST' });
    return res.json();
  },
  async testAlert(storeId, productId) {
    const res = await fetch(`${API_BASE}/alerts/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-store-id': storeId },
      body: JSON.stringify({ productId })
    });
    return res.json();
  }
};
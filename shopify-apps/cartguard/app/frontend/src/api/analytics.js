const API = {
  base: '/api',
  async get(path) {
    const res = await fetch(this.base + path);
    return res.json();
  },
  async post(path, data) {
    const res = await fetch(this.base + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  }
};

export async function getDashboardStats(storeId) {
  return API.get(`/analytics/dashboard?store_id=${storeId}`);
}

export async function getFunnelData(storeId, period = '30d') {
  return API.get(`/analytics/funnel?store_id=${storeId}&period=${period}`);
}

export async function trackEvent(storeId, eventType, eventData) {
  return API.post('/analytics/event', {
    store_id: storeId,
    event_type: eventType,
    event_data: eventData
  });
}

export default API;

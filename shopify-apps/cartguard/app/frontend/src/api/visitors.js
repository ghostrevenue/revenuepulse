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
  },
  async put(path, data) {
    const res = await fetch(this.base + path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  }
};

export async function getVisitors(storeId, options = {}) {
  const params = new URLSearchParams({ store_id: storeId });
  if (options.status) params.append('status', options.status);
  if (options.limit) params.append('limit', options.limit);
  if (options.offset) params.append('offset', options.offset);
  return API.get(`/visitors?${params}`);
}

export async function captureEmail(visitorId, email, cartData) {
  return API.post('/visitors/email', {
    visitor_id: visitorId,
    email,
    cart_contents: cartData?.cart_contents,
    cart_value: cartData?.cart_value
  });
}

export async function trackVisitor(storeId, sessionId, data) {
  return API.post('/visitors/track', {
    store_id: storeId,
    session_id: sessionId,
    ...data
  });
}

export default API;

const API_BASE = '/api';

export async function getNotifications(filters = {}) {
  const params = new URLSearchParams();
  if (filters.type) params.append('type', filters.type);
  if (filters.product_id) params.append('product_id', filters.product_id);
  if (filters.shown !== undefined) params.append('shown', filters.shown);
  if (filters.limit) params.append('limit', filters.limit);
  
  const response = await fetch(`${API_BASE}/notifications?${params}`);
  return response.json();
}

export async function createNotification(data) {
  const response = await fetch(`${API_BASE}/notifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
}

export async function markNotificationShown(id) {
  const response = await fetch(`${API_BASE}/notifications/${id}/shown`, {
    method: 'PUT'
  });
  return response.json();
}

export async function getNotificationStats() {
  const response = await fetch(`${API_BASE}/notifications/stats`);
  return response.json();
}

export async function getActiveNotification(productId, sessionId) {
  const response = await fetch(`${API_BASE}/notifications/active?product_id=${productId}&session_id=${sessionId}`);
  return response.json();
}

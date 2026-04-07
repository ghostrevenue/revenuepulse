const API_BASE = '/api';

export async function getAnalytics() {
  const response = await fetch(`${API_BASE}/analytics`);
  return response.json();
}

export async function trackEvent(event_type, product_id = null, value = null) {
  const response = await fetch(`${API_BASE}/analytics/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_type, product_id, value })
  });
  return response.json();
}

export async function getAnalyticsEvents(eventType = null) {
  const params = eventType ? `?type=${eventType}` : '';
  const response = await fetch(`${API_BASE}/analytics/events${params}`);
  return response.json();
}

const API_BASE = '/api';

export async function getReviews(filters = {}) {
  const params = new URLSearchParams();
  if (filters.product_id) params.append('product_id', filters.product_id);
  if (filters.rating) params.append('rating', filters.rating);
  if (filters.verified !== undefined) params.append('verified', filters.verified);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.offset) params.append('offset', filters.offset);
  
  const response = await fetch(`${API_BASE}/reviews?${params}`);
  return response.json();
}

export async function getReview(id) {
  const response = await fetch(`${API_BASE}/reviews/${id}`);
  return response.json();
}

export async function createReview(data) {
  const response = await fetch(`${API_BASE}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
}

export async function updateReview(id, data) {
  const response = await fetch(`${API_BASE}/reviews/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
}

export async function deleteReview(id) {
  const response = await fetch(`${API_BASE}/reviews/${id}`, {
    method: 'DELETE'
  });
  return response.json();
}

export async function replyToReview(id, reply_text) {
  const response = await fetch(`${API_BASE}/reviews/${id}/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reply_text })
  });
  return response.json();
}

export async function markReviewHelpful(id) {
  const response = await fetch(`${API_BASE}/reviews/${id}/helpful`, {
    method: 'POST'
  });
  return response.json();
}

export async function getReviewsStats() {
  const response = await fetch(`${API_BASE}/reviews/stats`);
  return response.json();
}

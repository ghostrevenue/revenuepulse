const API_BASE = '/api';

export const subscriptionsApi = {
  getAll: (storeId) => fetch(`${API_BASE}/subscriptions/store/${storeId}`).then(r => r.json()),
  getActive: (storeId) => fetch(`${API_BASE}/subscriptions/store/${storeId}/active`).then(r => r.json()),
  getByCustomer: (customerId, storeId) => fetch(`${API_BASE}/subscriptions/customer/${customerId}/store/${storeId}`).then(r => r.json()),
  get: (id) => fetch(`${API_BASE}/subscriptions/${id}`).then(r => r.json()),
  create: (data) => fetch(`${API_BASE}/subscriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  update: (id, data) => fetch(`${API_BASE}/subscriptions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  pause: (id) => fetch(`${API_BASE}/subscriptions/${id}/pause`, { method: 'POST' }).then(r => r.json()),
  resume: (id) => fetch(`${API_BASE}/subscriptions/${id}/resume`, { method: 'POST' }).then(r => r.json()),
  cancel: (id) => fetch(`${API_BASE}/subscriptions/${id}/cancel`, { method: 'POST' }).then(r => r.json()),
  skip: (id) => fetch(`${API_BASE}/subscriptions/${id}/skip`, { method: 'POST' }).then(r => r.json()),
  changePlan: (id, planId) => fetch(`${API_BASE}/subscriptions/${id}/change-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planId })
  }).then(r => r.json()),
  applyRetentionDiscount: (id) => fetch(`${API_BASE}/subscriptions/${id}/retention-discount`, { method: 'POST' }).then(r => r.json())
};

export default subscriptionsApi;

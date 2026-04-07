const API_BASE = '/api';

export const plansApi = {
  getAll: (storeId) => fetch(`${API_BASE}/plans/store/${storeId}`).then(r => r.json()),
  get: (id) => fetch(`${API_BASE}/plans/${id}`).then(r => r.json()),
  create: (data) => fetch(`${API_BASE}/plans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  update: (id, data) => fetch(`${API_BASE}/plans/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  delete: (id) => fetch(`${API_BASE}/plans/${id}`, { method: 'DELETE' }).then(r => r.json())
};

export default plansApi;

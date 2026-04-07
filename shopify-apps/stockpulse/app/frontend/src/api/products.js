const API_BASE = '/api';

export const productsApi = {
  async getAll(storeId) {
    const res = await fetch(`${API_BASE}/products`, { headers: { 'x-store-id': storeId } });
    return res.json();
  },
  async getLowStock(storeId) {
    const res = await fetch(`${API_BASE}/products/status/low-stock`, { headers: { 'x-store-id': storeId } });
    return res.json();
  },
  async getOutOfStock(storeId) {
    const res = await fetch(`${API_BASE}/products/status/out-of-stock`, { headers: { 'x-store-id': storeId } });
    return res.json();
  },
  async bulkUpdate(storeId, items) {
    const res = await fetch(`${API_BASE}/products/bulk-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-store-id': storeId },
      body: JSON.stringify({ items })
    });
    return res.json();
  },
  async update(id, data) {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  }
};
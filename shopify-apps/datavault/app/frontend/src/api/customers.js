const API_BASE = '/api/customers';

export async function getCustomers(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}?${query}`);
  return res.json();
}

export async function getCustomer(id) {
  const res = await fetch(`${API_BASE}/${id}`);
  return res.json();
}

export async function getCustomerStats() {
  const res = await fetch(`${API_BASE}/stats`);
  return res.json();
}

export async function syncCustomers(customers) {
  const res = await fetch(`${API_BASE}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customers })
  });
  return res.json();
}

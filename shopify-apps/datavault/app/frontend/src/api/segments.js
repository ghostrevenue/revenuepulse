const API_BASE = '/api/segments';

export async function getSegments() {
  const res = await fetch(API_BASE);
  return res.json();
}

export async function getSegment(id) {
  const res = await fetch(`${API_BASE}/${id}`);
  return res.json();
}

export async function createSegment(data) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function updateSegment(id, data) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function deleteSegment(id) {
  const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
  return res.json();
}

export async function previewSegment(rules) {
  const res = await fetch(`${API_BASE}/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rules })
  });
  return res.json();
}

export async function getSegmentCustomers(id, params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/${id}/customers?${query}`);
  return res.json();
}

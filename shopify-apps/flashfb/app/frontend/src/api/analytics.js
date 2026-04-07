const BASE = '/api/analytics';

export async function getOverview(storeId) {
  const res = await fetch(`${BASE}/${storeId}/overview`);
  return res.json();
}

export async function getROAS(storeId) {
  const res = await fetch(`${BASE}/${storeId}/roas`);
  return res.json();
}

export async function getTimeline(storeId, days = 7) {
  const res = await fetch(`${BASE}/${storeId}/timeline?days=${days}`);
  return res.json();
}

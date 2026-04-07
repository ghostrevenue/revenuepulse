const BASE = '/api/pixel';

export async function getPixels(storeId) {
  const res = await fetch(`${BASE}/${storeId}`);
  return res.json();
}

export async function getPixelConfig(storeId) {
  const res = await fetch(`${BASE}/${storeId}/config`);
  return res.json();
}

export async function savePixel(storeId, data) {
  const res = await fetch(`${BASE}/${storeId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function testPixel(storeId, data) {
  const res = await fetch(`${BASE}/${storeId}/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function deletePixel(storeId, pixelId) {
  const res = await fetch(`${BASE}/${storeId}/${pixelId}`, { method: 'DELETE' });
  return res.json();
}

const API = {
  base: '/api',
  async get(path) {
    const res = await fetch(this.base + path);
    return res.json();
  },
  async post(path, data) {
    const res = await fetch(this.base + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async put(path, data) {
    const res = await fetch(this.base + path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async del(path) {
    const res = await fetch(this.base + path, { method: 'DELETE' });
    return res.json();
  }
};

export async function getCampaigns(storeId) {
  return API.get(`/campaigns?store_id=${storeId}`);
}

export async function getCampaign(id) {
  return API.get(`/campaigns/${id}`);
}

export async function createCampaign(data) {
  return API.post('/campaigns', data);
}

export async function updateCampaign(id, data) {
  return API.put(`/campaigns/${id}`, data);
}

export async function deleteCampaign(id) {
  return API.del(`/campaigns/${id}`);
}

export default API;

const API_BASE = '/api';

export const analyticsApi = {
  getDashboard: (storeId) => fetch(`${API_BASE}/analytics/dashboard/${storeId}`).then(r => r.json()),
  getMRR: (storeId, months = 12) => fetch(`${API_BASE}/analytics/mrr/${storeId}?months=${months}`).then(r => r.json()),
  getLTV: (storeId) => fetch(`${API_BASE}/analytics/ltv/${storeId}`).then(r => r.json()),
  getChurnFunnel: (storeId) => fetch(`${API_BASE}/analytics/churn-funnel/${storeId}`).then(r => r.json()),
  getChurnTrend: (storeId, months = 6) => fetch(`${API_BASE}/analytics/churn-trend/${storeId}?months=${months}`).then(r => r.json()),
  getGrowth: (storeId, months = 12) => fetch(`${API_BASE}/analytics/growth/${storeId}?months=${months}`).then(r => r.json()),
  getAgeDistribution: (storeId) => fetch(`${API_BASE}/analytics/age-distribution/${storeId}`).then(r => r.json()),
  getPlanPerformance: (storeId) => fetch(`${API_BASE}/analytics/plan-performance/${storeId}`).then(r => r.json()),
  getFrequencyDistribution: (storeId) => fetch(`${API_BASE}/analytics/frequency-distribution/${storeId}`).then(r => r.json()),
  getDunning: (storeId) => fetch(`${API_BASE}/analytics/dunning/${storeId}`).then(r => r.json()),
  getAtRisk: (storeId) => fetch(`${API_BASE}/analytics/at-risk/${storeId}`).then(r => r.json())
};

export default analyticsApi;

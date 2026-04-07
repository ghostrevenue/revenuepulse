const API_BASE = '/api/analytics';

export async function getOverview() {
  const res = await fetch(`${API_BASE}/overview`);
  return res.json();
}

export async function getRfmMatrix() {
  const res = await fetch(`${API_BASE}/rfm`);
  return res.json();
}

export async function getRfmScores() {
  const res = await fetch(`${API_BASE}/rfm/scores`);
  return res.json();
}

export async function getChurnDistribution() {
  const res = await fetch(`${API_BASE}/churn`);
  return res.json();
}

export async function getChurnSummary() {
  const res = await fetch(`${API_BASE}/churn/summary`);
  return res.json();
}

export async function getAtRiskCustomers() {
  const res = await fetch(`${API_BASE}/churn/at-risk`);
  return res.json();
}

export async function getLtvDistribution() {
  const res = await fetch(`${API_BASE}/ltv/distribution`);
  return res.json();
}

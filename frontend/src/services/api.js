const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || 'This demo action could not be completed. Please try again.');
  }
  return response.json();
}

export const api = {
  getPrices: (crop, district) => request(`/markets/prices?crop=${encodeURIComponent(crop)}${district ? `&district=${encodeURIComponent(district)}` : ''}`),
  getTrend: (crop) => request(`/markets/trends?crop=${encodeURIComponent(crop)}`),
  getForecast: (crop) => request(`/markets/forecast?crop=${encodeURIComponent(crop)}`),
  getRecommendation: ({ crop, quantity, grade }) => request(`/recommendations/sell?crop=${encodeURIComponent(crop)}&quantity=${quantity}&grade=${grade}`),
  getBuyers: () => request('/buyers'),
  getLots: () => request('/lots'),
  getOffers: () => request('/offers'),
  getTransactions: () => request('/transactions'),
  getLogistics: () => request('/logistics'),
  createLot: (lot) => request('/lots', { method: 'POST', headers: { 'x-demo-role': 'farmer', 'x-demo-user-id': 'farmer-1' }, body: JSON.stringify(lot) }),
  updateLot: (id, changes) => request(`/lots/${id}`, { method: 'PATCH', headers: { 'x-demo-role': 'farmer', 'x-demo-user-id': 'farmer-1' }, body: JSON.stringify(changes) }),
  deleteLot: (id) => request(`/lots/${id}`, { method: 'DELETE', headers: { 'x-demo-role': 'farmer', 'x-demo-user-id': 'farmer-1' } }),
  acceptOffer: (id) => request(`/offers/${id}`, { method: 'PATCH', headers: { 'x-demo-role': 'farmer', 'x-demo-user-id': 'farmer-1' }, body: JSON.stringify({ status: 'accepted' }) }),
  respondToOffer: (id, status, counterPrice, message) => request(`/offers/${id}`, { method: 'PATCH', headers: { 'x-demo-role': 'farmer', 'x-demo-user-id': 'farmer-1' }, body: JSON.stringify({ status, counterPrice, message }) }),
  updateTransaction: (id, status, paymentStatus) => request(`/transactions/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, ...(paymentStatus ? { paymentStatus } : {}) }) }),
  raiseGrievance: (description) => request('/grievances', { method: 'POST', body: JSON.stringify({ category: 'Transaction support', description, raisedBy: 'farmer-1' }) }),
  resetDemo: () => request('/demo/reset', { method: 'POST' })
};

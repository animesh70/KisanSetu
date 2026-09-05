const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, { headers: { 'Content-Type': 'application/json', ...options.headers }, ...options });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || 'Request failed');
  }
  return response.json();
}

export const api = {
  getPrices: (crop, district = 'Nashik') => request(`/markets/prices?crop=${encodeURIComponent(crop)}&district=${encodeURIComponent(district)}`),
  getTrend: (crop) => request(`/markets/trends?crop=${encodeURIComponent(crop)}`),
  getForecast: (crop) => request(`/markets/forecast?crop=${encodeURIComponent(crop)}`),
  getOnlinePrices: (crop) => request(`/markets/online-prices?crop=${encodeURIComponent(crop)}`),
  getRecommendation: ({ crop, quantity, grade }) => request(`/recommendations/sell?crop=${encodeURIComponent(crop)}&quantity=${quantity}&grade=${grade}`),
  getLoanBanks: () => request('/loans/banks'),
  getLoanRecommendation: (application) => request('/loans/recommend', { method: 'POST', body: JSON.stringify(application) }),
  submitLoan: (application) => request('/loans/applications', { method: 'POST', body: JSON.stringify(application) }),
  getLoanApplication: (id) => request(`/loans/applications/${encodeURIComponent(id)}`),
  getBuyers: () => request('/buyers'),
  getLots: () => request('/lots'),
  getOffers: () => request('/offers'),
  getTransactions: () => request('/transactions'),
  getLogistics: () => request('/logistics'),
  createLot: (lot) => request('/lots', { method: 'POST', headers: { 'x-demo-role': 'farmer', 'x-demo-user-id': 'farmer-1' }, body: JSON.stringify(lot) }),
  acceptOffer: (id) => request(`/offers/${id}`, { method: 'PATCH', headers: { 'x-demo-role': 'farmer', 'x-demo-user-id': 'farmer-1' }, body: JSON.stringify({ status: 'accepted' }) }),
  updateTransaction: (id, status) => request(`/transactions/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, paymentStatus: status === 'completed' ? 'paid' : 'pending' }) }),
  raiseGrievance: (description) => request('/grievances', { method: 'POST', body: JSON.stringify({ category: 'Transaction support', description, raisedBy: 'farmer-1' }) }),
  resetDemo: () => request('/demo/reset', { method: 'POST' })
};

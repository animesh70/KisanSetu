const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, { headers: { 'Content-Type': 'application/json', ...options.headers }, ...options });
  if (!response.ok) throw new Error('Unable to load live data');
  return response.json();
}

export const api = {
  getPrices: (crop, district = 'Nashik') => request(`/markets/prices?crop=${encodeURIComponent(crop)}&district=${encodeURIComponent(district)}`),
  getTrend: (crop) => request(`/markets/trends?crop=${encodeURIComponent(crop)}`),
  getForecast: (crop) => request(`/markets/forecast?crop=${encodeURIComponent(crop)}`),
  getRecommendation: ({ crop, quantity, grade }) => request(`/recommendations/sell?crop=${encodeURIComponent(crop)}&quantity=${quantity}&grade=${grade}`),
  getBuyers: () => request('/buyers'),
  getLots: () => request('/lots'),
  createLot: (lot) => request('/lots', { method: 'POST', headers: { 'x-demo-role': 'farmer', 'x-demo-user-id': 'farmer-1' }, body: JSON.stringify(lot) })
};

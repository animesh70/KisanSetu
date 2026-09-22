const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const hasRawBody = options.body instanceof Blob || options.body instanceof ArrayBuffer;
  const headers = { ...(!isFormData && !hasRawBody ? { 'Content-Type': 'application/json' } : {}), ...options.headers };
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = typeof payload.message === 'string' ? payload.message : typeof payload.error === 'string' ? payload.error : typeof payload.error?.message === 'string' ? payload.error.message : null;
    throw new Error(message || 'This demo action could not be completed. Please try again.');
  }
  return response.json();
}

async function requestAudio(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = typeof payload.error?.message === 'string' ? payload.error.message : typeof payload.message === 'string' ? payload.message : 'Speech playback is temporarily unavailable.';
    const error = new Error(message);
    error.code = payload.error?.code || 'TTS_REQUEST_FAILED';
    error.status = response.status;
    throw error;
  }
  const audio = await response.blob();
  if (!audio.size || !audio.type.toLowerCase().startsWith('audio/')) throw new Error('INVALID_AUDIO_RESPONSE');
  return audio;
}

function equipmentHeaders(demoUserId = 'farmer-1', includeRole = false) {
  return {
    'x-demo-user-id': demoUserId,
    ...(includeRole ? { 'x-demo-role': 'farmer' } : {})
  };
}

export const api = {
  getPrices: (crop, district, quantity) => request(`/markets/prices?crop=${encodeURIComponent(crop)}${district ? `&district=${encodeURIComponent(district)}` : ''}${quantity !== undefined && quantity !== '' ? `&quantity=${encodeURIComponent(quantity)}` : ''}`),
  getTrend: (crop) => request(`/markets/trends?crop=${encodeURIComponent(crop)}`),
  getForecast: (crop) => request(`/markets/forecast?crop=${encodeURIComponent(crop)}`),
  getAdvisorPrice: (crop, days = 7) => request(`/advisor/price?crop=${encodeURIComponent(crop)}&days=${encodeURIComponent(days)}`),
  analyzeCropImage: (file, crop) => request(`/advisor/disease?crop=${encodeURIComponent(crop || 'crop')}`, {
    method: 'POST',
    headers: { 'Content-Type': file.type || 'application/octet-stream', 'x-file-name': encodeURIComponent(file.name || 'crop-image') },
    body: file
  }),
  synthesizeSpeech: (text, language, signal) => requestAudio('/tts', { method: 'POST', body: JSON.stringify({ text, language }), signal }),
  getRecommendation: ({ crop, quantity, grade }) => request(`/recommendations/sell?crop=${encodeURIComponent(crop)}&quantity=${quantity}&grade=${grade}`),
  getBuyers: (crop) => request(`/buyers${crop ? `?crop=${encodeURIComponent(crop)}` : ''}`),
  getLots: () => request('/lots'),
  getOffers: () => request('/offers'),
  getTransactions: () => request('/transactions'),
  getLogistics: () => request('/logistics'),
  createLot: (lot) => request('/lots', { method: 'POST', headers: { 'x-demo-role': 'farmer', 'x-demo-user-id': 'farmer-1' }, body: JSON.stringify(lot) }),
  updateLot: (id, changes) => request(`/lots/${id}`, { method: 'PATCH', headers: { 'x-demo-role': 'farmer', 'x-demo-user-id': 'farmer-1' }, body: JSON.stringify(changes) }),
  deleteLot: (id) => request(`/lots/${id}`, { method: 'DELETE', headers: { 'x-demo-role': 'farmer', 'x-demo-user-id': 'farmer-1' } }),
  getSharedLogistics: (id, radiusKm = 15) => request(`/lots/${encodeURIComponent(id)}/shared-logistics?radiusKm=${encodeURIComponent(radiusKm)}`),


  getMarketplaceListings: () => request('/marketplace/listings'),
  getMarketplacePurchases: (buyerId = 'buyer-1') => request('/marketplace/purchases', { headers: { 'x-demo-role': 'buyer', 'x-demo-user-id': buyerId } }),
  checkoutMarketplaceListing: (lotId, quantity, buyerId = 'buyer-1') => request(`/marketplace/listings/${encodeURIComponent(lotId)}/checkout`, { method: 'POST', headers: { 'x-demo-role': 'buyer', 'x-demo-user-id': buyerId }, body: JSON.stringify({ quantity }) }),
  verifyMarketplacePayment: (payload, buyerId = 'buyer-1') => request('/escrow/razorpay/verify', { method: 'POST', headers: { 'x-demo-role': 'buyer', 'x-demo-user-id': buyerId }, body: JSON.stringify(payload) }),
  getEscrowPaymentSession: (transactionId, buyerId = 'buyer-1') => request(`/escrow/transactions/${encodeURIComponent(transactionId)}/payment-session`, { headers: { 'x-demo-role': 'buyer', 'x-demo-user-id': buyerId } }),
  getDeliveryOtp: (transactionId, buyerId = 'buyer-1') => request(`/escrow/transactions/${encodeURIComponent(transactionId)}/delivery-otp`, { headers: { 'x-demo-role': 'buyer', 'x-demo-user-id': buyerId } }),
  verifyEscrowDelivery: (transactionId, otp, qualityAccepted, buyerId = 'buyer-1') => request(`/escrow/transactions/${encodeURIComponent(transactionId)}/verify-delivery`, { method: 'POST', headers: { 'x-demo-role': 'buyer', 'x-demo-user-id': buyerId }, body: JSON.stringify({ otp, qualityAccepted }) }),

  getEquipment: (filters = {}, demoUserId = 'farmer-1') => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) if (value !== undefined && value !== null && value !== '') params.set(key, value);
    return request(`/equipment${params.toString() ? `?${params.toString()}` : ''}`, { headers: equipmentHeaders(demoUserId) });
  },
  createEquipment: (equipment, demoUserId = 'farmer-1') => request('/equipment', { method: 'POST', headers: equipmentHeaders(demoUserId, true), body: JSON.stringify(equipment) }),
  deleteEquipment: (id, demoUserId = 'farmer-1') => request(`/equipment/${encodeURIComponent(id)}`, { method: 'DELETE', headers: equipmentHeaders(demoUserId, true) }),
  rentEquipment: (id, rental, demoUserId = 'farmer-1') => request(`/equipment/${encodeURIComponent(id)}/rent`, { method: 'POST', headers: equipmentHeaders(demoUserId, true), body: JSON.stringify(rental) }),
  getEquipmentRentals: (demoUserId = 'farmer-1') => request('/equipment/rentals/mine', { headers: equipmentHeaders(demoUserId, true) }),
  updateEquipmentRental: (id, status, demoUserId = 'farmer-1') => request(`/equipment/rentals/${encodeURIComponent(id)}/status`, { method: 'PATCH', headers: equipmentHeaders(demoUserId, true), body: JSON.stringify({ status }) }),
  acceptOffer: (id, logisticsOptionId) => request(`/offers/${id}`, { method: 'PATCH', headers: { 'x-demo-role': 'farmer', 'x-demo-user-id': 'farmer-1' }, body: JSON.stringify({ status: 'accepted', logisticsOptionId }) }),
  respondToOffer: (id, status, counterPrice, message) => request(`/offers/${id}`, { method: 'PATCH', headers: { 'x-demo-role': 'farmer', 'x-demo-user-id': 'farmer-1' }, body: JSON.stringify({ status, counterPrice, message }) }),
  updateTransaction: (id, status, paymentStatus) => request(`/transactions/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, ...(paymentStatus ? { paymentStatus } : {}) }) }),
  selectTransactionLogistics: (id, logisticsOptionId) => request(`/transactions/${id}/logistics`, { method: 'PATCH', headers: { 'x-demo-role': 'farmer', 'x-demo-user-id': 'farmer-1' }, body: JSON.stringify({ logisticsOptionId }) }),
  getTransactionRoutes: (id) => request(`/transactions/${encodeURIComponent(id)}/routes`),
  raiseGrievance: (description) => request('/grievances', { method: 'POST', body: JSON.stringify({ category: 'Transaction support', description, raisedBy: 'farmer-1' }) }),
  resetDemo: () => request('/demo/reset', { method: 'POST' })
};

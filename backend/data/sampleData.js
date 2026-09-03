export const users = [
  { id: 'farmer-1', name: 'Sanjay Patil', phone: '9876543210', role: 'farmer', location: { district: 'Nashik', state: 'Maharashtra' } },
  { id: 'buyer-1', name: 'FreshMart Foods', role: 'buyer', location: { district: 'Pune', state: 'Maharashtra' } }
];

export const mandiPrices = [
  { id: 'price-1', crop: 'Onion', mandiName: 'Lasalgaon APMC', district: 'Nashik', state: 'Maharashtra', date: '2026-09-02', minPrice: 2100, modalPrice: 2450, maxPrice: 2800, unit: 'quintal', distanceKm: 28 },
  { id: 'price-2', crop: 'Onion', mandiName: 'Pimpalgaon Baswant APMC', district: 'Nashik', state: 'Maharashtra', date: '2026-09-02', minPrice: 2200, modalPrice: 2520, maxPrice: 2900, unit: 'quintal', distanceKm: 42 },
  { id: 'price-3', crop: 'Onion', mandiName: 'Pune APMC', district: 'Pune', state: 'Maharashtra', date: '2026-09-02', minPrice: 2380, modalPrice: 2620, maxPrice: 3000, unit: 'quintal', distanceKm: 185 },
  { id: 'price-4', crop: 'Tomato', mandiName: 'Nashik APMC', district: 'Nashik', state: 'Maharashtra', date: '2026-09-02', minPrice: 1600, modalPrice: 1900, maxPrice: 2300, unit: 'quintal', distanceKm: 20 },
  { id: 'price-5', crop: 'Soybean', mandiName: 'Akola APMC', district: 'Akola', state: 'Maharashtra', date: '2026-09-02', minPrice: 4100, modalPrice: 4350, maxPrice: 4600, unit: 'quintal', distanceKm: 310 }
];

export const trendByCrop = {
  Onion: [2200, 2250, 2300, 2280, 2350, 2400, 2450],
  Tomato: [1750, 1810, 1700, 1780, 1840, 1880, 1900],
  Soybean: [4210, 4250, 4190, 4280, 4300, 4320, 4350]
};

export const buyers = [
  { id: 'buyer-1', companyName: 'FreshMart Foods', contactName: 'Riya Shah', verified: true, reliabilityScore: 4.8, location: 'Pune', crops: ['Onion', 'Tomato'], requiredGrade: 'A', requiredQuantity: 120, targetPrice: 2700, serviceArea: ['Nashik', 'Pune'] },
  { id: 'buyer-2', companyName: 'MahaAgro Exports', contactName: 'Amit Kulkarni', verified: true, reliabilityScore: 4.6, location: 'Nashik', crops: ['Onion'], requiredGrade: 'A', requiredQuantity: 80, targetPrice: 2650, serviceArea: ['Nashik'] },
  { id: 'buyer-3', companyName: 'Green Basket Retail', contactName: 'Neha Joshi', verified: true, reliabilityScore: 4.5, location: 'Mumbai', crops: ['Onion', 'Tomato'], requiredGrade: 'B', requiredQuantity: 50, targetPrice: 2550, serviceArea: ['Nashik', 'Mumbai'] }
];

export const cropLots = [
  { id: 'lot-1', farmerId: 'farmer-1', crop: 'Onion', variety: 'Red Onion', quantity: 100, unit: 'quintal', grade: 'A', askingPrice: 2600, location: 'Niphad, Nashik', harvestDate: '2026-09-01', status: 'open' }
];

export const offers = [
  { id: 'offer-1', lotId: 'lot-1', buyerId: 'buyer-1', farmerId: 'farmer-1', pricePerUnit: 2680, quantity: 100, message: 'Pickup available within 24 hours.', status: 'pending', createdAt: '2026-09-02T09:30:00.000Z' }
];

export const transactions = [];

export const logisticsOptions = [
  { id: 'logistics-1', provider: 'Kisan Haul', type: 'Transport', serviceArea: ['Nashik', 'Pune'], capacity: 150, ratePerKm: 12, contact: '9822001100', available: true },
  { id: 'storage-1', provider: 'Nashik Cold Store', type: 'Storage', serviceArea: ['Nashik'], capacity: 300, ratePerDay: 18, contact: '9822002200', available: true }
];

export const grievances = [];

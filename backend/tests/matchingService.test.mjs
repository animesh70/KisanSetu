import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSellingRecommendation, getMatches, transportPerQuintal } from '../services/matchingService.js';
import { calculateStorageQuote, calculateTransportQuote } from '../services/logisticsService.js';
import { getTradableQuantity, parseQuantity } from '../services/quantityService.js';

test('matching only returns buyers that purchase the requested crop', () => {
  const tomatoBuyers = getMatches({ crop: 'Tomato', quantity: 100, grade: 'A' });
  assert.ok(tomatoBuyers.length > 0);
  assert.ok(tomatoBuyers.every((buyer) => buyer.crops.includes('Tomato')));
  assert.ok(!tomatoBuyers.some((buyer) => buyer.companyName === 'MahaAgro Exports'));
});

test('each seeded crop has an eligible verified buyer', () => {
  assert.equal(getMatches({ crop: 'Soybean', quantity: 100, grade: 'A' })[0].companyName, 'Deccan Oil Mills');
});

test('quantity validation rejects invalid and unrealistic values', () => {
  for (const quantity of [-1, 0, 1.5, 5001, 'not-a-number']) assert.throws(() => parseQuantity(quantity));
  assert.equal(parseQuantity(5000), 5000);
});

test('transport is capacity-aware and uses the actual distance', () => {
  const quote = calculateTransportQuote({ quantity: 100, distanceKm: 32, capacity: 60, ratePerKm: 12 });
  assert.equal(quote.trips, 2);
  assert.equal(quote.totalCost, 768);
  assert.equal(quote.costPerQuintal, 7.68);
  assert.equal(transportPerQuintal(185, 100), 22.2);
});

test('partial buyer demand exposes tradable and remaining quantities', () => {
  const match = getMatches({ crop: 'Onion', quantity: 100, grade: 'A' }, {
    buyerData: [{ id: 'buyer-small', companyName: 'Small Buyer', verified: true, crops: ['Onion'], requiredGrade: 'A', requiredQuantity: 50, targetPrice: 2600, distanceKm: 32, reliabilityScore: 4 }]
  })[0];
  assert.equal(match.tradableQuantity, 50);
  assert.equal(match.remainingQuantity, 50);
  assert.equal(match.estimatedGrossAmount, 130000);
  assert.equal(match.estimatedLogisticsTotal, 384);
  assert.equal(match.estimatedNetAmount, 129616);
  assert.equal(getTradableQuantity({ lotQuantity: 50, buyerRequiredQuantity: 120 }).remainingQuantity, 0);
});

test('a partial buyer cannot become the full-lot payout recommendation', () => {
  const logisticsData = [{ id: 'transport', provider: 'Demo Haul', type: 'Transport', available: true, capacity: 100, ratePerKm: 1 }, { id: 'storage', provider: 'Demo Store', type: 'Storage', available: true, ratePerDay: 1 }];
  const recommendation = buildSellingRecommendation({
    crop: 'Onion',
    quantity: 100,
    grade: 'A',
    buyerData: [{ id: 'buyer-small', companyName: 'Small Buyer', verified: true, crops: ['Onion'], requiredGrade: 'A', requiredQuantity: 50, targetPrice: 3000, distanceKm: 10, reliabilityScore: 5 }],
    marketData: [{ id: 'market', crop: 'Onion', mandiName: 'Full Lot Mandi', modalPrice: 2500, distanceKm: 10 }],
    logisticsData,
    forecast: { currentPrice: 2500, forecast: [{ predictedPrice: 2500 }] }
  });
  assert.equal(recommendation.recommendedBuyer.tradableQuantity, 50);
  assert.equal(recommendation.recommendedBuyer.remainingQuantity, 50);
  assert.equal(recommendation.sellNowOption.type, 'mandi');
  assert.equal(recommendation.sellNowOption.tradableQuantity, 100);
});

test('sell/hold comparison includes storage cost and forecast uncertainty', () => {
  const logisticsData = [
    { id: 'transport', provider: 'Demo Haul', type: 'Transport', available: true, capacity: 100, ratePerKm: 1 },
    { id: 'storage', provider: 'Demo Store', type: 'Storage', available: true, ratePerDay: 1 }
  ];
  const marketData = [{ id: 'market', crop: 'Onion', mandiName: 'Demo Mandi', modalPrice: 2500, distanceKm: 10 }];
  const hold = buildSellingRecommendation({ crop: 'Onion', quantity: 100, grade: 'A', marketData, buyerData: [], logisticsData, forecast: { currentPrice: 2500, validationMAE: 10, forecast: [{ predictedPrice: 2520 }, { predictedPrice: 2600 }] } });
  assert.equal(hold.action, 'hold');
  assert.equal(hold.sellNowNetPrice, 2499.9);
  assert.equal(hold.bestHoldNetPrice, 2597.9);
  assert.equal(hold.netAdvantage, 98);

  const storageRemovesGain = buildSellingRecommendation({ crop: 'Onion', quantity: 100, grade: 'A', marketData, buyerData: [], logisticsData, forecast: { currentPrice: 2500, validationMAE: 10, forecast: [{ predictedPrice: 2520 }] } });
  assert.equal(storageRemovesGain.action, 'sell');

  const uncertaintyBlocksHold = buildSellingRecommendation({ crop: 'Onion', quantity: 100, grade: 'A', marketData, buyerData: [], logisticsData, forecast: { currentPrice: 2500, validationMAE: 70, forecast: [{ predictedPrice: 2550 }] } });
  assert.equal(uncertaintyBlocksHold.action, 'sell');
  assert.equal(calculateStorageQuote({ quantity: 100, ratePerDay: 18, holdingDays: 2 }).totalCost, 3600);
});

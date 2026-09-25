import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildSharedLogisticsGroup,
  calculateSharedTransportQuote,
  haversineDistanceKm
} from '../services/logisticsService.js';
import {
  findNearbyLots,
  normalizePickupPoint,
  parseSharedRadiusKm,
  upsertLotGeo
} from '../repositories/lotGeoRepository.js';

const transport = { id: 'transport-test', type: 'Transport', provider: 'Test Haul', capacity: 150, ratePerKm: 12, available: true };
const largeTransport = { id: 'transport-large', type: 'Transport', provider: 'Test Haul XL', capacity: 300, ratePerKm: 15, available: true };
const source = {
  id: 'lot-a', farmerId: 'farmer-a', crop: 'Onion', quantity: 80, status: 'open', location: 'Village A',
  pickupPoint: { type: 'Point', coordinates: [74.08, 20.08] }, destinationMandiId: 'mandi-lasalgaon-apmc-nashik-maharashtra', destinationMandiName: 'Lasalgaon APMC', destinationDistanceKm: 28
};
const nearby = {
  id: 'lot-b', lotId: 'lot-b', farmerId: 'farmer-b', crop: 'Tomato', quantity: 60, status: 'open', location: 'Village B', locationText: 'Village B',
  pickupPoint: { type: 'Point', coordinates: [74.12, 20.10] }, destinationMandiId: 'mandi-lasalgaon-apmc-nashik-maharashtra', destinationMandiName: 'Lasalgaon APMC', destinationDistanceKm: 30
};

test('normalizes GeoJSON Point in longitude, latitude order and rejects invalid coordinates', () => {
  assert.deepEqual(normalizePickupPoint({ type: 'Point', coordinates: [74.08, 20.08] }), { type: 'Point', coordinates: [74.08, 20.08] });
  assert.equal(normalizePickupPoint({ type: 'Point', coordinates: [181, 20] }), null);
  assert.equal(normalizePickupPoint({ type: 'Point', coordinates: [74, 91] }), null);
  assert.equal(normalizePickupPoint({ type: 'Point', coordinates: ['x', 20] }), null);
});

test('shared radius defaults to 15 km and is safely capped', () => {
  assert.equal(parseSharedRadiusKm('', 15), 15);
  assert.equal(parseSharedRadiusKm(12, 15), 12);
  assert.equal(parseSharedRadiusKm(500, 15), 50);
  assert.equal(parseSharedRadiusKm(-1, 15), null);
});

test('haversine distance handles nearby GeoJSON pickup points', () => {
  const distance = haversineDistanceKm(source.pickupPoint, nearby.pickupPoint);
  assert.ok(distance > 4 && distance < 6);
});

test('shared transport combines lots and can reduce estimated freight', () => {
  const quote = calculateSharedTransportQuote({ requestingLot: source, nearbyLots: [nearby], logisticsOption: transport });
  assert.equal(quote.lotCount, 2);
  assert.equal(quote.totalQuantity, 140);
  assert.equal(quote.soloTrips, 2);
  assert.equal(quote.sharedTrips, 1);
  assert.equal(quote.shareRecommended, true);
  assert.ok(quote.estimatedSavings > 0);
  assert.ok(quote.requestingLotSavings > 0);
});

test('shared transport uses multiple trips when pooled quantity exceeds capacity', () => {
  const quote = buildSharedLogisticsGroup({
    requestingLot: { ...source, quantity: 160 },
    nearbyLots: [{ ...nearby, quantity: 50 }],
    logisticsOption: transport
  });
  assert.equal(quote.totalQuantity, 210);
  assert.equal(quote.sharedTrips, 2);
});

test('one lot alone is not recommended for shared freight', () => {
  const quote = calculateSharedTransportQuote({ requestingLot: source, nearbyLots: [], logisticsOption: transport });
  assert.equal(quote.shareRecommended, false);
  assert.equal(quote.reason, 'NO_NEARBY_LOTS');
  assert.equal(quote.estimatedSavings, 0);
});

test('100 + 100 selects a cheaper 300 q vehicle using actual trip costs', () => {
  const quote = buildSharedLogisticsGroup({ requestingLot: { ...source, quantity: 100 },
    nearbyLots: [{ ...nearby, quantity: 100 }], logisticsOptions: [transport, largeTransport] });
  assert.equal(quote.transportProvider, 'Test Haul XL');
  assert.equal(quote.vehicleCapacity, 300);
  assert.equal(quote.sharedTrips, 1);
  assert.equal(quote.estimatedSoloCost, 12 * (28 + 30));
  assert.equal(quote.estimatedSharedCost, quote.tripGroups[0].cost);
  assert.equal(quote.estimatedSavings, Math.round((quote.estimatedSoloCost - quote.estimatedSharedCost) * 100) / 100);
  assert.ok(quote.estimatedSavings > 0 && quote.requestingLotSavings > 0);
  assert.equal(quote.shareRecommended, true);
});

test('150 q truck never carries 200 q in one trip', () => {
  const quote = calculateSharedTransportQuote({ requestingLot: { ...source, quantity: 100 },
    nearbyLots: [{ ...nearby, quantity: 100 }], logisticsOptions: [transport] });
  assert.equal(quote.sharedTrips, 2);
  assert.ok(quote.tripGroups.every((group) => group.totalQuantity <= 150));
  assert.equal(quote.shareRecommended, false);
  assert.equal(quote.estimatedSavings, 0);
});

test('four 150 q lots form two capacity-safe 300 q trips', () => {
  const lots = [source, nearby, { ...nearby, id: 'lot-c', lotId: 'lot-c' },
    { ...nearby, id: 'lot-d', lotId: 'lot-d' }].map((lot) => ({ ...lot, quantity: 150 }));
  const quote = buildSharedLogisticsGroup({ requestingLot: lots[0], nearbyLots: lots.slice(1),
    logisticsOptions: [largeTransport] });
  assert.equal(quote.sharedTrips, 2);
  assert.deepEqual(quote.tripGroups.map((group) => group.totalQuantity), [300, 300]);
  assert.ok(quote.tripGroups.every((group) => group.totalQuantity <= group.capacity));
});

test('unavailable transport and storage are excluded; uneconomic sharing is truthful', () => {
  const expensive = { ...largeTransport, ratePerKm: 40 };
  const quote = buildSharedLogisticsGroup({ requestingLot: { ...source, quantity: 100 },
    nearbyLots: [{ ...nearby, quantity: 100 }], logisticsOptions: [
      { ...largeTransport, available: false, ratePerKm: 1 },
      { ...largeTransport, type: 'Storage', ratePerKm: 1 },
      transport, expensive
    ] });
  assert.equal(quote.transportProvider, transport.provider);
  assert.equal(quote.shareRecommended, false);
  assert.equal(quote.estimatedSavings, 0);
  assert.equal(quote.requestingLotSavings, 0);
});

test('Mongo geo upsert creates 2dsphere and destination/status indexes without leaking public concerns', async () => {
  const calls = { indexes: [], update: null };
  const collection = {
    async createIndex(spec, options) { calls.indexes.push({ spec, options }); },
    async updateOne(filter, update, options) { calls.update = { filter, update, options }; return { acknowledged: true }; }
  };
  await upsertLotGeo(source, { collection });
  assert.deepEqual(calls.indexes[0].spec, { pickupPoint: '2dsphere' });
  assert.deepEqual(calls.indexes[1].spec, { destinationMandiId: 1, status: 1 });
  assert.deepEqual(calls.update.update.$set.pickupPoint.coordinates, [74.08, 20.08]);
  assert.equal(calls.update.options.upsert, true);
});

test('Mongo nearby lookup uses $near, same mandi, open status, excludes source lot, and 15 km in meters', async () => {
  let receivedQuery;
  let receivedLimit;
  const collection = {
    async createIndex() {},
    find(query) {
      receivedQuery = query;
      return {
        limit(value) {
          receivedLimit = value;
          return { async toArray() { return [nearby]; } };
        }
      };
    }
  };
  const results = await findNearbyLots({
    lotId: source.id,
    pickupPoint: source.pickupPoint,
    destinationMandiId: source.destinationMandiId,
    radiusMeters: 15000,
    maxResults: 20,
    collection
  });
  assert.equal(results.length, 1);
  assert.deepEqual(receivedQuery._id, { $ne: 'lot-a' });
  assert.equal(receivedQuery.status, 'open');
  assert.equal(receivedQuery.destinationMandiId, 'mandi-lasalgaon-apmc-nashik-maharashtra');
  assert.deepEqual(receivedQuery.pickupPoint.$near.$geometry, source.pickupPoint);
  assert.equal(receivedQuery.pickupPoint.$near.$maxDistance, 15000);
  assert.equal(receivedLimit, 20);
});

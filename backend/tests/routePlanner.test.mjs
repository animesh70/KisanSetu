import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTransactionRoutes, getTransactionRouteContext, pointForLocation } from '../services/routeService.js';

const point = (lon, lat) => ({ type: 'Point', coordinates: [lon, lat] });

function transaction(id, quantity = 150) {
  return {
    id,
    status: 'confirmed',
    crop: 'Onion',
    quantity,
    buyerId: 'same-buyer',
    buyerName: 'FreshMart Foods',
    buyerDistanceKm: 185,
    pickupLocation: 'Niphad, Nashik',
    pickupPoint: point(74.08, 20.08),
    destinationLocation: 'Pune',
    destinationPoint: point(73.8567, 18.5204),
    createdAt: `2026-09-21T09:00:0${id.at(-1)}.000Z`
  };
}

test('route planner returns every OSRM alternative and highlights the shortest', async () => {
  const tx = transaction('tx-1', 100);
  const fetchImpl = async () => ({
    ok: true,
    json: async () => ({
      routes: [
        { distance: 190000, duration: 14400, geometry: { coordinates: [[74.08, 20.08], [73.9, 19.3], [73.8567, 18.5204]] } },
        { distance: 176000, duration: 13800, geometry: { coordinates: [[74.08, 20.08], [73.85, 19.2], [73.8567, 18.5204]] } },
        { distance: 183000, duration: 13200, geometry: { coordinates: [[74.08, 20.08], [73.95, 19.1], [73.8567, 18.5204]] } }
      ]
    })
  });
  const result = await calculateTransactionRoutes(tx, { fetchImpl });
  assert.equal(result.routes.length, 3);
  assert.equal(result.routes[0].distanceKm, 176);
  assert.equal(result.routes[0].isBest, true);
  assert.equal(result.bestRouteId, result.routes[0].id);
});

test('route planner fallback provides a best route and two distinct alternatives', async () => {
  const result = await calculateTransactionRoutes(transaction('tx-fallback', 100), {
    fetchImpl: async () => { throw new Error('routing provider unavailable'); }
  });

  assert.equal(result.routes.length, 3);
  assert.equal(result.routes[0].isBest, true);
  assert.equal(result.routes[1].isBest, false);
  assert.equal(result.routes[2].isBest, false);
  assert.equal(result.routes.every((route) => route.source === 'estimated'), true);
  assert.equal(new Set(result.routes.map((route) => JSON.stringify(route.coordinates))).size, 3);
  assert.ok(result.routes[1].distanceKm > result.routes[0].distanceKm);
  assert.ok(result.routes[2].distanceKm > result.routes[1].distanceKm);
});

test('a specific pickup place is not collapsed into its broader district', () => {
  assert.deepEqual(pointForLocation('Niphad, Nashik'), point(74.08, 20.08));
  assert.deepEqual(pointForLocation('Nashik'), point(73.7898, 19.9975));

  const context = getTransactionRouteContext({
    id: 'tx-location-fallback',
    farmerId: 'farmer-1',
    buyerId: 'buyer-2',
    pickupLocation: 'Niphad, Nashik',
    destinationLocation: 'Nashik'
  });
  assert.deepEqual(context.pickupPoint, point(74.08, 20.08));
  assert.deepEqual(context.destinationPoint, point(73.7898, 19.9975));
  assert.notDeepEqual(context.pickupPoint, context.destinationPoint);
});

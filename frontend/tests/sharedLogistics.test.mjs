import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPickupPoint, canUseSharedLogistics, sharedLogisticsStatusKey } from '../src/services/sharedLogistics.js';

test('buildPickupPoint stores GeoJSON coordinates longitude first', () => {
  const point = buildPickupPoint({ coords: { latitude: 20.08, longitude: 74.08 } });
  assert.deepEqual(point, { type: 'Point', coordinates: [74.08, 20.08] });
});

test('buildPickupPoint rejects invalid coordinates', () => {
  assert.throws(() => buildPickupPoint({ coords: { latitude: 95, longitude: 74 } }));
  assert.throws(() => buildPickupPoint({ coords: { latitude: 20, longitude: 200 } }));
});

test('shared logistics action is only available for open geo-enabled lots', () => {
  assert.equal(canUseSharedLogistics({ status: 'open', sharedLogisticsReady: true, destinationMandiId: 'price-1' }), true);
  assert.equal(canUseSharedLogistics({ status: 'closed', sharedLogisticsReady: true, destinationMandiId: 'price-1' }), false);
  assert.equal(canUseSharedLogistics({ status: 'open', sharedLogisticsReady: false, destinationMandiId: 'price-1' }), false);
});

test('shared logistics status maps safe API states', () => {
  assert.equal(sharedLogisticsStatusKey({ eligible: true, nearbyLotCount: 2, group: { shareRecommended: true } }), 'available');
  assert.equal(sharedLogisticsStatusKey({ eligible: true, nearbyLotCount: 0 }), 'noNearby');
  assert.equal(sharedLogisticsStatusKey({ eligible: true, nearbyLotCount: 2, group: { shareRecommended: false } }), 'notRecommended');
  assert.equal(sharedLogisticsStatusKey({ eligible: false, reason: 'MISSING_GEO_DATA' }), 'missingGeo');
});

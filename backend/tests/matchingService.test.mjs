import assert from 'node:assert/strict';
import test from 'node:test';
import { getMatches, transportPerQuintal } from '../services/matchingService.js';
import { parseQuantity } from '../services/quantityService.js';

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

test('transport per quintal does not vanish as lot quantity grows', () => {
  assert.equal(transportPerQuintal(185), 83);
  assert.equal(transportPerQuintal(185), 83);
});

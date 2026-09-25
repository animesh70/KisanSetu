import test from 'node:test';
import assert from 'node:assert/strict';
import { cropLots, offers, resetDemoData, transactions } from '../data/sampleData.js';
import { assertAvailableQuantity, consumeLotInventory, withLotInventoryLock } from '../services/lotInventoryService.js';
import { createMarketplaceCheckout, getMarketplaceListings } from '../services/marketplaceService.js';

process.env.ESCROW_PROVIDER = 'demo';

test('partial accepted quantity leaves only the unsold stock and rejects stale offers', async () => {
  resetDemoData();
  const lot = cropLots[0];
  offers.push({ id: 'offer-stale', lotId: lot.id, quantity: 80, status: 'pending' });
  assert.equal(assertAvailableQuantity(lot, 80), 20);
  await consumeLotInventory(lot, 80, offers);
  assert.equal(lot.quantity, 20);
  assert.equal(lot.status, 'open');
  assert.equal(offers.find((offer) => offer.id === 'offer-stale').status, 'rejected');
  assert.throws(() => assertAvailableQuantity(lot, 80), { status: 409 });
  resetDemoData();
});

test('full accepted quantity closes lot and blocks another sale', async () => {
  resetDemoData();
  const lot = cropLots[0];
  await consumeLotInventory(lot, 100, offers);
  assert.equal(lot.quantity, 0);
  assert.equal(lot.status, 'closed');
  assert.equal(getMarketplaceListings().some((item) => item.id === lot.id), false);
  assert.throws(() => assertAvailableQuantity(lot, 100), { status: 409 });
  resetDemoData();
});

test('parallel marketplace checkouts cannot oversell a 100 q lot', async () => {
  resetDemoData();
  const lot = cropLots[0];
  const results = await Promise.allSettled([
    createMarketplaceCheckout({ lotId: lot.id, buyerId: 'buyer-1', quantity: 80 }),
    createMarketplaceCheckout({ lotId: lot.id, buyerId: 'buyer-1', quantity: 80 })
  ]);
  assert.equal(results.filter((item) => item.status === 'fulfilled').length, 1);
  assert.equal(results.filter((item) => item.status === 'rejected').length, 1);
  const sale = results.find((item) => item.status === 'fulfilled').value.transaction;
  assert.equal(sale.quantity, 80);
  assert.equal(sale.amount, lot.askingPrice * 80);
  assert.equal(sale.remainingQuantity, 20);
  assert.equal(lot.quantity, 20);
  assert.equal(transactions.filter((item) => item.lotId === lot.id).length, 1);
  resetDemoData();
});

test('remaining 20 q can be purchased after an 80 q marketplace checkout', async () => {
  resetDemoData();
  const lot = cropLots[0];
  const first = await createMarketplaceCheckout({ lotId: lot.id, buyerId: 'buyer-1', quantity: 80 });
  const second = await createMarketplaceCheckout({ lotId: lot.id, buyerId: 'buyer-1', quantity: 20 });
  assert.equal(first.transaction.remainingQuantity, 20);
  assert.equal(second.transaction.quantity, 20);
  assert.equal(second.transaction.amount, 20 * lot.askingPrice);
  assert.equal(second.transaction.remainingQuantity, 0);
  assert.equal(lot.quantity, 0);
  assert.equal(lot.status, 'closed');
  resetDemoData();
});

test('per-lot lock serializes acceptance and marketplace operations', async () => {
  const order = [];
  await Promise.all([
    withLotInventoryLock('lot-lock-test', async () => {
      order.push('first-start');
      await new Promise((resolve) => setTimeout(resolve, 10));
      order.push('first-end');
    }),
    withLotInventoryLock('lot-lock-test', async () => { order.push('second'); })
  ]);
  assert.deepEqual(order, ['first-start', 'first-end', 'second']);
});

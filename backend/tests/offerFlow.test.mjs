import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { cropLots, offers, resetDemoData, transactions } from '../data/sampleData.js';
import lotRoutes from '../routes/lotRoutes.js';
import offerRoutes from '../routes/offerRoutes.js';
import matchRoutes from '../routes/matchRoutes.js';
import { createMarketplaceCheckout, getMarketplaceListings } from '../services/marketplaceService.js';

process.env.ESCROW_PROVIDER = 'demo';

async function withApi(run) {
  const app = express();
  app.use(express.json());
  app.use('/lots', lotRoutes);
  app.use('/offers', offerRoutes);
  app.use('/matches', matchRoutes);
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  try { return await run(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise((resolve) => server.close(resolve)); }
}

const farmerHeaders = { 'content-type': 'application/json', 'x-demo-role': 'farmer', 'x-demo-user-id': 'farmer-1' };

test('new 100 q Onion lot auto-offers a full-lot buyer and exposes separate lot/offer quantities', async () => {
  resetDemoData();
  await withApi(async (base) => {
    const response = await fetch(`${base}/lots`, { method: 'POST', headers: farmerHeaders,
      body: JSON.stringify({ crop: 'Onion', quantity: 100, grade: 'A', askingPrice: 2600, location: 'Nashik' }) });
    assert.equal(response.status, 201);
    const { lot, generatedOffer } = await response.json();
    assert.equal(lot.quantity, 100);
    assert.equal(generatedOffer.quantity, 100);
    assert.equal(generatedOffer.remainingQuantity, 0);
    assert.equal(generatedOffer.lotId, lot.id);
    assert.equal(generatedOffer.buyerId, 'buyer-1');
  });
  resetDemoData();
});

test('accepting an 80 q offer trades 80 q, leaves 20 q, and cannot accept a stale full offer', async () => {
  resetDemoData();
  const lot = cropLots[0];
  offers.push({ id: 'offer-partial-test', lotId: lot.id, buyerId: 'buyer-2', farmerId: lot.farmerId,
    pricePerUnit: 2650, quantity: 80, status: 'pending' });
  await withApi(async (base) => {
    const accepted = await fetch(`${base}/offers/offer-partial-test`, { method: 'PATCH', headers: farmerHeaders,
      body: JSON.stringify({ status: 'accepted' }) });
    assert.equal(accepted.status, 200);
    assert.equal(lot.quantity, 20);
    assert.equal(lot.status, 'open');
    const transaction = transactions.find((item) => item.acceptedOfferId === 'offer-partial-test');
    assert.equal(transaction.quantity, 80);
    assert.equal(transaction.amount, 80 * 2650);
    assert.equal(transaction.remainingQuantity, 20);
    assert.equal(offers.find((item) => item.id === 'offer-1').status, 'rejected');
    const stale = await fetch(`${base}/offers/offer-1`, { method: 'PATCH', headers: farmerHeaders,
      body: JSON.stringify({ status: 'accepted' }) });
    assert.notEqual(stale.status, 200);
  });
  resetDemoData();
});

test('accepting a full-lot offer closes the listing and leaves no further matches', async () => {
  resetDemoData();
  await withApi(async (base) => {
    const response = await fetch(`${base}/offers/offer-1`, { method: 'PATCH', headers: farmerHeaders,
      body: JSON.stringify({ status: 'accepted' }) });
    assert.equal(response.status, 200);
    assert.equal(cropLots[0].quantity, 0);
    assert.equal(cropLots[0].status, 'closed');
    assert.equal(getMarketplaceListings().length, 0);
    const matches = await fetch(`${base}/matches/lots/lot-1`);
    assert.equal(matches.status, 200);
    assert.deepEqual(await matches.json(), []);
  });
  resetDemoData();
});

test('offer acceptance and direct checkout share inventory under concurrent requests', async () => {
  resetDemoData();
  await withApi(async (base) => {
    const results = await Promise.allSettled([
      fetch(`${base}/offers/offer-1`, { method: 'PATCH', headers: farmerHeaders,
        body: JSON.stringify({ status: 'accepted' }) }).then(async (response) => response.status),
      createMarketplaceCheckout({ lotId: 'lot-1', buyerId: 'buyer-1', quantity: 100 })
    ]);
    const offerStatus = results[0].status === 'fulfilled' ? results[0].value : 500;
    const marketplaceSucceeded = results[1].status === 'fulfilled';
    assert.equal((offerStatus === 200 ? 1 : 0) + (marketplaceSucceeded ? 1 : 0), 1);
    assert.equal(transactions.filter((transaction) => transaction.lotId === 'lot-1').length, 1);
    assert.equal(cropLots[0].quantity, 0);
  });
  resetDemoData();
});

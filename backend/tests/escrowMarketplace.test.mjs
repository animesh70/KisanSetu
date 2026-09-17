import test from 'node:test';
import assert from 'node:assert/strict';
import { resetDemoData, transactions } from '../data/sampleData.js';
import { calculatePlatformFee, calculatePayoutSplit, getPlatformFeePercent } from '../services/platformFeeService.js';
import { createOtpRecord, generateDeliveryOtp, releaseEscrowTransfers, verifyDeliveryOtp } from '../services/escrowService.js';
import { createMarketplaceCheckout, getMarketplaceListings } from '../services/marketplaceService.js';

process.env.ESCROW_PROVIDER = 'demo';
process.env.ESCROW_DEMO_OTP_EXPOSE = 'true';
process.env.PLATFORM_FEE_PERCENT = '1.5';

test('platform fee defaults to 1.5% and stays within 1-2%', () => {
  assert.equal(getPlatformFeePercent(), 1.5);
  assert.equal(calculatePlatformFee(100000), 1500);
  const split = calculatePayoutSplit({ grossAmount: 100000, logisticsFee: 1800 });
  assert.deepEqual(split, {
    platformFeePercent: 1.5,
    platformFee: 1500,
    transporterPayout: 1800,
    farmerPayout: 96700,
    grossAmount: 100000
  });
});

test('delivery OTP is four digits, hashed, and limited to five failed attempts', () => {
  const otp = generateDeliveryOtp();
  assert.match(otp, /^\d{4}$/);
  const transaction = createOtpRecord(otp);
  assert.ok(transaction.deliveryOtpHash);
  assert.equal(transaction.demoDeliveryOtp, undefined);
  assert.equal(verifyDeliveryOtp(transaction, otp), true);
  assert.ok(transaction.deliveryOtpVerifiedAt);

  const blocked = createOtpRecord('1234');
  for (let index = 0; index < 5; index += 1) assert.equal(verifyDeliveryOtp(blocked, '9999'), false);
  assert.equal(blocked.deliveryOtpAttempts, 5);
  assert.equal(verifyDeliveryOtp(blocked, '1234'), false);
});

test('direct marketplace checkout locks demo escrow and deducts fee + logistics', async () => {
  resetDemoData();
  const listings = getMarketplaceListings();
  assert.equal(listings.length, 1);
  const result = await createMarketplaceCheckout({ lotId: listings[0].id, buyerId: 'buyer-1', quantity: listings[0].quantity });
  assert.equal(result.payment.provider, 'demo');
  assert.equal(result.transaction.escrowStatus, 'funds_locked');
  assert.equal(result.transaction.paymentStatus, 'escrow_locked');
  assert.equal(result.transaction.platformFeePercent, 1.5);
  assert.equal(result.transaction.platformFee, result.transaction.grossAmount * 0.015);
  assert.equal(result.transaction.farmerPayout, result.transaction.grossAmount - result.transaction.platformFee - result.transaction.transporterPayout);
  assert.match(result.transaction.demoDeliveryOtp, /^\d{4}$/);
  assert.equal(transactions.some((item) => item.id === result.transaction.id), true);
  assert.equal(getMarketplaceListings().length, 0);
  resetDemoData();
});


test('demo escrow release completes without external fund movement', async () => {
  const result = await releaseEscrowTransfers({ escrowTransfers: [] });
  assert.equal(result.released, true);
});

import { buyers, cropLots, logisticsOptions, transactions, users } from '../data/sampleData.js';
import { calculateLogisticsQuote, getDefaultTransportOption, roundMoney } from './logisticsService.js';
import { calculatePayoutSplit } from './platformFeeService.js';
import { createEscrowOrder, createOtpRecord, generateDeliveryOtp, getEscrowPublicConfig, isDemoEscrow } from './escrowService.js';

function publicFarmer(farmerId) {
  const farmer = users.find((user) => user.id === farmerId);
  return { id: farmerId, name: farmer?.name || 'Verified farmer', district: farmer?.location?.district || null, state: farmer?.location?.state || null };
}

export function getMarketplaceListings() {
  return cropLots
    .filter((lot) => lot.status === 'open' && Number(lot.quantity) > 0)
    .map((lot) => ({
      id: lot.id,
      crop: lot.crop,
      variety: lot.variety,
      grade: lot.grade,
      quantity: lot.quantity,
      unit: lot.unit || 'quintal',
      askingPrice: lot.askingPrice,
      location: lot.location,
      harvestDate: lot.harvestDate,
      destinationMandiName: lot.destinationMandiName || null,
      farmer: publicFarmer(lot.farmerId),
      escrow: getEscrowPublicConfig()
    }));
}

export function getBuyerPurchases(buyerId) {
  return transactions.filter((transaction) => transaction.buyerId === buyerId && transaction.escrowStatus);
}

export async function createMarketplaceCheckout({ lotId, buyerId, quantity } = {}) {
  const lot = cropLots.find((item) => item.id === lotId);
  if (!lot || lot.status !== 'open') throw Object.assign(new Error('This listing is no longer available.'), { status: 404 });
  const buyer = buyers.find((item) => item.id === buyerId);
  if (!buyer) throw Object.assign(new Error('Buyer account not found.'), { status: 404 });
  const requestedQuantity = Number(quantity || lot.quantity);
  if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0 || requestedQuantity > Number(lot.quantity)) {
    throw Object.assign(new Error('Enter a quantity within the available listing quantity.'), { status: 400 });
  }
  if (transactions.some((item) => item.source === 'direct_marketplace' && item.lotId === lot.id && !['cancelled', 'completed'].includes(item.status))) {
    throw Object.assign(new Error('This listing already has an active marketplace checkout.'), { status: 409 });
  }

  const transportOption = getDefaultTransportOption(logisticsOptions);
  const distanceKm = Number(buyer.distanceKm || lot.destinationDistanceKm || 0);
  const logistics = calculateLogisticsQuote({ logisticsOption: transportOption, quantity: requestedQuantity, distanceKm });
  const grossAmount = roundMoney(Number(lot.askingPrice) * requestedQuantity);
  const split = calculatePayoutSplit({ grossAmount, logisticsFee: logistics.totalCost });
  const id = `txn-market-${Date.now()}`;
  const otp = generateDeliveryOtp();
  const otpRecord = createOtpRecord(otp);
  const order = await createEscrowOrder({ transactionId: id, amount: grossAmount, notes: { lotId: lot.id, buyerId, farmerId: lot.farmerId } });
  const demo = isDemoEscrow();

  const transaction = {
    id,
    source: 'direct_marketplace',
    lotId: lot.id,
    acceptedOfferId: null,
    farmerId: lot.farmerId,
    buyerId,
    buyerName: buyer.companyName,
    buyerDistanceKm: distanceKm,
    crop: lot.crop,
    quantity: requestedQuantity,
    tradableQuantity: requestedQuantity,
    remainingQuantity: roundMoney(Number(lot.quantity) - requestedQuantity),
    amount: grossAmount,
    grossAmount,
    logisticsOptionId: transportOption?.id || null,
    logisticsProvider: transportOption?.provider || null,
    logisticsType: logistics.type,
    logisticsFee: logistics.totalCost,
    logisticsCostPerQuintal: logistics.costPerQuintal,
    transportTrips: logistics.trips || 0,
    logisticsPaidBy: 'farmer',
    platformFeePercent: split.platformFeePercent,
    platformFee: split.platformFee,
    transporterPayout: split.transporterPayout,
    farmerPayout: split.farmerPayout,
    netPayable: split.farmerPayout,
    status: 'confirmed',
    paymentStatus: demo ? 'escrow_locked' : 'awaiting_escrow_funding',
    escrowStatus: demo ? 'funds_locked' : 'awaiting_payment',
    escrowProvider: order.provider,
    escrowOrderId: order.orderId,
    escrowPaymentId: null,
    escrowTransfers: [],
    paymentMethod: demo ? 'KisanSetu escrow (demo)' : 'Razorpay Route',
    paymentReference: order.orderId,
    pickupWindow: 'To be scheduled after escrow lock',
    driverName: null,
    driverPhone: null,
    paymentDue: 'Released only after buyer verifies delivery OTP',
    ...otpRecord,
    ...(demo && String(process.env.ESCROW_DEMO_OTP_EXPOSE || 'true').toLowerCase() !== 'false' ? { demoDeliveryOtp: otp } : {}),
    auditLog: [{ event: demo ? 'Marketplace checkout created; demo funds locked in escrow' : 'Marketplace checkout created; awaiting Razorpay payment', at: new Date().toISOString() }]
  };
  transactions.push(transaction);
  if (demo) {
    if (transaction.remainingQuantity <= 0) lot.status = 'closed';
    else lot.quantity = transaction.remainingQuantity;
  }
  return { transaction, payment: { provider: order.provider, orderId: order.orderId, amountPaise: order.amountPaise, razorpayKeyId: getEscrowPublicConfig().razorpayKeyId } };
}

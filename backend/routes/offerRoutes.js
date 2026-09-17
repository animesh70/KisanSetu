import { Router } from 'express';
import { buyers, cropLots, logisticsOptions, offers, transactions } from '../data/sampleData.js';
import { requireRole } from '../middleware/auth.js';
import { calculateLogisticsQuote, calculateNetPayable, DEFAULT_TRANSACTION_STORAGE_DAYS } from '../services/logisticsService.js';
import { calculatePayoutSplit } from '../services/platformFeeService.js';
import { createEscrowOrder, createOtpRecord, generateDeliveryOtp, getEscrowPublicConfig, isDemoEscrow } from '../services/escrowService.js';
import { getTradableQuantity } from '../services/quantityService.js';

const router = Router();
router.get('/', (req, res) => res.json(offers));
router.post('/', requireRole('buyer'), (req, res) => {
  const offer = { id: `offer-${Date.now()}`, buyerId: req.user.id, status: 'pending', createdAt: new Date().toISOString(), ...req.body };
  offers.push(offer);
  res.status(201).json(offer);
});
router.patch('/:id', requireRole('farmer', 'fpo'), async (req, res) => {
  const offer = offers.find((item) => item.id === req.params.id);
  if (!offer) return res.status(404).json({ message: 'Offer not found.' });
  if (!['accepted', 'rejected', 'countered'].includes(req.body.status) || offer.status !== 'pending') return res.status(400).json({ message: 'Only a pending offer can be accepted, rejected, or countered.' });
  if (req.body.status === 'countered' && (!Number(req.body.counterPrice) || Number(req.body.counterPrice) <= 0)) return res.status(400).json({ message: 'Enter a valid counter-offer price.' });
  if (req.body.status === 'countered') {
    offer.status = 'countered';
    offer.counterPrice = Number(req.body.counterPrice);
    offer.counterMessage = String(req.body.message || 'Farmer counter-offer sent for buyer review.');
  }
  if (req.body.status === 'rejected') offer.status = 'rejected';
  if (req.body.status === 'accepted') {
    if (transactions.some((item) => item.acceptedOfferId === offer.id)) return res.status(409).json({ message: 'A transaction already exists for this offer.' });
    const buyer = buyers.find((item) => item.id === offer.buyerId);
    const lot = cropLots.find((item) => item.id === offer.lotId);
    if (!buyer || !lot) return res.status(409).json({ message: 'The buyer or crop lot for this offer is no longer available.' });
    let trade;
    try {
      trade = getTradableQuantity({ lotQuantity: lot.quantity, buyerRequiredQuantity: buyer.requiredQuantity, requestedQuantity: offer.quantity });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
    const logistics = logisticsOptions.find((item) => item.id === req.body.logisticsOptionId);
    const requestedStorageDays = Number(req.body.storageDays);
    const storageDays = Number.isInteger(requestedStorageDays) && requestedStorageDays > 0 ? requestedStorageDays : DEFAULT_TRANSACTION_STORAGE_DAYS;
    const logisticsQuote = calculateLogisticsQuote({
      logisticsOption: logistics,
      quantity: trade.tradableQuantity,
      distanceKm: buyer.distanceKm,
      holdingDays: storageDays
    });
    const grossAmount = offer.pricePerUnit * trade.tradableQuantity;
    const split = calculatePayoutSplit({ grossAmount, logisticsFee: logisticsQuote.totalCost });
    const platformFee = split.platformFee;
    const transactionId = `txn-${Date.now()}`;
    const otp = generateDeliveryOtp();
    const otpRecord = createOtpRecord(otp);
    let escrowOrder;
    try {
      escrowOrder = await createEscrowOrder({ transactionId, amount: grossAmount, notes: { offerId: offer.id, lotId: offer.lotId, buyerId: offer.buyerId, farmerId: offer.farmerId } });
    } catch (error) {
      return res.status(502).json({ message: 'The offer is valid, but the escrow payment session could not be created.' });
    }
    const demoEscrow = isDemoEscrow();
    const transaction = {
      id: transactionId,
      lotId: offer.lotId,
      acceptedOfferId: offer.id,
      farmerId: offer.farmerId,
      buyerId: offer.buyerId,
      buyerName: buyer.companyName,
      buyerDistanceKm: buyer.distanceKm,
      crop: lot.crop,
      quantity: trade.tradableQuantity,
      tradableQuantity: trade.tradableQuantity,
      remainingQuantity: trade.remainingQuantity,
      amount: grossAmount,
      grossAmount,
      logisticsOptionId: logistics?.id || null,
      logisticsProvider: logistics?.provider || null,
      logisticsType: logisticsQuote.type,
      logisticsFee: logisticsQuote.totalCost,
      logisticsCostPerQuintal: logisticsQuote.costPerQuintal,
      transportTrips: logisticsQuote.type === 'Transport' ? logisticsQuote.trips : 0,
      storageDays: logisticsQuote.type === 'Storage' ? logisticsQuote.holdingDays : null,
      logisticsPaidBy: 'farmer',
      platformFeePercent: split.platformFeePercent,
      platformFee,
      transporterPayout: split.transporterPayout,
      farmerPayout: split.farmerPayout,
      netPayable: calculateNetPayable({ grossAmount, logisticsFee: logisticsQuote.totalCost, platformFee }),
      status: 'confirmed',
      paymentStatus: demoEscrow ? 'escrow_locked' : 'awaiting_escrow_funding',
      escrowStatus: demoEscrow ? 'funds_locked' : 'awaiting_payment',
      escrowProvider: escrowOrder.provider,
      escrowOrderId: escrowOrder.orderId,
      escrowPaymentId: null,
      escrowTransfers: [],
      paymentMethod: demoEscrow ? 'KisanSetu escrow (demo)' : 'Razorpay Route',
      paymentReference: escrowOrder.orderId,
      pickupWindow: 'Tomorrow, 10:00 AM – 2:00 PM (demo)',
      driverName: 'Ramesh Jadhav (demo)',
      driverPhone: '98220 01100',
      paymentDue: 'Released only after buyer verifies delivery OTP',
      ...otpRecord,
      ...(demoEscrow && getEscrowPublicConfig().otpExposedInDemo ? { demoDeliveryOtp: otp } : {}),
      auditLog: [{ event: demoEscrow ? 'Offer accepted; demo funds locked in escrow' : 'Offer accepted; Razorpay escrow order created', at: new Date().toISOString() }]
    };
    offer.status = 'accepted';
    offer.tradableQuantity = trade.tradableQuantity;
    offer.remainingQuantity = trade.remainingQuantity;
    transactions.push(transaction);
  }
  res.json(offer);
});
export default router;

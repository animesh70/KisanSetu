import { Router } from 'express';
import { buyers, grievances, logisticsOptions, resetDemoData, transactions } from '../data/sampleData.js';
import { requireRole } from '../middleware/auth.js';
import { calculateLogisticsQuote, calculateNetPayable, DEFAULT_TRANSACTION_STORAGE_DAYS } from '../services/logisticsService.js';
import { isMongooseConfigured } from '../db/mongoose.js';
import { resetEquipmentDemoData } from '../repositories/equipmentRepository.js';
import { calculatePayoutSplit } from '../services/platformFeeService.js';
import { calculateTransactionRoutes } from '../services/routeService.js';

const router = Router();
router.get('/logistics', (req, res) => res.json(logisticsOptions));
router.get('/transactions', (req, res) => res.json(transactions));
const nextStatus = { confirmed: 'pickup_scheduled', pickup_scheduled: 'in_transit', in_transit: 'delivered', delivered: 'completed' };

router.get('/transactions/:id/routes', async (req, res) => {
  const transaction = transactions.find((item) => item.id === req.params.id);
  if (!transaction) return res.status(404).json({ message: 'Transaction not found.' });
  try {
    return res.json(await calculateTransactionRoutes(transaction));
  } catch (error) {
    return res.status(error?.code === 'ROUTE_COORDINATES_UNAVAILABLE' ? 422 : 503).json({
      error: { code: error?.code || 'ROUTE_UNAVAILABLE', message: error?.message || 'Route planning is temporarily unavailable.' }
    });
  }
});

router.patch('/transactions/:id/logistics', requireRole('farmer', 'fpo', 'buyer', 'admin'), (req, res) => {
  const transaction = transactions.find((item) => item.id === req.params.id);
  const logistics = logisticsOptions.find((item) => item.id === req.body.logisticsOptionId);
  if (!transaction) return res.status(404).json({ message: 'Transaction not found.' });
  if (transaction.escrowProvider === 'razorpay' && transaction.escrowStatus === 'funds_locked') return res.status(409).json({ message: 'Logistics cannot change after Razorpay escrow funds are locked.' });
  if (!logistics || logistics.available === false) return res.status(400).json({ message: 'Select an available logistics option.' });
  const buyer = buyers.find((item) => item.id === transaction.buyerId);
  const buyerDistanceKm = Number.isFinite(Number(transaction.buyerDistanceKm))
    ? Number(transaction.buyerDistanceKm)
    : Number(buyer?.distanceKm || 0);
  const requestedStorageDays = Number(req.body.storageDays);
  const storageDays = Number.isInteger(requestedStorageDays) && requestedStorageDays > 0
    ? requestedStorageDays
    : (transaction.storageDays || DEFAULT_TRANSACTION_STORAGE_DAYS);
  const logisticsQuote = calculateLogisticsQuote({
    logisticsOption: logistics,
    quantity: transaction.quantity,
    distanceKm: buyerDistanceKm,
    holdingDays: storageDays
  });
  transaction.buyerDistanceKm = buyerDistanceKm;
  transaction.logisticsOptionId = logistics.id;
  transaction.logisticsProvider = logistics.provider;
  transaction.logisticsType = logisticsQuote.type;
  transaction.logisticsFee = logisticsQuote.totalCost;
  transaction.logisticsCostPerQuintal = logisticsQuote.costPerQuintal;
  transaction.transportTrips = logisticsQuote.type === 'Transport' ? logisticsQuote.trips : 0;
  transaction.storageDays = logisticsQuote.type === 'Storage' ? logisticsQuote.holdingDays : null;
  const split = calculatePayoutSplit({ grossAmount: transaction.grossAmount, logisticsFee: transaction.logisticsFee, percent: transaction.platformFeePercent });
  transaction.platformFeePercent = split.platformFeePercent;
  transaction.platformFee = split.platformFee;
  transaction.transporterPayout = split.transporterPayout;
  transaction.farmerPayout = split.farmerPayout;
  transaction.netPayable = calculateNetPayable({
    grossAmount: transaction.grossAmount,
    logisticsFee: transaction.logisticsFee,
    platformFee: transaction.platformFee
  });
  transaction.auditLog.push({ event: `Logistics selected: ${logistics.provider}`, at: new Date().toISOString() });
  res.json(transaction);
});
router.patch('/transactions/:id/status', requireRole('farmer', 'fpo', 'buyer', 'admin'), (req, res) => {
  const transaction = transactions.find((item) => item.id === req.params.id);
  if (!transaction) return res.status(404).json({ message: 'Transaction not found.' });
  const requestedStatus = req.body.status || transaction.status;
  if (requestedStatus !== transaction.status && nextStatus[transaction.status] !== requestedStatus) return res.status(400).json({ message: `Invalid transaction transition from ${transaction.status} to ${requestedStatus}.` });
  if (requestedStatus === 'completed' && transaction.escrowStatus && transaction.escrowStatus !== 'released') return res.status(409).json({ message: 'Escrow transactions complete only after buyer delivery-OTP verification releases the funds.' });
  if (requestedStatus === 'pickup_scheduled' && !transaction.logisticsOptionId) return res.status(400).json({ message: 'Please choose a logistics option before scheduling pickup.' });
  transaction.status = requestedStatus;
  if (transaction.escrowStatus && req.body.paymentStatus === 'paid' && transaction.escrowStatus !== 'released') return res.status(409).json({ message: 'Escrow payment cannot be marked paid before escrow release.' });
  transaction.paymentStatus = req.body.paymentStatus || transaction.paymentStatus;
  transaction.auditLog.push({ event: `Status changed to ${transaction.status}`, at: new Date().toISOString() });
  res.json(transaction);
});
router.get('/grievances', (req, res) => res.json(grievances));
router.post('/grievances', (req, res) => {
  const item = { id: `grievance-${Date.now()}`, status: 'open', createdAt: new Date().toISOString(), ...req.body };
  grievances.push(item);
  res.status(201).json(item);
});
router.post('/demo/reset', async (req, res) => {
  resetDemoData();
  let equipmentReset = false;
  if (isMongooseConfigured()) {
    try {
      await resetEquipmentDemoData();
      equipmentReset = true;
    } catch (error) {
      console.warn('Equipment demo reset failed:', error?.name || 'Error');
      return res.status(503).json({
        error: {
          code: 'DEMO_RESET_PARTIAL',
          message: 'Core demo data was reset, but equipment sharing could not be reset. Please try again.'
        }
      });
    }
  }
  return res.json({ message: 'Demo data reset.', equipmentReset });
});
export default router;

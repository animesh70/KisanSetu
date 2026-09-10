import { Router } from 'express';
import { buyers, grievances, logisticsOptions, resetDemoData, transactions } from '../data/sampleData.js';
import { requireRole } from '../middleware/auth.js';
import { calculateLogisticsQuote, calculateNetPayable, DEFAULT_TRANSACTION_STORAGE_DAYS } from '../services/logisticsService.js';

const router = Router();
router.get('/logistics', (req, res) => res.json(logisticsOptions));
router.get('/transactions', (req, res) => res.json(transactions));
const nextStatus = { confirmed: 'pickup_scheduled', pickup_scheduled: 'in_transit', in_transit: 'delivered', delivered: 'completed' };

router.patch('/transactions/:id/logistics', requireRole('farmer', 'fpo', 'buyer', 'admin'), (req, res) => {
  const transaction = transactions.find((item) => item.id === req.params.id);
  const logistics = logisticsOptions.find((item) => item.id === req.body.logisticsOptionId);
  if (!transaction) return res.status(404).json({ message: 'Transaction not found.' });
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
  if (requestedStatus === 'pickup_scheduled' && !transaction.logisticsOptionId) return res.status(400).json({ message: 'Please choose a logistics option before scheduling pickup.' });
  transaction.status = requestedStatus;
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
router.post('/demo/reset', (req, res) => { resetDemoData(); res.json({ message: 'Demo data reset.' }); });
export default router;

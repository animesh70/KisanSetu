import { Router } from 'express';
import { grievances, logisticsOptions, resetDemoData, transactions } from '../data/sampleData.js';

const router = Router();
router.get('/logistics', (req, res) => res.json(logisticsOptions));
router.get('/transactions', (req, res) => res.json(transactions));
router.patch('/transactions/:id/status', (req, res) => {
  const transaction = transactions.find((item) => item.id === req.params.id);
  if (!transaction) return res.status(404).json({ message: 'Transaction not found.' });
  transaction.status = req.body.status || transaction.status;
  transaction.paymentStatus = req.body.paymentStatus || transaction.paymentStatus;
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

import { Router } from 'express';
import { buyers, mandiPrices } from '../data/sampleData.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireRole('admin'));
router.get('/buyers', (req, res) => res.json(buyers));
router.patch('/buyers/:id/verification', (req, res) => {
  const buyer = buyers.find((item) => item.id === req.params.id);
  if (!buyer) return res.status(404).json({ message: 'Buyer not found.' });
  buyer.verified = Boolean(req.body.verified);
  res.json(buyer);
});
router.get('/metrics', (req, res) => res.json({ verifiedBuyers: buyers.filter((buyer) => buyer.verified).length, marketRecords: mandiPrices.length, status: 'demo-data' }));
export default router;

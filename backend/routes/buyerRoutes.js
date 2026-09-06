import { Router } from 'express';
import { buyers } from '../data/sampleData.js';

const router = Router();
router.get('/', (req, res) => {
  const crop = String(req.query.crop || '').trim().toLowerCase();
  res.json(crop ? buyers.filter((buyer) => buyer.crops.some((item) => item.toLowerCase() === crop)) : buyers);
});
export default router;

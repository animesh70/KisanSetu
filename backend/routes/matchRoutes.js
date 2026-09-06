import { Router } from 'express';
import { cropLots } from '../data/sampleData.js';
import { getMatches, getSellingRecommendation } from '../services/matchingService.js';

const router = Router();
router.get('/lots/:lotId', (req, res) => {
  const lot = cropLots.find((item) => item.id === req.params.lotId);
  if (!lot) return res.status(404).json({ message: 'Crop lot not found.' });
  res.json(getMatches(lot));
});
router.get('/sell', async (req, res) => {
  try { res.json(await getSellingRecommendation(req.query)); }
  catch (error) { res.status(400).json({ message: error.message }); }
});
export default router;

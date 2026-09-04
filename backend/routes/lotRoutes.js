import { Router } from 'express';
import { cropLots, offers } from '../data/sampleData.js';
import { requireRole } from '../middleware/auth.js';
import { getMatches } from '../services/matchingService.js';

const router = Router();
router.get('/', (req, res) => res.json(cropLots));
router.post('/', requireRole('farmer', 'fpo'), (req, res) => {
  const required = ['crop', 'quantity', 'grade', 'askingPrice', 'location'];
  const missing = required.filter((field) => !req.body[field]);
  if (missing.length) return res.status(400).json({ message: `Missing fields: ${missing.join(', ')}` });
  const lot = { id: `lot-${Date.now()}`, farmerId: req.user.id, unit: 'quintal', status: 'open', createdAt: new Date().toISOString(), ...req.body };
  cropLots.push(lot);
  const bestBuyer = getMatches(lot)[0];
  const generatedOffer = bestBuyer && { id: `offer-${Date.now() + 1}`, lotId: lot.id, buyerId: bestBuyer.id, farmerId: lot.farmerId, pricePerUnit: bestBuyer.targetPrice, quantity: Math.min(lot.quantity, bestBuyer.requiredQuantity), message: `Demo match: ${bestBuyer.companyName} can arrange pickup after you accept.`, status: 'pending', createdAt: new Date().toISOString(), source: 'simulated-match' };
  if (generatedOffer) offers.push(generatedOffer);
  res.status(201).json({ lot, generatedOffer });
});
router.get('/:id', (req, res) => {
  const lot = cropLots.find((item) => item.id === req.params.id);
  if (!lot) return res.status(404).json({ message: 'Crop lot not found.' });
  res.json(lot);
});
export default router;

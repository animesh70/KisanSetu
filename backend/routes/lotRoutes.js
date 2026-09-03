import { Router } from 'express';
import { cropLots } from '../data/sampleData.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();
router.get('/', (req, res) => res.json(cropLots));
router.post('/', requireRole('farmer', 'fpo'), (req, res) => {
  const required = ['crop', 'quantity', 'grade', 'askingPrice', 'location'];
  const missing = required.filter((field) => !req.body[field]);
  if (missing.length) return res.status(400).json({ message: `Missing fields: ${missing.join(', ')}` });
  const lot = { id: `lot-${Date.now()}`, farmerId: req.user.id, unit: 'quintal', status: 'open', createdAt: new Date().toISOString(), ...req.body };
  cropLots.push(lot);
  res.status(201).json(lot);
});
router.get('/:id', (req, res) => {
  const lot = cropLots.find((item) => item.id === req.params.id);
  if (!lot) return res.status(404).json({ message: 'Crop lot not found.' });
  res.json(lot);
});
export default router;

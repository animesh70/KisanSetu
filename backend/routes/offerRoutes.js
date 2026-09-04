import { Router } from 'express';
import { offers, transactions } from '../data/sampleData.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();
router.get('/', (req, res) => res.json(offers));
router.post('/', requireRole('buyer'), (req, res) => {
  const offer = { id: `offer-${Date.now()}`, buyerId: req.user.id, status: 'pending', createdAt: new Date().toISOString(), ...req.body };
  offers.push(offer);
  res.status(201).json(offer);
});
router.patch('/:id', requireRole('farmer', 'fpo'), (req, res) => {
  const offer = offers.find((item) => item.id === req.params.id);
  if (!offer) return res.status(404).json({ message: 'Offer not found.' });
  if (!['accepted', 'rejected', 'countered'].includes(req.body.status) || offer.status !== 'pending') return res.status(400).json({ message: 'Only a pending offer can be accepted, rejected, or countered.' });
  if (req.body.status === 'countered' && (!Number(req.body.counterPrice) || Number(req.body.counterPrice) <= 0)) return res.status(400).json({ message: 'Enter a valid counter-offer price.' });
  offer.status = req.body.status;
  if (offer.status === 'countered') {
    offer.counterPrice = Number(req.body.counterPrice);
    offer.counterMessage = String(req.body.message || 'Farmer counter-offer sent for buyer review.');
  }
  if (offer.status === 'accepted') {
    if (transactions.some((item) => item.acceptedOfferId === offer.id)) return res.status(409).json({ message: 'A transaction already exists for this offer.' });
    transactions.push({ id: `txn-${Date.now()}`, lotId: offer.lotId, acceptedOfferId: offer.id, farmerId: offer.farmerId, buyerId: offer.buyerId, amount: offer.pricePerUnit * offer.quantity, status: 'confirmed', paymentStatus: 'awaiting_delivery', paymentMethod: 'UPI / bank transfer (demo)', paymentReference: `KS-${Date.now().toString().slice(-6)}` });
  }
  res.json(offer);
});
export default router;

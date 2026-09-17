import { Router } from 'express';
import { requireRole } from '../middleware/auth.js';
import { createMarketplaceCheckout, getBuyerPurchases, getMarketplaceListings } from '../services/marketplaceService.js';

const router = Router();

router.get('/listings', (req, res) => res.json(getMarketplaceListings()));
router.get('/purchases', requireRole('buyer'), (req, res) => res.json(getBuyerPurchases(req.user.id)));
router.post('/listings/:lotId/checkout', requireRole('buyer'), async (req, res) => {
  try {
    const result = await createMarketplaceCheckout({ lotId: req.params.lotId, buyerId: req.user.id, quantity: req.body.quantity });
    res.status(201).json(result);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.status ? error.message : 'Marketplace checkout could not be created.' });
  }
});

export default router;

import { Router } from 'express';
import { cropLots, logisticsOptions, mandiPrices, offers } from '../data/sampleData.js';
import { requireRole } from '../middleware/auth.js';
import { getMatches, selectAutoOfferMatch } from '../services/matchingService.js';
import { parseQuantity } from '../services/quantityService.js';
import { buildSharedLogisticsGroup, haversineDistanceKm } from '../services/logisticsService.js';
import {
  canMirrorLot,
  deleteLotGeoBestEffort,
  findNearbyLots,
  getSharedMaxMatches,
  isMongoConfigured,
  normalizePickupPoint,
  parseSharedRadiusKm,
  syncLotGeoBestEffort,
  upsertLotGeo
} from '../repositories/lotGeoRepository.js';

const router = Router();

function toPublicLot(lot) {
  if (!lot) return lot;
  const { pickupPoint, ...publicLot } = lot;
  return {
    ...publicLot,
    sharedLogisticsReady: Boolean(normalizePickupPoint(pickupPoint) && lot.destinationMandiId)
  };
}

function mandiKey(mandi) {
  const slug = [mandi?.mandiName, mandi?.district, mandi?.state]
    .map((value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    .filter(Boolean)
    .join('-');
  return slug ? `mandi-${slug}` : '';
}

function resolveMandi(mandiId, crop) {
  const requested = String(mandiId || '');
  const mandi = mandiPrices.find((item) => item.id === requested || mandiKey(item) === requested);
  if (!mandi) throw new TypeError('Select a valid destination mandi.');
  if (crop && String(mandi.crop).toLowerCase() !== String(crop).toLowerCase()) {
    throw new TypeError('The destination mandi must support the selected crop.');
  }
  return mandi;
}

function applySpatialFields(target, body, { crop, isPatch = false } = {}) {
  if (Object.prototype.hasOwnProperty.call(body, 'pickupPoint')) {
    if (body.pickupPoint === null || body.pickupPoint === '') {
      delete target.pickupPoint;
    } else {
      const point = normalizePickupPoint(body.pickupPoint);
      if (!point) throw new TypeError('Pickup coordinates must be GeoJSON Point coordinates in [longitude, latitude] order.');
      target.pickupPoint = point;
    }
  } else if (!isPatch && body.pickupPoint) {
    target.pickupPoint = normalizePickupPoint(body.pickupPoint);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'destinationMandiId')) {
    if (!body.destinationMandiId) {
      delete target.destinationMandiId;
      delete target.destinationMandiName;
      delete target.destinationDistanceKm;
    } else {
      const mandi = resolveMandi(String(body.destinationMandiId), crop);
      // Store a crop-independent mandi identity so different crops going to the same physical mandi can share freight.
      target.destinationMandiId = mandiKey(mandi);
      target.destinationMandiName = mandi.mandiName;
      target.destinationDistanceKm = Number(mandi.distanceKm || 0);
    }
  }
}

async function syncSpatialMirror(lot) {
  if (canMirrorLot(lot)) return syncLotGeoBestEffort(lot);
  return deleteLotGeoBestEffort(lot?.id);
}

router.get('/', (req, res) => res.json(cropLots.map(toPublicLot)));

router.post('/', requireRole('farmer', 'fpo'), async (req, res) => {
  const required = ['crop', 'quantity', 'grade', 'askingPrice', 'location'];
  const missing = required.filter((field) => !req.body[field]);
  if (missing.length) return res.status(400).json({ message: `Missing fields: ${missing.join(', ')}` });

  let quantity;
  try {
    quantity = parseQuantity(req.body.quantity);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }

  const {
    pickupPoint: _ignoredPickupPoint,
    destinationMandiId: _ignoredMandiId,
    destinationMandiName: _ignoredMandiName,
    destinationDistanceKm: _ignoredMandiDistance,
    ...safeBody
  } = req.body;
  const lot = {
    id: `lot-${Date.now()}`,
    farmerId: req.user.id,
    unit: 'quintal',
    status: 'open',
    createdAt: new Date().toISOString(),
    ...safeBody,
    quantity
  };

  try {
    applySpatialFields(lot, req.body, { crop: lot.crop });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }

  cropLots.push(lot);
  await syncSpatialMirror(lot);

  const bestBuyer = selectAutoOfferMatch(getMatches(lot), lot.quantity);
  const generatedOffer = bestBuyer && {
    id: `offer-${Date.now() + 1}`,
    lotId: lot.id,
    buyerId: bestBuyer.id,
    farmerId: lot.farmerId,
    pricePerUnit: bestBuyer.targetPrice,
    quantity: bestBuyer.tradableQuantity,
    tradableQuantity: bestBuyer.tradableQuantity,
    remainingQuantity: bestBuyer.remainingQuantity,
    message: `Demo match: ${bestBuyer.companyName} can arrange pickup after you accept.`,
    status: 'pending',
    createdAt: new Date().toISOString(),
    source: 'simulated-match'
  };
  if (generatedOffer) offers.push(generatedOffer);
  return res.status(201).json({ lot: toPublicLot(lot), generatedOffer });
});

router.get('/:id/shared-logistics', async (req, res) => {
  const lot = cropLots.find((item) => item.id === req.params.id);
  if (!lot) return res.status(404).json({ message: 'Crop lot not found.' });
  if (lot.status !== 'open') {
    return res.json({ eligible: false, lotId: lot.id, reason: 'LOT_NOT_OPEN', nearbyLotCount: 0 });
  }

  const pickupPoint = normalizePickupPoint(lot.pickupPoint);
  if (!pickupPoint || !lot.destinationMandiId) {
    return res.json({ eligible: false, lotId: lot.id, reason: 'MISSING_GEO_DATA', nearbyLotCount: 0 });
  }

  const radiusKm = parseSharedRadiusKm(req.query.radiusKm);
  if (!radiusKm) return res.status(400).json({ message: 'radiusKm must be a positive number.' });
  if (!isMongoConfigured()) {
    return res.status(503).json({ error: { code: 'SHARED_LOGISTICS_UNAVAILABLE', message: 'Shared logistics is temporarily unavailable.' } });
  }

  try {
    // Ensure older/seeded in-memory lots are mirrored before their first query.
    await upsertLotGeo(lot);
    const nearby = await findNearbyLots({
      lotId: lot.id,
      pickupPoint,
      destinationMandiId: lot.destinationMandiId,
      radiusMeters: radiusKm * 1000,
      maxResults: getSharedMaxMatches()
    });

    // The application still uses in-memory lots as its canonical demo state. Ignore
    // any stale Mongo mirror document left from a previous demo process/restart.
    const canonicalOpenLots = new Map(cropLots.filter((item) => item.status === 'open' && Number(item.quantity) > 0)
      .map((item) => [item.id, item]));
    const validNearby = nearby.filter((item) => canonicalOpenLots.has(item.lotId))
      .map((item) => ({ ...item, ...canonicalOpenLots.get(item.lotId) }));
    const group = buildSharedLogisticsGroup({ requestingLot: lot, nearbyLots: validNearby, logisticsOptions });

    const nearbyLots = validNearby.map((item) => ({
      lotId: item.lotId,
      crop: item.crop,
      quantity: item.quantity,
      location: item.locationText,
      distanceFromPickupKm: Math.round((haversineDistanceKm(pickupPoint, item.pickupPoint) || 0) * 100) / 100
    }));

    return res.json({
      eligible: true,
      lotId: lot.id,
      destinationMandi: { id: lot.destinationMandiId, name: lot.destinationMandiName },
      radiusKm,
      nearbyLotCount: nearbyLots.length,
      nearbyLots,
      group
    });
  } catch (error) {
    console.warn('Shared logistics query failed:', error?.name || 'Error');
    return res.status(503).json({ error: { code: 'SHARED_LOGISTICS_UNAVAILABLE', message: 'Shared logistics is temporarily unavailable.' } });
  }
});

router.get('/:id', (req, res) => {
  const lot = cropLots.find((item) => item.id === req.params.id);
  if (!lot) return res.status(404).json({ message: 'Crop lot not found.' });
  return res.json(toPublicLot(lot));
});

router.patch('/:id', requireRole('farmer', 'fpo'), async (req, res) => {
  const lot = cropLots.find((item) => item.id === req.params.id);
  if (!lot) return res.status(404).json({ message: 'Crop lot not found.' });
  if (req.body.quantity !== undefined) {
    try {
      req.body.quantity = parseQuantity(req.body.quantity);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }

  const allowed = ['variety', 'quantity', 'grade', 'askingPrice', 'location', 'harvestDate', 'status'];
  for (const field of allowed) if (req.body[field] !== undefined) lot[field] = req.body[field];
  try {
    applySpatialFields(lot, req.body, { crop: lot.crop, isPatch: true });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
  lot.updatedAt = new Date().toISOString();
  await syncSpatialMirror(lot);
  return res.json(toPublicLot(lot));
});

router.delete('/:id', requireRole('farmer', 'fpo'), async (req, res) => {
  const index = cropLots.findIndex((item) => item.id === req.params.id);
  if (index < 0) return res.status(404).json({ message: 'Crop lot not found.' });
  const lot = cropLots[index];
  if (offers.some((offer) => offer.lotId === lot.id && offer.status === 'accepted')) {
    return res.status(409).json({ message: 'A lot with an accepted offer cannot be deleted. It remains in transaction history.' });
  }
  cropLots.splice(index, 1);
  for (let offerIndex = offers.length - 1; offerIndex >= 0; offerIndex -= 1) {
    if (offers[offerIndex].lotId === lot.id) offers.splice(offerIndex, 1);
  }
  await deleteLotGeoBestEffort(lot.id);
  return res.json({ message: 'Crop lot deleted.' });
});

export default router;

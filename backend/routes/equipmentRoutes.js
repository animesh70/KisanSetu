import { Router } from 'express';
import { requireRole } from '../middleware/auth.js';
import { users } from '../data/sampleData.js';
import { isMongooseConfigured } from '../db/mongoose.js';
import { EQUIPMENT_TYPES } from '../models/Equipment.js';
import { normalizeEquipmentInput } from '../services/equipmentService.js';
import {
  createEquipment,
  createRentalRequest,
  deleteEquipment,
  getEquipmentById,
  listEquipment,
  listRentalsForUser,
  updateRentalStatus
} from '../repositories/equipmentRepository.js';

const router = Router();

function userName(userId) {
  return users.find((item) => item.id === userId)?.name || 'Demo farmer';
}

function unavailable(res) {
  return res.status(503).json({ error: { code: 'EQUIPMENT_SHARING_UNAVAILABLE', message: 'Equipment sharing is temporarily unavailable.' } });
}

function handleDbError(error, res) {
  console.warn('Equipment sharing request failed:', error?.name || 'Error');
  return unavailable(res);
}

router.get('/', async (req, res) => {
  if (!isMongooseConfigured()) return unavailable(res);
  try {
    const viewerId = req.header('x-demo-user-id') || 'farmer-1';
    const items = await listEquipment({
      viewerId,
      type: req.query.type,
      district: req.query.district,
      maxDailyRate: req.query.maxDailyRate,
      availableFrom: req.query.availableFrom,
      availableTo: req.query.availableTo
    });
    return res.json({ items, equipmentTypes: EQUIPMENT_TYPES });
  } catch (error) {
    if (error instanceof TypeError) return res.status(400).json({ message: error.message });
    return handleDbError(error, res);
  }
});

router.get('/rentals/mine', requireRole('farmer', 'fpo'), async (req, res) => {
  if (!isMongooseConfigured()) return unavailable(res);
  try {
    const rentals = await listRentalsForUser(req.user.id);
    return res.json({ rentals });
  } catch (error) {
    return handleDbError(error, res);
  }
});

router.post('/', requireRole('farmer', 'fpo'), async (req, res) => {
  if (!isMongooseConfigured()) return unavailable(res);
  try {
    const normalized = normalizeEquipmentInput(req.body);
    const item = await createEquipment({ ownerId: req.user.id, ownerName: userName(req.user.id), equipment: normalized });
    return res.status(201).json({ item });
  } catch (error) {
    if (error instanceof TypeError || error?.name === 'ValidationError') return res.status(400).json({ message: error.message });
    return handleDbError(error, res);
  }
});

router.get('/:id', async (req, res) => {
  if (!isMongooseConfigured()) return unavailable(res);
  try {
    const item = await getEquipmentById(req.params.id, req.header('x-demo-user-id') || 'farmer-1');
    if (!item) return res.status(404).json({ message: 'Equipment listing not found.' });
    return res.json({ item });
  } catch (error) {
    return handleDbError(error, res);
  }
});

router.post('/:id/rent', requireRole('farmer', 'fpo'), async (req, res) => {
  if (!isMongooseConfigured()) return unavailable(res);
  try {
    const result = await createRentalRequest({
      equipmentId: req.params.id,
      renterId: req.user.id,
      renterName: userName(req.user.id),
      startDate: req.body.startDate,
      endDate: req.body.endDate
    });
    const messages = {
      NOT_FOUND: [404, 'Equipment listing not found.'],
      OWN_EQUIPMENT: [409, 'You cannot rent your own equipment listing.'],
      PAST_DATE: [400, 'Rental start date cannot be in the past.'],
      OUTSIDE_AVAILABILITY: [409, 'Selected dates are outside this equipment availability window.'],
      DATE_CONFLICT: [409, 'This equipment already has a rental request for the selected dates.']
    };
    if (result.error) {
      const [status, message] = messages[result.error] || [400, 'Rental request could not be created.'];
      return res.status(status).json({ message, code: result.error });
    }
    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof TypeError) return res.status(400).json({ message: error.message });
    return handleDbError(error, res);
  }
});

router.patch('/rentals/:id/status', requireRole('farmer', 'fpo'), async (req, res) => {
  if (!isMongooseConfigured()) return unavailable(res);
  try {
    const status = String(req.body.status || '').trim();
    const result = await updateRentalStatus({ rentalId: req.params.id, actorId: req.user.id, status });
    if (result.error === 'NOT_FOUND') return res.status(404).json({ message: 'Rental request not found.' });
    if (result.error === 'FORBIDDEN') return res.status(403).json({ message: 'You cannot perform this rental action.' });
    if (result.error === 'DATE_CONFLICT') return res.status(409).json({ message: 'Another approved rental overlaps these dates.' });
    if (result.error) return res.status(400).json({ message: 'Invalid rental status action.' });
    return res.json(result);
  } catch (error) {
    return handleDbError(error, res);
  }
});

router.delete('/:id', requireRole('farmer', 'fpo'), async (req, res) => {
  if (!isMongooseConfigured()) return unavailable(res);
  try {
    const result = await deleteEquipment({ id: req.params.id, ownerId: req.user.id });
    if (result.reason === 'NOT_FOUND') return res.status(404).json({ message: 'Equipment listing not found.' });
    if (result.reason === 'FORBIDDEN') return res.status(403).json({ message: 'You can delete only your own equipment listings.' });
    if (result.reason === 'ACTIVE_RENTAL') return res.status(409).json({ message: 'This equipment has an active rental request and cannot be deleted.' });
    return res.json({ message: 'Equipment listing deleted.' });
  } catch (error) {
    return handleDbError(error, res);
  }
});

export default router;

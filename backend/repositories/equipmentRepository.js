import { randomUUID } from 'node:crypto';
import { getMongooseConnection } from '../db/mongoose.js';
import { getEquipmentModel } from '../models/Equipment.js';
import { getEquipmentRentalModel } from '../models/EquipmentRental.js';
import { calculateRentalQuote, escapeRegex, parseRentalWindow } from '../services/equipmentService.js';

const BLOCKING_RENTAL_STATUSES = ['requested', 'approved'];

async function getModels() {
  const connection = await getMongooseConnection();
  return {
    Equipment: getEquipmentModel(connection),
    Rental: getEquipmentRentalModel(connection)
  };
}

function serializeEquipment(doc, viewerId = '') {
  const item = doc?.toObject ? doc.toObject() : doc;
  if (!item) return null;
  return {
    id: item._id,
    ownerName: item.ownerName,
    name: item.name,
    type: item.type,
    description: item.description,
    district: item.district,
    state: item.state,
    dailyRate: item.dailyRate,
    securityDeposit: item.securityDeposit,
    condition: item.condition,
    horsepower: item.horsepower,
    availabilityFrom: item.availability?.from,
    availabilityTo: item.availability?.to,
    status: item.status,
    source: item.source,
    isOwner: Boolean(viewerId && item.ownerId === viewerId),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

function serializeRental(doc, viewerId = '') {
  const item = doc?.toObject ? doc.toObject() : doc;
  if (!item) return null;
  return {
    id: item._id,
    equipmentId: item.equipmentId,
    equipmentName: item.equipmentName,
    ownerName: item.ownerName,
    renterId: item.renterId,
    renterName: item.renterName,
    startDate: item.startDate,
    endDate: item.endDate,
    days: item.days,
    dailyRate: item.dailyRateSnapshot,
    securityDeposit: item.securityDepositSnapshot,
    totalRent: item.totalRent,
    status: item.status,
    role: item.ownerId === viewerId ? 'owner' : item.renterId === viewerId ? 'renter' : 'viewer',
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

async function seedDemoEquipment(Equipment) {
  if (String(process.env.EQUIPMENT_DEMO_SEED_ENABLED || 'true').toLowerCase() === 'false') return;
  if (await Equipment.countDocuments({}) > 0) return;
  const now = new Date();
  const availableTo = new Date(now.getTime() + (120 * 24 * 60 * 60 * 1000));
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  await Equipment.insertMany([
    {
      _id: 'equipment-demo-tractor', ownerId: 'farmer-2', ownerName: 'Mahesh Jadhav',
      name: 'Mahindra 575 DI Tractor', type: 'Tractor', description: '45 HP tractor suitable for tillage, haulage and seeding operations.',
      district: 'Nashik', state: 'Maharashtra', dailyRate: 1800, securityDeposit: 5000, condition: 'Excellent', horsepower: 45,
      availability: { from, to: availableTo }, status: 'active', source: 'demo'
    },
    {
      _id: 'equipment-demo-rotavator', ownerId: 'farmer-3', ownerName: 'Asha More',
      name: '7 ft Rotavator', type: 'Rotavator', description: 'Heavy-duty rotavator for seed-bed preparation and residue mixing.',
      district: 'Nashik', state: 'Maharashtra', dailyRate: 900, securityDeposit: 2500, condition: 'Very Good', horsepower: null,
      availability: { from, to: availableTo }, status: 'active', source: 'demo'
    },
    {
      _id: 'equipment-demo-sprayer', ownerId: 'farmer-4', ownerName: 'Ramesh Shinde',
      name: 'Battery Crop Sprayer', type: 'Sprayer', description: '16 litre rechargeable sprayer for crop protection work.',
      district: 'Pune', state: 'Maharashtra', dailyRate: 350, securityDeposit: 800, condition: 'Good', horsepower: null,
      availability: { from, to: availableTo }, status: 'active', source: 'demo'
    }
  ]);
}

export async function ensureDemoEquipment(modelsOverride = null) {
  const { Equipment } = modelsOverride || await getModels();
  await seedDemoEquipment(Equipment);
}

export async function resetEquipmentDemoData(modelsOverride = null) {
  const { Equipment, Rental } = modelsOverride || await getModels();
  await Rental.deleteMany({});
  await Equipment.deleteMany({});
  await seedDemoEquipment(Equipment);
  return {
    equipmentCount: await Equipment.countDocuments({}),
    rentalCount: await Rental.countDocuments({})
  };
}

export async function listEquipment({ viewerId = '', type = '', district = '', maxDailyRate, availableFrom, availableTo } = {}) {
  const { Equipment, Rental } = await getModels();
  await ensureDemoEquipment();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const query = { status: 'active', 'availability.to': { $gte: today } };
  if (type) query.type = String(type);
  if (district) query.district = { $regex: `^${escapeRegex(String(district).trim())}$`, $options: 'i' };
  if (Number.isFinite(Number(maxDailyRate)) && Number(maxDailyRate) > 0) query.dailyRate = { $lte: Number(maxDailyRate) };

  if (availableFrom || availableTo) {
    if (!availableFrom || !availableTo) throw new TypeError('Select both available-from and available-to dates.');
    const { startDate, endDate } = parseRentalWindow(availableFrom, availableTo);
    query['availability.from'] = { $lte: startDate };
    query['availability.to'] = { $gte: endDate };
    const blockedIds = await Rental.distinct('equipmentId', {
      status: { $in: BLOCKING_RENTAL_STATUSES },
      startDate: { $lte: endDate },
      endDate: { $gte: startDate }
    });
    if (blockedIds.length) query._id = { $nin: blockedIds };
  }

  const docs = await Equipment.find(query).sort({ createdAt: -1 }).limit(100).lean();
  return docs.map((item) => serializeEquipment(item, viewerId));
}

export async function createEquipment({ ownerId, ownerName, equipment }) {
  const { Equipment } = await getModels();
  const doc = await Equipment.create({
    _id: `equipment-${randomUUID()}`,
    ownerId,
    ownerName,
    ...equipment,
    source: 'user',
    status: 'active'
  });
  return serializeEquipment(doc, ownerId);
}

export async function getEquipmentById(id, viewerId = '') {
  const { Equipment } = await getModels();
  const doc = await Equipment.findById(String(id)).lean();
  return serializeEquipment(doc, viewerId);
}

export async function deleteEquipment({ id, ownerId }) {
  const { Equipment, Rental } = await getModels();
  const listing = await Equipment.findById(String(id)).lean();
  if (!listing) return { deleted: false, reason: 'NOT_FOUND' };
  if (listing.ownerId !== ownerId) return { deleted: false, reason: 'FORBIDDEN' };
  const activeRental = await Rental.exists({ equipmentId: listing._id, status: { $in: BLOCKING_RENTAL_STATUSES } });
  if (activeRental) return { deleted: false, reason: 'ACTIVE_RENTAL' };
  await Equipment.deleteOne({ _id: listing._id, ownerId });
  return { deleted: true };
}

export async function createRentalRequest({ equipmentId, renterId, renterName, startDate: startValue, endDate: endValue }) {
  const { Equipment, Rental } = await getModels();
  const listing = await Equipment.findById(String(equipmentId)).lean();
  if (!listing || listing.status !== 'active') return { error: 'NOT_FOUND' };
  if (listing.ownerId === renterId) return { error: 'OWN_EQUIPMENT' };

  const { startDate, endDate, days } = parseRentalWindow(startValue, endValue);
  if (startDate < new Date(Date.now() - 24 * 60 * 60 * 1000)) return { error: 'PAST_DATE' };
  if (startDate < listing.availability.from || endDate > listing.availability.to) return { error: 'OUTSIDE_AVAILABILITY' };

  const conflict = await Rental.exists({
    equipmentId: listing._id,
    status: { $in: BLOCKING_RENTAL_STATUSES },
    startDate: { $lte: endDate },
    endDate: { $gte: startDate }
  });
  if (conflict) return { error: 'DATE_CONFLICT' };

  const totalRent = calculateRentalQuote(listing.dailyRate, days);
  const rental = await Rental.create({
    _id: `rental-${randomUUID()}`,
    equipmentId: listing._id,
    equipmentName: listing.name,
    ownerId: listing.ownerId,
    ownerName: listing.ownerName,
    renterId,
    renterName,
    startDate,
    endDate,
    days,
    dailyRateSnapshot: listing.dailyRate,
    securityDepositSnapshot: listing.securityDeposit,
    totalRent,
    status: 'requested'
  });
  return { rental: serializeRental(rental, renterId) };
}

export async function listRentalsForUser(userId) {
  const { Rental } = await getModels();
  const docs = await Rental.find({ $or: [{ renterId: userId }, { ownerId: userId }] }).sort({ createdAt: -1 }).limit(100).lean();
  return docs.map((item) => serializeRental(item, userId));
}

export async function updateRentalStatus({ rentalId, actorId, status }) {
  const { Rental } = await getModels();
  const rental = await Rental.findById(String(rentalId));
  if (!rental) return { error: 'NOT_FOUND' };

  if (status === 'cancelled') {
    if (rental.renterId !== actorId || !['requested', 'approved'].includes(rental.status)) return { error: 'FORBIDDEN' };
    rental.status = 'cancelled';
  } else if (['approved', 'rejected'].includes(status)) {
    if (rental.ownerId !== actorId || rental.status !== 'requested') return { error: 'FORBIDDEN' };
    if (status === 'approved') {
      const conflictingApproval = await Rental.exists({
        _id: { $ne: rental._id },
        equipmentId: rental.equipmentId,
        status: 'approved',
        startDate: { $lte: rental.endDate },
        endDate: { $gte: rental.startDate }
      });
      if (conflictingApproval) return { error: 'DATE_CONFLICT' };
      rental.status = 'approved';
      await Rental.updateMany({
        _id: { $ne: rental._id },
        equipmentId: rental.equipmentId,
        status: 'requested',
        startDate: { $lte: rental.endDate },
        endDate: { $gte: rental.startDate }
      }, { $set: { status: 'rejected' } });
    } else {
      rental.status = 'rejected';
    }
  } else if (status === 'completed') {
    if (rental.ownerId !== actorId || rental.status !== 'approved') return { error: 'FORBIDDEN' };
    rental.status = 'completed';
  } else {
    return { error: 'INVALID_STATUS' };
  }

  await rental.save();
  return { rental: serializeRental(rental, actorId) };
}

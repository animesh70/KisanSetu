import { getCollection, isMongoConfigured, MongoNotConfiguredError } from '../db/mongo.js';

export const LOT_GEO_COLLECTION = 'lot_geo';
export const DEFAULT_SHARED_LOGISTICS_RADIUS_KM = 15;
export const MAX_SHARED_LOGISTICS_RADIUS_KM = 50;
export const DEFAULT_SHARED_LOGISTICS_MAX_MATCHES = 20;
export const MAX_SHARED_LOGISTICS_MATCHES = 50;

const indexedCollections = new WeakSet();

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function normalizePickupPoint(value) {
  if (!value || value.type !== 'Point' || !Array.isArray(value.coordinates) || value.coordinates.length !== 2) return null;
  const longitude = finiteNumber(value.coordinates[0]);
  const latitude = finiteNumber(value.coordinates[1]);
  if (longitude === null || latitude === null) return null;
  if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) return null;
  return { type: 'Point', coordinates: [longitude, latitude] };
}

export function parseSharedRadiusKm(value, fallback = Number(process.env.SHARED_LOGISTICS_RADIUS_KM || DEFAULT_SHARED_LOGISTICS_RADIUS_KM)) {
  const parsedFallback = finiteNumber(fallback) ?? DEFAULT_SHARED_LOGISTICS_RADIUS_KM;
  const parsed = value === undefined || value === null || value === '' ? parsedFallback : finiteNumber(value);
  if (parsed === null || parsed <= 0) return null;
  return Math.min(parsed, MAX_SHARED_LOGISTICS_RADIUS_KM);
}

export function getSharedMaxMatches() {
  const configured = Number.parseInt(process.env.SHARED_LOGISTICS_MAX_MATCHES || `${DEFAULT_SHARED_LOGISTICS_MAX_MATCHES}`, 10);
  if (!Number.isInteger(configured) || configured < 1) return DEFAULT_SHARED_LOGISTICS_MAX_MATCHES;
  return Math.min(configured, MAX_SHARED_LOGISTICS_MATCHES);
}

export function canMirrorLot(lot) {
  return Boolean(
    lot?.id
    && lot?.farmerId
    && normalizePickupPoint(lot.pickupPoint)
    && String(lot.destinationMandiId || '').trim()
  );
}

function toGeoDocument(lot) {
  const pickupPoint = normalizePickupPoint(lot.pickupPoint);
  if (!pickupPoint) throw new TypeError('Lot pickupPoint must be a valid GeoJSON Point using [longitude, latitude].');
  const destinationDistanceKm = finiteNumber(lot.destinationDistanceKm);
  return {
    _id: String(lot.id),
    lotId: String(lot.id),
    farmerId: String(lot.farmerId),
    crop: String(lot.crop || ''),
    quantity: finiteNumber(lot.quantity) ?? 0,
    status: String(lot.status || 'open'),
    locationText: String(lot.location || ''),
    pickupPoint,
    destinationMandiId: String(lot.destinationMandiId || ''),
    destinationMandiName: String(lot.destinationMandiName || ''),
    destinationDistanceKm: destinationDistanceKm === null ? null : destinationDistanceKm,
    createdAt: lot.createdAt ? new Date(lot.createdAt) : new Date(),
    updatedAt: new Date()
  };
}

async function ensureIndexes(collection) {
  if (!collection || indexedCollections.has(collection)) return;
  await collection.createIndex({ pickupPoint: '2dsphere' }, { name: 'pickupPoint_2dsphere' });
  await collection.createIndex({ destinationMandiId: 1, status: 1 }, { name: 'destinationMandi_status' });
  indexedCollections.add(collection);
}

async function resolveCollection(collection) {
  const resolved = collection || await getCollection(LOT_GEO_COLLECTION);
  await ensureIndexes(resolved);
  return resolved;
}

export async function upsertLotGeo(lot, { collection } = {}) {
  if (!canMirrorLot(lot)) return { mirrored: false, reason: 'INCOMPLETE_GEO_DATA' };
  const resolved = await resolveCollection(collection);
  const document = toGeoDocument(lot);
  const { _id, ...mutableDocument } = document;
  await resolved.updateOne(
    { _id },
    { $set: mutableDocument },
    { upsert: true }
  );
  return { mirrored: true };
}

export async function deleteLotGeo(lotId, { collection } = {}) {
  if (!lotId) return { deletedCount: 0 };
  const resolved = await resolveCollection(collection);
  return resolved.deleteOne({ _id: String(lotId) });
}

export async function findNearbyLots({ lotId, pickupPoint, destinationMandiId, radiusMeters, maxResults = getSharedMaxMatches(), collection } = {}) {
  const normalizedPoint = normalizePickupPoint(pickupPoint);
  if (!normalizedPoint) throw new TypeError('A valid pickupPoint is required for shared-logistics search.');
  if (!destinationMandiId) throw new TypeError('destinationMandiId is required for shared-logistics search.');
  const safeRadius = finiteNumber(radiusMeters);
  if (safeRadius === null || safeRadius <= 0) throw new TypeError('radiusMeters must be a positive number.');
  const safeLimit = Math.min(Math.max(Number.parseInt(maxResults, 10) || DEFAULT_SHARED_LOGISTICS_MAX_MATCHES, 1), MAX_SHARED_LOGISTICS_MATCHES);

  const resolved = await resolveCollection(collection);
  const query = {
    _id: { $ne: String(lotId) },
    status: 'open',
    destinationMandiId: String(destinationMandiId),
    pickupPoint: {
      $near: {
        $geometry: normalizedPoint,
        $maxDistance: safeRadius
      }
    }
  };
  return resolved.find(query).limit(safeLimit).toArray();
}

export async function syncLotGeoBestEffort(lot) {
  if (!isMongoConfigured() || !canMirrorLot(lot)) return { mirrored: false, reason: 'NOT_CONFIGURED_OR_INCOMPLETE' };
  try {
    return await upsertLotGeo(lot);
  } catch (error) {
    console.warn('Shared logistics geo mirror update failed:', error?.name || 'Error');
    return { mirrored: false, reason: 'MONGO_ERROR' };
  }
}

export async function deleteLotGeoBestEffort(lotId) {
  if (!isMongoConfigured()) return { deletedCount: 0, reason: 'NOT_CONFIGURED' };
  try {
    return await deleteLotGeo(lotId);
  } catch (error) {
    console.warn('Shared logistics geo mirror delete failed:', error?.name || 'Error');
    return { deletedCount: 0, reason: 'MONGO_ERROR' };
  }
}

export { isMongoConfigured, MongoNotConfiguredError };

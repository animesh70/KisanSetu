import { syncLotGeoBestEffort } from '../repositories/lotGeoRepository.js';

const lotQueues = new Map();

// Offer acceptance and marketplace checkout share this per-lot queue so two
// asynchronous escrow requests cannot sell the same remaining quantity.
export async function withLotInventoryLock(lotId, operation) {
  const key = String(lotId);
  const previous = lotQueues.get(key) || Promise.resolve();
  let release;
  const current = new Promise((resolve) => { release = resolve; });
  lotQueues.set(key, current);
  await previous;
  try {
    return await operation();
  } finally {
    release();
    if (lotQueues.get(key) === current) lotQueues.delete(key);
  }
}

export function assertAvailableQuantity(lot, quantity) {
  const available = Number(lot?.quantity);
  if (lot?.status !== 'open' || !Number.isInteger(available) || available < 1
    || !Number.isInteger(quantity) || quantity < 1 || quantity > available) {
    throw Object.assign(new Error('The requested quantity is no longer available.'), { status: 409 });
  }
  return available - quantity;
}

export async function consumeLotInventory(lot, quantity, offers) {
  const remaining = assertAvailableQuantity(lot, quantity);
  lot.quantity = remaining;
  if (!remaining) lot.status = 'closed';
  for (const offer of offers) {
    if (offer.lotId !== lot.id || offer.status !== 'pending') continue;
    if (Number(offer.quantity) > remaining) offer.status = 'rejected';
    else offer.remainingQuantity = remaining - Number(offer.quantity);
  }
  await syncLotGeoBestEffort(lot);
  return remaining;
}

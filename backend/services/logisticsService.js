export const DEFAULT_TRANSACTION_STORAGE_DAYS = 5;

const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

function nonNegativeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function positiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

/**
 * Quotes a vehicle movement for one trade. The full vehicle-trip cost is
 * deliberately spread across the actual tradable quantity, so smaller lots
 * do not receive an unrealistically cheap per-quintal transport estimate.
 */
export function calculateTransportQuote({ quantity, distanceKm, capacity, ratePerKm } = {}) {
  const safeQuantity = positiveNumber(quantity);
  const safeCapacity = positiveNumber(capacity);
  const safeDistance = nonNegativeNumber(distanceKm);
  const safeRate = nonNegativeNumber(ratePerKm);

  if (!safeQuantity || !safeCapacity) {
    return {
      quantity: safeQuantity,
      distanceKm: safeDistance,
      capacity: safeCapacity,
      ratePerKm: safeRate,
      trips: 0,
      totalCost: 0,
      costPerQuintal: 0
    };
  }

  const trips = Math.ceil(safeQuantity / safeCapacity);
  const totalCost = roundMoney(safeRate * safeDistance * trips);
  return {
    quantity: safeQuantity,
    distanceKm: safeDistance,
    capacity: safeCapacity,
    ratePerKm: safeRate,
    trips,
    totalCost,
    costPerQuintal: roundMoney(totalCost / safeQuantity)
  };
}

export function calculateStorageQuote({ quantity, ratePerDay, holdingDays = DEFAULT_TRANSACTION_STORAGE_DAYS } = {}) {
  const safeQuantity = positiveNumber(quantity);
  const safeRate = nonNegativeNumber(ratePerDay);
  const safeHoldingDays = nonNegativeNumber(holdingDays);
  const totalCost = roundMoney(safeQuantity * safeRate * safeHoldingDays);
  return {
    quantity: safeQuantity,
    ratePerDay: safeRate,
    holdingDays: safeHoldingDays,
    trips: 0,
    totalCost,
    costPerQuintal: safeQuantity ? roundMoney(totalCost / safeQuantity) : 0
  };
}

export function getDefaultTransportOption(options = []) {
  return options.find((option) => option.available && option.type === 'Transport')
    || options.find((option) => option.type === 'Transport')
    || null;
}

export function getDefaultStorageOption(options = []) {
  return options.find((option) => option.available && option.type === 'Storage')
    || options.find((option) => option.type === 'Storage')
    || null;
}

export function calculateLogisticsQuote({ logisticsOption, quantity, distanceKm, holdingDays } = {}) {
  if (!logisticsOption) {
    return { type: null, provider: null, trips: 0, totalCost: 0, costPerQuintal: 0 };
  }

  if (logisticsOption.type === 'Transport') {
    return {
      type: 'Transport',
      provider: logisticsOption.provider,
      ...calculateTransportQuote({
        quantity,
        distanceKm,
        capacity: logisticsOption.capacity,
        ratePerKm: logisticsOption.ratePerKm
      })
    };
  }

  if (logisticsOption.type === 'Storage') {
    return {
      type: 'Storage',
      provider: logisticsOption.provider,
      ...calculateStorageQuote({
        quantity,
        ratePerDay: logisticsOption.ratePerDay,
        holdingDays
      })
    };
  }

  return { type: logisticsOption.type || null, provider: logisticsOption.provider || null, trips: 0, totalCost: 0, costPerQuintal: 0 };
}

export function calculateNetPayable({ grossAmount, logisticsFee = 0, platformFee = 0 } = {}) {
  return roundMoney(nonNegativeNumber(grossAmount) - nonNegativeNumber(logisticsFee) - nonNegativeNumber(platformFee));
}

export function haversineDistanceKm(pointA, pointB) {
  const a = pointA?.coordinates;
  const b = pointB?.coordinates;
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== 2 || b.length !== 2) return null;
  const [lon1, lat1] = a.map(Number);
  const [lon2, lat2] = b.map(Number);
  if (![lon1, lat1, lon2, lat2].every(Number.isFinite)) return null;
  const toRadians = (degrees) => degrees * Math.PI / 180;
  const earthRadiusKm = 6371.0088;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLon = toRadians(lon2 - lon1);
  const firstLat = toRadians(lat1);
  const secondLat = toRadians(lat2);
  const haversine = Math.sin(deltaLat / 2) ** 2
    + Math.cos(firstLat) * Math.cos(secondLat) * Math.sin(deltaLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function calculateSharedTransportQuote({ requestingLot, nearbyLots = [], logisticsOption } = {}) {
  const participants = [requestingLot, ...nearbyLots].filter(Boolean);
  const safeCapacity = positiveNumber(logisticsOption?.capacity);
  const safeRate = nonNegativeNumber(logisticsOption?.ratePerKm);
  if (!requestingLot || participants.length < 2 || !safeCapacity || !safeRate) {
    const solo = requestingLot ? calculateTransportQuote({
      quantity: requestingLot.quantity,
      distanceKm: requestingLot.destinationDistanceKm,
      capacity: safeCapacity,
      ratePerKm: safeRate
    }) : { trips: 0, totalCost: 0 };
    return {
      shareRecommended: false,
      reason: participants.length < 2 ? 'NO_NEARBY_LOTS' : 'INVALID_TRANSPORT_OPTION',
      lotCount: participants.length,
      totalQuantity: participants.reduce((sum, lot) => sum + positiveNumber(lot.quantity), 0),
      soloTrips: solo.trips || 0,
      sharedTrips: 0,
      estimatedSoloCost: solo.totalCost || 0,
      estimatedSharedCost: 0,
      estimatedSavings: 0,
      requestingLotShare: 0,
      requestingLotSavings: 0,
      pickupDetourKm: 0,
      sharedRouteDistanceKm: 0
    };
  }

  const totalQuantity = participants.reduce((sum, lot) => sum + positiveNumber(lot.quantity), 0);
  const soloQuotes = participants.map((lot) => calculateTransportQuote({
    quantity: lot.quantity,
    distanceKm: lot.destinationDistanceKm,
    capacity: safeCapacity,
    ratePerKm: safeRate
  }));
  const estimatedSoloCost = roundMoney(soloQuotes.reduce((sum, quote) => sum + quote.totalCost, 0));
  const soloTrips = soloQuotes.reduce((sum, quote) => sum + quote.trips, 0);
  const baseDistanceKm = Math.max(...participants.map((lot) => nonNegativeNumber(lot.destinationDistanceKm)), 0);
  const pickupDistances = nearbyLots
    .map((lot) => haversineDistanceKm(requestingLot.pickupPoint, lot.pickupPoint))
    .filter((distance) => Number.isFinite(distance));
  const pickupDetourKm = roundMoney(Math.max(0, ...pickupDistances));
  const sharedRouteDistanceKm = roundMoney(baseDistanceKm + pickupDetourKm);
  const sharedTrips = totalQuantity ? Math.ceil(totalQuantity / safeCapacity) : 0;
  const estimatedSharedCost = roundMoney(safeRate * sharedRouteDistanceKm * sharedTrips);
  const estimatedSavings = roundMoney(Math.max(0, estimatedSoloCost - estimatedSharedCost));
  const requestingQuantity = positiveNumber(requestingLot.quantity);
  const requestingLotShare = totalQuantity
    ? roundMoney(estimatedSharedCost * (requestingQuantity / totalQuantity))
    : 0;
  const requestingSoloCost = soloQuotes[0]?.totalCost || 0;
  const requestingLotSavings = roundMoney(Math.max(0, requestingSoloCost - requestingLotShare));
  const shareRecommended = estimatedSharedCost < estimatedSoloCost && requestingLotShare < requestingSoloCost;

  return {
    shareRecommended,
    reason: shareRecommended ? 'SAVINGS_AVAILABLE' : 'NO_ESTIMATED_SAVINGS',
    lotCount: participants.length,
    totalQuantity: roundMoney(totalQuantity),
    soloTrips,
    sharedTrips,
    estimatedSoloCost,
    estimatedSharedCost,
    estimatedSavings,
    requestingLotShare,
    requestingLotSavings,
    pickupDetourKm,
    sharedRouteDistanceKm
  };
}

export function buildSharedLogisticsGroup({ requestingLot, nearbyLots = [], logisticsOption } = {}) {
  return calculateSharedTransportQuote({ requestingLot, nearbyLots, logisticsOption });
}

export { roundMoney };

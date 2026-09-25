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

function transportOptions(options) {
  return options.filter((option) => option?.type === 'Transport' && option.available !== false
    && positiveNumber(option.capacity) && positiveNumber(option.ratePerKm));
}

function lotId(lot) {
  return String(lot.id || lot.lotId);
}

// First-fit decreasing keeps whole lots together where possible. A lot larger
// than the vehicle is split only because a single trip cannot carry it.
function packTrips(lots, capacity) {
  const pieces = lots.flatMap((lot) => {
    const parts = [];
    let remaining = positiveNumber(lot.quantity);
    while (remaining > 0) {
      const quantity = Math.min(remaining, capacity);
      parts.push({ lot, lotId: lotId(lot), quantity });
      remaining -= quantity;
    }
    return parts;
  }).sort((a, b) => b.quantity - a.quantity || a.lotId.localeCompare(b.lotId));
  const groups = [];
  for (const piece of pieces) {
    let group = groups.find((item) => item.totalQuantity + piece.quantity <= capacity);
    if (!group) {
      group = { totalQuantity: 0, lots: [] };
      groups.push(group);
    }
    group.lots.push(piece);
    group.totalQuantity += piece.quantity;
  }
  return groups;
}

function quotePooledTrips(lots, option, requestingId) {
  const capacity = positiveNumber(option.capacity);
  const rate = positiveNumber(option.ratePerKm);
  const tripGroups = packTrips(lots, capacity).map((group, index) => {
    const anchor = group.lots.find((piece) => piece.lotId === requestingId)?.lot || group.lots[0].lot;
    const pickupDetourKm = Math.max(0, ...group.lots.map((piece) =>
      haversineDistanceKm(anchor.pickupPoint, piece.lot.pickupPoint) || 0));
    const baseDistanceKm = Math.max(0, ...group.lots.map((piece) => nonNegativeNumber(piece.lot.destinationDistanceKm)));
    const routeDistanceKm = roundMoney(baseDistanceKm + pickupDetourKm);
    const cost = roundMoney(routeDistanceKm * rate);
    return {
      tripNumber: index + 1,
      capacity,
      totalQuantity: group.totalQuantity,
      lots: group.lots.map(({ lotId: id, quantity }) => ({ lotId: id, quantity })),
      pickupDetourKm: roundMoney(pickupDetourKm),
      routeDistanceKm,
      cost
    };
  });
  const estimatedSharedCost = roundMoney(tripGroups.reduce((sum, group) => sum + group.cost, 0));
  const requestingLotShare = roundMoney(tripGroups.reduce((sum, group) => {
    const requestingQuantity = group.lots.filter((piece) => piece.lotId === requestingId)
      .reduce((total, piece) => total + piece.quantity, 0);
    return sum + (group.totalQuantity ? group.cost * requestingQuantity / group.totalQuantity : 0);
  }, 0));
  return { option, tripGroups, estimatedSharedCost, requestingLotShare };
}

export function calculateSharedTransportQuote({ requestingLot, nearbyLots = [], logisticsOptions, logisticsOption } = {}) {
  const participants = [requestingLot, ...nearbyLots].filter((lot) => lot && positiveNumber(lot.quantity));
  const options = transportOptions(logisticsOptions || (logisticsOption ? [logisticsOption] : []));
  const totalQuantity = roundMoney(participants.reduce((sum, lot) => sum + Number(lot.quantity), 0));
  const soloQuotes = participants.map((lot) => options.map((option) => ({
    option,
    quote: calculateTransportQuote({ quantity: lot.quantity, distanceKm: lot.destinationDistanceKm,
      capacity: option.capacity, ratePerKm: option.ratePerKm })
  })).sort((a, b) => a.quote.totalCost - b.quote.totalCost)[0]);
  const estimatedSoloCost = roundMoney(soloQuotes.reduce((sum, item) => sum + (item?.quote.totalCost || 0), 0));
  const soloTrips = soloQuotes.reduce((sum, item) => sum + (item?.quote.trips || 0), 0);
  const requestingSoloCost = soloQuotes[0]?.quote.totalCost || 0;
  const requestingId = requestingLot ? lotId(requestingLot) : '';
  const best = requestingLot && participants.length > 1
    ? options.map((option) => quotePooledTrips(participants, option, requestingId))
      .sort((a, b) => a.estimatedSharedCost - b.estimatedSharedCost)[0]
    : null;
  const estimatedSharedCost = best?.estimatedSharedCost || 0;
  const requestingLotShare = best?.requestingLotShare || 0;
  const shareRecommended = Boolean(best && estimatedSharedCost < estimatedSoloCost
    && requestingLotShare < requestingSoloCost);
  return {
    shareRecommended,
    reason: !requestingLot || participants.length < 2 ? 'NO_NEARBY_LOTS'
      : !best ? 'INVALID_TRANSPORT_OPTION' : shareRecommended ? 'SAVINGS_AVAILABLE' : 'NO_ESTIMATED_SAVINGS',
    lotCount: participants.length,
    totalQuantity,
    soloTrips,
    sharedTrips: best?.tripGroups.length || 0,
    tripGroups: best?.tripGroups || [],
    transportProvider: best?.option.provider || null,
    transportOptionId: best?.option.id || null,
    vehicleCapacity: best?.option.capacity || null,
    ratePerKm: best?.option.ratePerKm || null,
    soloQuotes: soloQuotes.map((item, index) => ({ lotId: lotId(participants[index]),
      provider: item?.option.provider || null, trips: item?.quote.trips || 0, cost: item?.quote.totalCost || 0 })),
    estimatedSoloCost,
    requestingSoloCost,
    estimatedSharedCost,
    estimatedSavings: shareRecommended ? roundMoney(estimatedSoloCost - estimatedSharedCost) : 0,
    requestingLotShare,
    requestingLotSavings: shareRecommended ? roundMoney(requestingSoloCost - requestingLotShare) : 0,
    pickupDetourKm: roundMoney(Math.max(0, ...(best?.tripGroups || []).map((group) => group.pickupDetourKm))),
    sharedRouteDistanceKm: roundMoney(Math.max(0, ...(best?.tripGroups || []).map((group) => group.routeDistanceKm)))
  };
}

export function buildSharedLogisticsGroup(options = {}) {
  return calculateSharedTransportQuote(options);
}

export { roundMoney };

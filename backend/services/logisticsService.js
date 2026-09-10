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

export { roundMoney };

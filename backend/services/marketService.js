import { logisticsOptions, mandiPrices, trendByCrop } from '../data/sampleData.js';
import { calculateLogisticsQuote, getDefaultTransportOption } from './logisticsService.js';
import { parseQuantity } from './quantityService.js';

const DEFAULT_MARKET_QUANTITY = 100;

function getTrendKey(crop) {
  return Object.keys(trendByCrop).find((key) => key.toLowerCase() === String(crop || '').toLowerCase()) || 'Onion';
}

export function getPrices({ crop, district, quantity } = {}) {
  const safeQuantity = quantity === undefined || quantity === '' ? DEFAULT_MARKET_QUANTITY : parseQuantity(quantity);
  const transportOption = getDefaultTransportOption(logisticsOptions);
  return mandiPrices.filter((price) =>
    (!crop || price.crop.toLowerCase() === crop.toLowerCase()) &&
    (!district || price.district.toLowerCase() === district.toLowerCase())
  ).map((price) => {
    const quote = calculateLogisticsQuote({ logisticsOption: transportOption, quantity: safeQuantity, distanceKm: price.distanceKm });
    return {
      ...price,
      tradableQuantity: safeQuantity,
      remainingQuantity: 0,
      transportProvider: quote.provider,
      transportTrips: quote.trips,
      estimatedLogisticsTotal: quote.totalCost,
      estimatedLogisticsCost: quote.costPerQuintal,
      netPrice: Math.round((price.modalPrice - quote.costPerQuintal) * 100) / 100,
      grossAmount: price.modalPrice * safeQuantity,
      estimatedNetAmount: Math.round((price.modalPrice * safeQuantity - quote.totalCost) * 100) / 100
    };
  }).sort((a, b) => b.netPrice - a.netPrice);
}

export function getTrend(crop = 'Onion') {
  const values = trendByCrop[getTrendKey(crop)];
  return values.map((modalPrice, index) => ({ day: `Day ${index + 1}`, modalPrice }));
}

function getDemoForecast(crop = 'Onion') {
  const trend = getTrend(crop);
  const last = trend.at(-1).modalPrice;
  const slope = (last - trend[0].modalPrice) / (trend.length - 1);
  const forecast = Array.from({ length: 7 }, (_, index) => ({
    day: `+${index + 1} day`,
    predictedPrice: Math.round(last + slope * (index + 1))
  }));
  const predictedPeak = Math.max(...forecast.map((item) => item.predictedPrice));
  return {
    crop,
    unit: 'quintal',
    currentPrice: last,
    forecast,
    predictedPeak,
    predictedPeakDay: forecast.findIndex((item) => item.predictedPrice === predictedPeak) + 1,
    validationMAE: null
  };
}

export async function getForecast(crop = 'Onion') {
  const serviceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
  try {
    const response = await fetch(`${serviceUrl}/predict?crop=${encodeURIComponent(crop)}&days=7`, { signal: AbortSignal.timeout(1200) });
    if (!response.ok) throw new Error('Prediction service did not return a forecast');
    return { ...(await response.json()), source: 'ml-service' };
  } catch {
    return { ...getDemoForecast(crop), source: 'demo-fallback' };
  }
}

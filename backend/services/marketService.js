import { mandiPrices, onlineStorePrices, trendByCrop } from '../data/sampleData.js';

export function getPrices({ crop, district }) {
  return mandiPrices.filter((price) =>
    (!crop || price.crop.toLowerCase() === crop.toLowerCase()) &&
    (!district || price.district.toLowerCase() === district.toLowerCase())
  );
}

export function getTrend(crop = 'Onion') {
  const values = trendByCrop[crop] || trendByCrop.Onion;
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
  return { crop, currentPrice: last, forecast, predictedPeak: Math.max(...forecast.map((item) => item.predictedPrice)) };
}

export function getComparison() {
  return Object.keys(trendByCrop).map((crop) => {
    const records = mandiPrices.filter((price) => price.crop === crop);
    const mandiPrice = records.length ? Math.round(records.reduce((sum, price) => sum + price.modalPrice, 0) / records.length) : 0;
    const online = onlineStorePrices.find((item) => item.crop === crop);
    return { crop, mandiPrice, onlinePrice: online?.price || 0, platform: online?.platform || 'Online Store' };
  });
}

export async function getForecast(crop = 'Onion') {
  const serviceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
  try {
    const response = await fetch(`${serviceUrl}/predict?crop=${encodeURIComponent(crop)}&days=7`, { signal: AbortSignal.timeout(1200) });
    if (!response.ok) throw new Error('Prediction service did not return a forecast');
    return await response.json();
  } catch {
    return { ...getDemoForecast(crop), source: 'demo-fallback' };
  }
}

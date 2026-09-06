import { buyers, mandiPrices } from '../data/sampleData.js';
import { getForecast } from './marketService.js';
import { parseQuantity } from './quantityService.js';

// Demo transport model: ₹0.45 per km per quintal. It remains meaningful at larger lot sizes.
export const transportPerQuintal = (distanceKm) => Math.max(8, Math.round(Number(distanceKm) * 0.45));

export function getMatches(lot) {
  const eligibleBuyers = buyers.filter((buyer) => buyer.verified && buyer.crops.includes(lot.crop));
  const maxOffer = Math.max(...eligibleBuyers.map((buyer) => buyer.targetPrice), 1);
  const maxDistance = Math.max(...eligibleBuyers.map((buyer) => buyer.distanceKm || 0), 1);
  return eligibleBuyers
    .map((buyer) => {
      const quantityFit = Math.min(lot.quantity, buyer.requiredQuantity) / Math.max(lot.quantity, buyer.requiredQuantity);
      const gradeFit = buyer.requiredGrade === lot.grade ? 1 : 0.7;
      const priceScore = buyer.targetPrice / maxOffer;
      const distanceScore = 1 - ((buyer.distanceKm || maxDistance) / maxDistance);
      const score = Math.round((quantityFit * 30 + gradeFit * 20 + priceScore * 15 + distanceScore * 15 + (buyer.reliabilityScore / 5) * 20) * 10) / 10;
      const logisticsCost = transportPerQuintal(buyer.distanceKm);
      const scoreBreakdown = { offerPrice: Math.round(priceScore * 15), distance: Math.round(distanceScore * 15), quantityFit: Math.round(quantityFit * 30), grade: Math.round(gradeFit * 20), reliability: Math.round((buyer.reliabilityScore / 5) * 20) };
      return { ...buyer, matchScore: score, scoreBreakdown, estimatedLogisticsCost: logisticsCost, estimatedNetPrice: buyer.targetPrice - logisticsCost, reasons: [`${Math.round(priceScore * 100)}% offer-price score`, `${Math.round(distanceScore * 100)}% distance score`, `${Math.round(quantityFit * 100)}% quantity fit`, `${buyer.reliabilityScore}/5 reliability`] };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

export async function getSellingRecommendation({ crop = 'Onion', quantity = 100, grade = 'A' }) {
  const safeQuantity = parseQuantity(quantity);
  const lot = { crop, quantity: safeQuantity, grade };
  const matches = getMatches(lot);
  const forecast = await getForecast(crop);
  const market = mandiPrices.filter((item) => item.crop.toLowerCase() === crop.toLowerCase()).sort((a, b) => b.modalPrice - a.modalPrice)[0];
  const buyer = matches[0];
  const buyerLogistics = buyer ? transportPerQuintal(buyer.distanceKm) : 0;
  const marketOptions = mandiPrices.filter((item) => item.crop.toLowerCase() === crop.toLowerCase()).map((item) => ({ name: item.mandiName, grossPrice: item.modalPrice, distanceKm: item.distanceKm, estimatedLogisticsCost: transportPerQuintal(item.distanceKm), netPrice: item.modalPrice - transportPerQuintal(item.distanceKm), type: 'mandi' })).sort((a, b) => b.netPrice - a.netPrice);
  const buyerOptions = matches.map((item) => ({ name: item.companyName, grossPrice: item.targetPrice, distanceKm: item.distanceKm, estimatedLogisticsCost: item.estimatedLogisticsCost, netPrice: item.estimatedNetPrice, matchScore: item.matchScore, scoreBreakdown: item.scoreBreakdown, type: 'buyer' }));
  const options = [...marketOptions, ...buyerOptions].sort((a, b) => b.netPrice - a.netPrice);
  const expectedNetPrice = options[0]?.netPrice || 0;
  const peakIndex = forecast.forecast.reduce((bestIndex, point, index, values) => point.predictedPrice > values[bestIndex].predictedPrice ? index : bestIndex, 0);
  const daysToPeak = peakIndex + 1;
  const expectedGain = forecast.predictedPeak - forecast.currentPrice;
  const minimumWorthwhileGain = Math.max(50, Math.round(forecast.currentPrice * 0.02));
  const action = expectedGain >= minimumWorthwhileGain ? 'hold' : 'sell';
  return {
    crop,
    recommendedBuyer: buyer ? { id: buyer.id, name: buyer.companyName, offerPrice: buyer.targetPrice, matchScore: buyer.matchScore } : null,
    recommendedMarket: market ? { name: market.mandiName, modalPrice: market.modalPrice, distanceKm: market.distanceKm } : null,
    action,
    daysToPeak,
    expectedGain,
    sellingWindow: action === 'hold' ? `Hold for ${daysToPeak} day${daysToPeak === 1 ? '' : 's'}; sell near the predicted peak (storage required)` : 'Sell now; the forecast gain is too small to justify waiting',
    decisionText: action === 'hold' ? `Hold ${daysToPeak} day${daysToPeak === 1 ? '' : 's'} · expected +₹${expectedGain}/q` : `Sell now · only +₹${Math.max(expectedGain, 0)}/q expected by waiting`,
    expectedNetPrice,
    forecast: { currentPrice: forecast.currentPrice, predictedPeak: forecast.predictedPeak },
    options,
    reasons: ['Verified buyer ranked by price, distance, quantity fit and reliability', `Forecast peak is ₹${forecast.predictedPeak}/quintal on day ${daysToPeak}`, `Best option includes estimated transport of ₹${options[0]?.estimatedLogisticsCost || buyerLogistics}/quintal`]
  };
}

import { buyers, mandiPrices } from '../data/sampleData.js';
import { getForecast } from './marketService.js';

const transportPerQuintal = (distanceKm, quantity) => Math.round((Number(distanceKm) * 12) / Math.max(Number(quantity), 1));

export function getMatches(lot) {
  const maxOffer = Math.max(...buyers.map((buyer) => buyer.targetPrice));
  const maxDistance = Math.max(...buyers.map((buyer) => buyer.distanceKm || 0), 1);
  return buyers
    .filter((buyer) => buyer.verified && buyer.crops.includes(lot.crop))
    .map((buyer) => {
      const quantityFit = Math.min(lot.quantity, buyer.requiredQuantity) / Math.max(lot.quantity, buyer.requiredQuantity);
      const gradeFit = buyer.requiredGrade === lot.grade ? 1 : 0.7;
      const priceScore = buyer.targetPrice / maxOffer;
      const distanceScore = 1 - ((buyer.distanceKm || maxDistance) / maxDistance);
      const score = Math.round((quantityFit * 30 + gradeFit * 20 + priceScore * 15 + distanceScore * 15 + (buyer.reliabilityScore / 5) * 20) * 10) / 10;
      const logisticsCost = transportPerQuintal(buyer.distanceKm, lot.quantity);
      return { ...buyer, matchScore: score, estimatedLogisticsCost: logisticsCost, estimatedNetPrice: buyer.targetPrice - logisticsCost, reasons: [`${Math.round(priceScore * 100)}% offer-price score`, `${Math.round(distanceScore * 100)}% distance score`, `${Math.round(quantityFit * 100)}% quantity fit`, `${buyer.reliabilityScore}/5 reliability`] };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

export async function getSellingRecommendation({ crop = 'Onion', quantity = 100, grade = 'A' }) {
  const lot = { crop, quantity: Number(quantity), grade };
  const matches = getMatches(lot);
  const forecast = await getForecast(crop);
  const market = mandiPrices.filter((item) => item.crop.toLowerCase() === crop.toLowerCase()).sort((a, b) => b.modalPrice - a.modalPrice)[0];
  const buyer = matches[0];
  const buyerLogistics = buyer ? transportPerQuintal(buyer.distanceKm, quantity) : 0;
  const marketOptions = mandiPrices.filter((item) => item.crop.toLowerCase() === crop.toLowerCase()).map((item) => ({ name: item.mandiName, grossPrice: item.modalPrice, distanceKm: item.distanceKm, estimatedLogisticsCost: transportPerQuintal(item.distanceKm, quantity), netPrice: item.modalPrice - transportPerQuintal(item.distanceKm, quantity), type: 'mandi' })).sort((a, b) => b.netPrice - a.netPrice);
  const buyerOptions = matches.map((item) => ({ name: item.companyName, grossPrice: item.targetPrice, distanceKm: item.distanceKm, estimatedLogisticsCost: item.estimatedLogisticsCost, netPrice: item.estimatedNetPrice, matchScore: item.matchScore, type: 'buyer' }));
  const options = [...marketOptions, ...buyerOptions].sort((a, b) => b.netPrice - a.netPrice);
  const expectedNetPrice = options[0]?.netPrice || 0;
  const action = forecast.predictedPeak > forecast.currentPrice + 80 ? 'hold' : 'sell';
  return {
    crop,
    recommendedBuyer: buyer ? { id: buyer.id, name: buyer.companyName, offerPrice: buyer.targetPrice, matchScore: buyer.matchScore } : null,
    recommendedMarket: market ? { name: market.mandiName, modalPrice: market.modalPrice, distanceKm: market.distanceKm } : null,
    action,
    sellingWindow: action === 'hold' ? 'Wait about 5 days if storage is available' : 'Sell within 1–2 days',
    expectedNetPrice,
    forecast: { currentPrice: forecast.currentPrice, predictedPeak: forecast.predictedPeak },
    options,
    reasons: ['Verified buyer ranked by price, distance, quantity fit and reliability', `Demo forecast indicates a peak near ₹${forecast.predictedPeak}/quintal`, `Best option includes estimated transport of ₹${options[0]?.estimatedLogisticsCost || buyerLogistics}/quintal`]
  };
}

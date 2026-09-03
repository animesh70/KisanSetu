import { buyers, mandiPrices } from '../data/sampleData.js';
import { getForecast } from './marketService.js';

export function getMatches(lot) {
  return buyers
    .filter((buyer) => buyer.verified && buyer.crops.includes(lot.crop))
    .map((buyer) => {
      const quantityFit = Math.min(lot.quantity, buyer.requiredQuantity) / Math.max(lot.quantity, buyer.requiredQuantity);
      const gradeFit = buyer.requiredGrade === lot.grade ? 1 : 0.7;
      const score = Math.round((quantityFit * 45 + gradeFit * 25 + (buyer.reliabilityScore / 5) * 30) * 10) / 10;
      return { ...buyer, matchScore: score, reasons: [`Buys ${lot.crop}`, `${Math.round(quantityFit * 100)}% quantity fit`, `${buyer.reliabilityScore}/5 reliability`] };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

export async function getSellingRecommendation({ crop = 'Onion', quantity = 100, grade = 'A' }) {
  const lot = { crop, quantity: Number(quantity), grade };
  const matches = getMatches(lot);
  const forecast = await getForecast(crop);
  const market = mandiPrices.filter((item) => item.crop.toLowerCase() === crop.toLowerCase()).sort((a, b) => b.modalPrice - a.modalPrice)[0];
  const buyer = matches[0];
  const estimatedLogistics = market ? market.distanceKm * 12 / Math.max(Number(quantity), 1) : 0;
  const expectedNetPrice = Math.round((buyer?.targetPrice || market?.modalPrice || 0) - estimatedLogistics);
  return {
    crop,
    recommendedBuyer: buyer ? { id: buyer.id, name: buyer.companyName, offerPrice: buyer.targetPrice, matchScore: buyer.matchScore } : null,
    recommendedMarket: market ? { name: market.mandiName, modalPrice: market.modalPrice, distanceKm: market.distanceKm } : null,
    sellingWindow: forecast.predictedPeak > forecast.currentPrice ? 'Hold for 5–7 days if storage is available' : 'Sell within 1–2 days',
    expectedNetPrice,
    reasons: ['Verified buyer with the strongest crop/quantity match', `Forecast indicates a peak near ₹${forecast.predictedPeak}/quintal`, `Estimated transport cost: ₹${Math.round(estimatedLogistics)}/quintal`]
  };
}

import { buyers, logisticsOptions, mandiPrices } from '../data/sampleData.js';
import { getForecast } from './marketService.js';
import { calculateLogisticsQuote, getDefaultStorageOption, getDefaultTransportOption, roundMoney } from './logisticsService.js';
import { getTradableQuantity, parseQuantity } from './quantityService.js';

const MINIMUM_HOLD_ADVANTAGE_PER_QUINTAL = 25;

function cropMatches(item, crop) {
  return item.crop?.toLowerCase() === String(crop).toLowerCase();
}

function optionNetPrice(grossPrice, quote) {
  return roundMoney(Number(grossPrice || 0) - Number(quote.costPerQuintal || 0));
}

/**
 * Backward-compatible helper for callers that only need a per-quintal quote.
 * It delegates to the same capacity-aware transport model used everywhere.
 */
export function transportPerQuintal(distanceKm, quantity = 100, transportOption = getDefaultTransportOption(logisticsOptions)) {
  return calculateLogisticsQuote({ logisticsOption: transportOption, quantity, distanceKm }).costPerQuintal;
}

export function getMatches(lot, { buyerData = buyers, transportOption = getDefaultTransportOption(logisticsOptions) } = {}) {
  const lotQuantity = parseQuantity(lot.quantity);
  const eligibleBuyers = buyerData.filter((buyer) => buyer.verified && buyer.crops.includes(lot.crop));
  const maxOffer = Math.max(...eligibleBuyers.map((buyer) => buyer.targetPrice), 1);
  const maxDistance = Math.max(...eligibleBuyers.map((buyer) => buyer.distanceKm || 0), 1);

  return eligibleBuyers
    .map((buyer) => {
      const quantity = getTradableQuantity({ lotQuantity, buyerRequiredQuantity: buyer.requiredQuantity });
      const quantityFit = quantity.tradableQuantity / Math.max(lotQuantity, buyer.requiredQuantity);
      const gradeFit = buyer.requiredGrade === lot.grade ? 1 : 0.7;
      const priceScore = buyer.targetPrice / maxOffer;
      const distanceScore = 1 - ((buyer.distanceKm || maxDistance) / maxDistance);
      const score = Math.round((quantityFit * 30 + gradeFit * 20 + priceScore * 15 + distanceScore * 15 + (buyer.reliabilityScore / 5) * 20) * 10) / 10;
      const logistics = calculateLogisticsQuote({ logisticsOption: transportOption, quantity: quantity.tradableQuantity, distanceKm: buyer.distanceKm });
      const estimatedGrossAmount = roundMoney(buyer.targetPrice * quantity.tradableQuantity);
      const estimatedNetAmount = roundMoney(estimatedGrossAmount - logistics.totalCost);
      const estimatedNetPrice = quantity.tradableQuantity ? roundMoney(estimatedNetAmount / quantity.tradableQuantity) : 0;
      const scoreBreakdown = {
        offerPrice: Math.round(priceScore * 15),
        distance: Math.round(distanceScore * 15),
        quantityFit: Math.round(quantityFit * 30),
        grade: Math.round(gradeFit * 20),
        reliability: Math.round((buyer.reliabilityScore / 5) * 20)
      };

      return {
        ...buyer,
        matchScore: score,
        scoreBreakdown,
        tradableQuantity: quantity.tradableQuantity,
        remainingQuantity: quantity.remainingQuantity,
        transportProvider: logistics.provider,
        transportTrips: logistics.trips,
        estimatedLogisticsTotal: logistics.totalCost,
        estimatedLogisticsCost: logistics.costPerQuintal,
        estimatedGrossAmount,
        estimatedNetAmount,
        estimatedNetPrice,
        reasons: [
          `${Math.round(priceScore * 100)}% offer-price score`,
          `${Math.round(distanceScore * 100)}% distance score`,
          `${Math.round(quantityFit * 100)}% quantity fit`,
          `${buyer.reliabilityScore}/5 reliability`
        ]
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

function getMarketOptions({ crop, quantity, marketData, transportOption }) {
  return marketData
    .filter((item) => cropMatches(item, crop))
    .map((item) => {
      const logistics = calculateLogisticsQuote({ logisticsOption: transportOption, quantity, distanceKm: item.distanceKm });
      const grossAmount = roundMoney(item.modalPrice * quantity);
      const netPrice = optionNetPrice(item.modalPrice, logistics);
      return {
        id: item.id,
        name: item.mandiName,
        grossPrice: item.modalPrice,
        distanceKm: item.distanceKm,
        tradableQuantity: quantity,
        remainingQuantity: 0,
        transportProvider: logistics.provider,
        transportTrips: logistics.trips,
        estimatedLogisticsTotal: logistics.totalCost,
        estimatedLogisticsCost: logistics.costPerQuintal,
        grossAmount,
        estimatedNetAmount: roundMoney(grossAmount - logistics.totalCost),
        netPrice,
        type: 'mandi'
      };
    })
    .sort((a, b) => b.netPrice - a.netPrice);
}

function getBuyerOptions(matches) {
  return matches
    .map((item) => ({
      id: item.id,
      name: item.companyName,
      grossPrice: item.targetPrice,
      distanceKm: item.distanceKm,
      tradableQuantity: item.tradableQuantity,
      remainingQuantity: item.remainingQuantity,
      transportProvider: item.transportProvider,
      transportTrips: item.transportTrips,
      estimatedLogisticsTotal: item.estimatedLogisticsTotal,
      estimatedLogisticsCost: item.estimatedLogisticsCost,
      grossAmount: item.estimatedGrossAmount,
      estimatedNetAmount: item.estimatedNetAmount,
      netPrice: item.estimatedNetPrice,
      matchScore: item.matchScore,
      scoreBreakdown: item.scoreBreakdown,
      type: 'buyer'
    }))
    .sort((a, b) => b.netPrice - a.netPrice);
}

function getForecastPoints(forecast) {
  return Array.isArray(forecast?.forecast)
    ? forecast.forecast.filter((point) => Number.isFinite(Number(point.predictedPrice)))
    : [];
}

/**
 * Pure recommendation builder, exported so sell/hold economics can be tested
 * without depending on a running ML service.
 */
export function buildSellingRecommendation({
  crop = 'Onion',
  quantity = 100,
  grade = 'A',
  forecast,
  buyerData = buyers,
  marketData = mandiPrices,
  logisticsData = logisticsOptions
} = {}) {
  const safeQuantity = parseQuantity(quantity);
  const transportOption = getDefaultTransportOption(logisticsData);
  const storageOption = getDefaultStorageOption(logisticsData);
  const lot = { crop, quantity: safeQuantity, grade };
  const matches = getMatches(lot, { buyerData, transportOption });
  const marketOptions = getMarketOptions({ crop, quantity: safeQuantity, marketData, transportOption });
  const buyerOptions = getBuyerOptions(matches);
  const options = [...marketOptions, ...buyerOptions].sort((a, b) => b.netPrice - a.netPrice);
  // A partial buyer offer remains useful to show, but it must not become the
  // whole-lot recommendation or payout for a farmer with unsold quantity.
  const fullLotOptions = options.filter((option) => option.remainingQuantity === 0);
  const sellNowOption = fullLotOptions[0] || options[0] || null;
  const sellNowNetPrice = sellNowOption?.netPrice || 0;
  const futureRoute = marketOptions[0] || sellNowOption;
  const forecastPoints = getForecastPoints(forecast);
  const holdOptions = forecastPoints.map((point, index) => {
    const days = index + 1;
    const storage = calculateLogisticsQuote({ logisticsOption: storageOption, quantity: safeQuantity, holdingDays: days });
    const transportCostPerQuintal = futureRoute?.estimatedLogisticsCost || 0;
    const transportTotal = futureRoute?.estimatedLogisticsTotal || 0;
    const grossAmount = roundMoney(Number(point.predictedPrice) * safeQuantity);
    const netPrice = roundMoney(Number(point.predictedPrice) - storage.costPerQuintal - transportCostPerQuintal);
    return {
      day: days,
      forecastGrossPrice: Number(point.predictedPrice),
      storageCostPerQuintal: storage.costPerQuintal,
      storageCostTotal: storage.totalCost,
      transportCostPerQuintal,
      transportCostTotal: transportTotal,
      netPrice,
      estimatedNetAmount: roundMoney(grossAmount - storage.totalCost - transportTotal)
    };
  });
  const bestHoldOption = holdOptions.reduce((best, option) => (!best || option.netPrice > best.netPrice ? option : best), null);
  const bestHoldNetPrice = bestHoldOption?.netPrice || sellNowNetPrice;
  const netAdvantage = roundMoney(bestHoldNetPrice - sellNowNetPrice);
  const forecastMAE = Number.isFinite(Number(forecast?.validationMAE)) ? Number(forecast.validationMAE) : null;
  const worthwhileAdvantage = Math.max(MINIMUM_HOLD_ADVANTAGE_PER_QUINTAL, forecastMAE || 0);
  const storageAvailable = Boolean(storageOption && storageOption.available !== false);
  const action = storageAvailable && bestHoldOption && netAdvantage > worthwhileAdvantage ? 'hold' : 'sell';
  const rawPeak = forecastPoints.reduce((best, point, index) => (!best || Number(point.predictedPrice) > best.price ? { price: Number(point.predictedPrice), day: index + 1 } : best), null);
  const daysToPeak = action === 'hold' ? bestHoldOption.day : (rawPeak?.day || 0);
  const expectedGain = rawPeak ? roundMoney(rawPeak.price - Number(forecast?.currentPrice || 0)) : 0;
  const expectedNetPrice = action === 'hold' ? bestHoldNetPrice : sellNowNetPrice;
  const bestBuyerOption = buyerOptions.find((option) => option.remainingQuantity === 0) || buyerOptions[0];
  const bestBuyerMatch = matches.find((item) => item.id === bestBuyerOption?.id);
  const recommendedBuyer = bestBuyerMatch
    ? {
        id: bestBuyerMatch.id,
        name: bestBuyerMatch.companyName,
        offerPrice: bestBuyerMatch.targetPrice,
        matchScore: bestBuyerMatch.matchScore,
        tradableQuantity: bestBuyerMatch.tradableQuantity,
        remainingQuantity: bestBuyerMatch.remainingQuantity,
        transportTrips: bestBuyerMatch.transportTrips,
        estimatedLogisticsTotal: bestBuyerMatch.estimatedLogisticsTotal,
        estimatedLogisticsCost: bestBuyerMatch.estimatedLogisticsCost,
        estimatedNetPrice: bestBuyerMatch.estimatedNetPrice
      }
    : null;
  const recommendedMarket = marketOptions[0]
    ? {
        name: marketOptions[0].name,
        modalPrice: marketOptions[0].grossPrice,
        distanceKm: marketOptions[0].distanceKm,
        transportTrips: marketOptions[0].transportTrips,
        estimatedLogisticsCost: marketOptions[0].estimatedLogisticsCost,
        netPrice: marketOptions[0].netPrice
      }
    : null;
  const holdingCostPerQuintal = bestHoldOption?.storageCostPerQuintal || 0;
  const holdingCostTotal = bestHoldOption?.storageCostTotal || 0;
  const sellReason = bestHoldOption
    ? `Best current net is ₹${sellNowNetPrice}/q; waiting ${bestHoldOption.day} day${bestHoldOption.day === 1 ? '' : 's'} leaves ₹${bestHoldNetPrice}/q after ₹${holdingCostPerQuintal}/q storage.`
    : `Best current net is ₹${sellNowNetPrice}/q. No forecast period is available for a hold comparison.`;
  const uncertaintyReason = forecastMAE
    ? `Forecast validation MAE is ₹${forecastMAE}/q, so a hold needs more than that expected advantage.`
    : 'Forecast fallback has no validation error estimate, so this is labelled as demo guidance.';

  return {
    crop,
    quantity: safeQuantity,
    recommendedBuyer,
    recommendedMarket,
    action,
    recommendedAction: action,
    daysToPeak,
    expectedGain,
    sellingWindow: action === 'hold'
      ? `Hold for ${bestHoldOption.day} day${bestHoldOption.day === 1 ? '' : 's'}; estimated net improves after storage costs.`
      : 'Sell now; waiting does not improve the estimated net enough after storage and forecast uncertainty.',
    decisionText: action === 'hold'
      ? `Hold ${bestHoldOption.day} day${bestHoldOption.day === 1 ? '' : 's'} · estimated +₹${netAdvantage}/q net after storage`
      : `Sell now · waiting changes estimated net by ₹${netAdvantage}/q after storage`,
    expectedNetPrice,
    sellNowNetPrice,
    sellNowOption,
    bestHoldNetPrice,
    bestHoldOption,
    holdingCostPerQuintal,
    holdingCostTotal,
    netAdvantage,
    forecastMAE,
    forecast: {
      currentPrice: Number(forecast?.currentPrice || 0),
      predictedPeak: rawPeak?.price || 0,
      predictedPeakDay: rawPeak?.day || 0,
      source: forecast?.source || 'demo-fallback'
    },
    estimatedPayout: action === 'hold' ? bestHoldOption?.estimatedNetAmount || 0 : sellNowOption?.estimatedNetAmount || 0,
    options,
    reasons: action === 'hold'
      ? [
          `Best current ${sellNowOption?.type || 'sale'} option nets ₹${sellNowNetPrice}/q.`,
          `Waiting ${bestHoldOption.day} days adds ₹${holdingCostPerQuintal}/q storage and leaves an estimated +₹${netAdvantage}/q net gain.`,
          uncertaintyReason
        ]
      : [sellReason, uncertaintyReason, `Best current option includes ₹${sellNowOption?.estimatedLogisticsCost || 0}/q estimated transport.`]
  };
}

export async function getSellingRecommendation({ crop = 'Onion', quantity = 100, grade = 'A' } = {}) {
  const safeQuantity = parseQuantity(quantity);
  const forecast = await getForecast(crop);
  return buildSellingRecommendation({ crop, quantity: safeQuantity, grade, forecast });
}

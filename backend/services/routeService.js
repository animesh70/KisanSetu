import { buyers, cropLots, users } from '../data/sampleData.js';
import { haversineDistanceKm, roundMoney } from './logisticsService.js';

const LOCATION_POINTS = {
  pune: [73.8567, 18.5204],
  nashik: [73.7898, 19.9975],
  niphad: [74.08, 20.08],
  mumbai: [72.8777, 19.076],
  akola: [77.0082, 20.7002],
  lasalgaon: [74.2333, 20.15],
  pimpalgaon: [73.982, 20.1667],
  bhubaneswar: [85.8245, 20.2961],
  cuttack: [85.8793, 20.4625]
};

function pointFromCoordinates(coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) return null;
  const [lon, lat] = coordinates.map(Number);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  if (lon < -180 || lon > 180 || lat < -90 || lat > 90) return null;
  return { type: 'Point', coordinates: [lon, lat] };
}

export function pointForLocation(value) {
  const text = String(value || '').toLowerCase();
  const match = Object.entries(LOCATION_POINTS)
    .map(([name, coordinates]) => ({ name, coordinates, index: text.indexOf(name) }))
    .filter((item) => item.index >= 0)
    // Location labels are written from the specific pickup place to the broader
    // district (for example "Niphad, Nashik"). Prefer the first named place so
    // the district does not collapse both route endpoints to the same point.
    .sort((left, right) => left.index - right.index || right.name.length - left.name.length)[0];
  return match ? pointFromCoordinates(match.coordinates) : null;
}

export function getTransactionRouteContext(transaction, { lotData = cropLots, buyerData = buyers, userData = users } = {}) {
  if (!transaction) return null;
  const lot = lotData.find((item) => item.id === transaction.lotId);
  const buyer = buyerData.find((item) => item.id === transaction.buyerId);
  const farmer = userData.find((item) => item.id === transaction.farmerId);
  const pickupPoint = pointFromCoordinates(transaction.pickupPoint?.coordinates)
    || pointFromCoordinates(lot?.pickupPoint?.coordinates)
    || pointForLocation(transaction.pickupLocation || lot?.location)
    || pointForLocation(farmer?.location?.district);
  const destinationPoint = pointFromCoordinates(transaction.destinationPoint?.coordinates)
    || pointForLocation(transaction.destinationLocation)
    || pointFromCoordinates(buyer?.geoPoint?.coordinates)
    || pointForLocation(buyer?.location);

  return {
    transaction,
    lot,
    buyer,
    pickupPoint,
    destinationPoint,
    pickupLabel: transaction.pickupLocation || lot?.location || farmer?.location?.district || 'Pickup',
    destinationLabel: transaction.destinationLocation || [buyer?.companyName, buyer?.location].filter(Boolean).join(' · ') || 'Buyer destination'
  };
}

function estimatedCoordinates(start, end, bend = 0) {
  const [startLon, startLat] = start.coordinates;
  const [endLon, endLat] = end.coordinates;
  const deltaLon = endLon - startLon;
  const deltaLat = endLat - startLat;
  const length = Math.hypot(deltaLon, deltaLat) || 1;
  const perpendicularLon = -deltaLat / length;
  const perpendicularLat = deltaLon / length;
  const offset = Math.min(0.34, Math.max(0.08, length * 0.18)) * bend;
  const pointAt = (ratio, offsetRatio) => [
    startLon + (deltaLon * ratio) + (perpendicularLon * offset * offsetRatio),
    startLat + (deltaLat * ratio) + (perpendicularLat * offset * offsetRatio)
  ];

  return [
    start.coordinates,
    pointAt(0.25, 0.58),
    pointAt(0.5, 1),
    pointAt(0.75, 0.58),
    end.coordinates
  ];
}

function fallbackRoutes(start, end) {
  const directDistance = haversineDistanceKm(start, end) || 0;
  const variants = [
    { id: 'route-estimated-1', bend: 0, distanceFactor: 1.18, speedKph: 46 },
    { id: 'route-estimated-2', bend: 1, distanceFactor: 1.29, speedKph: 44 },
    { id: 'route-estimated-3', bend: -1.28, distanceFactor: 1.39, speedKph: 42 }
  ];

  return variants.map((variant, index) => {
    const distanceKm = roundMoney(directDistance * variant.distanceFactor);
    return {
      id: variant.id,
      distanceKm,
      durationMinutes: Math.max(1, Math.round((distanceKm / variant.speedKph) * 60)),
      coordinates: estimatedCoordinates(start, end, variant.bend),
      source: 'estimated',
      isBest: index === 0
    };
  });
}

function normaliseOsrmRoutes(payload) {
  const rawRoutes = Array.isArray(payload?.routes) ? payload.routes : [];
  return rawRoutes
    .filter((route) => Array.isArray(route?.geometry?.coordinates) && route.geometry.coordinates.length >= 2)
    .map((route, index) => ({
      id: `route-${index + 1}`,
      distanceKm: roundMoney(Number(route.distance || 0) / 1000),
      durationMinutes: Math.max(1, Math.round(Number(route.duration || 0) / 60)),
      coordinates: route.geometry.coordinates,
      source: 'osrm',
      isBest: false
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm || a.durationMinutes - b.durationMinutes)
    .map((route, index) => ({ ...route, isBest: index === 0 }));
}

export async function calculateTransactionRoutes(transaction, { fetchImpl = globalThis.fetch, lotData, buyerData, userData } = {}) {
  const context = getTransactionRouteContext(transaction, { lotData, buyerData, userData });
  if (!context?.pickupPoint || !context?.destinationPoint) {
    const error = new Error('Pickup or buyer destination coordinates are unavailable for this transaction.');
    error.code = 'ROUTE_COORDINATES_UNAVAILABLE';
    throw error;
  }

  const [startLon, startLat] = context.pickupPoint.coordinates;
  const [endLon, endLat] = context.destinationPoint.coordinates;
  let routes = [];
  if (typeof fetchImpl === 'function') {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?alternatives=3&overview=full&geometries=geojson&steps=false`;
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeout = controller ? setTimeout(() => controller.abort(), 5000) : null;
      try {
        const response = await fetchImpl(url, { headers: { 'User-Agent': 'KisanSetu/1.0 route-demo' }, ...(controller ? { signal: controller.signal } : {}) });
        if (response?.ok) routes = normaliseOsrmRoutes(await response.json());
      } finally {
        if (timeout) clearTimeout(timeout);
      }
    } catch {
      routes = [];
    }
  }
  if (!routes.length) routes = fallbackRoutes(context.pickupPoint, context.destinationPoint);

  const best = routes.find((route) => route.isBest) || routes[0];
  return {
    transactionId: transaction.id,
    crop: transaction.crop || context.lot?.crop || 'Crop',
    quantity: Number(transaction.quantity || 0),
    pickup: { label: context.pickupLabel, point: context.pickupPoint },
    destination: { label: context.destinationLabel, point: context.destinationPoint },
    routes,
    routeCount: routes.length,
    bestRouteId: best.id,
    bestDistanceKm: best.distanceKm,
    bestDurationMinutes: best.durationMinutes,
    source: best.source
  };
}

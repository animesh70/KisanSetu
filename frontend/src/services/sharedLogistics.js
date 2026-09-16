export function buildPickupPoint(position) {
  const longitude = Number(position?.coords?.longitude);
  const latitude = Number(position?.coords?.latitude);
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new TypeError('Invalid longitude.');
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) throw new TypeError('Invalid latitude.');
  return { type: 'Point', coordinates: [longitude, latitude] };
}

export function canUseSharedLogistics(lot) {
  return Boolean(lot?.status !== 'closed' && lot?.sharedLogisticsReady && lot?.destinationMandiId);
}

export function sharedLogisticsStatusKey(payload) {
  if (!payload?.eligible) {
    if (payload?.reason === 'MISSING_GEO_DATA') return 'missingGeo';
    if (payload?.reason === 'LOT_NOT_OPEN') return 'lotClosed';
    return 'unavailable';
  }
  if (!payload?.nearbyLotCount) return 'noNearby';
  if (!payload?.group?.shareRecommended) return 'notRecommended';
  return 'available';
}

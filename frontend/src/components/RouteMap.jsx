import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const WIDTH = 900;
const HEIGHT = 430;
const TILE = 256;
const ROUTE_COLORS = ['#17884a', '#e47d1f', '#2f6fce', '#8b55c5', '#c04462'];

export function routeColor(route, index = 0) {
  if (route?.isBest) return ROUTE_COLORS[0];
  return ROUTE_COLORS[(index % (ROUTE_COLORS.length - 1)) + 1];
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function worldPoint([lon, lat], zoom) {
  const safeLat = clamp(Number(lat), -85.0511, 85.0511);
  const safeLon = Number(lon);
  const scale = TILE * (2 ** zoom);
  const x = ((safeLon + 180) / 360) * scale;
  const radians = safeLat * Math.PI / 180;
  const y = (1 - Math.log(Math.tan(radians) + (1 / Math.cos(radians))) / Math.PI) / 2 * scale;
  return [x, y];
}

function routeCoordinates(routes = []) {
  return routes.flatMap((route) => Array.isArray(route?.coordinates) ? route.coordinates : []);
}

function alternativeNumber(routes, routeIndex) {
  return routes.slice(0, routeIndex + 1).filter((route) => !route.isBest).length;
}

function chooseViewport(routes) {
  const coords = routeCoordinates(routes);
  if (!coords.length) return null;
  let chosenZoom = 6;
  let chosen = null;
  for (let zoom = 14; zoom >= 5; zoom -= 1) {
    const projected = coords.map((coord) => worldPoint(coord, zoom));
    const xs = projected.map(([x]) => x);
    const ys = projected.map(([, y]) => y);
    const minX = Math.min(...xs); const maxX = Math.max(...xs);
    const minY = Math.min(...ys); const maxY = Math.max(...ys);
    if ((maxX - minX) <= WIDTH - 120 && (maxY - minY) <= HEIGHT - 100) {
      chosenZoom = zoom;
      chosen = { minX, maxX, minY, maxY };
      break;
    }
    if (zoom === 5) { chosenZoom = zoom; chosen = { minX, maxX, minY, maxY }; }
  }
  const centerX = (chosen.minX + chosen.maxX) / 2;
  const centerY = (chosen.minY + chosen.maxY) / 2;
  return { zoom: chosenZoom, left: centerX - WIDTH / 2, top: centerY - HEIGHT / 2 };
}

function sampleCoordinates(coords = [], maxPoints = 700) {
  if (coords.length <= maxPoints) return coords;
  const step = Math.ceil(coords.length / maxPoints);
  const sampled = coords.filter((_, index) => index % step === 0);
  if (sampled.at(-1) !== coords.at(-1)) sampled.push(coords.at(-1));
  return sampled;
}

function svgPoints(coords, viewport) {
  return sampleCoordinates(coords).map((coord) => {
    const [x, y] = worldPoint(coord, viewport.zoom);
    return `${(x - viewport.left).toFixed(1)},${(y - viewport.top).toFixed(1)}`;
  }).join(' ');
}

export default function RouteMap({ routes = [], pickup, destination, selectedRouteId = '' }) {
  const { t } = useTranslation();
  const viewport = useMemo(() => chooseViewport(routes), [routes]);
  const tiles = useMemo(() => {
    if (!viewport) return [];
    const n = 2 ** viewport.zoom;
    const startX = Math.floor(viewport.left / TILE) - 1;
    const endX = Math.floor((viewport.left + WIDTH) / TILE) + 1;
    const startY = Math.max(0, Math.floor(viewport.top / TILE) - 1);
    const endY = Math.min(n - 1, Math.floor((viewport.top + HEIGHT) / TILE) + 1);
    const next = [];
    for (let x = startX; x <= endX; x += 1) {
      for (let y = startY; y <= endY; y += 1) {
        const wrappedX = ((x % n) + n) % n;
        next.push({ x, y, wrappedX, href: `https://tile.openstreetmap.org/${viewport.zoom}/${wrappedX}/${y}.png` });
      }
    }
    return next;
  }, [viewport]);

  if (!viewport || !routes.length) return <div className="route-map route-map-empty"/>;
  const pickupCoord = pickup?.point?.coordinates || routes[0]?.coordinates?.[0];
  const destinationCoord = destination?.point?.coordinates || routes[0]?.coordinates?.at(-1);
  const pickupPixel = pickupCoord ? worldPoint(pickupCoord, viewport.zoom) : null;
  const destinationPixel = destinationCoord ? worldPoint(destinationCoord, viewport.zoom) : null;
  const indexedRoutes = routes.map((route, index) => ({ route, index }));
  const orderedRoutes = [...indexedRoutes].sort((left, right) => {
    const leftSelected = left.route.id === selectedRouteId;
    const rightSelected = right.route.id === selectedRouteId;
    if (leftSelected !== rightSelected) return Number(leftSelected) - Number(rightSelected);
    return Number(left.route.isBest) - Number(right.route.isBest);
  });

  return (
    <div className="route-map">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={t('routePlanner.mapAria')}>
        <rect width={WIDTH} height={HEIGHT} className="route-map-fallback"/>
        {tiles.map((tile) => (
          <image
            key={`${tile.x}-${tile.y}`}
            href={tile.href}
            x={(tile.x * TILE) - viewport.left}
            y={(tile.y * TILE) - viewport.top}
            width={TILE}
            height={TILE}
            preserveAspectRatio="none"
          />
        ))}
        <rect width={WIDTH} height={HEIGHT} className="route-map-wash"/>
        {orderedRoutes.map(({ route, index }) => (
          <polyline
            key={route.id}
            points={svgPoints(route.coordinates || [], viewport)}
            className={`route-line ${route.isBest ? 'route-line-best' : 'route-line-alternative'} ${route.id === selectedRouteId ? 'is-selected' : ''}`}
            style={{ stroke: routeColor(route, index) }}
            data-route-id={route.id}
            fill="none"
          />
        ))}
        {pickupPixel && <g transform={`translate(${pickupPixel[0] - viewport.left} ${pickupPixel[1] - viewport.top})`}>
          <circle r="10" className="route-pin route-pin-start-ring"/>
          <circle r="5" className="route-pin route-pin-start"/>
        </g>}
        {destinationPixel && <g transform={`translate(${destinationPixel[0] - viewport.left} ${destinationPixel[1] - viewport.top})`}>
          <circle r="10" className="route-pin route-pin-end-ring"/>
          <circle r="5" className="route-pin route-pin-end"/>
        </g>}
      </svg>
      <div className="route-map-legend" aria-hidden="true">{routes.map((route, index) => <span key={route.id}><i style={{ backgroundColor: routeColor(route, index) }}/>{route.isBest ? t('routePlanner.bestShortest') : t('routePlanner.alternative', { number: alternativeNumber(routes, index) })}</span>)}</div>
      <small className="route-map-attribution">© OpenStreetMap contributors · Routing by OSRM</small>
    </div>
  );
}

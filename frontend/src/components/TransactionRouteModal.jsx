import { useEffect, useState } from 'react';
import { Clock3, MapPin, Maximize2, Minimize2, Route, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api.js';
import RouteMap from './RouteMap.jsx';
import EquipmentRentalActivityLoader from './EquipmentRentalActivityLoader.jsx';

export default function TransactionRouteModal({ transaction, onClose }) {
  const { t } = useTranslation();
  const [routeData, setRouteData] = useState(null);
  const [routeLoading, setRouteLoading] = useState(true);
  const [routeError, setRouteError] = useState('');
  const [panelMode, setPanelMode] = useState('compact');
  const [selectedRouteId, setSelectedRouteId] = useState('');

  useEffect(() => {
    let alive = true;
    setRouteLoading(true); setRouteError(''); setRouteData(null);
    api.getTransactionRoutes(transaction.id)
      .then((result) => {
        if (!alive) return;
        setRouteData(result);
        setSelectedRouteId(result?.routes?.find((route) => route.isBest)?.id || result?.routes?.[0]?.id || '');
      })
      .catch((error) => { if (alive) setRouteError(error.message || t('routePlanner.routeUnavailable')); })
      .finally(() => { if (alive) setRouteLoading(false); });
    return () => { alive = false; };
  }, [transaction.id, t]);

  const best = routeData?.routes?.find((route) => route.isBest) || routeData?.routes?.[0];
  const selectedRoute = routeData?.routes?.find((route) => route.id === selectedRouteId) || best;

  return (
    <div className={`route-modal-layer is-${panelMode}`} role="region" aria-labelledby="route-modal-title">
      <section className="route-modal">
        <header className="route-modal-head">
          <div><p className="eyebrow">{t('routePlanner.eyebrow')}</p><h2 id="route-modal-title">{t('routePlanner.plannerName')}</h2><small>{transaction.crop} · {transaction.quantity} {t('page.quintals')} · {transaction.buyerName}</small></div>
          <div className="route-panel-controls">
            <button type="button" className="icon-button" aria-label={panelMode === 'expanded' ? t('routePlanner.compact') : t('routePlanner.expand')} title={panelMode === 'expanded' ? t('routePlanner.compact') : t('routePlanner.expand')} onClick={() => setPanelMode(panelMode === 'expanded' ? 'compact' : 'expanded')}>{panelMode === 'expanded' ? <Minimize2 size={18}/> : <Maximize2 size={18}/>}</button>
            <button type="button" className="icon-button" aria-label={t('page.close')} onClick={onClose}><X size={19}/></button>
          </div>
        </header>

        <div className="route-modal-body">
          {routeLoading ? <EquipmentRentalActivityLoader className="route-loading-loader" label={t('routePlanner.calculating')} title={t('routePlanner.calculating')} subtitle={t('routePlanner.calculatingHint')}/> : routeError ? <div className="route-modal-error">{routeError}</div> : routeData && <>
            <div className="route-summary-grid">
              <span><MapPin size={16}/><small>{t('routePlanner.pickup')}</small><strong>{routeData.pickup?.label}</strong></span>
              <span><MapPin size={16}/><small>{t('routePlanner.destination')}</small><strong>{routeData.destination?.label}</strong></span>
              <span className="route-best-stat"><Route size={16}/><small>{selectedRoute?.isBest ? t('routePlanner.bestDistance') : t('routePlanner.selectedRoute')}</small><strong>{selectedRoute?.distanceKm} km</strong></span>
              <span><Clock3 size={16}/><small>{t('routePlanner.estimatedTime')}</small><strong>{selectedRoute?.durationMinutes} min</strong></span>
            </div>
            <RouteMap routes={routeData.routes || []} pickup={routeData.pickup} destination={routeData.destination} selectedRouteId={selectedRouteId}/>
            <div className="route-alternatives">
              {(routeData.routes || []).map((route, index, routes) => <button type="button" key={route.id} aria-pressed={selectedRouteId === route.id} onClick={() => setSelectedRouteId(route.id)} className={`${route.isBest ? 'route-option is-best' : 'route-option'} ${selectedRouteId === route.id ? 'is-selected' : ''}`}><span>{route.isBest ? t('routePlanner.bestShortest') : t('routePlanner.alternative', { number: routes.slice(0, index + 1).filter((item) => !item.isBest).length })}</span><strong>{route.distanceKm} km · {route.durationMinutes} min</strong></button>)}
            </div>
            {routeData.source === 'estimated' && <p className="route-estimated-note">{t('routePlanner.estimatedFallback')}</p>}
          </>}
        </div>
      </section>
    </div>
  );
}

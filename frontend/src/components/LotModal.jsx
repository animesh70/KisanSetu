import { useMemo, useState } from 'react';
import { MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { buildPickupPoint } from '../services/sharedLogistics.js';

export default function LotModal({ crop, markets = [], onClose, onSave }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    crop,
    variety: '',
    quantity: 100,
    grade: 'A',
    askingPrice: 2600,
    location: 'Niphad, Nashik',
    harvestDate: '2026-09-02',
    pickupPoint: null,
    destinationMandiId: '',
    destinationMandiName: '',
    destinationDistanceKm: null
  });
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');
  const [error, setError] = useState('');
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const varieties = form.crop === 'Onion' ? ['Red Onion', 'White Onion', 'N-53'] : form.crop === 'Tomato' ? ['Hybrid', 'Desi', 'Cherry tomato'] : ['Yellow soybean', 'JS-335', 'Other'];
  const mandiOptions = useMemo(
    () => markets.filter((market) => (market.crop ? String(market.crop).toLowerCase() === String(form.crop).toLowerCase() : form.crop === 'Onion')),
    [markets, form.crop]
  );

  const changeCrop = (nextCrop) => {
    setForm((current) => ({
      ...current,
      crop: nextCrop,
      variety: '',
      destinationMandiId: '',
      destinationMandiName: '',
      destinationDistanceKm: null
    }));
  };

  const changeMandi = (mandiId) => {
    const mandi = mandiOptions.find((item) => item.id === mandiId);
    setForm((current) => ({
      ...current,
      destinationMandiId: mandi?.id || '',
      destinationMandiName: mandi?.mandiName || '',
      destinationDistanceKm: mandi ? Number(mandi.distanceKm || 0) : null
    }));
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setError(t('sharedLogistics.locationUnsupported'));
      return;
    }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        try {
          const pickupPoint = buildPickupPoint(position);
          setForm((current) => ({ ...current, pickupPoint }));
          setLocationStatus('ready');
        } catch {
          setLocationStatus('error');
          setError(t('sharedLogistics.locationUnavailable'));
        } finally {
          setLocating(false);
        }
      },
      (geoError) => {
        setLocating(false);
        setLocationStatus('error');
        const key = geoError?.code === 1 ? 'locationDenied' : geoError?.code === 3 ? 'locationTimeout' : 'locationUnavailable';
        setError(t(`sharedLogistics.${key}`));
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };

  const submit = async (event) => {
    event.preventDefault();
    const quantity = Number(form.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 5000) {
      setError(t('page.quantityError'));
      return;
    }
    setError('');
    setSaving(true);
    try {
      const payload = { ...form, quantity, askingPrice: Number(form.askingPrice) };
      if (!payload.pickupPoint) delete payload.pickupPoint;
      if (!payload.destinationMandiId) {
        delete payload.destinationMandiId;
        delete payload.destinationMandiName;
        delete payload.destinationDistanceKm;
      }
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="lot-title">
    <form className="lot-modal" onSubmit={submit}>
      <div className="modal-heading"><div><p className="eyebrow">{t('page.sellProduce')}</p><h2 id="lot-title">{t('page.createCropLot')}</h2></div><button type="button" className="icon-button" aria-label={t('page.close')} onClick={onClose}>×</button></div>
      <div className="form-grid">
        <label>{t('crop')}<select value={form.crop} onChange={(event) => changeCrop(event.target.value)}><option value="Onion">{t('crops.onion')}</option><option value="Tomato">{t('crops.tomato')}</option><option value="Soybean">{t('crops.soybean')}</option></select></label>
        <label>{t('page.variety')} <span className="optional">{t('page.optional')}</span><select value={form.variety} onChange={(event) => update('variety', event.target.value)}><option value="">{t('page.selectVariety')}</option>{varieties.map((variety) => <option key={variety}>{variety}</option>)}</select></label>
        <label>{t('quantity')}<input required min="1" max="5000" step="1" type="number" value={form.quantity} onChange={(event) => update('quantity', event.target.value)}/></label>
        <label>{t('page.qualityGrade')}<select value={form.grade} onChange={(event) => update('grade', event.target.value)}><option>A</option><option>B</option><option>C</option></select></label>
        <label>{t('page.askingPrice')} (₹/q)<input required min="1" type="number" value={form.askingPrice} onChange={(event) => update('askingPrice', event.target.value)}/></label>
        <label>{t('page.pickupLocation')}<input required type="text" value={form.location} onChange={(event) => update('location', event.target.value)}/></label>
        <label className="full-width">{t('sharedLogistics.destinationMandi')} <span className="optional">{t('page.optional')}</span><select value={form.destinationMandiId} onChange={(event) => changeMandi(event.target.value)}><option value="">{t('sharedLogistics.selectMandi')}</option>{mandiOptions.map((mandi) => <option key={mandi.id} value={mandi.id}>{mandi.mandiName} · {mandi.distanceKm} km</option>)}</select></label>
        <div className="full-width pickup-coordinate-row">
          <button type="button" className="outline-button geo-button" onClick={useCurrentLocation} disabled={locating}><MapPin size={16}/>{locating ? t('sharedLogistics.locating') : t('sharedLogistics.useCurrentLocation')}</button>
          {locationStatus === 'ready' && <span className="geo-ready" role="status">✓ {t('sharedLogistics.locationReady')}</span>}
          <small>{t('sharedLogistics.locationPrivacy')}</small>
        </div>
        <label className="full-width">{t('page.harvestDate')} <span className="date-help">{t('page.dateHelp')}</span><input required type="date" value={form.harvestDate} onChange={(event) => update('harvestDate', event.target.value)}/></label>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="modal-footer"><button className="primary-button" disabled={saving}>{saving ? t('page.creatingLot') : t('page.publishLot')}</button></div>
    </form>
  </div>;
}

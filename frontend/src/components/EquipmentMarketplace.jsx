import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, CheckCircle2, CircleDollarSign, MapPin, Plus, ShieldCheck, Trash2, Wrench, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api.js';
import EquipmentListingModal from './EquipmentListingModal.jsx';
import EquipmentRentalModal from './EquipmentRentalModal.jsx';
import EquipmentRentalActivityLoader from './EquipmentRentalActivityLoader.jsx';

const TYPES = ['Tractor', 'Rotavator', 'Harvester', 'Seeder', 'Sprayer', 'Thresher', 'Cultivator', 'Other'];
const initialFilters = { type: '', district: '', maxDailyRate: '', availableFrom: '', availableTo: '' };
const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

export default function EquipmentMarketplace({ demoUserId = 'farmer-1', resetVersion = 0 }) {
  const { t, i18n } = useTranslation();
  const [filters, setFilters] = useState(initialFilters);
  const [items, setItems] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rentalsLoading, setRentalsLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showListing, setShowListing] = useState(false);
  const [rentTarget, setRentTarget] = useState(null);
  const formatDate = (value) => value ? new Date(value).toLocaleDateString(i18n.resolvedLanguage || i18n.language, { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const equipmentName = (item) => {
    if (!item?.name) return '';
    const translatedType = t(`equipment.types.${item.type}`, { defaultValue: item.type || '' });
    return item.source === 'demo' && item.type && item.name.endsWith(item.type)
      ? `${item.name.slice(0, -item.type.length).trim()} ${translatedType}`
      : item.name;
  };
  const equipmentDescription = (item) => item?.source === 'demo'
    ? t(`equipment.demoDescriptions.${item.type}`, { defaultValue: item.description || '' })
    : (item?.description || '');

  const loadRentals = useCallback(async () => {
    setRentalsLoading(true);
    try {
      const result = await api.getEquipmentRentals(demoUserId);
      setRentals(result.rentals || []);
    } catch {
      setRentals([]);
    } finally {
      setRentalsLoading(false);
    }
  }, [demoUserId]);

  const loadEquipment = useCallback(async (nextFilters = filters) => {
    setLoading(true);
    setError('');
    try {
      const result = await api.getEquipment(nextFilters, demoUserId);
      setItems(result.items || []);
    } catch (nextError) {
      setError(nextError.message || t('equipment.unavailable'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filters, t, demoUserId]);

  const refreshMarketplace = useCallback(async (nextFilters = filters) => {
    await Promise.allSettled([loadEquipment(nextFilters), loadRentals()]);
  }, [filters, loadEquipment, loadRentals]);

  useEffect(() => {
    setFilters(initialFilters);
    setError('');
    setMessage('');
    setShowListing(false);
    setRentTarget(null);
    refreshMarketplace(initialFilters);
  }, [demoUserId, resetVersion, refreshMarketplace]); // reload when farmer changes or Reset demo restores MongoDB equipment data

  const flash = (text) => { setMessage(text); window.setTimeout(() => setMessage(''), 3500); };
  const createListing = async (payload) => { await api.createEquipment(payload, demoUserId); flash(t('equipment.listedSuccess')); await refreshMarketplace(filters); };
  const requestRental = async (id, payload) => { await api.rentEquipment(id, payload, demoUserId); flash(t('equipment.rentalSuccess')); await refreshMarketplace(filters); };
  const removeListing = async (id) => {
    if (!window.confirm(t('equipment.deleteListing'))) return;
    try { await api.deleteEquipment(id, demoUserId); flash(t('equipment.deletedSuccess')); await refreshMarketplace(filters); } catch (nextError) { setError(nextError.message); }
  };
  const updateRental = async (rentalId, status) => {
    try { await api.updateEquipmentRental(rentalId, status, demoUserId); flash(t('equipment.statusUpdated')); await refreshMarketplace(filters); } catch (nextError) { setError(nextError.message); }
  };

  return <section id="equipment-sharing" className="equipment-marketplace">
    <div className="equipment-header section-header">
      <div><p className="eyebrow">{t('equipment.eyebrow')}</p><h2>{t('equipment.title')}</h2><small className="data-note">{t('equipment.subtitle')}</small></div>
      <button className="primary-button" type="button" onClick={() => setShowListing(true)}><Plus size={17}/>{t('equipment.listEquipment')}</button>
    </div>

    {message && <div className="equipment-message" role="status"><ShieldCheck size={17}/>{message}</div>}
    {error && <div className="equipment-error" role="alert">{error}</div>}

    <div className="equipment-filter-card">
      <div className="equipment-filter-title"><Wrench size={18}/><strong>{t('equipment.filters')}</strong></div>
      <label>{t('equipment.type')}<select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}><option value="">{t('equipment.allTypes')}</option>{TYPES.map((type) => <option key={type} value={type}>{t(`equipment.types.${type}`)}</option>)}</select></label>
      <label>{t('equipment.district')}<input value={filters.district} onChange={(e) => setFilters({ ...filters, district: e.target.value })}/></label>
      <label>{t('equipment.maxRate')}<input type="number" min="1" value={filters.maxDailyRate} onChange={(e) => setFilters({ ...filters, maxDailyRate: e.target.value })}/></label>
      <label>{t('equipment.availableFrom')}<input type="date" value={filters.availableFrom} onChange={(e) => setFilters({ ...filters, availableFrom: e.target.value })}/></label>
      <label>{t('equipment.availableTo')}<input type="date" min={filters.availableFrom || undefined} value={filters.availableTo} onChange={(e) => setFilters({ ...filters, availableTo: e.target.value })}/></label>
      <div className="equipment-filter-actions"><button type="button" className="outline-button" onClick={() => refreshMarketplace(filters)}>{t('equipment.applyFilters')}</button><button type="button" className="quiet-button" onClick={() => { setFilters(initialFilters); refreshMarketplace(initialFilters); }}>{t('equipment.clearFilters')}</button></div>
    </div>

    {loading ? <div className="equipment-empty">{t('equipment.loading')}</div> : items.length ? <div className="equipment-grid">{items.map((item) => <article className="equipment-card" key={item.id}>
      <div className="equipment-card-top"><span className="equipment-type-icon"><Wrench size={24}/></span><div><span className="equipment-type-chip">{t(`equipment.types.${item.type}`)}</span><h3>{equipmentName(item)}</h3></div>{item.source === 'demo' && <small className="demo-chip">{t('equipment.demo')}</small>}</div>
      <p className="equipment-description">{equipmentDescription(item)}</p>
      <div className="equipment-meta"><span><MapPin size={15}/><small>{t('equipment.district')}</small><strong>{item.district}, {item.state}</strong></span><span><ShieldCheck size={15}/><small>{t('equipment.condition')}</small><strong>{t(`equipment.conditions.${item.condition}`)}</strong></span>{item.horsepower && <span><Wrench size={15}/><small>HP</small><strong>{t('equipment.horsepower', { value: item.horsepower })}</strong></span>}<span><CalendarDays size={15}/><small>{t('equipment.available')}</small><strong>{formatDate(item.availabilityFrom)} – {formatDate(item.availabilityTo)}</strong></span></div>
      <div className="equipment-price-row"><div><small>{t('equipment.perDay')}</small><strong>{money(item.dailyRate)}</strong></div><div><small>{t('equipment.deposit')}</small><strong>{money(item.securityDeposit)}</strong></div></div>
      <p className="equipment-owner">{t('equipment.owner')}: <strong>{item.ownerName}</strong></p>
      <div className="equipment-card-actions">{item.isOwner ? <><span className="equipment-owner-badge">{t('equipment.yourListing')}</span><button type="button" className="delete-lot-button" onClick={() => removeListing(item.id)}><Trash2 size={14}/>{t('equipment.deleteListing')}</button></> : <button type="button" className="primary-button" onClick={() => setRentTarget(item)}><CircleDollarSign size={16}/>{t('equipment.rent')}</button>}</div>
    </article>)}</div> : <div className="equipment-empty">{t('equipment.empty')}</div>}

    <div className="equipment-rentals-panel"><div className="equipment-rentals-head"><h3>{t('equipment.myRentals')}</h3><span>{rentalsLoading ? '' : rentals.length}</span></div>{rentalsLoading ? <EquipmentRentalActivityLoader/> : rentals.length ? <div className="equipment-rental-list">{rentals.map((rental) => <article key={rental.id} className="equipment-rental-row"><div className="equipment-rental-copy"><small>{rental.role === 'owner' ? t('equipment.incoming') : t('equipment.outgoing')}</small><strong>{rental.equipmentName}</strong><p>{formatDate(rental.startDate)} – {formatDate(rental.endDate)} · {rental.days} {t('equipment.dayShort', { defaultValue: 'd' })} · {money(rental.totalRent)}</p></div><div className="equipment-rental-controls"><span className={`rental-status status-${rental.status}`}>{t(`equipment.statuses.${rental.status}`)}</span><div className="equipment-rental-actions">{rental.role === 'owner' && rental.status === 'requested' && <><button className="rental-action rental-action-approve" type="button" onClick={() => updateRental(rental.id, 'approved')}><CheckCircle2 size={15}/>{t('equipment.approve')}</button><button className="rental-action rental-action-reject" type="button" onClick={() => updateRental(rental.id, 'rejected')}><XCircle size={15}/>{t('equipment.reject')}</button></>}{rental.role === 'owner' && rental.status === 'approved' && <button className="rental-action rental-action-complete" type="button" onClick={() => updateRental(rental.id, 'completed')}><CheckCircle2 size={15}/>{t('equipment.complete')}</button>}{rental.role === 'renter' && ['requested', 'approved'].includes(rental.status) && <button className="rental-action rental-action-cancel" type="button" onClick={() => updateRental(rental.id, 'cancelled')}><XCircle size={15}/>{t('equipment.cancel')}</button>}</div></div></article>)}</div> : <p className="equipment-empty compact">{t('equipment.noRentals')}</p>}</div>

    {showListing && <EquipmentListingModal onClose={() => setShowListing(false)} onSave={createListing}/>}
    {rentTarget && <EquipmentRentalModal item={rentTarget} onClose={() => setRentTarget(null)} onRent={requestRental}/>}
  </section>;
}

import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const DAY_MS = 24 * 60 * 60 * 1000;
const dateInput = (value) => value ? new Date(value).toISOString().slice(0, 10) : '';

export default function EquipmentRentalModal({ item, onClose, onRent }) {
  const { t } = useTranslation();
  const today = new Date().toISOString().slice(0, 10);
  const availableFrom = dateInput(item.availabilityFrom);
  const minimum = availableFrom && availableFrom > today ? availableFrom : today;
  const maximum = dateInput(item.availabilityTo);
  const [startDate, setStartDate] = useState(minimum);
  const [endDate, setEndDate] = useState(minimum);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const days = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const count = Math.floor((new Date(`${endDate}T00:00:00Z`) - new Date(`${startDate}T00:00:00Z`)) / DAY_MS) + 1;
    return Number.isFinite(count) && count > 0 ? count : 0;
  }, [startDate, endDate]);
  const estimate = days * Number(item.dailyRate || 0);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSending(true);
    try {
      await onRent(item.id, { startDate, endDate });
      onClose();
    } catch (nextError) {
      setError(nextError.message || t('equipment.unavailable'));
    } finally {
      setSending(false);
    }
  };

  return <div className="equipment-modal-layer" role="presentation">
    <button className="equipment-modal-backdrop" aria-label={t('equipment.close')} onClick={onClose}/>
    <section className="equipment-modal equipment-rent-modal" role="dialog" aria-modal="true" aria-labelledby="equipment-rent-title">
      <div className="equipment-modal-head"><div><p className="eyebrow">{t('equipment.rentTitle')}</p><h2 id="equipment-rent-title">{item.name}</h2></div><button type="button" className="icon-button" aria-label={t('equipment.close')} onClick={onClose}><X size={20}/></button></div>
      <div className="equipment-rent-summary"><span><small>{t('equipment.perDay')}</small><strong>₹{Number(item.dailyRate).toLocaleString('en-IN')}</strong></span><span><small>{t('equipment.deposit')}</small><strong>₹{Number(item.securityDeposit || 0).toLocaleString('en-IN')}</strong></span></div>
      <form className="equipment-form" onSubmit={submit}>
        <label>{t('equipment.startDate')}<input required type="date" min={minimum} max={maximum} value={startDate} onChange={(e) => { setStartDate(e.target.value); if (endDate < e.target.value) setEndDate(e.target.value); }}/></label>
        <label>{t('equipment.endDate')}<input required type="date" min={startDate || minimum} max={maximum} value={endDate} onChange={(e) => setEndDate(e.target.value)}/></label>
        <div className="equipment-quote equipment-form-wide"><span>{t('equipment.rentalDays', { count: days })}</span><strong>{t('equipment.estimatedRent')}: ₹{estimate.toLocaleString('en-IN')}</strong><small>{t('equipment.rentalNote')}</small></div>
        {error && <p className="equipment-form-error" role="alert">{error}</p>}
        <div className="equipment-form-actions equipment-form-wide"><button type="button" className="outline-button" onClick={onClose}>{t('equipment.close')}</button><button className="primary-button" disabled={sending || !days}>{sending ? t('equipment.requesting') : t('equipment.requestRental')}</button></div>
      </form>
    </section>
  </div>;
}

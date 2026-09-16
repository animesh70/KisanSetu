import { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const EQUIPMENT_TYPES = ['Tractor', 'Rotavator', 'Harvester', 'Seeder', 'Sprayer', 'Thresher', 'Cultivator', 'Other'];
const CONDITIONS = ['Good', 'Very Good', 'Excellent'];

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export default function EquipmentListingModal({ onClose, onSave }) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', type: 'Tractor', description: '', district: 'Nashik', state: 'Maharashtra',
    dailyRate: '', securityDeposit: '0', condition: 'Good', horsepower: '',
    availabilityFrom: todayString(), availabilityTo: ''
  });

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSave({
        ...form,
        dailyRate: Number(form.dailyRate),
        securityDeposit: Number(form.securityDeposit || 0),
        horsepower: form.horsepower === '' ? null : Number(form.horsepower)
      });
      onClose();
    } catch (nextError) {
      setError(nextError.message || t('equipment.unavailable'));
    } finally {
      setSaving(false);
    }
  };

  return <div className="equipment-modal-layer" role="presentation">
    <button className="equipment-modal-backdrop" aria-label={t('equipment.close')} onClick={onClose}/>
    <section className="equipment-modal" role="dialog" aria-modal="true" aria-labelledby="equipment-list-title">
      <div className="equipment-modal-head">
        <div><p className="eyebrow">{t('equipment.eyebrow')}</p><h2 id="equipment-list-title">{t('equipment.listTitle')}</h2></div>
        <button type="button" className="icon-button" aria-label={t('equipment.close')} onClick={onClose}><X size={20}/></button>
      </div>
      <form className="equipment-form" onSubmit={submit}>
        <label>{t('equipment.equipmentName')}<input required maxLength="100" value={form.name} onChange={(e) => update('name', e.target.value)}/></label>
        <label>{t('equipment.type')}<select value={form.type} onChange={(e) => update('type', e.target.value)}>{EQUIPMENT_TYPES.map((type) => <option key={type} value={type}>{t(`equipment.types.${type}`)}</option>)}</select></label>
        <label className="equipment-form-wide">{t('equipment.description')}<textarea maxLength="600" rows="3" value={form.description} onChange={(e) => update('description', e.target.value)}/></label>
        <label>{t('equipment.district')}<input required maxLength="80" value={form.district} onChange={(e) => update('district', e.target.value)}/></label>
        <label>{t('equipment.state')}<input required maxLength="80" value={form.state} onChange={(e) => update('state', e.target.value)}/></label>
        <label>{t('equipment.dailyRate')}<input required type="number" min="1" max="100000" value={form.dailyRate} onChange={(e) => update('dailyRate', e.target.value)}/></label>
        <label>{t('equipment.securityDeposit')}<input type="number" min="0" max="500000" value={form.securityDeposit} onChange={(e) => update('securityDeposit', e.target.value)}/></label>
        <label>{t('equipment.condition')}<select value={form.condition} onChange={(e) => update('condition', e.target.value)}>{CONDITIONS.map((condition) => <option key={condition} value={condition}>{t(`equipment.conditions.${condition}`)}</option>)}</select></label>
        <label>{t('equipment.horsepowerLabel')}<input type="number" min="1" max="1000" value={form.horsepower} onChange={(e) => update('horsepower', e.target.value)}/></label>
        <label>{t('equipment.availableFrom')}<input required type="date" min={todayString()} value={form.availabilityFrom} onChange={(e) => update('availabilityFrom', e.target.value)}/></label>
        <label>{t('equipment.availableTo')}<input required type="date" min={form.availabilityFrom || todayString()} value={form.availabilityTo} onChange={(e) => update('availabilityTo', e.target.value)}/></label>
        {error && <p className="equipment-form-error" role="alert">{error}</p>}
        <div className="equipment-form-actions equipment-form-wide">
          <button type="button" className="outline-button" onClick={onClose}>{t('equipment.close')}</button>
          <button className="primary-button" disabled={saving}>{saving ? t('equipment.publishing') : t('equipment.publish')}</button>
        </div>
      </form>
    </section>
  </div>;
}

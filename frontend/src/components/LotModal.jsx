import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function LotModal({ crop, onClose, onSave }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ crop, variety: '', quantity: 100, grade: 'A', askingPrice: 2600, location: 'Niphad, Nashik', harvestDate: '2026-09-02' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const update = (key, value) => setForm({ ...form, [key]: value });
  const varieties = form.crop === 'Onion' ? ['Red Onion', 'White Onion', 'N-53'] : form.crop === 'Tomato' ? ['Hybrid', 'Desi', 'Cherry tomato'] : ['Yellow soybean', 'JS-335', 'Other'];

  const submit = async (event) => {
    event.preventDefault();
    const quantity = Number(form.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 5000) {
      setError(t('page.quantityError'));
      return;
    }
    setError('');
    setSaving(true);
    await onSave({ ...form, quantity, askingPrice: Number(form.askingPrice) });
    setSaving(false);
  };

  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="lot-title">
    <form className="lot-modal" onSubmit={submit}>
      <div className="modal-heading"><div><p className="eyebrow">{t('page.sellProduce')}</p><h2 id="lot-title">{t('page.createCropLot')}</h2></div><button type="button" className="icon-button" aria-label={t('page.close')} onClick={onClose}>×</button></div>
      <div className="form-grid">
        <label>{t('crop')}<select value={form.crop} onChange={(event) => setForm({ ...form, crop: event.target.value, variety: '' })}><option value="Onion">{t('crops.onion')}</option><option value="Tomato">{t('crops.tomato')}</option><option value="Soybean">{t('crops.soybean')}</option></select></label>
        <label>{t('page.variety')} <span className="optional">{t('page.optional')}</span><select value={form.variety} onChange={(event) => update('variety', event.target.value)}><option value="">{t('page.selectVariety')}</option>{varieties.map((variety) => <option key={variety}>{variety}</option>)}</select></label>
        <label>{t('quantity')}<input required min="1" max="5000" step="1" type="number" value={form.quantity} onChange={(event) => update('quantity', event.target.value)}/></label>
        <label>{t('page.qualityGrade')}<select value={form.grade} onChange={(event) => update('grade', event.target.value)}><option>A</option><option>B</option><option>C</option></select></label>
        <label>{t('page.askingPrice')} (₹/q)<input required min="1" type="number" value={form.askingPrice} onChange={(event) => update('askingPrice', event.target.value)}/></label>
        <label>{t('page.pickupLocation')}<input required type="text" value={form.location} onChange={(event) => update('location', event.target.value)}/></label>
        <label className="full-width">{t('page.harvestDate')} <span className="date-help">{t('page.dateHelp')}</span><input required type="date" value={form.harvestDate} onChange={(event) => update('harvestDate', event.target.value)}/></label>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="modal-footer"><button className="primary-button" disabled={saving}>{saving ? t('page.creatingLot') : t('page.publishLot')}</button></div>
    </form>
  </div>;
}

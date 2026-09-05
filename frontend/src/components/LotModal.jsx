import { useState } from 'react';

export default function LotModal({ crop, onClose, onSave }) {
  const [form, setForm] = useState({ crop, variety: crop === 'Onion' ? 'Red Onion' : '', quantity: 100, grade: 'A', askingPrice: 2600, location: 'Niphad, Nashik', harvestDate: '2026-09-02' });
  const [saving, setSaving] = useState(false);
  const submit = async (event) => { event.preventDefault(); setSaving(true); await onSave({ ...form, quantity: Number(form.quantity), askingPrice: Number(form.askingPrice) }); setSaving(false); };
  return <div className="modal-backdrop"><form className="lot-modal" onSubmit={submit}><div className="modal-heading"><div><p className="eyebrow">SELL YOUR PRODUCE</p><h2>Create a crop lot</h2></div><button type="button" className="icon-button" onClick={onClose}>×</button></div><div className="form-grid">{[['crop', 'Crop'], ['variety', 'Variety'], ['quantity', 'Quantity (quintal)'], ['grade', 'Quality grade'], ['askingPrice', 'Asking price (₹/q)'], ['location', 'Pickup location'], ['harvestDate', 'Harvest date']].map(([key, label]) => <label key={key}>{label}<input required type={key === 'quantity' || key === 'askingPrice' ? 'number' : key === 'harvestDate' ? 'date' : 'text'} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })}/></label>)}</div><button className="primary-button" disabled={saving}>{saving ? 'Creating lot…' : 'Publish crop lot'}</button></form></div>;
}

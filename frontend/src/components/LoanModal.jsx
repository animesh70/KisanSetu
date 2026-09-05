import { useState } from 'react';

export default function LoanModal({ defaultCrop, onClose, onSave }) {
  const [form, setForm] = useState({
    applicantName: 'Sanjay Patil',
    category: 'crop',
    cropOrBusiness: defaultCrop || 'Onion',
    amount: 150000,
    purpose: 'Seed, fertilizer and irrigation costs',
    income: 80000,
    details: '3 acre land in Niphad, Nashik'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (key, value) => setForm({ ...form, [key]: value });

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave({ ...form, amount: Number(form.amount), income: Number(form.income) });
    } catch (submitError) {
      setError(submitError.message || 'Could not submit the loan application.');
    }
    setSaving(false);
  };

  return <div className="modal-backdrop">
    <form className="lot-modal loan-modal" onSubmit={submit}>
      <div className="modal-heading">
        <div><p className="eyebrow">SMART LOAN</p><h2>Apply for a loan</h2></div>
        <button type="button" className="icon-button" onClick={onClose}>×</button>
      </div>
      <div className="form-grid">
        <label>Applicant name<input required value={form.applicantName} onChange={(event) => update('applicantName', event.target.value)}/></label>
        <label>Loan type
          <select value={form.category} onChange={(event) => update('category', event.target.value)}>
            <option value="crop">Crop loan</option>
            <option value="business">Business loan</option>
          </select>
        </label>
        <label>{form.category === 'crop' ? 'Crop' : 'Business type'}<input required value={form.cropOrBusiness} onChange={(event) => update('cropOrBusiness', event.target.value)}/></label>
        <label>Loan amount (₹)<input required type="number" min="1000" value={form.amount} onChange={(event) => update('amount', event.target.value)}/></label>
        <label>Purpose<input required value={form.purpose} onChange={(event) => update('purpose', event.target.value)}/></label>
        <label>Annual income (₹)<input required type="number" min="0" value={form.income} onChange={(event) => update('income', event.target.value)}/></label>
        <label className="span-two">{form.category === 'crop' ? 'Land details' : 'Business details'}<input required value={form.details} onChange={(event) => update('details', event.target.value)}/></label>
      </div>
      {error && <p className="form-error">{error}</p>}
      <button className="primary-button" disabled={saving}>{saving ? 'Checking eligibility…' : 'Get recommendation & apply'}</button>
    </form>
  </div>;
}

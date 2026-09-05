import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

const initial = { applicantName: 'Sanjay Patil', phone: '9876543210', loanType: 'Crop', cropOrBusiness: 'Onion', amount: 300000, purpose: 'Working capital', income: 35000, landArea: 3, businessDetails: '', selectedBank: 'SBI' };

export default function LoanModal({ onClose, onSubmitted }) {
  const [form, setForm] = useState(initial);
  const [banks, setBanks] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { api.getLoanBanks().then(setBanks).catch(() => setBanks([{ id: 'sbi', shortName: 'SBI', name: 'State Bank of India' }, { id: 'axis', shortName: 'Axis', name: 'Axis Bank' }, { id: 'other', shortName: 'Other', name: 'Other banks' }])); }, []);
  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const recommend = async () => { try { setRecommendation(await api.getLoanRecommendation(form)); } catch { setRecommendation({ eligibility: 'Ready for lender review', score: 75, reasons: ['Your details are captured for an eligibility-style check.'] }); } };
  const submit = async (event) => { event.preventDefault(); setSaving(true); try { const result = await api.submitLoan(form); onSubmitted(result); } catch { setRecommendation({ ...(recommendation || {}), eligibility: 'Could not submit', reasons: ['Start the KisanSetu backend and try again.'] }); } finally { setSaving(false); } };
  return <div className="modal-backdrop"><form className="loan-modal" onSubmit={submit}><div className="modal-heading"><div><p className="eyebrow">SMART LOAN</p><h2>Find a suitable loan</h2><p className="modal-sub">Choose your activity and let KisanSetu compare an eligibility-style fit.</p></div><button type="button" className="icon-button" onClick={onClose}>×</button></div>
    <div className="loan-bank-grid">{(banks.length ? banks : [{ shortName: 'SBI' }, { shortName: 'Axis' }, { shortName: 'Other' }]).map((bank) => <button type="button" key={bank.shortName} className={`bank-choice ${form.selectedBank === bank.shortName ? 'selected' : ''}`} onClick={() => update('selectedBank', bank.shortName)}><ShieldCheck size={17}/><strong>{bank.shortName}</strong><small>{bank.focus || 'Compare lender option'}</small></button>)}</div>
    <div className="form-grid">{[['applicantName','Applicant name','text'],['phone','Phone','tel'],['amount','Loan amount (₹)','number'],['income','Monthly income (₹)','number'],['landArea','Land area (acres)','number'],['purpose','Purpose','text']].map(([key,label,type]) => <label key={key}>{label}<input required type={type} value={form[key]} onChange={(e) => update(key,e.target.value)} /></label>)}
      <label>Loan type<select value={form.loanType} onChange={(e) => update('loanType',e.target.value)}><option>Crop</option><option>Business</option></select></label>
      <label>{form.loanType === 'Crop' ? 'Crop' : 'Business / activity'}<input required value={form.cropOrBusiness} onChange={(e) => update('cropOrBusiness',e.target.value)} /></label>
      {form.loanType === 'Business' && <label className="full-field">Business details<textarea value={form.businessDetails} onChange={(e) => update('businessDetails',e.target.value)} placeholder="Describe your business, years operating, turnover, etc."/></label>}
    </div>
    {recommendation && <div className={`eligibility ${recommendation.eligibility === 'Likely eligible' ? 'positive' : ''}`}><CheckCircle2 size={19}/><div><strong>{recommendation.eligibility} · {recommendation.score}% fit</strong>{recommendation.reasons?.map((r) => <p key={r}>{r}</p>)}</div></div>}
    <div className="loan-actions"><button type="button" className="secondary-button" onClick={recommend}>Check eligibility</button><button className="primary-button" disabled={saving}>{saving ? 'Submitting…' : 'Submit application'} <ArrowRight size={17}/></button></div>
    <small className="disclaimer">Eligibility-style recommendation only. Final approval, rate and terms are decided by the selected lender.</small>
  </form></div>;
}

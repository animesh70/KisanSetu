import { Router } from 'express';
import { loanBanks, loanApplications } from '../data/sampleData.js';

const router = Router();

function recommend(application) {
  const amount = Number(application.amount || 0);
  const income = Number(application.income || 0);
  const isBusiness = application.loanType === 'Business';
  const isCrop = application.loanType === 'Crop';
  const purpose = application.purpose || '';
  const bank = isBusiness || amount > 1000000 ? loanBanks.find((b) => b.id === 'axis') : loanBanks.find((b) => b.id === 'sbi');
  const eligibility = income >= Math.max(10000, amount / 120) && amount > 0;
  const reasons = [];
  if (isCrop) reasons.push('Crop-based funding matches the stated agricultural purpose.');
  if (isBusiness) reasons.push('Business funding matches the selected enterprise activity.');
  if (income) reasons.push(`Declared monthly income of ₹${income.toLocaleString('en-IN')} was considered.`);
  if (purpose) reasons.push(`Loan purpose recorded as ${purpose}.`);
  return {
    recommendedBank: bank,
    eligibility: eligibility ? 'Likely eligible' : 'Needs lender review',
    score: eligibility ? Math.min(96, 72 + (income > amount / 80 ? 14 : 0) + (application.landArea ? 7 : 0)) : 48,
    reasons: reasons.length ? reasons : ['Complete the application details for a more useful eligibility-style recommendation.'],
    disclaimer: 'This is an eligibility-style estimate, not a loan approval or credit decision.'
  };
}

router.get('/banks', (req, res) => res.json(loanBanks));
router.post('/recommend', (req, res) => res.json(recommend(req.body || {})));

router.post('/applications', (req, res) => {
  const body = req.body || {};
  const required = ['applicantName', 'phone', 'loanType', 'amount', 'purpose', 'income'];
  const missing = required.filter((field) => body[field] === undefined || body[field] === '');
  if (missing.length) return res.status(400).json({ message: `Missing fields: ${missing.join(', ')}` });
  const recommendation = recommend(body);
  const application = {
    id: `KS-LOAN-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${Math.floor(1000 + Math.random() * 9000)}`,
    selectedBank: body.selectedBank || recommendation.recommendedBank.shortName,
    amount: Number(body.amount),
    applicantName: body.applicantName,
    phone: body.phone,
    loanType: body.loanType,
    cropOrBusiness: body.cropOrBusiness || '',
    purpose: body.purpose,
    income: Number(body.income),
    landArea: body.landArea ? Number(body.landArea) : null,
    businessDetails: body.businessDetails || '',
    submittedAt: new Date().toISOString(),
    status: 'Submitted',
    recommendation
  };
  loanApplications.push(application);
  res.status(201).json(application);
});

router.get('/applications/:id', (req, res) => {
  const application = loanApplications.find((item) => item.id === req.params.id);
  if (!application) return res.status(404).json({ message: 'Loan application not found.' });
  res.json(application);
});

export default router;

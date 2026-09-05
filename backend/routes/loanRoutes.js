import { Router } from 'express';
import { banks, loanApplications } from '../data/sampleData.js';
import { createLoanApplication, recommendLoan } from '../services/loanService.js';

const router = Router();
router.get('/banks', (req, res) => res.json(banks));

router.post('/recommendation', (req, res) => res.json(recommendLoan(req.body || {})));

router.post('/apply', (req, res) => {
  const required = ['applicantName', 'category', 'cropOrBusiness', 'amount', 'purpose', 'income'];
  const missing = required.filter((field) => req.body[field] === undefined || req.body[field] === '');
  if (missing.length) return res.status(400).json({ message: `Missing fields: ${missing.join(', ')}` });
  const application = createLoanApplication(req.body);
  loanApplications.push(application);
  res.status(201).json(application);
});

router.get('/', (req, res) => res.json(loanApplications));

router.get('/:id', (req, res) => {
  const application = loanApplications.find((item) => item.id === req.params.id);
  if (!application) return res.status(404).json({ message: 'Loan application not found.' });
  res.json(application);
});

export default router;

import express from 'express';
import { agriLoans } from '../data/agriLoans.js';
import { evaluateLoanEligibility, recommendLoans, validateLoanProfile } from '../services/loanEligibilityService.js';

const router = express.Router();
const safe = (handler) => (req, res) => {
  try { return handler(req, res); }
  catch (error) { return res.status(400).json({ error: { code: error.message || 'INVALID_REQUEST', message: 'Check the loan details and try again.' } }); }
};
router.get('/', (req, res) => res.json({ loans: agriLoans.filter((loan) => loan.isActive) }));
router.post('/recommend', safe((req, res) => res.json({ recommendations: recommendLoans(validateLoanProfile(req.body?.profile)) })));
router.post('/check-eligibility', safe((req, res) => {
  const loan = agriLoans.find((item) => item.id === req.body?.loanId && item.isActive);
  if (!loan) return res.status(404).json({ error: { code: 'LOAN_NOT_FOUND', message: 'Loan product not found.' } });
  return res.json({ loan, ...evaluateLoanEligibility(validateLoanProfile(req.body?.profile), loan) });
}));
router.get('/:id', (req, res) => {
  const loan = agriLoans.find((item) => item.id === req.params.id && item.isActive);
  return loan ? res.json({ loan }) : res.status(404).json({ error: { code: 'LOAN_NOT_FOUND', message: 'Loan product not found.' } });
});
export default router;

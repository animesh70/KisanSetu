import { banks } from '../data/sampleData.js';

function scoreScheme(scheme, application) {
  const amount = Number(application.amount) || 0;
  const income = Number(application.income) || 0;
  if (scheme.category !== application.category) return null;
  if (amount <= 0 || amount > scheme.maxAmount) return null;
  if (income < scheme.minIncome) return null;
  const headroom = (scheme.maxAmount - amount) / scheme.maxAmount;
  const score = Math.round((100 - scheme.interestRate * 4 + headroom * 15) * 10) / 10;
  return Math.max(0, Math.min(100, score));
}

export function recommendLoan(application) {
  const candidates = [];
  for (const bank of banks) {
    for (const scheme of bank.schemes) {
      const eligibilityScore = scoreScheme(scheme, application);
      if (eligibilityScore === null) continue;
      candidates.push({
        bankId: bank.id,
        bankName: bank.name,
        bankType: bank.type,
        schemeId: scheme.id,
        schemeName: scheme.name,
        interestRate: scheme.interestRate,
        maxAmount: scheme.maxAmount,
        tenureMonths: scheme.tenureMonths,
        processingFee: scheme.processingFee,
        eligibilityScore
      });
    }
  }
  candidates.sort((a, b) => b.eligibilityScore - a.eligibilityScore);
  return { eligible: candidates.length > 0, recommended: candidates[0] || null, alternatives: candidates.slice(1, 4) };
}

export function createLoanApplication(payload) {
  const recommendation = recommendLoan(payload);
  const chosen = recommendation.recommended;
  return {
    id: `LOAN-${Date.now()}`,
    status: chosen ? 'approved-in-principle' : 'under-review',
    submittedAt: new Date().toISOString(),
    applicantName: payload.applicantName,
    category: payload.category,
    cropOrBusiness: payload.cropOrBusiness,
    amount: Number(payload.amount) || 0,
    purpose: payload.purpose,
    income: Number(payload.income) || 0,
    details: payload.details || '',
    selectedBank: chosen ? { id: chosen.bankId, name: chosen.bankName, scheme: chosen.schemeName, interestRate: chosen.interestRate, tenureMonths: chosen.tenureMonths, processingFee: chosen.processingFee } : null,
    recommendation
  };
}

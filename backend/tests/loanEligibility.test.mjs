import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import loanRoutes from '../routes/loanRoutes.js';
import { agriLoans } from '../data/agriLoans.js';
import { evaluateLoanEligibility, recommendLoans, validateLoanProfile } from '../services/loanEligibilityService.js';

const byId = (id) => agriLoans.find((item) => item.id === id);

test('crop cultivation matches KCC and a tenant remains eligible for preliminary review', () => {
  const profile = { purpose: 'crop_cultivation', requestedAmount: 200000, farmerType: 'tenant_farmer' };
  const result = evaluateLoanEligibility(profile, byId('sbi-kcc'));
  assert.equal(result.status, 'likely_eligible');
  assert.ok(result.matchedCriteria.includes('farmer_type'));
  assert.equal(recommendLoans(profile)[0].loan.id, 'sbi-kcc');
});

test('tractor purpose selects the specific mechanisation product and excludes crop-only KCC', () => {
  const result = recommendLoans({ purpose: 'farm_equipment', activity: 'tractor', requestedAmount: 400000, farmerType: 'owner_cultivator', landHoldingAcres: 3 });
  assert.equal(result[0].loan.id, 'sbi-tractor');
  assert.ok(result.every((item) => item.loan.id !== 'sbi-kcc'));
});

test('general machinery does not become a tractor-loan match', () => {
  const result = recommendLoans({ purpose: 'farm_equipment', activity: 'other_equipment', requestedAmount: 400000, farmerType: 'owner_cultivator' });
  assert.equal(result[0].loan.id, 'sbi-asset-backed');
  assert.ok(result.every((item) => item.loan.id !== 'sbi-tractor'));
});

test('irrigation and warehouse purposes match only their source-backed products', () => {
  assert.equal(recommendLoans({ purpose: 'irrigation', requestedAmount: 200000, farmerType: 'owner_cultivator' })[0].loan.id, 'sbi-irrigation');
  assert.equal(recommendLoans({ purpose: 'storage_warehouse', requestedAmount: 500000, farmerType: 'owner_cultivator' })[0].loan.id, 'sbi-warehouse');
});

test('missing information needs more information rather than false rejection', () => {
  const result = evaluateLoanEligibility({ purpose: 'farm_equipment' }, byId('sbi-tractor'));
  assert.equal(result.status, 'needs_more_information');
  assert.ok(result.missingInformation.includes('land_or_scientific'));
});

test('incompatible purpose and published amount range are not matched', () => {
  assert.equal(evaluateLoanEligibility({ purpose: 'fisheries', activity: 'tractor', requestedAmount: 300000, farmerType: 'owner_cultivator', landHoldingAcres: 3 }, byId('sbi-tractor')).status, 'not_matched');
  assert.equal(evaluateLoanEligibility({ purpose: 'farm_equipment', activity: 'tractor', requestedAmount: 100000, farmerType: 'owner_cultivator', landHoldingAcres: 3 }, byId('sbi-tractor')).status, 'not_matched');
});

test('invalid amounts and unknown sensitive fields are rejected', () => {
  assert.throws(() => validateLoanProfile({ purpose: 'crop_cultivation', requestedAmount: -1 }), /INVALID_AMOUNT/);
  assert.throws(() => validateLoanProfile({ purpose: 'crop_cultivation', requestedAmount: 1.5 }), /INVALID_AMOUNT/);
  assert.throws(() => validateLoanProfile({ purpose: 'crop_cultivation', requestedAmount: 200000, aadhaarNumber: '123' }), /INVALID_PROFILE/);
});

test('official sources and application URLs are well-formed; no fake online form is exposed', () => {
  for (const loan of agriLoans) {
    assert.match(loan.officialInformationUrl, /^https:\/\//);
    assert.match(loan.lastVerifiedAt, /^\d{4}-\d{2}-\d{2}$/);
    if (loan.applicationUrl) assert.match(loan.applicationUrl, /^https:\/\//);
  }
  assert.equal(byId('sbi-kcc').applicationUrl, null);
});

let server;
let base;
before(async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/loans', loanRoutes);
  await new Promise((resolve) => { server = app.listen(0, '127.0.0.1', resolve); });
  base = `http://127.0.0.1:${server.address().port}/api/loans`;
});
after(() => server?.close());

test('recommendation API returns only preliminary states and rejects invalid amounts', async () => {
  const good = await fetch(`${base}/recommend`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ profile: { purpose: 'crop_cultivation', requestedAmount: 200000, farmerType: 'tenant_farmer' } }) });
  assert.equal(good.status, 200);
  const payload = await good.json();
  assert.ok(payload.recommendations.length > 0);
  assert.ok(payload.recommendations.every((item) => ['likely_eligible', 'possibly_eligible', 'needs_more_information'].includes(item.status)));
  const bad = await fetch(`${base}/recommend`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ profile: { purpose: 'crop_cultivation', requestedAmount: -5 } }) });
  assert.equal(bad.status, 400);
});

test('list, detail and eligibility endpoints use the same catalog', async () => {
  const listed = await fetch(base).then((response) => response.json());
  assert.ok(listed.loans.some((item) => item.id === 'sbi-kcc'));
  const detail = await fetch(`${base}/sbi-kcc`).then((response) => response.json());
  assert.equal(detail.loan.name, 'SBI Kisan Credit Card');
  const checked = await fetch(`${base}/check-eligibility`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ loanId: 'sbi-kcc', profile: { purpose: 'crop_cultivation', requestedAmount: 200000, farmerType: 'tenant_farmer' } }) }).then((response) => response.json());
  assert.equal(checked.status, 'likely_eligible');
});

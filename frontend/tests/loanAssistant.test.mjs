import assert from 'node:assert/strict';
import { test } from 'node:test';
import loanTranslations from '../src/localization/loanTranslations.js';
import { detectEquipmentActivity, detectFarmerType, detectLoanCrop, detectLoanPurpose, isLoanRequest, officialApplicationUrl, parseLoanAmount } from '../src/services/loanAssistant.js';

const t = (key) => key.split('.').slice(1).reduce((value, part) => value?.[part], loanTranslations.en);

test('English and localized loan requests enter the loan path without catching regular price questions', () => {
  assert.equal(isLoanRequest('I need a loan', t), true);
  assert.equal(isLoanRequest('I need money to buy a tractor', t), true);
  assert.equal(isLoanRequest('What is the onion market price?', t), false);
  assert.equal(isLoanRequest('ମୋତେ କୃଷି ଋଣ ଦରକାର', t), true);
});

test('purpose, amount and farmer type are parsed for the conversational flow', () => {
  assert.equal(detectLoanPurpose('I need a tractor loan', t), 'farm_equipment');
  assert.equal(detectEquipmentActivity('I need a tractor loan', t), 'tractor');
  assert.equal(detectLoanPurpose('I need ₹2 lakh for onion cultivation', t), 'crop_cultivation');
  assert.equal(detectLoanCrop('I need ₹2 lakh for onion cultivation'), 'Onion');
  assert.equal(detectLoanPurpose('I need a loan', t), null);
  assert.equal(parseLoanAmount('₹2,00,000'), 200000);
  assert.equal(parseLoanAmount('2 lakh'), 200000);
  assert.equal(detectFarmerType('I am a tenant farmer', t), 'tenant_farmer');
});

test('official application links require a verified, allowed HTTPS host', () => {
  assert.equal(officialApplicationUrl({ applicationUrl: null }), null);
  assert.equal(officialApplicationUrl({ applicationUrl: 'https://example.com/fake-apply' }), null);
  assert.equal(officialApplicationUrl({ applicationUrl: 'http://sbi.bank.in/apply' }), null);
  assert.equal(officialApplicationUrl({ applicationUrl: 'https://sbi.bank.in/apply' }), 'https://sbi.bank.in/apply');
});

test('every configured language has a loan quick action and purpose choices', () => {
  for (const [language, strings] of Object.entries(loanTranslations)) {
    assert.ok(strings.quickAction, language);
    assert.ok(strings.purpose.crop_cultivation, language);
    assert.ok(strings.purpose.farm_equipment, language);
    assert.ok(strings.criteria.equipment_type, language);
    assert.ok(strings.notice, language);
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRentalQuote, normalizeEquipmentInput, overlapsWindow, parseRentalWindow } from '../services/equipmentService.js';

test('normalizes a valid equipment listing', () => {
  const item = normalizeEquipmentInput({
    name: 'Mahindra Tractor', type: 'Tractor', description: 'Demo', district: 'Nashik', state: 'Maharashtra',
    dailyRate: 1800, securityDeposit: 5000, condition: 'Excellent', horsepower: 45,
    availabilityFrom: '2026-09-16', availabilityTo: '2026-10-16'
  });
  assert.equal(item.type, 'Tractor');
  assert.equal(item.dailyRate, 1800);
  assert.equal(item.horsepower, 45);
});

test('rejects invalid equipment types', () => {
  assert.throws(() => normalizeEquipmentInput({
    name: 'Machine', type: 'Car', district: 'Nashik', state: 'Maharashtra', dailyRate: 500,
    securityDeposit: 0, condition: 'Good', availabilityFrom: '2026-09-16', availabilityTo: '2026-09-17'
  }), /valid equipment type/i);
});

test('rental window counts inclusive days', () => {
  const result = parseRentalWindow('2026-09-16', '2026-09-18');
  assert.equal(result.days, 3);
  assert.equal(calculateRentalQuote(900, result.days), 2700);
});

test('rejects inverted rental windows', () => {
  assert.throws(() => parseRentalWindow('2026-09-20', '2026-09-18'), /on or after/i);
});

test('detects overlapping rental windows', () => {
  assert.equal(overlapsWindow('2026-09-16', '2026-09-18', '2026-09-18', '2026-09-20'), true);
  assert.equal(overlapsWindow('2026-09-16', '2026-09-18', '2026-09-19', '2026-09-20'), false);
});

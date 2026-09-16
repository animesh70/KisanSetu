import { EQUIPMENT_CONDITIONS, EQUIPMENT_TYPES } from '../models/Equipment.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function cleanText(value, maxLength = 100) {
  return String(value ?? '').trim().slice(0, maxLength);
}

export function parseMoney(value, { min = 0, max = 500000, field = 'Amount' } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new TypeError(`${field} must be between ${min} and ${max}.`);
  }
  return Math.round(number * 100) / 100;
}

export function parseDateOnly(value, field = 'Date') {
  const text = cleanText(value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new TypeError(`${field} must use YYYY-MM-DD format.`);
  const date = new Date(`${text}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new TypeError(`${field} is invalid.`);
  return date;
}

export function parseRentalWindow(startValue, endValue, { maxDays = 90 } = {}) {
  const startDate = parseDateOnly(startValue, 'Start date');
  const endDate = parseDateOnly(endValue, 'End date');
  if (endDate < startDate) throw new TypeError('End date must be on or after the start date.');
  const days = Math.floor((endDate - startDate) / MS_PER_DAY) + 1;
  if (days > maxDays) throw new TypeError(`Rental period cannot exceed ${maxDays} days.`);
  return { startDate, endDate, days };
}

export function normalizeEquipmentInput(body = {}) {
  const type = cleanText(body.type, 30);
  const condition = cleanText(body.condition, 30);
  if (!EQUIPMENT_TYPES.includes(type)) throw new TypeError('Select a valid equipment type.');
  if (!EQUIPMENT_CONDITIONS.includes(condition)) throw new TypeError('Select a valid equipment condition.');

  const name = cleanText(body.name, 100);
  const district = cleanText(body.district, 80);
  const state = cleanText(body.state, 80);
  if (!name) throw new TypeError('Equipment name is required.');
  if (!district) throw new TypeError('District is required.');
  if (!state) throw new TypeError('State is required.');

  const from = parseDateOnly(body.availabilityFrom, 'Available from');
  const to = parseDateOnly(body.availabilityTo, 'Available to');
  if (to < from) throw new TypeError('Available-to date must be on or after available-from date.');

  let horsepower = null;
  if (body.horsepower !== '' && body.horsepower !== null && body.horsepower !== undefined) {
    horsepower = Number(body.horsepower);
    if (!Number.isFinite(horsepower) || horsepower < 1 || horsepower > 1000) throw new TypeError('Horsepower must be between 1 and 1000.');
    horsepower = Math.round(horsepower * 10) / 10;
  }

  return {
    name,
    type,
    description: cleanText(body.description, 600),
    district,
    state,
    dailyRate: parseMoney(body.dailyRate, { min: 1, max: 100000, field: 'Daily rate' }),
    securityDeposit: parseMoney(body.securityDeposit || 0, { min: 0, max: 500000, field: 'Security deposit' }),
    condition,
    horsepower,
    availability: { from, to }
  };
}

export function calculateRentalQuote(dailyRate, days) {
  const rate = parseMoney(dailyRate, { min: 1, max: 100000, field: 'Daily rate' });
  if (!Number.isInteger(days) || days < 1 || days > 90) throw new TypeError('Rental days must be between 1 and 90.');
  return Math.round(rate * days * 100) / 100;
}

export function overlapsWindow(existingStart, existingEnd, requestedStart, requestedEnd) {
  return new Date(existingStart) <= new Date(requestedEnd) && new Date(existingEnd) >= new Date(requestedStart);
}

export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

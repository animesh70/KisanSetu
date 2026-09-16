import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import equipmentTranslations from '../src/localization/equipmentTranslations.js';

const originalFetch = globalThis.fetch;

async function loadApi() {
  const { api } = await import('../src/services/api.js');
  return api;
}

function mockFetch() {
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    return {
      ok: true,
      json: async () => ({ items: [], rentals: [] })
    };
  };
  return calls;
}

test.after(() => { globalThis.fetch = originalFetch; });

test('equipment marketplace sends selected demo farmer identity', async () => {
  const calls = mockFetch();
  const api = await loadApi();

  await api.getEquipment({}, 'farmer-2');
  assert.equal(calls.at(-1).options.headers['x-demo-user-id'], 'farmer-2');

  await api.getEquipmentRentals('farmer-3');
  assert.equal(calls.at(-1).options.headers['x-demo-user-id'], 'farmer-3');
  assert.equal(calls.at(-1).options.headers['x-demo-role'], 'farmer');

  await api.updateEquipmentRental('rental-1', 'approved', 'farmer-2');
  assert.equal(calls.at(-1).options.headers['x-demo-user-id'], 'farmer-2');
  assert.equal(JSON.parse(calls.at(-1).options.body).status, 'approved');
});

test('equipment API keeps farmer-1 as backwards-compatible default', async () => {
  const calls = mockFetch();
  const api = await loadApi();
  await api.getEquipmentRentals();
  assert.equal(calls.at(-1).options.headers['x-demo-user-id'], 'farmer-1');
});

test('all 12 equipment locales include demo user switcher labels', () => {
  const expected = ['en', 'hi', 'mr', 'ur', 'tr', 'es', 'pa', 'or', 'bn', 'gu', 'te', 'ta'];
  assert.deepEqual(Object.keys(equipmentTranslations).sort(), expected.sort());
  for (const language of expected) {
    for (const key of ['demoUser', 'viewingAs', 'switchUser', 'demoUserHint']) {
      assert.equal(typeof equipmentTranslations[language][key], 'string', `${language}.${key}`);
      assert.ok(equipmentTranslations[language][key].trim().length > 0, `${language}.${key}`);
    }
  }
});


test('demo account switcher lives in the sidebar profile card, not inside the equipment marketplace', async () => {
  const [appSource, marketplaceSource] = await Promise.all([
    readFile(new URL('../src/App.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/EquipmentMarketplace.jsx', import.meta.url), 'utf8')
  ]);
  assert.match(appSource, /sidebar-account-select/);
  assert.match(appSource, /<EquipmentMarketplace demoUserId=\{equipmentDemoUserId\} resetVersion=\{equipmentResetVersion\}\/>/);
  assert.doesNotMatch(marketplaceSource, /equipment-demo-user-switcher/);
});

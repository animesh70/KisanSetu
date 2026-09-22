import assert from 'node:assert/strict';
import test from 'node:test';
import routePlannerTranslations from '../src/localization/routePlannerTranslations.js';

test('all 12 route-planner buttons use the localized Smart Route Planner name', () => {
  assert.equal(Object.keys(routePlannerTranslations).length, 12);
  for (const translation of Object.values(routePlannerTranslations)) {
    assert.equal(translation.open, translation.plannerName);
    assert.ok(translation.open.trim());
  }
});

test('alternative route labels preserve their one-based route number', () => {
  for (const translation of Object.values(routePlannerTranslations)) {
    assert.match(translation.alternative, /\{\{number\}\}/);
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import equipmentTranslations from '../src/localization/equipmentTranslations.js';

const languages = ['en', 'hi', 'mr', 'ur', 'tr', 'es', 'pa', 'or', 'bn', 'gu', 'te', 'ta'];
const assistantKeys = [
  'assistantTitle',
  'openMarketplace',
  'assistantIntroAddon',
  'assistantOverview',
  'assistantRentHelp',
  'assistantListHelp',
  'assistantApprovalHelp',
  'assistantStatusSummary',
  'assistantCurrentUser',
  'assistantAvailable',
  'assistantNoAvailable'
];

test('equipment assistant help is available in all 12 supported languages', () => {
  for (const language of languages) {
    const translation = equipmentTranslations[language];
    assert.ok(translation, `missing equipment translation for ${language}`);
    for (const key of assistantKeys) {
      assert.equal(typeof translation[key], 'string', `${language}.${key} must be a string`);
      assert.ok(translation[key].trim().length > 0, `${language}.${key} must not be empty`);
    }
  }
});

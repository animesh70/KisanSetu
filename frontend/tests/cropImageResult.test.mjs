import assert from 'node:assert/strict';
import test from 'node:test';
import { cropImageAssistantMessage } from '../src/services/cropImageResult.js';

const strings = {
  'assistant.photo': 'Crop photo',
  'assistant.imageNotCropTitle': 'Not a crop image',
  'assistant.imageNotCrop': "This doesn't appear to be a crop photo.",
  'assistant.imageConditionUnclear': 'Condition unclear',
  'assistant.imageUnclear': "I couldn't clearly identify a crop.",
  'assistant.imagePlant': 'Plant detected',
  'assistant.imageProduce': 'Harvested produce',
  'assistant.imageHarvested': 'Harvested produce is visible. Living-plant disease screening is not applicable.',
  'assistant.imageUnsupported': 'Disease screening is not supported for this crop. No condition identified.',
  'assistant.imageHealthy': 'No obvious visual disease symptoms were identified.',
  'assistant.imageHealthUnclear': 'A plant is visible, but its condition cannot be identified reliably.',
  'assistant.imagePossibleCondition': 'Possible condition: {{condition}}',
  'assistant.imageVisibleSigns': 'Visible signs',
  'assistant.imageNextStep': 'Recommended next step',
  'assistant.imageDisclaimer': 'Confirm with an agriculture expert.'
};
const t = (key, values = {}) => (strings[key] || key).replace('{{condition}}', values.condition || '');

test('non-crop UI contains no disease, percentage, price wording, or recommendation action', () => {
  const message = cropImageAssistantMessage({
    imageType: 'not_crop', isCropImage: false, result: null, confidence: null
  }, t);

  assert.equal(message.title, 'Not a crop image');
  assert.equal(message.message, "This doesn't appear to be a crop photo.");
  assert.equal(message.action, '');
  assert.doesNotMatch(`${message.title} ${message.message}`, /Purple blotch|%|price|recommendation/i);
});

test('healthy crop UI does not invent a disease or percentage', () => {
  const message = cropImageAssistantMessage({
    imageType: 'crop_or_plant', isCropImage: true, crop: 'Onion', healthStatus: 'healthy',
    possibleCondition: null, conditionConfidence: null, observations: ['Leaves appear green'], nextStep: 'Continue monitoring.'
  }, t);

  assert.equal(message.title, 'Crop photo · Onion');
  assert.match(message.message, /No obvious visual disease symptoms/);
  assert.doesNotMatch(message.message, /Purple blotch|%/);
});

test('valid possibly diseased crop UI shows condition, signs, next step, and expert disclaimer', () => {
  const message = cropImageAssistantMessage({
    imageType: 'crop_or_plant', isCropImage: true, crop: 'Onion', healthStatus: 'possibly_diseased',
    possibleCondition: 'Purple blotch', conditionConfidence: null,
    observations: ['Purple-brown lesions are visible'], nextStep: 'Request a field inspection.'
  }, t);

  assert.match(message.message, /Possible condition: Purple blotch/);
  assert.match(message.message, /Visible signs: Purple-brown lesions/);
  assert.match(message.message, /Recommended next step: Request a field inspection/);
  assert.match(message.message, /Confirm with an agriculture expert/);
  assert.doesNotMatch(message.message, /%|Price guidance/);
});

test('unclear image UI asks for another photo and does not guess', () => {
  const message = cropImageAssistantMessage({ imageType: 'unclear', isCropImage: null }, t);
  assert.equal(message.title, 'Crop photo · Condition unclear');
  assert.equal(message.message, "I couldn't clearly identify a crop.");
  assert.doesNotMatch(message.message, /Purple blotch|%/);
});

test('harvested produce gets informational response without plant or disease claims', () => {
  const message = cropImageAssistantMessage({ imageType: 'harvested_produce', isCropImage: true, crop: 'Onion', result: null, confidence: null }, t);
  assert.equal(message.title, 'Crop photo · Onion');
  assert.match(message.message, /Harvested produce is visible/);
  assert.doesNotMatch(message.message, /Plant detected|Purple blotch|%|price/i);
  assert.equal(message.action, '');
});

test('unsupported onion screening never displays a condition or percentage', () => {
  const message = cropImageAssistantMessage({ imageType: 'crop_or_plant', isCropImage: true, crop: 'Onion', healthStatus: 'unclear', messageCode: 'UNSUPPORTED_CROP' }, t);
  assert.match(message.message, /not supported/);
  assert.doesNotMatch(message.message, /Early blight|Purple blotch|%/);
  assert.equal(message.action, '');
});

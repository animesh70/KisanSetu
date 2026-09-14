/** Run with the API already started: node tests/smoke.mjs */
const baseUrl = process.env.API_URL || 'http://localhost:5000/api';
const checks = [
  ['/health', 200],
  ['/markets/prices?crop=Onion', 200],
  ['/markets/trends?crop=Onion', 200],
  ['/markets/forecast?crop=Onion', 200],
  ['/advisor/price?crop=Onion&days=7', 200],
  ['/recommendations/sell?crop=Onion&quantity=100&grade=A', 200],
  ['/buyers', 200],
  ['/lots', 200]
];

for (const [path, expectedStatus] of checks) {
  const response = await fetch(`${baseUrl}${path}`);
  if (response.status !== expectedStatus) throw new Error(`${path}: expected ${expectedStatus}, received ${response.status}`);
  console.log(`✓ ${path}`);
}

const diseaseResponse = await fetch(`${baseUrl}/advisor/disease?crop=Tomato`, {
  method: 'POST',
  headers: { 'content-type': 'image/png', 'x-file-name': 'smoke-test.png' },
  body: Buffer.alloc(256, 7)
});
if (diseaseResponse.status !== 200) throw new Error(`/advisor/disease: expected 200, received ${diseaseResponse.status}`);
const diseaseResult = await diseaseResponse.json();
if (diseaseResult.analysisMode !== 'mock-image-advisor' || diseaseResult.requiresExpertConfirmation !== true) {
  throw new Error('/advisor/disease did not return the required transparent prototype labels');
}
console.log('✓ /advisor/disease');

const invalidTtsResponse = await fetch(`${baseUrl}/tts`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ text: 'KisanSetu', language: 'unsupported' })
});
if (invalidTtsResponse.status !== 400) throw new Error(`/tts validation: expected 400, received ${invalidTtsResponse.status}`);
console.log('✓ /tts validation');
console.log('KisanSetu API smoke test passed.');

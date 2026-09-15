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
  body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64')
});
const diseaseResult = await diseaseResponse.json();
if (diseaseResponse.status === 200) {
  if (!['crop_or_plant', 'not_crop', 'unclear', 'harvested_produce'].includes(diseaseResult.imageType) || diseaseResult.analysisMode !== 'crop-image-screening') {
    throw new Error('/advisor/disease did not return a normalized crop screening result');
  }
} else if (diseaseResponse.status !== 400 && diseaseResponse.status !== 502 && diseaseResponse.status !== 504
  && (diseaseResponse.status !== 503 || diseaseResult.error?.code !== 'VISION_NOT_CONFIGURED')) {
  throw new Error(`/advisor/disease: expected a vision result or safe unconfigured response, received ${diseaseResponse.status}`);
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

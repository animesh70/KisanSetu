/** Run with the API already started: node tests/smoke.mjs */
const baseUrl = process.env.API_URL || 'http://localhost:5000/api';
const checks = [
  ['/health', 200],
  ['/markets/prices?crop=Onion', 200],
  ['/markets/trends?crop=Onion', 200],
  ['/markets/forecast?crop=Onion', 200],
  ['/recommendations/sell?crop=Onion&quantity=100&grade=A', 200],
  ['/buyers', 200],
  ['/lots', 200]
];

for (const [path, expectedStatus] of checks) {
  const response = await fetch(`${baseUrl}${path}`);
  if (response.status !== expectedStatus) throw new Error(`${path}: expected ${expectedStatus}, received ${response.status}`);
  console.log(`✓ ${path}`);
}
console.log('KisanSetu API smoke test passed.');

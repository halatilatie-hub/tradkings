const assert = require('node:assert/strict');
const { getMarketOverview } = require('../src/services/derivService');

(async () => {
  const overview = await getMarketOverview();

  assert.deepStrictEqual(
    overview,
    [],
    'Expected no mock market overview when no live market provider is configured.'
  );

  console.log('no-mock-candles test passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

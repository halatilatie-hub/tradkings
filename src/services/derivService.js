const { isConfigured: isAlpacaConfigured, getMarketOverview: getAlpacaOverview } = require('./alpacaService');

const supportedSymbols = [
  { symbol: 'XAUUSD', name: 'Gold', type: 'forex', derivSymbol: 'XAUUSD' },
  { symbol: 'US30', name: 'US30', type: 'index', derivSymbol: 'US30' },
  { symbol: 'NAS100', name: 'NAS100', type: 'index', derivSymbol: 'NAS100' },
  { symbol: 'GER30', name: 'GER30', type: 'index', derivSymbol: 'GER30' },
  { symbol: 'GER40', name: 'GER40', type: 'index', derivSymbol: 'GER40' }
];

const granularityMap = {
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '1h': 3600,
  '4h': 14400,
  '1d': 86400
};

async function fetchFromDeriv(symbol, timeframe = '1h', count = 120) {
  const appId = process.env.DERIV_APP_ID;
  const derivBaseUrl = process.env.DERIV_API_URL || 'https://api.deriv.com';

  if (!appId) {
    return null;
  }

  const granularity = granularityMap[timeframe] || granularityMap['1h'];
  const targetSymbol = supportedSymbols.find((item) => item.symbol === symbol)?.derivSymbol || symbol;

  try {
    const response = await fetch(`${derivBaseUrl}/api/v3`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'ticks_history',
        params: {
          ticks_history: targetSymbol,
          style: 'candles',
          granularity,
          count,
          end: 'latest'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Deriv request failed with status ${response.status}`);
    }

    const payload = await response.json();
    const candles = payload?.result?.candles || [];

    return candles.map((candle) => ({
      time: new Date(candle.epoch * 1000).toISOString(),
      open: Number(candle.open),
      high: Number(candle.high),
      low: Number(candle.low),
      close: Number(candle.close),
      volume: Number(candle.volume || 0)
    }));
  } catch (error) {
    console.warn(`Deriv fetch failed for ${symbol}: ${error.message}`);
    return null;
  }
}

async function getMarketSymbols() {
  return supportedSymbols;
}

async function getMarketOverview() {
  if (isAlpacaConfigured()) {
    const alpacaOverview = await getAlpacaOverview();
    if (alpacaOverview && alpacaOverview.length) {
      return alpacaOverview;
    }
  }

  if (!process.env.DERIV_APP_ID) {
    return [];
  }

  const items = [];

  for (const item of supportedSymbols) {
    const candles = await fetchFromDeriv(item.symbol, '1h', 40);

    if (!Array.isArray(candles) || candles.length < 2) {
      continue;
    }

    const last = candles[candles.length - 1];
    const prev = candles[candles.length - 2];
    const change = prev ? ((last.close - prev.close) / prev.close) * 100 : 0;

    items.push({
      symbol: item.symbol,
      name: item.name,
      type: item.type,
      lastPrice: last.close,
      changePercent: Number(change.toFixed(2)),
      timeframe: '1h'
    });
  }

  return items;
}

module.exports = {
  supportedSymbols,
  getMarketSymbols,
  getMarketOverview,
  fetchFromDeriv
};

const {
  alphaVantageApiKey,
  alphaVantageUrl,
  alpacaApiKey,
  alpacaApiSecret,
  alpacaDataUrl
} = require('../config');

const supportedSymbols = [
  { symbol: 'XAUUSD', name: 'Gold', type: 'forex' },
  { symbol: 'US30', name: 'US30', type: 'index' },
  { symbol: 'NAS100', name: 'NAS100', type: 'index' },
  { symbol: 'GER30', name: 'GER30', type: 'index' },
  { symbol: 'GER40', name: 'GER40', type: 'index' }
];

function resolveAlphaVantageSymbol(symbol) {
  const map = {
    XAUUSD: 'XAUUSD',
    US30: 'DJI',
    NAS100: 'IXIC',
    GER30: 'DAX',
    GER40: 'DAX'
  };

  return map[symbol] || symbol;
}

function resolveAlpacaSymbol(symbol) {
  const map = {
    XAUUSD: 'GLD',
    US30: 'SPY',
    NAS100: 'QQQ',
    GER30: 'DAX',
    GER40: 'DAX'
  };

  return map[symbol] || symbol;
}

function isConfigured() {
  const alphaConfigured = Boolean(alphaVantageApiKey && alphaVantageUrl);
  const alpacaConfigured = Boolean(alpacaApiKey && alpacaApiSecret && alpacaDataUrl);
  return alphaConfigured || alpacaConfigured;
}

async function fetchFromAlphaVantage(symbol) {
  const resolvedSymbol = resolveAlphaVantageSymbol(symbol);

  try {
    const params = new URLSearchParams({
      function: 'GLOBAL_QUOTE',
      symbol: resolvedSymbol,
      apikey: alphaVantageApiKey
    });

    const response = await fetch(`${alphaVantageUrl}?${params.toString()}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Alpha Vantage quote request failed: ${response.status}`);
    }

    const payload = await response.json();

    if (payload?.Note) {
      throw new Error('Alpha Vantage rate limit reached');
    }

    const quote = payload?.['Global Quote'];
    if (!quote || typeof quote !== 'object') {
      return null;
    }

    const price = Number(quote['05. price'] || 0);
    const changePercent = Number((quote['10. change percent'] || '0%').replace('%', '') || 0);

    if (!price) {
      return null;
    }

    return {
      symbol,
      resolvedSymbol,
      bid: price,
      ask: price,
      mid: price,
      changePercent,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.warn(`Alpha Vantage quote fetch failed for ${symbol}: ${error.message}`);
    return null;
  }
}

async function fetchFromAlpaca(symbol) {
  const resolvedSymbol = resolveAlpacaSymbol(symbol);

  try {
    const response = await fetch(`${alpacaDataUrl}/v2/stocks/${resolvedSymbol}/quotes/latest`, {
      method: 'GET',
      headers: {
        'APCA-API-KEY-ID': alpacaApiKey,
        'APCA-API-SECRET-KEY': alpacaApiSecret
      }
    });

    if (!response.ok) {
      throw new Error(`Alpaca quote request failed: ${response.status}`);
    }

    const payload = await response.json();
    const quote = payload?.quote || payload?.data?.[0]?.quote || payload?.message;

    if (!quote || typeof quote !== 'object') {
      return null;
    }

    return {
      symbol,
      resolvedSymbol,
      bid: Number(quote.bp || quote.bid_price || 0),
      ask: Number(quote.ap || quote.ask_price || 0),
      mid: Number(((Number(quote.bp || quote.bid_price || 0) + Number(quote.ap || quote.ask_price || 0)) / 2).toFixed(4)),
      changePercent: 0,
      timestamp: quote.t || new Date().toISOString()
    };
  } catch (error) {
    console.warn(`Alpaca quote fetch failed for ${symbol}: ${error.message}`);
    return null;
  }
}

async function getLatestQuote(symbol) {
  if (alphaVantageApiKey && alphaVantageUrl) {
    return fetchFromAlphaVantage(symbol);
  }

  if (alpacaApiKey && alpacaApiSecret && alpacaDataUrl) {
    return fetchFromAlpaca(symbol);
  }

  return null;
}

async function getMarketOverview() {
  if (!isConfigured()) {
    return [];
  }

  const provider = alphaVantageApiKey && alphaVantageUrl ? 'alphavantage' : 'alpaca';
  const items = [];

  for (const item of supportedSymbols) {
    const quote = await getLatestQuote(item.symbol);

    if (!quote) {
      continue;
    }

    items.push({
      symbol: item.symbol,
      name: item.name,
      type: item.type,
      lastPrice: quote.mid,
      changePercent: Number(quote.changePercent ?? 0),
      timeframe: 'realtime',
      provider
    });
  }

  return items;
}

module.exports = {
  supportedSymbols,
  getLatestQuote,
  getMarketOverview,
  isConfigured,
  resolveAlphaVantageSymbol,
  resolveAlpacaSymbol
};

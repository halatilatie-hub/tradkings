module.exports = {
  appName: 'Tradkings SMC Bot',
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/tradkings',

  alphaVantageApiKey:
    process.env.ALPHAVANTAGE_API_KEY ||
    process.env.ALPHA_VANTAGE_API_KEY ||
    '',
  alphaVantageUrl:
    process.env.ALPHAVANTAGE_API_URL ||
    'https://www.alphavantage.co/query',

  alpacaApiKey: process.env.ALPACA_API_KEY || '',
  alpacaApiSecret: process.env.ALPACA_API_SECRET || '',
  alpacaDataUrl: process.env.ALPACA_DATA_URL || 'https://data.alpaca.markets',
  alpacaTradingUrl: process.env.ALPACA_TRADING_URL || 'https://paper-api.alpaca.markets',
  derivApiUrl: process.env.DERIV_API_URL || 'https://api.deriv.com',
  derivAppId: process.env.DERIV_APP_ID || ''
};

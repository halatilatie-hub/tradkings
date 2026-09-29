const { getMarketSymbols, getMarketOverview, fetchFromDeriv } = require('../services/derivService');

async function getSymbols(req, res) {
  try {
    const symbols = await getMarketSymbols();
    res.json({ success: true, data: symbols });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getOverview(req, res) {
  try {
    const overview = await getMarketOverview();
    res.json({ success: true, data: overview });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getCandles(req, res) {
  try {
    const symbol = String(req.query.symbol || 'XAUUSD').toUpperCase();
    const timeframe = String(req.query.timeframe || '1h');
    const count = Math.max(20, Math.min(300, Number(req.query.count) || 120));

    const candles = await fetchFromDeriv(symbol, timeframe, count);

    if (!Array.isArray(candles) || candles.length === 0) {
      return res.status(503).json({
        success: false,
        message: 'No live candle data is available. Configure a market data provider first.'
      });
    }

    return res.json({
      success: true,
      data: candles.slice(-count)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  getSymbols,
  getOverview,
  getCandles
};

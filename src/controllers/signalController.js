const { fetchFromDeriv } = require('../services/derivService');
const { analyzeSMC } = require('../services/smcService');
const MarketSignal = require('../models/MarketSignal');

async function analyzeSignal(req, res) {
  try {
    const rawSymbol = String(req.body?.symbol || 'XAUUSD').toUpperCase();
    const rawTimeframe = String(req.body?.timeframe || '1h');
    const allowedTimeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];

    const symbol = rawSymbol || 'XAUUSD';
    const timeframe = allowedTimeframes.includes(rawTimeframe) ? rawTimeframe : '1h';

    const candles = await fetchFromDeriv(symbol, timeframe, 180);

    if (!Array.isArray(candles) || candles.length < 50) {
      return res.status(503).json({
        success: false,
        message: 'No live candle data is available for signal analysis. Configure a market data provider first.'
      });
    }

    const signal = analyzeSMC(candles);

    if (!signal || signal.confidence <= 0 || !signal.direction || signal.direction === 'none') {
      return res.status(422).json({
        success: false,
        message: 'No valid trading signal was generated from the current market structure.',
        data: { symbol, timeframe, signal, candles: candles.slice(-20) }
      });
    }

    try {
      await MarketSignal.create({
        symbol,
        timeframe,
        bias: signal?.bias || 'neutral',
        structure: signal?.structure || 'unknown',
        direction: signal?.direction || 'none',
        breakLevel: Number(signal?.breakLevel ?? 0),
        retestLevel: Number(signal?.retestLevel ?? 0),
        confidence: Number(signal?.confidence ?? 0)
      });
    } catch (dbError) {
      console.warn('Market signal save skipped:', dbError.message);
    }

    return res.json({
      success: true,
      data: {
        symbol,
        timeframe,
        signal,
        candles: candles.slice(-20)
      }
    });
  } catch (error) {
    console.error('analyzeSignal error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { analyzeSignal };

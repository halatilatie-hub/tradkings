const mongoose = require('mongoose');

const MarketSignalSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true, index: true },
    timeframe: { type: String, required: true },
    bias: { type: String, default: 'neutral' },
    structure: { type: String, default: 'unknown' },
    direction: { type: String, default: 'none' },
    breakLevel: { type: Number, default: 0 },
    retestLevel: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
  },
  {
    collection: 'market_signals'
  }
);

module.exports = mongoose.models.MarketSignal || mongoose.model('MarketSignal', MarketSignalSchema);

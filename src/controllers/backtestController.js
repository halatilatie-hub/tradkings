const { runBacktest } = require('../services/backtestService');

async function run(req, res) {
  try {
    const { symbol = 'XAUUSD', timeframe = '1h', days = 30 } = req.body;
    const result = await runBacktest({ symbol, timeframe, days });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { run };

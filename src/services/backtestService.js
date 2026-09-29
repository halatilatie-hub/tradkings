const { fetchFromDeriv } = require('./derivService');
const { analyzeSMC } = require('./smcService');
const { calculateRiskTrade } = require('./riskService');

function calculateMetrics(trades) {
  const wins = trades.filter((t) => t.pnl > 0).length;
  const losses = trades.filter((t) => t.pnl < 0).length;
  const totalPnL = trades.reduce((sum, trade) => sum + trade.pnl, 0);
  const grossProfit = trades.filter((t) => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
  const grossLoss = Math.abs(
    trades.filter((t) => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0)
  );

  const winRate = trades.length ? (wins / trades.length) * 100 : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  const maxDrawdown = trades.reduce((max, t) => {
    const drawdown = Math.abs(t.pnl) > max ? Math.abs(t.pnl) : max;
    return drawdown;
  }, 0);

  return {
    totalTrades: trades.length,
    wins,
    losses,
    winRate: Number(winRate.toFixed(2)),
    totalPnL: Number(totalPnL.toFixed(2)),
    profitFactor: Number(profitFactor.toFixed(2)),
    maxDrawdown: Number(maxDrawdown.toFixed(2)),
    grossProfit: Number(grossProfit.toFixed(2)),
    grossLoss: Number(grossLoss.toFixed(2))
  };
}

async function runBacktest({ symbol = 'XAUUSD', timeframe = '1h', days = 30 }) {
  const candles = await fetchFromDeriv(symbol, timeframe, 220);

  if (!Array.isArray(candles) || candles.length < 50) {
    throw new Error('No live candle data is available for backtesting. Configure a market data provider first.');
  }

  const trades = [];

  for (let i = 35; i < candles.length - 2; i++) {
    const window = candles.slice(i - 25, i + 20);
    const signal = analyzeSMC(window);

    if (!signal || !signal.direction || signal.confidence < 0.7) continue;

    const entry = signal.entryPrice ?? candles[i].close;
    const stop = signal.stopLoss ?? (signal.direction === 'long' ? candles[i].low - 5 : candles[i].high + 5);
    const target = signal.takeProfit ?? (signal.direction === 'long' ? entry + 12 : entry - 12);
    const accountBalance = 250;
    const estimatedPips = Math.max(50, Math.abs(entry - stop) * 10);
    const riskProfile = calculateRiskTrade({
      balance: accountBalance,
      estimatedPips,
      stopLossPips: Math.max(1, Math.abs(entry - stop)),
      pipValuePerLot: 170,
      mode: 'auto'
    });

    const exitPrice = candles[i + 1].close;
    const pnl =
      signal.direction === 'long'
        ? Number(((exitPrice - entry) * 1).toFixed(2))
        : Number(((entry - exitPrice) * 1).toFixed(2));

    trades.push({
      symbol,
      timeframe,
      signal: signal.structure,
      direction: signal.direction,
      entry,
      stop,
      target,
      exitPrice,
      pnl,
      risk: {
        mode: riskProfile.mode,
        riskPercent: riskProfile.riskPercent,
        riskAmount: Number(riskProfile.riskAmount.toFixed(2)),
        lotSize: Number(riskProfile.lotSize.toFixed(4)),
        takeProfitPips: riskProfile.takeProfitPips,
        balanceAfterStopLoss: Number(riskProfile.balanceAfterStopLoss.toFixed(2)),
        balanceAfterTakeProfit: Number(riskProfile.balanceAfterTakeProfit.toFixed(2))
      }
    });
  }

  const metrics = calculateMetrics(trades);

  return {
    symbol,
    timeframe,
    days,
    generatedCandles: candles.length,
    trades,
    metrics
  };
}

async function getDashboardSummary() {
  const symbols = ['XAUUSD', 'US30', 'NAS100', 'GER30', 'GER40'];

  const market = await Promise.all(
    symbols.map(async (symbol) => {
      const result = await runBacktest({ symbol, timeframe: '1h', days: 30 });
      return {
        symbol,
        status: result.metrics.totalTrades > 0 ? 'active' : 'idle',
        totalTrades: result.metrics.totalTrades,
        totalPnL: result.metrics.totalPnL,
        winRate: result.metrics.winRate
      };
    })
  );

  return {
    title: 'Tradkings Dashboard',
    timestamp: new Date().toISOString(),
    totalSymbols: symbols.length,
    market
  };
}

module.exports = {
  runBacktest,
  getDashboardSummary
};

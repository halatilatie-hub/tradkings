function validateCandles(candles) {
  if (!Array.isArray(candles) || candles.length < 20) {
    return { valid: false, reason: 'insufficient-data' };
  }

  const validCandles = candles.filter((candle) => {
    if (!candle || typeof candle !== 'object') return false;
    return Number.isFinite(Number(candle.open))
      && Number.isFinite(Number(candle.high))
      && Number.isFinite(Number(candle.low))
      && Number.isFinite(Number(candle.close));
  });

  if (validCandles.length < 20) {
    return { valid: false, reason: 'invalid-candle-data' };
  }

  return { valid: true, candles: validCandles };
}

function detectTrend(candles) {
  if (!candles || candles.length < 10) return 'neutral';

  const recent = candles.slice(-20);
  const avgClose = recent.reduce((sum, candle) => sum + Number(candle.close), 0) / recent.length;
  const first = Number(recent[0].close);
  const last = Number(recent[recent.length - 1].close);
  const directionalSlope = (last - first) / Math.max(Math.abs(first), 1);
  const risingCandles = recent.slice(1).filter((candle, index) => Number(candle.close) > Number(recent[index].close)).length;
  const fallingCandles = recent.slice(1).filter((candle, index) => Number(candle.close) < Number(recent[index].close)).length;

  if (directionalSlope > 0.01 && (last > avgClose || risingCandles >= fallingCandles)) return 'bullish';
  if (directionalSlope < -0.01 && (last < avgClose || fallingCandles >= risingCandles)) return 'bearish';
  return 'neutral';
}

function findSwingLevels(candles) {
  const recent = candles.slice(-30);
  let recentHigh = Number.NEGATIVE_INFINITY;
  let recentLow = Number.POSITIVE_INFINITY;

  recent.forEach((candle) => {
    recentHigh = Math.max(recentHigh, Number(candle.high));
    recentLow = Math.min(recentLow, Number(candle.low));
  });

  return {
    recentHigh,
    recentLow
  };
}

function analyzeBreakRetest(candles) {
  const validation = validateCandles(candles);

  if (!validation.valid) {
    return {
      bias: 'neutral',
      structure: validation.reason,
      breakLevel: null,
      retestLevel: null,
      entryPrice: null,
      stopLoss: null,
      takeProfit: null,
      confidence: 0,
      direction: 'none'
    };
  }

  const normalizedCandles = validation.candles;

  const trend = detectTrend(normalizedCandles);
  const { recentHigh, recentLow } = findSwingLevels(normalizedCandles);
  const last = normalizedCandles[normalizedCandles.length - 1];
  const prev = normalizedCandles[normalizedCandles.length - 2];
  const beforeLast = normalizedCandles[normalizedCandles.length - 3];

  const bullishBreak =
    trend === 'bullish' &&
    last.close > recentHigh * 0.998 &&
    prev.close < recentHigh &&
    last.close > beforeLast.close;

  const bearishBreak =
    trend === 'bearish' &&
    last.close < recentLow * 1.002 &&
    prev.close > recentLow &&
    last.close < beforeLast.close;

  const bullishRetest =
    bullishBreak &&
    last.low <= recentHigh * 1.001 &&
    last.close >= recentHigh * 0.999;

  const bearishRetest =
    bearishBreak &&
    last.high >= recentLow * 0.999 &&
    last.close <= recentLow * 1.001;

  const trendBreakLong =
    trend === 'bullish' &&
    last.close > recentHigh * 0.995 &&
    last.close > prev.close &&
    last.low > beforeLast.low;

  const trendBreakShort =
    trend === 'bearish' &&
    last.close < recentLow * 1.005 &&
    last.close < prev.close &&
    last.high < beforeLast.high;

  const longDirection = bullishRetest || trendBreakLong;
  const shortDirection = bearishRetest || trendBreakShort;
  const bullishTrendContinuation = trend === 'bullish' && last.close > prev.close && last.close > recentHigh * 0.995;
  const bearishTrendContinuation = trend === 'bearish' && last.close < prev.close && last.close < recentLow * 1.005;
  const direction = longDirection || bullishTrendContinuation ? 'long' : shortDirection || bearishTrendContinuation ? 'short' : 'none';
  const breakLevel = direction === 'long' ? recentHigh : direction === 'short' ? recentLow : null;
  const retestLevel = breakLevel;

  const entryPrice = direction === 'long' ? last.close : direction === 'short' ? last.close : null;
  const stopLoss =
    direction === 'long'
      ? Math.min(last.low, recentHigh) - 0.5
      : direction === 'short'
        ? Math.max(last.high, recentLow) + 0.5
        : null;

  const takeProfit =
    direction === 'long'
      ? entryPrice + (entryPrice - stopLoss) * 2.5
      : direction === 'short'
        ? entryPrice - (stopLoss - entryPrice) * 2.5
        : null;

  const confidence =
    direction === 'long' || direction === 'short'
      ? (bullishRetest || bearishRetest ? 0.82 : 0.72)
      : trend === 'bullish' || trend === 'bearish'
        ? 0.62
        : 0.35;

  return {
    bias: trend,
    structure: direction === 'long' ? 'bullish-break-retest' : direction === 'short' ? 'bearish-break-retest' : 'neutral',
    breakLevel,
    retestLevel,
    entryPrice,
    stopLoss,
    takeProfit,
    confidence,
    direction
  };
}

function analyzeSMC(candles) {
  return analyzeBreakRetest(candles);
}

module.exports = {
  detectTrend,
  findSwingLevels,
  analyzeBreakRetest,
  analyzeSMC
};

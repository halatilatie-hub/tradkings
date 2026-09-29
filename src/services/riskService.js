const RISK_RULES = {
  FIXED_RISK_PERCENT: 0.03,
  AGGRESSIVE_PIP_THRESHOLD: 1000,
  AGGRESSIVE_RISK_PERCENT: 0.5,
  TAKE_PROFIT_RATIO: 5,
  BREAKEVEN_TRIGGER_R: 2,
  PIP_VALUE_PER_LOT: 170,
  TIER_RISK_CAP: 0.5,
  TIER_BASE_RISK_PERCENT: 0.2,
  TIER_STEP: 0.05,
  TIER_START_BALANCE: 150,
  TIER_BALANCE_STEP: 50,
  TARGET_MULTIPLE_IN_AGGRESSIVE_MODE: 20
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function calculateCurveRiskPercent(balance) {
  const accountBalance = Number(balance) || 0;

  if (accountBalance <= 0) {
    return 0;
  }

  if (accountBalance < RISK_RULES.TIER_START_BALANCE) {
    return RISK_RULES.TIER_BASE_RISK_PERCENT;
  }

  const ratio = (accountBalance - RISK_RULES.TIER_START_BALANCE) / RISK_RULES.TIER_BALANCE_STEP;
  const rawRisk =
    RISK_RULES.TIER_BASE_RISK_PERCENT +
    RISK_RULES.TIER_STEP * Math.pow(ratio, 2);

  return clamp(rawRisk, RISK_RULES.TIER_BASE_RISK_PERCENT, RISK_RULES.TIER_RISK_CAP);
}

function calculateRiskProfile({
  balance = 0,
  estimatedPips = 0,
  stopLossPips = 0,
  pipValuePerLot = RISK_RULES.PIP_VALUE_PER_LOT,
  mode = 'auto'
} = {}) {
  const accountBalance = Number(balance) || 0;
  const estimatedPipCount = Number(estimatedPips) || 0;
  const stopDistance = Number(stopLossPips) || 0;
  const perLotValue = Number(pipValuePerLot) || RISK_RULES.PIP_VALUE_PER_LOT;

  const aggressiveMode = mode === 'aggressive' || estimatedPipCount > RISK_RULES.AGGRESSIVE_PIP_THRESHOLD;
  const strategyCurve = calculateCurveRiskPercent(accountBalance);

  const profileMode = aggressiveMode ? 'aggressive' : 'strategy';
  const riskPercent = aggressiveMode
    ? RISK_RULES.AGGRESSIVE_RISK_PERCENT
    : mode === 'fixed'
      ? RISK_RULES.FIXED_RISK_PERCENT
      : mode === 'curve'
        ? strategyCurve
        : Math.max(RISK_RULES.FIXED_RISK_PERCENT, strategyCurve);

  const riskAmount = accountBalance * riskPercent;
  const lotSize = stopDistance > 0 && perLotValue > 0 ? riskAmount / (stopDistance * perLotValue) : 0;
  const takeProfitPips = stopDistance > 0 ? stopDistance * RISK_RULES.TAKE_PROFIT_RATIO : 0;
  const breakevenTriggerPips = stopDistance > 0 ? stopDistance * RISK_RULES.BREAKEVEN_TRIGGER_R : 0;
  const expectedProfitAtTakeProfit = riskAmount * RISK_RULES.TAKE_PROFIT_RATIO;
  const balanceAfterStopLoss = accountBalance - riskAmount;
  const balanceAfterTakeProfit = accountBalance + expectedProfitAtTakeProfit;

  return {
    mode: profileMode,
    riskPercent,
    riskAmount,
    lotSize,
    fixedRiskPercent: RISK_RULES.FIXED_RISK_PERCENT,
    aggressiveRiskPercent: RISK_RULES.AGGRESSIVE_RISK_PERCENT,
    takeProfitPips,
    breakevenTriggerPips,
    estimatedPips: estimatedPipCount,
    stopLossPips: stopDistance,
    expectedProfitAtTakeProfit,
    balanceAfterStopLoss,
    balanceAfterTakeProfit,
    rules: {
      ...RISK_RULES
    }
  };
}

function calculateRiskTrade({
  balance = 0,
  stopLossPips = 0,
  estimatedPips = 0,
  pipValuePerLot = RISK_RULES.PIP_VALUE_PER_LOT,
  mode = 'auto'
} = {}) {
  return calculateRiskProfile({
    balance,
    estimatedPips,
    stopLossPips,
    pipValuePerLot,
    mode
  });
}

module.exports = {
  RISK_RULES,
  calculateCurveRiskPercent,
  calculateRiskProfile,
  calculateRiskTrade
};

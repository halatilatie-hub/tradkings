const { calculateRiskProfile } = require('../services/riskService');

async function evaluate(req, res) {
  try {
    const {
      balance = 250,
      estimatedPips = 400,
      stopLossPips = 50,
      pipValuePerLot = 170,
      mode = 'auto'
    } = req.body || {};

    const riskProfile = calculateRiskProfile({
      balance,
      estimatedPips,
      stopLossPips,
      pipValuePerLot,
      mode
    });

    res.json({
      success: true,
      data: riskProfile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

module.exports = { evaluate };

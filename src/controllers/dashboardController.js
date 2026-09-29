const { getDashboardSummary } = require('../services/backtestService');

async function getDashboard(req, res) {
  try {
    const summary = await getDashboardSummary();
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { getDashboard };

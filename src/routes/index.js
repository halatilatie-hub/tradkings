const express = require('express');
const marketRoutes = require('./marketRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const backtestRoutes = require('./backtestRoutes');
const signalRoutes = require('./signalRoutes');
const riskRoutes = require('./riskRoutes');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Tradkings SMC Bot API is healthy'
  });
});

router.use('/market', marketRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/backtest', backtestRoutes);
router.use('/signal', signalRoutes);
router.use('/risk', riskRoutes);

module.exports = router;

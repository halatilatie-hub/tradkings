const express = require('express');
const { getSymbols, getOverview, getCandles } = require('../controllers/marketController');

const router = express.Router();

router.get('/symbols', getSymbols);
router.get('/overview', getOverview);
router.get('/candles', getCandles);

module.exports = router;

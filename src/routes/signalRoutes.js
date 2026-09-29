const express = require('express');
const { analyzeSignal } = require('../controllers/signalController');

const router = express.Router();

router.post('/analyze', analyzeSignal);

module.exports = router;

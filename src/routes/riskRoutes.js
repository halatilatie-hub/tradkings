const express = require('express');
const { evaluate } = require('../controllers/riskController');

const router = express.Router();

router.post('/evaluate', evaluate);

module.exports = router;

const express = require('express');
const { run } = require('../controllers/backtestController');

const router = express.Router();

router.post('/run', run);

module.exports = router;

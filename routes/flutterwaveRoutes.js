const express = require('express');
const router = express.Router();
const { initiatePayment, verifyPayment } = require('../controllers/flutterwaveController');

router.post('/initiate', initiatePayment);
router.post('/verify', verifyPayment);

module.exports = router;
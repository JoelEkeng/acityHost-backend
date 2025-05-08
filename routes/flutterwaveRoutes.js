const express = require('express');
const router = express.Router();
const {
  verifyWebhook,
  handleWebhook,
  generatePaymentLink
} = require('../controllers/flutterwaveController');

// Webhook endpoint (must be POST)
router.post('/webhook', verifyWebhook, handleWebhook);

// Payment link generation
router.post('/generate-link', generatePaymentLink);

module.exports = router;
// routes/paymentRoutes.js
const express = require('express')
const router = express.Router()
const paystackController = require('../controllers/paystackController')
const paymentController = require('../controllers/paymentController')

// Paystack webhook endpoint
router.post(
  '/paystack/webhook',
  express.json({ type: 'application/json' }),
  paystackController.handlePaystackWebhook
)

// Verify payment endpoint (for client-side verification if needed)
router.get('/paystack/verify/:reference', paystackController.verifyPaystackPayment)
router.post('/payments/verify', paymentController.verifyPayment);


module.exports = router
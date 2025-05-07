// routes/payments.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/verify-payment', async (req, res) => {
  const { reference } = req.body;

  try {
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const paymentData = response.data.data;

    if (paymentData.status === 'success') {
      const newPayment = new Payment({
        userId: paymentData.metadata?.userId, // This depends on your Paystack `metadata`
        amount: paymentData.amount,
        reference: paymentData.reference,
        status: paymentData.status,
        paidAt: paymentData.paid_at,
        channel: paymentData.channel,
        currency: paymentData.currency,
      });

      await newPayment.save();
      return res.status(200).json({ success: true, message: 'Payment verified and saved', payment: newPayment });
    } else {
      return res.status(400).json({ success: false, message: 'Transaction not successful' });
    }
  } catch (err) {
    console.error('Verification error:', err.message);
    return res.status(500).json({ success: false, message: 'Payment verification failed', error: err.message });
  }
});

module.exports = router;

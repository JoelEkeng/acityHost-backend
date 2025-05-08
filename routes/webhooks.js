const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const crypto = require('crypto');

router.post('/paystack', express.raw({ type: 'application/json' }), async (req, res) => {
  const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
                     .update(req.body)
                     .digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    return res.status(400).send('Invalid signature');
  }

  const event = JSON.parse(req.body.toString());
  if (event.event === 'charge.success') {
    const metadata = event.data.metadata.custom_fields;
    const bookingId = metadata.find(f => f.variable_name === 'booking_id')?.value;

    if (bookingId) {
      await Booking.findByIdAndUpdate(bookingId, {
        status: 'confirmed',
        'payment.paid': true,
        'payment.transactionId': event.data.reference
      });
    }
  }

  res.sendStatus(200);
});

module.exports = router;

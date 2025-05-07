// routes/payments.js
const express = require('express');
const axios = require('axios');
const router = express.Router();
const Booking = require('../models/Booking'); // Assuming Booking is your room booking model

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
      // Create payment record
      const newPayment = new Payment({
        userId: paymentData.metadata?.userId,
        amount: paymentData.amount,
        reference: paymentData.reference,
        status: paymentData.status,
        paidAt: paymentData.paid_at,
        channel: paymentData.channel,
        currency: paymentData.currency,
      });

      await newPayment.save();

      // Step 2: Book the room
      const bookingData = {
        userId: paymentData.metadata?.userId,
        roomId: paymentData.metadata?.roomId,  // Assuming you store roomId in metadata
        bookingDate: new Date(),
        startTime: new Date(),
        endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        payment: {
          amount: paymentData.amount,
          method: 'Paystack',
          transactionId: paymentData.reference,
          paid: true,
        },
      };

      // Assuming you have a Booking model to handle room booking
      const booking = new Booking(bookingData);
      await booking.save();

      // Optionally, mark room as "booked" if you have a room status field
      await Room.updateOne({ _id: bookingData.roomId }, { $set: { status: 'booked' } });

      return res.status(200).json({ success: true, message: 'Payment verified, room booked', payment: newPayment, booking });
    } else {
      return res.status(400).json({ success: false, message: 'Transaction not successful' });
    }
  } catch (err) {
    console.error('Verification error:', err.message);
    return res.status(500).json({ success: false, message: 'Payment verification failed', error: err.message });
  }
});

router.post('/initiate-payment', async (req, res) => {
  const { email, amount, metadata } = req.body;

  try {
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: amount * 100, 
        metadata,
        callback_url: 'http://localhost:3000/booking/payment-success',
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Paystack init response:', response.data);

    res.status(200).json({ url: response.data.data.authorization_url });
  } catch (error) {
    console.error('Error initializing payment:', error);
    res.status(500).json({ message: 'Payment initiation failed' });
  }
});

module.exports = router;

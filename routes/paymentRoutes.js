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
        amount: amount * 100, // GHS to pesewas
        metadata,
        callback_url: 'https://yourdomain.com/payment-success',
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.status(200).json({ url: response.data.data.authorization_url });
  } catch (error) {
    console.error('Error initializing payment:', error);
    res.status(500).json({ message: 'Payment initiation failed' });
  }
});

router.post('/verifyPayment', async (req, res) => {
  const { reference } = req.body;

  try {
    // Step 1: Verify payment with Paystack
    const verifyResponse = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    const paymentData = verifyResponse.data.data;

    if (paymentData.status !== 'success') {
      return res.status(400).json({ success: false, message: 'Transaction not successful' });
    }

    // Step 2: Extract metadata
    const metadata = paymentData.metadata;
    const { userId, roomId, bedPosition } = metadata;

    // Step 3: Get user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Optionally validate room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Step 4: Prepare booking data
    const bookingData = {
      rollNumber: user.rollNumber,
      roomId: roomId,
      bedPosition: room.roomType === 'Double' ? bedPosition : undefined,
      bookingDate: new Date(),
      startTime: new Date(),
      endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      payment: {
        amount: paymentData.amount / 100, // Convert from pesewas to GHS
        method: paymentData.channel,
        transactionId: reference,
        paid: true
      }
    };

    res.status(200).json({
      success: true,
      bookingData
    });

  } catch (err) {
    console.error('Payment verification error:', err.message);
    res.status(500).json({ success: false, message: 'Server error verifying payment' });
  }
});

module.exports = router;

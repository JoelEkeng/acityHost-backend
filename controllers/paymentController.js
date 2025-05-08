// paymentsController.js
const axios = require('axios');
const Booking = require('../models/Booking');
const Room = require('../models/Room');

exports.verifyPayment = async (req, res) => {
  try {
    const { reference, bookingId, amount, email } = req.body;

    // 1. Validate input
    if (!reference || !bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Reference and booking ID are required'
      });
    }

    // 2. Verify with Paystack
    const paystackResponse = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    const paystackData = paystackResponse.data.data;

    // 3. Validate payment details
    if (
      paystackResponse.data.status !== true ||
      paystackData.status !== 'success' ||
      paystackData.amount !== amount * 100 ||
      paystackData.customer.email !== email
    ) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        details: {
          status: paystackData.status,
          amountPaid: paystackData.amount,
          expectedAmount: amount * 100,
          emailMatch: paystackData.customer.email === email
        }
      });
    }

    // 4. Update booking
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        status: 'confirmed',
        'payment.paid': true,
        'payment.transactionId': reference,
        'payment.paymentDate': new Date()
      },
      { new: true }
    ).populate('roomId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // 5. Update room occupancy
    if (booking.roomId) {
      const updateField = booking.roomId.roomType === 'Double' 
        ? `currentOccupants.${booking.bedPosition.toLowerCase()}`
        : 'currentOccupants.top';

      await Room.findByIdAndUpdate(
        booking.roomId._id,
        {
          $set: {
            [updateField]: booking.rollNumber
          }
        }
      );
    }

    res.json({
      success: true,
      message: 'Payment verified and booking confirmed',
      booking
    });

  } catch (error) {
    console.error('Payment Verification Error:', {
      error: error.response?.data || error.message,
      request: req.body,
      timestamp: new Date()
    });

    res.status(500).json({
      success: false,
      message: 'Internal server error during verification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
const Flutterwave = require('flutterwave-node-v3');
const Booking = require('../models/Booking');
const crypto = require('crypto');

// Initialize Flutterwave
const flw = new Flutterwave(
  process.env.FLW_PUBLIC_KEY,
  process.env.FLW_SECRET_KEY
);

// Webhook verification middleware
exports.verifyWebhook = (req, res, next) => {
  try {
    const secretHash = process.env.FLW_WEBHOOK_SECRET;
    const signature = req.headers['verif-hash'];
    
    if (!signature || signature !== secretHash) {
      return res.status(401).json({ error: 'Unauthorized webhook call' });
    }
    
    next();
  } catch (err) {
    console.error('Webhook verification error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// Webhook handler
exports.handleWebhook = async (req, res) => {
  try {
    const payload = req.body;
    
    // Verify the event is a payment completion
    if (payload.event === 'charge.completed' && payload.data.status === 'successful') {
      const transactionId = payload.data.tx_ref;
      
      // Verify the transaction with Flutterwave
      const verification = await flw.Transaction.verify({ id: payload.data.id });
      
      if (verification.status !== 'successful') {
        throw new Error('Transaction verification failed');
      }
      
      // Update the booking status
      const updatedBooking = await Booking.findOneAndUpdate(
        { 'payment.transactionId': transactionId },
        {
          status: 'confirmed',
          'payment.paid': true,
          'payment.verifiedAt': new Date(),
          'payment.method': 'Momo' // Map to your schema
        },
        { new: true }
      );
      
      if (!updatedBooking) {
        throw new Error('Booking not found for transaction');
      }
      
      console.log('Booking confirmed:', updatedBooking._id);
    }
    
    res.status(200).send('Webhook processed');
  } catch (err) {
    console.error('Webhook processing error:', {
      error: err.message,
      payload: req.body
    });
    res.status(400).json({ error: 'Webhook processing failed' });
  }
};

// Generate payment link (alternative to direct initiation)
exports.generatePaymentLink = async (req, res) => {
  try {
    const { amount, email, name, bookingId } = req.body;
    
    const payload = {
      tx_ref: `BOOKING-${bookingId}-${Date.now()}`,
      amount: parseFloat(amount),
      currency: 'GHS',
      payment_options: 'card,mobilemoney,ussd',
      redirect_url: `${process.env.FRONTEND_URL}/booking/confirmation`,
      customer: {
        email,
        name,
      },
      customizations: {
        title: 'Hostel Booking Payment',
        description: `Payment for booking ${bookingId}`,
      },
      meta: {
        bookingId
      }
    };
    
    const response = await flw.PaymentLink.create(payload);
    
    res.json({
      success: true,
      paymentLink: response.data.link
    });
  } catch (err) {
    console.error('Payment link generation error:', err);
    res.status(500).json({ 
      error: 'Payment link generation failed',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
const flutterwave = require('flutterwave-node-v3');
// Initialize Flutterwave with proper error handling
let flw;
try {
  flw = new flutterwave(
    process.env.FLW_PUBLIC_KEY, 
    process.env.FLW_SECRET_KEY
  );
} catch (err) {
  console.error('Flutterwave initialization failed:', err);
  throw new Error('Payment system configuration error');
}
const Booking = require('../models/Booking');
exports.initiatePayment = async (req, res) => {
    try {
      // Validate required fields
      const { amount, email, fullName, metadata } = req.body;
      
      if (!amount || !email || !fullName) {
        return res.status(400).json({
          success: false,
          message: 'Amount, email and name are required'
        });
      }
  
      // Create payload
      const payload = {
        tx_ref: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        amount: parseFloat(amount),
        currency: 'GHS', // Using Ghanaian Cedi
        payment_options: 'card,mobilemoney,ussd',
        redirect_url: process.env.FLW_CALLBACK_URL || 'https://yourdomain.com/payment-callback',
        customer: {
          email,
          phonenumber: metadata?.phone || '',
          fullName
        },
        customizations: {
          title: 'Hostel Booking Payment',
          description: 'Payment for room reservation',
          logo: 'https://yourdomain.com/logo.png'
        },
        meta: metadata || {}
      };
  
      // Initiate payment
      const response = await flw.Payment.initiate(payload);
      
      if (!response || response.status !== 'success') {
        throw new Error(response?.message || 'Failed to initiate payment');
      }
  
      res.json({
        success: true,
        data: response.data
      });
  
    } catch (err) {
      console.error('Payment Initiation Error:', {
        error: err.message,
        stack: err.stack,
        body: req.body
      });
      
      res.status(500).json({
        success: false,
        message: 'Payment initiation failed',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  };
exports.verifyPayment = async (req, res) => {
    try {
      const response = await flw.Transaction.verify({ id: req.body.transaction_id });
      
      if (response.status === 'successful') {
        await Booking.findOneAndUpdate(
          { 'payment.transactionId': req.body.transaction_id },
          { 
            status: 'confirmed',
            'payment.paid': true,
            'payment.verifiedAt': new Date(),
            'payment.method': 'Momo' // Ensure it matches schema
          }
        );
      }
      
      res.json({ 
        paid: response.status === 'successful',
        transaction: response 
      });
    } catch (err) {
      console.error('Verification error:', err);
      res.status(500).json({ 
        error: err.message,
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  };
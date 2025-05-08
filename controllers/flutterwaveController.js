const flutterwave = require('flutterwave-node-v3');
const flw = new flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);
const Booking = require('../models/Booking');
exports.initiatePayment = async (req, res) => {
    try {
      // Get user email and name from request body instead of req.user
      const { email, name } = req.body;
  
      if (!email || !name) {
        return res.status(400).json({ error: 'Customer email and name are required' });
      }
  
      const payload = {
        tx_ref: `TXN-${Date.now()}`,
        amount: req.body.amount,
        currency: 'GHS',
        payment_options: 'card,mobilemoney',
        redirect_url: `${process.env.FRONTEND_URL}/verify-payment`,
        meta: { ...req.body.metadata },
        customer: { 
          email: email,
          name: name 
        },
      };
  
      const response = await flw.Payment.initiate(payload);
      res.json(response);
    } catch (err) {
      console.error('Flutterwave initiation error:', err);
      res.status(500).json({ 
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
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
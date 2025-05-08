const flutterwave = require('flutterwave-node-v3');
const flw = new flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);

exports.initiatePayment = async (req, res) => {
  try {
    const payload = {
      tx_ref: `TXN-${Date.now()}`,
      amount: req.body.amount,
      currency: 'USD',
      payment_options: 'card,mobilemoney',
      redirect_url: `${process.env.FRONTEND_URL}/verify-payment`,
      meta: { ...req.body.metadata },
      customer: { email: req.user.email, name: req.user.name },
    };
    const response = await flw.Payment.initiate(payload);
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const response = await flw.Transaction.verify({ id: req.body.transaction_id });
    res.json({ paid: response.status === 'successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  amount: Number,
  reference: String,
  status: String,
  paidAt: Date,
  channel: String,
  currency: String,
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);
const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    method: { type: String, enum: ['Credit Card', 'Debit Card', 'PayPal'], required: true },
    status: { type: String, enum: ['Paid', 'Pending', 'Failed'], default: 'Pending' },
}, {
    timestamps: true
});

PaymentSchema.virtual('id').get(function() {
    return this._id.toHexString();
});

// Ensure virtual fields are serialized
PaymentSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

const Payment = mongoose.model('Payment', PaymentSchema);
module.exports = Payment;
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BookingSchema = new Schema({
  bookingDate: { type: Date, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  rollNumber: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  bedPosition: { type: String, enum: ['Top', 'Bottom'], required: function() {
    return this.roomType === 'Double';
  }},
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  payment: {
    amount: { type: Number, required: true },
    method: { type: String, enum: ['Bank Transfer', 'Momo'], required: true },
    transactionId: { type: String }, 
    paid: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

BookingSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

BookingSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Booking', BookingSchema);

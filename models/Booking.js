const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    bookingDate: { type: Date, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
}, {
    timestamps: true
});

BookingSchema.virtual('id').get(function() {
    return this._id.toHexString();
});

// Ensure virtual fields are serialized
BookingSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

const Booking = mongoose.model('Booking', BookingSchema);
module.exports = Booking;
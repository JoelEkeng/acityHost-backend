const mongoose = require('mongoose');
const { Schema } = mongoose;

const wings = ["Left", "Right"];
const floors = ["A", "B", "C", "D"];
const roomTypes = ["Single", "Double"];
const roomFacilities = ["Fan", "AC"];
const status = ["Available", "Booked", "Under Maintenance"];

const roomSchema = new Schema({
    roomId: { type: String, unique: true },
    roomNumber: { type: String, required: true },
    wing: { type: String, enum: wings, required: true },
    floor: { type: String, enum: floors, required: true },
    roomType: { type: String, enum: roomTypes, required: true },
    roomFacilities: { type: String, enum: roomFacilities, required: true },
    status: { type: String, enum: status, default: "Available" },
    currentOccupant: { type: Schema.Types.ObjectId, ref: 'User' },
    building: { type: String, required: true },
    bookings: [{ type: Schema.Types.ObjectId, ref: 'Booking' }],
}, {
  timestamps: true,
});

// Auto-generate roomId before saving
roomSchema.pre('save', function (next) {
    if (!this.roomId) {
        this.roomId = `${this.floor}${this.roomNumber}-${this.wing}`;
    }
    next();
});

// Virtual and transformation
roomSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

roomSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Room', roomSchema);

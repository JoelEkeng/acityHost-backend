const mongoose = require('mongoose');
const { Schema } = mongoose;
const crypto = require('crypto');

const hostelSchema = new Schema({
  hostelId: {
    type: String,
    default: () => crypto.randomBytes(6).toString('hex'),
    unique: true,
  },
  name: { type: String, required: true, unique: true },
  location: { type: String, required: true },
  rules: { type: String, default: '' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  numberOfFloors: { type: Number, required: true },
}, {
  timestamps: true
});

hostelSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

hostelSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Hostel', hostelSchema);
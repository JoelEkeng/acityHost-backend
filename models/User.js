const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  studentId: { type: String },
  gender: { type: String, enum: ['male', 'female'], required: false },
  rollNumber: { type: String, unique: true, sparse: true }, 

  parentName: { type: String }, 
  parentPhone: { type: String }, 

  healthConditions: { type: String }, 
  allergies: { type: String }, 
  emergencyContact: { type: String }, 

  roomNumber: { type: String },
  MaintenanceTicket: [{ type: Schema.Types.ObjectId, ref: 'MaintenanceTicket' }],
  maintenanceLogs: [{ type: Schema.Types.ObjectId, ref: 'MaintenanceTicket' }],
  paymentHistory: [{ type: Schema.Types.ObjectId, ref: 'Payment' }],
  registrationDate: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now },

  currentBooking: {
    type: Schema.Types.ObjectId,
    ref: 'Booking'
  },
  previousBookings: [{
    type: Schema.Types.ObjectId,
    ref: 'Booking'
  }],

  role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, {
  timestamps: true 
});

UserSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

UserSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Hash password
UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

UserSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

UserSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET);
  return token;
};

UserSchema.statics.verifyAuthToken = function (token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new Error('Invalid token');
  }
};

UserSchema.statics.checkUserRole = function (user, role) {
  if (!user || user.role !== role) {
    throw new Error('Unauthorized');
  }
};

const User = mongoose.model('User', UserSchema);
module.exports = User;

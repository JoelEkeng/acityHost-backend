const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    fullName: { type: String, required: true},
    email: { type: String, required: true, unique: true},
    studentId: { type: String, required: true },
    roomNumber: { type: String, required: true},
    MaintenanceTicket: [{ type: Schema.Types.ObjectId, ref: 'MaintenanceTicket' }],
    maintenanceLogs: [{ type: Schema.Types.ObjectId, ref: 'MaintenanceLog' }],
    paymentHistory: [{ type: Schema.Types.ObjectId, ref: 'Payment' }],
    registrationDate: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now },
    role: { type: String, default: 'user'}}, {
    timestamps: true 
});

UserSchema.virtual('id').get(function() {
    return this._id.toHexString();
});
// Ensure virtual fields are serialized
UserSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

// Middleware to hash password before saving
UserSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});


const User = mongoose.model('User', UserSchema);
module.exports = User;

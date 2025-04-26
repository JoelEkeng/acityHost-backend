const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    fullName: { type: String, required: true},
    email: { type: String, required: true, unique: true},
    password: { type: String, required: true},
    studentId: { type: String, required: false },
    roomNumber: { type: String, required: false},
    MaintenanceTicket: [{ type: Schema.Types.ObjectId, ref: 'MaintenanceTicket' }],
    maintenanceLogs: [{ type: Schema.Types.ObjectId, ref: 'MaintenanceTicket' }],
    paymentHistory: [{ type: Schema.Types.ObjectId, ref: 'Payment' }],
    registrationDate: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now },
    role: { type: String, enum: ['user', 'admin'], default: 'user'}}, {
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

// Middleware to compare password
UserSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

// Middleware to generate JWT token
UserSchema.methods.generateAuthToken = function() {
    const token = jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return token;
};

// Middleware to verify JWT token
UserSchema.statics.verifyAuthToken = function(token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    } catch (error) {
        throw new Error('Invalid token');
    }
};

// Middleware to check user role
UserSchema.statics.checkUserRole = function(user, role) {
    if (!user || user.role !== role) {
        throw new Error('Unauthorized');
    }
};

const User = mongoose.model('User', UserSchema);
module.exports = User;

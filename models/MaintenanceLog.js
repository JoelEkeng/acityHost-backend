const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MaintenanceLogSchema = new Schema({
    title: { type: String, required: true, trim: true},
    description: { type: String, required: true},
    category: { type: String, required: true},
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low'},
    status: { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Escalated'], default: 'Open'},
    imageUrl: { type: String, default: ''},
    assignedTo: { type: String, default: ''},
    user: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true 
});


MaintenanceLogSchema.virtual('id').get(function() {
    return this._id.toHexString();
});

// Ensure virtual fields are serialized
MaintenanceLogSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

const MaintenanceLog = mongoose.model('MaintenanceLog', MaintenanceLogSchema);
module.exports = MaintenanceLog;
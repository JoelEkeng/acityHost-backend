const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MaintenanceTicketSchema = new Schema({
  studentId: { type: String, required: false },
  roomNumber: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
  status: { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Escalated'], default: 'Open' },
  imageUrl: { type: String, default: '' },
  assignedTo: { type: String, default: '' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

MaintenanceTicketSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

MaintenanceTicketSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('MaintenanceTicket', MaintenanceTicketSchema);

const mongoose = require('mongoose');

const ticketStatus = ['Open', 'In Progress', 'Resolved', 'Escalated'];
const ticketPriority = ['Low', 'Medium', 'High'];

const MaintenanceTicketSchema = new mongoose.Schema({
  studentId: { type: String, required: true},
  roomNumber: { type: String, required: true},
  title: { type: String, required: true, trim: true},
  description: { type: String, required: true},
  category: { type: String, required: true},
  priority: { type: String, enum: ticketPriority, default: 'Low'},
  status: { type: String, enum: ticketStatus, default: 'Open'},
  imageUrl: { type: String, default: ''},
  assignedTo: { type: String, default: ''}
}, {
  timestamps: true 
});

MaintenanceTicketSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Ensure virtual fields are serialized
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
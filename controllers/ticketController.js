const MaintenanceTicket = require('../models/MaintenanceTicket');
const User = require('../models/User');

exports.getTickets = async (req, res) => {
  try {
    const tickets = await MaintenanceTicket.find();
    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createTicket = async (req, res) => {
  try {
    const newTicket = new MaintenanceTicket({ ...req.body, createdBy: req.user.id });
    const savedTicket = await newTicket.save();
    await User.findByIdAndUpdate(
      req.user.id,
      { $push: { maintenanceLogs: savedTicket._id } },
      { new: true }
    );
    res.status(201).json(savedTicket);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTicketById = async (req, res) => {
  try {
    const ticket = await MaintenanceTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateTicket = async (req, res) => {
  try {
    const ticket = await MaintenanceTicket.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH method is used to update a resource partially
exports.patchTicket = async (req, res) => {
  try {
    const ticket = await MaintenanceTicket.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    if (req.body.status) {
      await User.findByIdAndUpdate(
        ticket.createdBy,
        { $push: { maintenanceLogs: ticket._id } },
        { new: true }
      );
    }
    if (req.body.priority) {
      await User.findByIdAndUpdate(
        ticket.createdBy,
        { $push: { priorityLogs: ticket._id } },
        { new: true }
      );
    }
    if (req.body.assignedTo) {
        req.body.assignedTo,
        { $push: { assignedTickets: ticket._id } },
        { new: true }
    }
     res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
    console.error(error);
  }
};

exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await MaintenanceTicket.findByIdAndDelete(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    res.status(200).json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

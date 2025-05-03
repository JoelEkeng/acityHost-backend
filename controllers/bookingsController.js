const User = require('../models/User');
const Booking = require('../models/Booking');
const Room = require('../models/Room');

exports.createBooking = async (req, res) => {
  try {
    const {
      rollNumber, 
      roomId,
      bookingDate,
      startTime,
      endTime,
      bedPosition,
      payment
    } = req.body;

    if (!roomId) {
      return res.status(400).json({ message: 'roomId is required' });
    }

    const user = await User.findOne({ rollNumber });
    if (!user) {
      return res.status(404).json({ message: 'User not found with that roll number' });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: `Room ${roomId} not found` });
    }

    const booking = new Booking({
      rollNumber: user._id,
      roomId: room._id,
      bookingDate,
      startTime,
      endTime,
      bedPosition,
      payment
    });

    await booking.save();

    user.currentBooking = booking._id;
    user.previousBookings.push(booking._id);
    await user.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('roomId', 'roomNumber floor wing roomType roomFacilities')
      .populate('rollNumber', 'name email rollNumber');

    res.status(201).json(booking);
  } catch (err) {
    console.error('Error creating booking:', err);
    res.status(500).json({ message: 'Server error creating booking' });
  }
};
exports.getAllBookings = async (req, res) => {
    try {
        const bookingsList = await bookings.find();
        res.json(bookingsList);
    } catch (err) { 
        res.status(500).json({ message: 'Server error fetching bookings' });
    }
}

exports.getBookingById = async (req, res) => {
    try {
        const booking = await bookings.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        res.json(booking);
    } catch (err) {
        res.status(500).json({ message: 'Server error fetching booking' });
    }
}
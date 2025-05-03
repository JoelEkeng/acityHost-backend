const User = require('../models/User');
const Booking = require('../models/Booking');

exports.createBooking = async (req, res) => {
  try {
    const {
      rollNumber, // this is the string like "10211100294"
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

    const booking = new Booking({
      rollNumber: user._id,
      roomId,
      bookingDate,
      startTime,
      endTime,
      bedPosition,
      payment
    });

    await booking.save();

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
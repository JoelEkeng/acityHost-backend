const bookings = require('../models/Booking');

exports.createBooking = async (req, res) => {
    try {
        const booking = new bookings(req.body);
        const savedBooking = await booking.save();
        res.status(201).json(savedBooking);
    } catch (err) {
        console.error('Error creating booking:', err);
        res.status(500).json({ message: 'Server error creating booking' });
    }
    }
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
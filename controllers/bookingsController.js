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

    if (room.roomType === 'Double') {
      if (!bedPosition) {
        return res.status(400).json({ message: 'Bed position required for double rooms' });
      }

    // Check specific bed availability
    if (bedPosition === 'Top' && !room.beds.top) {
      return res.status(400).json({ message: 'Top bed already booked' });
      }
      if (bedPosition === 'Bottom' && !room.beds.bottom) {
        return res.status(400).json({ message: 'Bottom bed already booked' });
      }
    } 
    // For single rooms
    else if (!room.beds.top) { // Using top bed to represent single room availability
      return res.status(400).json({ message: 'Room already booked' });
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

    // Update room with current occupant and bed status
    const updateData = {
      currentOccupant: user._id
    };

    if (room.roomType === 'Double') {
      updateData[`beds.${bedPosition.toLowerCase()}`] = false;
    } else {
      updateData['beds.top'] = false;
    }

    await Room.findByIdAndUpdate(roomId, {
      $set: updateData
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('roomId', 'roomNumber floor wing roomType roomFacilities')
      .populate('rollNumber', 'name email rollNumber');

    res.status(201).json(populatedBooking);
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
// const User = require('../models/User');
// const Booking = require('../models/Booking');
// const Room = require('../models/Room');

// exports.createBooking = async (req, res) => {
//   try {
//     const {
//       rollNumber, 
//       roomId,
//       bookingDate,
//       startTime,
//       endTime,
//       bedPosition,
//       payment
//     } = req.body;

//     if (!roomId) {
//       return res.status(400).json({ message: 'roomId is required' });
//     }


//     const user = await User.findOne({ rollNumber });
//     if (!user) {
//       return res.status(404).json({ message: 'User not found with that roll number' });
//     }

//     const room = await Room.findById(roomId);
//     if (!room) {
//       return res.status(404).json({ message: `Room ${roomId} not found` });
//     }

//     if (room.roomType === 'Double') {
//       if (!bedPosition) {
//         return res.status(400).json({ message: 'Bed position required for double rooms' });
//       }

//     // Check specific bed availability
//     if (bedPosition === 'Top' && !room.beds.top) {
//       return res.status(400).json({ message: 'Top bed already booked' });
//       }
//       if (bedPosition === 'Bottom' && !room.beds.bottom) {
//         return res.status(400).json({ message: 'Bottom bed already booked' });
//       }
//     } 
//     // For single rooms
//     else if (!room.beds.top) { // Using top bed to represent single room availability
//       return res.status(400).json({ message: 'Room already booked' });
//     }  

//     const booking = new Booking({
//       rollNumber: user._id,
//       roomId: room._id,
//       bookingDate,
//       startTime,
//       endTime,
//       bedPosition,
//       payment
//     });

//     await booking.save();

//   /*   user.currentBooking = booking._id;
//     user.previousBookings.push(booking._id);
//     await user.save(); */

//     // Update room with current occupant and bed status
//     const updateData = {
//       currentOccupant: user._id,
//       $push: { bookings: booking._id }
//     };

//     if (room.roomType === 'Double') {
//       updateData[`beds.${bedPosition.toLowerCase()}`] = false;
//     } else {
//       updateData['beds.top'] = false;
//     }

//     await Room.findByIdAndUpdate(roomId, {
//       $set: updateData
//     });

//     user.currentBooking = booking._id;
//     user.previousBookings.push(booking._id);
//     await user.save();

//     const populatedBooking = await Booking.findById(booking._id)
//       .populate('roomId', 'roomNumber floor wing roomType roomFacilities')
//       .populate('rollNumber', 'name email rollNumber');

//     res.status(201).json(populatedBooking);
//   } catch (err) {
//     console.error('Error creating booking:', err);
//     res.status(500).json({ message: 'Server error creating booking' });
//   }
// };

// exports.getAllBookings = async (req, res) => {
//     try {
//         const bookingsList = await bookings.find();
//         res.json(bookingsList);
//     } catch (err) { 
//         res.status(500).json({ message: 'Server error fetching bookings' });
//     }
// }

// exports.getBookingById = async (req, res) => {
//     try {
//         const booking = await bookings.findById(req.params.id);
//         if (!booking) return res.status(404).json({ message: 'Booking not found' });
//         res.json(booking);
//     } catch (err) {
//         res.status(500).json({ message: 'Server error fetching booking' });
//     }
// }


const Booking = require('../models/Booking');
const Room = require('../models/Room');
const User = require('../models/User');

exports.createBooking = async (req, res) => {
  try {
    // Destructure with default values
    const {
      rollNumber,
      roomId,
      bedPosition = null,
      payment = {},
      status = 'pending'
    } = req.body;

    // Validate required fields
    if (!rollNumber || !roomId || !payment.amount) {
      return res.status(400).json({
        success: false,
        message: 'rollNumber, roomId, and payment amount are required'
      });
    }

    // Find user and room
    const [user, room] = await Promise.all([
      User.findOne({ rollNumber }),
      Room.findById(roomId)
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with provided roll number'
      });
    }

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Validate bed position for double rooms
    if (room.roomType === 'Double' && !bedPosition) {
      return res.status(400).json({
        success: false,
        message: 'Bed position is required for double rooms'
      });
    }

    // Check bed availability
    if (room.roomType === 'Double') {
      const bedAvailable = room.beds[bedPosition.toLowerCase()];
      if (!bedAvailable) {
        return res.status(400).json({
          success: false,
          message: `${bedPosition} bed is already booked`
        });
      }
    } else if (!room.beds.top) { // For single rooms
      return res.status(400).json({
        success: false,
        message: 'Room is already booked'
      });
    }

    // Create dates
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + 30); // 30 days from now

    // Create booking
    const booking = new Booking({
      rollNumber: user._id,
      roomId: room._id,
      bookingDate: now,
      startTime: now,
      endTime: endDate,
      bedPosition: room.roomType === 'Double' ? bedPosition : undefined,
      status,
      payment: {
        ...payment,
        method: payment.method || 'Flutterwave',
        paid: payment.paid || false
      }
    });

    // Save booking in transaction
    const session = await Booking.startSession();
    session.startTransaction();

    try {
      const savedBooking = await booking.save({ session });

      // Update room
      const roomUpdate = {
        $push: { bookings: savedBooking._id },
        currentOccupant: user._id
      };

      if (room.roomType === 'Double') {
        roomUpdate[`beds.${bedPosition.toLowerCase()}`] = false;
      } else {
        roomUpdate['beds.top'] = false;
      }

      await Room.findByIdAndUpdate(roomId, roomUpdate, { session });

      // Update user
      await User.findByIdAndUpdate(
        user._id,
        {
          $set: { currentBooking: savedBooking._id },
          $push: { previousBookings: savedBooking._id }
        },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      // Populate and return booking
      const populatedBooking = await Booking.findById(savedBooking._id)
        .populate('roomId', 'roomNumber floor wing roomType roomFacilities')
        .populate('rollNumber', 'name email rollNumber');

      return res.status(201).json({
        success: true,
        data: populatedBooking
      });

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

  } catch (err) {
    console.error('Booking creation error:', {
      error: err.message,
      stack: err.stack,
      body: req.body
    });

    return res.status(500).json({
      success: false,
      message: 'Server error creating booking',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
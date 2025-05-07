const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Room = require('../models/Room');

// Get booking statistics
router.get('/booking-stats', async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const activeBookings = await Booking.countDocuments({ 
      endTime: { $gt: new Date() } 
    });
    
    const bookingsByRoomType = await Booking.aggregate([
      {
        $lookup: {
          from: 'rooms',
          localField: 'roomId',
          foreignField: '_id',
          as: 'room'
        }
      },
      { $unwind: '$room' },
      {
        $group: {
          _id: '$room.roomType',
          count: { $sum: 1 }
        }
      }
    ]);

    const monthlyBookings = await Booking.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$bookingDate' },
            month: { $month: '$bookingDate' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    // Revenue stats
    const revenueStats = await Booking.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$payment.amount' },
            avgBookingValue: { $avg: '$payment.amount' }
          }
        }
      ]);
  
      // Popular rooms
      const popularRooms = await Booking.aggregate([
        {
          $group: {
            _id: '$roomId',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'rooms',
            localField: '_id',
            foreignField: '_id',
            as: 'room'
          }
        },
        { $unwind: '$room' }
      ]);
  

    res.json({
      totalBookings,
      activeBookings,
      bookingsByRoomType,
      monthlyBookings,
      totalRevenue: revenueStats[0]?.totalRevenue || 0,
      avgBookingValue: revenueStats[0]?.avgBookingValue || 0,
      popularRooms
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const { createBooking, getAllBookings, getBookingById } = require('../controllers/bookingsController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/bookings', authenticate, createBooking);
router.get('/bookings', authenticate, getAllBookings);
router.get('/bookings/:id', authenticate, getBookingById);


module.exports = router;
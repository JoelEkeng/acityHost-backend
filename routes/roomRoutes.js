const express = require('express');
const router = express.Router();
const { createRoom, getRooms, createBulkRooms, updateRoomDetails,  getRoomAvailability } = require('../controllers/roomController');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/rooms', createRoom);
router.get('/rooms', getRooms);
router.post('/rooms/bulk', authenticate, authorizeRoles('admin'), createBulkRooms);
router.patch('/:roomId', authenticate, authorizeRoles('admin'), updateRoomDetails);
router.get('/rooms/availability', authenticate, getRoomAvailability);

module.exports = router;
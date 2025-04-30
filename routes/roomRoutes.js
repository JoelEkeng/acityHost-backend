const express = require('express');
const router = express.Router();
const { createRoom, getRooms, createBulkRooms, updateRoomDetails } = require('../controllers/roomController');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/room', createRoom);
router.get('/', getRooms);
router.post('/rooms/bulk', authenticate, authorizeRoles('admin'), createBulkRooms);
router.patch('/:roomId', authenticate, authorizeRoles('admin'), updateRoomDetails);

module.exports = router;
const express = require('express');
const router = express.Router();
const { createRoom, getRooms, createBulkRooms } = require('../controllers/roomController');

router.post('/room', createRoom);
router.get('/', getRooms);
router.post('/rooms/bulk', createBulkRooms);

module.exports = router;
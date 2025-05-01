const express = require('express');
const router = express.Router();
const hostelController = require('../controllers/hostelController');

router.post('/hostel', hostelController.createHostel);
router.get('/hostel', hostelController.getAllHostels);
router.get('/hostel/:id', hostelController.getHostelById);

module.exports = router;
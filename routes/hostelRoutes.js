const express = require('express');
const router = express.Router();
const hostelController = require('../controllers/hostelController');

router.post('/hostels', hostelController.createHostel);
router.get('/hostels', hostelController.getAllHostels);
router.get('/hostel/:id', hostelController.getHostelById);

module.exports = router;
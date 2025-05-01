const express = require('express');
const router = express.Router();
const { getMe, updateProfile } = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/me', authenticate, getMe);
router.patch('/user/profile', authenticate, updateProfile);


module.exports = router;

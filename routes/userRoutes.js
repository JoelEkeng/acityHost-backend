const express = require('express');
const router = express.Router();
const { getMe } = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/me', authenticate, getMe);

module.exports = router;

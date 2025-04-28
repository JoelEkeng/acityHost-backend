const express = require('express');
const router = express.Router();
const { getTickets, createTicket, getTicketById, updateTicket, patchTicket, deleteTicket } = require('../controllers/ticketController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/tickets', getTickets);
router.post('/tickets', authenticate, createTicket);
router.get('/tickets/:id', getTicketById);
router.put('/tickets/:id', updateTicket);
router.patch('/tickets/:id', patchTicket);
router.delete('/tickets/:id', deleteTicket);

module.exports = router;

const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const MaintenanceTicket = require('./models/MaintenanceTicket');

const app = express();
const port = process.env.PORT || 5000;

// Database connection
connectDB();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Ticket routes
app.route('/api/tickets')
  .get(async (req, res) => {
    try {
      const tickets = await MaintenanceTicket.find();
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  })
  .post(async (req, res) => {
    try {
      const newTicket = new MaintenanceTicket(req.body);
      await newTicket.save();
      res.status(201).json(newTicket);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

app.route('/api/tickets/:id')
  .get(async (req, res) => {
    try {
      const ticket = await MaintenanceTicket.findById(req.params.id);
      if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  })
  .put(async (req, res) => {
    try {
      const ticket = await MaintenanceTicket.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
      res.json(ticket);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  })
  .delete(async (req, res) => {
    try {
      const ticket = await MaintenanceTicket.findByIdAndDelete(req.params.id);
      if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
      res.json({ message: 'Ticket deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
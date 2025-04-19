const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const MaintenanceTicket = require('./models/MaintenanceTicket');
const User = require('./routes/userRoutes');

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
  res.send('Acity Protected Route!');
});

// User registration route
app.post('/api/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    const newUser = new User({ fullName, email, password });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User login route
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
    const token = user.generateAuthToken();
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Middleware to check authentication
app.use((req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  // Verify token logic here
  next();
});
// Middleware to check admin role
app.use((req, res, next) => {
  const userRole = req.user.role; // Assuming req.user is set after authentication
  if (userRole !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  next();
});
// Middleware to check user role
app.use((req, res, next) => {
  const userRole = req.user.role; // Assuming req.user is set after authentication
  if (userRole !== 'user') return res.status(403).json({ message: 'Forbidden' });
  next();
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
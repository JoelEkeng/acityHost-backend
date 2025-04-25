const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const MaintenanceTicket = require('./models/MaintenanceTicket');
const User = require('./models/User'); 

const app = express();
const port = process.env.PORT || 5000;

// Database connection
connectDB();

// Middleware
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// const authorize = (roles = []) => {
//   return (req, res, next) => {
//     if (!roles.includes(req.user.role)) {
//       return res.status(403).json({ message: 'Unauthorized access' });
//     }
//     next();
//   };
// };

// Routes
app.get('/', (req, res) => {
  res.send('Acity Hostel Management System API');
});

// User registration route
app.post('/api/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ fullName, email, password });
    await user.save();
    
    const token = user.generateAuthToken();

    
    res.status(201).json({ 
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      },
      token 
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
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
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = user.generateAuthToken();
    
      // Set cookie with secure options
      res.cookie('token', token, {
        httpOnly: true, // prevents JavaScript access to cookie
        secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
        sameSite: 'Lax', // adjust as needed ('Strict' or 'None' for cross-site)
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      });

    res.status(200).json({ 
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        roomNumber: user.roomNumber,
        maintenanceLogs: user.maintenanceLogs,
        paymentHistory: user.paymentHistory
      },
      token 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});


// Ticket routes with authentication
app.route('/api/tickets')
  .get(async (req, res) => {
    try {
      const tickets = await MaintenanceTicket.find();
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  })
  .post(async (req, res) => {
    try {
      const newTicket = new MaintenanceTicket({
        ...req.body,
        createdBy: req.user.id // Track who created the ticket
      });
      await newTicket.save();
      res.status(201).json(newTicket);
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error' });
    }
  });

app.route('/api/tickets/:id')
  .get(async (req, res) => {
    try {
      const ticket = await MaintenanceTicket.findById(req.params.id);
      if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
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
      if (error.name === 'ValidationError') {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error' });
    }
  })
  .delete(async (req, res) => {
    try {
      const ticket = await MaintenanceTicket.findByIdAndDelete(req.params.id);
      if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
      res.json({ message: 'Ticket deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // const authenticate = async (req, res, next) => {
    const authenticate = async (req, res, next) => {
      try {
        const token = req.cookies.token;
        if (!token) return res.status(401).json({ message: 'Not authenticated' });
    
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password'); // exclude password
    
        if (!user) return res.status(401).json({ message: 'User not found' });
    
        req.user = user;
        next();
      } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
      }
    };
    
    app.get('/api/me', authenticate, (req, res) => {
      res.status(200).json(req.user); // you can return more/less as needed
    });
    

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      message: 'Validation Error',
      errors: err.errors 
    });
  }
  
  if (err.name === 'MongoError' && err.code === 11000) {
    return res.status(400).json({ 
      message: 'Duplicate key error',
      field: Object.keys(err.keyPattern)[0]
    });
  }
  
  res.status(500).json({ 
    message: 'Something went wrong on the server' 
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
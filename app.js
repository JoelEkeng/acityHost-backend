const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const MaintenanceTicket = require('./models/MaintenanceTicket');
const User = require('./models/User'); 
const Payment = require('./models/Payment');
const MaintenanceLog = require('./models/MaintenanceLog');

const app = express();
const port = process.env.PORT || 5000;

// Database connection
connectDB();

// Middleware
const corsOptions = {
  origin: ["http://localhost:3000", "https://acity-hms.vercel.app"],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  exposedHeaders: ['set-cookie']
};


app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// const authenticate = async (req, res, next) => {
const authenticate = async (req, res, next) => {
      console.log('Incoming cookies:', req.cookies);
      console.log('Auth header:', req.headers.authorization);
    
      try {
        // 1. Check cookies first
        let token = req.cookies?.token;
        
        // 2. Fallback to Authorization header
        if (!token && req.headers.authorization?.startsWith('Bearer')) {
          token = req.headers.authorization.split(' ')[1];
          console.log('Using header token');
        }
    
        if (!token) {
          console.log('No token found in cookies or headers');
          return res.status(401).json({ message: 'Authentication required' });
        }
    
        // 3. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
          console.log('User not found for token');
          return res.status(401).json({ message: 'User not found' });
        }
    
        req.user = user;
        next();
      } catch (err) {
        console.error('Auth error:', err.message);
        
        // Specific error messages
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ message: 'Session expired' });
        }
        if (err.name === 'JsonWebTokenError') {
          return res.status(401).json({ message: 'Invalid token' });
        }
        
        res.status(401).json({ message: 'Authentication failed' });
      }
  };


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
        id: user.id,
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
      httpOnly: true, 
      secure: true,
      sameSite: 'none', 
      path: '/',
      maxAge: 60 * 60 // 1 day
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
  .post(authenticate, async (req, res) => {
    try {
      const newTicket = new MaintenanceTicket({
        ...req.body,
        createdBy: req.user.id 
      });
      const savedTicket = await newTicket.save();

      await User.findByIdAndUpdate(
        req.user.id,
        { $push: { maintenanceLogs: savedTicket._id } },
        { new: true }
      );

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
 
  app.get('/api/me', authenticate, async (req, res) => {
    try {
      const user = await User.findById(req.user.id)
        .select('-password')
        .populate('maintenanceLog'); 
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.status(200).json(user); 
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Server error' });
    }
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
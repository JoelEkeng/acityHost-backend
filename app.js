const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const connectDB = require('./db');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const hostelRoutes = require('./routes/hostelRoutes');
const roomRoutes = require('./routes/roomRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const stats = require('./routes/stats');
const flutterwaveRouter = require('./routes/flutterwaveRoutes');
const webhookRoutes = require('./routes/webhooks');

const app = express();
const port = process.env.PORT || 5000;

connectDB();

app.use(cors({
  origin: ["http://localhost:3000", "https://acity-hms.vercel.app"],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', ticketRoutes);
app.use('/api', hostelRoutes);
app.use('/api', roomRoutes);
app.use('/api', bookingRoutes);
app.use('/api', paymentRoutes);
app.use('/api/stats', stats)
app.use('/api/flutterwave', flutterwaveRouter);
app.use('/webhook', webhookRoutes);

app.get('/', (req, res) => {
  res.send('ACity Hostel Management System API is running.');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Server Error' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const connectDB = require('./db');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const ticketRoutes = require('./routes/ticketRoutes');

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

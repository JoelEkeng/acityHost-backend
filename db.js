const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://joelekeng23:3qfHXQtfO7HEUm6U@acityhost.qatjfvk.mongodb.net/?retryWrites=true&w=majority&appName=AcityHost', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('Database connection error:', err.message);
    process.exit(1); 
  }
};

module.exports = connectDB;
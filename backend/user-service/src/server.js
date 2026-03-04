require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/user_db';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('User Service: MongoDB connected');
    app.listen(PORT, () => {
      console.log(`User Service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('User Service: MongoDB connection error:', err.message);
    process.exit(1);
  });

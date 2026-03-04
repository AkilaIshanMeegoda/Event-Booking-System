require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 5002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/event_db';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Event Service: MongoDB connected');
    app.listen(PORT, () => console.log(`Event Service running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Event Service: MongoDB connection error:', err.message);
    process.exit(1);
  });
